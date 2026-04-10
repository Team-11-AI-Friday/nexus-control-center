import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RiskScoreGauge } from "@/components/ui/RiskScoreGauge";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { mockPolicyReferences } from "@/data/mockData";
import { DEVIATION_TYPE_LABELS, ROLE_LABELS } from "@/types/deviation";
import type { DeviationType, UrgencyLevel } from "@/types/deviation";
import { toast } from "sonner";
import {
  CreditCard, Wifi, FileX, Tv, UserX, Sparkles, ChevronRight, Check, ArrowLeft,
} from "lucide-react";

const typeIcons: Record<DeviationType, React.ElementType> = {
  billing_credit: CreditCard,
  bandwidth_boost: Wifi,
  sla_waiver: FileX,
  content_access: Tv,
  kyc_deferral: UserX,
};

const typeColors: Record<DeviationType, string> = {
  billing_credit: "#00d4ff",
  bandwidth_boost: "#7c3aed",
  sla_waiver: "#f59e0b",
  content_access: "#10b981",
  kyc_deferral: "#ef4444",
};

export default function NewRequestPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    customerAccountId: "",
    deviationType: "" as DeviationType | "",
    contractReference: "",
    requestedValue: "",
    effectiveDate: "",
    duration: "",
    urgency: "medium" as UrgencyLevel,
    justification: "",
  });
  const [aiJustification, setAiJustification] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRiskScore, setAiRiskScore] = useState<number | null>(null);

  const generateAIJustification = async () => {
    setAiLoading(true);
    setAiJustification("");

    // Simulate AI processing
    await new Promise(r => setTimeout(r, 2000));

    const justification = `Based on analysis of ${DEVIATION_TYPE_LABELS[formData.deviationType as DeviationType]} request for account ${formData.customerAccountId}, this deviation is within policy guidelines (Section 4.2.1). The requested value of ${formData.requestedValue} falls within acceptable thresholds for ${formData.urgency}-priority requests. Customer history shows positive payment record and 3+ years of service tenure. Recommend approval with standard monitoring conditions.`;

    // Typewriter effect
    let idx = 0;
    const interval = setInterval(() => {
      setAiJustification(justification.slice(0, idx + 1));
      idx++;
      if (idx >= justification.length) {
        clearInterval(interval);
        setAiRiskScore(Math.floor(Math.random() * 60) + 15);
      }
    }, 15);

    setAiLoading(false);
  };

  const handleSubmit = () => {
    toast.success("Deviation request submitted successfully!", {
      description: "Request ID: DEV-2024-006 has been created and sent for AI review.",
    });
    setStep(1);
    setFormData({
      customerAccountId: "",
      deviationType: "",
      contractReference: "",
      requestedValue: "",
      effectiveDate: "",
      duration: "",
      urgency: "medium",
      justification: "",
    });
    setAiJustification("");
    setAiRiskScore(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <motion.div
              animate={{
                scale: step === s ? 1.2 : 1,
                boxShadow: step === s ? "0 0 20px hsla(190, 100%, 50%, 0.4)" : "none",
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-mono font-bold transition-colors ${
                step >= s
                  ? "bg-primary/20 text-primary border border-primary/40"
                  : "bg-muted/30 text-muted-foreground border border-border/30"
              }`}
            >
              {step > s ? <Check className="w-4 h-4" /> : s}
            </motion.div>
            {s < 3 && <div className={`w-12 h-px ${step > s ? "bg-primary/50" : "bg-border/30"}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <GlassCard>
              <h2 className="text-lg font-semibold text-foreground mb-6">Deviation Details</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Customer Account ID</label>
                    <Input
                      placeholder="ACC-TM-XXXXX"
                      value={formData.customerAccountId}
                      onChange={e => setFormData(f => ({ ...f, customerAccountId: e.target.value }))}
                      className="bg-muted/30 border-border/30 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Contract Reference</label>
                    <Input
                      placeholder="CTR-2024-XXXX"
                      value={formData.contractReference}
                      onChange={e => setFormData(f => ({ ...f, contractReference: e.target.value }))}
                      className="bg-muted/30 border-border/30 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Deviation Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {(Object.keys(DEVIATION_TYPE_LABELS) as DeviationType[]).map((type) => {
                      const Icon = typeIcons[type];
                      const color = typeColors[type];
                      const selected = formData.deviationType === type;
                      return (
                        <motion.button
                          key={type}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setFormData(f => ({ ...f, deviationType: type }))}
                          className={`p-3 rounded-lg border text-center transition-all ${
                            selected
                              ? "border-primary/50 bg-primary/10"
                              : "border-border/30 bg-muted/20 hover:border-border/50"
                          }`}
                        >
                          <Icon className="w-5 h-5 mx-auto mb-1" style={{ color }} />
                          <span className="text-[10px] text-foreground leading-tight block">
                            {DEVIATION_TYPE_LABELS[type].split(" / ")[0]}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Requested Value</label>
                    <Input
                      placeholder="e.g. $2,500 credit"
                      value={formData.requestedValue}
                      onChange={e => setFormData(f => ({ ...f, requestedValue: e.target.value }))}
                      className="bg-muted/30 border-border/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Effective Date</label>
                    <Input
                      type="date"
                      value={formData.effectiveDate}
                      onChange={e => setFormData(f => ({ ...f, effectiveDate: e.target.value }))}
                      className="bg-muted/30 border-border/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
                    <Input
                      placeholder="e.g. 14 days"
                      value={formData.duration}
                      onChange={e => setFormData(f => ({ ...f, duration: e.target.value }))}
                      className="bg-muted/30 border-border/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Urgency Level</label>
                  <div className="flex gap-2">
                    {(["low", "medium", "high", "critical"] as UrgencyLevel[]).map(u => (
                      <button
                        key={u}
                        onClick={() => setFormData(f => ({ ...f, urgency: u }))}
                        className={`transition-all ${formData.urgency === u ? "scale-110" : "opacity-60 hover:opacity-100"}`}
                      >
                        <UrgencyBadge urgency={u} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={() => setStep(2)} className="gradient-primary text-primary-foreground">
                  Next Step <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <GlassCard>
              <h2 className="text-lg font-semibold text-foreground mb-6">Business Justification</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Manual Justification</label>
                  <Textarea
                    placeholder="Provide business justification for this deviation request..."
                    value={formData.justification}
                    onChange={e => setFormData(f => ({ ...f, justification: e.target.value }))}
                    className="bg-muted/30 border-border/30 min-h-[100px]"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={generateAIJustification}
                    disabled={aiLoading || !formData.deviationType}
                    variant="outline"
                    className="border-primary/30 text-primary hover:bg-primary/10"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {aiLoading ? "AI Analyzing..." : "Generate AI Justification"}
                  </Button>
                </div>

                {(aiLoading || aiJustification) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="rounded-lg border border-primary/20 bg-primary/5 p-4"
                  >
                    <div className="text-xs text-primary font-semibold mb-2 flex items-center gap-2">
                      <Sparkles className="w-3 h-3" />
                      AI-Generated Justification
                    </div>
                    {aiLoading ? (
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                            className="w-2 h-2 rounded-full bg-primary"
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-foreground font-mono leading-relaxed">{aiJustification}</p>
                    )}
                  </motion.div>
                )}

                {aiRiskScore !== null && (
                  <div className="flex items-center gap-6">
                    <RiskScoreGauge score={aiRiskScore} size="md" />
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-foreground">Policy References</h4>
                      {mockPolicyReferences.slice(0, 2).map(p => (
                        <div key={p.id} className="rounded-lg border border-border/30 bg-muted/20 p-3">
                          <div className="text-xs font-semibold text-foreground">{p.title}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{p.clause}</div>
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.excerpt}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={() => setStep(1)} className="text-muted-foreground">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={() => setStep(3)} className="gradient-primary text-primary-foreground">
                  Review & Submit <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <GlassCard>
              <h2 className="text-lg font-semibold text-foreground mb-6">Review & Submit</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Account ID</span>
                    <div className="font-mono text-foreground">{formData.customerAccountId || "—"}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Contract</span>
                    <div className="font-mono text-foreground">{formData.contractReference || "—"}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Type</span>
                    <div className="text-foreground">{formData.deviationType ? DEVIATION_TYPE_LABELS[formData.deviationType] : "—"}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Value</span>
                    <div className="text-foreground">{formData.requestedValue || "—"}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Effective Date</span>
                    <div className="text-foreground">{formData.effectiveDate || "—"}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Duration</span>
                    <div className="text-foreground">{formData.duration || "—"}</div>
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground text-xs">Urgency</span>
                  <div className="mt-1"><UrgencyBadge urgency={formData.urgency} /></div>
                </div>

                {aiRiskScore !== null && (
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/20">
                    <RiskScoreGauge score={aiRiskScore} size="sm" />
                    <div>
                      <div className="text-xs text-muted-foreground">AI Risk Assessment</div>
                      <div className="text-sm text-foreground font-medium">
                        {aiRiskScore <= 30 ? "Low Risk" : aiRiskScore <= 60 ? "Medium Risk" : "High Risk"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Approval Chain Preview */}
                <div>
                  <span className="text-muted-foreground text-xs mb-2 block">Approval Chain</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {["AI Review", "L1: Ops Manager", "L2: Finance", "Compliance"].map((step, i) => (
                      <div key={step} className="flex items-center gap-2">
                        <div className="px-2 py-1 rounded-md bg-muted/30 text-xs text-foreground border border-border/30">
                          {step}
                        </div>
                        {i < 3 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={() => setStep(2)} className="text-muted-foreground">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button onClick={handleSubmit} className="gradient-primary text-primary-foreground px-8">
                    Submit Request
                  </Button>
                </motion.div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
