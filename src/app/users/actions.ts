"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { permissions, type Role } from "@/lib/permissions";
import { DEFAULT_PASSWORD, userCreateSchema, userUpdateSchema } from "@/lib/validation";
import { Prisma } from "@prisma/client";

export type UserFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }
  const role = session.user.role as Role;
  if (!permissions.canManageUsers(role)) {
    throw new Error("คุณไม่มีสิทธิ์จัดการผู้ใช้งาน");
  }
  return session;
}

function fieldErrorsFromZod(error: import("zod").ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string") fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export async function createUser(
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "ไม่มีสิทธิ์" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = userCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "กรุณาตรวจสอบข้อมูลที่กรอก", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  try {
    await prisma.user.create({
      data: {
        fullName: parsed.data.fullName,
        username: parsed.data.username,
        passwordHash,
        mustChangePassword: true,
        role: parsed.data.role,
        homeWardId: parsed.data.role === "WARD_STAFF" ? parsed.data.homeWardId : null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว", fieldErrors: { username: "ชื่อผู้ใช้นี้ถูกใช้แล้ว" } };
    }
    throw error;
  }

  revalidatePath("/users");
  redirect("/users");
}

export async function updateUser(
  userId: string,
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  let session;
  try {
    session = await requireAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "ไม่มีสิทธิ์" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = userUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "กรุณาตรวจสอบข้อมูลที่กรอก", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  if (userId === session.user.id && parsed.data.isActive === "false") {
    return { error: "ไม่สามารถปิดการใช้งานบัญชีของตัวเองได้" };
  }
  if (userId === session.user.id && parsed.data.role !== "ADMIN") {
    return { error: "ไม่สามารถเปลี่ยนบทบาทของตัวเองออกจากผู้ดูแลระบบได้" };
  }

  const data: Prisma.UserUpdateInput = {
    fullName: parsed.data.fullName,
    role: parsed.data.role,
    homeWard: parsed.data.role === "WARD_STAFF" && parsed.data.homeWardId
      ? { connect: { id: parsed.data.homeWardId } }
      : { disconnect: true },
    isActive: parsed.data.isActive === "true",
  };

  if (parsed.data.resetPassword === "true") {
    data.passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    data.mustChangePassword = true;
  }

  await prisma.user.update({ where: { id: userId }, data });

  revalidatePath("/users");
  redirect("/users");
}
