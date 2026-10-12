import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { permissions, type Role } from "@/lib/permissions";
import { AppHeader } from "@/components/app-header";
import { BackLink } from "@/components/back-link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROLE_LABEL } from "@/lib/status";
import { Plus } from "lucide-react";

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user) return null;

  const role = session.user.role as Role;
  if (!permissions.canManageUsers(role)) {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    include: { homeWard: { include: { building: true } } },
    orderBy: { fullName: "asc" },
  });

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AppHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 py-6">
        <BackLink href="/" label="กลับหน้าแดชบอร์ด" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">จัดการผู้ใช้งาน</h1>
            <p className="text-sm text-muted-foreground">รายชื่อบัญชีผู้ใช้งานทั้งหมดในระบบ</p>
          </div>
          <Button size="sm" nativeButton={false} render={<Link href="/users/new" />}>
            <Plus className="size-4" />
            เพิ่มผู้ใช้ใหม่
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ-สกุล / ชื่อผู้ใช้</TableHead>
                <TableHead>บทบาท</TableHead>
                <TableHead>หอผู้ป่วยต้นสังกัด</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.fullName}</div>
                    <div className="text-xs text-muted-foreground">{u.username}</div>
                  </TableCell>
                  <TableCell>{ROLE_LABEL[u.role] ?? u.role}</TableCell>
                  <TableCell>
                    {u.homeWard ? `${u.homeWard.name} (${u.homeWard.building.name})` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={u.isActive ? "text-emerald-700" : "text-muted-foreground"}>
                      {u.isActive ? "ใช้งานได้" : "ปิดการใช้งาน"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/users/${u.id}/edit`} />}
                    >
                      แก้ไข
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
