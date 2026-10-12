import Link from "next/link";
import { AlertTriangle, BedDouble } from "lucide-react";
import { VentilatorStatus } from "@prisma/client";
import { CATEGORY_LABEL, STATUS_BAR_CLASS, STATUS_LABEL } from "@/lib/status";
import { LEVEL_LABEL, type WardLevel, type WardStat } from "@/lib/fleet";
import { cn } from "@/lib/utils";

const LEVEL_CLASS: Record<WardLevel, string> = {
  full: "border-red-300 bg-red-50 text-red-800",
  unavailable: "border-red-300 bg-red-50 text-red-800",
  nearly: "border-amber-300 bg-amber-50 text-amber-800",
  ok: "border-emerald-200 bg-emerald-50 text-emerald-800",
  empty: "border-border bg-muted text-muted-foreground",
};

const BAR_STATUSES = Object.values(VentilatorStatus).filter((s) => s !== "DISPOSED");

export function WardAlerts({ wards }: { wards: WardStat[] }) {
  const critical = wards.filter((w) => w.level === "full" || w.level === "unavailable");
  if (critical.length === 0) return null;

  return (
    <section role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-900">
      <div className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="size-5" />
        แจ้งเตือน: {critical.length} จุดวางไม่มีเครื่องพร้อมใช้งาน
      </div>
      <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {critical.map((w) => (
          <li key={w.id}>
            <Link
              href={`/ventilators?ward=${w.id}`}
              className="flex items-center justify-between gap-3 rounded-md bg-white/70 px-3 py-1.5 text-sm hover:bg-white"
            >
              <span>
                <span className="font-medium">{w.name}</span>
                <span className="text-red-800/70"> · {w.buildingName}</span>
              </span>
              <span className="whitespace-nowrap text-xs">
                {w.level === "full" ? `ใช้งานเต็ม (${w.inUse}/${w.inUse})` : "ไม่มีเครื่องพร้อมใช้"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function WardBoard({ wards }: { wards: WardStat[] }) {
  const buildings = new Map<string, { name: string; wards: WardStat[] }>();
  for (const w of wards) {
    const group = buildings.get(w.buildingId) ?? { name: w.buildingName, wards: [] };
    group.wards.push(w);
    buildings.set(w.buildingId, group);
  }

  if (wards.length === 0) {
    return (
      <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
        ยังไม่มีข้อมูลสถานที่
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {[...buildings.entries()].map(([id, group]) => (
        <section key={id} className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold">
              <Link href={`/ventilators?building=${id}`} className="hover:text-primary hover:underline">
                {group.name}
              </Link>
            </h3>
            <span className="text-xs text-muted-foreground">
              พร้อมใช้ {group.wards.reduce((s, w) => s + w.available, 0)} /{" "}
              {group.wards.reduce((s, w) => s + w.total, 0)} เครื่อง
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.wards.map((w) => (
              <WardCard key={w.id} ward={w} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function WardCard({ ward }: { ward: WardStat }) {
  const barTotal = BAR_STATUSES.reduce((s, st) => s + ward.counts[st], 0);
  const critical = ward.level === "full" || ward.level === "unavailable";

  return (
    <Link
      href={`/ventilators?ward=${ward.id}`}
      className={cn(
        "block rounded-xl border bg-card p-4 shadow-xs outline-none transition",
        "hover:border-primary/40 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring",
        critical && "border-red-300",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium leading-tight">{ward.name}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{CATEGORY_LABEL[ward.category]}</span>
            {ward.bedCount ? (
              <>
                <span>·</span>
                <BedDouble className="size-3" />
                {ward.bedCount} เตียง
              </>
            ) : null}
          </div>
        </div>
        <span
          className={cn(
            "whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium",
            LEVEL_CLASS[ward.level],
          )}
        >
          {LEVEL_LABEL[ward.level]}
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-2xl font-semibold tabular-nums">{ward.available}</span>
        <span className="text-sm text-muted-foreground">/ {ward.total} เครื่องพร้อมใช้</span>
      </div>

      <div
        className="mt-2 flex h-2 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={BAR_STATUSES.filter((s) => ward.counts[s] > 0)
          .map((s) => `${STATUS_LABEL[s]} ${ward.counts[s]}`)
          .join(", ")}
      >
        {BAR_STATUSES.map((s) =>
          ward.counts[s] > 0 ? (
            <div
              key={s}
              className={STATUS_BAR_CLASS[s]}
              style={{ width: `${(ward.counts[s] / barTotal) * 100}%` }}
            />
          ) : null,
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        {BAR_STATUSES.filter((s) => ward.counts[s] > 0).map((s) => (
          <span key={s} className="flex items-center gap-1">
            <span className={cn("size-1.5 rounded-full", STATUS_BAR_CLASS[s])} />
            {STATUS_LABEL[s]} {ward.counts[s]}
          </span>
        ))}
      </div>
    </Link>
  );
}
