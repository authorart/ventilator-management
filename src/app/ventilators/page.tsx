import Link from "next/link";
import { Prisma, VentilatorStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { permissions, type Role } from "@/lib/permissions";
import { emptyCounts } from "@/lib/fleet";
import { AppHeader } from "@/components/app-header";
import { PageHeader } from "@/components/page-header";
import { StatusSummary } from "@/components/status-summary";
import { VentilatorFilters } from "@/components/ventilator-filters";
import { VentilatorTable, type VentilatorRow } from "@/components/ventilator-table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

const PAGE_SIZE = 20;

type SearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function VentilatorsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await auth();
  if (!session?.user) return null;

  const sp = await searchParams;
  const role = session.user.role as Role;
  const scopedToOwnWard = !permissions.canViewAllWards(role);

  const statusParam = first(sp.status);
  const status = Object.values(VentilatorStatus).find((s) => s === statusParam) ?? null;
  const q = first(sp.q)?.trim() ?? "";
  const buildingId = first(sp.building);
  const wardId = scopedToOwnWard ? (session.user.homeWardId ?? "__none__") : first(sp.ward);
  const page = Math.max(1, Number.parseInt(first(sp.page) ?? "1", 10) || 1);

  // Location + search scope. Status is applied on top, so the status boxes keep showing
  // the breakdown of the current ward/building instead of collapsing to the selected status.
  const scope: Prisma.VentilatorWhereInput = {
    ...(wardId ? { currentWardId: wardId } : buildingId ? { currentWard: { buildingId } } : {}),
    ...(q
      ? {
          OR: [
            { assetNumber: { contains: q, mode: "insensitive" } },
            { deviceCode: { contains: q, mode: "insensitive" } },
            { serialNumber: { contains: q, mode: "insensitive" } },
            { brand: { contains: q, mode: "insensitive" } },
            { model: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  // Disposed machines are excluded from the active fleet unless explicitly requested.
  const where: Prisma.VentilatorWhereInput = {
    ...scope,
    currentStatus: status ?? { not: VentilatorStatus.DISPOSED },
  };

  const [total, ventilators, grouped, wards, buildings] = await Promise.all([
    prisma.ventilator.count({ where }),
    prisma.ventilator.findMany({
      where,
      include: { currentWard: { include: { building: true } } },
      orderBy: { assetNumber: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.ventilator.groupBy({ by: ["currentStatus"], where: scope, _count: { _all: true } }),
    prisma.ward.findMany({
      include: { building: true },
      orderBy: [{ building: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.building.findMany({ orderBy: { name: "asc" } }),
  ]);

  const counts = emptyCounts();
  for (const g of grouped) counts[g.currentStatus] = g._count._all;

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

  const wardOptions = wards.map((w) => ({ id: w.id, label: `${w.name} (${w.building.name})` }));

  function hrefFor(next: { status?: VentilatorStatus | null; page?: number }) {
    const p = new URLSearchParams();
    const nextStatus = "status" in next ? next.status : status;
    if (nextStatus) p.set("status", nextStatus);
    if (q) p.set("q", q);
    if (!scopedToOwnWard) {
      if (buildingId) p.set("building", buildingId);
      const w = first(sp.ward);
      if (w) p.set("ward", w);
    }
    if (next.page && next.page > 1) p.set("page", String(next.page));
    const qs = p.toString();
    return qs ? `/ventilators?${qs}` : "/ventilators";
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-5 px-4 py-6">
        <PageHeader
          title={scopedToOwnWard ? "เครื่องช่วยหายใจประจำหอผู้ป่วยของฉัน" : "รายการเครื่องช่วยหายใจ"}
          description="คลิกกล่องสถานะเพื่อกรอง หรือเลือกอาคาร/หอผู้ป่วยเพื่อดูเครื่อง ณ ตำแหน่งปัจจุบัน"
          actions={
            permissions.canEditFleet(role) ? (
              <Button size="sm" nativeButton={false} render={<Link href="/ventilators/new" />}>
                <Plus className="size-4" />
                เพิ่มเครื่องใหม่
              </Button>
            ) : null
          }
        />

        <StatusSummary counts={counts} active={status} hrefFor={(s) => hrefFor({ status: s })} />

        <VentilatorFilters
          buildings={buildings.map((b) => ({ id: b.id, name: b.name }))}
          wards={wards.map((w) => ({ id: w.id, name: w.name, buildingId: w.buildingId }))}
          showLocation={!scopedToOwnWard}
        />

        <VentilatorTable ventilators={rows} wards={wardOptions} role={role} />

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            แสดง {from}–{to} จาก {total} เครื่อง
          </span>
          {totalPages > 1 ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                nativeButton={false}
                render={<Link href={hrefFor({ page: page - 1 })} />}
              >
                <ChevronLeft className="size-4" />
                ก่อนหน้า
              </Button>
              <span>
                หน้า {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                nativeButton={false}
                render={<Link href={hrefFor({ page: page + 1 })} />}
              >
                ถัดไป
                <ChevronRight className="size-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
