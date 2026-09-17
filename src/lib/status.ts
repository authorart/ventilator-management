import type { VentilatorStatus } from "@prisma/client";

export const STATUS_LABEL: Record<VentilatorStatus, string> = {
  AVAILABLE: "พร้อมใช้งาน",
  IN_USE: "กำลังใช้งานกับผู้ป่วย",
  AWAITING_REPAIR: "รอซ่อม",
  UNDER_MAINTENANCE: "กำลังซ่อมบำรุง",
  DAMAGED_PENDING_DISPOSAL: "ชำรุด/รอพิจารณาจำหน่าย",
  DISPOSED: "จำหน่ายแล้ว",
};

export const STATUS_BADGE_CLASS: Record<VentilatorStatus, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  IN_USE: "bg-blue-100 text-blue-800 border-blue-200",
  AWAITING_REPAIR: "bg-amber-100 text-amber-800 border-amber-200",
  UNDER_MAINTENANCE: "bg-orange-100 text-orange-800 border-orange-200",
  DAMAGED_PENDING_DISPOSAL: "bg-red-100 text-red-800 border-red-200",
  DISPOSED: "bg-gray-100 text-gray-600 border-gray-200",
};

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: "ผู้ดูแลระบบ",
  EQUIPMENT_CENTER: "เจ้าหน้าที่ศูนย์เครื่องมือ",
  WARD_STAFF: "เจ้าหน้าที่หอผู้ป่วย",
};
