import { FiSearch, FiMenu } from "react-icons/fi"
import { WalletAddress } from "@/components/common/WalletAddress"
import { NotificationBell } from "./NotificationBell"
import { AccountMenu } from "./AccountMenu"
import { useAuth } from "@/context/AuthContext"

interface TopbarProps {
  onOpenMobileNav: () => void
}

/** Sticky top bar with search, wallet, notifications, and the current user. */
export function Topbar({ onOpenMobileNav }: TopbarProps) {
  const { user } = useAuth()

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
        {/* A real user may not have connected a wallet yet — unlike the
            dummy data, walletAddress can legitimately be empty now. */}
        {user?.walletAddress && (
          <WalletAddress address={user.walletAddress} className="hidden md:inline-flex" />
        )}
        <NotificationBell />
        <AccountMenu />
      </div>
    </header>
  )
}