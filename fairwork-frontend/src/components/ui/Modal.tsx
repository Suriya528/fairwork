import { useEffect } from "react"
import type { ReactNode } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

export type ModalSize = "sm" | "md" | "lg"

export interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  size?: ModalSize
  /** Close when the backdrop is clicked. Defaults to true. */
  closeOnBackdrop?: boolean
  className?: string
  "aria-label"?: string
  "aria-labelledby"?: string
}

const sizeStyles: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
}

/**
 * Unstyled, portal-rendered modal shell: backdrop, centering, scroll lock,
 * and Escape-to-close. Compose richer surfaces (Dialog, ConfirmDialog) on top.
 */
export function Modal({
  open,
  onClose,
  children,
  size = "md",
  closeOnBackdrop = true,
  className,
  ...aria
}: ModalProps) {
  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  // Close on Escape.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-overlay animate-fade-in"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        {...aria}
        className={cn(
          "relative z-10 w-full rounded-2xl border border-border bg-surface shadow-2xl animate-slide-up",
          sizeStyles[size],
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
