import { cn } from "@/lib/utils";
import type { UrgencyLevel } from "@/types/deviation";

const urgencyConfig: Record<UrgencyLevel, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-muted text-muted-foreground" },
  medium: { label: "Medium", className: "bg-primary/20 text-primary" },
  high: { label: "High", className: "bg-warning/20 text-warning" },
  critical: { label: "Critical", className: "bg-destructive/20 text-destructive" },
};

export function UrgencyBadge({ urgency, className }: { urgency: UrgencyLevel; className?: string }) {
  const config = urgencyConfig[urgency];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-mono font-semibold", config.className, className)}>
      {config.label}
    </span>
  );
}
