import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/contexts/NotificationContext";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, AlertTriangle, CheckCircle, Info, Clock, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

const typeIcons = {
  state_change: CheckCircle,
  sla_breach: AlertTriangle,
  approval_needed: Clock,
  info: Info,
};

const typeColors = {
  state_change: "text-success",
  sla_breach: "text-destructive",
  approval_needed: "text-warning",
  info: "text-primary",
};

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const { currentUser, role } = useAuth();
  const { getNotificationsForUser, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const navigate = useNavigate();

  const notifications = currentUser && role
    ? getNotificationsForUser(currentUser.id, role)
    : [];

  const handleClick = (notifId: string, requestId?: string) => {
    markAsRead(notifId);
    if (requestId) {
      navigate("/tracker");
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-96 z-50 rounded-xl border backdrop-blur-xl overflow-hidden"
            style={{
              background: "var(--panel-bg)",
              borderColor: "hsla(var(--glass-border))",
              boxShadow: "0 4px 24px hsla(var(--glow-primary) / 0.08)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs text-muted-foreground hover:text-foreground h-7"
                >
                  <CheckCheck className="w-3 h-3 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  No notifications
                </div>
              ) : (
                notifications.slice(0, 10).map((notif) => {
                  const Icon = typeIcons[notif.type];
                  const color = typeColors[notif.type];
                  return (
                    <button
                      key={notif.id}
                      onClick={() => handleClick(notif.id, notif.requestId)}
                      className={`w-full text-left px-4 py-3 border-b border-border/20 hover:bg-muted/30 transition-colors ${
                        !notif.read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex gap-3">
                        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground truncate">
                              {notif.title}
                            </span>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-muted-foreground/60 font-mono mt-1 block">
                            {new Date(notif.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
