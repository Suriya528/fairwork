import { useCallback, useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  FiActivity,
  FiAlertTriangle,
  FiBarChart2,
  FiCheckCircle,
  FiFileText,
  FiFlag,
  FiFolder,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiSlash,
  FiTrendingUp,
  FiCheckSquare,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi"
import { PageHeader } from "@/components/common/PageHeader"
import { MetricCard } from "@/components/common/MetricCard"
import { DataTable, type Column } from "@/components/tables/DataTable"
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge, type BadgeTone } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { Input } from "@/components/ui/Input"
import { ErrorState } from "@/components/feedback/ErrorState"
import { LoadingState } from "@/components/feedback/LoadingState"
import { formatCurrency, formatDate, truncateAddress } from "@/lib/format"
import { useAuth } from "@/context/AuthContext"
import {
  getAdminAnalytics,
  getAdminApplications,
  getAdminArbitrators,
  getAdminAuditLogs,
  getAdminContracts,
  getAdminDisputes,
  getAdminEscrows,
  getAdminIntegrity,
  getAdminOverview,
  getAdminProjects,
  getAdminReports,
  getAdminSystem,
  getAdminTransactions,
  getAdminUserDetail,
  getAdminUsers,
  suspendUser,
  unsuspendUser,
  updateAdminReport,
  type AdminAnalytics,
  type AdminApplication,
  type AdminArbitrators,
  type AdminAuditLog,
  type AdminContract,
  type AdminDispute,
  type AdminEscrow,
  type AdminIntegrity,
  type AdminOverview,
  type AdminProject,
  type AdminReport,
  type AdminSystem,
  type AdminTransaction,
  type AdminUser,
  type AdminUserDetail,
} from "@/services/adminApi"
import { ApiError } from "@/services/apiClient"

type AdminView =
  | "overview"
  | "users"
  | "projects"
  | "applications"
  | "contracts"
  | "escrows"
  | "disputes"
  | "transactions"
  | "reports"
  | "audit-logs"
  | "analytics"
  | "system"

const displayName = (person: { firstName: string; lastName: string } | null | undefined) =>
  person ? `${person.firstName} ${person.lastName}` : "Unassigned"

const toneFor = (status: string): BadgeTone =>
  status === "resolved" || status === "completed" || status === "accepted" || status === "CONFIRMED"
    ? "success"
    : status === "pending" || status === "disputed" || status === "under_review" || status === "funded"
      ? "warning"
      : status === "cancelled" || status === "rejected" || status === "suspended"
        ? "danger"
        : "neutral"

export function AdminDashboardPage() {
  const { token, user: currentUser } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const view = (pathname.split("/")[2] || "overview") as AdminView

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Data states
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [_usersTotal, setUsersTotal] = useState(0)
  const [usersPage, _setUsersPage] = useState(1)

  const [projects, setProjects] = useState<AdminProject[]>([])
  const [_projectsTotal, setProjectsTotal] = useState(0)
  const [projectsPage, _setProjectsPage] = useState(1)

  const [applications, setApplications] = useState<AdminApplication[]>([])
  const [contracts, setContracts] = useState<AdminContract[]>([])
  const [escrows, setEscrows] = useState<AdminEscrow[]>([])
  const [disputes, setDisputes] = useState<AdminDispute[]>([])
  const [arbitrators, setArbitrators] = useState<AdminArbitrators | null>(null)
  const [transactions, setTransactions] = useState<AdminTransaction[]>([])
  const [reports, setReports] = useState<AdminReport[]>([])
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([])
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [system, setSystem] = useState<AdminSystem | null>(null)
  const [integrity, setIntegrity] = useState<AdminIntegrity | null>(null)

  // Filter & Search states for Users
  const [userQuery, setUserQuery] = useState("")
  const [userRoleFilter, setUserRoleFilter] = useState("")
  const [userStatusFilter, setUserStatusFilter] = useState("")

  // Filter & Search states for Projects
  const [projectQuery, setProjectQuery] = useState("")
  const [projectStatusFilter, setProjectStatusFilter] = useState("")

  // User Detail Inspector Modal
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserDetail | null>(null)
  const [_userDetailLoading, setUserDetailLoading] = useState(false)

  // Suspension Modal
  const [suspendModalUser, setSuspendModalUser] = useState<AdminUser | null>(null)
  const [suspendReason, setSuspendReason] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  // Report Resolution Modal
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null)
  const [reportStatus, setReportStatus] = useState<"under_review" | "resolved" | "dismissed">("resolved")
  const [resolutionNotes, setResolutionNotes] = useState("")

  const loadData = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)

    try {
      if (view === "overview") {
        const [ov, sys, integ] = await Promise.all([
          getAdminOverview(token),
          getAdminSystem(token),
          getAdminIntegrity(token),
        ])
        setOverview(ov)
        setSystem(sys)
        setIntegrity(integ)
      } else if (view === "users") {
        const res = await getAdminUsers(token, {
          page: usersPage,
          limit: 15,
          query: userQuery,
          role: userRoleFilter,
          status: userStatusFilter,
        })
        setUsers(res.items)
        setUsersTotal(res.total)
      } else if (view === "projects") {
        const res = await getAdminProjects(token, {
          page: projectsPage,
          limit: 15,
          query: projectQuery,
          status: projectStatusFilter,
        })
        setProjects(res.items)
        setProjectsTotal(res.total)
      } else if (view === "applications") {
        const res = await getAdminApplications(token)
        setApplications(res.items)
      } else if (view === "contracts") {
        const res = await getAdminContracts(token)
        setContracts(res.items)
      } else if (view === "escrows") {
        const res = await getAdminEscrows(token)
        setEscrows(res.items)
      } else if (view === "disputes") {
        const [disp, arb] = await Promise.all([getAdminDisputes(token), getAdminArbitrators(token)])
        setDisputes(disp.items)
        setArbitrators(arb)
      } else if (view === "transactions") {
        const res = await getAdminTransactions(token)
        setTransactions(res.items)
      } else if (view === "reports") {
        const res = await getAdminReports(token)
        setReports(res.items)
      } else if (view === "audit-logs") {
        const res = await getAdminAuditLogs(token)
        setAuditLogs(res.items)
      } else if (view === "analytics") {
        const [an, ov] = await Promise.all([getAdminAnalytics(token), getAdminOverview(token)])
        setAnalytics(an)
        setOverview(ov)
      } else if (view === "system") {
        const [sys, integ] = await Promise.all([getAdminSystem(token), getAdminIntegrity(token)])
        setSystem(sys)
        setIntegrity(integ)
      }
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null
      setError(
        apiError?.status === 403
          ? "Administrator access required."
          : apiError?.status === 401
            ? "Your session has expired. Please sign in again."
            : "Unable to load admin console data."
      )
    } finally {
      setLoading(false)
    }
  }, [token, view, usersPage, userQuery, userRoleFilter, userStatusFilter, projectsPage, projectQuery, projectStatusFilter])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const openUserDetail = async (userId: string) => {
    if (!token) return
    setUserDetailLoading(true)
    try {
      const detail = await getAdminUserDetail(token, userId)
      setSelectedUserDetail(detail)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user detail")
    } finally {
      setUserDetailLoading(false)
    }
  }

  const handleToggleSuspend = async () => {
    if (!token || !suspendModalUser) return
    const targetId = suspendModalUser.id
    const wasSuspended = suspendModalUser.isSuspended
    if (!wasSuspended && !suspendReason.trim()) {
      setError("Suspension reason is required.")
      return
    }
    setActionLoading(true)
    setError(null)
    try {
      if (wasSuspended) {
        await unsuspendUser(token, targetId, suspendReason)
      } else {
        await suspendUser(token, targetId, suspendReason.trim())
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetId
            ? {
                ...u,
                isSuspended: !wasSuspended,
                suspendedReason: wasSuspended ? "" : suspendReason.trim(),
              }
            : u
        )
      )

      setSuspendModalUser(null)
      setSuspendReason("")
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user suspension status")
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateReport = async () => {
    if (!token || !selectedReport) return
    setActionLoading(true)
    try {
      await updateAdminReport(token, selectedReport._id, reportStatus, resolutionNotes)
      setSelectedReport(null)
      setResolutionNotes("")
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update report")
    } finally {
      setActionLoading(false)
    }
  }

  if (error) return <ErrorState title="Admin Console Error" description={error} onRetry={() => void loadData()} />
  if (loading && !overview && users.length === 0 && projects.length === 0 && !system) {
    return <LoadingState label="Loading administration console…" />
  }

  const pageMeta: Record<AdminView, [string, string]> = {
    overview: ["Admin Console", "Platform operations overview, financial status, and data integrity monitoring."],
    users: ["User Management", "Account search, role inspection, user relationships, and strict moderation."],
    projects: ["Project Management", "Marketplace project monitoring, status tracking, and moderation."],
    applications: ["Applications & Hiring", "Proposal submissions, accepted hires, and conversion metrics."],
    contracts: ["Contracts Monitoring", "Off-chain contract agreements and milestone generation status."],
    escrows: ["Escrow Monitoring", "Blockchain-authoritative escrow states and funded project balances."],
    disputes: ["Disputes & Arbitrators", "Marketplace disputes and smart contract arbitrator authority."],
    transactions: ["Blockchain Transactions", "Verified on-chain escrow funding, release, and dispute events."],
    reports: ["Trust & Safety Reports", "User and project reports awaiting moderator review."],
    "audit-logs": ["Audit Logs", "Immutable trail of high-impact administrative actions."],
    analytics: ["Platform Analytics", "Time-series aggregations for users, projects, and escrow volume."],
    system: ["System & Data Integrity", "Backend RPC health, event listener, and automated anomaly detection."],
  }

  const [title, description] = pageMeta[view] || pageMeta.overview

  // --- TABLES DEFINITION ---
  const userColumns: Column<AdminUser>[] = [
    {
      key: "user",
      header: "User",
      cell: (row) => (
        <button
          type="button"
          className="text-left font-medium text-foreground hover:text-primary transition-colors"
          onClick={() => void openUserDetail(row.id)}
        >
          {row.firstName} {row.lastName}
          <p className="text-xs text-subtle font-normal">{row.email}</p>
        </button>
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (row) => <Badge tone={row.role === "admin" ? "primary" : "neutral"}>{row.role}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) =>
        row.isSuspended ? (
          <Badge tone="danger">Suspended</Badge>
        ) : (
          <Badge tone="success">Active</Badge>
        ),
    },
    {
      key: "wallet",
      header: "Wallet",
      cell: (row) =>
        row.walletAddress ? (
          <span className="font-mono text-xs text-foreground" title={row.walletAddress}>
            {truncateAddress(row.walletAddress)}
          </span>
        ) : (
          <span className="text-xs text-subtle">Unverified</span>
        ),
    },
    {
      key: "activity",
      header: "Projects / Apps",
      cell: (row) => <span className="text-xs text-muted">{row.projectCount} proj · {row.applicationCount} apps</span>,
    },
    {
      key: "joined",
      header: "Joined",
      cell: (row) => <span className="text-xs text-muted">{formatDate(row.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "Moderation",
      cell: (row) =>
        row.role === "admin" || row.id === currentUser?.id ? null : (
          <Button
            size="sm"
            variant={row.isSuspended ? "outline" : "danger"}
            onClick={() => {
              setSuspendModalUser(row)
              setSuspendReason(row.suspendedReason || "")
            }}
          >
            {row.isSuspended ? "Unsuspend" : "Suspend"}
          </Button>
        ),
    },
  ]

  const projectColumns: Column<AdminProject>[] = [
    {
      key: "project",
      header: "Project Title",
      cell: (row) => (
        <div>
          <p className="font-medium text-foreground truncate max-w-xs">{row.title}</p>
          <p className="text-xs text-subtle">Budget: {formatCurrency(row.budget)}</p>
        </div>
      ),
    },
    {
      key: "parties",
      header: "Client / Freelancer",
      cell: (row) => (
        <div className="text-xs text-muted">
          <p><span className="font-medium text-foreground">Client:</span> {displayName(row.client)}</p>
          <p><span className="font-medium text-foreground">Freelancer:</span> {displayName(row.freelancer)}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <Badge tone={toneFor(row.status)}>{row.status}</Badge>,
    },
    {
      key: "escrow",
      header: "Escrow State",
      cell: (row) => (
        <Badge tone={row.escrowDisputed ? "danger" : row.escrowCompleted ? "success" : row.escrowFunded ? "warning" : "neutral"}>
          {row.escrowDisputed ? "Disputed" : row.escrowCompleted ? "Completed" : row.escrowFunded ? "Funded" : "Unfunded"}
        </Badge>
      ),
    },
    {
      key: "milestones",
      header: "Milestones",
      cell: (row) => <span className="text-xs text-muted">{row.releasedMilestoneCount}/{row.milestoneCount} released</span>,
    },
    {
      key: "created",
      header: "Created",
      cell: (row) => <span className="text-xs text-muted">{formatDate(row.createdAt)}</span>,
    },
  ]

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button size="sm" variant="outline" leftIcon={<FiRefreshCw className="h-4 w-4" />} onClick={() => void loadData()}>
            Refresh Data
          </Button>
        }
      />

      {/* VIEW: OVERVIEW */}
      {view === "overview" && overview && (
        <div className="flex flex-col gap-8">
          {/* Integrity Warning Alert if Anomalies Found */}
          {integrity && integrity.totalAnomalies > 0 && (
            <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
              <div className="flex items-center gap-3">
                <FiAlertTriangle className="h-5 w-5 text-warning shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Data Integrity Warning ({integrity.totalAnomalies} anomalies detected)
                  </h4>
                  <p className="text-xs text-muted">
                    Automated system scanner detected platform anomalies requiring administrative investigation.
                  </p>
                </div>
                <Button size="sm" variant="outline" className="ml-auto" onClick={() => navigate("/admin/system")}>
                  Inspect Scanner
                </Button>
              </div>
            </div>
          )}

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">Platform Metrics</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Total Users"
                value={overview.totalUsers.toLocaleString()}
                hint={`${overview.totalClients} Clients · ${overview.totalFreelancers} Freelancers`}
                icon={FiUsers}
                to="/admin/users"
              />
              <MetricCard
                label="Active / Suspended"
                value={`${overview.activeUsers} / ${overview.suspendedUsers}`}
                hint="Account moderation status"
                icon={FiSlash}
                to="/admin/users"
              />
              <MetricCard
                label="Projects"
                value={overview.totalProjects.toLocaleString()}
                hint={`${overview.activeProjects} In Progress · ${overview.completedProjects} Completed`}
                icon={FiFolder}
                to="/admin/projects"
              />
              <MetricCard
                label="Applications"
                value={overview.totalApplications.toLocaleString()}
                hint={`${overview.applicationConversionRate}% Hire Conversion Rate`}
                icon={FiFileText}
                to="/admin/applications"
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">Escrow &amp; Disputes Authority</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Funded Escrows"
                value={overview.fundedEscrows.toLocaleString()}
                hint="On-chain confirmed active escrows"
                icon={FiShield}
                to="/admin/escrows"
              />
              <MetricCard
                label="Completed Escrows"
                value={overview.completedEscrows.toLocaleString()}
                hint="Released milestone payments"
                icon={FiCheckCircle}
                to="/admin/escrows"
              />
              <MetricCard
                label="Open Disputes"
                value={overview.openDisputes.toLocaleString()}
                hint="Arbitrator review pending"
                icon={FiAlertTriangle}
                to="/admin/disputes"
              />
              <MetricCard
                label="Resolved Disputes"
                value={overview.resolvedDisputes.toLocaleString()}
                hint="Smart contract dispute outcomes"
                icon={FiUserCheck}
                to="/admin/disputes"
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">Governance &amp; Operations</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Contracts"
                value={overview.totalContracts.toLocaleString()}
                hint="Off-chain contract agreements"
                icon={FiCheckSquare}
                to="/admin/contracts"
              />
              <MetricCard
                label="Trust &amp; Safety Reports"
                value={overview.totalReports.toLocaleString()}
                hint={`${overview.openReports} review pending`}
                icon={FiFlag}
                to="/admin/reports"
              />
              <MetricCard
                label="Analytics &amp; Funnel"
                value={`${overview.applicationConversionRate}%`}
                hint="Hire conversion efficiency"
                icon={FiBarChart2}
                to="/admin/analytics"
              />
              <MetricCard
                label="System Health"
                value={integrity ? `${integrity.totalAnomalies} anomalies` : "Healthy"}
                hint="Automated scanner status"
                icon={FiActivity}
                to="/admin/system"
              />
            </div>
          </section>

          {system && (
            <Card>
              <CardHeader><CardTitle>System &amp; Blockchain Status</CardTitle></CardHeader>
              <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Backend API</span>
                  <Badge tone="success" dot>{system.backend}</Badge>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted">MongoDB Connection</span>
                  <Badge tone={system.mongoState === 1 ? "success" : "danger"} dot>
                    {system.mongoState === 1 ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Blockchain RPC &amp; Chain</span>
                  <Badge tone={system.listenerConfigured ? "success" : "warning"} dot>
                    {system.chain ? `Configured (${system.chain})` : "Unconfigured"}
                  </Badge>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* VIEW: USERS */}
      {view === "users" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
              <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <Input
                placeholder="Search users by name, email, wallet address..."
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="h-10 rounded-lg border border-border bg-surface px-3 text-xs text-foreground"
            >
              <option value="">All Roles</option>
              <option value="client">Client</option>
              <option value="freelancer">Freelancer</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={userStatusFilter}
              onChange={(e) => setUserStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-border bg-surface px-3 text-xs text-foreground"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <DataTable
            columns={userColumns}
            data={users}
            rowKey={(row) => row.id}
            emptyTitle="No users found"
            emptyDescription="No user accounts match your search filters."
          />
        </div>
      )}

      {/* VIEW: PROJECTS */}
      {view === "projects" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
              <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <Input
                placeholder="Search projects by title..."
                value={projectQuery}
                onChange={(e) => setProjectQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={projectStatusFilter}
              onChange={(e) => setProjectStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-border bg-surface px-3 text-xs text-foreground"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="disputed">Disputed</option>
            </select>
          </div>

          <DataTable
            columns={projectColumns}
            data={projects}
            rowKey={(row) => row.id}
            emptyTitle="No projects found"
            emptyDescription="No project records match your query."
          />
        </div>
      )}

      {/* VIEW: APPLICATIONS */}
      {view === "applications" && (
        <DataTable
          columns={[
            {
              key: "project",
              header: "Project",
              cell: (row) => <span className="font-medium text-foreground">{row.projectId?.title ?? "N/A"}</span>,
            },
            {
              key: "freelancer",
              header: "Freelancer",
              cell: (row) => (
                <div>
                  <p className="font-medium">{displayName(row.freelancerId)}</p>
                  <p className="text-xs text-subtle">{row.freelancerId?.email}</p>
                </div>
              ),
            },
            {
              key: "amount",
              header: "Proposed Budget",
              cell: (row) => formatCurrency(row.proposedAmount),
            },
            {
              key: "status",
              header: "Status",
              cell: (row) => <Badge tone={toneFor(row.status)}>{row.status}</Badge>,
            },
            {
              key: "submitted",
              header: "Submitted Date",
              cell: (row) => formatDate(row.createdAt),
            },
          ]}
          data={applications}
          rowKey={(row) => row._id}
          emptyTitle="No applications found"
          emptyDescription="No application records available."
        />
      )}

      {/* VIEW: CONTRACTS */}
      {view === "contracts" && (
        <DataTable
          columns={[
            {
              key: "id",
              header: "Contract ID",
              cell: (row) => <span className="font-mono text-xs text-foreground">{row._id}</span>,
            },
            {
              key: "project",
              header: "Project",
              cell: (row) => <span className="font-medium text-foreground">{row.projectId?.title ?? "N/A"}</span>,
            },
            {
              key: "signatures",
              header: "Signatures",
              cell: (row) => (
                <div className="flex gap-2 text-xs">
                  <Badge tone={row.signedByClient ? "success" : "neutral"}>Client: {row.signedByClient ? "Signed" : "Pending"}</Badge>
                  <Badge tone={row.signedByFreelancer ? "success" : "neutral"}>Freelancer: {row.signedByFreelancer ? "Signed" : "Pending"}</Badge>
                </div>
              ),
            },
            {
              key: "escrow",
              header: "Escrow Status",
              cell: (row) => (
                <Badge tone={row.projectId?.escrowFunded ? "success" : "neutral"}>
                  {row.projectId?.escrowFunded ? "Funded" : "Unfunded"}
                </Badge>
              ),
            },
            {
              key: "date",
              header: "Created Date",
              cell: (row) => formatDate(row.createdAt),
            },
          ]}
          data={contracts}
          rowKey={(row) => row._id}
          emptyTitle="No contracts found"
          emptyDescription="No contract records available."
        />
      )}

      {/* VIEW: ESCROWS */}
      {view === "escrows" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-info/25 bg-info/5 p-4 text-xs text-foreground">
            🛡️ <strong>Escrow Safety Guarantee:</strong> The Admin Dashboard functions as a governance inspector.
            Smart contract financial balances and escrow funds remain strictly authoritative on-chain.
          </div>

          <DataTable
            columns={[
              {
                key: "project",
                header: "Project",
                cell: (row) => <span className="font-medium text-foreground">{row.projectTitle}</span>,
              },
              {
                key: "amount",
                header: "Escrow Budget",
                cell: (row) => formatCurrency(row.budget),
              },
              {
                key: "state",
                header: "Database Escrow State",
                cell: (row) => <Badge tone={toneFor(row.escrowState)}>{row.escrowState}</Badge>,
              },
              {
                key: "onchain",
                header: "Blockchain Confirmation",
                cell: (row) =>
                  row.onChainConfirmed ? (
                    <Badge tone="success">On-Chain Confirmed</Badge>
                  ) : (
                    <Badge tone="neutral">Pending / Unfunded</Badge>
                  ),
              },
              {
                key: "tx",
                header: "Transaction Hash",
                cell: (row) =>
                  row.escrowTxnHash ? (
                    <span className="font-mono text-xs text-primary" title={row.escrowTxnHash}>
                      {truncateAddress(row.escrowTxnHash)}
                    </span>
                  ) : (
                    <span className="text-xs text-subtle">N/A</span>
                  ),
              },
            ]}
            data={escrows}
            rowKey={(row) => row.id}
            emptyTitle="No escrows found"
            emptyDescription="No escrow records available."
          />
        </div>
      )}

      {/* VIEW: DISPUTES */}
      {view === "disputes" && (
        <div className="flex flex-col gap-6">
          {arbitrators && (
            <Card>
              <CardHeader><CardTitle>Arbitrator Smart Contract Authority</CardTitle></CardHeader>
              <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                <div>
                  <span className="text-muted">Authority Model:</span>
                  <p className="font-semibold text-foreground">{arbitrators.authorityModel}</p>
                </div>
                <div>
                  <span className="text-muted">Active Disputes Assigned:</span>
                  <p className="font-semibold text-warning">{arbitrators.assignedDisputes} pending</p>
                </div>
                <div>
                  <span className="text-muted">Dispute Contract:</span>
                  <p className="font-mono text-muted truncate">{arbitrators.disputeContractAddress || "Configured on Sepolia/EVM"}</p>
                </div>
              </CardBody>
            </Card>
          )}

          <DataTable
            columns={[
              {
                key: "project",
                header: "Disputed Project",
                cell: (row) => <span className="font-medium text-foreground">{row.project?.title ?? "N/A"}</span>,
              },
              {
                key: "raisedBy",
                header: "Raised By",
                cell: (row) => displayName(row.raisedBy),
              },
              {
                key: "reason",
                header: "Dispute Reason",
                cell: (row) => <span className="text-xs text-muted truncate max-w-xs">{row.reason}</span>,
              },
              {
                key: "status",
                header: "Status",
                cell: (row) => <Badge tone={toneFor(row.status)}>{row.status}</Badge>,
              },
              {
                key: "winner",
                header: "Outcome / Winner",
                cell: (row) => <Badge tone={row.winner === "none" ? "neutral" : "primary"}>{row.winner}</Badge>,
              },
            ]}
            data={disputes}
            rowKey={(row) => row.id}
            emptyTitle="No disputes found"
            emptyDescription="No active or resolved dispute records available."
          />
        </div>
      )}

      {/* VIEW: TRANSACTIONS */}
      {view === "transactions" && (
        <DataTable
          columns={[
            {
              key: "hash",
              header: "Transaction Hash",
              cell: (row) => <span className="font-mono text-xs text-primary">{row.hash}</span>,
            },
            {
              key: "type",
              header: "Event Type",
              cell: (row) => <Badge tone="primary">{row.type}</Badge>,
            },
            {
              key: "project",
              header: "Project",
              cell: (row) => <span className="font-medium text-foreground">{row.projectTitle}</span>,
            },
            {
              key: "chain",
              header: "Network",
              cell: (row) => <span className="text-xs text-muted">{row.chain}</span>,
            },
            {
              key: "status",
              header: "Confirmation",
              cell: (row) => <Badge tone="success">{row.status}</Badge>,
            },
            {
              key: "date",
              header: "Timestamp",
              cell: (row) => formatDate(row.timestamp),
            },
          ]}
          data={transactions}
          rowKey={(row) => row.id}
          emptyTitle="No transactions found"
          emptyDescription="No on-chain transaction events recorded."
        />
      )}

      {/* VIEW: REPORTS */}
      {view === "reports" && (
        <DataTable
          columns={[
            {
              key: "target",
              header: "Target Type & ID",
              cell: (row) => (
                <div>
                  <Badge tone="neutral">{row.targetType}</Badge>
                  <p className="font-mono text-[11px] text-subtle mt-1">{row.targetId}</p>
                </div>
              ),
            },
            {
              key: "category",
              header: "Category",
              cell: (row) => <span className="font-medium text-foreground">{row.category}</span>,
            },
            {
              key: "description",
              header: "Description",
              cell: (row) => <span className="text-xs text-muted truncate max-w-xs">{row.description}</span>,
            },
            {
              key: "reporter",
              header: "Reporter",
              cell: (row) => displayName(row.reporter),
            },
            {
              key: "status",
              header: "Status",
              cell: (row) => <Badge tone={toneFor(row.status)}>{row.status}</Badge>,
            },
            {
              key: "action",
              header: "Action",
              cell: (row) => (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedReport(row)
                    setReportStatus(row.status === "open" ? "resolved" : (row.status as any))
                    setResolutionNotes(row.resolutionNotes || "")
                  }}
                >
                  Manage
                </Button>
              ),
            },
          ]}
          data={reports}
          rowKey={(row) => row._id}
          emptyTitle="No reports found"
          emptyDescription="No trust & safety reports pending."
        />
      )}

      {/* VIEW: AUDIT LOGS */}
      {view === "audit-logs" && (
        <DataTable
          columns={[
            {
              key: "admin",
              header: "Admin Name",
              cell: (row) => <span className="font-medium text-foreground">{row.adminName}</span>,
            },
            {
              key: "action",
              header: "Action",
              cell: (row) => <Badge tone="primary">{row.action}</Badge>,
            },
            {
              key: "target",
              header: "Target",
              cell: (row) => <span className="text-xs text-muted">{row.targetType} ({row.targetId})</span>,
            },
            {
              key: "reason",
              header: "Reason / Notes",
              cell: (row) => <span className="text-xs text-muted truncate max-w-xs">{row.reason || "N/A"}</span>,
            },
            {
              key: "date",
              header: "Timestamp",
              cell: (row) => formatDate(row.createdAt),
            },
          ]}
          data={auditLogs}
          rowKey={(row) => row._id}
          emptyTitle="No audit logs"
          emptyDescription="No administrative actions logged yet."
        />
      )}

      {/* VIEW: ANALYTICS */}
      {view === "analytics" && analytics && (
        <div className="flex flex-col gap-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Growth Trend"
              value={`${analytics.userGrowth.reduce((acc, curr) => acc + curr.users, 0)} users`}
              hint="New user registrations in last 30 days"
              icon={FiTrendingUp}
              to="/admin/users"
            />
            <MetricCard
              label="Projects Distribution"
              value={`${analytics.projectDistribution.reduce((acc, curr) => acc + curr.count, 0)} total`}
              hint="Marketplace projects breakdown"
              icon={FiFolder}
              to="/admin/projects"
            />
            <MetricCard
              label="Applications Funnel"
              value={`${analytics.applicationStats.reduce((acc, curr) => acc + curr.count, 0)} apps`}
              hint="Total freelancer applications submitted"
              icon={FiFileText}
              to="/admin/applications"
            />
            {(() => {
              const acceptedApps = analytics.applicationStats.find((a) => a.status === "accepted")?.count || 0
              const totalApps = analytics.applicationStats.reduce((acc, curr) => acc + curr.count, 0)
              const rate = totalApps > 0
                ? Math.round((acceptedApps / totalApps) * 100)
                : (overview?.applicationConversionRate ?? 0)

              return (
                <MetricCard
                  label="Hire Conversion"
                  value={`${rate}%`}
                  hint="Application to hire conversion rate"
                  icon={FiBarChart2}
                  to="/admin/applications"
                />
              )
            })()}
          </div>

          {/* User Registration Growth Bar Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Account Registrations (Last 30 Days)</CardTitle>
                  <p className="text-xs text-muted mt-0.5">Daily account registration volume across clients and freelancers.</p>
                </div>
                <Badge tone="primary">{analytics.userGrowth.length} Active Days</Badge>
              </div>
            </CardHeader>
            <CardBody className="flex flex-col gap-4">
              {analytics.userGrowth.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-12 text-center text-xs text-muted">
                  No account registration data recorded in the last 30 days.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex h-44 items-end gap-2 border-b border-border pb-3 pt-6 px-2 overflow-x-auto">
                    {analytics.userGrowth.map((g, i) => {
                      const max = Math.max(...analytics.userGrowth.map((item) => item.users), 1)
                      const heightPercent = Math.max(15, Math.round((g.users / max) * 100))
                      return (
                        <div key={i} className="group relative flex flex-1 flex-col items-center gap-1 min-w-[28px]">
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-primary font-bold">
                            {g.users}
                          </span>
                          <div
                            className="w-full rounded-t-md bg-gradient-to-t from-primary/60 to-primary transition-all duration-300 group-hover:from-primary group-hover:to-primary-hover"
                            style={{ height: `${heightPercent}%` }}
                          />
                          <span className="text-[9px] text-subtle truncate max-w-full font-mono mt-1">
                            {g.date.split("-").slice(1).join("/")}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Distribution Breakdown Grids */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Project Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Project Status Breakdown</CardTitle>
              </CardHeader>
              <CardBody className="flex flex-col gap-4">
                {analytics.projectDistribution.length === 0 ? (
                  <div className="text-center text-xs text-muted py-8">No project distribution data available.</div>
                ) : (
                  analytics.projectDistribution.map((item) => {
                    const totalProjects = analytics.projectDistribution.reduce((acc, curr) => acc + curr.count, 0)
                    const percent = totalProjects > 0 ? Math.round((item.count / totalProjects) * 100) : 0
                    return (
                      <div key={item.status} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="capitalize text-foreground">{item.status.replace("_", " ")}</span>
                          <span className="text-muted">{item.count} projects ({percent}%)</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-elevated">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </CardBody>
            </Card>

            {/* Application & Hire Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>Application Conversion Funnel</CardTitle>
              </CardHeader>
              <CardBody className="flex flex-col gap-4">
                {analytics.applicationStats.length === 0 ? (
                  <div className="text-center text-xs text-muted py-8">No application statistics available.</div>
                ) : (
                  analytics.applicationStats.map((item) => {
                    const totalApps = analytics.applicationStats.reduce((acc, curr) => acc + curr.count, 0)
                    const percent = totalApps > 0 ? Math.round((item.count / totalApps) * 100) : 0
                    return (
                      <div key={item.status} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <div className="flex items-center gap-2">
                            <Badge tone={toneFor(item.status)}>{item.status}</Badge>
                            <span className="capitalize text-foreground">{item.status} Applications</span>
                          </div>
                          <span className="text-muted">{item.count} ({percent}%)</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-elevated">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              item.status === "accepted" ? "bg-success" : item.status === "pending" ? "bg-warning" : "bg-neutral"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* VIEW: SYSTEM & DATA INTEGRITY */}
      {view === "system" && (
        <div className="flex flex-col gap-6">
          {system && (
            <Card>
              <CardHeader><CardTitle>System Components Health</CardTitle></CardHeader>
              <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Node.js Express Server</span>
                  <Badge tone="success" dot>Available</Badge>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted">MongoDB Database</span>
                  <Badge tone={system.mongoState === 1 ? "success" : "danger"} dot>
                    {system.mongoState === 1 ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Blockchain Listener</span>
                  <Badge tone={system.listenerConfigured ? "success" : "warning"} dot>
                    {system.listenerConfigured ? "Running" : "Standby"}
                  </Badge>
                </div>
              </CardBody>
            </Card>
          )}

          {integrity && (
            <Card>
              <CardHeader><CardTitle>Automated Data Integrity Scanner Results</CardTitle></CardHeader>
              <CardBody className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>Last Scanned: {formatDate(integrity.scanTimestamp)}</span>
                  <Badge tone={integrity.totalAnomalies === 0 ? "success" : "warning"}>
                    {integrity.totalAnomalies} Anomalies Detected
                  </Badge>
                </div>

                {integrity.anomalies.length === 0 ? (
                  <div className="rounded-xl border border-success/20 bg-success/5 p-6 text-center text-xs text-success font-medium">
                    ✅ All database relationships and escrow records are completely consistent.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {integrity.anomalies.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 rounded-lg border border-border p-3 text-xs">
                        <Badge tone={item.severity === "HIGH" ? "danger" : "warning"}>{item.severity}</Badge>
                        <div>
                          <p className="font-semibold text-foreground">{item.type} ({item.entityType}: {item.entityId})</p>
                          <p className="mt-0.5 text-muted">{item.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* USER DETAIL INSPECTOR MODAL */}
      {selectedUserDetail && (
        <Modal open={Boolean(selectedUserDetail)} onClose={() => setSelectedUserDetail(null)}>
          <div className="flex flex-col gap-4 p-6 text-xs">
            <div className="rounded-xl border border-border p-4">
              <h4 className="font-semibold text-foreground text-sm">
                {selectedUserDetail.user.firstName} {selectedUserDetail.user.lastName}
              </h4>
              <p className="text-muted">{selectedUserDetail.user.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge tone={selectedUserDetail.user.role === "admin" ? "primary" : "neutral"}>
                  Role: {selectedUserDetail.user.role}
                </Badge>
                <Badge tone={selectedUserDetail.user.isSuspended ? "danger" : "success"}>
                  Status: {selectedUserDetail.user.isSuspended ? "Suspended" : "Active"}
                </Badge>
              </div>
            </div>

            <div>
              <h5 className="font-semibold text-foreground mb-1">Created Projects ({selectedUserDetail.projects.length})</h5>
              <div className="max-h-28 overflow-y-auto space-y-1">
                {selectedUserDetail.projects.map((p) => (
                  <div key={p._id} className="flex justify-between border-b border-border py-1">
                    <span>{p.title}</span>
                    <Badge tone={toneFor(p.status)}>{p.status}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setSelectedUserDetail(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* USER SUSPENSION MODAL */}
      {suspendModalUser && (
        <Modal open={Boolean(suspendModalUser)} onClose={() => setSuspendModalUser(null)}>
          <div className="flex flex-col gap-4 p-6 text-xs">
            <h3 className="text-base font-bold text-foreground">
              {suspendModalUser.isSuspended ? "Unsuspend User Account" : "Suspend User Account"}
            </h3>
            <p className="text-muted leading-relaxed">
              {suspendModalUser.isSuspended
                ? `Unsuspend access for ${suspendModalUser.firstName} ${suspendModalUser.lastName} (${suspendModalUser.email}).`
                : `Suspend ${suspendModalUser.firstName} ${suspendModalUser.lastName} (${suspendModalUser.email}). This action restricts normal protected platform actions for this account. Historical user data, projects, contracts, and escrow records are preserved and not deleted. This moderation event is recorded in system audit logs and can be reversed by an authorized administrator at any time.`}
            </p>
            <div className="flex flex-col gap-1">
              <label className="font-medium text-foreground">Reason / Moderation Notes:</label>
              <Input
                placeholder="Enter detailed reason for moderation action..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="ghost" onClick={() => setSuspendModalUser(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant={suspendModalUser.isSuspended ? "primary" : "danger"}
                loading={actionLoading}
                onClick={handleToggleSuspend}
                disabled={!suspendModalUser.isSuspended && !suspendReason.trim()}
              >
                {suspendModalUser.isSuspended ? "Confirm Unsuspend" : "Confirm Suspension"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* REPORT RESOLUTION MODAL */}
      {selectedReport && (
        <Modal open={Boolean(selectedReport)} onClose={() => setSelectedReport(null)}>
          <div className="flex flex-col gap-4 p-6 text-xs">
            <h3 className="text-base font-bold text-foreground">Update Trust &amp; Safety Report</h3>
            <p className="text-muted font-medium">{selectedReport.category}: {selectedReport.description}</p>
            <div className="flex flex-col gap-1">
              <label className="font-medium text-foreground">Status:</label>
              <select
                value={reportStatus}
                onChange={(e) => setReportStatus(e.target.value as any)}
                className="h-10 rounded-lg border border-border bg-surface px-3 text-xs text-foreground"
              >
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-medium text-foreground">Resolution Notes:</label>
              <Input
                placeholder="Provide resolution details..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="ghost" onClick={() => setSelectedReport(null)}>
                Cancel
              </Button>
              <Button size="sm" loading={actionLoading} onClick={handleUpdateReport}>
                Save Report Update
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
