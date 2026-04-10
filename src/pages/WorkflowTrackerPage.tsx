import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { mockDeviations } from "@/data/mockData";
import { DEVIATION_TYPE_LABELS, STAGE_LABELS, WORKFLOW_STAGES } from "@/types/deviation";
import type { DeviationRequest } from "@/types/deviation";
import { ChevronDown, ChevronUp, Sparkles, Clock, User } from "lucide-react";

export default function WorkflowTrackerPage() {
  const [selectedRequest, setSelectedRequest] = useState<DeviationRequest>(mockDeviations[0]);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());

  const toggleStage = (stage: string) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      next.has(stage) ? next.delete(stage) : next.add(stage);
      return next;
    });
  };

  const getStageStatus = (stageIdx: number) => {
    const currentIdx = WORKFLOW_STAGES.indexOf(selectedRequest.currentStage);
    if (stageIdx < currentIdx) return "completed";
    if (stageIdx === currentIdx) return "active";
    return "pending";
  };

  // SLA progress
  const created = new Date(selectedRequest.createdAt).getTime();
  const deadline = new Date(selectedRequest.slaDeadline).getTime();
  const now = Date.now();
  const slaProgress = Math.min(100, Math.max(0, ((now - created) / (deadline - created)) * 100));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Request Selector */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {mockDeviations.map(d => (
          <button
            key={d.id}
            onClick={() => setSelectedRequest(d)}
            className={`shrink-0 px-4 py-2 rounded-lg text-xs font-mono border transition-all ${
              selectedRequest.id === d.id
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/30 bg-muted/20 text-muted-foreground hover:border-border/50"
            }`}
          >
            {d.id}
          </button>
        ))}
      </div>

      {/* Request Header */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground font-mono">{selectedRequest.id}</h2>
            <p className="text-sm text-muted-foreground">{DEVIATION_TYPE_LABELS[selectedRequest.deviationType]} • {selectedRequest.customerAccountId}</p>
          </div>
          <div className="flex items-center gap-2">
            <UrgencyBadge urgency={selectedRequest.urgency} />
            <StatusBadge status={selectedRequest.status} />
          </div>
        </div>

        {/* SLA Bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>SLA Progress</span>
            <span className="font-mono">{Math.round(slaProgress)}% elapsed</span>
          </div>
          <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${slaProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${
                slaProgress > 80 ? "bg-destructive" : slaProgress > 50 ? "bg-warning" : "bg-success"
              }`}
            />
          </div>
        </div>
      </GlassCard>

      {/* Timeline */}
      <div className="space-y-0">
        {WORKFLOW_STAGES.map((stage, i) => {
          const status = getStageStatus(i);
          const step = selectedRequest.approvalChain.find(s => s.stage === stage);
          const expanded = expandedStages.has(stage);

          return (
            <motion.div
              key={stage}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              {/* Connector */}
              {i > 0 && (
                <div className="ml-6 w-px h-6" style={{
                  background: status === "pending" ? "hsl(var(--border))" : "hsl(var(--primary))",
                  opacity: status === "pending" ? 0.3 : 0.5,
                }} />
              )}

              {/* Node */}
              <button
                onClick={() => step && toggleStage(stage)}
                className="w-full text-left"
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={status === "active" ? { scale: [1, 1.2, 1], boxShadow: ["0 0 0 hsla(190,100%,50%,0)", "0 0 20px hsla(190,100%,50%,0.4)", "0 0 0 hsla(190,100%,50%,0)"] } : {}}
                    transition={status === "active" ? { duration: 2, repeat: Infinity } : {}}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 border ${
                      status === "completed"
                        ? "bg-success/20 border-success/40 text-success"
                        : status === "active"
                        ? "bg-primary/20 border-primary/40 text-primary"
                        : "bg-muted/20 border-border/30 text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </motion.div>

                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <div className={`text-sm font-medium ${status === "pending" ? "text-muted-foreground" : "text-foreground"}`}>
                        {STAGE_LABELS[stage]}
                      </div>
                      {step?.approverName && (
                        <div className="text-xs text-muted-foreground">{step.approverName}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {step?.timestamp && (
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {new Date(step.timestamp).toLocaleString()}
                        </span>
                      )}
                      {step && (expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />)}
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded Details */}
              {expanded && step && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="ml-16 mt-2"
                >
                  <GlassCard className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span className="text-foreground">{step.approverName}</span>
                    </div>
                    {step.timestamp && (
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="font-mono text-muted-foreground">{new Date(step.timestamp).toLocaleString()}</span>
                      </div>
                    )}
                    {step.aiRecommendation && (
                      <div className="flex items-center gap-2 text-xs text-primary">
                        <Sparkles className="w-3 h-3" />
                        {step.aiRecommendation}
                      </div>
                    )}
                    {step.comment && (
                      <div className="text-xs text-foreground italic border-l-2 border-primary/30 pl-2">
                        "{step.comment}"
                      </div>
                    )}
                  </GlassCard>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
