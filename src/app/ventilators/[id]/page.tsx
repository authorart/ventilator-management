import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { permissions, type Role } from "@/lib/permissions";
import {
  MOVE_TYPE_LABEL,
  STAGE_CLASS,
  STAGE_LABEL,
  formatDate,
  formatDateTime,
  formatMoney,
  repairStage,
} from "@/lib/maintenance";
import { CATEGORY_LABEL, STATUS_LABEL } from "@/lib/status";
import { AppHeader } from "@/components/app-header";
import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function VentilatorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return null;
  const role = session.user.role as Role;

  const v = await prisma.ventilator.findUnique({
    where: { id },
    include: {
      currentWard: { include: { building: true } },
      vendor: true,
      statusHistory: { include: { changedBy: { select: { fullName: true } } }, orderBy: { statusDatetime: "desc" } },
      locationHistory: {
        include: {
          fromWard: { include: { building: true } },
          toWard: { include: { building: true } },
          movedBy: { select: { fullName: true } },
        },
        orderBy: { moveDatetime: "desc" },
      },
      maintenance: {
        include: { reportedBy: { select: { fullName: true } }, vendor: { select: { name: true } } },
        orderBy: { reportedDate: "desc" },
      },
    },
  });

  // Ward staff may only open machines that are currently in their own ward.
  if (!v || (!permissions.canViewAllWards(role) && v.currentWardId !== session.user.homeWardId)) {
    notFound();
  }

  const ward = (w: { name: string; building: { name: string } }) => `${w.name} (${w.building.name})`;
  const showMoney = permissions.canEditFleet(role);

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-6">
        <BackLink href="/ventilators" label="กลับรายการเครื่อง" />
        <PageHeader
          title={v.assetNumber}
          description={`${v.brand} ${v.model} · ID ${v.deviceCode}`}
          actions={
            <>
              <StatusBadge status={v.currentStatus} />
              {permissions.canEditFleet(role) ? (
                <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`/ventilators/${v.id}/edit`} />}>
                  <Pencil className="size-4" />
                  แก้ไข
                </Button>
              ) : null}
            </>
          }
        />

        <section className="rounded-xl border bg-card p-5 shadow-xs">
          <h2 className="mb-3 text-sm font-semibold">ข้อมูลเครื่อง</h2>
          <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <Field label="ตำแหน่งปัจจุบัน" value={`${ward(v.currentWard)} · ${CATEGORY_LABEL[v.currentWard.category]}`} />
            <Field label="เลขครุภัณฑ์" value={v.assetNumber} />
            <Field label="Serial number" value={v.serialNumber} />
            <Field label="ID เครื่อง" value={v.deviceCode} />
            <Field label="ยี่ห้อ / รุ่น" value={`${v.brand} ${v.model}`} />
            <Field label="วันที่ลงทะเบียน" value={formatDate(v.registrationDate)} />
            <Field label="ผู้จำหน่าย" value={v.vendor?.name ?? "—"} />
            <Field label="วันที่ซื้อ" value={formatDate(v.purchaseDate)} />
            <Field label="หมดประกัน" value={formatDate(v.warrantyExpiryDate)} />
            {showMoney ? (
              <Field label="ราคาซื้อ" value={formatMoney(v.purchasePrice ? Number(v.purchasePrice) : null)} />
            ) : null}
          </dl>
        </section>

        <Section title="งานซ่อม" count={v.maintenance.length} empty="ยังไม่เคยมีการแจ้งซ่อม">
          {v.maintenance.map((m) => {
            const stage = repairStage(m);
            return (
              <li key={m.id} className="space-y-1 px-5 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={cn("font-normal", STAGE_CLASS[stage])}>
                    {STAGE_LABEL[stage]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    แจ้งโดย {m.reportedBy.fullName} · {formatDateTime(m.reportedDate)}
                  </span>
                </div>
                <p>{m.problemDescription}</p>
                <p className="text-xs text-muted-foreground">
                  {[
                    m.startDate ? `เริ่มซ่อม ${formatDateTime(m.startDate)}` : null,
                    m.vendor?.name,
                    m.technicianName,
                    m.completeDate ? `ปิดงาน ${formatDateTime(m.completeDate)}` : null,
                    showMoney && m.cost ? `ค่าใช้จ่าย ${formatMoney(Number(m.cost))}` : null,
                    m.partsReplaced ? `อะไหล่: ${m.partsReplaced}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </li>
            );
          })}
        </Section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="ประวัติการเคลื่อนย้าย" count={v.locationHistory.length} empty="ยังไม่เคยย้ายเครื่อง">
            {v.locationHistory.map((l) => (
              <li key={l.id} className="space-y-0.5 px-5 py-3 text-sm">
                <div>
                  <span className="text-muted-foreground">{l.fromWard ? ward(l.fromWard) : "—"}</span>
                  {" → "}
                  <span className="font-medium">{ward(l.toWard)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {MOVE_TYPE_LABEL[l.moveType] ?? l.moveType} · {l.movedBy.fullName} · {formatDateTime(l.moveDatetime)}
                  {l.note ? ` · ${l.note}` : ""}
                </p>
              </li>
            ))}
          </Section>

          <Section title="ประวัติสถานะ" count={v.statusHistory.length} empty="ยังไม่มีการเปลี่ยนสถานะ">
            {v.statusHistory.map((s) => (
              <li key={s.id} className="space-y-0.5 px-5 py-3 text-sm">
                <div className="font-medium">{STATUS_LABEL[s.status]}</div>
                <p className="text-xs text-muted-foreground">
                  {s.changedBy.fullName} · {formatDateTime(s.statusDatetime)}
                  {s.note ? ` · ${s.note}` : ""}
                </p>
              </li>
            ))}
          </Section>
        </div>
      </main>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

function Section({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <h2 className="border-b bg-muted/40 px-5 py-3 text-sm font-semibold">
        {title} <span className="font-normal text-muted-foreground">({count})</span>
      </h2>
      {count === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y">{children}</ul>
      )}
    </section>
  );
}
