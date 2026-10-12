import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { permissions, type Role } from "@/lib/permissions";
import { AppHeader } from "@/components/app-header";
import { BackLink } from "@/components/back-link";
import { UserForm } from "@/components/user-form";
import { createUser } from "@/app/users/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewUserPage() {
  const session = await auth();
  if (!session?.user) return null;

  const role = session.user.role as Role;
  if (!permissions.canManageUsers(role)) {
    redirect("/");
  }

  const wards = await prisma.ward.findMany({
    include: { building: true },
    orderBy: [{ building: { name: "asc" } }, { name: "asc" }],
  });

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-6">
        <BackLink href="/users" label="กลับหน้าจัดการผู้ใช้งาน" />
        <div>
          <h1 className="text-lg font-semibold">เพิ่มผู้ใช้งานใหม่</h1>
          <p className="text-sm text-muted-foreground">สร้างบัญชีผู้ใช้งานใหม่สำหรับเจ้าหน้าที่</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ข้อมูลบัญชี</CardTitle>
          </CardHeader>
          <CardContent>
            <UserForm
              action={createUser}
              mode="create"
              wards={wards.map((w) => ({ id: w.id, label: `${w.name} (${w.building.name})` }))}
              submitLabel="เพิ่มผู้ใช้งาน"
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
