/**
 * FairWork domain models.
 *
 * These are the shared contracts every page and future API call relies on.
 * They intentionally mirror the escrow lifecycle described by the protocol:
 *   project -> escrow deposit -> milestones -> approval -> release
 *   (with an optional dispute branch)
 */

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

export type UserRole = "client" | "freelancer"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
  /** On-chain wallet used for escrow settlement. */
  walletAddress: string
  title?: string
  location?: string
  /** ISO timestamp. */
  joinedAt: string
  rating: number
  reviewCount: number
  verified: boolean
}

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

export type ProjectStatus =
  | "draft"
  | "funding"
  | "active"
  | "in_review"
  | "disputed"
  | "completed"
  | "cancelled"

export interface Project {
  id: string
  title: string
  description: string
  status: ProjectStatus
  clientId: string
  freelancerId: string | null
  /** Total contract value across all milestones. */
  budget: number
  currency: "USD"
  /** Crypto denomination held in escrow. */
  escrowSymbol: "ETH" | "USDC"
  escrowAmount: number
  milestoneIds: string[]
  tags: string[]
  createdAt: string
  dueDate: string
}

/* ------------------------------------------------------------------ */
/* Milestones                                                          */
/* ------------------------------------------------------------------ */

export type MilestoneStatus =
  | "pending" // not started, awaiting funding/kickoff
  | "in_progress" // freelancer working
  | "submitted" // delivered, awaiting client approval
  | "approved" // approved, funds queued for release
  | "released" // funds released on-chain
  | "disputed" // under dispute
  | "rejected" // client rejected the submission

export interface Milestone {
  id: string
  projectId: string
  title: string
  description: string
  status: MilestoneStatus
  amount: number
  order: number
  dueDate: string
  submittedAt: string | null
  approvedAt: string | null
  releasedAt: string | null
  /** Files/links delivered for this milestone. */
  deliverables: Deliverable[]
}

export interface Deliverable {
  id: string
  name: string
  type: "file" | "link"
  url: string
  size?: string
  uploadedAt: string
}

/* ------------------------------------------------------------------ */
/* Escrow & transactions                                               */
/* ------------------------------------------------------------------ */

export type TransactionType =
  | "deposit"
  | "release"
  | "refund"
  | "dispute_hold"
  | "fee"
  | "withdrawal"

export type TransactionStatus = "pending" | "confirmed" | "failed"

export interface Transaction {
  id: string
  projectId: string
  milestoneId: string | null
  type: TransactionType
  status: TransactionStatus
  amount: number
  symbol: "ETH" | "USDC"
  /** On-chain transaction hash. */
  hash: string
  from: string
  to: string
  createdAt: string
  confirmedAt: string | null
  gasFee?: number
}

export interface EscrowAccount {
  projectId: string
  contractAddress: string
  totalDeposited: number
  totalReleased: number
  totalLocked: number
  symbol: "ETH" | "USDC"
}

/* ------------------------------------------------------------------ */
/* Disputes                                                            */
/* ------------------------------------------------------------------ */

export type DisputeStatus =
  | "open"
  | "evidence"
  | "under_review"
  | "resolved"
  | "closed"

export type DisputeResolution =
  | "released_to_freelancer"
  | "refunded_to_client"
  | "split"
  | "pending"

export interface Dispute {
  id: string
  projectId: string
  milestoneId: string
  raisedById: string
  status: DisputeStatus
  reason: string
  resolution: DisputeResolution
  createdAt: string
  updatedAt: string
  evidence: DisputeEvidence[]
}

export interface DisputeEvidence {
  id: string
  submittedById: string
  note: string
  attachments: Deliverable[]
  submittedAt: string
}

/* ------------------------------------------------------------------ */
/* Activity & notifications                                            */
/* ------------------------------------------------------------------ */

export type ActivityType =
  | "project_created"
  | "escrow_funded"
  | "milestone_submitted"
  | "milestone_approved"
  | "funds_released"
  | "dispute_opened"
  | "dispute_resolved"
  | "message"

export interface ActivityItem {
  id: string
  type: ActivityType
  actorId: string
  projectId: string | null
  message: string
  createdAt: string
  read: boolean
}

/* ------------------------------------------------------------------ */
/* Generic async state — used by loading/error/empty patterns          */
/* ------------------------------------------------------------------ */

export type AsyncStatus = "idle" | "loading" | "success" | "error" | "empty"

export interface AsyncState<T> {
  status: AsyncStatus
  data: T | null
  error: string | null
}

/* ------------------------------------------------------------------ */
/* Contracts                                                           */
/* ------------------------------------------------------------------ */

export type ContractStatus =
  | "draft"
  | "pending_signatures"
  | "active"
  | "completed"
  | "voided"

export interface Contract {
  id: string
  projectId: string
  title: string
  /** AI-generated or manually authored contract body. */
  content: string
  status: ContractStatus
  clientSigned: boolean
  clientSignedAt: string | null
  freelancerSigned: boolean
  freelancerSignedAt: string | null
  /** Set once the signed contract's hash is anchored on-chain. */
  blockchainHash: string | null
  createdAt: string
}

/* ------------------------------------------------------------------ */
/* Chat                                                                 */
/* ------------------------------------------------------------------ */

export interface Participant {
  userId: string
  role: UserRole
  joinedAt: string
}

export interface ChatAttachment {
  id: string
  name: string
  url: string
  type: "file" | "image" | "link"
  size?: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  attachments: ChatAttachment[]
  createdAt: string
  /** userIds that have read this message — powers read receipts. */
  readBy: string[]
}

export interface Conversation {
  id: string
  /** Null for platform-support conversations not tied to a project. */
  projectId: string | null
  participants: Participant[]
  lastMessageId: string | null
  updatedAt: string
}

export type OnlineStatus = "online" | "away" | "offline"

/** Ephemeral UI-only state — never persisted, driven by a live socket later. */
export interface TypingState {
  conversationId: string
  userId: string
  isTyping: boolean
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export type NotificationType =
  | "milestone_submitted"
  | "milestone_approved"
  | "funds_released"
  | "escrow_funded"
  | "dispute_opened"
  | "dispute_resolved"
  | "new_message"
  | "contract_ready"
  | "system"

export type NotificationCategory =
  | "project"
  | "payment"
  | "dispute"
  | "message"
  | "system"

export type NotificationPriority = "low" | "normal" | "high"

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  category: NotificationCategory
  priority: NotificationPriority
  title: string
  message: string
  projectId: string | null
  read: boolean
  createdAt: string
}

export interface NotificationPreferences {
  userId: string
  email: Record<NotificationCategory, boolean>
  push: Record<NotificationCategory, boolean>
}

/* ------------------------------------------------------------------ */
/* Admin                                                                */
/* ------------------------------------------------------------------ */

/**
 * Deliberately NOT added to UserRole. That union is load-bearing across
 * every page (isClient-style checks), so admin access is modeled as a
 * separate flag rather than a breaking third role value.
 */
export interface AdminFlag {
  userId: string
  grantedAt: string
}

export type ReportReason = "fraud" | "harassment" | "spam" | "quality" | "other"
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed"

export interface Report {
  id: string
  reportedUserId: string
  reportedById: string
  projectId: string | null
  reason: ReportReason
  details: string
  status: ReportStatus
  createdAt: string
}

export type AuditAction =
  | "user_suspended"
  | "user_reinstated"
  | "project_removed"
  | "dispute_override"
  | "report_resolved"

export interface AuditLogEntry {
  id: string
  actorId: string
  action: AuditAction
  targetId: string
  note: string
  createdAt: string
}

export interface PlatformMetrics {
  totalUsers: number
  totalProjects: number
  totalVolumeUsd: number
  activeDisputes: number
  monthlySignups: { month: string; count: number }[]
}

export interface SystemHealthCheck {
  service: string
  status: "operational" | "degraded" | "down"
  latencyMs: number
}

/* ------------------------------------------------------------------ */
/* Help Center                                                         */
/* ------------------------------------------------------------------ */

export interface HelpArticle {
  id: string
  category: string
  question: string
  answer: string
}