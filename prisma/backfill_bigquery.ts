import 'dotenv/config';
import { db } from '../src/lib/db';
import { initializeBigQueryDataset, streamDimensionToBigQuery, streamVisitFactToBigQuery } from '../src/services/bigquery';

async function backfillWarehouse() {
  console.log('================================================================');
  console.log('🚀 MaternaLink: Google BigQuery Data Warehouse Backfill Utility');
  console.log('================================================================');

  try {
    // 1. Initialize Dataset & Tables
    await initializeBigQueryDataset();

    // 2. Fetch all historical patients
    console.log('\n[PostgreSQL] Fetching patients and pregnancy histories...');
    const patients = await db.patient.findMany({
      include: {
        pregnancies: {
          include: {
            visits: true
          }
        }
      }
    });

    console.log(`[PostgreSQL] Found ${patients.length} historical patient profiles.`);

    let patientsSynced = 0;
    let pregnanciesSynced = 0;
    let visitsSynced = 0;

    // 3. Loop and Stream to BigQuery
    for (const patient of patients) {
      console.log(`\n➔ Syncing Patient: ${patient.name} (${patient.cnic || 'No CNIC'})`);

      // Sync Patient & Pregnancy dimensions
      const activePregnancy = patient.pregnancies.find(p => p.isActive) || patient.pregnancies[0];
      
      await streamDimensionToBigQuery(patient, activePregnancy);
      patientsSynced++;
      if (activePregnancy) pregnanciesSynced++;

      // Sync all associated checkups (visits)
      for (const preg of patient.pregnancies) {
        for (const visit of preg.visits) {
          console.log(`   └─ Syncing Visit: Weeks ${visit.gestationalWeeks}, BP ${visit.systolicBP}/${visit.diastolicBP}`);
          await streamVisitFactToBigQuery(visit, patient.id);
          visitsSynced++;
        }
      }
    }

    console.log('\n================================================================');
    console.log('✅ Backfill Completed Successfully!');
    console.log('================================================================');
    console.log(`👥 Total Dimension Patients Synced   : ${patientsSynced}`);
    console.log(`🤰 Total Dimension Pregnancies Synced: ${pregnanciesSynced}`);
    console.log(`📈 Total Fact Checkup Visits Synced   : ${visitsSynced}`);
    console.log('================================================================');

  } catch (err) {
    console.error('\n❌ Critical Failure during database backfill:', err);
  } finally {
    // Close the database pool properly to allow process exit
    process.exit(0);
  }
}

backfillWarehouse();
