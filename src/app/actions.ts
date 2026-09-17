"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { permissions, type Role } from "@/lib/permissions";
import { MoveType, VentilatorStatus, MaintenanceType } from "@prisma/client";

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

  revalidatePath("/");
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

  revalidatePath("/");
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

  revalidatePath("/");
}
