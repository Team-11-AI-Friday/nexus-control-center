export type UserRole =
  | "operations_manager"
  | "network_manager"
  | "account_manager"
  | "finance_approver"
  | "compliance_officer"
  | "system_admin";

export const ROLE_LABELS: Record<UserRole, string> = {
  operations_manager: "Operations Manager",
  network_manager: "Network Manager",
  account_manager: "Account Manager",
  finance_approver: "Finance Approver",
  compliance_officer: "Compliance Officer",
  system_admin: "System Admin",
};

export type DeviationType =
  | "billing_credit"
  | "bandwidth_boost"
  | "sla_waiver"
  | "content_access"
  | "kyc_deferral";

export const DEVIATION_TYPE_LABELS: Record<DeviationType, string> = {
  billing_credit: "Billing Credit Override",
  bandwidth_boost: "Bandwidth / Data Boost",
  sla_waiver: "SLA Waiver",
  content_access: "Content Access Exception",
  kyc_deferral: "KYC Deferral",
};

export type UrgencyLevel = "low" | "medium" | "high" | "critical";

export type WorkflowStage =
  | "initiated"
  | "ai_review"
  | "l1_approval"
  | "l2_approval"
  | "compliance"
  | "executed"
  | "closed";

export const WORKFLOW_STAGES: WorkflowStage[] = [
  "initiated",
  "ai_review",
  "l1_approval",
  "l2_approval",
  "compliance",
  "executed",
  "closed",
];

export const STAGE_LABELS: Record<WorkflowStage, string> = {
  initiated: "Initiated",
  ai_review: "AI Review",
  l1_approval: "L1 Approval",
  l2_approval: "L2 Approval",
  compliance: "Compliance",
  executed: "Executed",
  closed: "Closed",
};

export type RequestStatus = "pending" | "approved" | "rejected" | "in_review" | "escalated";

export interface DeviationRequest {
  id: string;
  customerAccountId: string;
  deviationType: DeviationType;
  contractReference: string;
  requestedValue: string;
  effectiveDate: string;
  duration: string;
  urgency: UrgencyLevel;
  justification: string;
  aiJustification: string;
  aiRiskScore: number;
  currentStage: WorkflowStage;
  status: RequestStatus;
  requestorId: string;
  requestorName: string;
  requestorRole: UserRole;
  createdAt: string;
  updatedAt: string;
  slaDeadline: string;
  approvalChain: ApprovalStep[];
  policyReferences: PolicyReference[];
}

export interface ApprovalStep {
  stage: WorkflowStage;
  approverName: string;
  approverRole: UserRole;
  status: "pending" | "approved" | "rejected" | "skipped";
  timestamp?: string;
  comment?: string;
  aiRecommendation?: string;
}

export interface PolicyReference {
  id: string;
  title: string;
  clause: string;
  excerpt: string;
  confidenceScore: number;
  sourceDocument: string;
}

export interface ActivityLogEntry {
  id: string;
  requestId: string;
  action: string;
  actorName: string;
  actorRole: UserRole;
  timestamp: string;
  details: string;
}

export interface KPIData {
  totalActiveDeviations: number;
  pendingApprovals: number;
  slaBreached: number;
  avgRiskScore: number;
}

export interface AnalyticsData {
  requestsByType: { month: string; billing_credit: number; bandwidth_boost: number; sla_waiver: number; content_access: number; kyc_deferral: number }[];
  slaBreachTrend: { month: string; breaches: number; total: number }[];
  approvalRate: { name: string; value: number }[];
  riskDistribution: { score: string; count: number }[];
}
