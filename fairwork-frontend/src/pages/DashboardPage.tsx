import { useNavigate } from "react-router-dom"
import { FiPlus } from "react-icons/fi"
import { PageHeader } from "@/components/common/PageHeader"
import { Breadcrumb } from "@/components/common/Breadcrumb"
import { Button } from "@/components/ui/Button"
import { QuickActions } from "@/components/dashboard/QuickActions"
import { StatsGrid } from "@/components/dashboard/StatsGrid"
import { AnalyticsSection } from "@/components/dashboard/AnalyticsSection"
import { RecentProjects } from "@/components/dashboard/RecentProjects"
import { ActiveContracts } from "@/components/dashboard/ActiveContracts"
import { RecentTransactions } from "@/components/dashboard/RecentTransactions"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { NotificationsPreview } from "@/components/dashboard/NotificationsPreview"
import { ProfileSummary } from "@/components/dashboard/ProfileSummary"
import { useSimulatedLoading } from "@/hooks/useSimulatedLoading"
import { useAuth } from "@/context/AuthContext"
import { getGreeting } from "@/data/dashboard"

/**
 * Main landing page after login: a premium overview of the user's freelance
 * activity, escrow balances, contracts, and protocol events.
 *
 * Partially migrated to real data (see requirements for this pass):
 *  - RecentProjects and ProfileSummary now fetch real backend data and
 *    manage their own loading/error states internally — no longer driven
 *    by useSimulatedLoading, so `loading` is no longer passed to either.
 *  - Every other widget (StatsGrid, AnalyticsSection, ActiveContracts,
 *    RecentTransactions, RecentActivity, NotificationsPreview) is still
 *    on dummy data via useSimulatedLoading, pending their own endpoints
 *    (Contracts, Transactions, Activity, Notifications aren't routed on
 *    the backend yet). Intentional — not an oversight.
 */
export function DashboardPage() {
  const navigate = useNavigate()
  const loading = useSimulatedLoading()
  const { user } = useAuth()
  const firstName = user?.name.split(" ")[0] ?? ""

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-4">
        <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Dashboard" }]} />
        <PageHeader
          title={`${getGreeting()}, ${firstName}`}
          description="An overview of your freelance activity and escrow contracts."
          actions={
            <Button
              leftIcon={<FiPlus className="h-4 w-4" />}
              onClick={() => navigate("/projects")}
            >
              New project
            </Button>
          }
        />
      </div>

      <QuickActions />

      <StatsGrid loading={loading} />

      <AnalyticsSection loading={loading} />

      <div className="grid gap-8 xl:grid-cols-3">
        <div className="flex flex-col gap-8 xl:col-span-2">
          <RecentProjects />
          <ActiveContracts loading={loading} />
        </div>
        <div className="flex flex-col gap-8">
          <ProfileSummary />
          <NotificationsPreview loading={loading} />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <RecentTransactions loading={loading} />
        <RecentActivity loading={loading} />
      </div>
    </div>
  )
}