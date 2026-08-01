import { useMemo, useState } from "react"
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiFolder,
  FiLock,
  FiUsers,
} from "react-icons/fi"
import { PageHeader } from "@/components/common/PageHeader"
import { MetricCard } from "@/components/common/MetricCard"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { cn } from "@/lib/utils"
import { formatCurrency, formatRelativeTime, toUsd } from "@/lib/format"
import { projects } from "@/data/projects"
import { transactions, disputes as disputeRecords } from "@/data/transactions"
import { users } from "@/data/users"
import { adminFlags, auditLog, isAdmin, reports, systemHealth } from "@/data/admin"
import type { Report, ReportStatus } from "@/types"

// TODO: replace with the real authenticated user once session/auth
// context exists (only services/authApi.ts is wired up so far).
const CURRENT_USER_ID = "usr_client_01"

function getUserName(userId: string): string {
  return users.find((u) => u.id === userId)?.name ?? "Unknown"
}

function HealthDot({ status }: { status: "operational" | "degraded" | "down" }) {
  return (
    <span
      className={cn(
        "h-2 w-2 shrink-0 rounded-full",
        status === "operational" && "bg-success",
        status === "degraded" && "bg-warning",
        status === "down" && "bg-danger",
      )}
    />
  )
}

export function AdminDashboardPage() {
  const [reportOverrides, setReportOverrides] = useState<Record<string, ReportStatus>>({})
  const [resolvingReport, setResolvingReport] = useState<Report | null>(null)
  const [resolving, setResolving] = useState(false)

  const currentUserIsAdmin = isAdmin(CURRENT_USER_ID)

  const totalVolumeUsd = useMemo(
    () =>
      transactions
        .filter((t) => t.status === "confirmed")
        .reduce((sum, t) => sum + toUsd(t.amount, t.symbol), 0),
    [],
  )

  const getReportStatus = (report: Report) => reportOverrides[report.id] ?? report.status
  const openReportsCount = reports.filter(
    (r) => !["resolved", "dismissed"].includes(getReportStatus(r)),
  ).length

  const handleResolve = async () => {
    if (!resolvingReport) return
    setResolving(true)
    await new Promise((r) => setTimeout(r, 900))
    setReportOverrides((prev) => ({ ...prev, [resolvingReport.id]: "resolved" }))
    setResolving(false)
    setResolvingReport(null)
  }

  if (!currentUserIsAdmin) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="mx-auto max-w-md">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <FiLock className="h-6 w-6 text-subtle" />
            <p className="text-sm font-medium text-foreground">Access restricted</p>
            <p className="text-xs text-muted">
              This area is limited to accounts with admin access.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <PageHeader
          title="Admin Dashboard"
          description="Platform-wide health, reports, and moderation activity."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total users" value={String(users.length)} icon={FiUsers} />
          <MetricCard label="Total projects" value={String(projects.length)} icon={FiFolder} />
          <MetricCard
            label="Total volume"
            value={formatCurrency(totalVolumeUsd)}
            icon={FiDollarSign}
          />
          <MetricCard
            label="Active disputes"
            value={String(disputeRecords.filter((d) => !["resolved", "closed"].includes(d.status)).length)}
            icon={FiAlertTriangle}
          />
        </div>

        {/* System health */}
        <Card>
          <CardContent className="flex flex-col gap-3 p-5">
            <h3 className="text-sm font-semibold text-foreground">System health</h3>
            <div className="flex flex-col gap-2">
              {systemHealth.map((check) => (
                <div
                  key={check.service}
                  className="flex items-center justify-between rounded-lg bg-elevated px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <HealthDot status={check.status} />
                    <span className="text-sm text-foreground">{check.service}</span>
                  </div>
                  <span className="text-xs capitalize text-subtle">
                    {check.status} · {check.latencyMs}ms
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reports queue */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Reports</h3>
            <span className="text-xs text-subtle">{openReportsCount} open</span>
          </div>
          <div className="flex flex-col gap-3">
            {reports.map((report) => {
              const status = getReportStatus(report)
              const canResolve = !["resolved", "dismissed"].includes(status)
              return (
                <div
                  key={report.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-foreground">
                        {getUserName(report.reportedUserId)} reported by{" "}
                        {getUserName(report.reportedById)}
                      </span>
                      <span className="text-xs capitalize text-subtle">
                        Reason: {report.reason} · {formatRelativeTime(report.createdAt)}
                      </span>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                  <p className="text-xs leading-relaxed text-muted">{report.details}</p>
                  {canResolve && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="self-start"
                      leftIcon={<FiCheckCircle className="h-3.5 w-3.5" />}
                      onClick={() => setResolvingReport(report)}
                    >
                      Mark resolved
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Audit log */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground">Audit log</h3>
          <div className="flex flex-col gap-2">
            {auditLog.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-elevated text-subtle">
                  <FiClock className="h-3.5 w-3.5" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm text-foreground">
                    <span className="font-medium">{getUserName(entry.actorId)}</span>{" "}
                    {entry.action.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-muted">{entry.note}</span>
                  <span className="text-xs text-subtle">{formatRelativeTime(entry.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-subtle">
          Admin access granted to {adminFlags.length} account
          {adminFlags.length !== 1 ? "s" : ""}.
        </p>
      </div>

      <ConfirmDialog
        open={!!resolvingReport}
        onClose={() => setResolvingReport(null)}
        onConfirm={handleResolve}
        loading={resolving}
        title="Mark report resolved?"
        confirmLabel="Mark resolved"
        description="This closes the report and logs the action to the audit trail."
      />
    </div>
  )
}