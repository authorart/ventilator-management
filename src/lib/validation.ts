import { z } from "zod";

export const ventilatorFormSchema = z.object({
  assetNumber: z.string().trim().min(1, "กรุณาระบุเลขครุภัณฑ์"),
  serialNumber: z.string().trim().min(1, "กรุณาระบุ Serial number"),
  deviceCode: z.string().trim().min(1, "กรุณาระบุ ID เครื่อง"),
  brand: z.string().trim().min(1, "กรุณาระบุยี่ห้อ"),
  model: z.string().trim().min(1, "กรุณาระบุรุ่น"),
  registrationDate: z.string().min(1, "กรุณาระบุวันที่ลงทะเบียน"),
  purchaseDate: z.string().optional(),
  purchasePrice: z.string().optional(),
  warrantyExpiryDate: z.string().optional(),
  vendorId: z.string().optional(),
  currentWardId: z.string().optional(),
});

export type VentilatorFormValues = z.infer<typeof ventilatorFormSchema>;

export const DEFAULT_PASSWORD = "Ventilator07";

export const passwordSchema = z
  .string()
  .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
  .regex(/[a-z]/, "ต้องมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว")
  .regex(/[A-Z]/, "ต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว")
  .regex(/[0-9]/, "ต้องมีตัวเลขอย่างน้อย 1 ตัว");

const roleEnum = z.enum(["ADMIN", "EQUIPMENT_CENTER", "WARD_STAFF"]);

// Ward staff are scoped to exactly one ward, so a home ward is mandatory for them.
function requireWardForStaff(
  v: { role: string; homeWardId?: string },
  ctx: z.RefinementCtx,
) {
  if (v.role === "WARD_STAFF" && !v.homeWardId) {
    ctx.addIssue({
      code: "custom",
      path: ["homeWardId"],
      message: "กรุณาเลือกหอผู้ป่วยต้นสังกัดสำหรับเจ้าหน้าที่หอผู้ป่วย",
    });
  }
}

export const userCreateSchema = z
  .object({
    fullName: z.string().trim().min(1, "กรุณาระบุชื่อ-สกุล"),
    username: z
      .string()
      .trim()
      .min(3, "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร")
      .regex(/^[a-zA-Z0-9._-]+$/, "ใช้ได้เฉพาะตัวอักษรอังกฤษ ตัวเลข . _ -"),
    role: roleEnum,
    homeWardId: z.string().optional(),
  })
  .superRefine(requireWardForStaff);

export const userUpdateSchema = z
  .object({
    fullName: z.string().trim().min(1, "กรุณาระบุชื่อ-สกุล"),
    role: roleEnum,
    homeWardId: z.string().optional(),
    isActive: z.enum(["true", "false"]),
    resetPassword: z.string().optional(),
  })
  .superRefine(requireWardForStaff);

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "กรุณากรอกรหัสผ่านปัจจุบัน"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่านใหม่"),
  })
  .superRefine((v, ctx) => {
    if (v.newPassword !== v.confirmPassword) {
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "รหัสผ่านใหม่ไม่ตรงกัน" });
    }
    if (v.newPassword === v.currentPassword) {
      ctx.addIssue({ code: "custom", path: ["newPassword"], message: "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม" });
    }
  });

export type UserCreateValues = z.infer<typeof userCreateSchema>;
export type UserUpdateValues = z.infer<typeof userUpdateSchema>;

export const buildingSchema = z.object({
  name: z.string().trim().min(1, "กรุณาระบุชื่ออาคาร"),
  code: z
    .string()
    .trim()
    .min(1, "กรุณาระบุรหัสอาคาร")
    .regex(/^[A-Za-z0-9_-]+$/, "ใช้ได้เฉพาะตัวอักษรอังกฤษ ตัวเลข _ -"),
});

export const wardSchema = z.object({
  buildingId: z.string().min(1, "กรุณาเลือกอาคาร"),
  name: z.string().trim().min(1, "กรุณาระบุชื่อหอผู้ป่วย / จุดวาง"),
  category: z.enum(["DEDICATED", "RESERVE"]),
  bedCount: z.number().int("ต้องเป็นจำนวนเต็ม").min(0, "ต้องไม่ติดลบ").nullable(),
});

export type BuildingValues = z.infer<typeof buildingSchema>;
export type WardValues = z.infer<typeof wardSchema>;

export const startRepairSchema = z.object({
  vendorId: z.string().nullable(),
  technicianName: z.string().trim().max(200),
});

export const completeRepairSchema = z.object({
  result: z.enum(["REPAIRED", "AWAITING_PARTS", "UNREPAIRABLE"]),
  cost: z.number().min(0, "ค่าใช้จ่ายต้องไม่ติดลบ").nullable(),
  partsReplaced: z.string().trim().max(1000),
});

export type StartRepairValues = z.infer<typeof startRepairSchema>;
export type CompleteRepairValues = z.infer<typeof completeRepairSchema>;
