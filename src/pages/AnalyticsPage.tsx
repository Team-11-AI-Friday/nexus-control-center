import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { useDeviations } from "@/contexts/DeviationContext";
import { useTheme } from "@/contexts/ThemeContext";
import { seedAnalytics } from "@/data/deviations";
import { generateAnalyticsInsight, isLLMConfigured } from "@/services/llm.service";
import { DEVIATION_TYPE_LABELS } from "@/types/deviation";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Sparkles, Cpu, TrendingUp, BarChart3, PieChart as PieChartIcon, Activity } from "lucide-react";

const COLORS = ["#00d4ff", "#7c3aed", "#10b981", "#f59e0b", "#ef4444"];
const PIE_COLORS = ["#10b981", "#ef4444", "#f59e0b"];

export default function AnalyticsPage() {
  const { deviations } = useDeviations();
  const { isDark } = useTheme();
  const analytics = seedAnalytics;

  const [aiInsight, setAiInsight] = useState("");
  const [aiInsightModel, setAiInsightModel] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);

  // Theme-aware chart styles
  const chartGrid = isDark ? "hsla(240, 10%, 20%, 0.5)" : "hsla(220, 13%, 87%, 0.6)";
  const chartTick = isDark ? "hsl(215, 20%, 55%)" : "hsl(220, 10%, 45%)";
  const tooltipStyle = isDark
    ? { background: "hsla(240, 15%, 8%, 0.95)", border: "1px solid hsla(190, 100%, 50%, 0.2)", borderRadius: "8px", fontSize: "12px", color: "#f0f9ff" }
    : { background: "hsla(0, 0%, 100%, 0.95)", border: "1px solid hsla(220, 13%, 87%, 0.8)", borderRadius: "8px", fontSize: "12px", color: "#1a1a2e", boxShadow: "0 4px 12px hsla(220, 10%, 50%, 0.1)" };

  // Compute dynamic summary for AI
  const dataSummary = useMemo(() => {
    const total = deviations.length;
    const active = deviations.filter((d) => d.currentStage !== "closed").length;
    const breached = deviations.filter((d) => new Date(d.slaDeadline).getTime() < Date.now() && d.currentStage !== "closed").length;
    const avgRisk = total > 0 ? Math.round(deviations.reduce((s, d) => s + d.aiRiskScore, 0) / total) : 0;
    const byType: Record<string, number> = {};
    deviations.forEach((d) => {
      byType[DEVIATION_TYPE_LABELS[d.deviationType]] = (byType[DEVIATION_TYPE_LABELS[d.deviationType]] || 0) + 1;
    });
    const approved = deviations.filter((d) => d.status === "approved").length;
    const rejected = deviations.filter((d) => d.status === "rejected").length;

    return `Total Deviations: ${total}\nActive: ${active}\nApproved: ${approved}\nRejected: ${rejected}\nSLA Breached: ${breached}\nAvg Risk Score: ${avgRisk}\nBreakdown by Type: ${Object.entries(byType).map(([k, v]) => `${k}: ${v}`).join(", ")}`;
  }, [deviations]);

  const fetchAIInsight = async () => {
    if (!isLLMConfigured()) return;
    setInsightLoading(true);
    const result = await generateAnalyticsInsight(dataSummary);
    if (result.result) {
      setAiInsight(result.result);
      setAiInsightModel(result.model);
    }
    setInsightLoading(false);
  };

  useEffect(() => {
    fetchAIInsight();
  }, []);

  return (
    <div className="space-y-6">
      {/* AI Insight */}
      <GlassCard className="border-primary/20">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">AI Analytics Insight</h3>
          {aiInsightModel && (
            <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
              <Cpu className="w-3 h-3" /> {aiInsightModel}
            </span>
          )}
        </div>
        {insightLoading ? (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  className="w-2 h-2 rounded-full bg-primary"
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">Analyzing deviation metrics...</span>
          </div>
        ) : aiInsight ? (
          <p className="text-sm text-foreground leading-relaxed">{aiInsight}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            {isLLMConfigured() ? "Click to generate AI insight" : "Configure VITE_LLM_API_KEY to enable AI insights"}
          </p>
        )}
        {!insightLoading && isLLMConfigured() && (
          <button
            onClick={fetchAIInsight}
            className="text-xs text-primary hover:text-primary/80 mt-2 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" /> Regenerate
          </button>
        )}
      </GlassCard>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests by Type */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Requests by Type (6 months)</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics.requestsByType}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: chartTick }} />
              <YAxis tick={{ fontSize: 11, fill: chartTick }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
              <Bar dataKey="billing_credit" name="Billing Credit" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="bandwidth_boost" name="Bandwidth" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="sla_waiver" name="SLA Waiver" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="content_access" name="Content" fill={COLORS[3]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="kyc_deferral" name="KYC" fill={COLORS[4]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* SLA Breach Trend */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">SLA Breach Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analytics.slaBreachTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: chartTick }} />
              <YAxis tick={{ fontSize: 11, fill: chartTick }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="breaches" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Breaches" />
              <Line type="monotone" dataKey="total" stroke={isDark ? "#00d4ff" : "#0284c7"} strokeWidth={2} dot={{ r: 4 }} name="Total Requests" />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Approval Rate */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Approval Rate</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={analytics.approvalRate} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                {analytics.approvalRate.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Risk Distribution */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Risk Score Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics.riskDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
              <XAxis dataKey="score" tick={{ fontSize: 11, fill: chartTick }} />
              <YAxis tick={{ fontSize: 11, fill: chartTick }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {analytics.riskDistribution.map((entry, i) => {
                  const score = parseInt(entry.score.split("-")[0]);
                  return <Cell key={i} fill={score < 30 ? "#10b981" : score < 60 ? "#f59e0b" : "#ef4444"} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
    </div>
  );
}
