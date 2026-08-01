import type { ReactNode } from "react"
import { Label } from "@/components/ui/Label"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  id: string
  label: string
  required?: boolean
  error?: string
  hint?: ReactNode
  /** Rendered to the right of the label, e.g. a "Forgot password?" link. */
  labelAccessory?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Layout wrapper that pairs the shared <Label> with any control passed as
 * children, then renders a hint or an error + ARIA wiring. It does NOT
 * recreate the Input — pages pass <Input>/<PasswordField> as children.
 */
export function FormField({
  id,
  label,
  required,
  error,
  hint,
  labelAccessory,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
        {labelAccessory}
      </div>

      {children}

      {error ? (
        <p id={`${id}-error`} className="text-xs leading-relaxed text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs leading-relaxed text-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
