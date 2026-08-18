import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiDollarSign,
  FiExternalLink,
  FiFileText,
  FiLock,
  FiPaperclip,
  FiPlusCircle,
  FiSend,
  FiStar,
  FiUnlock,
  FiUploadCloud,
  FiUserCheck,
  FiXCircle,
} from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Card, CardContent } from "@/components/ui/Card"
import { Progress } from "@/components/ui/Progress"
import { Breadcrumb } from "@/components/common/Breadcrumb"
import { StatusBadge } from "@/components/common/StatusBadge"
import { ProjectStatusBadge } from "@/components/common/ProjectStatusBadge"
import { MetricCard } from "@/components/common/MetricCard"
import { Avatar } from "@/components/ui/Avatar"
import { WalletAddress } from "@/components/common/WalletAddress"
import { Tabs, type TabItem } from "@/components/ui/Tabs"
import { ApplyModal } from "@/components/applications/ApplyModal"
import { formatCurrency, formatDate, toPercent } from "@/lib/format"
import { useAuth } from "@/context/AuthContext"
import { useCurrency } from "@/context/CurrencyContext"
import { ApiError } from "@/services/apiClient"
import {
  getProjectById,
  getDisplayCategory,
  getProjectDeliverables,
  uploadProjectDeliverable,
  type ApiDeliverable,
  type ApiMilestone,
  type ApiProject,
} from "@/services/projectsApi"
import {
  acceptApplication,
  getMyApplications,
  getProjectApplications,
  rejectApplication,
  type ApiApplication,
} from "@/services/applicationsApi"
import { fundEscrow, raiseEscrowDispute, releaseEscrowMilestone } from "@/services/web3"

type TabValue = "overview" | "applications" | "milestones" | "files" | "activity"

function ProjectNotFound() {
  const navigate = useNavigate()
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card className="mx-auto max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface">
            <FiAlertTriangle className="h-6 w-6 text-subtle" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-foreground">Project not found</h3>
            <p className="text-sm text-muted">This project may have been removed, or the link is incorrect.</p>
          </div>
          <Button variant="primary" onClick={() => navigate("/projects")}>
            Back to projects
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function IdentityCard({
  role,
  name,
  walletAddress,
}: {
  role: "Client" | "Freelancer"
  name: string | null
  walletAddress: string | null
}) {
  if (!name) {
    return (
      <div className="flex flex-col gap-1 rounded-xl border border-dashed border-border bg-surface p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-subtle">{role}</span>
        <span className="text-sm text-muted">Not assigned yet</span>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
      <Avatar name={name} size="md" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-subtle">{role}</span>
        <span className="truncate text-sm font-medium text-foreground">{name}</span>
        {walletAddress && <WalletAddress address={walletAddress} className="mt-1 w-fit" />}
      </div>
    </div>
  )
}

function MilestoneRow({
  milestone,
  canRelease,
  releasing,
  onRelease,
}: {
  milestone: ApiMilestone
  canRelease: boolean
  releasing: boolean
  onRelease: () => void
}) {
  const { formatAmount } = useCurrency()
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-3">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-elevated text-xs font-medium text-muted">
          {milestone.order}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">{milestone.title}</span>
            <StatusBadge status={milestone.status} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-sm font-semibold text-foreground">{formatAmount(milestone.amount)}</span>
        {milestone.paymentReleased ? (
          <Badge tone="success">Paid</Badge>
        ) : (
          <Button size="sm" disabled={!canRelease || releasing} loading={releasing} onClick={onRelease}>
            Release
          </Button>
        )}
      </div>
    </div>
  )
}

function formatFileSize(bytes: number) {
  if (!bytes) return "Size unavailable"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const { formatAmount } = useCurrency()
  const [tab, setTab] = useState<TabValue>("overview")
  const [project, setProject] = useState<ApiProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [actionState, setActionState] = useState("")
  const [actionError, setActionError] = useState("")

  const [deliverables, setDeliverables] = useState<ApiDeliverable[]>([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [filesError, setFilesError] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedMilestoneId, setSelectedMilestoneId] = useState("")
  const [uploadingFile, setUploadingFile] = useState(false)

  // Application system states
  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [applications, setApplications] = useState<ApiApplication[]>([])
  const [myApplication, setMyApplication] = useState<ApiApplication | null>(null)
  const [appsLoading, setAppsLoading] = useState(false)
  const [hiringId, setHiringId] = useState<string | null>(null)

  const isClient = user?.id === project?.clientId
  const isFreelancer = user?.role === "freelancer"
  const isParty = user?.id === project?.clientId || user?.id === project?.freelancerId

  const loadProject = useCallback(async () => {
    if (!id || !token) return
    try {
      const data = await getProjectById(id, token)
      setProject(data)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setNotFound(true)
      else setError(err instanceof Error ? err.message : "Couldn't load project.")
    }
  }, [id, token])

  useEffect(() => {
    if (!id || !token) return
    let cancelled = false

    async function init() {
      setLoading(true)
      setError(null)
      setNotFound(false)
      try {
        const data = await getProjectById(id!, token!)
        if (!cancelled) setProject(data)
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 404) setNotFound(true)
          else setError(err instanceof Error ? err.message : "Couldn't load project.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void init()
    return () => {
      cancelled = true
    }
  }, [id, token])

  // Load project applications if client, or load freelancer's application if freelancer
  const loadApplications = useCallback(async () => {
    if (!id || !token || !project) return
    setAppsLoading(true)
    try {
      if (user?.id === project.clientId) {
        const list = await getProjectApplications(id, token)
        setApplications(list)
      } else if (user?.role === "freelancer") {
        const myApps = await getMyApplications(token)
        const match = myApps.find((a) => a.projectId === id)
        setMyApplication(match || null)
      }
    } catch {
      // Ignore background apps load errors gracefully
    } finally {
      setAppsLoading(false)
    }
  }, [id, token, project, user])

  useEffect(() => {
    if (project && token) {
      void loadApplications()
    }
  }, [project, token, loadApplications])

  const loadDeliverables = useCallback(async () => {
    if (!id || !token) return
    setFilesLoading(true)
    setFilesError("")
    try {
      setDeliverables(await getProjectDeliverables(id, token))
    } catch (err) {
      setFilesError(err instanceof Error ? err.message : "Couldn't load files.")
    } finally {
      setFilesLoading(false)
    }
  }, [id, token])

  useEffect(() => {
    if (tab === "files") void loadDeliverables()
  }, [tab, loadDeliverables])

  if (loading) return <div className="p-4 text-sm text-muted sm:p-6 lg:p-8">Loading project...</div>
  if (notFound) return <ProjectNotFound />
  if (error || !project) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div role="alert" className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error ?? "Couldn't load project."}
        </div>
      </div>
    )
  }

  const completedCount = project.milestones.filter((milestone) => milestone.status === "completed").length
  const completedAmount = project.milestones
    .filter((milestone) => milestone.status === "completed")
    .reduce((sum, milestone) => sum + milestone.amount, 0)
  const remainingAmount = project.budget - completedAmount
  const escrowActive = project.escrowFunded === true && project.escrowCompleted === false && project.escrowDisputed === false

  const refresh = async () => {
    if (id && token) {
      await loadProject()
      await loadApplications()
    }
  }

  const runAction = async (work: () => Promise<void>) => {
    setActionError("")
    try {
      await work()
      setActionState("Transaction confirmed. Waiting for blockchain synchronization…")
      await refresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Blockchain action failed.")
    } finally {
      setActionState("")
    }
  }

  const fund = () =>
    runAction(async () => {
      if (!isClient || !project.freelancerWalletAddress || !user?.walletAddress)
        throw new Error("Only the client with an assigned, verified freelancer wallet can fund escrow.")
      await fundEscrow(
        project.id,
        project.freelancerWalletAddress as `0x${string}`,
        project.milestones.map((m) => String(m.amount)),
        user.walletAddress,
        setActionState,
      )
    })

  const release = (index: number) =>
    runAction(async () => {
      if (!isClient || !escrowActive || !user?.walletAddress) throw new Error("Escrow is not available for release.")
      await releaseEscrowMilestone(project.id, index, user.walletAddress)
    })

  const dispute = () => {
    const reason = window.prompt("Describe the dispute:")?.trim()
    if (reason)
      void runAction(async () => {
        if (!isParty || !escrowActive || !user?.walletAddress)
          throw new Error("Only an escrow party can raise an active escrow dispute.")
        await raiseEscrowDispute(project.id, reason, user.walletAddress)
      })
  }

  const handleHire = async (applicationId: string) => {
    if (!token) return
    setHiringId(applicationId)
    setActionError("")
    try {
      await acceptApplication(applicationId, token)
      await refresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to hire freelancer.")
    } finally {
      setHiringId(null)
    }
  }

  const handleReject = async (applicationId: string) => {
    if (!token) return
    setActionError("")
    try {
      await rejectApplication(applicationId, token)
      await loadApplications()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to reject application.")
    }
  }

  const uploadFile = async () => {
    if (!token || !selectedFile) return
    setUploadingFile(true)
    setFilesError("")
    try {
      await uploadProjectDeliverable(project.id, selectedFile, selectedMilestoneId, token)
      setSelectedFile(null)
      setSelectedMilestoneId("")
      const input = document.getElementById("deliverable-file") as HTMLInputElement | null
      if (input) input.value = ""
      await loadDeliverables()
    } catch (err) {
      setFilesError(err instanceof Error ? err.message : "Couldn't upload the file.")
    } finally {
      setUploadingFile(false)
    }
  }

  const tabItems: TabItem[] = [
    { label: "Overview", value: "overview" },
    ...(isClient ? [{ label: "Applications", value: "applications", count: applications.length }] : []),
    { label: "Milestones", value: "milestones", count: project.milestones.length },
    { label: "Files", value: "files" },
    { label: "Activity", value: "activity", count: 1 },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Breadcrumb items={[{ label: "Dashboard", to: "/dashboard" }, { label: "Projects", to: "/projects" }, { label: project.title }]} />

        <Card className="p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance sm:text-3xl">{project.title}</h1>
                <Badge tone="neutral">{getDisplayCategory(project)}</Badge>
                <ProjectStatusBadge status={project.status} />
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
                <span className="flex items-center gap-1.5 font-semibold text-foreground">{formatAmount(project.budget)}</span>
                <span className="flex items-center gap-1.5">
                  <FiCalendar className="h-4 w-4 text-subtle" />
                  Created {formatDate(project.createdAt)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isFreelancer && project.status === "open" && !project.freelancerId && (
                myApplication ? (
                  <Badge tone={myApplication.status === "accepted" ? "success" : myApplication.status === "rejected" ? "danger" : "warning"}>
                    Application {myApplication.status === "accepted" ? "Accepted ✓" : myApplication.status === "rejected" ? "Rejected" : "Pending Review"}
                  </Badge>
                ) : (
                  <Button variant="primary" size="sm" leftIcon={<FiSend className="h-4 w-4" />} onClick={() => setApplyModalOpen(true)}>
                    Apply to Project
                  </Button>
                )
              )}
              <Button variant="ghost" size="sm" leftIcon={<FiArrowLeft className="h-4 w-4" />} onClick={() => navigate("/projects")}>
                Back to projects
              </Button>
            </div>
          </div>
        </Card>

        {project.escrowDisputed && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-danger">
              <FiAlertTriangle className="h-4 w-4 shrink-0" />
              This project has an open dispute. Escrow release is frozen until it&apos;s resolved.
            </div>
            <Link to="/disputes" className="flex shrink-0 items-center gap-1 text-xs font-medium text-danger hover:underline">
              View disputes
              <FiExternalLink className="h-3 w-3" />
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <Tabs items={tabItems} value={tab} onChange={(value) => setTab(value as TabValue)} className="mb-6" />

            {tab === "overview" && (
              <div className="flex flex-col gap-6">
                <Card>
                  <CardContent className="flex flex-col gap-4 p-6">
                    <h3 className="text-sm font-semibold text-foreground">Description</h3>
                    <p className="text-sm leading-relaxed text-muted">{project.description}</p>
                  </CardContent>
                </Card>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <IdentityCard role="Client" name={project.clientName} walletAddress={project.clientWalletAddress} />
                  <IdentityCard role="Freelancer" name={project.freelancerName} walletAddress={project.freelancerWalletAddress} />
                </div>
                <Card>
                  <CardContent className="flex flex-col gap-3 p-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">Milestone progress</span>
                      <span className="text-muted">
                        {completedCount} of {project.milestones.length} completed
                      </span>
                    </div>
                    <Progress
                      value={toPercent(completedCount, project.milestones.length)}
                      tone={completedCount === project.milestones.length ? "success" : "primary"}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {tab === "applications" && isClient && (
              <div className="flex flex-col gap-4">
                {actionError && <div role="alert" className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">{actionError}</div>}
                {appsLoading ? (
                  <div className="py-12 text-center text-xs text-muted">Loading applications...</div>
                ) : applications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
                    <FiFileText className="mb-3 h-8 w-8 text-subtle" />
                    <p className="text-sm font-medium text-foreground">No applications received yet</p>
                    <p className="mt-1 max-w-xs text-xs text-muted">Proposals submitted by interested freelancers will appear here for your review.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {applications.map((app) => (
                      <Card key={app.id}>
                        <CardContent className="flex flex-col gap-4 p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <Avatar name={`${app.freelancer?.firstName || "Freelancer"} ${app.freelancer?.lastName || ""}`} size="md" />
                              <div>
                                <h4 className="text-sm font-semibold text-foreground">
                                  {app.freelancer?.firstName} {app.freelancer?.lastName}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted">
                                  <span className="flex items-center gap-1 text-warning font-medium">
                                    <FiStar className="h-3.5 w-3.5 fill-current" />
                                    {app.freelancer?.rating?.toFixed(1) || "5.0"}
                                  </span>
                                  <span>·</span>
                                  <span>Applied {formatDate(app.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold text-foreground">{formatAmount(app.proposedAmount)}</span>
                              <span className="block text-[11px] text-muted">Est. delivery: {app.estimatedDelivery}</span>
                            </div>
                          </div>

                          <p className="rounded-xl border border-border bg-base p-4 text-xs leading-relaxed text-muted whitespace-pre-wrap">
                            {app.proposalText}
                          </p>

                          <div className="flex items-center justify-between pt-2 border-t border-border">
                            <Badge tone={app.status === "accepted" ? "success" : app.status === "rejected" ? "danger" : "warning"}>
                              Status: {app.status === "accepted" ? "Hired ✓" : app.status === "rejected" ? "Rejected" : "Pending Review"}
                            </Badge>

                            {app.status === "pending" && !project.freelancerId && (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleReject(app.id)}
                                >
                                  Reject
                                </Button>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  loading={hiringId === app.id}
                                  leftIcon={<FiUserCheck className="h-4 w-4" />}
                                  onClick={() => handleHire(app.id)}
                                >
                                  Hire Freelancer
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "milestones" && (
              <div className="flex flex-col gap-3">
                {project.milestones.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">No milestones yet</p>
                ) : (
                  project.milestones.map((milestone, index) => (
                    <MilestoneRow
                      key={milestone.id}
                      milestone={milestone}
                      canRelease={isClient && escrowActive && !milestone.paymentReleased}
                      releasing={Boolean(actionState)}
                      onRelease={() => release(index)}
                    />
                  ))
                )}
              </div>
            )}

            {tab === "files" && (
              <div className="flex flex-col gap-4">
                <Card>
                  <CardContent className="flex flex-col gap-4 p-5">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Upload deliverable</h3>
                      <p className="mt-1 text-xs text-muted">PDF, images, ZIP, DOC, or DOCX up to 10 MB. Files are stored off-chain.</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        id="deliverable-file"
                        type="file"
                        className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-elevated file:px-3 file:py-2 file:text-xs file:font-medium file:text-foreground hover:file:bg-surface-hover"
                        accept="image/jpeg,image/png,application/pdf,application/zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                        aria-label="Choose a deliverable file"
                      />
                      <select
                        value={selectedMilestoneId}
                        onChange={(event) => setSelectedMilestoneId(event.target.value)}
                        className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Project-level file</option>
                        {project.milestones.map((milestone) => (
                          <option key={milestone.id} value={milestone.id}>
                            {milestone.order}. {milestone.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-xs text-muted">
                        {selectedFile ? `${selectedFile.name} (${formatFileSize(selectedFile.size)})` : "No file selected"}
                      </span>
                      <Button
                        size="sm"
                        loading={uploadingFile}
                        disabled={!selectedFile}
                        leftIcon={<FiUploadCloud className="h-4 w-4" />}
                        onClick={uploadFile}
                      >
                        Upload file
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                {filesError && <div role="alert" className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">{filesError}</div>}
                {filesLoading ? (
                  <div className="rounded-xl border border-border bg-surface px-4 py-10 text-center text-sm text-muted">Loading files...</div>
                ) : deliverables.length === 0 && !filesError ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
                    <FiPaperclip className="mb-3 h-6 w-6 text-subtle" />
                    <p className="text-sm font-medium text-foreground">No deliverables yet</p>
                    <p className="mt-1 max-w-xs text-xs text-muted">Project files uploaded by the client or freelancer will appear here.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {deliverables.map((file) => {
                      const milestone = project.milestones.find((item) => item.id === file.milestoneId)
                      return (
                        <Card key={file.id}>
                          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-start gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-elevated text-subtle">
                                <FiFileText className="h-4 w-4" />
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">{file.filename}</p>
                                <p className="mt-1 text-xs text-muted">
                                  {formatFileSize(file.size)}
                                  {file.mimeType ? ` · ${file.mimeType}` : ""} · Uploaded {formatDate(file.uploadedAt)}
                                  {file.uploadedByName ? ` by ${file.uploadedByName}` : ""}
                                </p>
                                {milestone && <Badge className="mt-2" tone="neutral">Milestone {milestone.order}</Badge>}
                              </div>
                            </div>
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-border-strong px-3 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover"
                            >
                              View / download
                            </a>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {tab === "activity" && (
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-subtle">
                    <FiPlusCircle className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm text-foreground">Project created</span>
                    <span className="text-xs text-subtle">{formatDate(project.createdAt)}</span>
                  </div>
                </div>
                <p className="rounded-xl border border-dashed border-border px-4 py-3 text-xs text-muted">
                  Escrow funding, milestone approvals, and fund releases will appear here with blockchain integration.
                </p>
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
              <MetricCard label="Total budget" value={formatAmount(project.budget)} icon={FiDollarSign} />
              <MetricCard
                label="Completed"
                value={formatAmount(completedAmount)}
                icon={FiUnlock}
                hint={`${completedCount} of ${project.milestones.length} milestones`}
              />
              <MetricCard label="Remaining" value={formatAmount(remainingAmount)} icon={FiLock} />
            </div>
            <Card>
              <CardContent className="flex flex-col gap-3 p-5">
                <h3 className="mb-1 text-sm font-semibold text-foreground">
                  {isClient ? "Client Escrow Actions" : "Project Escrow Protection"}
                </h3>

                {!project.freelancerId && isClient && (
                  <p className="text-xs text-muted">
                    No freelancer hired yet — review submitted proposals under the <strong>Applications</strong> tab to hire a freelancer.
                  </p>
                )}

                {isClient && (
                  <Button
                    disabled={!project.freelancerWalletAddress || project.escrowFunded || Boolean(actionState)}
                    loading={Boolean(actionState)}
                    onClick={fund}
                    leftIcon={<FiLock className="h-4 w-4" />}
                  >
                    Fund escrow
                  </Button>
                )}

                <Button
                  variant="danger"
                  disabled={!isParty || !escrowActive || Boolean(actionState)}
                  onClick={dispute}
                  leftIcon={<FiAlertTriangle className="h-4 w-4" />}
                >
                  Raise a dispute
                </Button>

                {escrowActive && <Badge tone="success">Payment protected by escrow</Badge>}
                {actionState && <p className="text-xs text-muted">{actionState}</p>}
                {actionError && <p className="text-xs text-danger">{actionError}</p>}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      <ApplyModal
        projectId={project.id}
        projectTitle={project.title}
        projectBudget={project.budget}
        open={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        onSuccess={() => {
          void refresh()
        }}
      />
    </div>
  )
}
