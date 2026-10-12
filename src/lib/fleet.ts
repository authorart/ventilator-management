import { VentilatorStatus, type WardCategory } from "@prisma/client";

export type StatusCounts = Record<VentilatorStatus, number>;

export type WardLevel = "full" | "unavailable" | "nearly" | "ok" | "empty";

export type WardStat = {
  id: string;
  name: string;
  buildingId: string;
  buildingName: string;
  category: WardCategory;
  bedCount: number | null;
  counts: StatusCounts;
  total: number;
  available: number;
  inUse: number;
  level: WardLevel;
};

export const NEARLY_FULL_THRESHOLD = 0.8;

export function emptyCounts(): StatusCounts {
  return Object.fromEntries(Object.values(VentilatorStatus).map((s) => [s, 0])) as StatusCounts;
}

/**
 * "Fully used" = the ward still owns working machines, but none of them is free.
 * Machines that are disposed never count. Broken machines are not usable capacity.
 */
export function wardLevel(counts: StatusCounts): WardLevel {
  const { AVAILABLE: available, IN_USE: inUse } = counts;
  const total = Object.values(VentilatorStatus)
    .filter((s) => s !== VentilatorStatus.DISPOSED)
    .reduce((sum, s) => sum + counts[s], 0);

  if (total === 0) return "empty";
  if (available === 0 && inUse > 0) return "full";
  if (available === 0) return "unavailable";
  if (inUse / (inUse + available) >= NEARLY_FULL_THRESHOLD) return "nearly";
  return "ok";
}

type WardWithVentilators = {
  id: string;
  name: string;
  category: WardCategory;
  bedCount: number | null;
  buildingId: string;
  building: { name: string };
  ventilators: { currentStatus: VentilatorStatus }[];
};

export function buildWardStats(wards: WardWithVentilators[]): WardStat[] {
  return wards.map((w) => {
    const counts = emptyCounts();
    for (const v of w.ventilators) counts[v.currentStatus] += 1;
    const total = w.ventilators.filter((v) => v.currentStatus !== VentilatorStatus.DISPOSED).length;
    return {
      id: w.id,
      name: w.name,
      buildingId: w.buildingId,
      buildingName: w.building.name,
      category: w.category,
      bedCount: w.bedCount,
      counts,
      total,
      available: counts.AVAILABLE,
      inUse: counts.IN_USE,
      level: wardLevel(counts),
    };
  });
}

export const LEVEL_LABEL: Record<WardLevel, string> = {
  full: "ใช้งานเต็ม",
  unavailable: "ไม่มีเครื่องพร้อมใช้",
  nearly: "ใกล้เต็ม",
  ok: "ปกติ",
  empty: "ไม่มีเครื่อง",
};
