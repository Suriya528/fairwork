import { forwardRef } from "react"
import type { InputHTMLAttributes, ReactNode } from "react"
import { FiCheck } from "react-icons/fi"
import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode
  description?: ReactNode
}

/**
 * Accessible checkbox. Uses a visually-hidden native input for full
 * keyboard + form support, with a styled indicator layered on top.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, disabled, ...props }, ref) => {
    const control = (
      <span className="relative inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          disabled={disabled}
          className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-[5px] border border-input-border bg-input outline-none transition-colors checked:border-primary checked:bg-primary focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
          {...props}
        />
        <FiCheck
          className="pointer-events-none h-3 w-3 text-primary-foreground opacity-0 transition-opacity peer-checked:opacity-100"
          aria-hidden
        />
      </span>
    )

    if (!label && !description) {
      return <span className={cn("inline-flex", className)}>{control}</span>
    }

    return (
      <label
        htmlFor={id}
        className={cn(
          "flex cursor-pointer items-start gap-2.5",
          disabled && "cursor-not-allowed opacity-60",
          className,
        )}
      >
        <span className="mt-0.5">{control}</span>
        <span className="flex flex-col gap-0.5">
          {label && (
            <span className="text-sm font-medium leading-tight text-foreground">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs leading-relaxed text-muted">
              {description}
            </span>
          )}
        </span>
      </label>
    )
  },
)

Checkbox.displayName = "Checkbox"
