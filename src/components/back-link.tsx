import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackLink({ href = "/", label = "กลับหน้าหลัก" }: { href?: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      {label}
    </Link>
  );
}
