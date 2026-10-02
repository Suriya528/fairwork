import { useEffect, useState } from "react"
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiCpu,
  FiExternalLink,
  FiFile,
  FiLoader,
  FiShield,
  FiUserCheck,
} from "react-icons/fi"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Textarea } from "@/components/ui/Textarea"
import { EmptyState } from "@/components/feedback/EmptyState"
import { MetricCard } from "@/components/common/MetricCard"
import { PageHeader } from "@/components/common/PageHeader"
import { useAuth } from "@/context/AuthContext"
import { useDisputeSummary } from "@/context/DisputeSummaryContext"
import {
  raiseDispute,
  evaluateDisputeWithAI,
  acceptAiRecommendation,
} from "@/services/disputesApi"
import { raiseEscrowDispute } from "@/services/web3"

export function DisputesPage() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/admin/disputes", { replace: true })
    }
  }, [user?.role, navigate])

  const { projects, disputes, openDisputeCount, error, refresh } = useDisputeSummary()
  const [reason, setReason] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState("")
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({})
  const [acceptLoading, setAcceptLoading] = useState<Record<string, boolean>>({})
  const [actionMsg, setActionMsg] = useState("")

  const listed = searchParams.get("escrow") === "open"
    ? projects.filter((project) => project.escrowDisputed)
    : projects.filter((project) => project.status === "disputed")

  const raise = async (projectId: string) => {
    if (!token || !reason[projectId]?.trim()) return

    setSubmitError("")
    try {
      if (user?.walletAddress) {
        await raiseEscrowDispute(projectId, reason[projectId], user.walletAddress)
      }
      await raiseDispute(projectId, reason[projectId], token)
      setReason((value) => ({ ...value, [projectId]: "" }))
      await refresh()
    } catch (cause) {
      setSubmitError(cause instanceof Error ? cause.message : "Unable to raise dispute.")
    }
  }

  const handleEvaluateAI = async (disputeId: string) => {
    if (!token) return
    setAiLoading((prev) => ({ ...prev, [disputeId]: true }))
    setActionMsg("")
    try {
      await evaluateDisputeWithAI(disputeId, token)
      setActionMsg("AI recommendation formulated successfully based on evidence and contract scope.")
      await refresh()
    } catch (err: any) {
      setSubmitError(err.message || "Failed to generate AI dispute recommendation.")
    } finally {
      setAiLoading((prev) => ({ ...prev, [disputeId]: false }))
    }
  }

  const handleAcceptAI = async (disputeId: string) => {
    if (!token) return
    setAcceptLoading((prev) => ({ ...prev, [disputeId]: true }))
    setActionMsg("")
    try {
      const res = await acceptAiRecommendation(disputeId, token)
      if (res.settled) {
        setActionMsg("Both parties agreed to the AI recommendation! Dispute resolved and settled.")
      } else {
        setActionMsg("You accepted the AI recommendation. Awaiting counterparty acceptance.")
      }
      await refresh()
    } catch (err: any) {
      setSubmitError(err.message || "Failed to accept AI settlement.")
    } finally {
      setAcceptLoading((prev) => ({ ...prev, [disputeId]: false }))
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <PageHeader title="Disputes & Settlement" description="Raise and review disputes, inspect evidence, or use AI-assisted mutual settlement." />

        {user?.role === "admin" && (
          <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 p-4 text-xs text-primary">
            <span>You are logged in as Administrator. To arbitrate, review evidence, and execute smart contract settlements, visit the Admin Dispute Console.</span>
            <Link to="/admin/disputes" className="font-semibold underline ml-3 shrink-0">
              Open Admin Disputes →
            </Link>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard label="Open Disputes" value={String(openDisputeCount)} icon={FiAlertTriangle} />
          <MetricCard label="Resolved Disputes" value={String(disputes.filter((d) => d.status === "resolved").length)} icon={FiFile} />
        </div>

        {actionMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 shrink-0" />
            <span>{actionMsg}</span>
          </div>
        )}

        {(error || submitError) && (
          <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger flex items-center gap-2">
            <FiAlertTriangle className="w-4 h-4 shrink-0" />
            <span>{submitError || error}</span>
          </div>
        )}

        {/* Active Disputed Projects Feed */}
        <div className="flex flex-col gap-4">
          {listed.map((project) => {
            const dispute = disputes.find((item) => item.projectId === project.id)
            const isClient = user?.id === project.clientId
            const isFreelancer = user?.id === project.freelancerId
            const aiRec = dispute?.aiRecommendation
            const isPending = dispute?.status === "pending"

            const hasUserAccepted = isClient
              ? aiRec?.clientAccepted
              : isFreelancer
              ? aiRec?.freelancerAccepted
              : false

            return (
              <div key={project.id} className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-4">
                <div className="flex items-start justify-between flex-wrap gap-2 border-b border-border/40 pb-3">
                  <div>
                    <Link to={`/projects/${project.id}`} className="text-base font-bold text-foreground hover:text-primary transition-colors">
                      {project.title}
                    </Link>
                    <p className="text-xs text-muted mt-0.5">Budget: ${Number(project.budget || 0).toLocaleString()} USDC</p>
                  </div>
                  <Badge tone={dispute?.status === "resolved" ? "success" : "warning"}>
                    {dispute?.status === "resolved" ? "Resolved" : "Disputed / In Review"}
                  </Badge>
                </div>

                {dispute ? (
                  <div className="space-y-4">
                    <div>
                      <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1">
                        Dispute Reason
                      </span>
                      <p className="text-xs text-foreground bg-base/60 p-3 rounded-xl border border-border/50">
                        {dispute.reason}
                      </p>
                    </div>

                    {/* AI Settlement Mediation Engine Card */}
                    <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                            <FiCpu className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-foreground">AI-Assisted Mutual Settlement</h4>
                            <p className="text-[11px] text-muted">Objective binary mediation. Requires mutual consent from both parties to execute.</p>
                          </div>
                        </div>

                        {isPending && !aiRec?.winner && (
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={aiLoading[dispute.id]}
                            onClick={() => handleEvaluateAI(dispute.id)}
                            className="bg-primary hover:bg-primary-hover text-white text-xs font-medium"
                          >
                            {aiLoading[dispute.id] ? (
                              <>
                                <FiLoader className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                Evaluating Evidence...
                              </>
                            ) : (
                              "Request AI Assessment"
                            )}
                          </Button>
                        )}
                      </div>

                      {/* Display Formulated Recommendation */}
                      {aiRec && aiRec.winner && aiRec.winner !== "none" && (
                        <div className="mt-2 space-y-3 pt-2 border-t border-primary/10">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-muted">Recommendation:</span>
                              <Badge tone={aiRec.winner === "freelancer" ? "success" : "info"} className="uppercase font-mono text-[10px]">
                                Evidence Favors {aiRec.winner === "freelancer" ? "Freelancer (Payout)" : "Client (Refund)"}
                              </Badge>
                            </div>
                            <span className="text-[10px] text-subtle flex items-center gap-1">
                              <FiClock className="w-3 h-3" />
                              48-Hour Mutual Window
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground leading-relaxed italic bg-surface/80 p-2.5 rounded-lg border border-border/40">
                            &ldquo;{aiRec.rationale}&rdquo;
                          </p>

                          {/* Dual Consent Tracker */}
                          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                            <div className="p-2 rounded-lg bg-base border border-border/40 flex items-center justify-between">
                              <span className="text-muted">Client Consent:</span>
                              {aiRec.clientAccepted ? (
                                <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                                  <FiCheckCircle className="w-3 h-3" /> Accepted
                                </span>
                              ) : (
                                <span className="text-subtle text-[11px]">Pending</span>
                              )}
                            </div>
                            <div className="p-2 rounded-lg bg-base border border-border/40 flex items-center justify-between">
                              <span className="text-muted">Freelancer Consent:</span>
                              {aiRec.freelancerAccepted ? (
                                <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                                  <FiCheckCircle className="w-3 h-3" /> Accepted
                                </span>
                              ) : (
                                <span className="text-subtle text-[11px]">Pending</span>
                              )}
                            </div>
                          </div>

                          {/* Acceptance Action Trigger */}
                          {isPending && (isClient || isFreelancer) && (
                            <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                              {hasUserAccepted ? (
                                <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                                  <FiUserCheck className="w-4 h-4" />
                                  You accepted this recommendation. Awaiting counterparty signature for on-chain settlement.
                                </p>
                              ) : (
                                <div className="w-full flex items-center justify-between">
                                  <span className="text-[11px] text-muted">Agreeing executes smart contract settlement if counterparty also accepts.</span>
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    disabled={acceptLoading[dispute.id]}
                                    onClick={() => handleAcceptAI(dispute.id)}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                                  >
                                    {acceptLoading[dispute.id] ? (
                                      <FiLoader className="w-3.5 h-3.5 animate-spin mr-1" />
                                    ) : (
                                      <FiCheckCircle className="w-3.5 h-3.5 mr-1" />
                                    )}
                                    Accept Recommendation
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                          {dispute.status === "resolved" && (
                            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <FiShield className="w-3.5 h-3.5" />
                                Resolved via Mutual AI Settlement (Winner: {dispute.winner})
                              </span>
                              {dispute.blockchainTxn && (
                                <a
                                  href={`https://sepolia.etherscan.io/tx/${dispute.blockchainTxn}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline text-[11px] flex items-center gap-1"
                                >
                                  View on Etherscan <FiExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted">Loading dispute details…</p>
                )}
              </div>
            )
          })}
        </div>

        {/* Section to Raise New Dispute */}
        {projects.filter((project) => project.status !== "disputed").length > 0 && (
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-bold text-foreground">Raise Dispute on Non-Disputed Project</h3>
            {projects.filter((project) => project.status !== "disputed").map((project) => (
              <div key={project.id} className="rounded-xl border border-border bg-surface p-4 space-y-3">
                <p className="font-semibold text-foreground text-sm">{project.title}</p>
                <Textarea
                  value={reason[project.id] ?? ""}
                  onChange={(event) => setReason((value) => ({ ...value, [project.id]: event.target.value }))}
                  placeholder="Detail the issue (e.g. unresponsiveness, deliverable divergence from agreed milestone specifications)..."
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!reason[project.id]?.trim()}
                  onClick={() => raise(project.id)}
                  className="text-danger border-danger/40 hover:bg-danger/10"
                >
                  Raise Formal Dispute
                </Button>
              </div>
            ))}
          </div>
        )}

        {!projects.length && (
          <EmptyState icon={FiAlertTriangle} title="No projects found" description="Disputes can be initiated from active or disputed projects." />
        )}
      </div>
    </div>
  )
}
