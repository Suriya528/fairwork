import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

/** Shimmering placeholder block used for loading states. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-shimmer rounded-md bg-[linear-gradient(90deg,var(--color-surface)_25%,var(--color-elevated)_50%,var(--color-surface)_75%)]",
        className,
      )}
      {...props}
    />
  )
}
