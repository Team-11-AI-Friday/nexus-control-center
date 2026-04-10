import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { RiskScoreGauge } from "@/components/ui/RiskScoreGauge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { mockDeviations, mockPolicyReferences } from "@/data/mockData";
import { DEVIATION_TYPE_LABELS, STAGE_LABELS, ROLE_LABELS } from "@/types/deviation";
import type { DeviationRequest } from "@/types/deviation";
import { toast } from "sonner";
import { CheckCircle, XCircle, MessageSquare, AlertTriangle, Clock, Sparkles } from "lucide-react";

export default function ApprovalsPage() {
  const pendingRequests = mockDeviations.filter(d => d.status === "pending" || d.status === "in_review");
  const [selected, setSelected] = useState<DeviationRequest | null>(pendingRequests[0] || null);
  const [comment, setComment] = useState("");

  const handleAction = (action: "approve" | "reject" | "info") => {
    const msgs = {
      approve: "Request approved successfully",
      reject: "Request rejected",
      info: "Additional information requested",
    };
    toast.success(msgs[action], { description: `${selected?.id} — ${action}` });
    setComment("");
  };

  const getSLARemaining = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    const hours = Math.max(0, Math.floor(diff / 3600000));
    return hours;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      {/* Queue */}
      <div className="lg:col-span-1 space-y-3 overflow-y-auto scrollbar-thin pr-2">
        <h3 className="text-sm font-semibold text-foreground mb-2">Pending Queue ({pendingRequests.length})</h3>
        {pendingRequests.map((req, i) => {
          const slaHours = getSLARemaining(req.slaDeadline);
          const isEscalated = slaHours < 2;
          return (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard
                hover
                onClick={() => setSelected(req)}
                glow={isEscalated ? "destructive" : "primary"}
                className={`p-4 ${selected?.id === req.id ? "border-primary/40" : ""}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-primary">{req.id}</span>
                  <UrgencyBadge urgency={req.urgency} />
                </div>
                <div className="text-sm text-foreground mb-2">{DEVIATION_TYPE_LABELS[req.deviationType]}</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {slaHours}h remaining
                  </div>
                  <RiskScoreGauge score={req.aiRiskScore} size="sm" />
                </div>
                {isEscalated && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-destructive font-medium animate-pulse">
                    <AlertTriangle className="w-3 h-3" /> SLA Escalation
                  </div>
                )}
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Detail Panel */}
      <div className="lg:col-span-2 overflow-y-auto scrollbar-thin">
        {selected ? (
          <GlassCard className="space-y-5">
            {/* Escalation Banner */}
            {getSLARemaining(selected.slaDeadline) < 2 && (
              <motion.div
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning text-sm"
              >
                <AlertTriangle className="w-4 h-4" />
                SLA deadline approaching — less than 2 hours remaining!
              </motion.div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{selected.id}</h2>
                <div className="text-sm text-muted-foreground">
                  {DEVIATION_TYPE_LABELS[selected.deviationType]} • {selected.customerAccountId}
                </div>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-xs text-muted-foreground">Value</span><div className="text-foreground font-mono">{selected.requestedValue}</div></div>
              <div><span className="text-xs text-muted-foreground">Stage</span><div className="text-foreground">{STAGE_LABELS[selected.currentStage]}</div></div>
              <div><span className="text-xs text-muted-foreground">Requestor</span><div className="text-foreground">{selected.requestorName}</div></div>
              <div><span className="text-xs text-muted-foreground">Created</span><div className="text-foreground font-mono text-xs">{new Date(selected.createdAt).toLocaleDateString()}</div></div>
            </div>

            {/* AI Justification */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="text-xs text-primary font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> AI-Generated Justification
              </div>
              <p className="text-sm text-foreground leading-relaxed">{selected.aiJustification}</p>
            </div>

            {/* Risk Score */}
            <div className="flex items-center gap-6">
              <RiskScoreGauge score={selected.aiRiskScore} />
              <div className="flex-1 space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Policy References</h4>
                {selected.policyReferences.map(p => (
                  <div key={p.id} className="rounded-lg border border-border/30 bg-muted/20 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">{p.title}</span>
                      <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{Math.round(p.confidenceScore * 100)}%</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">{p.clause}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.excerpt}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Approval History */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Approval History</h4>
              <div className="space-y-2">
                {selected.approvalChain.filter(s => s.status !== "pending").map((step, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/20">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      step.status === "approved" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                    }`}>
                      {step.status === "approved" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-foreground font-medium">{step.approverName}</div>
                      <div className="text-xs text-muted-foreground">{STAGE_LABELS[step.stage]} • {step.timestamp ? new Date(step.timestamp).toLocaleString() : ""}</div>
                      {step.comment && <div className="text-xs text-foreground mt-1 italic">"{step.comment}"</div>}
                      {step.aiRecommendation && (
                        <div className="text-xs text-primary mt-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> {step.aiRecommendation}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4 border-t border-border/30">
              <Textarea
                placeholder="Add a comment (required for reject)..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="bg-muted/30 border-border/30"
              />
              <div className="flex gap-3">
                <Button
                  onClick={() => handleAction("approve")}
                  className="flex-1 bg-success/20 text-success hover:bg-success/30 border border-success/30"
                  style={{ boxShadow: "0 0 15px hsla(160, 60%, 45%, 0.15)" }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Approve
                </Button>
                <Button
                  onClick={() => handleAction("reject")}
                  className="flex-1 bg-destructive/20 text-destructive hover:bg-destructive/30 border border-destructive/30"
                  style={{ boxShadow: "0 0 15px hsla(0, 84%, 60%, 0.15)" }}
                >
                  <XCircle className="w-4 h-4 mr-2" /> Reject
                </Button>
                <Button
                  onClick={() => handleAction("info")}
                  className="flex-1 bg-warning/20 text-warning hover:bg-warning/30 border border-warning/30"
                  style={{ boxShadow: "0 0 15px hsla(38, 92%, 50%, 0.15)" }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" /> More Info
                </Button>
              </div>
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Select a request to review</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
