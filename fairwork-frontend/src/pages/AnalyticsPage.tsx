import { useEffect, useState } from "react"
import { FiBarChart2, FiCheckCircle, FiDollarSign, FiFolder } from "react-icons/fi"
import { EmptyState } from "@/components/feedback/EmptyState"
import { MetricCard } from "@/components/common/MetricCard"
import { PageHeader } from "@/components/common/PageHeader"
import { useAuth } from "@/context/AuthContext"
import { useCurrency } from "@/context/CurrencyContext"
import { getClientAnalytics, getFreelancerAnalytics, type ApiAnalytics } from "@/services/analyticsApi"

export function AnalyticsPage() {
  const { user, token } = useAuth()
  const { formatAmount } = useCurrency()
  const [data, setData] = useState<ApiAnalytics | null>(null)
  const [error, setError] = useState("")

  const isFreelancer = user?.role === "freelancer"

  useEffect(() => {
    if (!token || !user) return
    ;(isFreelancer ? getFreelancerAnalytics(token) : getClientAnalytics(token))
      .then(setData)
      .catch((e: Error) => setError(e.message))
  }, [token, user, isFreelancer])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <PageHeader
          title={isFreelancer ? "Earnings Analytics" : "Spend Analytics"}
          description={
            isFreelancer
              ? "Performance metrics, total earnings, and monthly completed milestone payouts."
              : "Budget breakdown, total client spend, and project completion metrics."
          }
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        {data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label={isFreelancer ? "Assigned projects" : "Posted projects"}
                value={String(data.totalProjects)}
                icon={FiFolder}
              />
              <MetricCard label="Completed" value={String(data.completedProjects)} icon={FiCheckCircle} />
              <MetricCard
                label={isFreelancer ? "Total earnings" : "Total spent"}
                value={formatAmount(data.totalEarnings ?? data.totalSpent ?? 0)}
                icon={FiDollarSign}
              />
              <MetricCard label="Success rate" value={`${data.successRate}%`} icon={FiBarChart2} />
            </div>
            {data.disputedProjects !== null && (
              <p className="text-sm text-muted">
                Disputed projects: {data.disputedProjects}. Average rating: {data.avgRating ?? "—"} ({data.totalReviews ?? 0} reviews).
              </p>
            )}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h2 className="font-semibold text-foreground">
                {isFreelancer ? "Monthly earnings breakdown" : "Monthly spend breakdown"}
              </h2>
              {data.monthlyData.length ? (
                <ul className="mt-3 space-y-2 text-sm text-muted">
                  {data.monthlyData.map((m) => (
                    <li key={m.month}>
                      Month {m.month}: {formatAmount(m.amount)} across {m.count} project{m.count === 1 ? "" : "s"}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted">No monthly financial data is available yet.</p>
              )}
            </div>
          </>
        ) : (
          !error && <EmptyState icon={FiBarChart2} title="Loading analytics" description="Your analytics summary will appear here." />
        )}
      </div>
    </div>
  )
}
