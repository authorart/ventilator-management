"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { STAGE_CLASS, STAGE_LABEL, formatDateTime, formatMoney, type RepairStage } from "@/lib/maintenance";
import { completeRepair, startRepair, type MaintenanceResult } from "@/app/maintenance/actions";
import { cn } from "@/lib/utils";

export type RepairJob = {
  id: string;
  ventilatorId: string;
  assetNumber: string;
  deviceCode: string;
  brandModel: string;
  wardLabel: string;
  problem: string;
  reportedBy: string;
  reportedDate: string;
  startDate: string | null;
  completeDate: string | null;
  stage: RepairStage;
  vendorName: string | null;
  technicianName: string | null;
  cost: number | null;
  partsReplaced: string | null;
};

type Vendor = { id: string; name: string };
type Dialogs = { kind: "start" | "complete"; job: RepairJob } | null;

export function MaintenanceQueue({ jobs, vendors }: { jobs: RepairJob[]; vendors: Vendor[] }) {
  const [dialog, setDialog] = useState<Dialogs>(null);
  const close = () => setDialog(null);

  if (jobs.length === 0) {
    return (
      <p className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
        ไม่มีงานซ่อมในหมวดนี้
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {jobs.map((j) => {
          const open = !j.completeDate;
          return (
            <li key={j.id} className="rounded-xl border bg-card p-4 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/ventilators/${j.ventilatorId}`} className="font-semibold hover:text-primary hover:underline">
                      {j.assetNumber}
                    </Link>
                    <Badge variant="outline" className={cn("font-normal", STAGE_CLASS[j.stage])}>
                      {STAGE_LABEL[j.stage]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {j.brandModel} · ID {j.deviceCode} · {j.wardLabel}
                  </p>
                </div>
                {open ? (
                  <div className="flex gap-2">
                    {j.stage === "reported" ? (
                      <Button size="sm" onClick={() => setDialog({ kind: "start", job: j })}>
                        เริ่มซ่อม
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant={j.stage === "reported" ? "outline" : "default"}
                      onClick={() => setDialog({ kind: "complete", job: j })}
                    >
                      บันทึกผลซ่อม
                    </Button>
                  </div>
                ) : null}
              </div>

              <p className="mt-3 rounded-md bg-muted/60 px-3 py-2 text-sm">{j.problem}</p>

              <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                <Meta label="แจ้งโดย" value={`${j.reportedBy} · ${formatDateTime(new Date(j.reportedDate))}`} />
                {j.startDate ? <Meta label="เริ่มซ่อม" value={formatDateTime(new Date(j.startDate))} /> : null}
                {j.vendorName || j.technicianName ? (
                  <Meta label="ผู้ซ่อม" value={[j.vendorName, j.technicianName].filter(Boolean).join(" · ")} />
                ) : null}
                {j.completeDate ? <Meta label="ปิดงาน" value={formatDateTime(new Date(j.completeDate))} /> : null}
                {j.cost != null ? <Meta label="ค่าใช้จ่าย" value={formatMoney(j.cost)} /> : null}
                {j.partsReplaced ? <Meta label="อะไหล่ที่เปลี่ยน" value={j.partsReplaced} /> : null}
              </dl>
            </li>
          );
        })}
      </ul>

      {dialog?.kind === "start" ? <StartDialog job={dialog.job} vendors={vendors} onClose={close} /> : null}
      {dialog?.kind === "complete" ? <CompleteDialog job={dialog.job} onClose={close} /> : null}
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="inline">{label}: </dt>
      <dd className="inline text-foreground">{value}</dd>
    </div>
  );
}

function useSubmit(onClose: () => void, successMessage: string) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(fn: () => Promise<MaintenanceResult>) {
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

const NO_VENDOR = "__none__";

function StartDialog({ job, vendors, onClose }: { job: RepairJob; vendors: Vendor[]; onClose: () => void }) {
  const [vendorId, setVendorId] = useState(NO_VENDOR);
  const [technician, setTechnician] = useState("");
  const { isPending, error, submit } = useSubmit(onClose, "เริ่มดำเนินการซ่อมแล้ว");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เริ่มซ่อม — {job.assetNumber}</DialogTitle>
          <DialogDescription>สถานะเครื่องจะเปลี่ยนเป็น &ldquo;กำลังซ่อมบำรุง&rdquo;</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <ErrorText error={error} />
          <div className="space-y-2">
            <Label>ผู้รับซ่อม (ถ้ามี)</Label>
            <Select value={vendorId} onValueChange={(v) => v && setVendorId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string) => (v === NO_VENDOR ? "ซ่อมภายใน / ไม่ระบุ" : (vendors.find((x) => x.id === v)?.name ?? v))}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_VENDOR}>ซ่อมภายใน / ไม่ระบุ</SelectItem>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="technician">ชื่อช่างผู้ซ่อม (ถ้ามี)</Label>
            <Input id="technician" value={technician} onChange={(e) => setTechnician(e.target.value)} />
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
                startRepair(job.id, { vendorId: vendorId === NO_VENDOR ? null : vendorId, technicianName: technician }),
              )
            }
          >
            {isPending ? "กำลังบันทึก..." : "เริ่มซ่อม"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type Result = "REPAIRED" | "AWAITING_PARTS" | "UNREPAIRABLE";

const RESULT_INFO: Record<Result, { label: string; hint: string }> = {
  REPAIRED: { label: "ซ่อมเสร็จ", hint: "ปิดงาน และเครื่องกลับเป็น “พร้อมใช้งาน”" },
  AWAITING_PARTS: { label: "รออะไหล่", hint: "งานยังไม่ปิด เครื่องคงสถานะ “กำลังซ่อมบำรุง”" },
  UNREPAIRABLE: { label: "ซ่อมไม่ได้", hint: "ปิดงาน และเครื่องเป็น “ชำรุด/รอพิจารณาจำหน่าย”" },
};

function CompleteDialog({ job, onClose }: { job: RepairJob; onClose: () => void }) {
  const [result, setResult] = useState<Result>("REPAIRED");
  const [cost, setCost] = useState(job.cost?.toString() ?? "");
  const [parts, setParts] = useState(job.partsReplaced ?? "");
  const { isPending, error, submit } = useSubmit(onClose, "บันทึกผลซ่อมเรียบร้อยแล้ว");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>บันทึกผลซ่อม — {job.assetNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <ErrorText error={error} />
          <div className="space-y-2">
            <Label>ผลการซ่อม</Label>
            <Select value={result} onValueChange={(v) => v && setResult(v as Result)}>
              <SelectTrigger className="w-full">
                <SelectValue>{(v: Result) => RESULT_INFO[v].label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(RESULT_INFO) as Result[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    {RESULT_INFO[r].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{RESULT_INFO[result].hint}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="repair-cost">ค่าใช้จ่าย (บาท)</Label>
            <Input id="repair-cost" type="number" min={0} step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="repair-parts">อะไหล่ที่เปลี่ยน / รายละเอียด</Label>
            <Textarea id="repair-parts" rows={3} value={parts} onChange={(e) => setParts(e.target.value)} />
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
                completeRepair(job.id, {
                  result,
                  cost: cost.trim() === "" ? null : Number(cost),
                  partsReplaced: parts,
                }),
              )
            }
          >
            {isPending ? "กำลังบันทึก..." : "บันทึกผล"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
