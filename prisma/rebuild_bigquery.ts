import 'dotenv/config';
import { db } from '../src/lib/db';
import { BigQuery } from '@google-cloud/bigquery';

const projectId = process.env.GCP_PROJECT_ID;
const datasetId = process.env.GCP_DATASET_ID || 'maternalink_analytics';
const bigquery = new BigQuery({ projectId });

async function truncateTable(tableName: string) {
  const query = `DELETE FROM \`${projectId}.${datasetId}.${tableName}\` WHERE TRUE`;
  try {
    await bigquery.query({ query });
    console.log(`[BigQuery] Truncated table: ${tableName}`);
  } catch (e) {
    console.warn(`[BigQuery] Could not truncate ${tableName}:`, e);
  }
}

async function rebuildWarehouse() {
  console.log('=== REBUILDING BIGQUERY WAREHOUSE FROM CLEAN POSTGRES DATA ===\n');

  // Step 1: Truncate all BQ tables
  console.log('[Step 1] Clearing stale BigQuery data...');
  await truncateTable('FactVisit');
  await truncateTable('DimPregnancy');
  await truncateTable('DimPatient');
  console.log('[Step 1] All tables cleared.\n');

  // Step 2: Load clean data from Postgres
  console.log('[Step 2] Loading clean patient data...');
  const patients = await db.patient.findMany({
    include: {
      pregnancies: { include: { visits: true } }
    }
  });

  console.log(`Found ${patients.length} patients.\n`);
  
  for (const patient of patients) {
    const activePreg = patient.pregnancies.find(p => p.isActive) || patient.pregnancies[0];
    console.log(`Patient: ${patient.name} | lhwId: ${patient.lhwId} | Pregnancies: ${patient.pregnancies.length}`);

    // Load DimPatient row
    const pRow = {
      id: patient.id,
      name: patient.name,
      mobile: patient.mobile || null,
      cnic: patient.cnic || null,
      age: Number(patient.age),
      address: patient.address || null,
      lhwId: patient.lhwId || null,
      createdAt: new Date(patient.createdAt).toISOString(),
    };

    const pNDJSON = JSON.stringify(pRow) + '\n';
    const fs = await import('fs');
    const path = await import('path');
    const tmpP = path.resolve('c:/Users/MUHAMMAD AHMAD/Downloads/Maternalink', `tmp_patient_${patient.id}.json`);
    fs.writeFileSync(tmpP, pNDJSON, 'utf8');
    const [pJob] = await bigquery.dataset(datasetId).table('DimPatient').createLoadJob(tmpP, {
      sourceFormat: 'NEWLINE_DELIMITED_JSON', writeDisposition: 'WRITE_APPEND'
    });
    await pJob.promise();
    fs.unlinkSync(tmpP);
    console.log(`  ✓ DimPatient row loaded`);

    // Load DimPregnancy
    for (const preg of patient.pregnancies) {
      const pregRow = {
        id: preg.id,
        patientId: preg.patientId,
        startDate: preg.startDate ? new Date(preg.startDate).toISOString().split('T')[0] : null,
        expectedDueDate: preg.expectedDueDate ? new Date(preg.expectedDueDate).toISOString().split('T')[0] : null,
        parity: Number(preg.parity),
        gravida: Number(preg.gravida),
        isActive: Boolean(preg.isActive),
        createdAt: new Date(preg.createdAt).toISOString(),
      };
      const pregNDJSON = JSON.stringify(pregRow) + '\n';
      const fs2 = await import('fs');
      const tmpPr = path.resolve('c:/Users/MUHAMMAD AHMAD/Downloads/Maternalink', `tmp_preg_${preg.id}.json`);
      fs2.writeFileSync(tmpPr, pregNDJSON, 'utf8');
      const [pregJob] = await bigquery.dataset(datasetId).table('DimPregnancy').createLoadJob(tmpPr, {
        sourceFormat: 'NEWLINE_DELIMITED_JSON', writeDisposition: 'WRITE_APPEND'
      });
      await pregJob.promise();
      fs2.unlinkSync(tmpPr);

      // Load FactVisit rows
      let visitCount = 0;
      for (const visit of preg.visits) {
        const vRow = {
          id: visit.id,
          pregnancyId: visit.pregnancyId,
          patientId: patient.id,
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
          medications: visit.medications || null,
          adviceUrdu: visit.adviceUrdu || null,
          createdAt: new Date(visit.createdAt).toISOString(),
        };
        const vNDJSON = JSON.stringify(vRow) + '\n';
        const fs3 = await import('fs');
        const tmpV = path.resolve('c:/Users/MUHAMMAD AHMAD/Downloads/Maternalink', `tmp_visit_${visit.id}.json`);
        fs3.writeFileSync(tmpV, vNDJSON, 'utf8');
        const [vJob] = await bigquery.dataset(datasetId).table('FactVisit').createLoadJob(tmpV, {
          sourceFormat: 'NEWLINE_DELIMITED_JSON', writeDisposition: 'WRITE_APPEND'
        });
        await vJob.promise();
        fs3.unlinkSync(tmpV);
        visitCount++;
      }
      console.log(`  ✓ DimPregnancy + ${visitCount} FactVisit rows loaded`);
    }
  }
  
  console.log('\n=== DONE! Rebuild Complete ===');
  console.log('BigQuery now has clean, accurate data matching your PostgreSQL database.');
  
  process.exit(0);
}

rebuildWarehouse().catch(e => { console.error('Error:', e); process.exit(1); });
