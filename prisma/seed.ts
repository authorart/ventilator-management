import { PrismaClient, WardCategory, VentilatorStatus, Role, VendorType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const BUILDINGS: { name: string; code: string }[] = [
  { name: "ศูนย์เครื่องมือ", code: "EQC" },
  { name: "อาคารบำบัดรักษา", code: "TREAT" },
  { name: "อาคารอายุรกรรม", code: "MED" },
  { name: "อาคารอุบัติเหตุฉุกเฉิน", code: "ER" },
  { name: "อาคารทองดี", code: "TD" },
  { name: "อาคาร 60 ปี", code: "60Y" },
];

const DEDICATED_WARDS: Record<string, string[]> = {
  อาคารอายุรกรรม: [
    "หอผู้ป่วยชาย1",
    "หอผู้ป่วยชาย2",
    "หอผู้ป่วยหญิง1",
    "หอผู้ป่วยหญิง2",
    "หอผู้ป่วยโรคหลอดเลือดสมอง",
  ],
  อาคารบำบัดรักษา: ["MICU1", "MICU2", "MICU3", "CCU"],
  อาคารอุบัติเหตุฉุกเฉิน: [
    "SICU",
    "TICU",
    "หอผู้ป่วยอุบัติเหตุฉุกเฉิน",
    "หอผู้ป่วยศัลยกรรมหญิง",
  ],
  "อาคาร 60 ปี": ["ศัลยกรรมชาย"],
  อาคารทองดี: ["PICU"],
};

async function main() {
  const buildingByName = new Map<string, string>();
  for (const b of BUILDINGS) {
    const building = await prisma.building.upsert({
      where: { name: b.name },
      update: {},
      create: b,
    });
    buildingByName.set(b.name, building.id);
  }

  const wardIdByKey = new Map<string, string>();

  // Reserve ward per building.
  for (const b of BUILDINGS) {
    const buildingId = buildingByName.get(b.name)!;
    const ward = await prisma.ward.upsert({
      where: { buildingId_name: { buildingId, name: `สำรอง-${b.name}` } },
      update: {},
      create: {
        buildingId,
        name: `สำรอง-${b.name}`,
        category: WardCategory.RESERVE,
      },
    });
    wardIdByKey.set(`reserve:${b.name}`, ward.id);
  }

  // Dedicated wards.
  for (const [buildingName, wardNames] of Object.entries(DEDICATED_WARDS)) {
    const buildingId = buildingByName.get(buildingName)!;
    for (const wardName of wardNames) {
      const ward = await prisma.ward.upsert({
        where: { buildingId_name: { buildingId, name: wardName } },
        update: {},
        create: {
          buildingId,
          name: wardName,
          category: WardCategory.DEDICATED,
          bedCount: 1,
        },
      });
      wardIdByKey.set(`dedicated:${wardName}`, ward.id);
    }
  }

  const adminUsername = process.env.SEED_ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  const usersToSeed = [
    {
      username: adminUsername,
      password: adminPassword,
      fullName: "ผู้ดูแลระบบ",
      role: Role.ADMIN,
      homeWardId: null as string | null,
    },
    {
      username: "equipment_center_demo",
      password: "ChangeMe123!",
      fullName: "เจ้าหน้าที่ศูนย์เครื่องมือ (ตัวอย่าง)",
      role: Role.EQUIPMENT_CENTER,
      homeWardId: null as string | null,
    },
    {
      username: "ward_staff_demo",
      password: "ChangeMe123!",
      fullName: "เจ้าหน้าที่ MICU1 (ตัวอย่าง)",
      role: Role.WARD_STAFF,
      homeWardId: wardIdByKey.get("dedicated:MICU1") ?? null,
    },
  ];

  for (const u of usersToSeed) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { username: u.username },
      update: { passwordHash },
      create: {
        username: u.username,
        passwordHash,
        fullName: u.fullName,
        role: u.role,
        homeWardId: u.homeWardId,
      },
    });
  }

  const vendor = await prisma.vendor.upsert({
    where: { id: "demo-vendor" },
    update: {},
    create: {
      id: "demo-vendor",
      name: "บริษัทตัวอย่าง จำกัด",
      type: VendorType.BOTH,
      contactPhone: "043-000000",
    },
  });

  const demoVentilators: {
    suffix: string;
    wardKey: string;
    status: VentilatorStatus;
    brand: string;
    model: string;
  }[] = [
    { suffix: "001", wardKey: "dedicated:MICU1", status: VentilatorStatus.IN_USE, brand: "Drager", model: "Evita V500" },
    { suffix: "002", wardKey: "dedicated:MICU2", status: VentilatorStatus.IN_USE, brand: "Drager", model: "Evita V500" },
    { suffix: "003", wardKey: "dedicated:CCU", status: VentilatorStatus.AVAILABLE, brand: "Hamilton", model: "C1" },
    { suffix: "004", wardKey: "dedicated:SICU", status: VentilatorStatus.AWAITING_REPAIR, brand: "Puritan Bennett", model: "840" },
    { suffix: "005", wardKey: "dedicated:TICU", status: VentilatorStatus.UNDER_MAINTENANCE, brand: "Puritan Bennett", model: "840" },
    { suffix: "006", wardKey: "dedicated:PICU", status: VentilatorStatus.IN_USE, brand: "Hamilton", model: "C1" },
    { suffix: "007", wardKey: "reserve:ศูนย์เครื่องมือ", status: VentilatorStatus.AVAILABLE, brand: "Drager", model: "Savina 300" },
    { suffix: "008", wardKey: "reserve:อาคารอายุรกรรม", status: VentilatorStatus.AVAILABLE, brand: "Drager", model: "Savina 300" },
    { suffix: "009", wardKey: "reserve:อาคารอุบัติเหตุฉุกเฉิน", status: VentilatorStatus.DAMAGED_PENDING_DISPOSAL, brand: "Newport", model: "e360" },
    { suffix: "010", wardKey: "dedicated:หอผู้ป่วยชาย1", status: VentilatorStatus.AVAILABLE, brand: "Hamilton", model: "C1" },
  ];

  for (const v of demoVentilators) {
    const wardId = wardIdByKey.get(v.wardKey);
    if (!wardId) continue;

    await prisma.ventilator.upsert({
      where: { assetNumber: `DEMO-${v.suffix}` },
      update: {},
      create: {
        assetNumber: `DEMO-${v.suffix}`,
        serialNumber: `SN-DEMO-${v.suffix}`,
        deviceCode: `D${v.suffix}`,
        brand: v.brand,
        model: v.model,
        registrationDate: new Date("2024-01-01"),
        vendorId: vendor.id,
        currentWardId: wardId,
        currentStatus: v.status,
        isReserveUnit: v.wardKey.startsWith("reserve:"),
      },
    });
  }

  console.log("Seed complete.");
  console.log(`Admin login: ${adminUsername} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
