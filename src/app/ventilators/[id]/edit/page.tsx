import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { permissions, type Role } from "@/lib/permissions";
import { AppHeader } from "@/components/app-header";
import { BackLink } from "@/components/back-link";
import { VentilatorForm } from "@/components/ventilator-form";
import { updateVentilator } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export default async function EditVentilatorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const role = session.user.role as Role;
  if (!permissions.canEditFleet(role)) {
    redirect("/");
  }

  const [ventilator, vendors] = await Promise.all([
    prisma.ventilator.findUnique({ where: { id } }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!ventilator) {
    notFound();
  }

  const boundAction = updateVentilator.bind(null, ventilator.id);

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-6">
        <BackLink href="/ventilators" label="กลับรายการเครื่อง" />
        <div>
          <h1 className="text-lg font-semibold">แก้ไขข้อมูลเครื่อง — {ventilator.assetNumber}</h1>
          <p className="text-sm text-muted-foreground">
            แก้ไขข้อมูลทะเบียนเครื่อง (การย้ายตำแหน่ง/เปลี่ยนสถานะ ทำได้จากหน้าหลัก)
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ข้อมูลเครื่อง</CardTitle>
          </CardHeader>
          <CardContent>
            <VentilatorForm
              action={boundAction}
              vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
              initialValues={{
                assetNumber: ventilator.assetNumber,
                serialNumber: ventilator.serialNumber,
                deviceCode: ventilator.deviceCode,
                brand: ventilator.brand,
                model: ventilator.model,
                registrationDate: toDateInputValue(ventilator.registrationDate),
                purchaseDate: toDateInputValue(ventilator.purchaseDate),
                purchasePrice: ventilator.purchasePrice?.toString() ?? "",
                warrantyExpiryDate: toDateInputValue(ventilator.warrantyExpiryDate),
                vendorId: ventilator.vendorId ?? "",
              }}
              submitLabel="บันทึกการแก้ไข"
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
