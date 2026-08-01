import type { Conversation, Message, OnlineStatus } from "@/types"

export const conversations: Conversation[] = [
  {
    id: "conv_01",
    projectId: "prj_01",
    participants: [
      { userId: "usr_client_01", role: "client", joinedAt: "2026-06-10T10:00:00Z" },
      { userId: "usr_free_01", role: "freelancer", joinedAt: "2026-06-10T10:00:00Z" },
    ],
    lastMessageId: "msg_06",
    updatedAt: "2026-07-20T16:32:00Z",
  },
  {
    id: "conv_02",
    projectId: "prj_02",
    participants: [
      { userId: "usr_client_01", role: "client", joinedAt: "2026-07-12T09:00:00Z" },
      { userId: "usr_free_02", role: "freelancer", joinedAt: "2026-07-12T09:00:00Z" },
    ],
    lastMessageId: "msg_09",
    updatedAt: "2026-07-19T11:05:00Z",
  },
  {
    id: "conv_03",
    projectId: "prj_04",
    participants: [
      { userId: "usr_client_01", role: "client", joinedAt: "2026-04-01T09:00:00Z" },
      { userId: "usr_free_02", role: "freelancer", joinedAt: "2026-04-01T09:00:00Z" },
    ],
    lastMessageId: "msg_11",
    updatedAt: "2026-05-15T10:00:00Z",
  },
]

export const messages: Message[] = [
  // conv_01 — Design System Overhaul
  {
    id: "msg_01",
    conversationId: "conv_01",
    senderId: "usr_client_01",
    content: "Hi! Excited to get the design system project rolling. When can you start the audit?",
    attachments: [],
    createdAt: "2026-06-10T10:10:00Z",
    readBy: ["usr_client_01", "usr_free_01"],
  },
  {
    id: "msg_02",
    conversationId: "conv_01",
    senderId: "usr_free_01",
    content: "This week works. I'll start with an inventory of existing components and share findings by Thursday.",
    attachments: [],
    createdAt: "2026-06-10T10:22:00Z",
    readBy: ["usr_client_01", "usr_free_01"],
  },
  {
    id: "msg_03",
    conversationId: "conv_01",
    senderId: "usr_free_01",
    content: "Here's the audit report — a few inconsistencies in spacing and type scale across the product.",
    attachments: [
      { id: "att_01", name: "audit-report.pdf", url: "#", type: "file", size: "4.2 MB" },
    ],
    createdAt: "2026-06-18T12:05:00Z",
    readBy: ["usr_client_01", "usr_free_01"],
  },
  {
    id: "msg_04",
    conversationId: "conv_01",
    senderId: "usr_client_01",
    content: "This is great work. Approved — go ahead and start on the component library.",
    attachments: [],
    createdAt: "2026-06-19T08:50:00Z",
    readBy: ["usr_client_01", "usr_free_01"],
  },
  {
    id: "msg_05",
    conversationId: "conv_01",
    senderId: "usr_free_01",
    content: "The core library is done — 24 components with light and dark variants. Figma link is attached to the milestone.",
    attachments: [],
    createdAt: "2026-07-20T16:28:00Z",
    readBy: ["usr_free_01"],
  },
  {
    id: "msg_06",
    conversationId: "conv_01",
    senderId: "usr_free_01",
    content: "Let me know if anything needs adjusting before you approve it.",
    attachments: [],
    createdAt: "2026-07-20T16:32:00Z",
    readBy: ["usr_free_01"],
  },

  // conv_02 — Marketing Website Rebuild
  {
    id: "msg_07",
    conversationId: "conv_02",
    senderId: "usr_client_01",
    content: "Wanted to flag — brand assets and copy are ready whenever you need them.",
    attachments: [],
    createdAt: "2026-07-12T09:30:00Z",
    readBy: ["usr_client_01", "usr_free_02"],
  },
  {
    id: "msg_08",
    conversationId: "conv_02",
    senderId: "usr_free_02",
    content: "Perfect timing, thanks. I'll get started on wireframes once the escrow deposit confirms on-chain.",
    attachments: [],
    createdAt: "2026-07-12T10:15:00Z",
    readBy: ["usr_client_01", "usr_free_02"],
  },
  {
    id: "msg_09",
    conversationId: "conv_02",
    senderId: "usr_client_01",
    content: "Deposit is submitted — should confirm shortly.",
    attachments: [],
    createdAt: "2026-07-19T11:05:00Z",
    readBy: ["usr_client_01"],
  },

  // conv_03 — API Integration Sprint (completed project, quiet thread)
  {
    id: "msg_10",
    conversationId: "conv_03",
    senderId: "usr_free_02",
    content: "Integration testing passed on both the payments and notifications services.",
    attachments: [],
    createdAt: "2026-05-14T15:00:00Z",
    readBy: ["usr_client_01", "usr_free_02"],
  },
  {
    id: "msg_11",
    conversationId: "conv_03",
    senderId: "usr_client_01",
    content: "Confirmed on my end too. Releasing the milestone now — thanks for the clean handoff.",
    attachments: [],
    createdAt: "2026-05-15T10:00:00Z",
    readBy: ["usr_client_01", "usr_free_02"],
  },
]

/**
 * Static presence snapshot for demo purposes — swap for a live
 * presence channel once real-time infrastructure exists.
 */
export const onlineStatusByUserId: Record<string, OnlineStatus> = {
  usr_client_01: "online",
  usr_client_02: "offline",
  usr_free_01: "online",
  usr_free_02: "away",
}

export function getMessagesForConversation(conversationId: string): Message[] {
  return messages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}