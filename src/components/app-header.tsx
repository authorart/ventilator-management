import { auth } from "@/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { ROLE_LABEL } from "@/lib/status";
import { Stethoscope } from "lucide-react";

export async function AppHeader() {
  const session = await auth();

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Stethoscope className="size-6 text-primary" />
          <div>
            <p className="text-sm font-semibold leading-tight">ระบบฐานข้อมูลเครื่องช่วยหายใจ</p>
            <p className="text-xs text-muted-foreground leading-tight">โรงพยาบาลมหาสารคาม</p>
          </div>
        </div>
        {session?.user ? (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium leading-tight">{session.user.name}</p>
              <p className="text-xs text-muted-foreground leading-tight">
                {ROLE_LABEL[session.user.role] ?? session.user.role}
              </p>
            </div>
            <SignOutButton />
          </div>
        ) : null}
      </div>
    </header>
  );
}
