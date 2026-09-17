import type { VentilatorStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, STATUS_BADGE_CLASS } from "@/lib/status";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: VentilatorStatus }) {
  return (
    <Badge variant="outline" className={cn("font-normal", STATUS_BADGE_CLASS[status])}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
