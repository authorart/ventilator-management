import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { permissions, type Role } from "@/lib/permissions";
import { AppHeader } from "@/components/app-header";
import { BackLink } from "@/components/back-link";
import { UserForm } from "@/components/user-form";
import { updateUser } from "@/app/users/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const role = session.user.role as Role;
  if (!permissions.canManageUsers(role)) {
    redirect("/");
  }

  const [user, wards] = await Promise.all([
    prisma.user.findUnique({ where: { id } }),
    prisma.ward.findMany({
      include: { building: true },
      orderBy: [{ building: { name: "asc" } }, { name: "asc" }],
    }),
  ]);

  if (!user) {
    notFound();
  }

  const boundAction = updateUser.bind(null, user.id);

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-6">
        <BackLink href="/users" label="กลับหน้าจัดการผู้ใช้งาน" />
        <div>
          <h1 className="text-lg font-semibold">แก้ไขผู้ใช้งาน — {user.fullName}</h1>
          <p className="text-sm text-muted-foreground">แก้ไขข้อมูลบัญชี บทบาท หรือรีเซ็ตรหัสผ่าน</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ข้อมูลบัญชี</CardTitle>
          </CardHeader>
          <CardContent>
            <UserForm
              action={boundAction}
              mode="edit"
              wards={wards.map((w) => ({ id: w.id, label: `${w.name} (${w.building.name})` }))}
              initialValues={{
                fullName: user.fullName,
                username: user.username,
                role: user.role,
                homeWardId: user.homeWardId ?? "",
                isActive: user.isActive,
              }}
              submitLabel="บันทึกการแก้ไข"
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
