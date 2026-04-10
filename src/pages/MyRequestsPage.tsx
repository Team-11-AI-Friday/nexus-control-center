import { mockDeviations } from "@/data/mockData";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { DEVIATION_TYPE_LABELS, STAGE_LABELS } from "@/types/deviation";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function MyRequestsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">My Requests</h2>
      <div className="grid gap-4">
        {mockDeviations.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <GlassCard
              hover
              onClick={() => navigate("/tracker")}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-primary">{d.id}</span>
                <div>
                  <div className="text-sm text-foreground">{DEVIATION_TYPE_LABELS[d.deviationType]}</div>
                  <div className="text-xs text-muted-foreground">{d.customerAccountId} • {STAGE_LABELS[d.currentStage]}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <UrgencyBadge urgency={d.urgency} />
                <StatusBadge status={d.status} />
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
