import { createContext, useContext, type ReactNode } from "react"
import { formatCurrency } from "@/lib/format"

export type DisplayCurrency = "USD"

interface CurrencyContextType {
  currency: DisplayCurrency
  setCurrency: (currency: DisplayCurrency) => void
  symbol: string
  exchangeRate: number
  convertAmount: (amountInUSD: number) => number
  formatAmount: (amountInUSD: number) => string
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const currency: DisplayCurrency = "USD"
  const symbol = "$"

  const setCurrency = (_next?: DisplayCurrency) => {
    // FairWork operates strictly in US Dollars
  }

  const convertAmount = (amountInUSD: number): number => {
    return amountInUSD
  }

  const formatAmount = (amountInUSD: number): string => {
    return formatCurrency(amountInUSD)
  }

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        symbol,
        exchangeRate: 1,
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
