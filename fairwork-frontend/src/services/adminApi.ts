import { apiFetch } from "./apiClient"

export interface AdminOverview {
  totalUsers: number
  totalClients: number
  totalFreelancers: number
  totalAdmins: number
  activeUsers: number
  suspendedUsers: number
  totalProjects: number
  openProjects: number
  activeProjects: number
  completedProjects: number
  cancelledProjects: number
  totalApplications: number
  pendingApplications: number
  acceptedApplications: number
  rejectedApplications: number
  applicationConversionRate: number
  totalContracts: number
  fundedEscrows: number
  completedEscrows: number
  disputedEscrows: number
  openDisputes: number
  resolvedDisputes: number
  totalReports: number
  openReports: number
  platformEscrowVolume: number | null
  platformEscrowVolumeUnit: string | null
}

export interface AdminUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: "client" | "freelancer" | "admin"
  walletAddress: string
  reputationScore: number
  totalReviews: number
  isSuspended: boolean
  suspendedAt: string | null
  suspendedReason: string
  projectCount: number
  applicationCount: number
  createdAt: string
}

export interface AdminUserDetail {
  user: AdminUser & { skills: string[]; bio: string; avatarUrl: string; updatedAt: string }
  projects: Array<{ _id: string; title: string; budget: number; status: string; createdAt: string }>
  applications: Array<{ _id: string; projectId?: { title: string }; status: string; proposedAmount: number; createdAt: string }>
  contracts: Array<{ _id: string; projectId?: { title: string }; createdAt: string }>
  disputes: Array<{ _id: string; projectId?: { title: string }; reason: string; status: string }>
  reports: Array<{ _id: string; category: string; description: string; status: string; createdAt: string }>
  auditLogs: Array<{ _id: string; action: string; reason: string; createdAt: string }>
}

export interface AdminProject {
  id: string
  title: string
  description: string
  budget: number
  status: "open" | "in_progress" | "completed" | "cancelled" | "disputed"
  client: { _id: string; firstName: string; lastName: string; email: string } | null
  freelancer: { _id: string; firstName: string; lastName: string; email: string } | null
  milestoneCount: number
  releasedMilestoneCount: number
  escrowFunded: boolean
  escrowCompleted: boolean
  escrowDisputed: boolean
  escrowTxnHash: string
  contractId: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminApplication {
  _id: string
  projectId: { _id: string; title: string; budget: number; status: string; clientId: string } | null
  freelancerId: { _id: string; firstName: string; lastName: string; email: string; walletAddress: string } | null
  proposalText: string
  proposedAmount: number
  estimatedDelivery: string
  status: "pending" | "accepted" | "rejected" | "withdrawn"
  createdAt: string
}

export interface AdminContract {
  _id: string
  projectId: { _id: string; title: string; budget: number; status: string; escrowFunded: boolean; escrowCompleted: boolean; escrowTxnHash: string } | null
  clientId: { _id: string; firstName: string; lastName: string; email: string } | null
  freelancerId: { _id: string; firstName: string; lastName: string; email: string } | null
  signedByClient: boolean
  signedByFreelancer: boolean
  createdAt: string
}

export interface AdminEscrow {
  id: string
  projectTitle: string
  budget: number
  projectStatus: string
  client: { _id: string; firstName: string; lastName: string; walletAddress: string } | null
  freelancer: { _id: string; firstName: string; lastName: string; walletAddress: string } | null
  escrowState: "funded" | "completed" | "disputed" | "awaiting_funding"
  onChainConfirmed: boolean
  escrowTxnHash: string
  escrowToken: string
  createdAt: string
}

export interface AdminDispute {
  id: string
  project: {
    _id: string
    title: string
    budget: number
    clientId: { firstName: string; lastName: string; email: string; walletAddress: string } | null
    freelancerId: { firstName: string; lastName: string; email: string; walletAddress: string } | null
    escrowTxnHash: string
  } | null
  raisedBy: { _id: string; firstName: string; lastName: string; email: string } | null
  reason: string
  status: "pending" | "resolved"
  winner: "client" | "freelancer" | "none"
  evidenceCount: number
  blockchainTxn: string
  arbitratorAddress: string
  createdAt: string
  updatedAt: string
}

export interface AdminArbitrators {
  arbitratorAddress: string
  disputeContractAddress: string
  authorityModel: string
  activeStatus: boolean
  assignedDisputes: number
  resolvedDisputes: number
}

export interface AdminTransaction {
  id: string
  hash: string
  type: "ESCROW_FUNDED" | "ESCROW_RELEASED" | "DISPUTE_RESOLVED"
  projectTitle: string
  status: "CONFIRMED" | "PENDING" | "FAILED"
  chain: string
  contractAddress: string
  timestamp: string
}

export interface AdminReport {
  _id: string
  reporter: { _id: string; firstName: string; lastName: string; email: string } | null
  targetType: "user" | "project" | "application" | "message"
  targetId: string
  category: string
  description: string
  status: "open" | "under_review" | "resolved" | "dismissed"
  resolutionNotes: string
  resolvedBy: { firstName: string; lastName: string } | null
  createdAt: string
}

export interface AdminAnalytics {
  userGrowth: Array<{ date: string; users: number }>
  projectDistribution: Array<{ status: string; count: number }>
  applicationStats: Array<{ status: string; count: number }>
}

export interface AdminAuditLog {
  _id: string
  admin: { firstName: string; lastName: string; email: string } | null
  adminName: string
  action: string
  targetType: string
  targetId: string
  reason: string
  details: Record<string, unknown>
  createdAt: string
}

export interface AdminSystem {
  backend: string
  mongoState: number
  chain: string | null
  listenerConfigured: boolean
  synchronization: { lastProcessedBlock: number; updatedAt: string } | null
  contracts: Record<string, string>
}

export interface AdminIntegrity {
  scanTimestamp: string
  totalAnomalies: number
  anomalies: Array<{
    type: string
    severity: "HIGH" | "MEDIUM" | "WARNING"
    entityType: string
    entityId: string
    message: string
  }>
}

export interface AdminPage<T> {
  items: T[]
  page: number
  limit: number
  total: number
  pageCount: number
}

// API Methods
export const getAdminOverview = (token: string) =>
  apiFetch<AdminOverview>("/admin/overview", { token })

export const getAdminUsers = (
  token: string,
  params: { page?: number; limit?: number; query?: string; role?: string; status?: string; wallet?: string } = {}
) => {
  const query = new URLSearchParams()
  if (params.page) query.set("page", String(params.page))
  if (params.limit) query.set("limit", String(params.limit))
  if (params.query) query.set("query", params.query)
  if (params.role) query.set("role", params.role)
  if (params.status) query.set("status", params.status)
  if (params.wallet) query.set("wallet", params.wallet)
  return apiFetch<AdminPage<AdminUser>>(`/admin/users?${query.toString()}`, { token })
}

export const getAdminUserDetail = (token: string, userId: string) =>
  apiFetch<AdminUserDetail>(`/admin/users/${userId}`, { token })

export const suspendUser = (token: string, userId: string, reason: string) =>
  apiFetch<{ message: string; user: { id: string; isSuspended: boolean } }>(`/admin/users/${userId}/suspend`, {
    token,
    method: "POST",
    body: { reason },
  })

export const unsuspendUser = (token: string, userId: string, reason?: string) =>
  apiFetch<{ message: string; user: { id: string; isSuspended: boolean } }>(`/admin/users/${userId}/unsuspend`, {
    token,
    method: "POST",
    body: { reason },
  })

export const getAdminProjects = (
  token: string,
  params: { page?: number; limit?: number; query?: string; status?: string; escrowStatus?: string } = {}
) => {
  const query = new URLSearchParams()
  if (params.page) query.set("page", String(params.page))
  if (params.limit) query.set("limit", String(params.limit))
  if (params.query) query.set("query", params.query)
  if (params.status) query.set("status", params.status)
  if (params.escrowStatus) query.set("escrowStatus", params.escrowStatus)
  return apiFetch<AdminPage<AdminProject>>(`/admin/projects?${query.toString()}`, { token })
}

export const getAdminApplications = (token: string, page = 1, limit = 20) =>
  apiFetch<AdminPage<AdminApplication>>(`/admin/applications?page=${page}&limit=${limit}`, { token })

export const getAdminContracts = (token: string, page = 1, limit = 20) =>
  apiFetch<AdminPage<AdminContract>>(`/admin/contracts?page=${page}&limit=${limit}`, { token })

export const getAdminEscrows = (token: string, page = 1, limit = 20) =>
  apiFetch<AdminPage<AdminEscrow>>(`/admin/escrows?page=${page}&limit=${limit}`, { token })

export const getAdminDisputes = (token: string, page = 1, limit = 20) =>
  apiFetch<AdminPage<AdminDispute>>(`/admin/disputes?page=${page}&limit=${limit}`, { token })

export const getAdminArbitrators = (token: string) =>
  apiFetch<AdminArbitrators>("/admin/arbitrators", { token })

export const getAdminTransactions = (token: string, page = 1, limit = 20) =>
  apiFetch<AdminPage<AdminTransaction>>(`/admin/transactions?page=${page}&limit=${limit}`, { token })

export const getAdminReports = (token: string, page = 1, limit = 20, status?: string) =>
  apiFetch<AdminPage<AdminReport>>(`/admin/reports?page=${page}&limit=${limit}${status ? `&status=${status}` : ""}`, { token })

export const updateAdminReport = (token: string, reportId: string, status: string, resolutionNotes: string) =>
  apiFetch<AdminReport>(`/admin/reports/${reportId}`, {
    token,
    method: "PATCH",
    body: { status, resolutionNotes },
  })

export const getAdminAnalytics = (token: string) =>
  apiFetch<AdminAnalytics>("/admin/analytics", { token })

export const getAdminAuditLogs = (token: string, page = 1, limit = 20) =>
  apiFetch<AdminPage<AdminAuditLog>>(`/admin/audit-logs?page=${page}&limit=${limit}`, { token })

export const getAdminSystem = (token: string) =>
  apiFetch<AdminSystem>("/admin/system", { token })

export const getAdminIntegrity = (token: string) =>
  apiFetch<AdminIntegrity>("/admin/integrity", { token })
