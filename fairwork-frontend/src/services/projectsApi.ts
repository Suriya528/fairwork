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

import { API_URL, ApiError, apiFetch } from "./apiClient"

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
  paymentReleased?: boolean
}

interface BackendProject {
  _id: string
  title: string
  description: string
  category?: string
  customCategory?: string
  budget: number
  milestones: BackendMilestone[]
  status: "open" | "in_progress" | "completed" | "disputed"
  clientId: BackendPopulatedUser | string
  freelancerId: BackendPopulatedUser | string | null
  escrowTxnHash: string
  escrowFunded?: boolean
  escrowCompleted?: boolean
  escrowDisputed?: boolean
  escrowToken?: string
  contractId: string | null
  deadlineAt?: string
  durationDays?: number
  deadlineMode?: "duration" | "exact"
  createdAt: string
  updatedAt: string
}

interface BackendDeliverable {
  _id: string
  filename: string
  url: string
  publicId: string
  mimeType: string
  size: number
  milestoneId: string | null
  submissionNotes?: string
  uploadedBy: BackendPopulatedUser | string
  uploadedAt: string
}

// --- Frontend-facing shape (real, adapted) --------------------------------

export type ApiProjectStatus = "open" | "in_progress" | "completed" | "disputed"
export type ApiMilestoneStatus = "pending" | "in_progress" | "submitted" | "revision_requested" | "completed"

export interface ApiMilestone {
  id: string
  projectId: string
  title: string
  amount: number
  status: ApiMilestoneStatus
  /** Recovered from array position — the backend has no explicit order field. */
  order: number
  paymentReleased: boolean
  submissionNotes?: string
  submittedAt?: string
  revisionNotes?: string
  revisionRequestedAt?: string
}

export interface ApiProject {
  id: string
  title: string
  description: string
  category: string
  customCategory?: string
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
  escrowFunded: boolean
  escrowCompleted: boolean
  escrowDisputed: boolean
  escrowToken: string
  deadlineAt: string | null
  durationDays: number | null
  deadlineMode: "duration" | "exact"
  createdAt: string
}

export interface ApiDeliverable {
  id: string
  filename: string
  url: string
  mimeType: string
  size: number
  milestoneId: string | null
  submissionNotes?: string
  uploadedByName: string | null
  uploadedAt: string
}

/** Helper to format category for display (e.g. "Other — AI Automation Consulting"). */
export function getDisplayCategory(project: { category?: string; customCategory?: string }): string {
  if (project.category === "Other" && project.customCategory?.trim()) {
    return `Other — ${project.customCategory.trim()}`
  }
  return project.category || "Web Development"
}

// --- Adapters --------------------------------------------------------------

function personId(u: BackendPopulatedUser | string | null | undefined): string | null {
  if (!u) return null
  return typeof u === "string" ? u : (u.id || u._id || null)
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
    id: m.id || m._id || `milestone-${index + 1}`,
    projectId,
    title: m.title || "",
    amount: m.amount || 0,
    status: m.status || "pending",
    order: index + 1,
    paymentReleased: m.paymentReleased ?? false,
    submissionNotes: m.submissionNotes,
    submittedAt: m.submittedAt,
    revisionNotes: m.revisionNotes,
    revisionRequestedAt: m.revisionRequestedAt,
  }
}

function toProject(p: BackendProject): ApiProject {
  if (!p || typeof p !== "object") {
    throw new Error("Invalid project data received")
  }
  const projId = p.id || p._id || ""
  return {
    id: projId,
    title: p.title || "",
    description: p.description || "",
    category: p.category || "Web Development",
    customCategory: p.customCategory || "",
    budget: p.budget || 0,
    status: p.status || "open",
    clientId: personId(p.clientId) ?? "",
    clientName: personName(p.clientId),
    clientWalletAddress: personWallet(p.clientId),
    freelancerId: personId(p.freelancerId),
    freelancerName: personName(p.freelancerId),
    freelancerWalletAddress: personWallet(p.freelancerId),
    milestones: (p.milestones || []).map((m, i) => toMilestone(m, projId, i)),
    escrowTxnHash: p.escrowTxnHash || "",
    contractId: p.contractId || null,
    escrowFunded: Boolean(p.escrowFunded),
    escrowCompleted: Boolean(p.escrowCompleted),
    escrowDisputed: Boolean(p.escrowDisputed),
    escrowToken: p.escrowToken || "",
    deadlineAt: p.deadlineAt || null,
    durationDays: typeof p.durationDays === "number" ? p.durationDays : null,
    deadlineMode: p.deadlineMode === "exact" ? "exact" : "duration",
    createdAt: p.createdAt || new Date().toISOString(),
    updatedAt: p.updatedAt || new Date().toISOString(),
  }
}

function toDeliverable(file: BackendDeliverable): ApiDeliverable {
  return {
    id: file._id,
    filename: file.filename,
    url: file.url,
    mimeType: file.mimeType,
    size: file.size,
    milestoneId: file.milestoneId,
    submissionNotes: file.submissionNotes,
    uploadedByName: personName(file.uploadedBy),
    uploadedAt: file.uploadedAt,
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
  return (Array.isArray(data) ? data : []).map(toProject)
}

export async function getMyProjects(token: string): Promise<ApiProject[]> {
  const data = await apiFetch<BackendProject[]>("/projects/mine", { token })
  return (Array.isArray(data) ? data : []).map(toProject)
}

export async function getProjectById(id: string, token: string): Promise<ApiProject> {
  const data = await apiFetch<BackendProject>(`/projects/${id}`, { token })
  return toProject(data)
}

export interface CreateProjectPayload {
  title: string
  description: string
  category: string
  customCategory?: string
  budget: number
  deadlineMode?: "duration" | "exact"
  durationValue?: number
  durationUnit?: "hours" | "days" | "weeks" | "months"
  deadlineAt?: string
  milestones: { title: string; amount: number; dueDate?: string }[]
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

export async function assignFreelancer(projectId: string, freelancerId: string, token: string): Promise<ApiProject> {
  const data = await apiFetch<BackendProject>(`/projects/${projectId}/assign`, { method: "PUT", token, body: { freelancerId } })
  return toProject(data)
}

export interface ApiReferenceFile {
  id: string
  filename: string
  url: string
  publicId: string
  mimeType: string
  size: number
  uploadedById: string
  uploadedByName: string | null
  uploadedAt: string
}

interface BackendReferenceFile {
  _id: string
  filename: string
  url: string
  publicId: string
  mimeType: string
  size: number
  uploadedBy: BackendPopulatedUser | string
  uploadedAt: string
}

function toReferenceFile(raw: BackendReferenceFile): ApiReferenceFile {
  const isPop = typeof raw.uploadedBy === "object" && raw.uploadedBy !== null
  return {
    id: raw._id,
    filename: raw.filename,
    url: raw.url,
    publicId: raw.publicId,
    mimeType: raw.mimeType,
    size: raw.size,
    uploadedById: isPop ? (raw.uploadedBy as BackendPopulatedUser)._id : (raw.uploadedBy as string),
    uploadedByName: isPop ? getUserName(raw.uploadedBy as BackendPopulatedUser) : null,
    uploadedAt: raw.uploadedAt,
  }
}

export async function getProjectDeliverables(projectId: string, token: string): Promise<ApiDeliverable[]> {
  const data = await apiFetch<BackendDeliverable[]>(`/projects/${projectId}/files`, { token })
  return (Array.isArray(data) ? data : []).map(toDeliverable)
}

export async function uploadProjectDeliverable(
  projectId: string,
  file: File,
  milestoneId: string,
  token: string,
  submissionNotes?: string,
): Promise<ApiDeliverable> {
  const formData = new FormData()
  formData.append("file", file)
  if (milestoneId) formData.append("milestoneId", milestoneId)
  if (submissionNotes) formData.append("submissionNotes", submissionNotes)

  let response: Response
  try {
    response = await fetch(`${API_URL}/projects/${projectId}/deliverables`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.")
  }

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message = data && typeof data === "object" && "message" in data && typeof data.message === "string"
      ? data.message
      : "Couldn't upload the file."
    throw new ApiError(message, response.status)
  }
  return toDeliverable(data as BackendDeliverable)
}

export async function submitMilestone(
  projectId: string,
  milestoneId: string,
  submissionNotes: string,
  token: string,
): Promise<ApiProject> {
  const data = await apiFetch<BackendProject>(`/projects/${projectId}/milestones/${milestoneId}/submit`, {
    method: "POST",
    token,
    body: JSON.stringify({ submissionNotes }),
  })
  return toProject(data)
}

export async function requestMilestoneRevision(
  projectId: string,
  milestoneId: string,
  revisionNotes: string,
  token: string,
): Promise<ApiProject> {
  const data = await apiFetch<BackendProject>(`/projects/${projectId}/milestones/${milestoneId}/request-revision`, {
    method: "POST",
    token,
    body: JSON.stringify({ revisionNotes }),
  })
  return toProject(data)
}

export async function approveMilestone(
  projectId: string,
  milestoneId: string,
  token: string,
): Promise<ApiProject> {
  const data = await apiFetch<BackendProject>(`/projects/${projectId}/milestones/${milestoneId}/approve`, {
    method: "POST",
    token,
  })
  return toProject(data)
}

export async function getProjectReferenceFiles(projectId: string, token: string): Promise<ApiReferenceFile[]> {
  const data = await apiFetch<BackendReferenceFile[]>(`/projects/${projectId}/reference-files`, { token })
  return data.map(toReferenceFile)
}

export async function uploadProjectReferenceFile(projectId: string, file: File, token: string): Promise<ApiReferenceFile> {
  const formData = new FormData()
  formData.append("file", file)

  let response: Response
  try {
    response = await fetch(`${API_URL}/projects/${projectId}/reference-files`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.")
  }

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message = data && typeof data === "object" && "message" in data && typeof data.message === "string"
      ? data.message
      : "Couldn't upload the reference file."
    throw new ApiError(message, response.status)
  }
  return toReferenceFile(data as BackendReferenceFile)
}
