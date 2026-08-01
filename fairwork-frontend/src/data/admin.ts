import type { AdminFlag, AuditLogEntry, Report, SystemHealthCheck } from "@/types"

// TODO: real admin access will come from the auth/session layer.
// For now a single demo account is flagged so the Admin Dashboard
// has someone to render as.
export const adminFlags: AdminFlag[] = [
  { userId: "usr_client_01", grantedAt: "2026-01-15T00:00:00Z" },
]

export function isAdmin(userId: string): boolean {
  return adminFlags.some((f) => f.userId === userId)
}

export const reports: Report[] = [
  {
    id: "rpt_01",
    reportedUserId: "usr_free_01",
    reportedById: "usr_client_02",
    projectId: "prj_03",
    reason: "quality",
    details:
      "Delivered onboarding screens do not match the approved prototype. Filed alongside the open dispute for platform review.",
    status: "reviewing",
    createdAt: "2026-07-09T09:00:00Z",
  },
  {
    id: "rpt_02",
    reportedUserId: "usr_client_02",
    reportedById: "usr_free_01",
    projectId: "prj_03",
    reason: "other",
    details:
      "Client requested work outside the original agreed scope without adjusting the contract or budget.",
    status: "open",
    createdAt: "2026-07-12T14:00:00Z",
  },
  {
    id: "rpt_03",
    reportedUserId: "usr_free_02",
    reportedById: "usr_client_01",
    projectId: "prj_04",
    reason: "quality",
    details:
      "Initial concern about integration test coverage, resolved after the freelancer provided additional test results.",
    status: "resolved",
    createdAt: "2026-04-20T10:00:00Z",
  },
]

export const auditLog: AuditLogEntry[] = [
  {
    id: "audit_01",
    actorId: "usr_client_01",
    action: "report_resolved",
    targetId: "rpt_03",
    note: "Freelancer provided additional test coverage evidence; closed with no further action.",
    createdAt: "2026-04-22T11:00:00Z",
  },
  {
    id: "audit_02",
    actorId: "usr_client_01",
    action: "dispute_override",
    targetId: "dsp_01",
    note: "Escalated for manual review given conflicting evidence from both parties.",
    createdAt: "2026-07-18T10:30:00Z",
  },
]

// Illustrative only — mirrors the "Protocol status" footer already in
// the Sidebar. Swap for a real health-check endpoint later.
export const systemHealth: SystemHealthCheck[] = [
  { service: "API", status: "operational", latencyMs: 84 },
  { service: "Database", status: "operational", latencyMs: 12 },
  { service: "Ethereum RPC (Sepolia)", status: "operational", latencyMs: 210 },
  { service: "Notification worker", status: "degraded", latencyMs: 640 },
]