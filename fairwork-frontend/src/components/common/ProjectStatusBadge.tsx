import { Badge, type BadgeTone } from "@/components/ui/Badge"
import type { ApiProjectStatus } from "@/services/projectsApi"

/**
 * Status badge scoped to the real backend's 4 project statuses.
 *
 * Not reusing the shared StatusBadge component here: its statusMap
 * already has an "open" entry (from the dummy DisputeStatus's "open",
 * styled danger/red). Project's real "open" means "posted, no freelancer
 * yet" — a neutral/available state, not an alarming one. Re-keying the
 * same literal string would make every freshly-posted project look like
 * something's wrong. Once every page is off dummy data (and the dummy
 * DisputeStatus collision goes away with it), this can likely fold back
 * into StatusBadge without a conflict.
 */

const STATUS_META: Record<ApiProjectStatus, { label: string; tone: BadgeTone }> = {
  open: { label: "Open", tone: "info" },
  in_progress: { label: "In progress", tone: "warning" },
  completed: { label: "Completed", tone: "success" },
  disputed: { label: "Disputed", tone: "danger" },
}

export function ProjectStatusBadge({ status }: { status: ApiProjectStatus }) {
  const meta = STATUS_META[status]
  return <Badge tone={meta.tone}>{meta.label}</Badge>
}