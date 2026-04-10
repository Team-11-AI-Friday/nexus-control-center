import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { mockDeviations } from "@/data/mockData";
import { DEVIATION_TYPE_LABELS, STAGE_LABELS, ROLE_LABELS } from "@/types/deviation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, Download, Search } from "lucide-react";
import { toast } from "sonner";

export default function AuditLogPage() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filtered = mockDeviations.filter(d => {
    if (search && !d.id.toLowerCase().includes(search.toLowerCase()) && !d.requestorName.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (typeFilter !== "all" && d.deviationType !== typeFilter) return false;
    return true;
  });

  const exportCSV = () => {
    const headers = "Request ID,Type,Requestor,Stage,Status,Risk Score,Created\n";
    const rows = filtered.map(d =>
      `${d.id},${DEVIATION_TYPE_LABELS[d.deviationType]},${d.requestorName},${STAGE_LABELS[d.currentStage]},${d.status},${d.aiRiskScore},${d.createdAt}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit_log.csv";
    a.click();
    toast.success("Audit log exported");
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID or requestor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-muted/30 border-border/30"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-muted/30 border-border/30">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] bg-muted/30 border-border/30">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="billing_credit">Billing Credit</SelectItem>
              <SelectItem value="bandwidth_boost">Bandwidth Boost</SelectItem>
              <SelectItem value="sla_waiver">SLA Waiver</SelectItem>
              <SelectItem value="content_access">Content Access</SelectItem>
              <SelectItem value="kyc_deferral">KYC Deferral</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCSV} className="border-primary/30 text-primary hover:bg-primary/10">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left p-4 text-xs text-muted-foreground font-medium">Request ID</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-medium">Type</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-medium">Requestor</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-medium">Stage</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-medium">Risk</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-medium">Status</th>
                <th className="text-left p-4 text-xs text-muted-foreground font-medium">Date</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <>
                  <motion.tr
                    key={d.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setExpandedRow(expandedRow === d.id ? null : d.id)}
                    className={`border-b border-border/20 cursor-pointer transition-colors ${
                      i % 2 === 0 ? "bg-transparent" : "bg-muted/10"
                    } hover:bg-primary/5`}
                  >
                    <td className="p-4 font-mono text-primary text-xs">{d.id}</td>
                    <td className="p-4 text-foreground">{DEVIATION_TYPE_LABELS[d.deviationType]}</td>
                    <td className="p-4 text-foreground">{d.requestorName}</td>
                    <td className="p-4 text-foreground text-xs">{STAGE_LABELS[d.currentStage]}</td>
                    <td className="p-4">
                      <span className={`font-mono text-xs font-bold ${
                        d.aiRiskScore <= 30 ? "text-success" : d.aiRiskScore <= 60 ? "text-warning" : "text-destructive"
                      }`}>
                        {d.aiRiskScore}
                      </span>
                    </td>
                    <td className="p-4"><StatusBadge status={d.status} /></td>
                    <td className="p-4 font-mono text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      {expandedRow === d.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </td>
                  </motion.tr>
                  {expandedRow === d.id && (
                    <tr key={`${d.id}-detail`}>
                      <td colSpan={8} className="p-4 bg-muted/10">
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div><span className="text-muted-foreground">Customer:</span> <span className="text-foreground font-mono">{d.customerAccountId}</span></div>
                            <div><span className="text-muted-foreground">Value:</span> <span className="text-foreground">{d.requestedValue}</span></div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Decision Thread:</div>
                            {d.approvalChain.filter(s => s.status !== "pending").map((step, j) => (
                              <div key={j} className="flex items-center gap-2 text-xs py-1">
                                <span className={`w-2 h-2 rounded-full ${step.status === "approved" ? "bg-success" : "bg-destructive"}`} />
                                <span className="text-foreground">{step.approverName}</span>
                                <span className="text-muted-foreground">{STAGE_LABELS[step.stage]}</span>
                                {step.comment && <span className="text-muted-foreground italic">— "{step.comment}"</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
