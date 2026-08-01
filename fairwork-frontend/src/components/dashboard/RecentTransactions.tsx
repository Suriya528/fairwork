import type { IconType } from "react-icons"
import {
  FiArrowDownLeft,
  FiArrowUpRight,
  FiRotateCcw,
  FiLock,
  FiPercent,
} from "react-icons/fi"
import { Card } from "@/components/ui/Card"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Skeleton } from "@/components/ui/Skeleton"
import { EmptyState } from "@/components/feedback/EmptyState"
import { SectionHeading } from "./SectionHeading"
import { transactions } from "@/data/transactions"
import { formatCrypto, formatRelativeTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { TransactionType } from "@/types"

const typeMeta: Record<
  TransactionType,
  { label: string; icon: IconType; inflow: boolean }
> = {
  deposit: { label: "Escrow deposit", icon: FiArrowDownLeft, inflow: true },
  release: { label: "Funds released", icon: FiArrowUpRight, inflow: false },
  refund: { label: "Refund", icon: FiRotateCcw, inflow: true },
  dispute_hold: { label: "Dispute hold", icon: FiLock, inflow: false },
  fee: { label: "Protocol fee", icon: FiPercent, inflow: false },
  withdrawal: { label: "Withdrawal", icon: FiArrowUpRight, inflow: false },
}

export interface RecentTransactionsProps {
  loading?: boolean
}

/** Compact list of the most recent on-chain escrow transactions. */
export function RecentTransactions({ loading = false }: RecentTransactionsProps) {
  const recent = [...transactions]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5)

  return (
    <section aria-labelledby="transactions-heading" className="flex flex-col gap-4">
      <SectionHeading
        id="transactions-heading"
        title="Recent transactions"
        description="Latest on-chain settlement activity"
        actionLabel="View wallet"
        actionTo="/escrow"
      />
      <Card>
        {loading ? (
          <ul className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-1.5 h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </li>
            ))}
          </ul>
        ) : recent.length === 0 ? (
          <EmptyState
            title="No transactions"
            description="On-chain deposits and releases will show up here."
            className="border-0 bg-transparent"
          />
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((tx) => {
              const meta = typeMeta[tx.type]
              const Icon = meta.icon
              return (
                <li
                  key={tx.id}
                  className="flex items-center gap-3 p-4 transition-colors hover:bg-surface-hover"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      meta.inflow
                        ? "bg-success-soft text-success"
                        : "bg-info-soft text-info",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {meta.label}
                    </p>
                    <p className="text-xs text-subtle">
                      {formatRelativeTime(tx.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        meta.inflow ? "text-success" : "text-foreground",
                      )}
                    >
                      {meta.inflow ? "+" : "-"}
                      {formatCrypto(tx.amount, tx.symbol)}
                    </span>
                    <StatusBadge status={tx.status} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </section>
  )
}
