import type { Notification, NotificationPreferences } from "@/types"

export const notifications: Notification[] = [
  {
    id: "notif_01",
    userId: "usr_client_01",
    type: "milestone_submitted",
    category: "project",
    priority: "high",
    title: "Milestone submitted for review",
    message: "Marcus Reyes submitted \u201cCore component library\u201d — ready for your approval.",
    projectId: "prj_01",
    read: false,
    createdAt: "2026-07-20T16:30:00Z",
  },
  {
    id: "notif_02",
    userId: "usr_client_01",
    type: "new_message",
    category: "message",
    priority: "normal",
    title: "New message",
    message: "Marcus Reyes sent you a message about Design System Overhaul.",
    projectId: "prj_01",
    read: false,
    createdAt: "2026-07-20T16:32:00Z",
  },
  {
    id: "notif_03",
    userId: "usr_client_01",
    type: "escrow_funded",
    category: "payment",
    priority: "normal",
    title: "Escrow deposit pending",
    message: "Your 3.1 ETH deposit for Marketing Website Rebuild is awaiting on-chain confirmation.",
    projectId: "prj_02",
    read: false,
    createdAt: "2026-07-20T15:00:00Z",
  },
  {
    id: "notif_04",
    userId: "usr_client_01",
    type: "contract_ready",
    category: "project",
    priority: "normal",
    title: "Contract awaiting signature",
    message: "The service agreement for Marketing Website Rebuild is ready — you've signed, waiting on the freelancer.",
    projectId: "prj_02",
    read: true,
    createdAt: "2026-07-12T09:12:00Z",
  },
  {
    id: "notif_05",
    userId: "usr_client_01",
    type: "funds_released",
    category: "payment",
    priority: "normal",
    title: "Funds released",
    message: "You released 2,500 USDC to Marcus Reyes for \u201cDiscovery & audit.\u201d",
    projectId: "prj_01",
    read: true,
    createdAt: "2026-06-19T09:06:00Z",
  },
  {
    id: "notif_06",
    userId: "usr_client_01",
    type: "funds_released",
    category: "payment",
    priority: "normal",
    title: "Project completed",
    message: "API Integration Sprint is complete and fully paid out — 5,000 USDC released.",
    projectId: "prj_04",
    read: true,
    createdAt: "2026-05-15T10:05:00Z",
  },
  {
    id: "notif_07",
    userId: "usr_client_01",
    type: "system",
    category: "system",
    priority: "low",
    title: "Welcome to FairWork",
    message: "Complete your profile and connect a wallet to start posting projects with escrow protection.",
    projectId: null,
    read: true,
    createdAt: "2026-06-01T08:00:00Z",
  },
]

export const notificationPreferences: NotificationPreferences[] = [
  {
    userId: "usr_client_01",
    email: { project: true, payment: true, dispute: true, message: false, system: false },
    push: { project: true, payment: true, dispute: true, message: true, system: false },
  },
]

export function getNotificationsForUser(userId: string): Notification[] {
  return notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}