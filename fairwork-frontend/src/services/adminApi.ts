import { apiFetch } from "./apiClient"

export interface AdminOverview {
  totalUsers: number; totalClients: number; totalFreelancers: number; totalProjects: number
  activeProjects: number; completedProjects: number; fundedEscrows: number; completedEscrows: number
  openDisputes: number; resolvedDisputes: number; platformEscrowVolume: number | null; platformEscrowVolumeUnit: string | null
}

export interface AdminUser { id: string; firstName: string; lastName: string; email: string; role: string; walletAddress: string; createdAt: string }
export interface AdminProject { id: string; title: string; budget: number; status: string; client: { firstName: string; lastName: string } | null; freelancer: { firstName: string; lastName: string } | null; milestoneCount: number; releasedMilestoneCount: number; escrowFunded: boolean; escrowCompleted: boolean; escrowDisputed: boolean; createdAt: string }
export interface AdminDispute { id: string; project: { title: string; clientId: { firstName: string; lastName: string } | null; freelancerId: { firstName: string; lastName: string } | null } | null; raisedBy: { firstName: string; lastName: string } | null; status: string; winner: string; reason: string; createdAt: string; updatedAt: string }
export interface AdminPage<T> { items: T[]; page: number; limit: number; total: number; pageCount: number }
export interface AdminSystem { backend: string; mongoState: number; chain: string | null; listenerConfigured: boolean; synchronization: { lastProcessedBlock: number; updatedAt: string } | null; contracts: Record<string, string> }

export const getAdminOverview = (token: string) => apiFetch<AdminOverview>("/admin/overview", { token })
export const getAdminUsers = (token: string, limit = 5) => apiFetch<AdminPage<AdminUser>>(`/admin/users?limit=${limit}`, { token })
export const getAdminProjects = (token: string, limit = 5) => apiFetch<AdminPage<AdminProject>>(`/admin/projects?limit=${limit}`, { token })
export const getAdminDisputes = (token: string, limit = 5) => apiFetch<AdminPage<AdminDispute>>(`/admin/disputes?limit=${limit}`, { token })
export const getAdminSystem = (token: string) => apiFetch<AdminSystem>("/admin/system", { token })
