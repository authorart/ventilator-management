"use client";

import { useActionState, useState } from "react";
import { Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/password-input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/app/change-password/actions";
import { cn } from "@/lib/utils";

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changePassword, {});
  const [next, setNext] = useState("");
  const fe = state.fieldErrors ?? {};

  const rules = [
    { ok: next.length >= 8, label: "อย่างน้อย 8 ตัวอักษร" },
    { ok: /[a-z]/.test(next), label: "ตัวอักษรพิมพ์เล็ก (a-z)" },
    { ok: /[A-Z]/.test(next), label: "ตัวอักษรพิมพ์ใหญ่ (A-Z)" },
    { ok: /[0-9]/.test(next), label: "ตัวเลข (0-9)" },
  ];

  return (
    <form action={formAction} className="space-y-4">
      {state.error && !Object.keys(fe).length ? (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Field label="รหัสผ่านปัจจุบัน" id="currentPassword" error={fe.currentPassword}>
        <PasswordInput id="currentPassword" name="currentPassword" autoComplete="current-password" required />
      </Field>

      <Field label="รหัสผ่านใหม่" id="newPassword" error={fe.newPassword}>
        <PasswordInput
          id="newPassword"
          name="newPassword"
          autoComplete="new-password"
          required
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          {rules.map((r) => (
            <li key={r.label} className={cn("flex items-center gap-1.5", r.ok ? "text-emerald-700" : "text-muted-foreground")}>
              {r.ok ? <Check className="size-3.5" /> : <Circle className="size-3" />}
              {r.label}
            </li>
          ))}
        </ul>
      </Field>

      <Field label="ยืนยันรหัสผ่านใหม่" id="confirmPassword" error={fe.confirmPassword}>
        <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" required />
      </Field>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">หลังบันทึก ระบบจะให้เข้าสู่ระบบใหม่ด้วยรหัสผ่านใหม่</p>
    </form>
  );
}

function Field({ label, id, error, children }: { label: string; id: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
