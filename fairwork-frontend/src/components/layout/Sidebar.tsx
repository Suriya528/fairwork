import { NavLink } from "react-router-dom"
import { FiShield } from "react-icons/fi"
import { navSections } from "@/config/navigation"
import { cn } from "@/lib/utils"

/**
 * Desktop sidebar. Fixed to the left on lg+ screens; hidden on mobile
 * (mobile uses the bottom nav / drawer instead).
 */
export function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-30 border-r border-border bg-surface">
      <div className="flex h-16 items-center gap-2.5 px-6 border-b border-border">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <FiShield className="h-4 w-4" aria-hidden />
        </span>
        <span className="text-base font-semibold tracking-tight text-foreground">FairWork</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Primary">
        {navSections.map((section) => (
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
                          {item.badge ? (
                            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-semibold text-danger-foreground">
                              {item.badge}
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

      <div className="border-t border-border p-3">
        <div className="rounded-lg bg-elevated/60 p-3">
          <p className="text-xs font-medium text-foreground">Protocol status</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
            All systems operational
          </p>
        </div>
      </div>
    </aside>
  )
}
