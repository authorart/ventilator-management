"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABEL } from "@/lib/status";
import { DEFAULT_PASSWORD } from "@/lib/validation";

type WardOption = { id: string; label: string };
type FormState = { error?: string; fieldErrors?: Record<string, string> };

const ROLES = ["ADMIN", "EQUIPMENT_CENTER", "WARD_STAFF"] as const;

export function UserForm({
  action,
  wards,
  mode,
  initialValues,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  wards: WardOption[];
  mode: "create" | "edit";
  initialValues?: {
    fullName?: string;
    username?: string;
    role?: string;
    homeWardId?: string;
    isActive?: boolean;
  };
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, {});
  const fieldErrors = state.fieldErrors ?? {};
  // Controlled so a failed submit (React resets uncontrolled fields) keeps what was typed.
  const [fullName, setFullName] = useState(initialValues?.fullName ?? "");
  const [username, setUsername] = useState(initialValues?.username ?? "");
  const [homeWardId, setHomeWardId] = useState(initialValues?.homeWardId ?? "");
  const [role, setRole] = useState(initialValues?.role ?? "WARD_STAFF");

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="ชื่อ-สกุล" htmlFor="fullName" error={fieldErrors.fullName}>
          <Input id="fullName" name="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </Field>

        {mode === "create" ? (
          <Field label="ชื่อผู้ใช้" htmlFor="username" error={fieldErrors.username}>
            <Input id="username" name="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </Field>
        ) : (
          <Field label="ชื่อผู้ใช้" htmlFor="username-display">
            <Input id="username-display" value={initialValues?.username} disabled />
          </Field>
        )}

        <Field label="บทบาท" htmlFor="role" error={fieldErrors.role}>
          <Select name="role" value={role} onValueChange={(v) => v && setRole(v)} required>
            <SelectTrigger className="w-full">
              <SelectValue>{(v: string) => ROLE_LABEL[v] ?? v}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABEL[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {role === "WARD_STAFF" ? (
        <Field
          label="หอผู้ป่วยต้นสังกัด *"
          htmlFor="homeWardId"
          error={fieldErrors.homeWardId}
        >
          <Select name="homeWardId" value={homeWardId || null} onValueChange={(v) => setHomeWardId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v: string) => wards.find((w) => w.id === v)?.label ?? "เลือกหอผู้ป่วย"}
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
        </Field>
        ) : null}

        {mode === "edit" ? (
          <Field label="สถานะบัญชี" htmlFor="isActive" error={fieldErrors.isActive}>
            <Select name="isActive" defaultValue={initialValues?.isActive === false ? "false" : "true"}>
              <SelectTrigger className="w-full">
                <SelectValue>{(v: string) => (v === "true" ? "ใช้งานได้" : "ปิดการใช้งาน")}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">ใช้งานได้</SelectItem>
                <SelectItem value="false">ปิดการใช้งาน</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        ) : null}
      </div>

      {mode === "create" ? (
        <p className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          ระบบจะตั้งรหัสผ่านเริ่มต้นเป็น <code className="font-mono font-medium text-foreground">{DEFAULT_PASSWORD}</code>{" "}
          และบังคับให้ผู้ใช้เปลี่ยนรหัสผ่านเมื่อเข้าใช้งานครั้งแรก
        </p>
      ) : (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="resetPassword" value="true" className="mt-1 size-4" />
          <span>
            รีเซ็ตรหัสผ่านเป็นค่าเริ่มต้น (<code className="font-mono">{DEFAULT_PASSWORD}</code>)
            <span className="block text-xs text-muted-foreground">ผู้ใช้จะต้องตั้งรหัสผ่านใหม่เมื่อเข้าสู่ระบบครั้งถัดไป</span>
          </span>
        </label>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "กำลังบันทึก..." : submitLabel}
        </Button>
        <Button type="button" variant="outline" nativeButton={false} render={<Link href="/users" />}>
          ยกเลิก
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
