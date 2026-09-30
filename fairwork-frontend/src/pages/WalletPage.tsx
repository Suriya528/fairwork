import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { FiCreditCard, FiLock, FiRepeat, FiShield } from "react-icons/fi"
import { PageHeader } from "@/components/common/PageHeader"
import { MetricCard } from "@/components/common/MetricCard"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { Web3WalletCard } from "@/components/wallet/Web3WalletCard"
import { Button } from "@/components/ui/Button"
import { useAuth } from "@/context/AuthContext"
import { useCurrency } from "@/context/CurrencyContext"
import { getMyProjects, type ApiProject } from "@/services/projectsApi"
import { formatDate } from "@/lib/format"

import { getPendingPayoutAmount, getReleasedAmount, getUnreleasedAmount } from "@/lib/financial"

export function WalletPage() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const { formatAmount } = useCurrency()
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
    return projects.reduce((sum, p) => sum + getReleasedAmount(p), 0)
  }, [projects])

  const inEscrowUsd = useMemo(() => {
    return projects
      .filter((p) => p.escrowFunded && !p.escrowCompleted && !p.escrowDisputed)
      .reduce((sum, p) => sum + getUnreleasedAmount(p), 0)
  }, [projects])

  const pendingUsd = useMemo(() => {
    return projects.reduce((sum, p) => sum + getPendingPayoutAmount(p), 0)
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

  if (user?.role === "admin") {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <PageHeader
            title="Administrator Financial Overview"
            description="System administrators supervise platform escrows and transactions without personal wallet binding."
          />
          <div className="rounded-2xl border border-primary/25 bg-surface p-6 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FiShield className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold text-foreground text-base">No Wallet Connection Required</h3>
                <p className="text-xs text-subtle">Administrator accounts operate outside client &amp; freelancer Web3 wallets.</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted leading-relaxed">
              As a platform administrator, you do not need to connect a personal Web3 wallet. Platform transaction logs, escrow contracts, and system fees can be inspected and managed directly in the Admin Console.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="sm" onClick={() => navigate("/admin/escrows")}>
                View All Platform Escrows
              </Button>
              <Button size="sm" variant="secondary" onClick={() => navigate("/admin/transactions")}>
                View All Transactions
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
            value={formatAmount(available)}
            icon={FiCreditCard}
          />
          <MetricCard
            label={isFreelancer ? "Escrow protection" : "In project escrows"}
            value={formatAmount(inEscrowUsd)}
            icon={FiLock}
          />
          <MetricCard
            label={isFreelancer ? "Pending payouts" : "Unreleased milestones"}
            value={formatAmount(pendingUsd)}
            icon={FiRepeat}
          />
        </div>

        <Web3WalletCard
          title="Web3 Payout & Escrow Wallet"
          description={
            isFreelancer
              ? "Connect and verify your Ethereum wallet to receive milestone payouts securely via smart contract escrow."
              : "Connect and verify your Ethereum wallet to fund project escrows and release approved milestone payments."
          }
        />

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
                  className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong hover:bg-elevated/40"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-foreground">
                      {t.type}
                    </span>
                    <span className="text-[11px] text-subtle font-mono">{formatDate(t.createdAt)}</span>
                  </div>
                  <span className="text-sm font-semibold font-mono text-foreground">
                    {formatAmount(t.amount)}
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
        description={`This transfers ${formatAmount(available)} from your FairWork earnings balance directly to your connected wallet (${user.walletAddress ? user.walletAddress.slice(0, 6) + "..." : ""}).`}
      />
    </div>
  )
}