import type { IconType } from "react-icons"
import {
  FiFilePlus,
  FiShield,
  FiUploadCloud,
  FiCheckCircle,
  FiDollarSign,
  FiAlertTriangle,
  FiFlag,
  FiMessageSquare,
} from "react-icons/fi"
import { Card, CardBody } from "@/components/ui/Card"
import { Skeleton } from "@/components/ui/Skeleton"
import { SectionHeading } from "./SectionHeading"
import { activityFeed } from "@/data/activity"
import { formatRelativeTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ActivityType } from "@/types"

const activityMeta: Record<
  ActivityType,
  { icon: IconType; tone: string }
> = {
  project_created: { icon: FiFilePlus, tone: "bg-info-soft text-info" },
  escrow_funded: { icon: FiShield, tone: "bg-primary/15 text-info" },
  milestone_submitted: {
    icon: FiUploadCloud,
    tone: "bg-warning-soft text-warning",
  },
  milestone_approved: {
    icon: FiCheckCircle,
    tone: "bg-success-soft text-success",
  },
  funds_released: { icon: FiDollarSign, tone: "bg-success-soft text-success" },
  dispute_opened: {
    icon: FiAlertTriangle,
    tone: "bg-danger-soft text-danger",
  },
  dispute_resolved: { icon: FiFlag, tone: "bg-info-soft text-info" },
  message: { icon: FiMessageSquare, tone: "bg-elevated text-muted" },
}

export interface RecentActivityProps {
  loading?: boolean
}

/** Vertical timeline of the most recent protocol events. */
export function RecentActivity({ loading = false }: RecentActivityProps) {
  const items = [...activityFeed].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  return (
    <section aria-labelledby="activity-heading" className="flex flex-col gap-4">
      <SectionHeading
        id="activity-heading"
        title="Recent activity"
        description="A log of the latest protocol events"
        actionLabel="View all"
        actionTo="/activity"
      />
      <Card>
        <CardBody>
          {loading ? (
            <ul className="flex flex-col gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full max-w-xs" />
                    <Skeleton className="mt-1.5 h-3 w-20" />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <ol className="relative flex flex-col">
              {items.map((item, i) => {
                const meta = activityMeta[item.type]
                const Icon = meta.icon
                const isLast = i === items.length - 1
                return (
                  <li key={item.id} className="relative flex gap-3 pb-5 last:pb-0">
                    {!isLast && (
                      <span
                        className="absolute left-4 top-9 h-[calc(100%-1.5rem)] w-px -translate-x-1/2 bg-border"
                        aria-hidden
                      />
                    )}
                    <span
                      className={cn(
                        "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        meta.tone,
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-sm leading-relaxed text-foreground text-pretty">
                        {item.message}
                      </p>
                      <p className="mt-0.5 text-xs text-subtle">
                        {formatRelativeTime(item.createdAt)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </CardBody>
      </Card>
    </section>
  )
}
