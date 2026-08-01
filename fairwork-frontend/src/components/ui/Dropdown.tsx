import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface DropdownProps {
  /** The element that toggles the menu. */
  trigger: ReactNode
  children: ReactNode
  align?: "start" | "end"
  className?: string
  menuClassName?: string
}

/**
 * Lightweight click-to-open menu with outside-click + Escape dismissal.
 * Compose the menu body from DropdownItem / DropdownLabel / DropdownSeparator.
 */
export function Dropdown({
  trigger,
  children,
  align = "end",
  className,
  menuClassName,
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onPointer)
    window.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onPointer)
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn("relative inline-block", className)}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div
          role="menu"
          onClick={() => setOpen(false)}
          className={cn(
            "absolute z-40 mt-2 min-w-48 overflow-hidden rounded-xl border border-border-strong bg-elevated p-1 shadow-2xl animate-fade-in",
            align === "end" ? "right-0" : "left-0",
            menuClassName,
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export interface DropdownItemProps {
  children: ReactNode
  onSelect?: () => void
  icon?: ReactNode
  tone?: "default" | "danger"
  disabled?: boolean
}

export function DropdownItem({
  children,
  onSelect,
  icon,
  tone = "default",
  disabled,
}: DropdownItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        tone === "danger"
          ? "text-danger hover:bg-danger/10"
          : "text-muted hover:bg-surface-hover hover:text-foreground",
      )}
    >
      {icon && <span className="flex h-4 w-4 shrink-0 items-center justify-center">{icon}</span>}
      <span className="flex-1">{children}</span>
    </button>
  )
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-subtle">
      {children}
    </p>
  )
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-border" role="separator" />
}
