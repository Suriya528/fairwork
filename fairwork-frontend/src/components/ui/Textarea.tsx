import { forwardRef } from "react"
import type { TextareaHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        aria-invalid={invalid || undefined}
        className={cn(
          "w-full rounded-lg border bg-input px-3 py-2 text-sm text-foreground",
          "placeholder:text-subtle resize-y",
          "transition-colors outline-none",
          "focus:border-ring focus:ring-2 focus:ring-ring/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          invalid
            ? "border-danger/60 focus:border-danger focus:ring-danger/30"
            : "border-input-border",
          className,
        )}
        {...props}
      />
    )
  },
)

Textarea.displayName = "Textarea"
