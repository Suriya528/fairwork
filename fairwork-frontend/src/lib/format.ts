/**
 * Shared formatting helpers used across the app.
 * Kept framework-agnostic so they compose easily with future API data.
 */

/**
 * Format an application/project monetary amount in the user's preferred display currency.
 * Defaults to reading 'fairwork-display-currency' from localStorage ("INR" | "USD"), fallback "INR".
 * Formats INR using 'en-IN' locale (e.g. ₹25,000) and USD using 'en-US' locale (e.g. $25,000).
 */
export function formatCurrency(amount: number, currency?: string): string {
  let selectedCurrency = currency
  if (!selectedCurrency) {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("fairwork-display-currency") : null
      if (stored === "INR" || stored === "USD") {
        selectedCurrency = stored
      }
    } catch {
      // Fallback on storage errors
    }
    selectedCurrency = selectedCurrency || "INR"
  }

  if (selectedCurrency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/** Explicit helper for formatting application budgets in INR. */
export function formatINR(amount: number): string {
  return formatCurrency(amount, "INR")
}

/** Format a crypto/token amount with its symbol, e.g. "250.00 USDC" or "0.85 ETH". */
export function formatCrypto(amount: number, symbol = "USDC"): string {
  return `${amount.toLocaleString("en-US", {
    maximumFractionDigits: 4,
  })} ${symbol}`
}

/**
 * Display-only reference conversion helper.
 * Keeps blockchain token values (USDC/ETH) distinct from application-level INR budgets.
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