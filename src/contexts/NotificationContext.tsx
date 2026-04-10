import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { Notification, UserRole } from "@/types/deviation";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  getNotificationsForUser: (userId: string, role: UserRole) => Notification[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

let notifCounter = 1;

const initialNotifications: Notification[] = [
  {
    id: "notif-001",
    type: "sla_breach",
    title: "SLA Escalation Alert",
    message: "DEV-2026-004 (SLA Waiver for Airtel Enterprise) has less than 2 hours until SLA deadline. Immediate action required.",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: false,
    requestId: "DEV-2026-004",
    targetRole: "finance_approver",
  },
  {
    id: "notif-002",
    type: "approval_needed",
    title: "New Approval Request",
    message: "DEV-2026-003 (Bandwidth Boost for BSNL Corporate) is awaiting your L1 approval.",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    read: false,
    requestId: "DEV-2026-003",
    targetRole: "operations_manager",
  },
  {
    id: "notif-003",
    type: "state_change",
    title: "Request Progressed",
    message: "DEV-2026-005 (Content Access for Star Media) has moved to Compliance Review stage.",
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    read: false,
    requestId: "DEV-2026-005",
  },
  {
    id: "notif-004",
    type: "approval_needed",
    title: "Final Approval Pending",
    message: "DEV-2026-006 (₹12L Credit for Sony LIV Enterprise) requires System Admin final approval. Critical risk score: 89.",
    timestamp: new Date(Date.now() - 28800000).toISOString(),
    read: false,
    requestId: "DEV-2026-006",
    targetRole: "system_admin",
  },
  {
    id: "notif-005",
    type: "info",
    title: "AI Risk Assessment Complete",
    message: "AASDAW AI has completed risk assessment for DEV-2026-002 (KYC Deferral). Score: 71 (HIGH).",
    timestamp: new Date(Date.now() - 18000000).toISOString(),
    read: true,
    requestId: "DEV-2026-002",
  },
];

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
      const newNotif: Notification = {
        ...notification,
        id: `notif-${String(notifCounter++).padStart(3, "0")}`,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const getNotificationsForUser = useCallback(
    (userId: string, role: UserRole): Notification[] => {
      return notifications.filter((n) => {
        // System admin sees all
        if (role === "system_admin") return true;
        // If targeted at specific role, check match
        if (n.targetRole && n.targetRole !== role) return false;
        // If targeted at specific user, check match
        if (n.targetUserId && n.targetUserId !== userId) return false;
        return true;
      });
    },
    [notifications]
  );

  const value = useMemo(
    () => ({ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, getNotificationsForUser }),
    [notifications, unreadCount, addNotification, markAsRead, markAllAsRead, getNotificationsForUser]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
};
