import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { permissions, type Role } from "@/lib/permissions";
import { AppHeader } from "@/components/app-header";
import { BackLink } from "@/components/back-link";
import { VentilatorForm } from "@/components/ventilator-form";
import { createVentilator } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewVentilatorPage() {
  const session = await auth();
  if (!session?.user) return null;

  const role = session.user.role as Role;
  if (!permissions.canEditFleet(role)) {
    redirect("/");
  }

  const [wards, vendors] = await Promise.all([
    prisma.ward.findMany({
      include: { building: true },
      orderBy: [{ building: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-6">
        <BackLink href="/ventilators" label="กลับรายการเครื่อง" />
        <div>
          <h1 className="text-lg font-semibold">เพิ่มเครื่องช่วยหายใจใหม่</h1>
          <p className="text-sm text-muted-foreground">ลงทะเบียนเครื่องใหม่เข้าสู่ระบบ</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ข้อมูลเครื่อง</CardTitle>
          </CardHeader>
          <CardContent>
            <VentilatorForm
              action={createVentilator}
              wards={wards.map((w) => ({ id: w.id, label: `${w.name} (${w.building.name})` }))}
              vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
              submitLabel="เพิ่มเครื่อง"
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
