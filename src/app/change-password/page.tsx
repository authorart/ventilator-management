import { auth } from "@/auth";
import { AppHeader } from "@/components/app-header";
import { ChangePasswordForm } from "@/components/change-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ChangePasswordPage() {
  const session = await auth();
  const forced = session?.user.mustChangePassword ?? false;

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AppHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{forced ? "ตั้งรหัสผ่านใหม่" : "เปลี่ยนรหัสผ่าน"}</CardTitle>
            <CardDescription>
              {forced
                ? "นี่เป็นการเข้าใช้งานครั้งแรก (หรือรหัสผ่านถูกรีเซ็ต) กรุณาตั้งรหัสผ่านใหม่ก่อนใช้งานระบบ"
                : "กรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
