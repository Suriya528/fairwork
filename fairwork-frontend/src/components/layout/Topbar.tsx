import { FiSearch, FiMenu } from "react-icons/fi"
import { WalletAddress } from "@/components/common/WalletAddress"
import { ThemeToggle } from "@/components/common/ThemeToggle"
import { AccountMenu } from "./AccountMenu"
import { useAuth } from "@/context/AuthContext"
import { useCurrency } from "@/context/CurrencyContext"

interface TopbarProps {
  onOpenMobileNav: () => void
}

/** Sticky top bar with search, wallet, theme toggle, currency selector, notifications, and user account. */
export function Topbar({ onOpenMobileNav }: TopbarProps) {
  const { user } = useAuth()
  const { currency, setCurrency } = useCurrency()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur-md lg:px-8">
      <button
        type="button"
        onClick={onOpenMobileNav}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-elevated hover:text-foreground lg:hidden"
        aria-label="Open navigation menu"
      >
        <FiMenu className="h-5 w-5" aria-hidden />
      </button>

      <div className="relative hidden max-w-sm flex-1 sm:block">
        <FiSearch
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle"
          aria-hidden
        />
        <input
          type="search"
          placeholder="Search projects, milestones, wallets..."
          className="h-9 w-full rounded-lg border border-border bg-base pl-9 pr-3 text-sm text-foreground placeholder:text-subtle outline-none transition-colors focus:border-border-strong focus:ring-2 focus:ring-ring/40"
          aria-label="Search"
        />
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {user?.walletAddress && (
          <WalletAddress address={user.walletAddress} className="hidden md:inline-flex" />
        )}
        <button
          type="button"
          onClick={() => setCurrency(currency === "INR" ? "USD" : "INR")}
          title={`Switch currency preference (Current: ${currency})`}
          aria-label={`Current display currency: ${currency}. Click to switch to ${currency === "INR" ? "USD" : "INR"}`}
          className="flex h-9 items-center gap-1 rounded-lg border border-border bg-base px-2.5 text-xs font-mono font-bold text-muted transition hover:border-border-strong hover:bg-elevated hover:text-foreground"
        >
          <span>{currency === "INR" ? "₹ INR" : "$ USD"}</span>
        </button>
        <ThemeToggle />
        <AccountMenu />
      </div>
    </header>
  )
}
