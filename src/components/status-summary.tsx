import Link from "next/link";
import { STATUS_LABEL, STATUS_BAR_CLASS } from "@/lib/status";
import { VentilatorStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

/**
 * Status boxes double as filters: each links to `hrefFor(status)`.
 * Pass `active` to highlight the current filter; clicking it again clears it (`hrefFor(null)`).
 */
export function StatusSummary({
  counts,
  hrefFor,
  active,
}: {
  counts: Record<VentilatorStatus, number>;
  hrefFor: (status: VentilatorStatus | null) => string;
  active?: VentilatorStatus | null;
}) {
  const statuses = Object.values(VentilatorStatus);
  const total = statuses.filter((s) => s !== "DISPOSED").reduce((sum, s) => sum + counts[s], 0);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      <Tile
        href={hrefFor(null)}
        label="ทั้งหมด (ใช้งานอยู่)"
        value={total}
        dotClass="bg-primary"
        selected={!active}
      />
      {statuses.map((status) => (
        <Tile
          key={status}
          href={active === status ? hrefFor(null) : hrefFor(status)}
          label={STATUS_LABEL[status]}
          value={counts[status]}
          dotClass={STATUS_BAR_CLASS[status]}
          selected={active === status}
        />
      ))}
    </div>
  );
}

function Tile({
  href,
  label,
  value,
  dotClass,
  selected,
}: {
  href: string;
  label: string;
  value: number;
  dotClass: string;
  selected: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "rounded-xl border bg-card p-4 shadow-xs outline-none transition",
        "hover:border-primary/40 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring",
        selected && "border-primary bg-accent/50 ring-1 ring-primary",
      )}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className={cn("size-2 shrink-0 rounded-full", dotClass)} />
        <span className="leading-tight">{label}</span>
      </div>
      <div className="mt-2 text-3xl font-semibold tabular-nums">{value}</div>
    </Link>
  );
}
