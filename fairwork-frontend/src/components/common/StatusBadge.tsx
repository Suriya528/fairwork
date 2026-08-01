import { Badge, type BadgeTone } from "@/components/ui/Badge"
import type {
  ContractStatus,
  DisputeStatus,
  MilestoneStatus,
  ProjectStatus,
  ReportStatus,
  TransactionStatus,
} from "@/types"

type AnyStatus =
  | ProjectStatus
  | MilestoneStatus
  | DisputeStatus
  | TransactionStatus
  | ContractStatus
  | ReportStatus

interface StatusMeta {
  label: string
  tone: BadgeTone
}

/**
 * Central mapping of every domain status to a label + tone.
 * Keeps status styling consistent across projects, milestones, disputes,
 * transactions, and contracts so pages never re-invent it.
 */
const statusMap: Record<AnyStatus, StatusMeta> = {
  // Projects
  draft: { label: "Draft", tone: "neutral" },
  funding: { label: "Funding", tone: "warning" },
  active: { label: "Active", tone: "info" },
  in_review: { label: "In review", tone: "warning" },
  disputed: { label: "Disputed", tone: "danger" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },

  // Milestones
  pending: { label: "Pending", tone: "neutral" },
  in_progress: { label: "In progress", tone: "info" },
  submitted: { label: "Submitted", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  released: { label: "Released", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },

  // Disputes
  open: { label: "Open", tone: "danger" },
  evidence: { label: "Evidence", tone: "warning" },
  under_review: { label: "Under review", tone: "info" },
  resolved: { label: "Resolved", tone: "success" },
  closed: { label: "Closed", tone: "neutral" },

  // Transactions
  confirmed: { label: "Confirmed", tone: "success" },
  failed: { label: "Failed", tone: "danger" },

  // Contracts (draft/active/completed already covered above)
  pending_signatures: { label: "Pending signatures", tone: "warning" },
  voided: { label: "Voided", tone: "neutral" },

  // Reports (open/resolved already covered above)
  reviewing: { label: "Reviewing", tone: "info" },
  dismissed: { label: "Dismissed", tone: "neutral" },
}

export interface StatusBadgeProps {
  status: AnyStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const meta = statusMap[status] ?? { label: status, tone: "neutral" as const }
  return (
    <Badge tone={meta.tone} dot className={className}>
      {meta.label}
    </Badge>
  )
}