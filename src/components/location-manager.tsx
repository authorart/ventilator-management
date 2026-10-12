"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORY_LABEL } from "@/lib/status";
import { deleteBuilding, deleteWard, saveBuilding, saveWard, type LocationResult } from "@/app/locations/actions";

export type BuildingItem = {
  id: string;
  name: string;
  code: string;
  wards: WardItem[];
};

export type WardItem = {
  id: string;
  name: string;
  category: "DEDICATED" | "RESERVE";
  bedCount: number | null;
  ventilatorCount: number;
};

type Dialogs =
  | { kind: "building"; building: BuildingItem | null }
  | { kind: "ward"; buildingId: string; ward: WardItem | null }
  | { kind: "delete-building"; building: BuildingItem }
  | { kind: "delete-ward"; ward: WardItem }
  | null;

export function LocationManager({ buildings }: { buildings: BuildingItem[] }) {
  const [dialog, setDialog] = useState<Dialogs>(null);
  const close = () => setDialog(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialog({ kind: "building", building: null })}>
          <Plus className="size-4" />
          เพิ่มอาคาร
        </Button>
      </div>

      {buildings.length === 0 ? (
        <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          ยังไม่มีอาคาร — เริ่มต้นด้วยการเพิ่มอาคาร
        </p>
      ) : null}

      {buildings.map((b) => (
        <section key={b.id} className="overflow-hidden rounded-xl border bg-card shadow-xs">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-muted-foreground" />
              <h2 className="font-semibold">{b.name}</h2>
              <Badge variant="outline" className="font-mono text-xs">
                {b.code}
              </Badge>
              <span className="text-xs text-muted-foreground">{b.wards.length} จุด</span>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={() => setDialog({ kind: "ward", buildingId: b.id, ward: null })}>
                <Plus className="size-4" />
                เพิ่มหอผู้ป่วย / จุดวาง
              </Button>
              <Button size="icon-sm" variant="ghost" aria-label={`แก้ไขอาคาร ${b.name}`} onClick={() => setDialog({ kind: "building", building: b })}>
                <Pencil className="size-4" />
              </Button>
              <Button size="icon-sm" variant="ghost" aria-label={`ลบอาคาร ${b.name}`} onClick={() => setDialog({ kind: "delete-building", building: b })}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </header>

          {b.wards.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">ยังไม่มีหอผู้ป่วย / จุดวางในอาคารนี้</p>
          ) : (
            <ul className="divide-y">
              {b.wards.map((w) => (
                <li key={w.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <Link href={`/ventilators?ward=${w.id}`} className="font-medium hover:text-primary hover:underline">
                      {w.name}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      <span>{CATEGORY_LABEL[w.category]}</span>
                      {w.bedCount != null ? <span>· {w.bedCount} เตียง</span> : null}
                      <span>· {w.ventilatorCount} เครื่อง</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button size="icon-sm" variant="ghost" aria-label={`แก้ไข ${w.name}`} onClick={() => setDialog({ kind: "ward", buildingId: b.id, ward: w })}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button size="icon-sm" variant="ghost" aria-label={`ลบ ${w.name}`} onClick={() => setDialog({ kind: "delete-ward", ward: w })}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {dialog?.kind === "building" ? <BuildingDialog building={dialog.building} onClose={close} /> : null}
      {dialog?.kind === "ward" ? (
        <WardDialog ward={dialog.ward} buildingId={dialog.buildingId} buildings={buildings} onClose={close} />
      ) : null}
      {dialog?.kind === "delete-building" ? (
        <ConfirmDelete
          title={`ลบอาคาร “${dialog.building.name}”`}
          onConfirm={() => deleteBuilding(dialog.building.id)}
          onClose={close}
        />
      ) : null}
      {dialog?.kind === "delete-ward" ? (
        <ConfirmDelete
          title={`ลบ “${dialog.ward.name}”`}
          onConfirm={() => deleteWard(dialog.ward.id)}
          onClose={close}
        />
      ) : null}
    </div>
  );
}

function useSubmit(onClose: () => void, successMessage: string) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(fn: () => Promise<LocationResult>) {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        toast.success(successMessage);
        onClose();
      } else {
        setError(result.error);
      }
    });
  }

  return { isPending, error, submit };
}

function ErrorText({ error }: { error: string | null }) {
  return error ? (
    <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {error}
    </p>
  ) : null;
}

function BuildingDialog({ building, onClose }: { building: BuildingItem | null; onClose: () => void }) {
  const [name, setName] = useState(building?.name ?? "");
  const [code, setCode] = useState(building?.code ?? "");
  const { isPending, error, submit } = useSubmit(onClose, "บันทึกอาคารเรียบร้อยแล้ว");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{building ? "แก้ไขอาคาร" : "เพิ่มอาคาร"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <ErrorText error={error} />
          <div className="space-y-2">
            <Label htmlFor="building-name">ชื่ออาคาร</Label>
            <Input id="building-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="building-code">รหัสอาคาร (ภาษาอังกฤษ)</Label>
            <Input id="building-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="เช่น MED" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button disabled={isPending} onClick={() => submit(() => saveBuilding(building?.id ?? null, { name, code }))}>
            {isPending ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WardDialog({
  ward,
  buildingId,
  buildings,
  onClose,
}: {
  ward: WardItem | null;
  buildingId: string;
  buildings: BuildingItem[];
  onClose: () => void;
}) {
  const [building, setBuilding] = useState(buildingId);
  const [name, setName] = useState(ward?.name ?? "");
  const [category, setCategory] = useState<"DEDICATED" | "RESERVE">(ward?.category ?? "DEDICATED");
  const [bedCount, setBedCount] = useState(ward?.bedCount?.toString() ?? "");
  const { isPending, error, submit } = useSubmit(onClose, "บันทึกหอผู้ป่วย / จุดวางเรียบร้อยแล้ว");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{ward ? "แก้ไขหอผู้ป่วย / จุดวาง" : "เพิ่มหอผู้ป่วย / จุดวาง"}</DialogTitle>
          <DialogDescription>
            ประจำ = หอผู้ป่วยที่มีเตียงและเครื่องประจำ · สำรอง = จุดเก็บเครื่องสำรองของอาคาร
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <ErrorText error={error} />
          <div className="space-y-2">
            <Label>อาคาร</Label>
            <Select value={building} onValueChange={(v) => v && setBuilding(v)}>
              <SelectTrigger className="w-full">
                <SelectValue>{(v: string) => buildings.find((b) => b.id === v)?.name ?? v}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {buildings.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ward-name">ชื่อหอผู้ป่วย / จุดวาง</Label>
            <Input id="ward-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ประเภท</Label>
              <Select value={category} onValueChange={(v) => v && setCategory(v as "DEDICATED" | "RESERVE")}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v: string) => CATEGORY_LABEL[v]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEDICATED">{CATEGORY_LABEL.DEDICATED}</SelectItem>
                  <SelectItem value="RESERVE">{CATEGORY_LABEL.RESERVE}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ward-beds">จำนวนเตียง (ถ้ามี)</Label>
              <Input id="ward-beds" type="number" min={0} value={bedCount} onChange={(e) => setBedCount(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button
            disabled={isPending}
            onClick={() =>
              submit(() =>
                saveWard(ward?.id ?? null, {
                  buildingId: building,
                  name,
                  category,
                  bedCount: bedCount.trim() === "" ? null : Number(bedCount),
                }),
              )
            }
          >
            {isPending ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDelete({
  title,
  onConfirm,
  onClose,
}: {
  title: string;
  onConfirm: () => Promise<LocationResult>;
  onClose: () => void;
}) {
  const { isPending, error, submit } = useSubmit(onClose, "ลบเรียบร้อยแล้ว");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>การลบไม่สามารถย้อนกลับได้ ระบบจะไม่อนุญาตให้ลบหากยังมีเครื่องหรือข้อมูลอ้างอิงอยู่</DialogDescription>
        </DialogHeader>
        <ErrorText error={error} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button variant="destructive" disabled={isPending} onClick={() => submit(onConfirm)}>
            {isPending ? "กำลังลบ..." : "ลบ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
