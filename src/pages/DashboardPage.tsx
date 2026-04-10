import { useMemo } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { RiskScoreGauge } from "@/components/ui/RiskScoreGauge";
import { useDeviations } from "@/contexts/DeviationContext";
import { useAuth } from "@/contexts/AuthContext";
import { DEVIATION_TYPE_LABELS, STAGE_LABELS, WORKFLOW_STAGES } from "@/types/deviation";
import { Activity, AlertTriangle, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

function KPICard({ label, value, icon: Icon, color, delay }: { label: string; value: string | number; icon: React.ElementType; color: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, rotateY: 90 }}
      animate={{ opacity: 1, rotateY: 0 }}
      transition={{ delay, duration: 0.6, type: "spring" }}
    >
      <GlassCard className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}15`, boxShadow: `0 0 15px ${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <div className="text-2xl font-bold font-mono text-foreground">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { currentUser, role } = useAuth();
  const { deviations, activityLog } = useDeviations();
  const navigate = useNavigate();

  // Compute KPIs from live data
  const kpis = useMemo(() => {
    const active = deviations.filter((d) => d.status !== "approved" && d.status !== "rejected" && d.currentStage !== "closed");
    const pending = deviations.filter((d) => d.status === "pending" || d.status === "in_review");
    const breached = deviations.filter((d) => {
      const deadline = new Date(d.slaDeadline).getTime();
      return deadline < Date.now() && d.status !== "approved" && d.status !== "rejected" && d.currentStage !== "closed";
    });
    const avgRisk = deviations.length > 0
      ? Math.round((deviations.reduce((sum, d) => sum + d.aiRiskScore, 0) / deviations.length) * 10) / 10
      : 0;

    return {
      totalActiveDeviations: active.length,
      pendingApprovals: pending.length,
      slaBreached: breached.length,
      avgRiskScore: avgRisk,
    };
  }, [deviations]);

  // SLA breach alerts
  const slaAlerts = useMemo(() => {
    return deviations.filter((d) => {
      const hoursLeft = (new Date(d.slaDeadline).getTime() - Date.now()) / 3600000;
      return hoursLeft < 2 && hoursLeft > -24 && d.status !== "approved" && d.status !== "rejected" && d.currentStage !== "closed";
    });
  }, [deviations]);

  const activeRequests = deviations.filter((d) => d.status !== "approved" && d.status !== "rejected" && d.currentStage !== "closed");

  return (
    <div className="space-y-6">
      {/* SLA Breach Alert Banner */}
      {slaAlerts.length > 0 && (
        <motion.div
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30"
        >
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-destructive">
              SLA Escalation — {slaAlerts.length} request{slaAlerts.length > 1 ? "s" : ""} approaching deadline
            </div>
            <div className="text-xs text-destructive/80 mt-0.5">
              {slaAlerts.map((d) => d.id).join(", ")} — Immediate action required
            </div>
          </div>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Active Deviations" value={kpis.totalActiveDeviations} icon={Activity} color="#00d4ff" delay={0} />
        <KPICard label="Pending Approvals" value={kpis.pendingApprovals} icon={Clock} color="#f59e0b" delay={0.1} />
        <KPICard label="SLA Breached" value={kpis.slaBreached} icon={AlertTriangle} color="#ef4444" delay={0.2} />
        <KPICard label="Avg Risk Score" value={kpis.avgRiskScore} icon={TrendingUp} color="#7c3aed" delay={0.3} />
      </div>

      {/* Workflow Pipeline */}
      <GlassCard className="mt-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Workflow Pipeline</h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {WORKFLOW_STAGES.map((stage, i) => {
            const count = activeRequests.filter((r) => r.currentStage === stage).length;
            return (
              <div key={stage} className="flex items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center min-w-[90px]"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-mono font-bold border ${
                      count > 0
                        ? "border-primary/50 bg-primary/10 text-primary animate-pulse-glow"
                        : "border-border/30 bg-muted/30 text-muted-foreground"
                    }`}
                  >
                    {count}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 text-center">
                    {STAGE_LABELS[stage]}
                  </span>
                </motion.div>
                {i < WORKFLOW_STAGES.length - 1 && (
                  <div className="w-6 h-px bg-border/30 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Recent Activity & Quick View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Requests */}
        <div className="lg:col-span-2">
          <GlassCard>
            <h3 className="text-sm font-semibold text-foreground mb-4">Recent Deviation Requests</h3>
            <div className="space-y-3">
              {deviations.slice(0, 5).map((dev, i) => (
                <motion.div
                  key={dev.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  onClick={() => navigate("/tracker")}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-primary">{dev.id}</span>
                    <div className="min-w-0">
                      <div className="text-sm text-foreground truncate">
                        {DEVIATION_TYPE_LABELS[dev.deviationType]}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {dev.customerName}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <RiskScoreGauge score={dev.aiRiskScore} size="sm" />
                    <UrgencyBadge urgency={dev.urgency} />
                    <StatusBadge status={dev.status} />
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Activity Feed */}
        <GlassCard>
          <h3 className="text-sm font-semibold text-foreground mb-4">Activity Feed</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin">
            {activityLog.slice(0, 8).map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className="flex gap-3 text-xs"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <div className="text-foreground font-medium">{log.action}</div>
                  <div className="text-muted-foreground">
                    {log.actorName} • {log.requestId}
                  </div>
                  <div className="text-muted-foreground/60 font-mono text-[10px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
