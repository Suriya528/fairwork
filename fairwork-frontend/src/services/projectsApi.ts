/**
 * Projects domain service — real backend calls for routes/project.js.
 *
 * ApiProject/ApiMilestone here are the REAL backend shape, not the
 * dummy-data Project/Milestone types in @/types. Those stay untouched
 * for now since 9+ pages not yet migrated (Escrow, Disputes, Contracts,
 * Milestones, Analytics, Admin) still depend on the dummy shape. Once
 * every page is off dummy data, @/types gets updated to match this and
 * this duplication goes away — see the note in this migration's summary.
 */

import { apiFetch } from "./apiClient"

// --- Backend response shapes ---------------------------------------------

interface BackendPopulatedUser {
  _id: string
  firstName: string
  lastName: string
  walletAddress?: string
}

interface BackendMilestone {
  _id: string
  title: string
  amount: number
  status: "pending" | "completed"
}

interface BackendProject {
  _id: string
  title: string
  description: string
  budget: number
  milestones: BackendMilestone[]
  status: "open" | "in_progress" | "completed" | "disputed"
  clientId: BackendPopulatedUser | string
  freelancerId: BackendPopulatedUser | string | null
  escrowTxnHash: string
  contractId: string | null
  createdAt: string
  updatedAt: string
}

// --- Frontend-facing shape (real, adapted) --------------------------------

export type ApiProjectStatus = "open" | "in_progress" | "completed" | "disputed"
export type ApiMilestoneStatus = "pending" | "completed"

export interface ApiMilestone {
  id: string
  projectId: string
  title: string
  amount: number
  status: ApiMilestoneStatus
  /** Recovered from array position — the backend has no explicit order field. */
  order: number
}

export interface ApiProject {
  id: string
  title: string
  description: string
  budget: number
  status: ApiProjectStatus
  clientId: string
  /** Populated by the backend on list/detail routes; null if somehow absent. */
  clientName: string | null
  clientWalletAddress: string | null
  freelancerId: string | null
  freelancerName: string | null
  freelancerWalletAddress: string | null
  milestones: ApiMilestone[]
  escrowTxnHash: string
  contractId: string | null
  createdAt: string
}

// --- Adapters --------------------------------------------------------------

function personId(u: BackendPopulatedUser | string | null | undefined): string | null {
  if (!u) return null
  return typeof u === "string" ? u : u._id
}

function personName(u: BackendPopulatedUser | string | null | undefined): string | null {
  if (!u || typeof u === "string") return null
  return `${u.firstName} ${u.lastName}`.trim()
}

function personWallet(u: BackendPopulatedUser | string | null | undefined): string | null {
  if (!u || typeof u === "string") return null
  return u.walletAddress ?? null
}

function toMilestone(m: BackendMilestone, projectId: string, index: number): ApiMilestone {
  return {
    id: m._id,
    projectId,
    title: m.title,
    amount: m.amount,
    status: m.status,
    order: index + 1,
  }
}

function toProject(p: BackendProject): ApiProject {
  return {
    id: p._id,
    title: p.title,
    description: p.description,
    budget: p.budget,
    status: p.status,
    clientId: personId(p.clientId) ?? "",
    clientName: personName(p.clientId),
    clientWalletAddress: personWallet(p.clientId),
    freelancerId: personId(p.freelancerId),
    freelancerName: personName(p.freelancerId),
    freelancerWalletAddress: personWallet(p.freelancerId),
    milestones: p.milestones.map((m, i) => toMilestone(m, p._id, i)),
    escrowTxnHash: p.escrowTxnHash,
    contractId: p.contractId,
    createdAt: p.createdAt,
  }
}

// --- Public API --------------------------------------------------------

/**
 * GET /api/projects — note this is server-side hardcoded to status
 * "open" only (see projectController.js:getAllProjects). No search,
 * sort, or filter query params exist on the backend yet.
 */
export async function getProjects(token: string): Promise<ApiProject[]> {
  const data = await apiFetch<BackendProject[]>("/projects", { token })
  return data.map(toProject)
}

export async function getMyProjects(token: string): Promise<ApiProject[]> {
  const data = await apiFetch<BackendProject[]>("/projects/mine", { token })
  return data.map(toProject)
}

export async function getProjectById(id: string, token: string): Promise<ApiProject> {
  const data = await apiFetch<BackendProject>(`/projects/${id}`, { token })
  return toProject(data)
}

export interface CreateProjectPayload {
  title: string
  description: string
  budget: number
  milestones: { title: string; amount: number }[]
}

export async function createProject(
  payload: CreateProjectPayload,
  token: string,
): Promise<ApiProject> {
  const data = await apiFetch<BackendProject>("/projects", {
    method: "POST",
    token,
    body: payload,
  })
  return toProject(data)
}
