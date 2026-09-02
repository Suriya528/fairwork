import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { formatCurrency, USD_TO_INR_RATE } from "@/lib/format"

export type DisplayCurrency = "INR" | "USD"

interface CurrencyContextType {
  currency: DisplayCurrency
  setCurrency: (currency: DisplayCurrency) => void
  symbol: string
  exchangeRate: number
  convertAmount: (amountInUSD: number) => number
  formatAmount: (amountInUSD: number) => string
}

const STORAGE_KEY = "fairwork-display-currency"

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<DisplayCurrency>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === "USD") {
        return stored
      }
    } catch {
      // Fallback on storage errors
    }
    return "USD" // Default currency is US Dollar ($)
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

  const convertAmount = (amountInUSD: number): number => {
    return currency === "INR" ? amountInUSD * USD_TO_INR_RATE : amountInUSD
  }

  const formatAmount = (amountInUSD: number): string => {
    return formatCurrency(amountInUSD, currency)
  }

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        symbol,
        exchangeRate: USD_TO_INR_RATE,
        convertAmount,
        formatAmount,
      }}
    >
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
