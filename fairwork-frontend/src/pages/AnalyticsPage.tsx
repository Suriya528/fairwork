import { useMemo } from "react"
import {
  FiAward,
  FiClock,
  FiDollarSign,
  FiFileText,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { PageHeader } from "@/components/common/PageHeader"
import { MetricCard } from "@/components/common/MetricCard"
import { Card, CardContent } from "@/components/ui/Card"
import { escrowVolumeSeries, milestoneStatusBreakdown } from "@/data/activity"
import { getMilestonesForProject, projects } from "@/data/projects"
import { contracts } from "@/data/contracts"
import { users } from "@/data/users"
import { formatCurrency, toPercent } from "@/lib/format"
import type { ContractStatus } from "@/types"

// TODO: replace with the real authenticated user once session/auth
// context exists (only services/authApi.ts is wired up so far).
const CURRENT_USER_ID = "usr_client_01"

const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  draft: "var(--color-subtle)",
  pending_signatures: "var(--color-warning)",
  active: "var(--color-info)",
  completed: "var(--color-success)",
  voided: "var(--color-muted)",
}

export function AnalyticsPage() {
  const currentUser = users.find((u) => u.id === CURRENT_USER_ID)
  const isClient = currentUser?.role === "client"

  const myProjects = useMemo(() => {
    if (!currentUser) return []
    return projects.filter((p) =>
      isClient ? p.clientId === currentUser.id : p.freelancerId === currentUser.id,
    )
  }, [currentUser, isClient])

  const completed = myProjects.filter((p) => p.status === "completed")
  const finished = myProjects.filter((p) => ["completed", "cancelled"].includes(p.status))
  const successRate = finished.length > 0 ? toPercent(completed.length, finished.length) : 0

  const avgProjectValue =
    myProjects.length > 0
      ? myProjects.reduce((sum, p) => sum + p.budget, 0) / myProjects.length
      : 0

  const myMilestones = myProjects.flatMap((p) => getMilestonesForProject(p.id))
  const releasedMilestones = myMilestones.filter((m) => m.status === "released" && m.releasedAt)
  const onTimeMilestones = releasedMilestones.filter(
    (m) => new Date(m.releasedAt as string).getTime() <= new Date(m.dueDate).getTime(),
  )
  const onTimeRate =
    releasedMilestones.length > 0 ? toPercent(onTimeMilestones.length, releasedMilestones.length) : 0

  const myContracts = contracts.filter((c) => {
    const project = myProjects.find((p) => p.id === c.projectId)
    return !!project
  })
  const signedContracts = myContracts.filter((c) => c.clientSigned && c.freelancerSigned)

  const counterpartyIds = new Set(
    myProjects.map((p) => (isClient ? p.freelancerId : p.clientId)).filter((id): id is string => !!id),
  )

  const contractStatusCounts = useMemo(() => {
    const counts: Record<ContractStatus, number> = {
      draft: 0,
      pending_signatures: 0,
      active: 0,
      completed: 0,
      voided: 0,
    }
    for (const c of myContracts) counts[c.status] += 1
    return (Object.keys(counts) as ContractStatus[])
      .filter((status) => counts[status] > 0)
      .map((status) => ({
        status,
        count: counts[status],
        fill: CONTRACT_STATUS_COLORS[status],
      }))
  }, [myContracts])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <PageHeader
          title="Analytics"
          description="How your projects are performing across FairWork."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Success rate" value={`${successRate}%`} icon={FiAward} />
          <MetricCard
            label="Avg. project value"
            value={formatCurrency(avgProjectValue)}
            icon={FiDollarSign}
          />
          <MetricCard label="On-time delivery" value={`${onTimeRate}%`} icon={FiClock} />
          <MetricCard
            label="Contracts signed"
            value={`${signedContracts.length} / ${myContracts.length}`}
            icon={FiFileText}
          />
        </div>

        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <div className="flex items-center gap-2">
              <FiTrendingUp className="h-4 w-4 text-subtle" />
              <h3 className="text-sm font-semibold text-foreground">Escrow volume</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={escrowVolumeSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" stroke="var(--color-subtle)" fontSize={12} />
                  <YAxis stroke="var(--color-subtle)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-elevated)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Area
                    type="monotone"
                    dataKey="deposited"
                    name="Deposited"
                    stroke="var(--color-primary)"
                    fill="var(--color-primary)"
                    fillOpacity={0.15}
                  />
                  <Area
                    type="monotone"
                    dataKey="released"
                    name="Released"
                    stroke="var(--color-success)"
                    fill="var(--color-success)"
                    fillOpacity={0.15}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <h3 className="text-sm font-semibold text-foreground">Milestone status</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={milestoneStatusBreakdown}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                    >
                      {milestoneStatusBreakdown.map((entry) => (
                        <Cell key={entry.label} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-elevated)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <h3 className="text-sm font-semibold text-foreground">Contract status</h3>
              {contractStatusCounts.length === 0 ? (
                <div className="flex h-56 items-center justify-center text-xs text-subtle">
                  No contracts yet
                </div>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={contractStatusCounts} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis type="number" stroke="var(--color-subtle)" fontSize={12} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="status"
                        stroke="var(--color-subtle)"
                        fontSize={12}
                        width={110}
                        tickFormatter={(v: string) => v.replace("_", " ")}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-elevated)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "0.75rem",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {contractStatusCounts.map((entry) => (
                          <Cell key={entry.status} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-elevated text-muted">
              <FiUsers className="h-4 w-4" />
            </span>
            <p className="text-sm text-muted">
              You've worked with{" "}
              <span className="font-semibold text-foreground">{counterpartyIds.size}</span>{" "}
              distinct {isClient ? "freelancer" : "client"}
              {counterpartyIds.size !== 1 ? "s" : ""} across {myProjects.length} project
              {myProjects.length !== 1 ? "s" : ""}.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}