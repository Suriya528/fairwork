import { apiFetch } from "./apiClient"

export interface AiRecommendation {
  winner: "client" | "freelancer" | "none"
  rationale: string
  evaluatedAt?: string
  clientAccepted: boolean
  clientAcceptedAt?: string
  freelancerAccepted: boolean
  freelancerAcceptedAt?: string
  expiresAt?: string
}

interface BackendDispute {
  _id: string
  projectId: string
  raisedBy: string | { _id: string; firstName: string; lastName: string }
  reason: string
  evidence: string[]
  status: "pending" | "resolved"
  winner: "client" | "freelancer" | "none"
  clientVotes: number
  freelancerVotes: number
  blockchainTxn: string
  createdAt: string
  aiRecommendation?: AiRecommendation
}

export interface ApiDispute {
  id: string
  projectId: string
  raisedById: string
  raisedByName: string | null
  reason: string
  evidence: string[]
  status: "pending" | "resolved"
  winner: "client" | "freelancer" | "none"
  clientVotes: number
  freelancerVotes: number
  blockchainTxn: string
  createdAt: string
  aiRecommendation?: AiRecommendation
}

function toApiDispute(d: BackendDispute): ApiDispute {
  const p = d.raisedBy
  return {
    id: d._id,
    projectId: d.projectId,
    raisedById: typeof p === "string" ? p : p._id,
    raisedByName: typeof p === "string" ? null : `${p.firstName} ${p.lastName}`.trim(),
    reason: d.reason,
    evidence: d.evidence ?? [],
    status: d.status,
    winner: d.winner,
    clientVotes: d.clientVotes,
    freelancerVotes: d.freelancerVotes,
    blockchainTxn: d.blockchainTxn,
    createdAt: d.createdAt,
    aiRecommendation: d.aiRecommendation,
  }
}

export async function raiseDispute(projectId: string, reason: string, token: string): Promise<ApiDispute> {
  return toApiDispute(
    await apiFetch<BackendDispute>("/disputes", {
      method: "POST",
      token,
      body: { projectId, reason },
    })
  )
}

export async function getDispute(projectId: string, token: string): Promise<ApiDispute | null> {
  const data = await apiFetch<BackendDispute | null>(`/disputes/${projectId}`, { token })
  return data ? toApiDispute(data) : null
}

export async function evaluateDisputeWithAI(disputeId: string, token: string): Promise<ApiDispute> {
  const data = await apiFetch<BackendDispute>(`/disputes/${disputeId}/ai-evaluate`, {
    method: "POST",
    token,
  })
  return toApiDispute(data)
}

export async function acceptAiRecommendation(disputeId: string, token: string): Promise<{ dispute: ApiDispute; settled: boolean }> {
  const res = await apiFetch<{ dispute: BackendDispute; settled: boolean }>(`/disputes/${disputeId}/accept-ai`, {
    method: "POST",
    token,
  })
  return {
    dispute: toApiDispute(res.dispute),
    settled: res.settled,
  }
}
