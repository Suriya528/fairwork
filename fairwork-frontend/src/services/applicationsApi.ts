import { API_URL } from "./apiClient"

export interface ApiApplication {
  id: string
  projectId: string
  freelancerId: string
  proposalText: string
  proposedAmount: number
  estimatedDelivery: string
  status: "pending" | "accepted" | "rejected" | "withdrawn"
  createdAt: string
  updatedAt: string
  project?: {
    id: string
    title: string
    budget: number
    status: string
    category: string
    clientId?: {
      firstName: string
      lastName: string
    }
  }
  freelancer?: {
    id: string
    firstName: string
    lastName: string
    avatarUrl?: string
    walletAddress?: string
    rating?: number
    reviewCount?: number
  }
}

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }
}

function normalizeApplication(raw: Record<string, unknown>): ApiApplication {
  const p = raw.projectId && typeof raw.projectId === "object" ? (raw.projectId as Record<string, unknown>) : null
  const f = raw.freelancerId && typeof raw.freelancerId === "object" ? (raw.freelancerId as Record<string, unknown>) : null
  const c = p?.clientId && typeof p.clientId === "object" ? (p.clientId as Record<string, unknown>) : null

  return {
    id: String(raw._id || raw.id || ""),
    projectId: p ? String(p._id || p.id || "") : String(raw.projectId || ""),
    freelancerId: f ? String(f._id || f.id || "") : String(raw.freelancerId || ""),
    proposalText: String(raw.proposalText || ""),
    proposedAmount: Number(raw.proposedAmount || 0),
    estimatedDelivery: String(raw.estimatedDelivery || ""),
    status: (raw.status as ApiApplication["status"]) || "pending",
    createdAt: String(raw.createdAt || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || new Date().toISOString()),
    project: p
      ? {
          id: String(p._id || p.id || ""),
          title: String(p.title || ""),
          budget: Number(p.budget || 0),
          status: String(p.status || "open"),
          category: String(p.category || "Web Development"),
          clientId: c ? { firstName: String(c.firstName || ""), lastName: String(c.lastName || "") } : undefined,
        }
      : undefined,
    freelancer: f
      ? {
          id: String(f._id || f.id || ""),
          firstName: String(f.firstName || ""),
          lastName: String(f.lastName || ""),
          avatarUrl: f.avatarUrl ? String(f.avatarUrl) : undefined,
          walletAddress: f.walletAddress ? String(f.walletAddress) : undefined,
          rating: Number(f.rating || 5),
          reviewCount: Number(f.reviewCount || 0),
        }
      : undefined,
  }
}

export async function applyToProject(
  data: { projectId: string; proposalText: string; proposedAmount: number; estimatedDelivery: string },
  token: string,
): Promise<ApiApplication> {
  const res = await fetch(`${API_URL}/applications`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || "Failed to submit application.")
  }

  const raw = await res.json()
  return normalizeApplication(raw)
}

export async function getMyApplications(token: string): Promise<ApiApplication[]> {
  const res = await fetch(`${API_URL}/applications/mine`, {
    headers: authHeaders(token),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || "Failed to load applications.")
  }

  const list = (await res.json()) as Record<string, unknown>[]
  return list.map(normalizeApplication)
}

export async function getProjectApplications(projectId: string, token: string): Promise<ApiApplication[]> {
  const res = await fetch(`${API_URL}/applications/project/${projectId}`, {
    headers: authHeaders(token),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || "Failed to load project applications.")
  }

  const list = (await res.json()) as Record<string, unknown>[]
  return list.map(normalizeApplication)
}

export async function acceptApplication(
  applicationId: string,
  token: string,
): Promise<{ application: ApiApplication; project: Record<string, unknown> }> {
  const res = await fetch(`${API_URL}/applications/${applicationId}/accept`, {
    method: "POST",
    headers: authHeaders(token),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || "Failed to accept application & hire freelancer.")
  }

  const body = await res.json()
  return {
    application: normalizeApplication(body.application),
    project: body.project,
  }
}

export async function rejectApplication(applicationId: string, token: string): Promise<ApiApplication> {
  const res = await fetch(`${API_URL}/applications/${applicationId}/reject`, {
    method: "POST",
    headers: authHeaders(token),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || "Failed to reject application.")
  }

  const raw = await res.json()
  return normalizeApplication(raw)
}

export async function withdrawApplication(applicationId: string, token: string): Promise<ApiApplication> {
  const res = await fetch(`${API_URL}/applications/${applicationId}/withdraw`, {
    method: "POST",
    headers: authHeaders(token),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || "Failed to withdraw application.")
  }

  const raw = await res.json()
  return normalizeApplication(raw)
}
