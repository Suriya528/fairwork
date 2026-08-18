import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { FiArrowUpRight, FiCreditCard, FiLock, FiRepeat } from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import { PageHeader } from "@/components/common/PageHeader"
import { MetricCard } from "@/components/common/MetricCard"
import { WalletAddress } from "@/components/common/WalletAddress"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { useAuth } from "@/context/AuthContext"
import { getMyProjects, type ApiProject } from "@/services/projectsApi"
import { formatCurrency, formatDate } from "@/lib/format"

export function WalletPage() {
  const { user, token } = useAuth()
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [locallyWithdrawn, setLocallyWithdrawn] = useState(0)

  const isFreelancer = user?.role === "freelancer"

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setLoading(true)
    getMyProjects(token)
      .then((data) => {
        if (!cancelled) setProjects(data)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const releasedUsd = useMemo(() => {
    return projects.reduce((sum, p) => {
      const milestoneSum = p.milestones
        .filter((m) => m.paymentReleased)
        .reduce((s, m) => s + m.amount, 0)
      return sum + milestoneSum
    }, 0)
  }, [projects])

  const inEscrowUsd = useMemo(() => {
    return projects
      .filter((p) => p.escrowFunded && !p.escrowCompleted && !p.escrowDisputed)
      .reduce((sum, p) => sum + p.budget, 0)
  }, [projects])

  const pendingUsd = useMemo(() => {
    return projects.reduce((sum, p) => {
      const pendingMilestones = p.milestones
        .filter((m) => !m.paymentReleased && m.status === "completed")
        .reduce((s, m) => s + m.amount, 0)
      return sum + pendingMilestones
    }, 0)
  }, [projects])

  const available = Math.max(0, releasedUsd - locallyWithdrawn)

  const recentTransactions = useMemo(() => {
    const list: { id: string; type: string; amount: number; createdAt: string }[] = []
    projects.forEach((p) => {
      if (p.escrowFunded) {
        list.push({ id: `dep-${p.id}`, type: "Escrow Deposit", amount: p.budget, createdAt: p.createdAt })
      }
      p.milestones.forEach((m) => {
        if (m.paymentReleased) {
          list.push({ id: `rel-${m.id}`, type: "Milestone Release", amount: m.amount, createdAt: p.createdAt })
        }
      })
    })
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
  }, [projects])

  const handleWithdraw = async () => {
    setWithdrawLoading(true)
    await new Promise((r) => setTimeout(r, 900))
    setLocallyWithdrawn((prev) => prev + available)
    setWithdrawLoading(false)
    setWithdrawOpen(false)
  }

  if (!user) return null

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <PageHeader
          title="Wallet"
          description={
            isFreelancer
              ? "Your available earnings, locked milestone escrow, and Web3 payout balance."
              : "Project escrow deposits, funded project balances, and Web3 wallet connection."
          }
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            label={isFreelancer ? "Available earnings" : "Released to date"}
            value={formatCurrency(available)}
            icon={FiCreditCard}
          />
          <MetricCard
            label={isFreelancer ? "Escrow protection" : "In project escrows"}
            value={formatCurrency(inEscrowUsd)}
            icon={FiLock}
          />
          <MetricCard
            label={isFreelancer ? "Pending payouts" : "Unreleased milestones"}
            value={formatCurrency(pendingUsd)}
            icon={FiRepeat}
          />
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-subtle">Connected Web3 Wallet</span>
              {user.walletAddress ? (
                <WalletAddress address={user.walletAddress} chars={6} />
              ) : (
                <span className="text-xs text-muted">No wallet address connected yet</span>
              )}
            </div>
            {isFreelancer && (
              <Button
                variant="primary"
                size="sm"
                disabled={available <= 0 || !user.walletAddress}
                leftIcon={<FiArrowUpRight className="h-4 w-4" />}
                onClick={() => setWithdrawOpen(true)}
              >
                Withdraw earnings
              </Button>
            )}
          </div>
          {isFreelancer && available <= 0 && (
            <p className="text-xs text-subtle">
              Nothing available to withdraw right now — funds appear here once milestone payments are released by your clients.
            </p>
          )}
          {!isFreelancer && (
            <p className="text-xs text-subtle">
              Client project deposits are locked securely inside Smart Contract Escrows until milestone release.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Recent transactions</h3>
            <Link to="/transactions" className="text-xs font-medium text-info hover:text-primary transition-colors">
              View all
            </Link>
          </div>

          {loading ? (
            <div className="py-6 text-center text-xs text-muted">Loading wallet data...</div>
          ) : recentTransactions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted">
              No recent wallet transactions.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentTransactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-foreground">
                      {t.type}
                    </span>
                    <span className="text-[11px] text-subtle">{formatDate(t.createdAt)}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        onConfirm={handleWithdraw}
        loading={withdrawLoading}
        title="Withdraw earnings?"
        confirmLabel="Withdraw"
        description={`This transfers ${formatCurrency(available)} from your FairWork earnings balance directly to your connected wallet (${user.walletAddress ? user.walletAddress.slice(0, 6) + "..." : ""}).`}
      />
    </div>
  )
}