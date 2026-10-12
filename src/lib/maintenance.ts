export type RepairStage = "reported" | "in_progress" | "awaiting_parts" | "repaired" | "unrepairable";

export function repairStage(r: {
  startDate: Date | null;
  completeDate: Date | null;
  result: string | null;
}): RepairStage {
  if (r.completeDate) return r.result === "UNREPAIRABLE" ? "unrepairable" : "repaired";
  if (r.result === "AWAITING_PARTS") return "awaiting_parts";
  return r.startDate ? "in_progress" : "reported";
}

export const isOpenStage = (s: RepairStage) => s === "reported" || s === "in_progress" || s === "awaiting_parts";

export const STAGE_LABEL: Record<RepairStage, string> = {
  reported: "รอรับเรื่อง",
  in_progress: "กำลังซ่อม",
  awaiting_parts: "รออะไหล่",
  repaired: "ซ่อมเสร็จ",
  unrepairable: "ซ่อมไม่ได้",
};

export const STAGE_CLASS: Record<RepairStage, string> = {
  reported: "bg-amber-100 text-amber-800 border-amber-200",
  in_progress: "bg-orange-100 text-orange-800 border-orange-200",
  awaiting_parts: "bg-purple-100 text-purple-800 border-purple-200",
  repaired: "bg-emerald-100 text-emerald-800 border-emerald-200",
  unrepairable: "bg-red-100 text-red-800 border-red-200",
};

export const MOVE_TYPE_LABEL: Record<string, string> = {
  ASSIGN: "จ่ายประจำ",
  WITHDRAW_RESERVE: "เบิกสำรอง/ยืม",
  RETURN_TO_STOCK: "คืนคลัง",
  SEND_FOR_REPAIR: "ส่งซ่อม",
  RETURN_FROM_REPAIR: "รับคืนจากซ่อม",
  DISPOSE: "จำหน่าย",
};

const dateTime = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Bangkok",
});
const dateOnly = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeZone: "Asia/Bangkok" });

export const formatDateTime = (d: Date | null | undefined) => (d ? dateTime.format(d) : "—");
export const formatDate = (d: Date | null | undefined) => (d ? dateOnly.format(d) : "—");
export const formatMoney = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(n);
