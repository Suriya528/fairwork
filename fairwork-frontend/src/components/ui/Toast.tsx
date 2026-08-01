import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { ReactNode } from "react"
import { createPortal } from "react-dom"
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiInfo,
  FiXCircle,
  FiX,
} from "react-icons/fi"
import type { IconType } from "react-icons"
import { cn } from "@/lib/utils"

export type ToastTone = "success" | "error" | "warning" | "info"

export interface ToastOptions {
  title: string
  description?: string
  tone?: ToastTone
  /** Auto-dismiss delay in ms. Defaults to 4500. Pass 0 to disable. */
  duration?: number
}

interface ToastRecord extends Required<Omit<ToastOptions, "description">> {
  id: string
  description?: string
}

interface ToastContextValue {
  toast: (options: ToastOptions) => string
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextToastId = 0

const toneMeta: Record<ToastTone, { icon: IconType; className: string }> = {
  success: { icon: FiCheckCircle, className: "text-success" },
  error: { icon: FiXCircle, className: "text-danger" },
  warning: { icon: FiAlertTriangle, className: "text-warning" },
  info: { icon: FiInfo, className: "text-info" },
}

/** Wrap the app so any component can call useToast(). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((options: ToastOptions) => {
    const id = `toast-${Date.now()}-${++nextToastId}`
    const record: ToastRecord = {
      id,
      title: options.title,
      description: options.description,
      tone: options.tone ?? "info",
      duration: options.duration ?? 4500,
    }
    setToasts((prev) => [...prev, record])
    return id
  }, [])

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>")
  }
  return ctx
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastRecord[]
  onDismiss: (id: string) => void
}) {
  if (typeof document === "undefined") return null

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body,
  )
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastRecord
  onDismiss: (id: string) => void
}) {
  useEffect(() => {
    if (!toast.duration) return
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onDismiss])

  const meta = toneMeta[toast.tone]
  const Icon = meta.icon

  return (
    <div
      role="status"
      className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-border-strong bg-elevated p-4 shadow-2xl animate-slide-up"
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", meta.className)} aria-hidden />
      <div className="flex flex-1 flex-col gap-0.5">
        <p className="text-sm font-medium leading-tight text-foreground">
          {toast.title}
        </p>
        {toast.description && (
          <p className="text-sm leading-relaxed text-muted">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-subtle transition-colors hover:bg-surface-hover hover:text-foreground"
        aria-label="Dismiss notification"
      >
        <FiX className="h-4 w-4" aria-hidden />
      </button>
    </div>
  )
}
