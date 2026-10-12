"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type BuildingOption = { id: string; name: string };
export type WardFilterOption = { id: string; name: string; buildingId: string };

const ALL = "__all__";

/** Filters live in the URL so a filtered view can be bookmarked or shared. */
export function VentilatorFilters({
  buildings,
  wards,
  showLocation,
}: {
  buildings: BuildingOption[];
  wards: WardFilterOption[];
  showLocation: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const building = params.get("building") ?? ALL;
  const ward = params.get("ward") ?? ALL;
  const urlQ = params.get("q") ?? "";
  const [q, setQ] = useState(urlQ);
  const skipFirst = useRef(true);
  const paramsRef = useRef(params);
  useEffect(() => {
    paramsRef.current = params;
  });

  function push(changes: Record<string, string | null>) {
    const next = new URLSearchParams(paramsRef.current.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === ALL || value === "") next.delete(key);
      else next.set(key, value);
    }
    next.delete("page");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  // Debounced search; skip the initial mount so we don't push a redundant navigation.
  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    const t = setTimeout(() => {
      if (q.trim() !== (paramsRef.current.get("q") ?? "")) push({ q: q.trim() });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const visibleWards = building === ALL ? wards : wards.filter((w) => w.buildingId === building);
  const hasFilter = params.has("building") || params.has("ward") || params.has("q") || params.has("status");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-56 flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาเลขครุภัณฑ์ / ID / Serial / รุ่น"
          className="pl-8"
          aria-label="ค้นหาเครื่อง"
        />
      </div>

      {showLocation ? (
        <>
          <Select
            value={building}
            onValueChange={(v) => v && push({ building: v, ward: null })}
          >
            <SelectTrigger className="w-52" aria-label="กรองตามอาคาร">
              <SelectValue>
                {(v: string) => (v === ALL ? "ทุกอาคาร" : (buildings.find((b) => b.id === v)?.name ?? v))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>ทุกอาคาร</SelectItem>
              {buildings.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={ward} onValueChange={(v) => v && push({ ward: v })}>
            <SelectTrigger className="w-52" aria-label="กรองตามหอผู้ป่วย">
              <SelectValue>
                {(v: string) => (v === ALL ? "ทุกหอผู้ป่วย / จุดวาง" : (wards.find((w) => w.id === v)?.name ?? v))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>ทุกหอผู้ป่วย / จุดวาง</SelectItem>
              {visibleWards.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      ) : null}

      {hasFilter ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setQ("");
            router.push(pathname);
          }}
        >
          <X className="size-4" />
          ล้างตัวกรอง
        </Button>
      ) : null}
    </div>
  );
}
