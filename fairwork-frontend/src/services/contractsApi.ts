import { apiFetch } from "./apiClient"

interface Person {
  _id?: string
  id?: string
  firstName?: string
  lastName?: string
  email?: string
}

interface ProjectRef {
  _id?: string
  id?: string
  title?: string
  budget?: number
  description?: string
  status?: string
}

interface BackendContract {
  _id: string
  projectId: string | ProjectRef
  clientId: string | Person
  freelancerId: string | Person
  aiGeneratedText: string
  blockchainHash?: string
  signedByClient: boolean
  signedByFreelancer: boolean
  clientSignedAt?: string | null
  freelancerSignedAt?: string | null
  createdAt: string
  updatedAt?: string
}

export interface ApiContract {
  id: string
  projectId: string
  projectTitle: string | null
  projectBudget: number | null
  clientId: string
  clientName: string
  clientEmail: string
  freelancerId: string
  freelancerName: string
  freelancerEmail: string
  aiGeneratedText: string
  blockchainHash: string
  signedByClient: boolean
  signedByFreelancer: boolean
  clientSignedAt: string | null
  freelancerSignedAt: string | null
  createdAt: string
}

function extractId(v: string | Person | ProjectRef | undefined): string {
  if (!v) return ""
  if (typeof v === "string") return v
  return v.id || v._id || ""
}

function extractPersonName(v: string | Person | undefined, fallback: string): string {
  if (!v || typeof v === "string") return fallback
  const fullName = `${v.firstName || ""} ${v.lastName || ""}`.trim()
  return fullName || fallback
}

function extractEmail(v: string | Person | undefined): string {
  if (!v || typeof v === "string") return ""
  return v.email || ""
}

function toApiContract(c: BackendContract): ApiContract {
  const p = typeof c.projectId === "object" ? c.projectId : null
  return {
    id: c._id,
    projectId: extractId(c.projectId),
    projectTitle: p?.title || null,
    projectBudget: p?.budget ?? null,
    clientId: extractId(c.clientId),
    clientName: extractPersonName(c.clientId, "Client"),
    clientEmail: extractEmail(c.clientId),
    freelancerId: extractId(c.freelancerId),
    freelancerName: extractPersonName(c.freelancerId, "Freelancer"),
    freelancerEmail: extractEmail(c.freelancerId),
    aiGeneratedText: c.aiGeneratedText,
    blockchainHash: c.blockchainHash || "",
    signedByClient: Boolean(c.signedByClient),
    signedByFreelancer: Boolean(c.signedByFreelancer),
    clientSignedAt: c.clientSignedAt || null,
    freelancerSignedAt: c.freelancerSignedAt || null,
    createdAt: c.createdAt,
  }
}

export async function generateContract(
  projectId: string,
  freelancerId: string,
  token: string,
): Promise<ApiContract> {
  const raw = await apiFetch<BackendContract>("/contracts/generate", {
    method: "POST",
    token,
    body: { projectId, freelancerId },
  })
  return toApiContract(raw)
}

export async function getContract(contractId: string, token: string): Promise<ApiContract> {
  const raw = await apiFetch<BackendContract>(`/contracts/${contractId}`, { token })
  return toApiContract(raw)
}

export async function signContract(contractId: string, token: string): Promise<ApiContract> {
  const raw = await apiFetch<BackendContract>(`/contracts/${contractId}/sign`, {
    method: "PUT",
    token,
  })
  return toApiContract(raw)
}
