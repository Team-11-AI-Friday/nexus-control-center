import type { UserRole } from "@/types/deviation";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  avatar: string;
  permissions: string[];
  activeDeviations?: number;
  pendingApprovals?: number;
  region: string;
}

export const USERS: AppUser[] = [
  {
    id: "usr-001",
    name: "Thivagaran",
    email: "thivagaran@deviq.telecom",
    password: "DevIQ@2025",
    role: "operations_manager",
    department: "Network Operations",
    avatar: "TH",
    permissions: [
      "initiate_deviation",
      "view_own_requests",
      "view_analytics",
      "approve_l1",
    ],
    activeDeviations: 3,
    region: "South India",
  },
  {
    id: "usr-002",
    name: "Muthu Pandi",
    email: "muthu.pandi@deviq.telecom",
    password: "DevIQ@2025",
    role: "network_manager",
    department: "Infrastructure",
    avatar: "MP",
    permissions: [
      "initiate_deviation",
      "approve_bandwidth",
      "view_network_topology",
      "view_analytics",
      "approve_l1",
    ],
    activeDeviations: 1,
    region: "West India",
  },
  {
    id: "usr-003",
    name: "Vishal",
    email: "vishal@deviq.telecom",
    password: "DevIQ@2025",
    role: "account_manager",
    department: "Enterprise Sales",
    avatar: "VS",
    permissions: [
      "initiate_deviation",
      "view_customer_context",
      "view_own_requests",
    ],
    activeDeviations: 5,
    region: "North India",
  },
  {
    id: "usr-004",
    name: "Arun",
    email: "arun@deviq.telecom",
    password: "DevIQ@2025",
    role: "finance_approver",
    department: "Revenue Assurance",
    avatar: "AR",
    permissions: [
      "approve_billing_credit",
      "reject_deviation",
      "request_more_info",
      "view_finance_reports",
      "view_audit_log",
      "approve_l2",
    ],
    pendingApprovals: 4,
    region: "Pan India",
  },
  {
    id: "usr-005",
    name: "Vasanth",
    email: "vasanth@deviq.telecom",
    password: "DevIQ@2025",
    role: "compliance_officer",
    department: "Legal & Compliance",
    avatar: "VA",
    permissions: [
      "compliance_review",
      "approve_kyc_deferral",
      "reject_deviation",
      "view_audit_log",
      "view_policy_library",
      "export_audit_csv",
    ],
    pendingApprovals: 2,
    region: "Pan India",
  },
  {
    id: "usr-006",
    name: "Sivanesan",
    email: "sivanesan@deviq.telecom",
    password: "DevIQ@2025",
    role: "system_admin",
    department: "IT Operations",
    avatar: "SN",
    permissions: ["*"],
    region: "Pan India",
  },
];

export function findUserByEmail(email: string): AppUser | undefined {
  return USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
}

export function authenticateUser(
  email: string,
  password: string
): AppUser | null {
  const user = findUserByEmail(email);
  if (user && user.password === password) {
    return user;
  }
  return null;
}

export function getUserById(id: string): AppUser | undefined {
  return USERS.find((u) => u.id === id);
}

export function getRoleDashboardPath(role: UserRole): string {
  switch (role) {
    case "operations_manager":
    case "network_manager":
    case "account_manager":
      return "/dashboard";
    case "finance_approver":
    case "compliance_officer":
      return "/approvals";
    case "system_admin":
      return "/dashboard";
    default:
      return "/dashboard";
  }
}
