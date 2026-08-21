import React, { Component, type ReactNode } from "react"
import { useLocation } from "react-router-dom"
import { FiAlertOctagon, FiRefreshCw, FiRotateCw } from "react-icons/fi"
import { FeatureErrorFallback } from "@/components/feedback/FeatureErrorFallback"
import { logError } from "@/lib/errorLogger"
import { Button } from "@/components/ui/Button"

// --- Global Error Fallback UI -------------------------------------------

interface GlobalErrorFallbackProps {
  errorRef?: string
  onRetry: () => void
}

function GlobalErrorFallback({ errorRef, onRetry }: GlobalErrorFallbackProps) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-base p-6 text-foreground">
      <div className="flex max-w-lg flex-col items-center gap-6 rounded-3xl border border-danger/30 bg-card p-8 text-center shadow-xl sm:p-10">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-soft text-danger shadow-inner">
          <FiAlertOctagon size={32} aria-hidden />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            FairWork encountered a problem
          </h1>
          <p className="text-sm leading-relaxed text-muted text-pretty sm:text-base">
            We couldn't load the application shell. You can try recovering this view or reloading the application.
          </p>
          {errorRef && (
            <div className="mt-2 inline-flex items-center justify-center self-center rounded-lg bg-base border border-border px-3.5 py-1 text-xs font-mono text-muted">
              Error Reference: <span className="ml-1.5 font-semibold text-foreground">{errorRef}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="secondary" size="md" onClick={onRetry} className="gap-2">
            <FiRefreshCw size={16} aria-hidden />
            Try again
          </Button>
          <Button variant="primary" size="md" onClick={() => window.location.reload()} className="gap-2">
            <FiRotateCw size={16} aria-hidden />
            Reload Application
          </Button>
        </div>
      </div>
    </div>
  )
}

// --- Global Error Boundary ---------------------------------------------

interface GlobalErrorBoundaryProps {
  children: ReactNode
}

interface GlobalErrorBoundaryState {
  hasError: boolean
  errorRef: string
}

export class GlobalErrorBoundary extends Component<GlobalErrorBoundaryProps, GlobalErrorBoundaryState> {
  public state: GlobalErrorBoundaryState = {
    hasError: false,
    errorRef: "",
  }

  public static getDerivedStateFromError(): Partial<GlobalErrorBoundaryState> {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const errorRef = logError(error, {
      type: "global_render_error",
      componentStack: errorInfo.componentStack,
    })
    this.setState({ errorRef })
  }

  private handleRetry = () => {
    this.setState({ hasError: false, errorRef: "" })
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return <GlobalErrorFallback errorRef={this.state.errorRef} onRetry={this.handleRetry} />
    }

    return this.props.children
  }
}

// --- Feature Error Boundary --------------------------------------------

export interface FeatureErrorBoundaryProps {
  featureName?: string
  fallback?: ReactNode
  children: ReactNode
  onReset?: () => void
  resetKey?: unknown
}

interface FeatureErrorBoundaryState {
  hasError: boolean
  errorRef: string
  retryCount: number
  prevResetKey?: unknown
}

const MAX_RETRY_ATTEMPTS = 3

export class FeatureErrorBoundary extends Component<FeatureErrorBoundaryProps, FeatureErrorBoundaryState> {
  public state: FeatureErrorBoundaryState = {
    hasError: false,
    errorRef: "",
    retryCount: 0,
    prevResetKey: this.props.resetKey,
  }

  public static getDerivedStateFromProps(
    nextProps: FeatureErrorBoundaryProps,
    prevState: FeatureErrorBoundaryState,
  ): Partial<FeatureErrorBoundaryState> | null {
    if (nextProps.resetKey !== prevState.prevResetKey) {
      return {
        hasError: false,
        errorRef: "",
        retryCount: 0,
        prevResetKey: nextProps.resetKey,
      }
    }
    return null
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const errorRef = logError(error, {
      feature: this.props.featureName,
      type: "feature_render_error",
      componentStack: errorInfo.componentStack,
    })
    this.setState({ errorRef })
  }

  private handleRetry = () => {
    if (this.state.retryCount >= MAX_RETRY_ATTEMPTS) {
      // Loop protection: reset key or force manual navigation
      this.setState({ hasError: false, retryCount: 0 })
      return
    }

    this.setState((prev) => ({
      hasError: false,
      errorRef: "",
      retryCount: prev.retryCount + 1,
    }))

    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <FeatureErrorFallback
          featureName={this.props.featureName}
          errorRef={this.state.errorRef}
          onRetry={this.handleRetry}
        />
      )
    }

    return this.props.children
  }
}

// --- Route-Level Error Boundary Wrapper ---------------------------------

export interface RouteErrorBoundaryProps {
  featureName?: string
  children: ReactNode
}

/**
 * Route-level error boundary that uses the current location pathname
 * to automatically clear feature error state when navigating.
 */
export function RouteErrorBoundary({ featureName, children }: RouteErrorBoundaryProps) {
  const location = useLocation()

  return (
    <FeatureErrorBoundary featureName={featureName} resetKey={location.pathname}>
      {children}
    </FeatureErrorBoundary>
  )
}
