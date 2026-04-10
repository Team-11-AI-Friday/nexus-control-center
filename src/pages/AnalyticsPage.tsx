import { GlassCard } from "@/components/ui/GlassCard";
import { mockAnalytics } from "@/data/mockData";
import { Sparkles } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#00d4ff", "#7c3aed", "#f59e0b", "#10b981", "#ef4444"];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests by Type */}
        <GlassCard>
          <h3 className="text-sm font-semibold text-foreground mb-4">Deviation Requests by Type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={mockAnalytics.requestsByType}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Bar dataKey="billing_credit" fill="#00d4ff" radius={[2, 2, 0, 0]} />
              <Bar dataKey="bandwidth_boost" fill="#7c3aed" radius={[2, 2, 0, 0]} />
              <Bar dataKey="sla_waiver" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              <Bar dataKey="content_access" fill="#10b981" radius={[2, 2, 0, 0]} />
              <Bar dataKey="kyc_deferral" fill="#ef4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* SLA Breach Trends */}
        <GlassCard>
          <h3 className="text-sm font-semibold text-foreground mb-4">SLA Breach Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={mockAnalytics.slaBreachTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Line type="monotone" dataKey="total" stroke="#00d4ff" strokeWidth={2} dot={{ fill: "#00d4ff" }} />
              <Line type="monotone" dataKey="breaches" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444" }} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Approval Rate */}
        <GlassCard>
          <h3 className="text-sm font-semibold text-foreground mb-4">Approval vs Rejection Rate</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={mockAnalytics.approvalRate}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {mockAnalytics.approvalRate.map((_, i) => (
                  <Cell key={i} fill={["#10b981", "#ef4444", "#f59e0b"][i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Legend formatter={(value) => <span style={{ color: "hsl(var(--foreground))", fontSize: 12 }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Risk Distribution */}
        <GlassCard>
          <h3 className="text-sm font-semibold text-foreground mb-4">Risk Score Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={mockAnalytics.riskDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="score" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {mockAnalytics.riskDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* AI Insight */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">AI Analytics Insight</h3>
        </div>
        <p className="text-sm text-foreground leading-relaxed">
          Analysis of the past 6 months shows a <span className="text-primary font-semibold">23% increase</span> in billing credit deviation requests, 
          driven primarily by Q4 service outage incidents. SLA breach rate has improved from 14.3% to 5.3% following the implementation of automated 
          escalation workflows. The average AI risk score has decreased from 42.1 to 37.6, indicating improving compliance adherence. 
          <span className="text-warning font-semibold"> KYC deferral requests have increased 40%</span> — recommend policy review for Section 12.3.2 
          to address enterprise account restructuring scenarios. Overall approval rate of 68% is within industry benchmarks for telecom service deviation management.
        </p>
      </GlassCard>
    </div>
  );
}
