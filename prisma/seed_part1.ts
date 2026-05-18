import 'dotenv/config';
import { PrismaClient, Role, RiskCategory, Severity } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { hashPassword } from '../src/lib/hash.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function rnd(min: number, max: number, dec = 0) {
  const v = Math.random() * (max - min) + min;
  return dec ? parseFloat(v.toFixed(dec)) : Math.round(v);
}
function daysAgo(d: number) { const dt = new Date(); dt.setDate(dt.getDate() - d); return dt; }
function weeksAgo(w: number) { return daysAgo(w * 7); }

const MEDS_BY_RISK: Record<string, string[]> = {
  LOW: ['Iron 60mg OD', 'Folic Acid 5mg OD', 'Calcium 500mg BD'],
  MEDIUM: ['Iron 120mg OD', 'Folic Acid 5mg OD', 'Calcium 500mg BD', 'Vitamin D 600IU'],
  HIGH: ['Methyldopa 250mg BD', 'Iron 120mg OD', 'Aspirin 75mg OD', 'Calcium 1g OD'],
  CRITICAL: ['Methyldopa 500mg BD', 'Nifedipine 10mg SOS', 'Magnesium Sulfate 4g loading', 'IV Fluids', 'Iron IV infusion'],
};

const PREDICTIONS: Record<string, string[]> = {
  LOW: [
    'Vitals remain within normal range. Medication adherence appears good with stable hemoglobin. Continue current iron and folic acid regimen and schedule next visit in 4 weeks.',
    'Patient is progressing well. Weight gain is appropriate for gestational age. No concerning trends detected — continue routine antenatal monitoring.',
    'Hemoglobin is improving from previous visit, indicating good response to iron therapy. Blood pressure remains normal. Maintain current management plan.',
  ],
  MEDIUM: [
    'Mild anemia persists despite iron therapy — consider checking for dietary compliance and switching to IV iron if oral absorption is poor. Monitor at next visit in 2 weeks.',
    'BP is at upper normal range. While not yet hypertensive, the trend warrants close monitoring. Advise low-salt diet and weekly BP checks at home.',
    'Hemoglobin slightly below target. Reinforce iron tablet compliance and dietary counseling. Next visit in 2 weeks.',
  ],
  HIGH: [
    'Blood pressure trending upward despite Methyldopa — consider dose escalation or adding Nifedipine. Monitor for proteinuria and preeclampsia symptoms urgently.',
    'Hemoglobin critically low, likely not responding adequately to oral iron. Refer to DHQ Mithi for IV iron infusion evaluation. Increase visit frequency to weekly.',
    'Patient shows signs of early preeclampsia (elevated BP + mild edema). Start aspirin 75mg, reinforce fluid restriction, and schedule hospital review within 48 hours.',
  ],
  CRITICAL: [
    'CRITICAL: Severe hypertension persists. Immediate hospital referral is mandatory. Administer Magnesium Sulfate for seizure prophylaxis per protocol. Do not delay transfer.',
    'CRITICAL: Hemoglobin dangerously low with active symptoms. Urgent blood transfusion assessment required at DHQ Mithi. Emergency transport should be arranged immediately.',
    'CRITICAL: Fetal heart rate abnormal combined with severe maternal hypertension. Emergency obstetric intervention required — activate emergency dispatch protocol now.',
  ],
};

function getPrediction(risk: string): string {
  const arr = PREDICTIONS[risk] || PREDICTIONS['LOW'];
  return arr[rnd(0, arr.length - 1)];
}

function getMeds(risk: string): string {
  return MEDS_BY_RISK[risk]?.join(', ') || 'Iron 60mg OD, Folic Acid 5mg OD';
}

function getRiskCat(score: number): RiskCategory {
  if (score >= 75) return RiskCategory.CRITICAL;
  if (score >= 50) return RiskCategory.HIGH;
  if (score >= 25) return RiskCategory.MEDIUM;
  return RiskCategory.LOW;
}

async function main() {
  console.log('Cleaning database...');
  await prisma.auditLog.deleteMany({});
  await prisma.alert.deleteMany({});
  await prisma.visit.deleteMany({});
  await prisma.pregnancy.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.healthFacility.deleteMany({});
  await prisma.district.deleteMany({});
  console.log('Cleaned.');

  const district = await prisma.district.create({ data: { name: 'Tharparkar' } });

  const hospital = await prisma.healthFacility.create({ data: { name: 'Mithi DHQ Hospital', districtId: district.id } });
  const clinic   = await prisma.healthFacility.create({ data: { name: 'Diplo Tehsil Clinic', districtId: district.id } });

  const pw = hashPassword('Maternalink123$');

  const admin = await prisma.user.create({ data: { name: 'Dr. Ayesha Alvi', mobile: '03001111111', password: pw, role: Role.ADMIN, cnic: '44301-1111111-1' } });
  const s1    = await prisma.user.create({ data: { name: 'Nurse Parveen Bano', mobile: '03002222222', password: pw, role: Role.STAFF, cnic: '44301-2222222-2', healthFacilityId: hospital.id } });
  const s2    = await prisma.user.create({ data: { name: 'Staff Rukhsana Malik', mobile: '03003333333', password: pw, role: Role.STAFF, cnic: '44301-3333333-3', healthFacilityId: clinic.id } });
  const s3    = await prisma.user.create({ data: { name: 'Staff Hina Siddiqui', mobile: '03004444444', password: pw, role: Role.STAFF, cnic: '44301-4444444-4', healthFacilityId: clinic.id } });

  console.log('Staff created. Seeding patients...');

  const staffPool = [s1, s2, s3];
  const facilityPool = [hospital, clinic];

  const patients = [
