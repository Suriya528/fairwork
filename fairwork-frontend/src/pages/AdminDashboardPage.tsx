import { useCallback, useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { FiAlertTriangle, FiDatabase, FiFolder, FiShield, FiUsers } from "react-icons/fi"
import { PageHeader } from "@/components/common/PageHeader"
import { MetricCard } from "@/components/common/MetricCard"
import { DataTable, type Column } from "@/components/tables/DataTable"
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge, type BadgeTone } from "@/components/ui/Badge"
import { ErrorState } from "@/components/feedback/ErrorState"
import { LoadingState } from "@/components/feedback/LoadingState"
import { formatDate, truncateAddress } from "@/lib/format"
import { useAuth } from "@/context/AuthContext"
import { getAdminDisputes, getAdminOverview, getAdminProjects, getAdminSystem, getAdminUsers, type AdminDispute, type AdminOverview, type AdminProject, type AdminSystem, type AdminUser } from "@/services/adminApi"
import { ApiError } from "@/services/apiClient"

type AdminView = "overview" | "users" | "projects" | "disputes" | "system"
type DashboardData = Partial<{ overview: AdminOverview; users: AdminUser[]; projects: AdminProject[]; disputes: AdminDispute[]; system: AdminSystem }>

const displayName = (person: { firstName: string; lastName: string } | null) => person ? `${person.firstName} ${person.lastName}` : "Unassigned"
const toneFor = (status: string): BadgeTone => status === "resolved" || status === "completed" ? "success" : status === "pending" || status === "disputed" ? "warning" : "neutral"
const escrowState = (project: AdminProject) => project.escrowDisputed ? "disputed" : project.escrowCompleted ? "completed" : project.escrowFunded ? "funded" : "not funded"

function SystemHealthCard({ system }: { system: AdminSystem }) {
  return <Card>
    <CardHeader><CardTitle>System and blockchain health</CardTitle></CardHeader>
    <CardBody className="space-y-3 text-sm">
      <div className="flex justify-between gap-4"><span className="text-muted">Backend</span><Badge tone="success" dot>{system.backend}</Badge></div>
      <div className="flex justify-between gap-4"><span className="text-muted">MongoDB connection</span><span>{system.mongoState === 1 ? "connected" : "not connected"}</span></div>
      <div className="flex justify-between gap-4"><span className="text-muted">Network</span><span>{system.chain ?? "Not configured"}</span></div>
      <div className="flex justify-between gap-4"><span className="text-muted">Blockchain listener</span><Badge tone={system.listenerConfigured ? "success" : "warning"} dot>{system.listenerConfigured ? "configured" : "not configured"}</Badge></div>
      <div className="flex justify-between gap-4"><span className="text-muted">Last processed block</span><span>{system.synchronization?.lastProcessedBlock.toLocaleString() ?? "Not available"}</span></div>
      <div className="flex justify-between gap-4"><span className="text-muted">Sync state updated</span><span>{system.synchronization ? formatDate(system.synchronization.updatedAt) : "Not available"}</span></div>
      <div className="border-t border-border pt-3"><p className="mb-2 flex items-center gap-2 font-medium"><FiDatabase className="text-primary" />Public contract addresses</p>{Object.entries(system.contracts).length ? Object.entries(system.contracts).map(([contract, address]) => <p className="break-all text-xs text-muted" key={contract}>{contract}: {address}</p>) : <p className="text-sm text-muted">No public contract addresses are configured.</p>}</div>
    </CardBody>
  </Card>
}

export function AdminDashboardPage() {
  const { token } = useAuth()
  const { pathname } = useLocation()
  const view = (pathname.split("/")[2] || "overview") as AdminView
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setError(null)
    setData(null)
    try {
      if (view === "overview") {
        const [overview, users, projects, disputes, system] = await Promise.all([getAdminOverview(token), getAdminUsers(token, 5), getAdminProjects(token, 5), getAdminDisputes(token, 5), getAdminSystem(token)])
        setData({ overview, users: users.items, projects: projects.items, disputes: disputes.items, system })
      } else if (view === "users") setData({ users: (await getAdminUsers(token, 100)).items })
      else if (view === "projects") setData({ projects: (await getAdminProjects(token, 100)).items })
      else if (view === "disputes") setData({ disputes: (await getAdminDisputes(token, 100)).items })
      else setData({ system: await getAdminSystem(token) })
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null
      setError(apiError?.status === 403 ? "Administrator access required." : apiError?.status === 401 ? "Your session has expired. Please sign in again." : "Unable to load data. Please try again.")
    }
  }, [token, view])

  useEffect(() => { void load() }, [load])
  if (error) return <ErrorState title="Admin console unavailable" description={error} onRetry={() => void load()} />
  if (!data) return <LoadingState label="Loading admin console…" />

  const pageMeta: Record<AdminView, [string, string]> = {
    overview: ["Admin Console", "Read-only platform monitoring and blockchain synchronization."],
    users: ["Users", "Read-only account monitoring."],
    projects: ["Projects", "Read-only project, escrow, and milestone monitoring."],
    disputes: ["Disputes", "Read-only dispute monitoring; resolution remains with the arbitrator."],
    system: ["System Health", "Read-only backend, database, and blockchain listener information."],
  }
  const [title, description] = pageMeta[view]
  const userColumns: Column<AdminUser>[] = [
    { key: "user", header: "User", cell: (row) => <div><p className="font-medium">{row.firstName} {row.lastName}</p><p className="text-xs text-subtle">{row.email}</p></div> },
    { key: "role", header: "Role", cell: (row) => <Badge tone={row.role === "admin" ? "primary" : "neutral"}>{row.role}</Badge> },
    { key: "wallet", header: "Wallet", cell: (row) => row.walletAddress ? <span title={row.walletAddress}>{truncateAddress(row.walletAddress)}</span> : <span className="text-subtle">Not verified</span> },
    { key: "joined", header: "Joined", cell: (row) => formatDate(row.createdAt) },
  ]
  const projectColumns: Column<AdminProject>[] = [
    { key: "project", header: "Project", cell: (row) => <p className="font-medium truncate">{row.title}</p> },
    { key: "parties", header: "Client / freelancer", cell: (row) => <span className="text-muted">{displayName(row.client)} / {displayName(row.freelancer)}</span> },
    { key: "project-status", header: "Project status", cell: (row) => <Badge tone={toneFor(row.status)}>{row.status}</Badge> },
    { key: "escrow", header: "Escrow", cell: (row) => <Badge tone={toneFor(escrowState(row))}>{escrowState(row)}</Badge> },
    { key: "milestones", header: "Milestones", cell: (row) => `${row.releasedMilestoneCount}/${row.milestoneCount} released` },
    { key: "created", header: "Created", cell: (row) => formatDate(row.createdAt) },
  ]
  const disputeColumns: Column<AdminDispute>[] = [
    { key: "project", header: "Project", cell: (row) => row.project?.title ?? "Project unavailable" },
    { key: "parties", header: "Client / freelancer", cell: (row) => <span className="text-muted">{displayName(row.project?.clientId ?? null)} / {displayName(row.project?.freelancerId ?? null)}</span> },
    { key: "status", header: "Status", cell: (row) => <Badge tone={toneFor(row.status)}>{row.status}</Badge> },
    { key: "opened", header: "Opened", cell: (row) => formatDate(row.createdAt) },
    { key: "updated", header: "Updated", cell: (row) => formatDate(row.updatedAt) },
  ]

  return <div className="mx-auto flex max-w-7xl flex-col gap-8">
    <PageHeader title={title} description={description} />
    {view === "overview" && data.overview && <>
      <section><h2 className="mb-3 text-base font-semibold text-foreground">Platform</h2><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Total users" value={data.overview.totalUsers.toLocaleString()} icon={FiUsers} /><MetricCard label="Clients" value={data.overview.totalClients.toLocaleString()} icon={FiUsers} /><MetricCard label="Freelancers" value={data.overview.totalFreelancers.toLocaleString()} icon={FiUsers} /><MetricCard label="Projects" value={data.overview.totalProjects.toLocaleString()} hint={`${data.overview.activeProjects} active · ${data.overview.completedProjects} completed`} icon={FiFolder} /></div></section>
      <section><h2 className="mb-3 text-base font-semibold text-foreground">Escrow and disputes</h2><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Funded escrows" value={data.overview.fundedEscrows.toLocaleString()} icon={FiShield} /><MetricCard label="Completed escrows" value={data.overview.completedEscrows.toLocaleString()} icon={FiShield} /><MetricCard label="Open disputes" value={data.overview.openDisputes.toLocaleString()} icon={FiAlertTriangle} /><MetricCard label="Resolved disputes" value={data.overview.resolvedDisputes.toLocaleString()} icon={FiAlertTriangle} /></div></section>
      {data.system && <SystemHealthCard system={data.system} />}
    </>}
    {view === "users" && <DataTable columns={userColumns} data={data.users ?? []} rowKey={(row) => row.id} emptyTitle="No users found" emptyDescription="No user records are available." />}
    {view === "projects" && <DataTable columns={projectColumns} data={data.projects ?? []} rowKey={(row) => row.id} emptyTitle="No projects found" emptyDescription="No project records are available." />}
    {view === "disputes" && <DataTable columns={disputeColumns} data={data.disputes ?? []} rowKey={(row) => row.id} emptyTitle="No disputes found" emptyDescription="No dispute records are available." />}
    {view === "system" && data.system && <SystemHealthCard system={data.system} />}
  </div>
}
