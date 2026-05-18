import 'dotenv/config';
import { PrismaClient, Role, RiskCategory, Severity } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { hashPassword } from '../src/lib/hash.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...");

  // Clean old records
  await prisma.auditLog.deleteMany({});
  await prisma.alert.deleteMany({});
  await prisma.visit.deleteMany({});
  await prisma.pregnancy.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.healthFacility.deleteMany({});
  await prisma.district.deleteMany({});

  console.log("🧹 Cleaned database tables.");

  // 1. Create Tharparkar District
  const district = await prisma.district.create({
    data: {
      name: "Tharparkar",
    },
  });
  console.log(`Created District: ${district.name}`);

  // 2. Create Health Facilities
  const hospital = await prisma.healthFacility.create({
    data: {
      name: "Mithi DHQ Hospital",
      districtId: district.id,
    },
  });

  const clinic = await prisma.healthFacility.create({
    data: {
      name: "Diplo Tehsil Clinic",
      districtId: district.id,
    },
  });
  console.log(`Created Health Facilities: ${hospital.name}, ${clinic.name}`);

  // 3. Create Users
  const adminPassword = hashPassword("Maternalink123$");
  const defaultPassword = hashPassword("Maternalink123$");

  const admin = await prisma.user.create({
    data: {
      name: "Dr. Ayesha Alvi (DHO)",
      mobile: "03001111111",
      password: adminPassword,
      role: Role.ADMIN,
      cnic: "44301-1111111-1",
    },
  });

  const nurse = await prisma.user.create({
    data: {
      name: "Sister Parveen Bano",
      mobile: "03002222222",
      password: defaultPassword,
      role: Role.NURSE,
      cnic: "44301-2222222-2",
      healthFacilityId: hospital.id,
    },
  });

  const lhw = await prisma.user.create({
    data: {
      name: "Shahnaz Begum (LHW)",
      mobile: "03003333333",
      password: defaultPassword,
      role: Role.LHW,
      cnic: "44301-3333333-3",
      healthFacilityId: clinic.id,
    },
  });

  console.log(`Created users:
  - Admin (DHO): Mobile = 03001111111, Password = Maternalink123$
  - Nurse: Mobile = 03002222222, Password = Maternalink123$
  - LHW: Mobile = 03003333333, Password = Maternalink123$`);

  // 4. Create Patients & Pregnancies
  const patient1 = await prisma.patient.create({
    data: {
      name: "Sajida Bibi",
      mobile: "+923001234567",
      cnic: "44301-1234567-8",
      age: 26,
      address: "Vadiar Village, Diplo",
      healthFacilityId: clinic.id,
      lhwId: lhw.id,
    },
  });

  const preg1 = await prisma.pregnancy.create({
    data: {
      patientId: patient1.id,
      gravida: 3,
      parity: 2,
      startDate: new Date("2025-10-15"),
      expectedDueDate: new Date("2026-07-22"),
      isActive: true,
    },
  });

  // Create normal visit
  await prisma.visit.create({
    data: {
      pregnancyId: preg1.id,
      visitDate: new Date("2025-11-20"),
      gestationalWeeks: 5,
      systolicBP: 118,
      diastolicBP: 76,
      hemoglobin: 11.5,
      weight: 58.2,
      fetalHeartRate: 140,
      symptoms: JSON.stringify(["None"]),
      voiceTranscript: "Initial routine visit. Patient feels normal.",
      riskScore: 10,
      riskCategory: RiskCategory.LOW,
      adviceUrdu: "باقاعدگی سے آئرن کی گولیاں کھائیں اور آرام کریں۔",
      medications: "Iron, Folic Acid",
    },
  });

  // Create High Risk visit
  const visit2 = await prisma.visit.create({
    data: {
      pregnancyId: preg1.id,
      visitDate: new Date("2026-05-15"),
      gestationalWeeks: 30,
      systolicBP: 142,
      diastolicBP: 92,
      hemoglobin: 9.8,
      weight: 64.5,
      fetalHeartRate: 145,
      symptoms: JSON.stringify(["headache", "swelling"]),
      voiceTranscript: "Patient reports swelling in feet and moderate headaches for two days.",
      riskScore: 55,
      riskCategory: RiskCategory.HIGH,
      adviceUrdu: "نمک کا استعمال کم کریں اور بلڈ پریشر باقاعدگی سے چیک کروائیں۔",
      medications: "Methyldopa 250mg, Iron supplements",
    },
  });

  // Create alert for high risk visit
  await prisma.alert.create({
    data: {
      visitId: visit2.id,
      type: "HIGH_RISK_TRIGGER",
      severity: Severity.HIGH,
      message: "LHW reports Sajida Bibi (30w) has elevated BP 142/92, pedal edema, and mild headaches.",
      isDispatched: false,
      resolved: false,
    },
  });

  // 5. Create a Critical Patient
  const patient2 = await prisma.patient.create({
    data: {
      name: "Zainab Mai",
      mobile: "+923009876543",
      cnic: "44301-7654321-9",
      age: 32,
      address: "Dahli Village, Diplo",
      healthFacilityId: clinic.id,
      lhwId: lhw.id,
    },
  });

  const preg2 = await prisma.pregnancy.create({
    data: {
      patientId: patient2.id,
      gravida: 5,
      parity: 4,
      startDate: new Date("2025-09-01"),
      expectedDueDate: new Date("2026-06-08"),
      isActive: true,
    },
  });

  const visitCritical = await prisma.visit.create({
    data: {
      pregnancyId: preg2.id,
      visitDate: new Date("2026-05-16"),
      gestationalWeeks: 37,
      systolicBP: 165,
      diastolicBP: 112,
      hemoglobin: 6.5,
      weight: 68.0,
      fetalHeartRate: 168,
      symptoms: JSON.stringify(["headache", "blurry_vision", "bleeding"]),
      voiceTranscript: "Severe headaches, blurry vision, active bleeding reported.",
      riskScore: 90,
      riskCategory: RiskCategory.CRITICAL,
      adviceUrdu: "فوری طور پر قریبی ہسپتال (Mithi DHQ) منتقل کریں۔ ہنگامی حالت ہے۔",
      medications: "Emergency Magnesium Sulfate, IV fluids",
    },
  });

  const alertCritical = await prisma.alert.create({
    data: {
      visitId: visitCritical.id,
      type: "EMERGENCY_OBSTETRIC_CARE",
      severity: Severity.CRITICAL,
      message: "EMERGENCY: Zainab Mai (37w) is in critical condition! BP 165/112, Hb 6.5, active vaginal bleeding.",
      isDispatched: true,
      dispatchedAt: new Date(),
      resolved: false,
    },
  });

  console.log("🌱 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
