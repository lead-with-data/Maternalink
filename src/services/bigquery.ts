import { BigQuery } from '@google-cloud/bigquery';
import fs from 'fs';
import path from 'path';

const projectId = process.env.GCP_PROJECT_ID;
const datasetId = process.env.GCP_DATASET_ID || 'maternalink_analytics';

// Support both physical credentials file and inline environment variables for serverless hosting
const credentialsJson = process.env.GCP_PRIVATE_KEY && process.env.GCP_CLIENT_EMAIL
  ? {
      client_email: process.env.GCP_CLIENT_EMAIL,
      private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }
  : undefined;

export const bigquery = new BigQuery({
  projectId: projectId,
  credentials: credentialsJson,
});

/**
 * Ensures the dataset and all core Fact and Dimension tables exist in Google BigQuery.
 * Creates them dynamically if they are missing.
 */
export async function initializeBigQueryDataset() {
  try {
    console.log(`[BigQuery] Verifying dataset: ${datasetId}...`);
    const dataset = bigquery.dataset(datasetId);
    const [datasetExists] = await dataset.exists();

    if (!datasetExists) {
      console.log(`[BigQuery] Dataset "${datasetId}" does not exist. Creating now...`);
      await bigquery.createDataset(datasetId, { location: 'US' });
      console.log(`[BigQuery] Dataset "${datasetId}" created successfully.`);
    }

    // 1. DimPatient Table
    await ensureTableExists('DimPatient', [
      { name: 'id', type: 'STRING', mode: 'REQUIRED' },
      { name: 'name', type: 'STRING', mode: 'NULLABLE' },
      { name: 'mobile', type: 'STRING', mode: 'NULLABLE' },
      { name: 'cnic', type: 'STRING', mode: 'NULLABLE' },
      { name: 'age', type: 'INTEGER', mode: 'NULLABLE' },
      { name: 'address', type: 'STRING', mode: 'NULLABLE' },
      { name: 'lhwId', type: 'STRING', mode: 'NULLABLE' },
      { name: 'createdAt', type: 'TIMESTAMP', mode: 'NULLABLE' },
    ]);

    // 2. DimPregnancy Table
    await ensureTableExists('DimPregnancy', [
      { name: 'id', type: 'STRING', mode: 'REQUIRED' },
      { name: 'patientId', type: 'STRING', mode: 'REQUIRED' },
      { name: 'startDate', type: 'DATE', mode: 'NULLABLE' },
      { name: 'expectedDueDate', type: 'DATE', mode: 'NULLABLE' },
      { name: 'parity', type: 'INTEGER', mode: 'NULLABLE' },
      { name: 'gravida', type: 'INTEGER', mode: 'NULLABLE' },
      { name: 'isActive', type: 'BOOLEAN', mode: 'NULLABLE' },
      { name: 'createdAt', type: 'TIMESTAMP', mode: 'NULLABLE' },
    ]);

    // 3. FactVisit Table
    await ensureTableExists('FactVisit', [
      { name: 'id', type: 'STRING', mode: 'REQUIRED' },
      { name: 'pregnancyId', type: 'STRING', mode: 'REQUIRED' },
      { name: 'patientId', type: 'STRING', mode: 'REQUIRED' },
      { name: 'visitDate', type: 'TIMESTAMP', mode: 'REQUIRED' },
      { name: 'gestationalWeeks', type: 'INTEGER', mode: 'NULLABLE' },
      { name: 'systolicBP', type: 'INTEGER', mode: 'NULLABLE' },
      { name: 'diastolicBP', type: 'INTEGER', mode: 'NULLABLE' },
      { name: 'hemoglobin', type: 'FLOAT', mode: 'NULLABLE' },
      { name: 'weight', type: 'FLOAT', mode: 'NULLABLE' },
      { name: 'fetalHeartRate', type: 'INTEGER', mode: 'NULLABLE' },
      { name: 'symptoms', type: 'STRING', mode: 'NULLABLE' }, // JSON string array
      { name: 'riskScore', type: 'INTEGER', mode: 'NULLABLE' },
      { name: 'riskCategory', type: 'STRING', mode: 'NULLABLE' },
      { name: 'medications', type: 'STRING', mode: 'NULLABLE' },
      { name: 'adviceUrdu', type: 'STRING', mode: 'NULLABLE' },
      { name: 'createdAt', type: 'TIMESTAMP', mode: 'NULLABLE' },
    ]);

    console.log('[BigQuery] All core Fact & Dimension schemas are verified and ready.');
  } catch (err) {
    console.error('[BigQuery] Dataset initialization failed:', err);
  }
}

/**
 * Checks if a table exists in the BigQuery dataset and creates it if not.
 * Automatically verifies schema fields and migrates any missing fields to support smooth schema evolution.
 */
async function ensureTableExists(tableName: string, schema: any[]) {
  const dataset = bigquery.dataset(datasetId);
  const table = dataset.table(tableName);
  const [exists] = await table.exists();

  if (!exists) {
    console.log(`[BigQuery] Table "${tableName}" is missing. Creating with schema...`);
    await dataset.createTable(tableName, { schema });
    console.log(`[BigQuery] Table "${tableName}" created successfully.`);
  } else {
    console.log(`[BigQuery] Table "${tableName}" verified. Inspecting for missing columns...`);
    try {
      const [metadata] = await table.getMetadata();
      const currentFields = metadata.schema?.fields || [];
      const currentFieldNames = currentFields.map((f: any) => f.name);

      const missingFields = schema.filter(f => !currentFieldNames.includes(f.name));
      if (missingFields.length > 0) {
        console.log(`[BigQuery] Table "${tableName}" exists but is missing fields:`, missingFields.map(f => f.name));
        const updatedFields = [...currentFields, ...missingFields];
        await table.setMetadata({
          schema: {
            fields: updatedFields
          }
        });
        console.log(`[BigQuery] Table "${tableName}" schema successfully updated with missing fields.`);
      }
    } catch (metaErr) {
      console.error(`[BigQuery] Failed to verify/update table "${tableName}" metadata:`, metaErr);
    }
  }
}

/**
 * Helper to upload data to BigQuery using free-tier Batch Load Jobs instead of paid Streaming Inserts.
 * Works natively in GCP sandbox accounts without requiring a billing account.
 */
async function loadDataIntoTable(tableName: string, rows: any[]) {
  if (rows.length === 0) return;

  const dataset = bigquery.dataset(datasetId);
  const table = dataset.table(tableName);

  // Convert rows to Newline-Delimited JSON (NDJSON) format
  const ndjson = rows.map(r => JSON.stringify(r)).join('\n') + '\n';

  // Save to a temporary local file to fulfill `@google-cloud/bigquery` local file load API
  const tempPath = path.resolve('c:/Users/MUHAMMAD AHMAD/Downloads/Maternalink', `temp_bq_load_${tableName}.json`);
  fs.writeFileSync(tempPath, ndjson, 'utf8');

  try {
    // Create a load job (fully supported on all free-tier and sandbox accounts)
    const [job] = await table.createLoadJob(tempPath, {
      sourceFormat: 'NEWLINE_DELIMITED_JSON',
      writeDisposition: 'WRITE_APPEND',
    });

    // Wait for the load job to complete
    await job.promise();
  } finally {
    // Safely cleanup the staged temporary file
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch (err) {
        console.warn(`[BigQuery] Could not delete temp file at ${tempPath}:`, err);
      }
    }
  }
}

/**
 * Streams active dimension records (Patient and Pregnancy) into BigQuery dataset tables.
 */
export async function streamDimensionToBigQuery(patient: any, pregnancy: any) {
  try {
    const pRow = {
      id: patient.id,
      name: patient.name,
      mobile: patient.mobile,
      cnic: patient.cnic,
      age: Number(patient.age),
      address: patient.address,
      lhwId: patient.lhwId || null,
      createdAt: new Date(patient.createdAt).toISOString(),
    };

    await loadDataIntoTable('DimPatient', [pRow]);

    if (pregnancy) {
      const startStr = pregnancy.startDate ? new Date(pregnancy.startDate).toISOString().split('T')[0] : null;
      const dueStr = pregnancy.expectedDueDate ? new Date(pregnancy.expectedDueDate).toISOString().split('T')[0] : null;
      
      const pregRow = {
        id: pregnancy.id,
        patientId: pregnancy.patientId,
        startDate: startStr,
        expectedDueDate: dueStr,
        parity: Number(pregnancy.parity),
        gravida: Number(pregnancy.gravida),
        isActive: Boolean(pregnancy.isActive),
        createdAt: new Date(pregnancy.createdAt).toISOString(),
      };

      await loadDataIntoTable('DimPregnancy', [pregRow]);
    }
  } catch (err) {
    console.error('[BigQuery] Error loading dimensions:', err);
  }
}

/**
 * Streams clinical vitals events (FactVisit) into BigQuery.
 */
export async function streamVisitFactToBigQuery(visit: any, patientId: string) {
  try {
    const visitRow = {
      id: visit.id,
      pregnancyId: visit.pregnancyId,
      patientId: patientId,
      visitDate: new Date(visit.visitDate).toISOString(),
      gestationalWeeks: Number(visit.gestationalWeeks),
      systolicBP: Number(visit.systolicBP),
      diastolicBP: Number(visit.diastolicBP),
      hemoglobin: Number(visit.hemoglobin),
      weight: Number(visit.weight),
      fetalHeartRate: visit.fetalHeartRate ? Number(visit.fetalHeartRate) : null,
      symptoms: typeof visit.symptoms === 'string' ? visit.symptoms : JSON.stringify(visit.symptoms),
      riskScore: Number(visit.riskScore),
      riskCategory: visit.riskCategory,
      medications: visit.medications,
      adviceUrdu: visit.adviceUrdu,
      createdAt: new Date(visit.createdAt).toISOString(),
    };

    await loadDataIntoTable('FactVisit', [visitRow]);
    console.log(`[BigQuery] Visit Fact ${visit.id} successfully loaded to warehouse via Load Job.`);
  } catch (err) {
    console.error('[BigQuery] Error loading visit fact:', err);
  }
}

/**
 * Executes a single, highly optimized batch query against Google BigQuery data warehouse 
 * to fetch live analytics telemetry for a specific Lady Health Worker (LHW).
 * Uses robust fallsbacks.
 */
export async function getLHWBigQueryMetrics(lhwId: string) {
  try {
    const query = `
      SELECT 
        (SELECT COUNT(DISTINCT id) FROM \`${projectId}.${datasetId}.DimPatient\` WHERE lhwId = @lhwId) AS totalMothers,
        (SELECT COUNT(DISTINCT v.id) FROM \`${projectId}.${datasetId}.FactVisit\` AS v INNER JOIN \`${projectId}.${datasetId}.DimPatient\` AS p ON v.patientId = p.id WHERE p.lhwId = @lhwId AND (v.riskCategory = 'HIGH' OR v.riskCategory = 'CRITICAL')) AS activeReferralsCount,
        (SELECT COUNT(DISTINCT v.id) FROM \`${projectId}.${datasetId}.FactVisit\` AS v INNER JOIN \`${projectId}.${datasetId}.DimPatient\` AS p ON v.patientId = p.id WHERE p.lhwId = @lhwId) AS totalVisits
    `;

    console.log(`[BigQuery Metrics] Executing command center live query for LHW: ${lhwId}...`);
    const [rows] = await bigquery.query({
      query,
      params: { lhwId },
      types: { lhwId: 'STRING' }
    });

    if (rows && rows.length > 0) {
      const data = rows[0];
      const metrics = {
        totalMothers: Number(data.totalMothers || 0),
        activeReferralsCount: Number(data.activeReferralsCount || 0),
        totalVisits: Number(data.totalVisits || 0)
      };
      console.log(`[BigQuery Metrics] Successfully loaded live stats:`, metrics);
      return metrics;
    }

    return null;
  } catch (err) {
    console.error(`[BigQuery Metrics] Exception querying data warehouse for LHW ${lhwId}:`, err);
    return null;
  }
}
