import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FilePlus, FileText, CheckSquare, GitBranch,
  ScrollText, BarChart3, BookOpen, Settings, Bell, LogOut, ChevronLeft, ChevronRight, Menu,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS } from "@/types/deviation";
import { ParticleBackground } from "@/components/3d/ParticleBackground";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "New Request", url: "/new-request", icon: FilePlus },
  { title: "My Requests", url: "/my-requests", icon: FileText },
  { title: "Approvals", url: "/approvals", icon: CheckSquare },
  { title: "Workflow Tracker", url: "/tracker", icon: GitBranch },
  { title: "Audit Log", url: "/audit", icon: ScrollText },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Policy Library", url: "/policies", icon: BookOpen },
];

export function AppLayout() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex w-full relative">
      <ParticleBackground />

      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.3 }}
        className="fixed left-0 top-0 h-screen z-40 flex flex-col border-r border-border/50 backdrop-blur-xl"
        style={{ background: "hsla(240, 15%, 6%, 0.9)" }}
      >
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">SD</span>
              </div>
              <span className="text-sm font-semibold text-foreground">ServiceDev</span>
            </motion.div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-muted-foreground hover:text-foreground"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <NavLink
                key={item.url}
                to={item.url}
                end
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                activeClassName=""
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </NavLink>
            );
          })}
        </nav>

        {!collapsed && role && (
          <div className="p-4 border-t border-border/30">
            <div className="text-xs text-muted-foreground">Logged in as</div>
            <div className="text-sm font-medium text-foreground truncate">{ROLE_LABELS[role]}</div>
          </div>
        )}
      </motion.aside>

      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? "ml-16" : "ml-60"}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-6 border-b border-border/30 backdrop-blur-xl" style={{ background: "hsla(240, 15%, 6%, 0.8)" }}>
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-foreground">
              {navItems.find(i => i.url === location.pathname)?.title || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-[10px] flex items-center justify-center text-destructive-foreground font-bold">3</span>
            </Button>
            {role && (
              <span className="text-xs font-mono px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
                {ROLE_LABELS[role]}
              </span>
            )}
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
