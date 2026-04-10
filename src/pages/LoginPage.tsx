import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { GlobeScene } from "@/components/3d/GlobeScene";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { USERS } from "@/data/users";
import { ROLE_LABELS } from "@/types/deviation";
import {
  Briefcase, Wifi, UserCheck, DollarSign, Shield, Settings, LogIn, Sun, Moon,
} from "lucide-react";
import type { UserRole } from "@/types/deviation";

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

export default function LoginPage() {
  const { currentUser, signIn } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect
  if (currentUser) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = signIn(email, password);
      if (result.success) {
        toast.success("Welcome to AASDAW!", {
          description: `Signed in successfully.`,
        });
        navigate(result.redirectPath || "/dashboard");
      } else {
        toast.error(result.error || "Authentication failed");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword("DevIQ@2025");
    // Auto-submit
    const result = signIn(userEmail, "DevIQ@2025");
    if (result.success) {
      toast.success("Welcome to AASDAW!", {
        description: `Quick login successful.`,
      });
      navigate(result.redirectPath || "/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "var(--login-bg)" }}>
      {isDark && <GlobeScene />}

      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground backdrop-blur-md bg-muted/20 border border-border/30"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          <motion.div
            key={isDark ? "moon" : "sun"}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </motion.div>
        </Button>
      </div>

      <div className="relative z-10 w-full max-w-5xl px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center"
        >
          <motion.h1
            className="text-4xl font-bold text-foreground mb-2 glow-text"
            initial={{ y: -20 }}
            animate={{ y: 0 }}
          >
            AASDAW
          </motion.h1>
          <p className="text-muted-foreground mb-8 text-sm">
            AI-Assisted Service Deviation & Approval Workflow
          </p>

          {/* Login Form */}
          <GlassCard className="w-full max-w-md mb-8">
            <form onSubmit={handleAuth} className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground text-center">
                Sign In
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
              <Button
                type="submit"
                className="w-full gradient-primary text-primary-foreground font-semibold"
                disabled={loading}
              >
                <LogIn className="w-4 h-4 mr-2" />
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </GlassCard>

          {/* Quick Login Cards */}
          <div className="w-full">
            <p className="text-xs text-muted-foreground text-center mb-4">
              Quick Login — Click any role to sign in instantly
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {USERS.map((user, i) => {
                const Icon = roleIcons[user.role];
                const color = roleColors[user.role];
                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                  >
                    <GlassCard
                      hover
                      onClick={() => handleQuickLogin(user.email)}
                      className="flex flex-col items-center gap-2 py-5 text-center"
                    >
                      <motion.div
                        whileHover={{ rotate: 360, scale: 1.2 }}
                        transition={{ duration: 0.6 }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                          background: `${color}15`,
                          boxShadow: `0 0 20px ${color}30`,
                        }}
                      >
                        <Icon className="w-5 h-5" style={{ color }} />
                      </motion.div>
                      <span className="text-sm font-medium text-foreground">
                        {user.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {ROLE_LABELS[user.role]}
                      </span>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
