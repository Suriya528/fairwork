import { useEffect, useState } from "react"
import { FiCheckCircle, FiClock, FiFileText } from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { EmptyState } from "@/components/feedback/EmptyState"
import { PageHeader } from "@/components/common/PageHeader"
import { useAuth } from "@/context/AuthContext"
import { getMyProjects, type ApiProject } from "@/services/projectsApi"
import { generateContract, getContract, signContract, type ApiContract } from "@/services/contractsApi"

export function ContractsPage() {
  const { user, token } = useAuth()
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [contracts, setContracts] = useState<ApiContract[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState("")

  const isClient = user?.role === "client"

  const load = async () => {
    if (!token) return
    const p = await getMyProjects(token)
    setProjects(p)
    const c = await Promise.all(
      p.filter((x) => x.contractId).map((x) => getContract(x.contractId!, token).catch(() => null)),
    )
    setContracts(c.filter((contract): contract is ApiContract => contract !== null))
    setError(c.some((contract) => contract === null) ? "Some contracts could not be loaded." : "")
  }

  useEffect(() => {
    void load().catch((e) => setError(e.message))
  }, [token])

  const create = async (p: ApiProject) => {
    if (!token || !p.freelancerId) return
    setBusy(p.id)
    try {
      await generateContract(p.id, p.freelancerId, token)
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
      await signContract(id, token)
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
          title="Contracts"
          description={
            isClient
              ? "Generate and sign formal agreements for your project hires."
              : "Review and sign formal agreements for your assigned projects."
          }
        />
        {error && <p className="text-sm text-danger">{error}</p>}

        {contracts.map((c) => {
          const signed = c.signedByClient && c.signedByFreelancer
          const canSign =
            user?.id === c.clientId ? !c.signedByClient : user?.id === c.freelancerId && !c.signedByFreelancer

          return (
            <Card key={c.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {c.projectTitle ?? projects.find((p) => p.id === c.projectId)?.title ?? "Project contract"}
                    </p>
                    <p className="text-xs text-muted">
                      {signed ? "Fully signed & binding" : "Awaiting signatures"}
                    </p>
                  </div>
                  {signed ? <FiCheckCircle className="text-success" /> : <FiClock className="text-subtle" />}
                </div>
                <div className="text-xs text-muted">
                  Client: {c.signedByClient ? "Signed ✓" : "Awaiting signature"} · Freelancer:{" "}
                  {c.signedByFreelancer ? "Signed ✓" : "Awaiting signature"}
                </div>
                <p className="max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-base p-4 text-xs font-mono text-muted">
                  {c.aiGeneratedText}
                </p>
                {canSign && (
                  <Button size="sm" loading={busy === c.id} onClick={() => sign(c.id)}>
                    Sign contract
                  </Button>
                )}
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
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-muted">Freelancer assigned. Ready to generate formal agreement.</p>
                  </div>
                  <Button size="sm" loading={busy === p.id} onClick={() => create(p)}>
                    Generate contract
                  </Button>
                </CardContent>
              </Card>
            ))}

        {/* Pending Contract Generation Notice (Freelancer Only) */}
        {!isClient &&
          projects
            .filter((p) => !p.contractId && p.freelancerId)
            .map((p) => (
              <Card key={p.id}>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-muted">Waiting for client to generate the contract agreement.</p>
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
