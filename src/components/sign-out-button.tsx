"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <Button variant="ghost" size="sm" onClick={() => signOut({ redirectTo: "/login" })}>
      <LogOut className="size-4" />
      ออกจากระบบ
    </Button>
  );
}
