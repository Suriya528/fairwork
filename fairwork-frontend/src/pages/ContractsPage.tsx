import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  FiCheck,
  FiCheckCircle,
  FiCopy,
  FiFileText,
  FiShield,
  FiUserCheck,
  FiClock,
  FiAlertCircle,
  FiChevronDown,
  FiChevronUp,
  FiSearch,
  FiExternalLink,
  FiX,
  FiLayers,
} from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { EmptyState } from "@/components/feedback/EmptyState"
import { PageHeader } from "@/components/common/PageHeader"
import { formatCurrency, formatDate } from "@/lib/format"
import { useAuth } from "@/context/AuthContext"
import { getMyProjects, type ApiProject } from "@/services/projectsApi"
import {
  generateContract,
  getContract,
  signContract,
  type ApiContract,
} from "@/services/contractsApi"
import { connectChat } from "@/services/chatApi"

type ContractFilter = "all" | "needs_action" | "pending_partner" | "executed"

export function ContractsPage() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [contracts, setContracts] = useState<ApiContract[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<ContractFilter>("all")
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/admin/contracts", { replace: true })
    }
  }, [user?.role, navigate])

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

  const isClient = user?.role === "client"

  const load = async () => {
    if (!token || user?.role === "admin") return
    try {
      const p = await getMyProjects(token)
      setProjects(p)
      const c = await Promise.all(
        p.filter((x) => x.contractId).map((x) => getContract(x.contractId!, token).catch(() => null)),
      )
      const validContracts = c.filter((contract): contract is ApiContract => contract !== null)
      setContracts(validContracts)
      setError(c.some((contract) => contract === null) ? "Some contract details could not be loaded." : "")

      // Default expand behavior:
      // If only 1 contract or contracts needing action, auto-expand
      setExpandedMap((prev) => {
        const next = { ...prev }
        validContracts.forEach((contract) => {
          if (next[contract.id] === undefined) {
            const currentUserId = user?.id || ""
            const isClientParty = currentUserId === contract.clientId
            const isFreelancerParty = currentUserId === contract.freelancerId
            const canSign =
              (isClientParty && !contract.signedByClient) ||
              (isFreelancerParty && !contract.signedByFreelancer)

            // Auto-expand if only 1 contract in total or if user needs to sign
            next[contract.id] = validContracts.length === 1 || canSign
          }
        })
        return next
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load contracts.")
    }
  }

  useEffect(() => {
    void load()

    if (!token || user?.role === "admin") return

    // Real-time synchronization for contract signatures across browsers
    const socket = connectChat(token)
    const handleUpdate = () => {
      void load()
    }

    socket.on("project_updated", handleUpdate)
    socket.on("notification", handleUpdate)

    // Visibility-aware background polling fallback
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void load()
      }
    }, 4000)

    return () => {
      socket.off("project_updated", handleUpdate)
      socket.off("notification", handleUpdate)
      clearInterval(interval)
    }
  }, [token, user?.role])

  const toggleExpand = (id: string) => {
    setExpandedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const toggleAll = (expand: boolean) => {
    const next: Record<string, boolean> = {}
    contracts.forEach((c) => {
      next[c.id] = expand
    })
    setExpandedMap(next)
  }

  const create = async (p: ApiProject) => {
    if (!token || !p.freelancerId) return
    setBusy(p.id)
    try {
      const newContract = await generateContract(p.id, p.freelancerId, token)
      setContracts((prev) => [newContract, ...prev.filter((c) => c.id !== newContract.id)])
      setExpandedMap((prev) => ({ ...prev, [newContract.id]: true }))
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to generate contract.")
    } finally {
      setBusy(null)
    }
  }

  const sign = async (id: string) => {
    if (!token) return
    setBusy(id)
    try {
      const updated = await signContract(id, token)
      // Instant state update upon signing
      setContracts((prev) => prev.map((c) => (c.id === id ? updated : c)))
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign contract.")
    } finally {
      setBusy(null)
    }
  }

  const currentUserId = user?.id || ""

  // Metrics Calculation
  const metrics = useMemo(() => {
    let actionRequired = 0
    let pendingPartner = 0
    let fullyExecuted = 0
    let totalEscrow = 0

    contracts.forEach((c) => {
      const isClientParty = currentUserId === c.clientId
      const isFreelancerParty = currentUserId === c.freelancerId
      const fullySigned = c.signedByClient && c.signedByFreelancer
      const canSign =
        (isClientParty && !c.signedByClient) || (isFreelancerParty && !c.signedByFreelancer)
      const userHasSigned = isClientParty
        ? c.signedByClient
        : isFreelancerParty
          ? c.signedByFreelancer
          : false

      if (fullySigned) {
        fullyExecuted++
      } else if (canSign) {
        actionRequired++
      } else if (userHasSigned && !fullySigned) {
        pendingPartner++
      }

      const projectMatch = projects.find((p) => p.id === c.projectId)
      totalEscrow += c.projectBudget || projectMatch?.budget || 0
    })

    return {
      total: contracts.length,
      actionRequired,
      pendingPartner,
      fullyExecuted,
      totalEscrow,
    }
  }, [contracts, projects, currentUserId])

  // Filtered Contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const isClientParty = currentUserId === c.clientId
      const isFreelancerParty = currentUserId === c.freelancerId
      const fullySigned = c.signedByClient && c.signedByFreelancer
      const canSign =
        (isClientParty && !c.signedByClient) || (isFreelancerParty && !c.signedByFreelancer)
      const userHasSigned = isClientParty
        ? c.signedByClient
        : isFreelancerParty
          ? c.signedByFreelancer
          : false

      // Filter by status tab
      if (activeFilter === "needs_action" && !canSign) return false
      if (activeFilter === "pending_partner" && (!userHasSigned || fullySigned)) return false
      if (activeFilter === "executed" && !fullySigned) return false

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const projectMatch = projects.find((p) => p.id === c.projectId)
        const displayTitle = (c.projectTitle || projectMatch?.title || "").toLowerCase()
        const refCode = `fair-cnt-${c.id.slice(-8)}`.toLowerCase()
        const client = (c.clientName || "").toLowerCase()
        const clientEmail = (c.clientEmail || "").toLowerCase()
        const freelancer = (c.freelancerName || "").toLowerCase()
        const freelancerEmail = (c.freelancerEmail || "").toLowerCase()

        const match =
          displayTitle.includes(q) ||
          refCode.includes(q) ||
          client.includes(q) ||
          clientEmail.includes(q) ||
          freelancer.includes(q) ||
          freelancerEmail.includes(q)

        if (!match) return false
      }

      return true
    })
  }, [contracts, projects, activeFilter, searchQuery, currentUserId])

  const allExpanded =
    filteredContracts.length > 0 && filteredContracts.every((c) => expandedMap[c.id])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        {/* Page Header */}
        <PageHeader
          title="Formal Legal Contracts"
          description={
            isClient
              ? "Generate, inspect, and electronically execute smart-contract backed freelance agreements."
              : "Review, inspect, and electronically sign formal client project agreements."
          }
        />

        {error && (
          <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger font-medium flex items-center justify-between">
            <span>{error}</span>
            <Button size="sm" variant="ghost" onClick={() => setError("")}>
              Dismiss
            </Button>
          </div>
        )}

        {/* Top Metric / KPI Summary Cards */}
        {contracts.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Total Contracts */}
            <div
              onClick={() => setActiveFilter("all")}
              className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                activeFilter === "all"
                  ? "border-primary bg-primary/5 shadow-xs"
                  : "border-border bg-card hover:border-border/80 hover:bg-elevated/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted">All Contracts</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FiFileText className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{metrics.total}</p>
              <p className="mt-0.5 text-[11px] text-subtle font-mono">
                {formatCurrency(metrics.totalEscrow)} Escrow Value
              </p>
            </div>

            {/* Action Required */}
            <div
              onClick={() => setActiveFilter("needs_action")}
              className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                activeFilter === "needs_action"
                  ? "border-warning bg-warning/10 shadow-xs"
                  : metrics.actionRequired > 0
                    ? "border-warning/50 bg-warning/5 hover:border-warning"
                    : "border-border bg-card hover:border-border/80 hover:bg-elevated/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-warning-muted flex items-center gap-1.5">
                  Needs Your Signature
                  {metrics.actionRequired > 0 && (
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-warning"></span>
                    </span>
                  )}
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/15 text-warning">
                  <FiAlertCircle className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-warning">{metrics.actionRequired}</p>
              <p className="mt-0.5 text-[11px] text-subtle">
                {metrics.actionRequired > 0 ? "Immediate signature needed" : "All caught up"}
              </p>
            </div>

            {/* Pending Partner */}
            <div
              onClick={() => setActiveFilter("pending_partner")}
              className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                activeFilter === "pending_partner"
                  ? "border-info bg-info/10 shadow-xs"
                  : "border-border bg-card hover:border-border/80 hover:bg-elevated/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted">Awaiting Partner</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-info/15 text-info">
                  <FiClock className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{metrics.pendingPartner}</p>
              <p className="mt-0.5 text-[11px] text-subtle">Waiting on counterparty</p>
            </div>

            {/* Fully Executed */}
            <div
              onClick={() => setActiveFilter("executed")}
              className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                activeFilter === "executed"
                  ? "border-success bg-success/10 shadow-xs"
                  : "border-border bg-card hover:border-border/80 hover:bg-elevated/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted">Fully Executed</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/15 text-success">
                  <FiCheckCircle className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-success">{metrics.fullyExecuted}</p>
              <p className="mt-0.5 text-[11px] text-subtle">Legally binding agreements</p>
            </div>
          </div>
        )}

        {/* Search, Filter Tabs & Batch Controls */}
        {contracts.length > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeFilter === "all"
                      ? "bg-primary text-white shadow-xs"
                      : "bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
                  }`}
                >
                  All ({metrics.total})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("needs_action")}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeFilter === "needs_action"
                      ? "bg-warning text-black shadow-xs font-bold"
                      : metrics.actionRequired > 0
                        ? "bg-warning/15 text-warning hover:bg-warning/25"
                        : "bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
                  }`}
                >
                  <span>⚡ Needs Signature</span>
                  {metrics.actionRequired > 0 && (
                    <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px] font-bold">
                      {metrics.actionRequired}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("pending_partner")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeFilter === "pending_partner"
                      ? "bg-primary text-white shadow-xs"
                      : "bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
                  }`}
                >
                  Awaiting Partner ({metrics.pendingPartner})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("executed")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeFilter === "executed"
                      ? "bg-success text-white shadow-xs font-bold"
                      : "bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
                  }`}
                >
                  Fully Executed ({metrics.fullyExecuted})
                </button>
              </div>

              {/* Expand / Collapse Toggle All */}
              <button
                type="button"
                onClick={() => toggleAll(!allExpanded)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-subtle hover:text-foreground transition-colors self-end sm:self-center"
              >
                <FiLayers className="h-3.5 w-3.5" />
                <span>{allExpanded ? "Collapse All Details" : "Expand All Details"}</span>
              </button>
            </div>

            {/* Live Search Bar */}
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contracts by project name, Ref ID, client, or freelancer..."
                className="w-full rounded-xl border border-border bg-base pl-10 pr-10 py-2 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground p-1"
                >
                  <FiX className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Contract List */}
        {filteredContracts.map((c) => {
          const fullySigned = c.signedByClient && c.signedByFreelancer
          const isClientParty = currentUserId === c.clientId
          const isFreelancerParty = currentUserId === c.freelancerId

          const userHasSigned = isClientParty
            ? c.signedByClient
            : isFreelancerParty
              ? c.signedByFreelancer
              : false
          const canSign =
            (isClientParty && !c.signedByClient) || (isFreelancerParty && !c.signedByFreelancer)

          const projectMatch = projects.find((p) => p.id === c.projectId)
          const displayTitle = c.projectTitle || projectMatch?.title || "Freelance Project Agreement"
          const displayBudget = c.projectBudget || projectMatch?.budget || 0
          const displayCategory = projectMatch?.category || "Decentralized Freelance"
          const isExpanded = Boolean(expandedMap[c.id])

          return (
            <Card
              key={c.id}
              className={`overflow-hidden border transition-all duration-200 shadow-sm ${
                canSign
                  ? "border-warning/70 ring-1 ring-warning/30 bg-gradient-to-b from-warning/[0.03] to-transparent"
                  : fullySigned
                    ? "border-success/40 bg-card"
                    : "border-border bg-card"
              }`}
            >
              {/* Prominent Project & Contract Identification Banner */}
              <div
                className={`border-b p-5 sm:p-6 transition-colors ${
                  canSign
                    ? "border-warning/30 bg-warning/10"
                    : fullySigned
                      ? "border-success/20 bg-success/5"
                      : "border-border bg-elevated/40"
                }`}
              >
                <div className="flex flex-col gap-4">
                  {/* Top Row: Visual Project Avatar, Prominent Title & Status Badge */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-xs ${
                          fullySigned
                            ? "border-success/40 bg-success/15 text-success"
                            : canSign
                              ? "border-warning/50 bg-warning/20 text-warning"
                              : "border-primary/30 bg-primary/10 text-primary"
                        }`}
                      >
                        <FiFileText className="h-5 w-5" />
                      </div>
                      <div>
                        {/* Prominent Project Title Link */}
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            onClick={() => navigate(`/projects/${c.projectId}`)}
                            className="font-bold text-foreground text-base sm:text-lg hover:text-primary transition-colors cursor-pointer"
                            title="Click to view Project Workspace"
                          >
                            {displayTitle}
                          </h3>
                          <button
                            type="button"
                            onClick={() => navigate(`/projects/${c.projectId}`)}
                            className="inline-flex items-center gap-1 rounded-md bg-surface hover:bg-surface-hover px-2 py-0.5 text-[11px] font-medium text-primary border border-border/80 transition-colors cursor-pointer"
                          >
                            <span>Workspace</span>
                            <FiExternalLink className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Project Identity & Contract Reference Metadata */}
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-subtle font-mono">
                          <span className="font-semibold text-foreground">Ref ID:</span>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(`FAIR-CNT-${c.id.slice(-8).toUpperCase()}`, c.id)
                            }
                            className="inline-flex items-center gap-1.5 rounded bg-surface hover:bg-surface-hover px-2 py-0.5 text-xs font-mono font-semibold text-foreground border border-border transition-colors cursor-pointer"
                            title="Click to copy Contract Reference ID"
                          >
                            <span>FAIR-CNT-{c.id.slice(-8).toUpperCase()}</span>
                            {copiedId === c.id ? (
                              <FiCheck className="h-3.5 w-3.5 text-success shrink-0" />
                            ) : (
                              <FiCopy className="h-3.5 w-3.5 text-subtle shrink-0" />
                            )}
                          </button>
                          <span>·</span>
                          <span className="font-sans font-medium text-muted">{displayCategory}</span>
                          <span>·</span>
                          <span className="font-sans">
                            Contract Date:{" "}
                            {formatDate(c.clientSignedAt || c.freelancerSignedAt || c.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Prominent Status Pill */}
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        tone={fullySigned ? "success" : canSign ? "warning" : "neutral"}
                        className={`px-3 py-1 text-xs font-bold ${
                          canSign ? "animate-pulse ring-1 ring-warning/50" : ""
                        }`}
                      >
                        {fullySigned
                          ? "✓ BINDING LEGAL AGREEMENT"
                          : canSign
                            ? "⚡ ACTION REQUIRED: SIGN CONTRACT"
                            : "⏳ AWAITING SIGNATURES"}
                      </Badge>
                      <span className="text-xs font-bold text-primary font-mono">
                        {formatCurrency(displayBudget)} USDC
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <CardContent className="space-y-6 p-5 sm:p-6">
                {/* Visual Counterparty & Escrow Metadata Cards (3 Distinct Columns) */}
                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Client Party Card */}
                  <div
                    className={`rounded-xl border p-4 transition-colors ${
                      isClientParty
                        ? "border-primary/40 bg-primary/[0.03]"
                        : "border-border bg-base"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                        Client / Hirer
                      </span>
                      {isClientParty && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                          You
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-foreground text-sm mt-1">{c.clientName || "Client"}</p>
                    {c.clientEmail && <p className="text-xs text-subtle truncate">{c.clientEmail}</p>}
                    <div className="mt-3 flex items-center gap-1.5">
                      {c.signedByClient ? (
                        <Badge tone="success" dot className="text-[11px]">
                          Signed {formatDate(c.clientSignedAt || c.createdAt)}
                        </Badge>
                      ) : (
                        <Badge tone="neutral" dot className="text-[11px]">
                          Pending Signature
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Freelancer Party Card */}
                  <div
                    className={`rounded-xl border p-4 transition-colors ${
                      isFreelancerParty
                        ? "border-primary/40 bg-primary/[0.03]"
                        : "border-border bg-base"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                        Assigned Freelancer
                      </span>
                      {isFreelancerParty && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                          You
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-foreground text-sm mt-1">
                      {c.freelancerName || "Freelancer"}
                    </p>
                    {c.freelancerEmail && (
                      <p className="text-xs text-subtle truncate">{c.freelancerEmail}</p>
                    )}
                    <div className="mt-3 flex items-center gap-1.5">
                      {c.signedByFreelancer ? (
                        <Badge tone="success" dot className="text-[11px]">
                          Signed {formatDate(c.freelancerSignedAt || c.createdAt)}
                        </Badge>
                      ) : (
                        <Badge tone="neutral" dot className="text-[11px]">
                          Pending Signature
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Financial & Escrow Safeguard Card */}
                  <div className="rounded-xl border border-border bg-base p-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                      Agreed Budget
                    </span>
                    <p className="font-bold text-primary text-base mt-1">
                      {formatCurrency(displayBudget)}
                    </p>
                    <p className="text-[11px] text-subtle mt-0.5">P2P Escrow Protected</p>
                    <div className="mt-3 flex items-center gap-1 text-[11px] text-muted">
                      <FiShield className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>Smart Contract Authority</span>
                    </div>
                  </div>
                </div>

                {/* Signature Stepper / Progress Bar */}
                <div className="rounded-xl border border-border/80 bg-surface/50 p-3 sm:p-4">
                  <div className="flex items-center justify-between text-[11px] font-medium text-subtle mb-2">
                    <span className="font-semibold text-foreground">Signature Execution Workflow</span>
                    <span>
                      {fullySigned
                        ? "100% Completed"
                        : c.signedByClient || c.signedByFreelancer
                          ? "50% Completed"
                          : "Draft Stage"}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px] sm:text-xs">
                    <div className="rounded-lg border border-success/40 bg-success/10 py-1.5 font-semibold text-success">
                      ✓ Draft Ready
                    </div>
                    <div
                      className={`rounded-lg border py-1.5 font-semibold transition-colors ${
                        c.signedByClient
                          ? "border-success/40 bg-success/10 text-success"
                          : "border-border bg-base text-subtle"
                      }`}
                    >
                      {c.signedByClient ? "✓ Client Signed" : "Client Signature"}
                    </div>
                    <div
                      className={`rounded-lg border py-1.5 font-semibold transition-colors ${
                        c.signedByFreelancer
                          ? "border-success/40 bg-success/10 text-success"
                          : "border-border bg-base text-subtle"
                      }`}
                    >
                      {c.signedByFreelancer ? "✓ Freelancer Signed" : "Freelancer Signature"}
                    </div>
                    <div
                      className={`rounded-lg border py-1.5 font-semibold transition-colors ${
                        fullySigned
                          ? "border-success bg-success text-white shadow-xs"
                          : "border-border bg-base text-subtle"
                      }`}
                    >
                      {fullySigned ? "✓ Legally Binding" : "Binding Agreement"}
                    </div>
                  </div>
                </div>

                {/* Digital Signature & Fast-Action Panel */}
                <div
                  className={`rounded-xl border p-4 transition-all ${
                    canSign
                      ? "border-warning/50 bg-warning/10"
                      : "border-border bg-elevated/30"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-xs">
                      {fullySigned ? (
                        <p className="font-semibold text-success flex items-center gap-1.5">
                          <FiCheckCircle className="h-4 w-4 shrink-0" />
                          Fully Executed Agreement — Both Client and Freelancer have digitally signed.
                        </p>
                      ) : userHasSigned ? (
                        <p className="font-semibold text-foreground flex items-center gap-1.5">
                          <FiUserCheck className="h-4 w-4 text-primary shrink-0" />
                          You have digitally signed this contract. Awaiting remaining party signature.
                        </p>
                      ) : canSign ? (
                        <p className="text-muted font-medium">
                          By clicking <strong className="text-foreground">Sign Contract</strong>, you
                          electronically execute and accept this agreement under FairWork Escrow terms.
                        </p>
                      ) : (
                        <p className="text-muted">
                          Awaiting contract signatures from participating parties.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {canSign && (
                        <Button
                          size="md"
                          loading={busy === c.id}
                          leftIcon={<FiCheckCircle className="h-4 w-4" />}
                          onClick={() => sign(c.id)}
                          className="bg-primary hover:bg-primary-hover font-bold"
                        >
                          Sign Contract ({isClientParty ? "as Client" : "as Freelancer"})
                        </Button>
                      )}

                      {userHasSigned && !fullySigned && (
                        <Badge tone="success" className="px-3 py-1.5 text-xs font-bold">
                          Your Signature Recorded ✓
                        </Badge>
                      )}

                      {/* Expand / Collapse Full Terms Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpand(c.id)}
                        className="gap-1.5 text-xs"
                      >
                        <span>{isExpanded ? "Hide Full Agreement" : "View Full Terms & Signatures"}</span>
                        {isExpanded ? (
                          <FiChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <FiChevronDown className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Collapsible Legal Document Body (Expanded on Demand or for Actionable Contracts) */}
                {isExpanded && (
                  <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-inner font-mono text-xs leading-relaxed text-foreground animate-fadeIn">
                    {/* Document Header Preamble */}
                    <div className="border-b border-border pb-4 mb-4 font-mono text-xs space-y-1">
                      <p className="font-bold text-primary text-sm uppercase tracking-wider text-center border-b border-border/60 pb-2 mb-3">
                        FAIRWORK FREELANCE SERVICES AGREEMENT
                      </p>
                      <div className="grid sm:grid-cols-2 gap-2 text-subtle text-[11px]">
                        <div>
                          <span className="font-bold text-foreground">Ref ID:</span> FAIR-CNT-
                          {c.id.slice(-8).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-foreground">Effective Date:</span>{" "}
                          {formatDate(c.clientSignedAt || c.freelancerSignedAt || c.createdAt)}
                        </div>
                        <div>
                          <span className="font-bold text-foreground">Client Party:</span>{" "}
                          {c.clientName || "Client"} ({c.clientEmail || "N/A"})
                        </div>
                        <div>
                          <span className="font-bold text-foreground">Freelancer Party:</span>{" "}
                          {c.freelancerName || "Freelancer"} ({c.freelancerEmail || "N/A"})
                        </div>
                        <div>
                          <span className="font-bold text-foreground">Agreed Budget:</span>{" "}
                          {formatCurrency(displayBudget)}
                        </div>
                        <div>
                          <span className="font-bold text-foreground">Escrow Security:</span> Smart
                          Contract Escrow
                        </div>
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
                        {c.aiGeneratedText.replace(
                          /\[Freelancer\/Contractor Representative\]/g,
                          c.freelancerName || "Contractor Representative",
                        )}
                      </div>

                      {/* Exact Signature Block inside Document Body */}
                      <div className="pt-4 border-t border-dashed border-border/80 space-y-4 font-mono text-xs">
                        <p className="font-semibold text-foreground">
                          IN WITNESS WHEREOF, the Parties hereto have executed this Agreement as of
                          the Effective Date.
                        </p>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <p className="font-bold text-foreground">CLIENT:</p>
                            <p>
                              Signature:{" "}
                              <span
                                className={
                                  c.signedByClient ? "text-foreground font-bold" : "text-subtle"
                                }
                              >
                                {c.signedByClient
                                  ? c.clientName || "Client"
                                  : "________________________________________"}
                              </span>
                            </p>
                            <p>
                              Printed Name:{" "}
                              <span className="font-semibold text-foreground">
                                {c.clientName || "Client"}
                              </span>
                            </p>
                            <p>
                              Date:{" "}
                              <span
                                className={
                                  c.signedByClient
                                    ? "text-foreground font-semibold"
                                    : "text-subtle"
                                }
                              >
                                {c.signedByClient
                                  ? formatDDMMYYYY(c.clientSignedAt || c.createdAt)
                                  : "____________________________________________"}
                              </span>
                            </p>
                          </div>

                          <div className="space-y-1 pt-2">
                            <p className="font-bold text-foreground">CONTRACTOR:</p>
                            <p>
                              Signature:{" "}
                              <span
                                className={
                                  c.signedByFreelancer
                                    ? "text-foreground font-bold"
                                    : "text-subtle"
                                }
                              >
                                {c.signedByFreelancer
                                  ? c.freelancerName || "Freelancer"
                                  : "________________________________________"}
                              </span>
                            </p>
                            <p>
                              Printed Name:{" "}
                              <span className="font-semibold text-foreground">
                                {c.freelancerName || "Freelancer"}
                              </span>
                            </p>
                            <p>
                              Date:{" "}
                              <span
                                className={
                                  c.signedByFreelancer
                                    ? "text-foreground font-semibold"
                                    : "text-subtle"
                                }
                              >
                                {c.signedByFreelancer
                                  ? formatDDMMYYYY(c.freelancerSignedAt || c.createdAt)
                                  : "____________________________________________"}
                              </span>
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
                          <p className="font-bold text-foreground text-[10px] uppercase tracking-wider">
                            CLIENT SIGNATURE
                          </p>
                          <p className="font-serif italic font-bold text-primary text-sm">
                            {c.signedByClient ? `Signed by ${c.clientName || "Client"}` : "Unsigned"}
                          </p>
                          <p className="text-[11px] text-subtle">
                            Status:{" "}
                            <span
                              className={c.signedByClient ? "text-success font-bold" : "text-muted"}
                            >
                              {c.signedByClient ? "SIGNED ✓" : "PENDING"}
                            </span>
                          </p>
                          <p className="text-[11px] text-subtle">
                            Date:{" "}
                            {c.signedByClient
                              ? formatDate(c.clientSignedAt || c.createdAt)
                              : "Pending Signature"}
                          </p>
                        </div>

                        <div className="rounded-xl border border-border bg-base p-3 space-y-1">
                          <p className="font-bold text-foreground text-[10px] uppercase tracking-wider">
                            FREELANCER SIGNATURE
                          </p>
                          <p className="font-serif italic font-bold text-primary text-sm">
                            {c.signedByFreelancer
                              ? `Signed by ${c.freelancerName || "Freelancer"}`
                              : "Unsigned"}
                          </p>
                          <p className="text-[11px] text-subtle">
                            Status:{" "}
                            <span
                              className={
                                c.signedByFreelancer ? "text-success font-bold" : "text-muted"
                              }
                            >
                              {c.signedByFreelancer ? "SIGNED ✓" : "PENDING"}
                            </span>
                          </p>
                          <p className="text-[11px] text-subtle">
                            Date:{" "}
                            {c.signedByFreelancer
                              ? formatDate(c.freelancerSignedAt || c.createdAt)
                              : "Pending Signature"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {/* Filter / Search Empty State */}
        {contracts.length > 0 && filteredContracts.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <FiSearch className="mx-auto h-8 w-8 text-muted mb-3" />
            <p className="font-bold text-foreground text-sm">No matching contracts found</p>
            <p className="text-xs text-subtle mt-1">
              Try adjusting your search query or switching the status filter tab.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setActiveFilter("all")
                setSearchQuery("")
              }}
              className="mt-4"
            >
              Reset Filters
            </Button>
          </div>
        )}

        {/* Generate Contract CTAs (Client Only) */}
        {isClient &&
          projects
            .filter((p) => !p.contractId && p.freelancerId)
            .map((p) => (
              <Card key={p.id} className="border-primary/30 bg-primary/[0.02]">
                <CardContent className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <FiFileText className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-bold text-foreground text-sm">{p.title}</p>
                      <p className="text-xs text-muted">
                        Freelancer assigned. Ready to generate formal smart agreement.
                      </p>
                    </div>
                  </div>
                  <Button size="sm" loading={busy === p.id} onClick={() => create(p)}>
                    Generate Contract
                  </Button>
                </CardContent>
              </Card>
            ))}

        {/* Pending Contract Notice (Freelancer Only) */}
        {!isClient &&
          projects
            .filter((p) => !p.contractId && p.freelancerId)
            .map((p) => (
              <Card key={p.id}>
                <CardContent className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-subtle/10 text-subtle shrink-0">
                      <FiClock className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-bold text-foreground text-sm">{p.title}</p>
                      <p className="text-xs text-muted">
                        Waiting for client to generate the formal contract agreement.
                      </p>
                    </div>
                  </div>
                  <Badge tone="neutral" className="text-xs">
                    Draft Pending
                  </Badge>
                </CardContent>
              </Card>
            ))}

        {!contracts.length && !projects.some((p) => p.freelancerId) && (
          <EmptyState
            icon={FiFileText}
            title="No contracts yet"
            description={
              isClient
                ? "A contract can be generated once a freelancer is assigned to a project."
                : "Contract agreements will appear here once assigned by a client."
            }
          />
        )}
      </div>
    </div>
  )
}
