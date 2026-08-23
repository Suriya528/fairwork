import type { IconType } from "react-icons"
import { FiArrowDownRight, FiArrowRight, FiArrowUpRight } from "react-icons/fi"
import { Link } from "react-router-dom"
import { Card } from "@/components/ui/Card"
import { cn } from "@/lib/utils"

export interface MetricCardProps {
  label: string
  value: string
  change?: number
  hint?: string
  /** Optional leading icon shown beside the label. */
  icon?: IconType
  className?: string
  /** Optional destination that makes the metric an accessible link. */
  to?: string
}

/** Compact KPI card for dashboards with smooth hover lift and micro-interactions. */
export function MetricCard({
  label,
  value,
  change,
  hint,
  icon: Icon,
  className,
  to,
}: MetricCardProps) {
  const hasChange = typeof change === "number" && change !== 0
  const positive = (change ?? 0) > 0

  const content = (
    <div className="group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-elevated text-primary transition-all duration-200 group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
          )}
          <p className="text-sm font-medium text-muted group-hover:text-foreground transition-colors">{label}</p>
          {to && <FiArrowRight className="h-3.5 w-3.5 text-subtle ml-auto transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" aria-hidden />}
        </div>
        {hasChange && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums transition-transform duration-200 group-hover:scale-105",
              positive
                ? "bg-success-soft text-success"
                : "bg-danger-soft text-danger",
            )}
          >
            {positive ? (
              <FiArrowUpRight size={12} />
            ) : (
              <FiArrowDownRight size={12} />
            )}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground tabular-nums group-hover:text-primary transition-colors">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-subtle">{hint}</p>}
    </div>
  )

  if (to) {
    return (
      <Link
        to={to}
        aria-label={`View ${label.toLowerCase()}`}
        className={cn(
          "block rounded-2xl border border-border bg-surface p-5 outline-none transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-surface-hover hover:shadow-lg hover:shadow-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          className,
        )}
      >
        {content}
      </Link>
    )
  }

  return (
    <Card className={cn("p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md", className)}>
      {content}
    </Card>
  )
}
