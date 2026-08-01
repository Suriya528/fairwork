import { forwardRef } from "react"
import type { SelectHTMLAttributes } from "react"
import { FiChevronDown } from "react-icons/fi"
import { cn } from "@/lib/utils"

export interface SelectOption {
  label: string
  value: string
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  options: SelectOption[]
  invalid?: boolean
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, invalid, placeholder, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          aria-invalid={invalid || undefined}
          className={cn(
            "h-10 w-full appearance-none rounded-lg border bg-input px-3 pr-9 text-sm text-foreground",
            "transition-colors outline-none",
            "focus:border-ring focus:ring-2 focus:ring-ring/30",
            "disabled:cursor-not-allowed disabled:opacity-50",
            invalid ? "border-danger/60" : "border-input-border",
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <FiChevronDown
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-subtle"
          size={16}
        />
      </div>
    )
  },
)

Select.displayName = "Select"
