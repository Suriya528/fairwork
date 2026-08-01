import type { IconType } from "react-icons"
import { FiArrowDownRight, FiArrowUpRight } from "react-icons/fi"
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
}

/** Compact KPI card for dashboards. Shows value, delta, and a hint line. */
export function MetricCard({
  label,
  value,
  change,
  hint,
  icon: Icon,
  className,
}: MetricCardProps) {
  const hasChange = typeof change === "number" && change !== 0
  const positive = (change ?? 0) > 0

  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-elevated text-primary">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
          )}
          <p className="text-sm font-medium text-muted">{label}</p>
        </div>
        {hasChange && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums",
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
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-subtle">{hint}</p>}
    </Card>
  )
}
