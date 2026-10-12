"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { permissions, type Role } from "@/lib/permissions";
import {
  completeRepairSchema,
  startRepairSchema,
  type CompleteRepairValues,
  type StartRepairValues,
} from "@/lib/validation";
import { VentilatorStatus } from "@prisma/client";

export type MaintenanceResult = { ok: true } | { ok: false; error: string };

class MaintenanceError extends Error {}

async function requireProcessor() {
  const session = await auth();
  if (!session?.user) throw new MaintenanceError("กรุณาเข้าสู่ระบบใหม่");
  if (!permissions.canProcessMaintenance(session.user.role as Role)) {
    throw new MaintenanceError("คุณไม่มีสิทธิ์ดำเนินการงานซ่อม");
  }
  return session;
}

async function run(fn: () => Promise<void>): Promise<MaintenanceResult> {
  try {
    await fn();
  } catch (e) {
    if (e instanceof MaintenanceError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "เกิดข้อผิดพลาด ไม่สามารถบันทึกได้" };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Equipment center picks up a reported problem: machine moves to "under maintenance". */
export async function startRepair(recordId: string, values: StartRepairValues): Promise<MaintenanceResult> {
  const parsed = startRepairSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  return run(async () => {
    const session = await requireProcessor();
    const record = await prisma.maintenanceRecord.findUnique({ where: { id: recordId } });
    if (!record) throw new MaintenanceError("ไม่พบใบงานซ่อม");
    if (record.completeDate) throw new MaintenanceError("ใบงานนี้ปิดแล้ว");
    if (record.startDate) throw new MaintenanceError("ใบงานนี้เริ่มดำเนินการแล้ว");

    await prisma.$transaction([
      prisma.maintenanceRecord.update({
        where: { id: recordId },
        data: {
          startDate: new Date(),
          vendorId: parsed.data.vendorId || null,
          technicianName: parsed.data.technicianName || null,
        },
      }),
      prisma.statusHistory.create({
        data: {
          ventilatorId: record.ventilatorId,
          status: VentilatorStatus.UNDER_MAINTENANCE,
          changedById: session.user.id,
          note: "เริ่มดำเนินการซ่อม",
        },
      }),
      prisma.ventilator.update({
        where: { id: record.ventilatorId },
        data: { currentStatus: VentilatorStatus.UNDER_MAINTENANCE },
      }),
    ]);
  });
}

/**
 * Record the outcome.
 *  - REPAIRED       → job closed, machine available again (unless another job is still open on it)
 *  - AWAITING_PARTS → job stays open, machine stays under maintenance
 *  - UNREPAIRABLE   → job closed, machine flagged damaged / pending disposal review
 */
export async function completeRepair(recordId: string, values: CompleteRepairValues): Promise<MaintenanceResult> {
  const parsed = completeRepairSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  const { result, cost, partsReplaced } = parsed.data;

  return run(async () => {
    const session = await requireProcessor();
    const record = await prisma.maintenanceRecord.findUnique({ where: { id: recordId } });
    if (!record) throw new MaintenanceError("ไม่พบใบงานซ่อม");
    if (record.completeDate) throw new MaintenanceError("ใบงานนี้ปิดแล้ว");

    const now = new Date();
    const closes = result !== "AWAITING_PARTS";

    let nextStatus: VentilatorStatus;
    let note: string;
    if (result === "UNREPAIRABLE") {
      nextStatus = VentilatorStatus.DAMAGED_PENDING_DISPOSAL;
      note = "ซ่อมไม่ได้ — รอพิจารณาจำหน่าย";
    } else if (result === "AWAITING_PARTS") {
      nextStatus = VentilatorStatus.UNDER_MAINTENANCE;
      note = "รออะไหล่";
    } else {
      const otherOpen = await prisma.maintenanceRecord.count({
        where: { ventilatorId: record.ventilatorId, completeDate: null, id: { not: recordId } },
      });
      nextStatus = otherOpen > 0 ? VentilatorStatus.UNDER_MAINTENANCE : VentilatorStatus.AVAILABLE;
      note = otherOpen > 0 ? "ซ่อมเสร็จ (ยังมีใบงานซ่อมอื่นค้างอยู่)" : "ซ่อมเสร็จ พร้อมใช้งาน";
    }

    await prisma.$transaction([
      prisma.maintenanceRecord.update({
        where: { id: recordId },
        data: {
          result,
          cost,
          partsReplaced: partsReplaced || null,
          startDate: record.startDate ?? now,
          completeDate: closes ? now : null,
        },
      }),
      prisma.statusHistory.create({
        data: { ventilatorId: record.ventilatorId, status: nextStatus, changedById: session.user.id, note },
      }),
      prisma.ventilator.update({
        where: { id: record.ventilatorId },
        data: { currentStatus: nextStatus },
      }),
    ]);
  });
}
