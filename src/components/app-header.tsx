import Link from "next/link";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { NavLinks, type NavItem } from "@/components/nav-links";
import { ROLE_LABEL } from "@/lib/status";
import { permissions, type Role } from "@/lib/permissions";
import { Stethoscope } from "lucide-react";

export async function AppHeader() {
  const session = await auth();
  const role = session?.user.role as Role | undefined;

  const forced = session?.user.mustChangePassword ?? false;
  const navItems: NavItem[] = [{ href: "/", label: "แดชบอร์ด" }, { href: "/ventilators", label: "เครื่องช่วยหายใจ" }];
  if (role && permissions.canProcessMaintenance(role)) {
    navItems.push({ href: "/maintenance", label: "งานซ่อม" });
  }
  if (role && permissions.canManageLocations(role)) {
    navItems.push({ href: "/locations", label: "จัดการสถานที่" });
  }
  if (role && permissions.canManageUsers(role)) {
    navItems.push({ href: "/users", label: "จัดการผู้ใช้งาน" });
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-card shadow-xs">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 pt-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md pb-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="ไปหน้าแดชบอร์ด"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Stethoscope className="size-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold leading-tight">ระบบฐานข้อมูลเครื่องช่วยหายใจ</span>
            <span className="block text-xs leading-tight text-muted-foreground">โรงพยาบาลมหาสารคาม</span>
          </span>
        </Link>
        {session?.user ? (
          <div className="flex items-center gap-3 pb-2">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{session.user.name}</p>
              <p className="text-xs leading-tight text-muted-foreground">
                {ROLE_LABEL[session.user.role] ?? session.user.role}
              </p>
            </div>
            {!forced ? (
              <Link href="/change-password" className="text-xs text-muted-foreground hover:text-foreground hover:underline">
                เปลี่ยนรหัสผ่าน
              </Link>
            ) : null}
            <SignOutButton />
          </div>
        ) : null}
      </div>
      {session?.user && !forced ? (
        <div className="mx-auto max-w-6xl px-4">
          <NavLinks items={navItems} />
        </div>
      ) : null}
    </header>
  );
}
