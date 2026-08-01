import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { FiArrowUpRight, FiCreditCard, FiLock, FiRepeat } from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import { PageHeader } from "@/components/common/PageHeader"
import { MetricCard } from "@/components/common/MetricCard"
import { StatusBadge } from "@/components/common/StatusBadge"
import { WalletAddress } from "@/components/common/WalletAddress"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { getMilestonesForProject, projects } from "@/data/projects"
import { escrowAccounts, transactions } from "@/data/transactions"
import { users } from "@/data/users"
import { formatCurrency, formatDate, toUsd } from "@/lib/format"

// TODO: replace with the real authenticated user once session/auth
// context exists (only services/authApi.ts is wired up so far).
const CURRENT_USER_ID = "usr_client_01"

export function WalletPage() {
  const currentUser = users.find((u) => u.id === CURRENT_USER_ID)
  const isClient = currentUser?.role === "client"

  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [locallyWithdrawn, setLocallyWithdrawn] = useState(0)

  const myProjects = useMemo(() => {
    if (!currentUser) return []
    return projects.filter((p) =>
      isClient ? p.clientId === currentUser.id : p.freelancerId === currentUser.id,
    )
  }, [currentUser, isClient])

  const myProjectIds = new Set(myProjects.map((p) => p.id))

  // Available = released funds earned across my projects, minus what
  // I've already withdrawn (real + simulated-this-session).
  const releasedUsd = myProjects.reduce((sum, project) => {
    const released = getMilestonesForProject(project.id)
      .filter((m) => m.status === "released")
      .reduce((s, m) => s + m.amount, 0)
    return sum + released
  }, 0)

  const alreadyWithdrawnUsd = transactions
    .filter((t) => myProjectIds.has(t.projectId) && t.type === "withdrawal" && t.status === "confirmed")
    .reduce((sum, t) => sum + toUsd(t.amount, t.symbol), 0)

  const available = Math.max(0, releasedUsd - alreadyWithdrawnUsd - locallyWithdrawn)

  const inEscrow = escrowAccounts
    .filter((a) => myProjectIds.has(a.projectId))
    .reduce((sum, a) => sum + toUsd(a.totalLocked, a.symbol), 0)

  const pending = transactions
    .filter((t) => myProjectIds.has(t.projectId) && t.status === "pending")
    .reduce((sum, t) => sum + toUsd(t.amount, t.symbol), 0)

  const recentTransactions = transactions
    .filter((t) => myProjectIds.has(t.projectId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const handleWithdraw = async () => {
    setWithdrawLoading(true)
    await new Promise((r) => setTimeout(r, 1100))
    setLocallyWithdrawn((prev) => prev + available)
    setWithdrawLoading(false)
    setWithdrawOpen(false)
  }

  if (!currentUser) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-muted">No wallet found.</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <PageHeader
          title="Wallet"
          description="Your balance across every project on FairWork."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard label="Available" value={formatCurrency(available)} icon={FiCreditCard} />
          <MetricCard label="In escrow" value={formatCurrency(inEscrow)} icon={FiLock} />
          <MetricCard label="Pending" value={formatCurrency(pending)} icon={FiRepeat} />
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-subtle">Connected wallet</span>
              <WalletAddress address={currentUser.walletAddress} chars={6} />
            </div>
            <Button
              variant="primary"
              size="sm"
              disabled={available <= 0}
              leftIcon={<FiArrowUpRight className="h-4 w-4" />}
              onClick={() => setWithdrawOpen(true)}
            >
              Withdraw
            </Button>
          </div>
          {available <= 0 && (
            <p className="text-xs text-subtle">
              Nothing available to withdraw right now — funds appear here once a milestone is released.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Recent transactions</h3>
            <Link to="/transactions" className="text-xs font-medium text-info hover:text-primary">
              View all
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted">
              No transactions yet.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentTransactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm capitalize text-foreground">
                      {t.type.replace("_", " ")}
                    </span>
                    <span className="text-xs text-subtle">{formatDate(t.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">
                      {formatCurrency(toUsd(t.amount, t.symbol))}
                    </span>
                    <StatusBadge status={t.status} />
                  </div>
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
        title="Withdraw funds?"
        confirmLabel="Withdraw"
        description={`This sends ${formatCurrency(available)} from your FairWork balance to your connected wallet.`}
      />
    </div>
  )
}