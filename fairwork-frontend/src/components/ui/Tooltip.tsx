import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface TooltipProps {
  content: string
  children: ReactNode
  side?: "top" | "bottom" | "left" | "right"
  className?: string
}

const sideStyles = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
}

/**
 * Lightweight CSS-only tooltip. Appears on hover/focus-within so it stays
 * keyboard accessible without extra state.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  className,
}: TooltipProps) {
  return (
    <span className={cn("group/tooltip relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-border-strong bg-elevated px-2 py-1 text-xs text-foreground shadow-lg",
          "opacity-0 transition-opacity duration-150",
          "group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100",
          sideStyles[side],
        )}
      >
        {content}
      </span>
    </span>
  )
}
