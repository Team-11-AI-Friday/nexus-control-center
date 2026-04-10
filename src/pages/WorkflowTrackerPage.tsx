import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { RiskScoreGauge } from "@/components/ui/RiskScoreGauge";
import { useDeviations } from "@/contexts/DeviationContext";
import { DEVIATION_TYPE_LABELS, STAGE_LABELS, WORKFLOW_STAGES } from "@/types/deviation";
import { CheckCircle, Clock, XCircle, MoreHorizontal, AlertTriangle } from "lucide-react";

export default function WorkflowTrackerPage() {
  const { deviations } = useDeviations();
  const [selectedId, setSelectedId] = useState(deviations[0]?.id || "");
  const selected = deviations.find((d) => d.id === selectedId);

  // Live SLA countdown
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getSLAInfo = (deadline: string) => {
    const diff = new Date(deadline).getTime() - now;
    if (diff < 0) {
      const elapsed = Math.abs(diff);
      const h = Math.floor(elapsed / 3600000);
      const m = Math.floor((elapsed % 3600000) / 60000);
      return { text: `BREACHED ${h}h ${m}m ago`, pct: 100, isBreached: true, isEscalated: true };
    }
    const hours = diff / 3600000;
    const h = Math.floor(hours);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    // Assume 48h SLA window
    const pct = Math.max(0, Math.min(100, ((48 - hours) / 48) * 100));
    return { text: `${h}h ${m}m ${s}s`, pct, isBreached: false, isEscalated: hours < 2 };
  };

  const activeDeviations = deviations.filter((d) => d.currentStage !== "closed" || d.status !== "approved");

  return (
    <div className="space-y-6">
      {/* Request Selector */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {activeDeviations.map((d) => {
          const sla = getSLAInfo(d.slaDeadline);
          return (
            <motion.button
              key={d.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedId(d.id)}
              className={`shrink-0 p-3 rounded-xl border transition-all ${
                selectedId === d.id
                  ? "border-primary/40 bg-primary/10"
                  : "border-border/30 bg-muted/20 hover:border-border/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-primary">{d.id}</span>
                <StatusBadge status={d.status} />
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">{d.customerName}</div>
              {sla.isEscalated && (
                <div className="flex items-center gap-1 mt-1 text-xs text-destructive animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  {sla.isBreached ? "BREACHED" : "< 2h left"}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {selected && (
        <>
          {/* Request Summary */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{selected.id}</h2>
                <div className="text-sm text-muted-foreground">
                  {DEVIATION_TYPE_LABELS[selected.deviationType]} • {selected.customerName}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <RiskScoreGauge score={selected.aiRiskScore} size="sm" />
                <UrgencyBadge urgency={selected.urgency} />
                <StatusBadge status={selected.status} />
              </div>
            </div>

            {/* SLA Countdown Bar */}
            {(() => {
              const sla = getSLAInfo(selected.slaDeadline);
              return (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-mono font-bold ${sla.isBreached ? "text-destructive" : sla.isEscalated ? "text-destructive animate-pulse" : "text-foreground"}`}>
                      <Clock className="w-3 h-3 inline mr-1" />
                      {sla.text}
                    </span>
                    <span className="text-muted-foreground">
                      SLA Deadline: {new Date(selected.slaDeadline).toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-muted/30">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${sla.pct}%` }}
                      transition={{ duration: 1 }}
                      className={`h-full rounded-full ${
                        sla.isBreached ? "bg-destructive" :
                        sla.isEscalated ? "bg-destructive animate-pulse" :
                        sla.pct > 70 ? "bg-warning" : "bg-success"
                      }`}
                      style={{ boxShadow: sla.isEscalated ? "0 0 10px hsla(0, 84%, 60%, 0.4)" : undefined }}
                    />
                  </div>
                </div>
              );
            })()}
          </GlassCard>

          {/* 8-Stage Workflow Timeline */}
          <GlassCard className="overflow-x-auto">
            <h3 className="text-sm font-semibold text-foreground mb-6">Workflow Progress</h3>
            <div className="flex items-start gap-4 min-w-max pb-4">
              {WORKFLOW_STAGES.map((stage, i) => {
                const step = selected.approvalChain.find((s) => s.stage === stage);
                const isCurrent = selected.currentStage === stage;
                const isPast = step?.status === "approved" || step?.status === "rejected" || step?.status === "skipped";
                const isRejected = step?.status === "rejected";
                const isSkipped = step?.status === "skipped";

                return (
                  <div key={stage} className="flex items-start">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1, type: "spring" }}
                      className="flex flex-col items-center min-w-[120px]"
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                        isRejected ? "border-destructive bg-destructive/10 text-destructive" :
                        isPast ? "border-success bg-success/10 text-success" :
                        isCurrent ? "border-primary bg-primary/10 text-primary ring-4 ring-primary/20" :
                        isSkipped ? "border-muted/30 bg-muted/10 text-muted-foreground" :
                        "border-muted/30 bg-muted/10 text-muted-foreground"
                      }`}>
                        {isRejected ? <XCircle className="w-5 h-5" /> :
                         isPast ? <CheckCircle className="w-5 h-5" /> :
                         isCurrent ? (
                           <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                             <Clock className="w-5 h-5" />
                           </motion.div>
                         ) : isSkipped ? <MoreHorizontal className="w-5 h-5" /> :
                         <div className="w-2 h-2 rounded-full bg-current" />}
                      </div>
                      <span className={`text-xs mt-2 text-center font-medium ${
                        isCurrent ? "text-primary" :
                        isPast ? "text-foreground" :
                        "text-muted-foreground"
                      }`}>
                        {STAGE_LABELS[stage]}
                      </span>
                      {step && (step.status === "approved" || step.status === "rejected") && (
                        <div className="mt-2 text-center">
                          <div className="text-[10px] text-foreground">{step.approverName}</div>
                          <div className="text-[9px] text-muted-foreground font-mono">
                            {step.timestamp ? new Date(step.timestamp).toLocaleString() : "—"}
                          </div>
                          {step.comment && (
                            <div className="text-[9px] text-muted-foreground italic mt-1 max-w-[100px] truncate" title={step.comment}>
                              "{step.comment}"
                            </div>
                          )}
                          {step.isOverride && (
                            <span className="text-[9px] text-warning bg-warning/10 px-1 rounded mt-0.5 inline-block">OVERRIDE</span>
                          )}
                        </div>
                      )}
                    </motion.div>
                    {i < WORKFLOW_STAGES.length - 1 && (
                      <div className={`w-8 h-0.5 mt-6 ${
                        isPast ? "bg-success" :
                        isRejected ? "bg-destructive" :
                        "bg-border/30"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* AI Justification */}
          {selected.aiJustification && (
            <GlassCard>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                AI Analysis
                {selected.llmModel && (
                  <span className="text-[10px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">{selected.llmModel}</span>
                )}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{selected.aiJustification}</p>
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
}
