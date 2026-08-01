import { cn } from "@/lib/utils"

export interface ProgressProps {
  value: number
  tone?: "primary" | "success" | "warning" | "danger"
  className?: string
  showLabel?: boolean
}

const toneStyles = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
}

/** Accessible progress bar. Value is clamped to 0-100. */
export function Progress({
  value,
  tone = "primary",
  className,
  showLabel = false,
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 w-full overflow-hidden rounded-full bg-elevated"
      >
        <div
          className={cn("h-full rounded-full transition-all", toneStyles[tone])}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="shrink-0 text-xs font-medium tabular-nums text-muted">
          {clamped}%
        </span>
      )}
    </div>
  )
}
