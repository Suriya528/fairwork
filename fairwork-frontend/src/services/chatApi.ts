import { io, type Socket } from "socket.io-client"
import { API_URL, apiFetch } from "./apiClient"
interface Sender { _id: string; firstName: string; lastName: string; avatarUrl?: string }
interface BackendMessage { _id: string; projectId: string; senderId: string | Sender; content: string; fileUrl: string; read: boolean; createdAt: string }
export interface ApiMessage { id: string; projectId: string; senderId: string; senderName: string | null; senderAvatarUrl: string | null; content: string; fileUrl: string; read: boolean; createdAt: string }
export function toApiMessage(m: BackendMessage): ApiMessage { return { id: m._id, projectId: m.projectId, senderId: typeof m.senderId === "string" ? m.senderId : m.senderId._id, senderName: typeof m.senderId === "string" ? null : `${m.senderId.firstName} ${m.senderId.lastName}`.trim(), senderAvatarUrl: typeof m.senderId === "string" ? null : m.senderId.avatarUrl ?? null, content: m.content, fileUrl: m.fileUrl, read: m.read, createdAt: m.createdAt } }
export async function getMessages(projectId: string, token: string): Promise<ApiMessage[]> { return (await apiFetch<BackendMessage[]>(`/messages/${projectId}`, { token })).map(toApiMessage) }
export async function sendMessage(projectId: string, content: string, token: string, fileUrl = ""): Promise<ApiMessage> { return toApiMessage(await apiFetch<BackendMessage>("/messages", { method: "POST", token, body: { projectId, content, fileUrl } })) }
export async function markRead(projectId: string, token: string): Promise<void> { await apiFetch(`/messages/${projectId}/read`, { method: "PUT", token }) }
export function connectChat(token: string): Socket { return io(API_URL.replace(/\/api$/, ""), { auth: { token } }) }
