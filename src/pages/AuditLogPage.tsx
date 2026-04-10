import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDeviations } from "@/contexts/DeviationContext";
import { ROLE_LABELS } from "@/types/deviation";
import { Search, Download, ChevronDown, ChevronUp, Shield } from "lucide-react";

export default function AuditLogPage() {
  const { activityLog, getDeviationById } = useDeviations();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return activityLog.filter(
      (l) =>
        l.requestId.toLowerCase().includes(term) ||
        l.action.toLowerCase().includes(term) ||
        l.actorName.toLowerCase().includes(term) ||
        l.details.toLowerCase().includes(term)
    );
  }, [activityLog, searchTerm]);

  const exportCSV = () => {
    const headers = ["Log ID", "Request ID", "Action", "Actor", "Role", "Timestamp", "Details"];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.requestId,
      l.action,
      l.actorName,
      ROLE_LABELS[l.actorRole],
      new Date(l.timestamp).toISOString(),
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    // Include approval thread data for each unique request
    const uniqueRequests = [...new Set(filteredLogs.map((l) => l.requestId))];
    uniqueRequests.forEach((reqId) => {
      const dev = getDeviationById(reqId);
      if (dev) {
        dev.approvalChain
          .filter((s) => s.status !== "pending")
          .forEach((step) => {
            rows.push([
              `CHAIN-${reqId}-${step.stage}`,
              reqId,
              `Approval Chain: ${step.status}`,
              step.approverName,
              ROLE_LABELS[step.approverRole],
              step.timestamp || "",
              `"${step.comment || step.aiRecommendation || "No comment"}"`,
            ]);
          });
      }
    });

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deviq_audit_log_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by Request ID, action, or actor..."
            className="pl-10 bg-muted/30 border-border/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={exportCSV} variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Immutable Audit Log</h3>
          <span className="text-[10px] text-muted-foreground ml-auto">{filteredLogs.length} entries</span>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left text-xs text-muted-foreground font-medium py-2 px-3">ID</th>
                <th className="text-left text-xs text-muted-foreground font-medium py-2 px-3">Request</th>
                <th className="text-left text-xs text-muted-foreground font-medium py-2 px-3">Action</th>
                <th className="text-left text-xs text-muted-foreground font-medium py-2 px-3">Actor</th>
                <th className="text-left text-xs text-muted-foreground font-medium py-2 px-3">Role</th>
                <th className="text-left text-xs text-muted-foreground font-medium py-2 px-3">Time</th>
                <th className="text-left text-xs text-muted-foreground font-medium py-2 px-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, i) => {
                const dev = getDeviationById(log.requestId);
                const isExpanded = expandedId === log.id;
                return (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-border/10 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-3 font-mono text-xs text-muted-foreground">{log.id}</td>
                    <td className="py-3 px-3 font-mono text-xs text-primary">{log.requestId}</td>
                    <td className="py-3 px-3 text-xs text-foreground font-medium">{log.action}</td>
                    <td className="py-3 px-3 text-xs text-foreground">{log.actorName}</td>
                    <td className="py-3 px-3 text-xs text-muted-foreground">{ROLE_LABELS[log.actorRole]}</td>
                    <td className="py-3 px-3 text-xs text-muted-foreground font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-3 px-3">
                      <button onClick={() => setExpandedId(isExpanded ? null : log.id)}>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </td>
                    {isExpanded && (
                      <td colSpan={7} className="border-b border-border/20">
                        <div className="px-6 py-3 bg-muted/10 space-y-2">
                          <div className="text-xs text-foreground">{log.details}</div>
                          {dev && (
                            <div className="space-y-1 mt-2">
                              <div className="text-xs text-muted-foreground font-semibold">Decision Thread:</div>
                              {dev.approvalChain
                                .filter((s) => s.status !== "pending")
                                .map((step, si) => (
                                  <div key={si} className="text-[11px] text-muted-foreground">
                                    <span className={step.status === "approved" ? "text-success" : step.status === "rejected" ? "text-destructive" : "text-muted-foreground"}>
                                      [{step.status.toUpperCase()}]
                                    </span>{" "}
                                    {step.approverName} ({ROLE_LABELS[step.approverRole]}) — {step.timestamp ? new Date(step.timestamp).toLocaleString() : ""}
                                    {step.comment && <span className="italic ml-2">"{step.comment}"</span>}
                                    {step.isOverride && <span className="text-warning ml-2">[OVERRIDE]</span>}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
