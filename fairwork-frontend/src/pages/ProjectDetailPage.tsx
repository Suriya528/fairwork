import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiDollarSign,
  FiExternalLink,
  FiFileText,
  FiLock,
  FiPaperclip,
  FiPlusCircle,
  FiSend,
  FiShield,
  FiStar,
  FiUnlock,
  FiUploadCloud,
  FiUserCheck,
  FiX,
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
import { LoadingState } from "@/components/feedback/LoadingState"
import { ErrorState } from "@/components/feedback/ErrorState"
import { ApplyModal } from "@/components/applications/ApplyModal"
import { formatDate, formatDateTime, formatDeadlineCountdown, toPercent } from "@/lib/format"
import { useAuth } from "@/context/AuthContext"
import { useCurrency } from "@/context/CurrencyContext"
import { ApiError } from "@/services/apiClient"
import { VerificationRequiredModal } from "@/components/auth/VerificationRequiredModal"
import {
  getProjectById,
  getDisplayCategory,
  getProjectDeliverables,
  uploadProjectDeliverable,
  getProjectReferenceFiles,
  uploadProjectReferenceFile,
  submitMilestone,
  requestMilestoneRevision,
  approveMilestone,
  assignFreelancer,
  type ApiDeliverable,
  type ApiMilestone,
  type ApiProject,
  type ApiReferenceFile,
} from "@/services/projectsApi"
import {
  getMyApplications,
  getProjectApplications,
  rejectApplication,
  type ApiApplication,
} from "@/services/applicationsApi"
import {
  generateContract,
  getContract,
  signContract,
  type ApiContract,
} from "@/services/contractsApi"
import { fundEscrow, raiseEscrowDispute, releaseEscrowMilestone } from "@/services/web3"
import { depositEscrow, releaseEscrowPayment } from "@/services/escrowApi"
import { raiseDispute } from "@/services/disputesApi"
import { getReleasedAmount, getUnreleasedAmount } from "@/lib/financial"

type TabValue = "overview" | "applications" | "proposals" | "contract" | "milestones" | "files" | "disputes" | "activity"

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

function SubmitWorkModal({
  open,
  onClose,
  milestone,
  project,
  onSubmitWork,
}: {
  open: boolean
  onClose: () => void
  milestone: ApiMilestone
  project: ApiProject
  onSubmitWork: (milestoneId: string, notes: string, files: File[]) => Promise<void>
}) {
  const { formatAmount } = useCurrency()
  const [notes, setNotes] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      setNotes("")
      setSelectedFiles([])
      setError("")
      setSubmitting(false)
    }
  }, [open, milestone.id])

  if (!open) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setSelectedFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      await onSubmitWork(milestone.id, notes, selectedFiles)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit milestone work.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-work-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-elevated/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
              <FiUploadCloud className="h-4 w-4" />
            </div>
            <div>
              <h2 id="submit-work-modal-title" className="text-base font-semibold text-foreground">
                {milestone.status === "revision_requested" ? "Resubmit Milestone Work" : "Submit Work for Milestone"}
              </h2>
              <p className="text-xs text-subtle">Attach deliverables and submit notes for client review</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1 text-subtle hover:bg-elevated hover:text-foreground transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6 overflow-y-auto">
          {/* Milestone Details Summary */}
          <div className="rounded-xl border border-border bg-base p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                {milestone.order}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{milestone.title}</p>
                <span className="text-xs text-subtle">Milestone {milestone.order} of {project.milestones?.length || 1}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-primary">{formatAmount(milestone.amount)}</p>
              <Badge tone={milestone.status === "revision_requested" ? "danger" : "neutral"}>
                {milestone.status === "revision_requested" ? "Revision Requested" : "Pending"}
              </Badge>
            </div>
          </div>

          {/* Revision Feedback if present */}
          {milestone.revisionNotes && milestone.status === "revision_requested" && (
            <div className="rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs text-danger space-y-1">
              <p className="font-semibold text-[11px] uppercase tracking-wider">Client Revision Feedback:</p>
              <p className="whitespace-pre-wrap">{milestone.revisionNotes}</p>
            </div>
          )}

          {/* Deliverables / Attach Files */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Deliverables &amp; Attachments
              </label>
              <span className="text-[11px] text-subtle">Zip, PDF, PNG, Code, Docs (Max 50MB)</span>
            </div>
            <p className="text-xs text-muted">
              Attach the files that demonstrate completion of this milestone.
            </p>

            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-border bg-elevated px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-surface-hover hover:border-primary/50 transition-all shadow-sm">
                <FiPaperclip className="h-4 w-4 text-primary" />
                <span>Choose Files</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,application/pdf,application/zip,application/x-zip-compressed,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain,video/*"
                />
              </label>
              <span className="text-xs text-subtle">
                {selectedFiles.length === 0 ? "No files selected yet" : `${selectedFiles.length} file(s) selected`}
              </span>
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="flex flex-col gap-2 mt-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Selected Files ({selectedFiles.length}):</p>
                <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between rounded-lg border border-border bg-base px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FiCheckCircle className="h-4 w-4 shrink-0 text-success" />
                        <span className="truncate font-medium text-foreground max-w-[240px]">{file.name}</span>
                        <span className="text-[11px] text-subtle shrink-0">({formatFileSize(file.size)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="rounded p-1 text-subtle hover:bg-elevated hover:text-danger transition-colors"
                        aria-label={`Remove ${file.name}`}
                      >
                        <FiX className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submission Notes */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="submission-notes" className="text-xs font-semibold text-foreground">
              Submission Notes
            </label>
            <textarea
              id="submission-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe completed deliverables, implementation highlights, link to repository or testing environment..."
              className="w-full rounded-xl border border-border bg-base p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-subtle resize-none"
            />
          </div>

          {error && (
            <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
              {error}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submitting} leftIcon={<FiUploadCloud className="h-4 w-4" />}>
              {submitting ? "Submitting Work..." : "Submit for Review"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MilestoneRow({
  milestone,
  project,
  isClient,
  isFreelancer,
  canRelease,
  releasing,
  deliverables,
  onSubmit,
  onRequestRevision,
  onApprove,
  onRelease,
}: {
  milestone: ApiMilestone
  project: ApiProject
  isClient: boolean
  isFreelancer: boolean
  canRelease: boolean
  releasing: boolean
  deliverables: ApiDeliverable[]
  onSubmit: (milestoneId: string, notes: string, files: File[]) => Promise<void>
  onRequestRevision: (milestoneId: string, notes: string) => Promise<void>
  onApprove: (milestoneId: string) => Promise<void>
  onRelease: () => void
}) {
  const { formatAmount } = useCurrency()
  const [submitModalOpen, setSubmitModalOpen] = useState(false)

  const milestoneDeliverables = deliverables.filter((d) => d.milestoneId === milestone.id)

  const handleRevisionClick = async () => {
    const reason = window.prompt("Explain required revisions for the freelancer:")?.trim()
    if (reason) {
      await onRequestRevision(milestone.id, reason)
    }
  }

  const getStatusBadge = () => {
    switch (milestone.status) {
      case "submitted":
        return <Badge tone="warning">Submitted for Review ⏳</Badge>
      case "revision_requested":
        return <Badge tone="danger">Revision Requested ⚠️</Badge>
      case "completed":
        return <Badge tone="success">Completed &amp; Approved ✓</Badge>
      default:
        return <StatusBadge status={milestone.status} />
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-elevated text-xs font-bold text-foreground">
            {milestone.order}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold text-foreground">{milestone.title}</span>
              {getStatusBadge()}
            </div>
            {milestone.submittedAt && (
              <p className="text-[11px] text-subtle">
                Submitted on {formatDate(milestone.submittedAt)}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="shrink-0 text-base font-bold text-primary">{formatAmount(milestone.amount)}</span>

          {/* Client Review Controls */}
          {isClient && milestone.status === "submitted" && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="primary" onClick={() => onApprove(milestone.id)}>
                Approve Milestone
              </Button>
              <Button size="sm" variant="secondary" onClick={handleRevisionClick}>
                Request Revision
              </Button>
            </div>
          )}

          {/* Milestone Payment Status & Actions */}
          {milestone.status === "completed" && (
            milestone.paymentReleased ? (
              <Badge tone="success">Payment Released ✓</Badge>
            ) : releasing ? (
              <Button size="sm" disabled loading>
                Releasing Payment...
              </Button>
            ) : isClient ? (
              <div className="flex items-center gap-2">
                <Badge tone="warning">Payment: Pending Release</Badge>
                <Button size="sm" variant="primary" disabled={!canRelease} onClick={onRelease}>
                  Release Escrow Payout
                </Button>
              </div>
            ) : (
              <Badge tone="warning">Payment: Pending Release</Badge>
            )
          )}

          {/* Freelancer Submit Action */}
          {isFreelancer && (milestone.status === "pending" || milestone.status === "in_progress" || milestone.status === "revision_requested") && (
            <Button size="sm" variant="primary" onClick={() => setSubmitModalOpen(true)}>
              {milestone.status === "revision_requested" ? "Resubmit Work" : "Submit Work"}
            </Button>
          )}
        </div>
      </div>

      {/* Submitted Notes Block */}
      {milestone.submissionNotes && (
        <div className="rounded-lg border border-border bg-base p-3 text-xs text-foreground/90 space-y-1">
          <p className="font-semibold text-muted text-[11px] uppercase tracking-wider">Freelancer Submission Notes:</p>
          <p className="whitespace-pre-wrap">{milestone.submissionNotes}</p>
        </div>
      )}

      {/* Revision Request Notes Block */}
      {milestone.revisionNotes && milestone.status === "revision_requested" && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger space-y-1">
          <p className="font-semibold text-[11px] uppercase tracking-wider">Client Revision Feedback:</p>
          <p className="whitespace-pre-wrap">{milestone.revisionNotes}</p>
        </div>
      )}

      {/* Milestone Deliverable Files Attached */}
      {milestoneDeliverables.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-border/60">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Attached Milestone Files ({milestoneDeliverables.length}):</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {milestoneDeliverables.map((f) => (
              <a
                key={f.id}
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-lg border border-border bg-base px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-hover transition-colors"
              >
                <span className="truncate max-w-[200px]">{f.filename}</span>
                <span className="text-[10px] text-subtle shrink-0">View / Download</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <SubmitWorkModal
        open={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        milestone={milestone}
        project={project}
        onSubmitWork={onSubmit}
      />
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
  const [searchParams] = useSearchParams()
  const validTabs: TabValue[] = ["overview", "applications", "proposals", "contract", "milestones", "files", "disputes"]
  const initialTab = (searchParams.get("tab") as TabValue | null)
  const [tab, setTab] = useState<TabValue>(
    initialTab && validTabs.includes(initialTab) ? initialTab : "overview"
  )

  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabValue | null
    if (tabParam && validTabs.includes(tabParam)) {
      setTab(tabParam)
    }
  }, [searchParams])

  const [project, setProject] = useState<ApiProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [actionState, setActionState] = useState("")
  const [actionError, setActionError] = useState("")

  const [deliverables, setDeliverables] = useState<ApiDeliverable[]>([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [filesError, setFilesError] = useState("")

  // Application system states
  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [applications, setApplications] = useState<ApiApplication[]>([])
  const [myApplication, setMyApplication] = useState<ApiApplication | null>(null)
  const [appsLoading, setAppsLoading] = useState(false)
  const [hiringId, setHiringId] = useState<string | null>(null)

  // Contract states
  const [contract, setContract] = useState<ApiContract | null>(null)
  const [contractLoading, setContractLoading] = useState(false)
  const [contractBusy, setContractBusy] = useState(false)
  const [contractError, setContractError] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [verificationModalOpen, setVerificationModalOpen] = useState(false)
  const [verificationActionName, setVerificationActionName] = useState("fund escrow")

  const formatDDMMYYYY = (dateInput?: string | Date | null): string => {
    if (!dateInput) return "____________________________________________"
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) return "____________________________________________"
    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  const copyToClipboard = (text: string, id: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const isClient = user?.id === project?.clientId
  const isFreelancer = user?.role === "freelancer"
  const isParty = user?.id === project?.clientId || user?.id === project?.freelancerId
  const escrowActive = Boolean(project?.escrowFunded)

  useEffect(() => {
    if (project?.contractId && token) {
      setContractLoading(true)
      getContract(project.contractId, token)
        .then(setContract)
        .catch(() => setContract(null))
        .finally(() => setContractLoading(false))
    }
  }, [project?.contractId, token])

  useEffect(() => {
    if (!id || !token) return
    let active = true

    async function init() {
      setLoading(true)
      setError(null)
      setNotFound(false)
      try {
        const data = await getProjectById(id!, token!)
        if (active) setProject(data)
      } catch (err) {
        if (active) {
          if (err instanceof ApiError && err.status === 404) setNotFound(true)
          else setError(err instanceof Error ? err.message : "Couldn't load project.")
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void init()
    return () => {
      active = false
    }
  }, [id, token])

  const handleGenerateContract = async () => {
    if (!token || !project || !project.freelancerId) return
    setContractBusy(true)
    setContractError("")
    try {
      const created = await generateContract(project.id, project.freelancerId, token)
      setContract(created)
      setProject((prev) => (prev ? { ...prev, contractId: created.id } : prev))
    } catch (err) {
      setContractError(err instanceof Error ? err.message : "Failed to generate contract.")
    } finally {
      setContractBusy(false)
    }
  }

  const handleSignContract = async () => {
    if (!token || !contract) return
    setContractBusy(true)
    setContractError("")
    try {
      const updated = await signContract(contract.id, token)
      setContract(updated)
    } catch (err) {
      setContractError(err instanceof Error ? err.message : "Failed to sign contract.")
    } finally {
      setContractBusy(false)
    }
  }

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

  // Deliverables & Reference Files states
  const [referenceFiles, setReferenceFiles] = useState<ApiReferenceFile[]>([])
  const [refFilesLoading, setRefFilesLoading] = useState(false)
  const [uploadingRefFile, setUploadingRefFile] = useState(false)
  const [selectedRefFile, setSelectedRefFile] = useState<File | null>(null)

  const loadDeliverables = useCallback(async () => {
    if (!id || !token) return
    setFilesLoading(true)
    setFilesError("")
    try {
      setDeliverables(await getProjectDeliverables(id, token))
    } catch (err) {
      setFilesError(err instanceof Error ? err.message : "Couldn't load deliverables.")
    } finally {
      setFilesLoading(false)
    }
  }, [id, token])

  const loadReferenceFiles = useCallback(async () => {
    if (!id || !token) return
    setRefFilesLoading(true)
    try {
      setReferenceFiles(await getProjectReferenceFiles(id, token))
    } catch {
      // ignore
    } finally {
      setRefFilesLoading(false)
    }
  }, [id, token])

  useEffect(() => {
    if (tab === "files") {
      void loadDeliverables()
      void loadReferenceFiles()
    }
  }, [tab, loadDeliverables, loadReferenceFiles])

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

  const uploadRefFile = async () => {
    if (!token || !selectedRefFile || !project) return
    setUploadingRefFile(true)
    try {
      await uploadProjectReferenceFile(project.id, selectedRefFile, token)
      setSelectedRefFile(null)
      const input = document.getElementById("reference-file") as HTMLInputElement | null
      if (input) input.value = ""
      await loadReferenceFiles()
    } catch (err) {
      setFilesError(err instanceof Error ? err.message : "Couldn't upload reference file.")
    } finally {
      setUploadingRefFile(false)
    }
  }

  const handleHire = async (applicationId: string) => {
    if (!token || !project) return
    setActionError("")
    setHiringId(applicationId)
    try {
      const app = (applications as ApiApplication[]).find((a) => a.id === applicationId)
      if (app?.freelancerId) {
        await assignFreelancer(project.id, app.freelancerId, token)
        await loadProject()
        await loadApplications()
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to hire freelancer.")
    } finally {
      setHiringId(null)
    }
  }

  const handleMilestoneSubmit = async (milestoneId: string, notes: string, files: File[] = []) => {
    if (!token || !project) return
    setActionError("")
    if (!user?.isEmailVerified) {
      setVerificationActionName("submit milestone deliverables")
      setVerificationModalOpen(true)
      const msg = "Email verification required. Please update and verify your email address in Settings before submitting deliverables."
      setActionError(msg)
      throw new ApiError(msg)
    }
    try {
      if (files && files.length > 0) {
        for (const file of files) {
          await uploadProjectDeliverable(project.id, file, milestoneId, token, notes)
        }
      }
      const updated = await submitMilestone(project.id, milestoneId, notes, token)
      setProject(updated)
      await loadDeliverables()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit milestone."
      setActionError(msg)
      throw new ApiError(msg)
    }
  }

  const handleMilestoneRevisionRequest = async (milestoneId: string, notes: string) => {
    if (!token || !project) return
    setActionError("")
    if (!user?.isEmailVerified) {
      setVerificationActionName("request milestone revisions")
      setVerificationModalOpen(true)
      setActionError("Email verification required. Please update and verify your email address in Settings before requesting revisions.")
      return
    }
    try {
      const updated = await requestMilestoneRevision(project.id, milestoneId, notes, token)
      setProject(updated)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to request revision.")
    }
  }

  const handleMilestoneApprove = async (milestoneId: string) => {
    if (!token || !project) return
    setActionError("")
    if (!user?.isEmailVerified) {
      setVerificationActionName("approve milestones")
      setVerificationModalOpen(true)
      setActionError("Email verification required. Please update and verify your email address in Settings before approving milestones.")
      return
    }
    try {
      const updated = await approveMilestone(project.id, milestoneId, token)
      setProject(updated)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to approve milestone.")
    }
  }

  const fund = async () => {
    if (!token || !project) return
    setActionError("")
    if (!user?.isEmailVerified) {
      setVerificationActionName("fund escrow")
      setVerificationModalOpen(true)
      setActionError("Email verification required. Please update and verify your email address in Settings before funding escrow.")
      return
    }
    setActionState("Funding escrow...")
    try {
      if (!user?.walletAddress) {
        throw new Error("Verify your client wallet first to fund escrow.")
      }
      if (!project.freelancerWalletAddress) {
        throw new Error("Assigned freelancer does not have a verified wallet address.")
      }
      const fundTxHash = await fundEscrow(
        project.id,
        project.freelancerWalletAddress as `0x${string}`,
        (project.milestones || []).map((m) => String(m.amount)),
        user.walletAddress,
        (stage) => setActionState(stage),
      )
      setActionState("Syncing escrow status with server...")
      const response = await depositEscrow(project.id, fundTxHash, token)
      setProject((prev) => (prev ? { ...prev, escrowFunded: response.project.escrowFunded, escrowTxnHash: fundTxHash } : prev))
      setActionState("Escrow funded successfully!")
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to fund escrow.")
    } finally {
      setTimeout(() => setActionState(""), 3000)
    }
  }

  const dispute = async () => {
    if (!token || !project) return
    setActionError("")
    if (!user?.isEmailVerified) {
      setVerificationActionName("raise a dispute")
      setVerificationModalOpen(true)
      setActionError("Email verification required. Please update and verify your email address in Settings before raising a dispute.")
      return
    }
    setActionState("Raising dispute...")
    try {
      if (user?.walletAddress) {
        await raiseEscrowDispute(project.id, "Dispute raised from project page", user.walletAddress)
      }
      await raiseDispute(project.id, "Dispute raised from project page", token)
      setProject((prev) => (prev ? { ...prev, escrowDisputed: true, status: "disputed" } : prev))
      setActionState("Dispute opened.")
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to raise dispute.")
    } finally {
      setTimeout(() => setActionState(""), 3000)
    }
  }

  const release = async (index: number) => {
    if (!token || !project) return
    setActionError("")
    setActionState("Releasing milestone...")
    try {
      if (!user?.walletAddress) {
        throw new Error("Verify your client wallet to release milestone escrow payments.")
      }
      const releaseTxHash = await releaseEscrowMilestone(project.id, index, user.walletAddress)
      setActionState("Syncing payment release with server...")
      const response = await releaseEscrowPayment(project.id, index, releaseTxHash, token)
      setProject((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          milestones: (response.project.milestones || []).map((m, i) => ({
            ...(prev.milestones[i] || m),
            paymentReleased: m.paymentReleased,
            status: m.status as any,
          })),
          escrowCompleted: response.project.escrowCompleted,
          status: (response.project.status as any) || prev.status,
        }
      })
      setActionState("Milestone released successfully!")
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to release milestone.")
    } finally {
      setTimeout(() => setActionState(""), 3000)
    }
  }

  if (loading) {
    return <LoadingState label="Loading project details..." />
  }

  if (notFound) {
    return (
      <ErrorState
        title="Project Not Found"
        description="The project you're looking for doesn't exist or has been removed."
      />
    )
  }

  if (error || !project) {
    return (
      <ErrorState
        title="Couldn't load project"
        description={error || "Project data unavailable."}
        onRetry={loadProject}
      />
    )
  }
  const milestonesList = project.milestones || []
  const completedCount = milestonesList.filter((m) => m && m.status === "completed").length
  const releasedCount = milestonesList.filter((m) => m && m.paymentReleased).length
  const releasedAmount = getReleasedAmount(project)
  const remainingAmount = getUnreleasedAmount(project)

  const tabItems: TabItem[] = [
    { label: "Overview", value: "overview" },
    ...(isClient ? [{ label: "Applications", value: "applications", count: applications.length }] : []),
    { label: "Contract", value: "contract" },
    { label: "Milestones", value: "milestones", count: milestonesList.length },
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
                {project.deadlineAt && (
                  <span className="flex items-center gap-1.5" title={`Target Deadline: ${formatDateTime(project.deadlineAt)}`}>
                    <FiClock className="h-4 w-4 text-subtle" />
                    Deadline: <strong className="font-semibold text-foreground">{formatDateTime(project.deadlineAt)}</strong>
                    <Badge tone={formatDeadlineCountdown(project.deadlineAt).isUrgent ? "warning" : "neutral"}>
                      {formatDeadlineCountdown(project.deadlineAt).text}
                    </Badge>
                  </span>
                )}
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
                        {completedCount} of {milestonesList.length} completed
                      </span>
                    </div>
                    <Progress
                      value={toPercent(completedCount, milestonesList.length)}
                      tone={completedCount === milestonesList.length ? "success" : "primary"}
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

            {tab === "contract" && (
              <div className="flex flex-col gap-4">
                {contractError && (
                  <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger font-medium">
                    {contractError}
                  </div>
                )}

                {contractLoading ? (
                  <div className="py-12 text-center text-xs text-muted">Loading contract agreement...</div>
                ) : contract ? (
                  <Card className="overflow-hidden border border-border shadow-sm">
                    {/* Top Legal Document Header Banner */}
                    <div className="border-b border-border bg-elevated/40 p-5 sm:p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <FiFileText className="h-4 w-4" />
                          </span>
                          <div>
                            <h3 className="font-bold text-foreground text-base sm:text-lg">
                              {contract.projectTitle || project.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-subtle font-mono mt-0.5">
                              <span>Ref ID:</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(`FAIR-CNT-${contract.id.slice(-8).toUpperCase()}`, contract.id)}
                                className="inline-flex items-center gap-1.5 rounded bg-surface hover:bg-surface-hover px-2 py-0.5 text-xs font-mono font-semibold text-foreground border border-border transition-colors cursor-pointer"
                                title="Click to copy Contract Reference ID"
                              >
                                <span>FAIR-CNT-{contract.id.slice(-8).toUpperCase()}</span>
                                {copiedId === contract.id ? (
                                  <FiCheck className="h-3.5 w-3.5 text-success shrink-0" />
                                ) : (
                                  <FiCopy className="h-3.5 w-3.5 text-subtle shrink-0" />
                                )}
                              </button>
                              <span>·</span>
                              <span>
                                Contract Date: {formatDate(contract.clientSignedAt || contract.freelancerSignedAt || contract.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge tone={contract.signedByClient && contract.signedByFreelancer ? "success" : "warning"} className="px-3 py-1 text-xs">
                          {contract.signedByClient && contract.signedByFreelancer ? "✓ BINDING LEGAL AGREEMENT" : "⏳ AWAITING SIGNATURES"}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="space-y-6 p-5 sm:p-6">
                      {/* Parties Metadata Grid */}
                      <div className="grid gap-4 sm:grid-cols-3">
                        {/* Client Metadata */}
                        <div className="rounded-xl border border-border bg-base p-4">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Client / Hirer</span>
                          <p className="font-bold text-foreground text-sm mt-1">{contract.clientName || "Client"}</p>
                          {contract.clientEmail && <p className="text-xs text-subtle truncate">{contract.clientEmail}</p>}
                          <div className="mt-3 flex items-center gap-1.5">
                            {contract.signedByClient ? (
                              <Badge tone="success" dot className="text-[11px]">
                                Signed {formatDate(contract.clientSignedAt || contract.createdAt)}
                              </Badge>
                            ) : (
                              <Badge tone="neutral" dot className="text-[11px]">
                                Pending Signature
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Freelancer Metadata */}
                        <div className="rounded-xl border border-border bg-base p-4">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Assigned Freelancer</span>
                          <p className="font-bold text-foreground text-sm mt-1">{contract.freelancerName || "Freelancer"}</p>
                          {contract.freelancerEmail && <p className="text-xs text-subtle truncate">{contract.freelancerEmail}</p>}
                          <div className="mt-3 flex items-center gap-1.5">
                            {contract.signedByFreelancer ? (
                              <Badge tone="success" dot className="text-[11px]">
                                Signed {formatDate(contract.freelancerSignedAt || contract.createdAt)}
                              </Badge>
                            ) : (
                              <Badge tone="neutral" dot className="text-[11px]">
                                Pending Signature
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Agreement Financial Details */}
                        <div className="rounded-xl border border-border bg-base p-4">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Agreed Budget</span>
                          <p className="font-bold text-primary text-sm mt-1">{formatAmount(contract.projectBudget || project.budget)}</p>
                          <p className="text-[11px] text-subtle mt-0.5">P2P Escrow Protected</p>
                          <div className="mt-3 flex items-center gap-1 text-[11px] text-muted">
                            <FiShield className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span>Smart Contract Authority</span>
                          </div>
                        </div>
                      </div>

                      {/* Legal Document Body with Embedded Preamble Header and Signatures */}
                      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-inner font-mono text-xs leading-relaxed text-foreground">
                        {/* Document Header Preamble */}
                        <div className="border-b border-border pb-4 mb-4 font-mono text-xs space-y-1">
                          <p className="font-bold text-primary text-sm uppercase tracking-wider text-center border-b border-border/60 pb-2 mb-3">
                            FAIRWORK FREELANCE SERVICES AGREEMENT
                          </p>
                          <div className="grid sm:grid-cols-2 gap-2 text-subtle text-[11px]">
                            <div><span className="font-bold text-foreground">Ref ID:</span> FAIR-CNT-{contract.id.slice(-8).toUpperCase()}</div>
                            <div><span className="font-bold text-foreground">Effective Date:</span> {formatDate(contract.clientSignedAt || contract.freelancerSignedAt || contract.createdAt)}</div>
                            <div><span className="font-bold text-foreground">Client Party:</span> {contract.clientName || "Client"} ({contract.clientEmail || "N/A"})</div>
                            <div><span className="font-bold text-foreground">Freelancer Party:</span> {contract.freelancerName || "Freelancer"} ({contract.freelancerEmail || "N/A"})</div>
                            <div><span className="font-bold text-foreground">Agreed Budget:</span> {formatAmount(contract.projectBudget || project.budget)}</div>
                            <div><span className="font-bold text-foreground">Escrow Security:</span> Smart Contract Escrow</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-b border-border pb-2 mb-4">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                            <FiFileText className="h-4 w-4 text-primary" />
                            TERMS &amp; CONDITIONS
                          </span>
                          <span className="text-[10px] text-subtle">Generated via Gemini AI</span>
                        </div>

                        {/* AI Generated Contract Text with Dynamic Signature Block */}
                        <div className="max-h-80 overflow-y-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/90 pr-2 border-b border-border pb-4 mb-4 space-y-4">
                          <div>
                            {contract.aiGeneratedText.replace(/\[Freelancer\/Contractor Representative\]/g, contract.freelancerName || "Contractor Representative")}
                          </div>

                          {/* Exact Signature Block inside Document Body */}
                          <div className="pt-4 border-t border-dashed border-border/80 space-y-4 font-mono text-xs">
                            <p className="font-semibold text-foreground">
                              IN WITNESS WHEREOF, the Parties hereto have executed this Agreement as of the Effective Date.
                            </p>

                            <div className="space-y-3">
                              <div className="space-y-1">
                                <p className="font-bold text-foreground">CLIENT:</p>
                                <p>
                                  Signature: <span className={contract.signedByClient ? "text-foreground font-bold" : "text-subtle"}>{contract.signedByClient ? (contract.clientName || "Client") : "________________________________________"}</span>
                                </p>
                                <p>
                                  Printed Name: <span className="font-semibold text-foreground">{contract.clientName || "Client"}</span>
                                </p>
                                <p>
                                  Date: <span className={contract.signedByClient ? "text-foreground font-semibold" : "text-subtle"}>{contract.signedByClient ? formatDDMMYYYY(contract.clientSignedAt || contract.createdAt) : "____________________________________________"}</span>
                                </p>
                              </div>

                              <div className="space-y-1 pt-2">
                                <p className="font-bold text-foreground">CONTRACTOR:</p>
                                <p>
                                  Signature: <span className={contract.signedByFreelancer ? "text-foreground font-bold" : "text-subtle"}>{contract.signedByFreelancer ? (contract.freelancerName || "Freelancer") : "________________________________________"}</span>
                                </p>
                                <p>
                                  Printed Name: <span className="font-semibold text-foreground">{contract.freelancerName || "Freelancer"}</span>
                                </p>
                                <p>
                                  Date: <span className={contract.signedByFreelancer ? "text-foreground font-semibold" : "text-subtle"}>{contract.signedByFreelancer ? formatDDMMYYYY(contract.freelancerSignedAt || contract.createdAt) : "____________________________________________"}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Official Electronic Signatures Audit Summary Inside Document */}
                        <div className="space-y-3 font-mono text-xs pt-1">
                          <p className="font-bold text-foreground text-[11px] uppercase tracking-wider">
                            OFFICIAL ELECTRONIC SIGNATURES
                          </p>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="rounded-xl border border-border bg-base p-3 space-y-1">
                              <p className="font-bold text-foreground text-[10px] uppercase tracking-wider">CLIENT SIGNATURE</p>
                              <p className="font-serif italic font-bold text-primary text-sm">
                                {contract.signedByClient ? `Signed by ${contract.clientName || "Client"}` : "Unsigned"}
                              </p>
                              <p className="text-[11px] text-subtle">
                                Status: <span className={contract.signedByClient ? "text-success font-bold" : "text-muted"}>{contract.signedByClient ? "SIGNED ✓" : "PENDING"}</span>
                              </p>
                              <p className="text-[11px] text-subtle">
                                Date: {contract.signedByClient ? formatDate(contract.clientSignedAt || contract.createdAt) : "Pending Signature"}
                              </p>
                            </div>

                            <div className="rounded-xl border border-border bg-base p-3 space-y-1">
                              <p className="font-bold text-foreground text-[10px] uppercase tracking-wider">FREELANCER SIGNATURE</p>
                              <p className="font-serif italic font-bold text-primary text-sm">
                                {contract.signedByFreelancer ? `Signed by ${contract.freelancerName || "Freelancer"}` : "Unsigned"}
                              </p>
                              <p className="text-[11px] text-subtle">
                                Status: <span className={contract.signedByFreelancer ? "text-success font-bold" : "text-muted"}>{contract.signedByFreelancer ? "SIGNED ✓" : "PENDING"}</span>
                              </p>
                              <p className="text-[11px] text-subtle">
                                Date: {contract.signedByFreelancer ? formatDate(contract.freelancerSignedAt || contract.createdAt) : "Pending Signature"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Digital Signature Panel */}
                      <div className="rounded-xl border border-border bg-elevated/30 p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="text-xs">
                            {contract.signedByClient && contract.signedByFreelancer ? (
                              <p className="font-semibold text-success flex items-center gap-1.5">
                                <FiCheckCircle className="h-4 w-4" />
                                Fully Executed Agreement — Both Client and Freelancer have digitally signed.
                              </p>
                            ) : (isClient && contract.signedByClient) || (isFreelancer && contract.signedByFreelancer) ? (
                              <p className="font-semibold text-foreground flex items-center gap-1.5">
                                <FiUserCheck className="h-4 w-4 text-primary" />
                                You have digitally signed this contract. Awaiting remaining party signature.
                              </p>
                            ) : (isClient && !contract.signedByClient) || (isFreelancer && !contract.signedByFreelancer) ? (
                              <p className="text-muted font-medium">
                                By clicking <strong className="text-foreground">Sign Contract</strong>, you electronically execute and accept this agreement under FairWork Escrow terms.
                              </p>
                            ) : (
                              <p className="text-muted">Awaiting contract signatures from participating parties.</p>
                            )}
                          </div>

                          {((isClient && !contract.signedByClient) || (isFreelancer && !contract.signedByFreelancer)) && (
                            <Button
                              size="md"
                              loading={contractBusy}
                              leftIcon={<FiCheckCircle className="h-4 w-4" />}
                              onClick={handleSignContract}
                              className="shrink-0"
                            >
                              Sign Contract ({isClient ? "as Client" : "as Freelancer"})
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : isClient && project.freelancerId ? (
                  <Card>
                    <CardContent className="flex items-center justify-between p-6">
                      <div>
                        <h4 className="font-semibold text-foreground">Generate Legal Agreement</h4>
                        <p className="text-xs text-muted mt-1">A freelancer has been hired for this project. Generate the AI legal contract now.</p>
                      </div>
                      <Button size="sm" loading={contractBusy} onClick={handleGenerateContract}>
                        Generate Contract
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12 text-center">
                    <FiFileText className="h-8 w-8 text-subtle mb-3" />
                    <p className="text-sm font-semibold text-foreground">No Contract Generated Yet</p>
                    <p className="text-xs text-muted max-w-sm mt-1">
                      {isClient
                        ? "Hire a freelancer from proposals to generate a formal agreement."
                        : "The client will generate the formal legal contract agreement once hiring is complete."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {tab === "milestones" && (
              <div className="flex flex-col gap-4">
                {(!project.milestones || project.milestones.length === 0) ? (
                  <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">No milestones defined for this project.</p>
                ) : (
                  project.milestones.map((milestone, index) => (
                    <MilestoneRow
                      key={milestone.id}
                      milestone={milestone}
                      project={project}
                      isClient={isClient}
                      isFreelancer={Boolean(isFreelancer && project.freelancerId === user?.id)}
                      canRelease={Boolean(isClient && escrowActive && !milestone.paymentReleased)}
                      releasing={Boolean(actionState)}
                      deliverables={deliverables || []}
                      onSubmit={handleMilestoneSubmit}
                      onRequestRevision={handleMilestoneRevisionRequest}
                      onApprove={handleMilestoneApprove}
                      onRelease={() => release(index)}
                    />
                  ))
                )}
              </div>
            )}

            {tab === "files" && (
              <div className="flex flex-col gap-8">
                {/* 1. FREELANCER WORK DELIVERABLES SECTION */}
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Freelancer Work Deliverables</h3>
                    <p className="text-xs text-muted">Completed milestone deliverables, source code, final assets, and submission notes submitted by the freelancer.</p>
                  </div>

                  {isClient && deliverables.length > 0 && (
                    <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-xs text-foreground flex items-center gap-2">
                      <span>💡 Review the freelancer's submitted deliverables below before approving milestones and releasing payments.</span>
                    </div>
                  )}

                  {/* Freelancer Guidance Banner: Uploads are consolidated into Milestone Submit Work flow */}
                  {isFreelancer && project.freelancerId === user?.id && (
                    <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-xs text-foreground flex items-center justify-between gap-3">
                      <span>💡 Submit your work and attach milestone deliverables directly by clicking <strong>Submit Work</strong> on the corresponding milestone under the <strong>Milestones</strong> tab.</span>
                      <Button size="sm" variant="secondary" onClick={() => setTab("milestones")}>
                        Go to Milestones
                      </Button>
                    </div>
                  )}

                  {filesError && <div role="alert" className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">{filesError}</div>}
                  {filesLoading ? (
                    <div className="rounded-xl border border-border bg-surface px-4 py-10 text-center text-sm text-muted">Loading deliverables...</div>
                  ) : deliverables.length === 0 && !filesError ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
                      <FiPaperclip className="mb-3 h-6 w-6 text-subtle" />
                      <p className="text-sm font-medium text-foreground">No work deliverables submitted yet</p>
                      <p className="mt-1 max-w-xs text-xs text-muted">Completed deliverables submitted by the freelancer will appear here for client review.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {deliverables.map((file) => {
                        const milestone = project.milestones.find((item) => item.id === file.milestoneId)
                        return (
                          <Card key={file.id}>
                            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex min-w-0 items-start gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-elevated text-primary">
                                  <FiFileText className="h-4 w-4" />
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-foreground">{file.filename}</p>
                                  <p className="mt-0.5 text-xs text-muted">
                                    {formatFileSize(file.size)}
                                    {file.mimeType ? ` · ${file.mimeType}` : ""} · Submitted {formatDate(file.uploadedAt)}
                                    {file.uploadedByName ? ` by ${file.uploadedByName} (Freelancer)` : ""}
                                  </p>
                                  {milestone && <Badge className="mt-2" tone="neutral">Milestone {milestone.order}: {milestone.title}</Badge>}
                                  {file.submissionNotes && (
                                    <div className="mt-2 rounded-lg border border-border/80 bg-base/80 p-2.5 text-xs text-foreground/90">
                                      <span className="font-bold text-muted text-[10px] uppercase block mb-0.5">Submission Notes:</span>
                                      <p className="whitespace-pre-wrap">{file.submissionNotes}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-border-strong px-3 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover"
                              >
                                View / Download
                              </a>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* 2. CLIENT PROJECT REFERENCE FILES SECTION (SEPARATED) */}
                <div className="flex flex-col gap-4 pt-6 border-t border-border">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Client Project Requirements &amp; Reference Files</h3>
                    <p className="text-xs text-muted">Project specification documents, brand assets, sample files, and requirement references provided by the client.</p>
                  </div>

                  {/* Client Upload Reference Files Box */}
                  {isClient && (
                    <Card>
                      <CardContent className="flex flex-col gap-3 p-5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Upload Reference Specification</h4>
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          <input
                            id="reference-file"
                            type="file"
                            className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-elevated file:px-3 file:py-2 file:text-xs file:font-medium file:text-foreground hover:file:bg-surface-hover"
                            onChange={(event) => setSelectedRefFile(event.target.files?.[0] ?? null)}
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={uploadingRefFile}
                            disabled={!selectedRefFile}
                            onClick={uploadRefFile}
                            className="shrink-0"
                          >
                            Upload Reference File
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {refFilesLoading ? (
                    <div className="rounded-xl border border-border bg-surface px-4 py-6 text-center text-xs text-muted">Loading reference files...</div>
                  ) : referenceFiles.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted">
                      No client reference files uploaded for this project yet.
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {referenceFiles.map((rf) => (
                        <div key={rf.id} className="flex items-center justify-between rounded-xl border border-border bg-surface p-3.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <FiPaperclip className="h-4 w-4 text-subtle shrink-0" />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-foreground">{rf.filename}</p>
                              <p className="text-[11px] text-subtle">{formatFileSize(rf.size)} · {formatDate(rf.uploadedAt)}</p>
                            </div>
                          </div>
                          <a
                            href={rf.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium text-primary hover:underline shrink-0"
                          >
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                label="Paid / Released"
                value={formatAmount(releasedAmount)}
                icon={FiUnlock}
                hint={`${releasedCount} of ${milestonesList.length} milestones paid`}
              />
              <MetricCard label="Unreleased Milestones" value={formatAmount(remainingAmount)} icon={FiLock} />
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
          void loadApplications()
          void loadProject()
        }}
      />

      <VerificationRequiredModal
        open={verificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
        actionName={verificationActionName}
      />
    </div>
  )
}
