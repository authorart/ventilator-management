"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { permissions, type Role } from "@/lib/permissions";
import { ventilatorFormSchema, type VentilatorFormValues } from "@/lib/validation";
import { MoveType, VentilatorStatus, MaintenanceType, Prisma } from "@prisma/client";

export type VentilatorFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

const UNIQUE_FIELD_LABEL: Record<string, string> = {
  assetNumber: "เลขครุภัณฑ์",
  serialNumber: "Serial number",
  deviceCode: "ID เครื่อง",
};

function parseVentilatorForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = ventilatorFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    }
    return { success: false as const, fieldErrors };
  }
  return { success: true as const, data: parsed.data };
}

function toDbValues(data: VentilatorFormValues) {
  return {
    assetNumber: data.assetNumber,
    serialNumber: data.serialNumber,
    deviceCode: data.deviceCode,
    brand: data.brand,
    model: data.model,
    registrationDate: new Date(data.registrationDate),
    purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
    purchasePrice: data.purchasePrice ? Number(data.purchasePrice) : null,
    warrantyExpiryDate: data.warrantyExpiryDate ? new Date(data.warrantyExpiryDate) : null,
    vendorId: data.vendorId || null,
  };
}

async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }
  return session;
}

export async function reportProblem(ventilatorId: string, description: string) {
  const session = await requireSession();
  const userId = session.user.id;

  const ventilator = await prisma.ventilator.findUniqueOrThrow({
    where: { id: ventilatorId },
  });

  const role = session.user.role as Role;
  if (role === "WARD_STAFF" && ventilator.currentWardId !== session.user.homeWardId) {
    throw new Error("คุณไม่มีสิทธิ์แจ้งปัญหาเครื่องนอกหอผู้ป่วยของคุณ");
  }

  await prisma.$transaction([
    prisma.maintenanceRecord.create({
      data: {
        ventilatorId,
        maintenanceType: MaintenanceType.CORRECTIVE,
        problemDescription: description,
        reportedById: userId,
      },
    }),
    prisma.statusHistory.create({
      data: {
        ventilatorId,
        status: VentilatorStatus.AWAITING_REPAIR,
        changedById: userId,
        note: "แจ้งปัญหาโดยหอผู้ป่วย",
      },
    }),
    prisma.ventilator.update({
      where: { id: ventilatorId },
      data: { currentStatus: VentilatorStatus.AWAITING_REPAIR },
    }),
  ]);

  revalidatePath("/", "layout");
}

export async function updateStatus(ventilatorId: string, status: VentilatorStatus, note?: string) {
  const session = await requireSession();
  const role = session.user.role as Role;
  if (!permissions.canProcessMaintenance(role)) {
    throw new Error("คุณไม่มีสิทธิ์เปลี่ยนสถานะเครื่อง");
  }

  await prisma.$transaction([
    prisma.statusHistory.create({
      data: {
        ventilatorId,
        status,
        changedById: session.user.id,
        note,
      },
    }),
    prisma.ventilator.update({
      where: { id: ventilatorId },
      data: { currentStatus: status },
    }),
  ]);

  revalidatePath("/", "layout");
}

export async function moveVentilator(
  ventilatorId: string,
  toWardId: string,
  moveType: MoveType,
  note?: string,
) {
  const session = await requireSession();
  const role = session.user.role as Role;
  if (!permissions.canMoveVentilator(role)) {
    throw new Error("คุณไม่มีสิทธิ์ย้ายเครื่อง");
  }

  const ventilator = await prisma.ventilator.findUniqueOrThrow({
    where: { id: ventilatorId },
  });

  await prisma.$transaction([
    prisma.locationHistory.create({
      data: {
        ventilatorId,
        fromWardId: ventilator.currentWardId,
        toWardId,
        moveType,
        movedById: session.user.id,
        note,
      },
    }),
    prisma.ventilator.update({
      where: { id: ventilatorId },
      data: { currentWardId: toWardId },
    }),
  ]);

  revalidatePath("/", "layout");
}

export async function createVentilator(
  _prevState: VentilatorFormState,
  formData: FormData,
): Promise<VentilatorFormState> {
  const session = await requireSession();
  const role = session.user.role as Role;
  if (!permissions.canEditFleet(role)) {
    return { error: "คุณไม่มีสิทธิ์เพิ่มเครื่องช่วยหายใจ" };
  }

  const parsed = parseVentilatorForm(formData);
  if (!parsed.success) {
    return { error: "กรุณาตรวจสอบข้อมูลที่กรอก", fieldErrors: parsed.fieldErrors };
  }
  if (!parsed.data.currentWardId) {
    return {
      error: "กรุณาตรวจสอบข้อมูลที่กรอก",
      fieldErrors: { currentWardId: "กรุณาเลือกตำแหน่งที่ตั้ง" },
    };
  }

  const ward = await prisma.ward.findUniqueOrThrow({ where: { id: parsed.data.currentWardId } });

  try {
    await prisma.ventilator.create({
      data: {
        ...toDbValues(parsed.data),
        currentWardId: ward.id,
        isReserveUnit: ward.category === "RESERVE",
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const field = (error.meta?.target as string[] | undefined)?.[0];
      const label = field ? (UNIQUE_FIELD_LABEL[field] ?? field) : "ข้อมูล";
      return { error: `${label} นี้มีอยู่ในระบบแล้ว` };
    }
    throw error;
  }

  revalidatePath("/", "layout");
  redirect("/ventilators");
}

export async function updateVentilator(
  ventilatorId: string,
  _prevState: VentilatorFormState,
  formData: FormData,
): Promise<VentilatorFormState> {
  const session = await requireSession();
  const role = session.user.role as Role;
  if (!permissions.canEditFleet(role)) {
    return { error: "คุณไม่มีสิทธิ์แก้ไขข้อมูลเครื่องช่วยหายใจ" };
  }

  const parsed = parseVentilatorForm(formData);
  if (!parsed.success) {
    return { error: "กรุณาตรวจสอบข้อมูลที่กรอก", fieldErrors: parsed.fieldErrors };
  }

  try {
    await prisma.ventilator.update({
      where: { id: ventilatorId },
      data: toDbValues(parsed.data),
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const field = (error.meta?.target as string[] | undefined)?.[0];
      const label = field ? (UNIQUE_FIELD_LABEL[field] ?? field) : "ข้อมูล";
      return { error: `${label} นี้มีอยู่ในระบบแล้ว` };
    }
    throw error;
  }

  revalidatePath("/", "layout");
  redirect("/ventilators");
}
