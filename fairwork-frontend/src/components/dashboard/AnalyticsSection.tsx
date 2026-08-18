import { ChartCard } from "@/components/charts/ChartCard"
import { AreaTrendChart } from "@/components/charts/AreaTrendChart"
import { DonutChart } from "@/components/charts/DonutChart"
import { BarSeriesChart } from "@/components/charts/BarSeriesChart"
import { Badge } from "@/components/ui/Badge"
import { Skeleton } from "@/components/ui/Skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/Card"
import { useCurrency } from "@/context/CurrencyContext"
import {
  contractStatusBreakdown,
  milestoneProgressSeries,
  monthlyEarningsSeries,
} from "@/data/dashboard"

export interface AnalyticsSectionProps {
  loading?: boolean
}

function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-44" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full rounded-xl" style={{ height }} />
      </CardContent>
    </Card>
  )
}

/** Analytics row: monthly earnings, contract status, and milestone progress. */
export function AnalyticsSection({ loading = false }: AnalyticsSectionProps) {
  const { formatAmount } = useCurrency()

  if (loading) {
    return (
      <section aria-labelledby="analytics-heading" className="grid gap-4 lg:grid-cols-3">
        <h2 id="analytics-heading" className="sr-only">
          Analytics
        </h2>
        <div className="lg:col-span-2">
          <ChartSkeleton />
        </div>
        <ChartSkeleton />
        <div className="lg:col-span-3">
          <ChartSkeleton height={220} />
        </div>
      </section>
    )
  }

  return (
    <section aria-labelledby="analytics-heading" className="grid gap-4 lg:grid-cols-3">
      <h2 id="analytics-heading" className="sr-only">
        Analytics
      </h2>

      <ChartCard
        title="Monthly earnings"
        description="Released earnings against escrow held over time"
        className="lg:col-span-2"
        actions={<Badge tone="success">+18.2%</Badge>}
      >
        <AreaTrendChart
          data={monthlyEarningsSeries}
          xKey="month"
          valueFormatter={(v) => formatAmount(v)}
          series={[
            {
              key: "earnings",
              label: "Earnings",
              color: "var(--color-primary)",
            },
            {
              key: "escrow",
              label: "In escrow",
              color: "var(--color-info)",
            },
          ]}
        />
      </ChartCard>

      <ChartCard
        title="Contract status"
        description="Distribution across your portfolio"
      >
        <DonutChart data={contractStatusBreakdown} />
      </ChartCard>

      <ChartCard
        title="Milestone progress"
        description="Milestones submitted vs. released each month"
        className="lg:col-span-3"
      >
        <BarSeriesChart
          data={milestoneProgressSeries}
          xKey="month"
          height={240}
          series={[
            {
              key: "submitted",
              label: "Submitted",
              color: "var(--color-warning)",
            },
            {
              key: "released",
              label: "Released",
              color: "var(--color-success)",
            },
          ]}
        />
      </ChartCard>
    </section>
  )
}
