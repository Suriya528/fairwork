import { Link } from "react-router-dom"
import { FiArrowRight } from "react-icons/fi"
import { Card } from "@/components/ui/Card"
import { quickActions } from "@/data/dashboard"

/** Grid of primary shortcuts into the core protocol flows. */
export function QuickActions() {
  return (
    <section aria-labelledby="quick-actions-heading">
      <h2 id="quick-actions-heading" className="sr-only">
        Quick actions
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Card key={action.id} interactive className="group">
              <Link
                to={action.to}
                className="flex h-full flex-col gap-3 rounded-2xl p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-elevated text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <FiArrowRight
                    className="h-4 w-4 -translate-x-1 text-subtle opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                    aria-hidden
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {action.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-subtle text-pretty">
                    {action.description}
                  </p>
                </div>
              </Link>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
