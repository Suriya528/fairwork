import { forwardRef } from "react"
import type { InputHTMLAttributes } from "react"
import { FiSearch, FiX } from "react-icons/fi"
import { cn } from "@/lib/utils"

export interface SearchBarProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  containerClassName?: string
}

/**
 * Controlled search field with a leading icon and a clear button.
 * Wraps the same input styling used in the Topbar so search stays consistent.
 */
export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  (
    {
      value,
      onChange,
      onClear,
      placeholder = "Search\u2026",
      className,
      containerClassName,
      ...props
    },
    ref,
  ) => {
    const handleClear = () => {
      onChange("")
      onClear?.()
    }

    return (
      <div className={cn("relative", containerClassName)}>
        <FiSearch
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle"
          aria-hidden
        />
        <input
          ref={ref}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "h-10 w-full rounded-lg border border-input-border bg-input pl-9 pr-9 text-sm text-foreground placeholder:text-subtle outline-none transition-colors",
            "focus:border-ring focus:ring-2 focus:ring-ring/30",
            "[&::-webkit-search-cancel-button]:hidden",
            className,
          )}
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-subtle transition-colors hover:bg-surface-hover hover:text-foreground"
            aria-label="Clear search"
          >
            <FiX className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
    )
  },
)

SearchBar.displayName = "SearchBar"
