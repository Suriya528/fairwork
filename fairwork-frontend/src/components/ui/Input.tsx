import { forwardRef } from "react"
import type { InputHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
  leftIcon?: ReactNode
}

/**
 * Text input matching the spec: bg-input, border-input, focus ring on blue.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, leftIcon, ...props }, ref) => {
    return (
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          aria-invalid={invalid || undefined}
          className={cn(
            "h-10 w-full rounded-lg border bg-input px-3 text-sm text-foreground",
            "placeholder:text-subtle",
            "transition-colors outline-none",
            "focus:border-ring focus:ring-2 focus:ring-ring/30",
            "disabled:cursor-not-allowed disabled:opacity-50",
            invalid
              ? "border-danger/60 focus:border-danger focus:ring-danger/30"
              : "border-input-border",
            leftIcon && "pl-9",
            className,
          )}
          {...props}
        />
      </div>
    )
  },
)

Input.displayName = "Input"
