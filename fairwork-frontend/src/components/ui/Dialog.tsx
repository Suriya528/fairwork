import { useId } from "react"
import type { ReactNode } from "react"
import { FiX } from "react-icons/fi"
import { Modal, type ModalSize } from "./Modal"
import { cn } from "@/lib/utils"

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  /** Footer actions, typically Buttons. */
  footer?: ReactNode
  size?: ModalSize
  /** Hide the top-right close button. */
  hideClose?: boolean
  closeOnBackdrop?: boolean
}

/**
 * Standard content dialog: titled header with a close button, a scrollable
 * body, and an optional footer for actions. Built on the Modal shell.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  hideClose = false,
  closeOnBackdrop = true,
}: DialogProps) {
  const titleId = useId()
  const descId = useId()

  return (
    <Modal
      open={open}
      onClose={onClose}
      size={size}
      closeOnBackdrop={closeOnBackdrop}
      aria-labelledby={titleId}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border p-6 pb-4">
        <div className="flex flex-col gap-1">
          <h2
            id={titleId}
            className="text-base font-semibold leading-tight text-foreground text-balance"
          >
            {title}
          </h2>
          {description && (
            <p
              id={descId}
              className="text-sm leading-relaxed text-muted text-pretty"
            >
              {description}
            </p>
          )}
        </div>
        {!hideClose && (
          <button
            type="button"
            onClick={onClose}
            className="-mr-1.5 -mt-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-elevated hover:text-foreground"
            aria-label="Close dialog"
          >
            <FiX className="h-4.5 w-4.5" aria-hidden />
          </button>
        )}
      </div>

      {children && (
        <div className="max-h-[60vh] overflow-y-auto p-6">{children}</div>
      )}

      {footer && (
        <div
          className={cn(
            "flex items-center justify-end gap-3 border-t border-border p-6 py-4",
          )}
        >
          {footer}
        </div>
      )}
    </Modal>
  )
}
