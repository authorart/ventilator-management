import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { permissions, type Role } from "@/lib/permissions";
import { isOpenStage, repairStage, type RepairStage } from "@/lib/maintenance";
import { AppHeader } from "@/components/app-header";
import { PageHeader } from "@/components/page-header";
import { MaintenanceQueue, type RepairJob } from "@/components/maintenance-queue";
import { cn } from "@/lib/utils";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function MaintenancePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await auth();
  if (!session?.user) return null;
  if (!permissions.canProcessMaintenance(session.user.role as Role)) redirect("/");

  const sp = await searchParams;
  const view = sp.view === "done" ? "done" : "open";

  const [records, vendors] = await Promise.all([
    prisma.maintenanceRecord.findMany({
      where: view === "open" ? { completeDate: null } : { completeDate: { not: null } },
      include: {
        ventilator: { include: { currentWard: { include: { building: true } } } },
        reportedBy: { select: { fullName: true } },
        vendor: { select: { name: true } },
      },
      orderBy: view === "open" ? { reportedDate: "asc" } : { completeDate: "desc" },
      take: 100,
    }),
    prisma.vendor.findMany({
      where: { type: { in: ["REPAIR_SERVICE", "BOTH"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const jobs: RepairJob[] = records.map((r) => ({
    id: r.id,
    ventilatorId: r.ventilatorId,
    assetNumber: r.ventilator.assetNumber,
    deviceCode: r.ventilator.deviceCode,
    brandModel: `${r.ventilator.brand} ${r.ventilator.model}`,
    wardLabel: `${r.ventilator.currentWard.name} (${r.ventilator.currentWard.building.name})`,
    problem: r.problemDescription,
    reportedBy: r.reportedBy.fullName,
    reportedDate: r.reportedDate.toISOString(),
    startDate: r.startDate?.toISOString() ?? null,
    completeDate: r.completeDate?.toISOString() ?? null,
    stage: repairStage(r) as RepairStage,
    vendorName: r.vendor?.name ?? null,
    technicianName: r.technicianName,
    cost: r.cost ? Number(r.cost) : null,
    partsReplaced: r.partsReplaced,
  }));

  const openCount = view === "open" ? jobs.filter((j) => isOpenStage(j.stage)).length : null;

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-5 px-4 py-6">
        <PageHeader
          title="งานซ่อมบำรุง"
          description="รับเรื่องที่หอผู้ป่วยแจ้ง ดำเนินการซ่อม และบันทึกผล — สถานะเครื่องจะอัปเดตอัตโนมัติ"
        />

        <div className="flex gap-1 border-b">
          {(
            [
              ["open", "งานค้าง"],
              ["done", "ปิดงานแล้ว"],
            ] as const
          ).map(([key, label]) => (
            <Link
              key={key}
              href={key === "open" ? "/maintenance" : "/maintenance?view=done"}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm",
                view === key
                  ? "border-primary font-medium text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
              {key === "open" && openCount != null ? ` (${openCount})` : ""}
            </Link>
          ))}
        </div>

        <MaintenanceQueue jobs={jobs} vendors={vendors} />
      </main>
    </div>
  );
}
