import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export type DisplayCurrency = "INR" | "USD"

interface CurrencyContextType {
  currency: DisplayCurrency
  setCurrency: (currency: DisplayCurrency) => void
  symbol: string
  formatAmount: (amount: number) => string
}

const STORAGE_KEY = "fairwork-display-currency"

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<DisplayCurrency>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === "INR" || stored === "USD") {
        return stored
      }
    } catch {
      // Fallback on storage errors
    }
    return "INR" // Default preference for India-focused experience
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, currency)
    } catch {
      // Fallback on storage errors
    }
  }, [currency])

  const setCurrency = (next: DisplayCurrency) => {
    setCurrencyState(next)
  }

  const symbol = currency === "INR" ? "₹" : "$"

  const formatAmount = (amount: number): string => {
    if (currency === "INR") {
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

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, symbol, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return context
}
