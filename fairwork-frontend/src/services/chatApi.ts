import { io, type Socket } from "socket.io-client"
import { API_URL, apiFetch } from "./apiClient"

interface Sender {
  _id: string
  firstName: string
  lastName: string
  avatarUrl?: string
}

export interface FileMeta {
  filename?: string
  mimeType?: string
  size?: number
}

interface BackendMessage {
  _id: string
  projectId: string
  senderId: string | Sender
  content: string
  fileUrl: string
  fileMeta?: FileMeta
  type?: "TEXT" | "FILE" | "SYSTEM_EVENT"
  systemEventKey?: string
  read: boolean
  readAt?: string
  createdAt: string
}

export interface ApiMessage {
  id: string
  projectId: string
  senderId: string
  senderName: string | null
  senderAvatarUrl: string | null
  content: string
  fileUrl: string
  fileMeta?: FileMeta
  type: "TEXT" | "FILE" | "SYSTEM_EVENT"
  systemEventKey?: string
  read: boolean
  readAt?: string
  createdAt: string
}

export interface EscrowSnapshot {
  projectId: string
  title: string
  status: string
  settlementState: "ACTIVE" | "SETTLED_COMPLETED" | "SETTLED_REFUNDED" | "DISPUTED"
  totalBudget: number
  releasedAmount: number
  pendingAmount: number
  unreleasedAmount: number
  escrowFunded: boolean
  escrowTxnHash: string
  client: Sender
  freelancer?: Sender
  milestonesCount: number
}

export function toApiMessage(m: BackendMessage): ApiMessage {
  return {
    id: m._id,
    projectId: m.projectId,
    senderId: typeof m.senderId === "string" ? m.senderId : m.senderId._id,
    senderName: typeof m.senderId === "string" ? null : `${m.senderId.firstName} ${m.senderId.lastName}`.trim(),
    senderAvatarUrl: typeof m.senderId === "string" ? null : m.senderId.avatarUrl ?? null,
    content: m.content,
    fileUrl: m.fileUrl,
    fileMeta: m.fileMeta,
    type: m.type || (m.fileUrl ? "FILE" : "TEXT"),
    systemEventKey: m.systemEventKey,
    read: m.read,
    readAt: m.readAt,
    createdAt: m.createdAt,
  }
}

export async function getMessages(projectId: string, token: string): Promise<ApiMessage[]> {
  return (await apiFetch<BackendMessage[]>(`/messages/${projectId}`, { token })).map(toApiMessage)
}

export async function getEscrowSnapshot(projectId: string, token: string): Promise<EscrowSnapshot> {
  return apiFetch<EscrowSnapshot>(`/messages/${projectId}/snapshot`, { token })
}

export async function sendMessage(
  projectId: string,
  content: string,
  token: string,
  fileUrl = "",
  fileMeta?: FileMeta,
  type: "TEXT" | "FILE" | "SYSTEM_EVENT" = "TEXT",
): Promise<ApiMessage> {
  return toApiMessage(
    await apiFetch<BackendMessage>("/messages", {
      method: "POST",
      token,
      body: { projectId, content, fileUrl, fileMeta, type },
    }),
  )
}

export async function markRead(projectId: string, token: string, readAt?: string): Promise<void> {
  await apiFetch(`/messages/${projectId}/read`, {
    method: "PUT",
    token,
    body: { readAt: readAt || new Date().toISOString() },
  })
}

export function connectChat(token: string): Socket {
  return io(API_URL.replace(/\/api$/, ""), { auth: { token } })
}
