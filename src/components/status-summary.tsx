import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_LABEL, STATUS_BADGE_CLASS } from "@/lib/status";
import { VentilatorStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

export function StatusSummary({ counts }: { counts: Partial<Record<VentilatorStatus, number>> }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {Object.values(VentilatorStatus).map((status) => (
        <Card key={status} className="gap-1 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-xs font-normal text-muted-foreground">
              {STATUS_LABEL[status]}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <span
              className={cn(
                "inline-flex items-center justify-center rounded-md border px-2 text-2xl font-semibold",
                STATUS_BADGE_CLASS[status],
              )}
            >
              {counts[status] ?? 0}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
