import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import type {
  DeviationRequest,
  ActivityLogEntry,
  WorkflowStage,
  UserRole,
  ApprovalStep,
} from "@/types/deviation";
import { seedDeviations, seedActivityLog } from "@/data/deviations";

interface DeviationContextType {
  deviations: DeviationRequest[];
  activityLog: ActivityLogEntry[];
  addDeviation: (deviation: DeviationRequest) => void;
  updateDeviation: (id: string, updates: Partial<DeviationRequest>) => void;
  advanceStage: (
    id: string,
    action: "approved" | "rejected",
    approverName: string,
    approverRole: UserRole,
    comment?: string,
    isOverride?: boolean
  ) => void;
  addAuditLog: (entry: Omit<ActivityLogEntry, "id" | "immutable">) => void;
  getDeviationsForUser: (userId: string) => DeviationRequest[];
  getPendingApprovalsForRole: (role: UserRole) => DeviationRequest[];
  getDeviationById: (id: string) => DeviationRequest | undefined;
  nextDeviationId: () => string;
}

const DeviationContext = createContext<DeviationContextType | undefined>(undefined);

let logCounter = seedActivityLog.length + 1;

export const DeviationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deviations, setDeviations] = useState<DeviationRequest[]>(seedDeviations);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>(seedActivityLog);

  const addDeviation = useCallback((deviation: DeviationRequest) => {
    setDeviations((prev) => [deviation, ...prev]);
  }, []);

  const updateDeviation = useCallback((id: string, updates: Partial<DeviationRequest>) => {
    setDeviations((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d))
    );
  }, []);

  const addAuditLog = useCallback((entry: Omit<ActivityLogEntry, "id" | "immutable">) => {
    const newEntry: ActivityLogEntry = {
      ...entry,
      id: `LOG-${String(logCounter++).padStart(3, "0")}`,
      immutable: true,
    };
    setActivityLog((prev) => [newEntry, ...prev]);
  }, []);

  const advanceStage = useCallback(
    (
      id: string,
      action: "approved" | "rejected",
      approverName: string,
      approverRole: UserRole,
      comment?: string,
      isOverride?: boolean
    ) => {
      setDeviations((prev) =>
        prev.map((d) => {
          if (d.id !== id) return d;

          const now = new Date().toISOString();
          const updatedChain = d.approvalChain.map((step) => {
            if (step.stage === d.currentStage && step.status === "pending") {
              return {
                ...step,
                status: action,
                approverName,
                approverRole,
                timestamp: now,
                comment,
                isOverride,
              } as ApprovalStep;
            }
            return step;
          });

          // Determine next stage
          const stages: WorkflowStage[] = [
            "initiated", "ai_review", "l1_approval", "l2_approval",
            "compliance", "final_approval", "executed", "closed",
          ];
          const currentIdx = stages.indexOf(d.currentStage);
          let nextStage = d.currentStage;
          let newStatus = d.status;

          if (action === "approved" && currentIdx < stages.length - 1) {
            nextStage = stages[currentIdx + 1];
            newStatus = nextStage === "closed" ? "approved" : "in_review";
          } else if (action === "rejected") {
            newStatus = "rejected";
            // Mark all subsequent steps as skipped
            updatedChain.forEach((step) => {
              const stepIdx = stages.indexOf(step.stage);
              if (stepIdx > currentIdx && step.status === "pending") {
                step.status = "skipped";
              }
            });
          }

          return {
            ...d,
            approvalChain: updatedChain,
            currentStage: action === "rejected" ? d.currentStage : nextStage,
            status: newStatus,
            updatedAt: now,
          };
        })
      );

      // Log the action
      addAuditLog({
        requestId: id,
        action: action === "approved"
          ? `${isOverride ? "Override " : ""}Approved`
          : "Rejected",
        actorName: approverName,
        actorRole: approverRole,
        timestamp: new Date().toISOString(),
        details: comment || `Request ${action} at current stage${isOverride ? " (override with audit note)" : ""}`,
      });
    },
    [addAuditLog]
  );

  const getDeviationsForUser = useCallback(
    (userId: string) => deviations.filter((d) => d.requestorId === userId),
    [deviations]
  );

  const getPendingApprovalsForRole = useCallback(
    (role: UserRole): DeviationRequest[] => {
      return deviations.filter((d) => {
        if (d.status === "approved" || d.status === "rejected") return false;

        // Find who should be approving at the current stage
        const currentStep = d.approvalChain.find(
          (s) => s.stage === d.currentStage && s.status === "pending"
        );
        if (!currentStep) return false;

        // Role-based routing
        switch (role) {
          case "operations_manager":
            return d.currentStage === "l1_approval";
          case "network_manager":
            return d.currentStage === "l1_approval" || (d.currentStage === "l2_approval" && d.deviationType === "bandwidth_boost");
          case "finance_approver":
            return d.currentStage === "l2_approval" && d.deviationType !== "bandwidth_boost";
          case "compliance_officer":
            return d.currentStage === "compliance";
          case "system_admin":
            return d.currentStage === "final_approval" || d.currentStage === "ai_review";
          default:
            return false;
        }
      });
    },
    [deviations]
  );

  const getDeviationById = useCallback(
    (id: string) => deviations.find((d) => d.id === id),
    [deviations]
  );

  const nextDeviationId = useCallback(() => {
    const maxNum = deviations.reduce((max, d) => {
      const num = parseInt(d.id.split("-").pop() || "0");
      return num > max ? num : max;
    }, 0);
    return `DEV-2026-${String(maxNum + 1).padStart(3, "0")}`;
  }, [deviations]);

  const value = useMemo(
    () => ({
      deviations,
      activityLog,
      addDeviation,
      updateDeviation,
      advanceStage,
      addAuditLog,
      getDeviationsForUser,
      getPendingApprovalsForRole,
      getDeviationById,
      nextDeviationId,
    }),
    [deviations, activityLog, addDeviation, updateDeviation, advanceStage, addAuditLog, getDeviationsForUser, getPendingApprovalsForRole, getDeviationById, nextDeviationId]
  );

  return (
    <DeviationContext.Provider value={value}>
      {children}
    </DeviationContext.Provider>
  );
};

export const useDeviations = () => {
  const ctx = useContext(DeviationContext);
  if (!ctx) throw new Error("useDeviations must be used within DeviationProvider");
  return ctx;
};
