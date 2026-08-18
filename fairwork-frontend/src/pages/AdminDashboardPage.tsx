import { useCallback, useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  FiActivity,
  FiAlertTriangle,
  FiBarChart2,
  FiCheckCircle,
  FiDatabase,
  FiFileText,
  FiFilter,
  FiFlag,
  FiFolder,
  FiList,
  FiLock,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiSlash,
  FiUserCheck,
  FiUsers,
  FiXCircle,
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
  const [usersTotal, setUsersTotal] = useState(0)
  const [usersPage, setUsersPage] = useState(1)

  const [projects, setProjects] = useState<AdminProject[]>([])
  const [projectsTotal, setProjectsTotal] = useState(0)
  const [projectsPage, setProjectsPage] = useState(1)

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
  const [userDetailLoading, setUserDetailLoading] = useState(false)

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
        const res = await getAdminAnalytics(token)
        setAnalytics(res)
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
    setActionLoading(true)
    try {
      if (suspendModalUser.isSuspended) {
        await unsuspendUser(token, suspendModalUser.id, suspendReason)
      } else {
        await suspendUser(token, suspendModalUser.id, suspendReason)
      }
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
            variant={row.isSuspended ? "outline" : "ghost"}
            tone={row.isSuspended ? "neutral" : "danger"}
            onClick={() => {
              setSuspendModalUser(row)
              setSuspendReason(row.suspendedReason || "")
            }}
          >
            {row.isSuspended ? "Reinstate" : "Suspend"}
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
      <PageHeader title={title} description={description}>
        <Button size="sm" variant="outline" leftIcon={<FiRefreshCw className="h-4 w-4" />} onClick={() => void loadData()}>
          Refresh Data
        </Button>
      </PageHeader>

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
              <MetricCard label="Total Users" value={overview.totalUsers.toLocaleString()} hint={`${overview.totalClients} Clients · ${overview.totalFreelancers} Freelancers`} icon={FiUsers} />
              <MetricCard label="Active / Suspended" value={`${overview.activeUsers} / ${overview.suspendedUsers}`} hint="Account moderation status" icon={FiSlash} />
              <MetricCard label="Projects" value={overview.totalProjects.toLocaleString()} hint={`${overview.activeProjects} In Progress · ${overview.completedProjects} Completed`} icon={FiFolder} />
              <MetricCard label="Applications" value={overview.totalApplications.toLocaleString()} hint={`${overview.applicationConversionRate}% Hire Conversion Rate`} icon={FiFileText} />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">Escrow &amp; Disputes Authority</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Funded Escrows" value={overview.fundedEscrows.toLocaleString()} hint="On-chain confirmed active escrows" icon={FiShield} />
              <MetricCard label="Completed Escrows" value={overview.completedEscrows.toLocaleString()} hint="Released milestone payments" icon={FiCheckCircle} />
              <MetricCard label="Open Disputes" value={overview.openDisputes.toLocaleString()} hint="Arbitrator review pending" icon={FiAlertTriangle} />
              <MetricCard label="Resolved Disputes" value={overview.resolvedDisputes.toLocaleString()} hint="Smart contract dispute outcomes" icon={FiUserCheck} />
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
        <Modal isOpen title="User Account Inspector" onClose={() => setSelectedUserDetail(null)}>
          <div className="flex flex-col gap-4 text-xs">
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
        <Modal
          isOpen
          title={suspendModalUser.isSuspended ? "Reinstate User Account" : "Suspend User Account"}
          onClose={() => setSuspendModalUser(null)}
        >
          <div className="flex flex-col gap-4 text-xs">
            <p className="text-muted">
              {suspendModalUser.isSuspended
                ? `Reinstate access for ${suspendModalUser.firstName} ${suspendModalUser.lastName} (${suspendModalUser.email}).`
                : `Suspend ${suspendModalUser.firstName} ${suspendModalUser.lastName} (${suspendModalUser.email}). This will immediately block login and all platform API interactions.`}
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
                tone={suspendModalUser.isSuspended ? "primary" : "danger"}
                loading={actionLoading}
                onClick={handleToggleSuspend}
              >
                {suspendModalUser.isSuspended ? "Confirm Reinstatement" : "Confirm Suspension"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* REPORT RESOLUTION MODAL */}
      {selectedReport && (
        <Modal isOpen title="Update Trust &amp; Safety Report" onClose={() => setSelectedReport(null)}>
          <div className="flex flex-col gap-4 text-xs">
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
