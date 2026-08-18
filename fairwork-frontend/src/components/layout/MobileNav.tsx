import { useEffect } from "react"
import { NavLink } from "react-router-dom"
import { FiX } from "react-icons/fi"
import { Logo } from "@/components/common/Logo"
import { getNavSectionsForRole } from "@/config/navigation"
import { cn } from "@/lib/utils"
import { useDisputeSummary } from "@/context/DisputeSummaryContext"
import { useAuth } from "@/context/AuthContext"
import { ThemeToggle } from "@/components/common/ThemeToggle"

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

/** Slide-in navigation drawer for small screens tailored to user role. */
export function MobileNav({ open, onClose }: MobileNavProps) {
  const { openDisputeCount, loading } = useDisputeSummary()
  const { user } = useAuth()
  const sections = getNavSectionsForRole(user?.role)

  // Lock body scroll while the drawer is open.
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

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <div
        className={cn(
          "absolute inset-0 bg-overlay transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={cn(
          "absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col border-r border-border bg-surface transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5 border-b border-border">
          <Logo size="md" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-elevated hover:text-foreground"
              aria-label="Close navigation menu"
            >
              <FiX className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Mobile">
          {sections.map((section) => (
            <div key={section.title} className="mb-6 last:mb-0">
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-subtle">
                {section.title}
              </p>
              <ul className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.path === "/"}
                        onClick={onClose}
                        className={({ isActive }) =>
                          cn(
                            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-elevated text-foreground"
                              : "text-muted hover:bg-elevated/60 hover:text-foreground",
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icon
                              className={cn(
                                "h-5 w-5 shrink-0",
                                isActive ? "text-primary" : "text-subtle",
                              )}
                              aria-hidden
                            />
                            <span className="flex-1">{item.label}</span>
                            {item.path === "/disputes" && !loading && openDisputeCount > 0 ? (
                              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-semibold text-danger-foreground">
                                {openDisputeCount}
                              </span>
                            ) : null}
                          </>
                        )}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}
