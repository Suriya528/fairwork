import { Link } from "react-router-dom"
import { FiAlertTriangle, FiRefreshCw, FiHome } from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"

export interface FeatureErrorFallbackProps {
  featureName?: string
  errorRef?: string
  onRetry?: () => void
  className?: string
}

export function FeatureErrorFallback({
  featureName = "this feature",
  errorRef,
  onRetry,
  className,
}: FeatureErrorFallbackProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex min-h-[360px] w-full flex-col items-center justify-center gap-4 rounded-2xl border border-danger/25 bg-danger-soft/20 p-8 text-center shadow-sm",
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-soft text-danger shadow-inner">
        <FiAlertTriangle size={28} aria-hidden />
      </div>

      <div className="flex max-w-md flex-col gap-2">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Unable to display {featureName}
        </h2>
        <p className="text-sm leading-relaxed text-muted text-pretty">
          This part of FairWork encountered an unexpected problem. Other sections remain completely functional.
        </p>
        {errorRef && (
          <div className="mt-1 inline-flex items-center justify-center self-center rounded-lg bg-base border border-border px-3 py-1 text-xs font-mono text-muted">
            Error Reference: <span className="ml-1.5 font-semibold text-foreground">{errorRef}</span>
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button variant="secondary" size="md" onClick={onRetry} className="gap-2">
            <FiRefreshCw size={16} aria-hidden />
            Try again
          </Button>
        )}
        <Link to="/dashboard">
          <Button variant="outline" size="md" className="gap-2">
            <FiHome size={16} aria-hidden />
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
