import { MetricCard } from "@/components/common/MetricCard"
import { Skeleton } from "@/components/ui/Skeleton"
import { Card } from "@/components/ui/Card"
import { kpiStats } from "@/data/dashboard"

export interface StatsGridProps {
  loading?: boolean
}

/** Responsive grid of KPI cards summarizing escrow & contract activity. */
export function StatsGrid({ loading = false }: StatsGridProps) {
  return (
    <section aria-labelledby="stats-heading">
      <h2 id="stats-heading" className="sr-only">
        Key metrics
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {loading
          ? kpiStats.map((stat) => (
              <Card key={stat.id} className="p-5">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="mt-3 h-7 w-24" />
                <Skeleton className="mt-2 h-3 w-28" />
              </Card>
            ))
          : kpiStats.map((stat) => (
              <MetricCard
                key={stat.id}
                label={stat.label}
                value={stat.value}
                change={stat.change}
                hint={stat.hint}
                icon={stat.icon}
              />
            ))}
      </div>
    </section>
  )
}
