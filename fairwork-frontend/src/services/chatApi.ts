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

export interface ChatThreadSummary {
  projectId: string
  projectTitle: string
  status: string
  counterparty: {
    id: string
    name: string
    avatarUrl: string
    role: "client" | "freelancer"
  }
  lastMessage: {
    content: string
    createdAt: string
    senderId: string
  } | null
  unreadCount: number
}

export interface ChatSummaryResponse {
  totalUnread: number
  threads: ChatThreadSummary[]
}

export function toApiMessage(m: BackendMessage | any): ApiMessage {
  const rawSender = m.senderId
  let senderId = ""
  let senderName: string | null = null
  let senderAvatarUrl: string | null = null

  if (typeof rawSender === "string") {
    senderId = rawSender
  } else if (rawSender && typeof rawSender === "object") {
    senderId = String(rawSender._id || rawSender.id || "")
    if (rawSender.firstName || rawSender.lastName) {
      senderName = `${rawSender.firstName || ""} ${rawSender.lastName || ""}`.trim() || null
    }
    senderAvatarUrl = rawSender.avatarUrl ?? null
  }

  return {
    id: String(m._id || m.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    projectId: typeof m.projectId === "string" ? m.projectId : String(m.projectId?._id || m.projectId || ""),
    senderId,
    senderName,
    senderAvatarUrl,
    content: m.content || "",
    fileUrl: m.fileUrl || "",
    fileMeta: m.fileMeta,
    type: m.type || (m.fileUrl ? "FILE" : "TEXT"),
    systemEventKey: m.systemEventKey,
    read: Boolean(m.read),
    readAt: m.readAt,
    createdAt: m.createdAt || new Date().toISOString(),
  }
}

export async function getMessages(projectId: string, token: string): Promise<ApiMessage[]> {
  return (await apiFetch<BackendMessage[]>(`/messages/${projectId}`, { token })).map(toApiMessage)
}

export async function getEscrowSnapshot(projectId: string, token: string): Promise<EscrowSnapshot> {
  return apiFetch<EscrowSnapshot>(`/messages/${projectId}/snapshot`, { token })
}

export async function getChatSummary(token: string): Promise<ChatSummaryResponse> {
  return apiFetch<ChatSummaryResponse>("/messages/summary", { token })
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


// H-4: Singleton Socket.IO connection — prevents connection leaks
let _socket: Socket | null = null
let _socketToken: string | null = null

export function connectChat(token: string): Socket {
  // Reuse existing socket if token hasn't changed and socket is not disconnected/closed
  if (_socket && _socketToken === token && !_socket.disconnected) {
    return _socket
  }
  // Disconnect old socket if token changed or disconnected
  if (_socket) {
    _socket.disconnect()
  }
  _socket = io(API_URL.replace(/\/api$/, ""), { auth: { token } })
  _socketToken = token
  return _socket
}

export function disconnectChat(): void {
  if (_socket) {
    _socket.disconnect()
    _socket = null
    _socketToken = null
  }
}
