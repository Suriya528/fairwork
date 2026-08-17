import { forwardRef, useState } from "react"
import type { InputProps } from "@/components/ui/Input"
import { FiEye, FiEyeOff } from "react-icons/fi"
import { Input } from "@/components/ui/Input"

/**
 * The shared <Input> with a show/hide toggle. Thin wrapper — all Input props
 * (leftIcon, invalid, aria-*, etc.) pass straight through, so we never fork
 * the base component.
 */
export const PasswordField = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = useState(false)

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={className ? `${className} pr-10` : "pr-10"}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-subtle transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? (
            <FiEyeOff className="h-4 w-4" aria-hidden />
          ) : (
            <FiEye className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
    )
  },
)

PasswordField.displayName = "PasswordField"
