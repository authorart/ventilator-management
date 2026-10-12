import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { permissions, type Role } from "@/lib/permissions";
import { AppHeader } from "@/components/app-header";
import { PageHeader } from "@/components/page-header";
import { LocationManager } from "@/components/location-manager";

export default async function LocationsPage() {
  const session = await auth();
  if (!session?.user) return null;

  if (!permissions.canManageLocations(session.user.role as Role)) {
    redirect("/");
  }

  const buildings = await prisma.building.findMany({
    orderBy: { name: "asc" },
    include: {
      wards: {
        orderBy: [{ category: "asc" }, { name: "asc" }],
        include: { _count: { select: { ventilators: true } } },
      },
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AppHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-5 px-4 py-6">
        <PageHeader
          title="จัดการสถานที่"
          description="อาคารและหอผู้ป่วย / จุดวางเครื่องช่วยหายใจ"
        />
        <LocationManager
          buildings={buildings.map((b) => ({
            id: b.id,
            name: b.name,
            code: b.code,
            wards: b.wards.map((w) => ({
              id: w.id,
              name: w.name,
              category: w.category,
              bedCount: w.bedCount,
              ventilatorCount: w._count.ventilators,
            })),
          }))}
        />
      </main>
    </div>
  );
}
