/**
 * Shared formatting helpers used across the app.
 * Kept framework-agnostic so they compose easily with future API data.
 */

/**
 * Convert a base USD monetary amount (strictly USD on FairWork).
 */
export function convertCurrencyAmount(amountInUSD: number): number {
  return amountInUSD
}

/**
 * Format a USD monetary amount into standard US Dollar display ($X,XXX.XX).
 * Safely handles plain numbers, strings, and MongoDB Decimal128 objects ({ $numberDecimal: "..." }).
 */
export function formatCurrency(amountInUSD: number | unknown): string {
  let num = 0
  if (typeof amountInUSD === "number") {
    num = isNaN(amountInUSD) ? 0 : amountInUSD
  } else if (typeof amountInUSD === "string") {
    const parsed = parseFloat(amountInUSD)
    num = isNaN(parsed) ? 0 : parsed
  } else if (amountInUSD && typeof amountInUSD === "object") {
    if ("$numberDecimal" in amountInUSD) {
      const parsed = parseFloat(String((amountInUSD as any).$numberDecimal))
      num = isNaN(parsed) ? 0 : parsed
    } else {
      num = Number(amountInUSD) || 0
    }
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(num)
}

/** Format a crypto/token amount with its symbol, e.g. "250.00 USDC" or "0.85 ETH". */
export function formatCrypto(amount: number, symbol = "USDC"): string {
  return `${amount.toLocaleString("en-US", {
    maximumFractionDigits: 4,
  })} ${symbol}`
}

/**
 * Display-only reference conversion helper.
 * Keeps blockchain token values (USDC/ETH) distinct from application-level USD budgets.
 */
const ETH_TO_USD = 2800

export function toUsd(amount: number, symbol: "ETH" | "USDC"): number {
  return symbol === "USDC" ? amount : amount * ETH_TO_USD
}

/** Format an ISO date string to a readable date, e.g. "Jul 21, 2026". */
export function formatDate(input?: string | Date | null): string {
  if (!input) return "N/A"
  const date = typeof input === "string" ? new Date(input) : input
  if (isNaN(date.getTime())) return "N/A"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

/** Format an ISO date string to date & time, e.g. "21 Aug 2026, 10:00 PM". */
export function formatDateTime(input?: string | Date | null): string {
  if (!input) return "N/A"
  const date = typeof input === "string" ? new Date(input) : input
  if (isNaN(date.getTime())) return "N/A"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

/** User-friendly countdown badge string, e.g. "⚡ Due in 18 hours" or "Overdue by 2 hours". */
export function formatDeadlineCountdown(input?: string | Date | null): { text: string; isUrgent: boolean; isOverdue: boolean } {
  if (!input) return { text: "No deadline", isUrgent: false, isOverdue: false }
  const date = typeof input === "string" ? new Date(input) : input
  if (isNaN(date.getTime())) return { text: "No deadline", isUrgent: false, isOverdue: false }

  const diffMs = date.getTime() - Date.now()
  if (diffMs < 0) {
    const overdueHours = Math.max(1, Math.abs(Math.round(diffMs / (1000 * 60 * 60))))
    const overdueDays = Math.max(1, Math.abs(Math.round(diffMs / (1000 * 60 * 60 * 24))))
    return {
      text: overdueHours < 24 ? `Overdue by ${overdueHours}h` : `Overdue by ${overdueDays}d`,
      isUrgent: true,
      isOverdue: true,
    }
  }

  const hours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)))
  const days = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)))

  if (hours <= 24) {
    return { text: `⚡ Due in ${hours} hour${hours !== 1 ? "s" : ""}`, isUrgent: true, isOverdue: false }
  }
  return { text: `Due in ${days} day${days !== 1 ? "s" : ""}`, isUrgent: false, isOverdue: false }
}

/** Relative time from now, e.g. "3 days ago" / "in 2 hours". */
export function formatRelativeTime(input?: string | Date | null): string {
  if (!input) return "just now"
  const date = typeof input === "string" ? new Date(input) : input
  if (isNaN(date.getTime())) return "just now"
  const diff = date.getTime() - Date.now()
  const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" })

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 1000 * 60 * 60 * 24 * 365],
    ["month", 1000 * 60 * 60 * 24 * 30],
    ["day", 1000 * 60 * 60 * 24],
    ["hour", 1000 * 60 * 60],
    ["minute", 1000 * 60],
  ]

  for (const [unit, ms] of units) {
    if (Math.abs(diff) >= ms || unit === "minute") {
      return rtf.format(Math.round(diff / ms), unit)
    }
  }
  return "just now"
}

/** Truncate a blockchain address, e.g. "0x1f9a...4bE2". */
export function truncateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 2) return address
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

/** Percentage helper with clamping, e.g. progress bars. */
export function toPercent(value: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((value / total) * 100)))
}

/** Return initials from a name, e.g. "Ava Chen" -> "AC". */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}