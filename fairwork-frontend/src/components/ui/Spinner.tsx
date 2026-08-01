import { cn } from "@/lib/utils"

export interface SpinnerProps {
  className?: string
  label?: string
}

/** Accessible loading spinner. */
export function Spinner({ className, label = "Loading" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    >
      <span className="sr-only">{label}</span>
    </span>
  )
}
