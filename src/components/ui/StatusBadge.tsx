import { cn } from "@/lib/utils";
import type { RequestStatus } from "@/types/deviation";

const statusConfig: Record<RequestStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-warning/20 text-warning" },
  approved: { label: "Approved", className: "bg-success/20 text-success" },
  rejected: { label: "Rejected", className: "bg-destructive/20 text-destructive" },
  in_review: { label: "In Review", className: "bg-primary/20 text-primary" },
  escalated: { label: "Escalated", className: "bg-destructive/20 text-destructive" },
};

export function StatusBadge({ status, className }: { status: RequestStatus; className?: string }) {
  const config = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-mono font-semibold", config.className, className)}>
      {config.label}
    </span>
  );
}
