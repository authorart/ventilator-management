"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { permissions, type Role } from "@/lib/permissions";
import {
  buildingSchema,
  wardSchema,
  type BuildingValues,
  type WardValues,
} from "@/lib/validation";
import { Prisma } from "@prisma/client";

export type LocationResult = { ok: true } | { ok: false; error: string };

async function requireLocationManager() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  if (!permissions.canManageLocations(session.user.role as Role)) {
    throw new Error("คุณไม่มีสิทธิ์จัดการสถานที่");
  }
}

function firstIssue(error: import("zod").ZodError) {
  return error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
}

function uniqueMessage(error: unknown, labels: Record<string, string>): string | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const target = (error.meta?.target as string[] | undefined) ?? [];
    const label = labels[target.find((t) => labels[t]) ?? ""] ?? "ข้อมูล";
    return `${label}นี้มีอยู่ในระบบแล้ว`;
  }
  return null;
}

async function run(fn: () => Promise<void>, labels: Record<string, string>): Promise<LocationResult> {
  try {
    await requireLocationManager();
    await fn();
  } catch (e) {
    const unique = uniqueMessage(e, labels);
    if (unique) return { ok: false, error: unique };
    if (e instanceof LocationError || (e instanceof Error && e.message.startsWith("คุณไม่มีสิทธิ์"))) {
      return { ok: false, error: e.message };
    }
    console.error(e);
    return { ok: false, error: "เกิดข้อผิดพลาด ไม่สามารถบันทึกได้" };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

class LocationError extends Error {}

const BUILDING_LABELS = { name: "ชื่ออาคาร", code: "รหัสอาคาร" };
const WARD_LABELS = { buildingId_name: "ชื่อหอผู้ป่วย / จุดวางในอาคารนี้", name: "ชื่อหอผู้ป่วย / จุดวางในอาคารนี้" };

export async function saveBuilding(id: string | null, values: BuildingValues): Promise<LocationResult> {
  const parsed = buildingSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  return run(async () => {
    if (id) await prisma.building.update({ where: { id }, data: parsed.data });
    else await prisma.building.create({ data: parsed.data });
  }, BUILDING_LABELS);
}

export async function deleteBuilding(id: string): Promise<LocationResult> {
  return run(async () => {
    const wards = await prisma.ward.count({ where: { buildingId: id } });
    if (wards > 0) throw new LocationError("ลบไม่ได้: อาคารนี้ยังมีหอผู้ป่วย / จุดวางอยู่ กรุณาลบหรือย้ายก่อน");
    await prisma.building.delete({ where: { id } });
  }, BUILDING_LABELS);
}

export async function saveWard(id: string | null, values: WardValues): Promise<LocationResult> {
  const parsed = wardSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const data = parsed.data;

  return run(async () => {
    if (id) {
      const existing = await prisma.ward.findUniqueOrThrow({
        where: { id },
        include: { _count: { select: { ventilators: true } } },
      });
      // Ventilator.isReserveUnit is derived from the ward category when a machine is registered.
      if (existing.category !== data.category && existing._count.ventilators > 0) {
        throw new LocationError("เปลี่ยนประเภทไม่ได้: มีเครื่องอยู่ในจุดนี้ กรุณาย้ายเครื่องออกก่อน");
      }
      await prisma.ward.update({ where: { id }, data });
    } else {
      await prisma.ward.create({ data });
    }
  }, WARD_LABELS);
}

export async function deleteWard(id: string): Promise<LocationResult> {
  return run(async () => {
    const [ventilators, users, moves] = await Promise.all([
      prisma.ventilator.count({ where: { currentWardId: id } }),
      prisma.user.count({ where: { homeWardId: id } }),
      prisma.locationHistory.count({ where: { OR: [{ fromWardId: id }, { toWardId: id }] } }),
    ]);
    if (ventilators > 0) throw new LocationError("ลบไม่ได้: ยังมีเครื่องช่วยหายใจอยู่ในจุดนี้ กรุณาย้ายเครื่องออกก่อน");
    if (users > 0) throw new LocationError("ลบไม่ได้: มีผู้ใช้งานสังกัดหอผู้ป่วยนี้อยู่");
    if (moves > 0) throw new LocationError("ลบไม่ได้: มีประวัติการเคลื่อนย้ายเครื่องที่อ้างอิงจุดนี้");
    await prisma.ward.delete({ where: { id } });
  }, WARD_LABELS);
}
