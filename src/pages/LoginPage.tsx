import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { GlobeScene } from "@/components/3d/GlobeScene";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { UserRole } from "@/types/deviation";
import { ROLE_LABELS } from "@/types/deviation";
import {
  Briefcase, Wifi, UserCheck, DollarSign, Shield, Settings,
} from "lucide-react";

const roleIcons: Record<UserRole, React.ElementType> = {
  operations_manager: Briefcase,
  network_manager: Wifi,
  account_manager: UserCheck,
  finance_approver: DollarSign,
  compliance_officer: Shield,
  system_admin: Settings,
};

const roleColors: Record<UserRole, string> = {
  operations_manager: "#00d4ff",
  network_manager: "#7c3aed",
  account_manager: "#10b981",
  finance_approver: "#f59e0b",
  compliance_officer: "#ef4444",
  system_admin: "#6366f1",
};

type Step = "auth" | "role";

export default function LoginPage() {
  const { user, signIn, signUp, setRole } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(user ? "role" : "auth");
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        toast.success("Account created! Check your email to verify.");
      }
      setStep("role");
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setRole(role);
    navigate("/dashboard");
  };

  // Allow demo mode - skip to role selection
  const handleDemoMode = () => {
    setStep("role");
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "#0a0a0f" }}>
      <GlobeScene />

      <div className="relative z-10 w-full max-w-4xl px-4">
        <AnimatePresence mode="wait">
          {step === "auth" ? (
            <motion.div
              key="auth"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center"
            >
              <motion.h1
                className="text-4xl font-bold text-foreground mb-2 glow-text"
                initial={{ y: -20 }}
                animate={{ y: 0 }}
              >
                ServiceDev
              </motion.h1>
              <p className="text-muted-foreground mb-8 text-sm">AI-Assisted Service Deviation & Approval Workflow</p>

              <GlassCard className="w-full max-w-md">
                <form onSubmit={handleAuth} className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground text-center">
                    {isLogin ? "Sign In" : "Create Account"}
                  </h2>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-muted/50 border-border/50"
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-muted/50 border-border/50"
                    required
                  />
                  <Button type="submit" className="w-full gradient-primary text-primary-foreground font-semibold" disabled={loading}>
                    {loading ? "Processing..." : isLogin ? "Sign In" : "Sign Up"}
                  </Button>
                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-primary hover:underline"
                    >
                      {isLogin ? "Need an account?" : "Already have an account?"}
                    </button>
                    <button
                      type="button"
                      onClick={handleDemoMode}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Demo Mode →
                    </button>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          ) : (
            <motion.div
              key="role"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center"
            >
              <motion.h1
                className="text-3xl font-bold text-foreground mb-2 glow-text"
                initial={{ y: -20 }}
                animate={{ y: 0 }}
              >
                Select Your Role
              </motion.h1>
              <p className="text-muted-foreground mb-8 text-sm">Choose your operational role to continue</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
                {(Object.keys(ROLE_LABELS) as UserRole[]).map((role, i) => {
                  const Icon = roleIcons[role];
                  const color = roleColors[role];
                  return (
                    <motion.div
                      key={role}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <GlassCard
                        hover
                        onClick={() => handleRoleSelect(role)}
                        className="flex flex-col items-center gap-3 py-8 text-center"
                      >
                        <motion.div
                          whileHover={{ rotate: 360, scale: 1.2 }}
                          transition={{ duration: 0.6 }}
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{
                            background: `${color}15`,
                            boxShadow: `0 0 20px ${color}30`,
                          }}
                        >
                          <Icon className="w-6 h-6" style={{ color }} />
                        </motion.div>
                        <span className="text-sm font-medium text-foreground">{ROLE_LABELS[role]}</span>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>

              {!user && (
                <button
                  onClick={() => setStep("auth")}
                  className="mt-6 text-sm text-muted-foreground hover:text-foreground"
                >
                  ← Back to login
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
