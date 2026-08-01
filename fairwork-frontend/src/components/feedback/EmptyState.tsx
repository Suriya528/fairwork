import type { IconType } from "react-icons"
import { FiInbox } from "react-icons/fi"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface EmptyStateProps {
  icon?: IconType
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

/** Reusable empty state for lists, tables, and panels with no data. */
export function EmptyState({
  icon: Icon = FiInbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border-strong px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-elevated text-muted">
        <Icon size={22} aria-hidden />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && (
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted text-pretty">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
