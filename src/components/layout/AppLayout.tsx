import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FilePlus, FileText, CheckSquare, GitBranch,
  ScrollText, BarChart3, BookOpen, Bell, LogOut, ChevronLeft, ChevronRight,
  Sun, Moon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ROLE_LABELS } from "@/types/deviation";
import { ParticleBackground } from "@/components/3d/ParticleBackground";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { NotificationPanel } from "@/components/layout/NotificationPanel";
import type { UserRole } from "@/types/deviation";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  roles: UserRole[] | "*";
}

const navItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: "*" },
  { title: "New Request", url: "/new-request", icon: FilePlus, roles: ["operations_manager", "network_manager", "account_manager", "system_admin"] },
  { title: "My Requests", url: "/my-requests", icon: FileText, roles: ["operations_manager", "network_manager", "account_manager", "system_admin"] },
  { title: "Approvals", url: "/approvals", icon: CheckSquare, roles: ["operations_manager", "network_manager", "finance_approver", "compliance_officer", "system_admin"] },
  { title: "Workflow Tracker", url: "/tracker", icon: GitBranch, roles: "*" },
  { title: "Audit Log", url: "/audit", icon: ScrollText, roles: ["finance_approver", "compliance_officer", "system_admin"] },
  { title: "Analytics", url: "/analytics", icon: BarChart3, roles: "*" },
  { title: "Policy Library", url: "/policies", icon: BookOpen, roles: ["compliance_officer", "system_admin"] },
];

function getVisibleNavItems(role: UserRole | null): NavItem[] {
  if (!role) return [];
  return navItems.filter((item) => item.roles === "*" || item.roles.includes(role));
}

export function AppLayout() {
  const { currentUser, role, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const handleLogout = () => {
    signOut();
    navigate("/");
  };

  const visibleNav = getVisibleNavItems(role);

  return (
    <div className="min-h-screen flex w-full relative">
      {isDark && <ParticleBackground />}

      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.3 }}
        className="fixed left-0 top-0 h-screen z-40 flex flex-col border-r border-border/50 backdrop-blur-xl"
        style={{ background: "var(--layout-sidebar-bg)" }}
      >
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">DQ</span>
              </div>
              <span className="text-sm font-semibold text-foreground">AASDAW</span>
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
          {visibleNav.map((item) => {
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

        {/* User Info */}
        {!collapsed && currentUser && (
          <div className="p-4 border-t border-border/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-primary-foreground">
                  {currentUser.avatar}
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {currentUser.department}
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.aside>

      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? "ml-16" : "ml-60"}`}>
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 h-14 flex items-center justify-between px-6 border-b border-border/30 backdrop-blur-xl"
          style={{ background: "var(--layout-header-bg)" }}
        >
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-foreground">
              {visibleNav.find((i) => i.url === location.pathname)?.title || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              <motion.div
                key={isDark ? "moon" : "sun"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </motion.div>
            </Button>

            {/* Notification Bell */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-muted-foreground hover:text-foreground"
                onClick={() => setNotifOpen(!notifOpen)}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-[10px] flex items-center justify-center text-destructive-foreground font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
              <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>

            {/* Role Badge */}
            {role && (
              <span className="text-xs font-mono px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
                {ROLE_LABELS[role]}
              </span>
            )}

            {/* User Name */}
            {currentUser && (
              <span className="text-xs text-foreground font-medium hidden md:block">
                {currentUser.name}
              </span>
            )}

            {/* Logout */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
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
