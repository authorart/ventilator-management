import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { permissions, type Role } from "@/lib/permissions";
import { buildWardStats, emptyCounts } from "@/lib/fleet";
import { AppHeader } from "@/components/app-header";
import { PageHeader } from "@/components/page-header";
import { StatusSummary } from "@/components/status-summary";
import { WardAlerts, WardBoard } from "@/components/ward-board";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { VentilatorStatus } from "@prisma/client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  const role = session.user.role as Role;
  const scopedToOwnWard = !permissions.canViewAllWards(role);

  const wards = await prisma.ward.findMany({
    where: scopedToOwnWard ? { id: session.user.homeWardId ?? "__none__" } : undefined,
    include: {
      building: true,
      ventilators: { select: { currentStatus: true } },
    },
    orderBy: [{ building: { name: "asc" } }, { name: "asc" }],
  });

  const stats = buildWardStats(wards);
  const counts = emptyCounts();
  for (const w of stats) {
    for (const status of Object.keys(w.counts) as VentilatorStatus[]) counts[status] += w.counts[status];
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6">
        <PageHeader
          title={scopedToOwnWard ? "แดชบอร์ดหอผู้ป่วยของฉัน" : "แดชบอร์ดภาพรวมเครื่องช่วยหายใจ"}
          description="ข้อมูล ณ ปัจจุบัน — รีเฟรชหน้านี้เพื่อดูสถานะล่าสุด"
          actions={
            permissions.canEditFleet(role) ? (
              <Button size="sm" nativeButton={false} render={<Link href="/ventilators/new" />}>
                <Plus className="size-4" />
                เพิ่มเครื่องใหม่
              </Button>
            ) : null
          }
        />

        <WardAlerts wards={stats} />

        <StatusSummary counts={counts} hrefFor={(s) => (s ? `/ventilators?status=${s}` : "/ventilators")} />

        <div className="space-y-3">
          <h2 className="text-base font-semibold">สถานะเครื่องแยกตามหอผู้ป่วย / จุดวาง</h2>
          <WardBoard wards={stats} />
        </div>
      </main>
    </div>
  );
}
