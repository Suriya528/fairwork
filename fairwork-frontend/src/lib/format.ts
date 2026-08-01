/**
 * Shared formatting helpers used across the app.
 * Kept framework-agnostic so they compose easily with future API data.
 */

/** Format a USD amount, e.g. 1250 -> "$1,250.00". */
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/** Format a crypto amount with its symbol, e.g. "0.85 ETH". */
export function formatCrypto(amount: number, symbol = "ETH"): string {
  return `${amount.toLocaleString("en-US", {
    maximumFractionDigits: 4,
  })} ${symbol}`
}

/**
 * Rough display-only USD conversion for mixed-symbol totals (ETH/USDC).
 * Swap for a live price feed once one exists — every page that mixes
 * symbols in a single sum (Escrow, Wallet, Admin) should use this rather
 * than defining its own local rate.
 */
const ETH_TO_USD = 2800

export function toUsd(amount: number, symbol: "ETH" | "USDC"): number {
  return symbol === "USDC" ? amount : amount * ETH_TO_USD
}

/** Format an ISO date string to a readable date, e.g. "Jul 21, 2026". */
export function formatDate(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

/** Relative time from now, e.g. "3 days ago" / "in 2 hours". */
export function formatRelativeTime(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input
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