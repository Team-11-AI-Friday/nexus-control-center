import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { RiskScoreGauge } from "@/components/ui/RiskScoreGauge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useDeviations } from "@/contexts/DeviationContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { DEVIATION_TYPE_LABELS, STAGE_LABELS, ROLE_LABELS } from "@/types/deviation";
import type { DeviationRequest } from "@/types/deviation";
import { toast } from "sonner";
import { CheckCircle, XCircle, MessageSquare, AlertTriangle, Clock, Sparkles, ShieldAlert } from "lucide-react";

export default function ApprovalsPage() {
  const { role, currentUser } = useAuth();
  const { getPendingApprovalsForRole, advanceStage, deviations } = useDeviations();
  const { addNotification } = useNotifications();

  const pendingRequests = role ? getPendingApprovalsForRole(role) : [];
  // Also show in_review/pending deviations for system admin
  const allPending = role === "system_admin"
    ? deviations.filter((d) => d.status === "pending" || d.status === "in_review" || d.status === "escalated")
    : pendingRequests;

  const [selected, setSelected] = useState<DeviationRequest | null>(allPending[0] || null);
  const [comment, setComment] = useState("");
  const [humanOverride, setHumanOverride] = useState(false);

  const handleAction = (action: "approve" | "reject" | "info") => {
    if (!selected || !currentUser || !role) return;

    // Enforce mandatory comment on rejection
    if (action === "reject" && !comment.trim()) {
      toast.error("Comment required", { description: "You must provide a reason for rejection." });
      return;
    }

    if (action === "info") {
      toast.info("Additional information requested", { description: `${selected.id} — request for more info sent to ${selected.requestorName}` });
      addNotification({
        type: "info",
        title: "More Info Requested",
        message: `${currentUser.name} (${ROLE_LABELS[role]}) has requested additional information for ${selected.id}.`,
        requestId: selected.id,
        targetUserId: selected.requestorId,
      });
      setComment("");
      return;
    }

    advanceStage(
      selected.id,
      action === "approve" ? "approved" : "rejected",
      currentUser.name,
      role,
      comment || undefined,
      humanOverride
    );

    addNotification({
      type: "state_change",
      title: action === "approve" ? "Request Approved" : "Request Rejected",
      message: `${selected.id} (${DEVIATION_TYPE_LABELS[selected.deviationType]}) has been ${action}d by ${currentUser.name} at ${STAGE_LABELS[selected.currentStage]} stage.${humanOverride ? " (Override applied)" : ""}`,
      requestId: selected.id,
    });

    toast.success(
      action === "approve" ? "Request approved successfully" : "Request rejected",
      { description: `${selected.id} — ${action}d at ${STAGE_LABELS[selected.currentStage]}${humanOverride ? " (Override)" : ""}` }
    );

    setComment("");
    setHumanOverride(false);
    // Select next request
    const remaining = allPending.filter((r) => r.id !== selected.id);
    setSelected(remaining[0] || null);
  };

  const getSLARemaining = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (diff < 0) return { text: "BREACHED", isBreached: true, isEscalated: true };
    if (hours < 2) return { text: `${hours}h ${minutes}m`, isBreached: false, isEscalated: true };
    return { text: `${hours}h ${minutes}m`, isBreached: false, isEscalated: false };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      {/* Queue */}
      <div className="lg:col-span-1 space-y-3 overflow-y-auto scrollbar-thin pr-2">
        <h3 className="text-sm font-semibold text-foreground mb-2">
          Pending Queue ({allPending.length})
        </h3>
        {allPending.length === 0 && (
          <GlassCard className="text-center py-8">
            <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No pending approvals for your role</p>
          </GlassCard>
        )}
        {allPending.map((req, i) => {
          const sla = getSLARemaining(req.slaDeadline);
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
                glow={sla.isEscalated ? "destructive" : "primary"}
                className={`p-4 ${selected?.id === req.id ? "border-primary/40" : ""}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-primary">{req.id}</span>
                  <UrgencyBadge urgency={req.urgency} />
                </div>
                <div className="text-sm text-foreground mb-1">{DEVIATION_TYPE_LABELS[req.deviationType]}</div>
                <div className="text-[10px] text-muted-foreground mb-2">{req.customerName}</div>
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-1.5 text-xs ${sla.isEscalated ? "text-destructive" : "text-muted-foreground"}`}>
                    <Clock className="w-3 h-3" />
                    {sla.text}
                  </div>
                  <RiskScoreGauge score={req.aiRiskScore} size="sm" />
                </div>
                {sla.isEscalated && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-destructive font-medium animate-pulse">
                    <AlertTriangle className="w-3 h-3" /> {sla.isBreached ? "SLA BREACHED" : "SLA Escalation"}
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
            {getSLARemaining(selected.slaDeadline).isEscalated && (
              <motion.div
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm"
              >
                <AlertTriangle className="w-4 h-4" />
                {getSLARemaining(selected.slaDeadline).isBreached
                  ? "SLA deadline has been breached! Immediate action required."
                  : "SLA deadline approaching — less than 2 hours remaining!"}
              </motion.div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{selected.id}</h2>
                <div className="text-sm text-muted-foreground">
                  {DEVIATION_TYPE_LABELS[selected.deviationType]} • {selected.customerName}
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
                <Sparkles className="w-3 h-3" />
                AI-Generated Justification
                {selected.llmModel && (
                  <span className="ml-auto text-[10px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
                    {selected.llmModel}
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground leading-relaxed">{selected.aiJustification}</p>
            </div>

            {/* Risk Score */}
            <div className="flex items-center gap-6">
              <RiskScoreGauge score={selected.aiRiskScore} />
              <div className="flex-1 space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Policy References</h4>
                {selected.policyReferences.map((p) => (
                  <div key={p.id} className="rounded-lg border border-border/30 bg-muted/20 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">{p.title}</span>
                      <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{Math.round(p.confidenceScore * 100)}%</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">{p.clause}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.excerpt}</div>
                  </div>
                ))}
                {selected.riskAssessment?.factors && (
                  <div className="mt-2">
                    <h5 className="text-xs font-semibold text-foreground mb-1">Risk Factors</h5>
                    {selected.riskAssessment.factors.map((f, i) => (
                      <div key={i} className="text-[11px] text-muted-foreground flex items-center gap-2 py-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${f.impact === "LOW" ? "bg-success" : f.impact === "MEDIUM" ? "bg-warning" : "bg-destructive"}`} />
                        {f.factor}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Approval History */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Approval History</h4>
              <div className="space-y-2">
                {selected.approvalChain.filter((s) => s.status !== "pending").map((step, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/20">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      step.status === "approved" ? "bg-success/20 text-success" :
                      step.status === "rejected" ? "bg-destructive/20 text-destructive" :
                      "bg-muted/30 text-muted-foreground"
                    }`}>
                      {step.status === "approved" ? <CheckCircle className="w-3 h-3" /> :
                       step.status === "rejected" ? <XCircle className="w-3 h-3" /> :
                       <Clock className="w-3 h-3" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-foreground font-medium">
                        {step.approverName}
                        {step.isOverride && (
                          <span className="ml-2 text-[10px] text-warning bg-warning/10 px-1.5 py-0.5 rounded">OVERRIDE</span>
                        )}
                      </div>
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
                placeholder="Add a comment (required for rejection)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="bg-muted/30 border-border/30"
              />

              {/* Human Override Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-warning" />
                  <div>
                    <div className="text-xs font-semibold text-foreground">Human-in-the-Loop Override</div>
                    <div className="text-[10px] text-muted-foreground">Override AI recommendation (logged in audit trail)</div>
                  </div>
                </div>
                <Switch checked={humanOverride} onCheckedChange={setHumanOverride} />
              </div>

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
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
              <p className="text-muted-foreground">No requests pending your review</p>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
