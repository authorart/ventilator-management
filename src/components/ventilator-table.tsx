"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { STATUS_LABEL } from "@/lib/status";
import { reportProblem, updateStatus, moveVentilator } from "@/app/actions";
import { MoveType, VentilatorStatus } from "@prisma/client";
import type { Role } from "@/lib/permissions";
import { permissions } from "@/lib/permissions";

type WardOption = { id: string; label: string };

export type VentilatorRow = {
  id: string;
  assetNumber: string;
  deviceCode: string;
  brand: string;
  model: string;
  currentStatus: VentilatorStatus;
  wardId: string;
  wardLabel: string;
};

export function VentilatorTable({
  ventilators,
  wards,
  role,
}: {
  ventilators: VentilatorRow[];
  wards: WardOption[];
  role: Role;
}) {
  const canManage = permissions.canProcessMaintenance(role);

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>เลขครุภัณฑ์ / ID</TableHead>
            <TableHead>ยี่ห้อ/รุ่น</TableHead>
            <TableHead>ตำแหน่งปัจจุบัน</TableHead>
            <TableHead>สถานะ</TableHead>
            <TableHead className="text-right">การดำเนินการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ventilators.map((v) => (
            <TableRow key={v.id}>
              <TableCell>
                <div className="font-medium">{v.assetNumber}</div>
                <div className="text-xs text-muted-foreground">ID: {v.deviceCode}</div>
              </TableCell>
              <TableCell>
                {v.brand} {v.model}
              </TableCell>
              <TableCell>{v.wardLabel}</TableCell>
              <TableCell>
                <StatusBadge status={v.currentStatus} />
              </TableCell>
              <TableCell className="text-right space-x-2">
                <ReportProblemDialog ventilatorId={v.id} disabled={v.currentStatus === "DISPOSED"} />
                {canManage ? (
                  <>
                    <UpdateStatusDialog
                      ventilatorId={v.id}
                      currentStatus={v.currentStatus}
                    />
                    <MoveDialog ventilatorId={v.id} wards={wards.filter((w) => w.id !== v.wardId)} />
                  </>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
          {ventilators.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                ไม่พบเครื่องช่วยหายใจ
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}

function ReportProblemDialog({ ventilatorId, disabled }: { ventilatorId: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" disabled={disabled} />}>
        แจ้งปัญหา
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>แจ้งปัญหาเครื่องช่วยหายใจ</DialogTitle>
          <DialogDescription>
            ระบบจะเปลี่ยนสถานะเครื่องเป็น &ldquo;รอซ่อม&rdquo; และแจ้งศูนย์เครื่องมือ
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="problem-description">อาการ/ปัญหาที่พบ</Label>
          <Textarea
            id="problem-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button
            disabled={!description.trim() || isPending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await reportProblem(ventilatorId, description);
                  toast.success("แจ้งปัญหาเรียบร้อยแล้ว");
                  setOpen(false);
                  setDescription("");
                } catch {
                  toast.error("เกิดข้อผิดพลาด ไม่สามารถแจ้งปัญหาได้");
                }
              })
            }
          >
            ยืนยันการแจ้งปัญหา
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const MANAGEABLE_STATUSES = Object.values(VentilatorStatus);

function UpdateStatusDialog({
  ventilatorId,
  currentStatus,
}: {
  ventilatorId: string;
  currentStatus: VentilatorStatus;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<VentilatorStatus>(currentStatus);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        เปลี่ยนสถานะ
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เปลี่ยนสถานะเครื่อง</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>สถานะใหม่</Label>
            <Select value={status} onValueChange={(v) => v && setStatus(v as VentilatorStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue>{(v: VentilatorStatus) => STATUS_LABEL[v]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MANAGEABLE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status-note">หมายเหตุ (ถ้ามี)</Label>
            <Textarea id="status-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await updateStatus(ventilatorId, status, note || undefined);
                  toast.success("อัปเดตสถานะเรียบร้อยแล้ว");
                  setOpen(false);
                } catch {
                  toast.error("เกิดข้อผิดพลาด ไม่สามารถอัปเดตสถานะได้");
                }
              })
            }
          >
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const MOVE_TYPE_LABEL: Record<MoveType, string> = {
  ASSIGN: "จ่ายประจำ",
  WITHDRAW_RESERVE: "เบิกสำรอง/ยืม",
  RETURN_TO_STOCK: "คืนคลัง",
  SEND_FOR_REPAIR: "ส่งซ่อม",
  RETURN_FROM_REPAIR: "รับคืนจากซ่อม",
  DISPOSE: "จำหน่าย",
};

function MoveDialog({ ventilatorId, wards }: { ventilatorId: string; wards: WardOption[] }) {
  const [open, setOpen] = useState(false);
  const [toWardId, setToWardId] = useState<string>(wards[0]?.id ?? "");
  const [moveType, setMoveType] = useState<MoveType>(MoveType.ASSIGN);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        ย้ายเครื่อง
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ย้ายเครื่องช่วยหายใจ</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>ปลายทาง</Label>
            <Select value={toWardId} onValueChange={(v) => v && setToWardId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string) => wards.find((w) => w.id === v)?.label ?? v}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {wards.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>ประเภทการเคลื่อนย้าย</Label>
            <Select value={moveType} onValueChange={(v) => v && setMoveType(v as MoveType)}>
              <SelectTrigger className="w-full">
                <SelectValue>{(v: MoveType) => MOVE_TYPE_LABEL[v]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MOVE_TYPE_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="move-note">หมายเหตุ (ถ้ามี)</Label>
            <Textarea id="move-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!toWardId || isPending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await moveVentilator(ventilatorId, toWardId, moveType, note || undefined);
                  toast.success("ย้ายเครื่องเรียบร้อยแล้ว");
                  setOpen(false);
                } catch {
                  toast.error("เกิดข้อผิดพลาด ไม่สามารถย้ายเครื่องได้");
                }
              })
            }
          >
            ยืนยันการย้าย
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
