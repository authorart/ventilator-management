import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { permissions, type Role } from "@/lib/permissions";
import { AppHeader } from "@/components/app-header";
import { StatusSummary } from "@/components/status-summary";
import { VentilatorTable, type VentilatorRow } from "@/components/ventilator-table";
import type { VentilatorStatus } from "@prisma/client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  const role = session.user.role as Role;
  const scopedToOwnWard = !permissions.canViewAllWards(role);

  const ventilators = await prisma.ventilator.findMany({
    where: scopedToOwnWard ? { currentWardId: session.user.homeWardId ?? "__none__" } : undefined,
    include: {
      currentWard: { include: { building: true } },
    },
    orderBy: { assetNumber: "asc" },
  });

  const wards = await prisma.ward.findMany({
    include: { building: true },
    orderBy: [{ building: { name: "asc" } }, { name: "asc" }],
  });

  const counts: Partial<Record<VentilatorStatus, number>> = {};
  for (const v of ventilators) {
    counts[v.currentStatus] = (counts[v.currentStatus] ?? 0) + 1;
  }

  const rows: VentilatorRow[] = ventilators.map((v) => ({
    id: v.id,
    assetNumber: v.assetNumber,
    deviceCode: v.deviceCode,
    brand: v.brand,
    model: v.model,
    currentStatus: v.currentStatus,
    wardId: v.currentWardId,
    wardLabel: `${v.currentWard.name} (${v.currentWard.building.name})`,
  }));

  const wardOptions = wards.map((w) => ({
    id: w.id,
    label: `${w.name} (${w.building.name})`,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6">
        <div>
          <h1 className="text-lg font-semibold">
            {scopedToOwnWard ? "เครื่องช่วยหายใจประจำหอผู้ป่วยของฉัน" : "ภาพรวมเครื่องช่วยหายใจทั้งหมด"}
          </h1>
          <p className="text-sm text-muted-foreground">
            ข้อมูล ณ ปัจจุบัน — รีเฟรชหน้านี้เพื่อดูสถานะล่าสุด
          </p>
        </div>
        <StatusSummary counts={counts} />
        <VentilatorTable ventilators={rows} wards={wardOptions} role={role} />
      </main>
    </div>
  );
}
