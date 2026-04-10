import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { RiskScoreGauge } from "@/components/ui/RiskScoreGauge";
import { useDeviations } from "@/contexts/DeviationContext";
import { useAuth } from "@/contexts/AuthContext";
import { DEVIATION_TYPE_LABELS, STAGE_LABELS } from "@/types/deviation";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MyRequestsPage() {
  const { currentUser } = useAuth();
  const { getDeviationsForUser } = useDeviations();
  const navigate = useNavigate();

  const myRequests = currentUser ? getDeviationsForUser(currentUser.id) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          My Requests ({myRequests.length})
        </h2>
        <Button
          onClick={() => navigate("/new-request")}
          className="gradient-primary text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" /> New Request
        </Button>
      </div>

      {myRequests.length === 0 ? (
        <GlassCard className="text-center py-12">
          <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">You haven't submitted any deviation requests yet.</p>
          <Button
            onClick={() => navigate("/new-request")}
            variant="outline"
            className="border-primary/30 text-primary"
          >
            <Plus className="w-4 h-4 mr-2" /> Create Your First Request
          </Button>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {myRequests.map((dev, i) => {
            const slaMs = new Date(dev.slaDeadline).getTime() - Date.now();
            const slaHours = Math.floor(slaMs / 3600000);
            const slaIsEscalated = slaMs > 0 && slaMs < 7200000;
            const slaIsBreached = slaMs < 0 && dev.currentStage !== "closed";

            return (
              <motion.div
                key={dev.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard
                  hover
                  onClick={() => navigate("/tracker")}
                  glow={slaIsEscalated || slaIsBreached ? "destructive" : "primary"}
                  className="p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-primary font-semibold">
                        {dev.id}
                      </span>
                      <StatusBadge status={dev.status} />
                      <UrgencyBadge urgency={dev.urgency} />
                    </div>
                    <RiskScoreGauge score={dev.aiRiskScore} size="sm" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-[10px] text-muted-foreground">Type</span>
                      <div className="text-foreground">{DEVIATION_TYPE_LABELS[dev.deviationType]}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Customer</span>
                      <div className="text-foreground">{dev.customerName}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Value</span>
                      <div className="text-foreground font-mono">{dev.requestedValue}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Current Stage</span>
                      <div className="text-foreground">{STAGE_LABELS[dev.currentStage]}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/20">
                    <div className="text-[10px] text-muted-foreground font-mono">
                      Created: {new Date(dev.createdAt).toLocaleString()}
                    </div>
                    <div className={`flex items-center gap-1 text-xs ${
                      slaIsBreached ? "text-destructive font-semibold animate-pulse" :
                      slaIsEscalated ? "text-destructive" :
                      "text-muted-foreground"
                    }`}>
                      <Clock className="w-3 h-3" />
                      {slaIsBreached ? "SLA BREACHED" :
                       dev.currentStage === "closed" ? "Completed" :
                       `SLA: ${slaHours}h remaining`}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
