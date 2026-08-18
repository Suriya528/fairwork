import { NavLink } from "react-router-dom"
import { Logo } from "@/components/common/Logo"
import { getNavSectionsForRole } from "@/config/navigation"
import { cn } from "@/lib/utils"
import { useDisputeSummary } from "@/context/DisputeSummaryContext"
import { useAuth } from "@/context/AuthContext"

/**
 * Desktop sidebar fixed to the left on lg+ screens.
 * Dynamically tailored to the authenticated user's role (Client vs Freelancer vs Admin).
 */
export function Sidebar() {
  const { openDisputeCount, loading } = useDisputeSummary()
  const { user } = useAuth()
  const sections = getNavSectionsForRole(user?.role)

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-30 border-r border-border bg-surface">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <Logo size="md" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Primary">
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
                      className={({ isActive }) =>
                        cn(
                          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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
                              "h-5 w-5 shrink-0 transition-colors",
                              isActive ? "text-primary" : "text-subtle group-hover:text-muted",
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
    </aside>
  )
}
