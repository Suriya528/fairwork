import { getPasswordStrength } from "@/lib/validation"
import { cn } from "@/lib/utils"

const toneBar: Record<string, string> = {
  muted: "bg-border-strong",
  danger: "bg-danger",
  warning: "bg-warning",
  info: "bg-info",
  success: "bg-success",
}

const toneText: Record<string, string> = {
  muted: "text-subtle",
  danger: "text-danger",
  warning: "text-warning",
  info: "text-info",
  success: "text-success",
}

/**
 * Four-segment strength meter driven by getPasswordStrength().
 * Presentation-only — real enforcement lives on the server.
 */
export function PasswordStrength({ value }: { value: string }) {
  const { score, label, tone } = getPasswordStrength(value)

  return (
    <div className="mt-1" aria-live="polite">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4].map((segment) => (
          <span
            key={segment}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              segment <= score ? toneBar[tone] : "bg-border",
            )}
          />
        ))}
      </div>
      {value && (
        <p className={cn("mt-1.5 text-xs font-medium", toneText[tone])}>
          {label} password
        </p>
      )}
    </div>
  )
}
