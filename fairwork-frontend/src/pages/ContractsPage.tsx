import { useEffect, useState } from "react"
import {
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiFileText,
  FiLock,
  FiShield,
  FiUserCheck,
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

export function ContractsPage() {
  const { user, token } = useAuth()
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [contracts, setContracts] = useState<ApiContract[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const isClient = user?.role === "client"

  const load = async () => {
    if (!token) return
    try {
      const p = await getMyProjects(token)
      setProjects(p)
      const c = await Promise.all(
        p.filter((x) => x.contractId).map((x) => getContract(x.contractId!, token).catch(() => null)),
      )
      setContracts(c.filter((contract): contract is ApiContract => contract !== null))
      setError(c.some((contract) => contract === null) ? "Some contract details could not be loaded." : "")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load contracts.")
    }
  }

  useEffect(() => {
    void load()
  }, [token])

  const create = async (p: ApiProject) => {
    if (!token || !p.freelancerId) return
    setBusy(p.id)
    try {
      const newContract = await generateContract(p.id, p.freelancerId, token)
      setContracts((prev) => [newContract, ...prev.filter((c) => c.id !== newContract.id)])
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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <PageHeader
          title="Formal Legal Contracts"
          description={
            isClient
              ? "Generate, inspect, and sign legally binding freelance agreements."
              : "Review, inspect, and sign formal client project agreements."
          }
        />
        {error && (
          <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger font-medium">
            {error}
          </div>
        )}

        {contracts.map((c) => {
          const fullySigned = c.signedByClient && c.signedByFreelancer
          const currentUserId = user?.id || ""
          const isClientParty = currentUserId === c.clientId
          const isFreelancerParty = currentUserId === c.freelancerId

          const userHasSigned = isClientParty ? c.signedByClient : isFreelancerParty ? c.signedByFreelancer : false
          const canSign = (isClientParty && !c.signedByClient) || (isFreelancerParty && !c.signedByFreelancer)

          const projectMatch = projects.find((p) => p.id === c.projectId)
          const displayTitle = c.projectTitle || projectMatch?.title || "Freelance Project Agreement"
          const displayBudget = c.projectBudget || projectMatch?.budget || 0

          return (
            <Card key={c.id} className="overflow-hidden border border-border shadow-sm">
              {/* Top Legal Document Header Banner */}
              <div className="border-b border-border bg-elevated/40 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FiFileText className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="font-bold text-foreground text-base sm:text-lg">{displayTitle}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-subtle font-mono mt-0.5">
                        <span>Ref ID:</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(`FAIR-CNT-${c.id.slice(-8).toUpperCase()}`, c.id)}
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
                        <span>
                          Contract Date: {formatDate(c.clientSignedAt || c.freelancerSignedAt || c.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge tone={fullySigned ? "success" : "warning"} className="px-3 py-1 text-xs">
                    {fullySigned ? "✓ BINDING LEGAL AGREEMENT" : "⏳ AWAITING SIGNATURES"}
                  </Badge>
                </div>
              </div>

              <CardContent className="space-y-6 p-5 sm:p-6">
                {/* Parties Metadata Grid */}
                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Client Metadata */}
                  <div className="rounded-xl border border-border bg-base p-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Client / Hirer</span>
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

                  {/* Freelancer Metadata */}
                  <div className="rounded-xl border border-border bg-base p-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Assigned Freelancer</span>
                    <p className="font-bold text-foreground text-sm mt-1">{c.freelancerName || "Freelancer"}</p>
                    {c.freelancerEmail && <p className="text-xs text-subtle truncate">{c.freelancerEmail}</p>}
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

                  {/* Agreement Financial Details */}
                  <div className="rounded-xl border border-border bg-base p-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Agreed Budget</span>
                    <p className="font-bold text-primary text-sm mt-1">{formatCurrency(displayBudget)}</p>
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
                      <div><span className="font-bold text-foreground">Ref ID:</span> FAIR-CNT-{c.id.slice(-8).toUpperCase()}</div>
                      <div><span className="font-bold text-foreground">Effective Date:</span> {formatDate(c.clientSignedAt || c.freelancerSignedAt || c.createdAt)}</div>
                      <div><span className="font-bold text-foreground">Client Party:</span> {c.clientName || "Client"} ({c.clientEmail || "N/A"})</div>
                      <div><span className="font-bold text-foreground">Freelancer Party:</span> {c.freelancerName || "Freelancer"} ({c.freelancerEmail || "N/A"})</div>
                      <div><span className="font-bold text-foreground">Agreed Budget:</span> {formatCurrency(displayBudget)}</div>
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
                      {c.aiGeneratedText.replace(/\[Freelancer\/Contractor Representative\]/g, c.freelancerName || "Contractor Representative")}
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
                            Signature: <span className={c.signedByClient ? "text-success font-bold" : "text-subtle"}>{c.signedByClient ? "Digitally Signed ✓" : "________________________________________"}</span>
                          </p>
                          <p>
                            Printed Name: <span className="font-semibold text-foreground">{c.clientName || "Client"}</span>
                          </p>
                          <p>
                            Date: <span className={c.signedByClient ? "text-foreground font-semibold" : "text-subtle"}>{c.signedByClient ? formatDate(c.clientSignedAt || c.createdAt) : "____________________________________________"}</span>
                          </p>
                        </div>

                        <div className="space-y-1 pt-2">
                          <p className="font-bold text-foreground">CONTRACTOR:</p>
                          <p>
                            Signature: <span className={c.signedByFreelancer ? "text-success font-bold" : "text-subtle"}>{c.signedByFreelancer ? "Digitally Signed ✓" : "________________________________________"}</span>
                          </p>
                          <p>
                            Printed Name: <span className="font-semibold text-foreground">{c.freelancerName || "Freelancer"}</span>
                          </p>
                          <p>
                            Date: <span className={c.signedByFreelancer ? "text-foreground font-semibold" : "text-subtle"}>{c.signedByFreelancer ? formatDate(c.freelancerSignedAt || c.createdAt) : "____________________________________________"}</span>
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
                          {c.signedByClient ? `Signed by ${c.clientName || "Client"}` : "Unsigned"}
                        </p>
                        <p className="text-[11px] text-subtle">
                          Status: <span className={c.signedByClient ? "text-success font-bold" : "text-muted"}>{c.signedByClient ? "SIGNED ✓" : "PENDING"}</span>
                        </p>
                        <p className="text-[11px] text-subtle">
                          Date: {c.signedByClient ? formatDate(c.clientSignedAt || c.createdAt) : "Pending Signature"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-border bg-base p-3 space-y-1">
                        <p className="font-bold text-foreground text-[10px] uppercase tracking-wider">FREELANCER SIGNATURE</p>
                        <p className="font-serif italic font-bold text-primary text-sm">
                          {c.signedByFreelancer ? `Signed by ${c.freelancerName || "Freelancer"}` : "Unsigned"}
                        </p>
                        <p className="text-[11px] text-subtle">
                          Status: <span className={c.signedByFreelancer ? "text-success font-bold" : "text-muted"}>{c.signedByFreelancer ? "SIGNED ✓" : "PENDING"}</span>
                        </p>
                        <p className="text-[11px] text-subtle">
                          Date: {c.signedByFreelancer ? formatDate(c.freelancerSignedAt || c.createdAt) : "Pending Signature"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Digital Signature Panel */}
                <div className="rounded-xl border border-border bg-elevated/30 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-xs">
                      {fullySigned ? (
                        <p className="font-semibold text-success flex items-center gap-1.5">
                          <FiCheckCircle className="h-4 w-4" />
                          Fully Executed Agreement — Both Client and Freelancer have digitally signed.
                        </p>
                      ) : userHasSigned ? (
                        <p className="font-semibold text-foreground flex items-center gap-1.5">
                          <FiUserCheck className="h-4 w-4 text-primary" />
                          You have digitally signed this contract. Awaiting remaining party signature.
                        </p>
                      ) : canSign ? (
                        <p className="text-muted font-medium">
                          By clicking <strong className="text-foreground">Sign Contract</strong>, you electronically execute and accept this agreement under FairWork Escrow terms.
                        </p>
                      ) : (
                        <p className="text-muted">Awaiting contract signatures from participating parties.</p>
                      )}
                    </div>

                    {canSign && (
                      <Button
                        size="md"
                        loading={busy === c.id}
                        leftIcon={<FiCheckCircle className="h-4 w-4" />}
                        onClick={() => sign(c.id)}
                        className="shrink-0"
                      >
                        Sign Contract ({isClientParty ? "as Client" : "as Freelancer"})
                      </Button>
                    )}

                    {userHasSigned && !fullySigned && (
                      <Badge tone="success" className="shrink-0 px-3 py-1.5 text-xs">
                        Your Signature Recorded ✓
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Generate Contract CTAs (Client Only) */}
        {isClient &&
          projects
            .filter((p) => !p.contractId && p.freelancerId)
            .map((p) => (
              <Card key={p.id}>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="font-medium text-foreground">{p.title}</p>
                    <p className="text-xs text-muted">Freelancer assigned. Ready to generate formal agreement.</p>
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
                  <div>
                    <p className="font-medium text-foreground">{p.title}</p>
                    <p className="text-xs text-muted">Waiting for client to generate the formal contract agreement.</p>
                  </div>
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
