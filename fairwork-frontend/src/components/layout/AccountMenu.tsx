import { useNavigate } from "react-router-dom"
import { FiHelpCircle, FiLogOut, FiSettings, FiUser, FiAlertTriangle, FiCheck } from "react-icons/fi"
import { Avatar } from "@/components/ui/Avatar"
import { Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui/Dropdown"
import { useAuth } from "@/context/AuthContext"

/**
 * Reads the real logged-in user from AuthContext.
 * Renders user info, role, and subtle email verification badge.
 */
export function AccountMenu() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <Dropdown
      trigger={
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-elevated transition-colors"
          aria-label="Account menu"
        >
          <div className="relative">
            <Avatar name={user.name} size="sm" />
            {!user.isEmailVerified && (
              <span
                className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-surface"
                title="Email unverified"
              />
            )}
          </div>
          <span className="hidden text-left sm:block">
            <span className="flex items-center gap-1.5 text-sm font-medium leading-tight text-foreground">
              <span>{user.name}</span>
              {!user.isEmailVerified && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Unverified
                </span>
              )}
            </span>
            <span className="block text-xs capitalize leading-tight text-subtle">
              {user.role}
            </span>
          </span>
        </button>
      }
      menuClassName="w-56"
    >
      <div className="px-3 py-2">
        <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
        <p className="truncate text-xs text-subtle">{user.email}</p>
        {!user.isEmailVerified ? (
          <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
            <FiAlertTriangle className="h-3 w-3 shrink-0" />
            <span>Email Unverified</span>
          </div>
        ) : (
          <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            <FiCheck className="h-3 w-3 shrink-0" />
            <span>Email Verified</span>
          </div>
        )}
      </div>
      <DropdownSeparator />
      <DropdownItem icon={<FiUser className="h-4 w-4" />} onSelect={() => navigate("/profile")}>
        Profile
      </DropdownItem>
      <DropdownItem icon={<FiSettings className="h-4 w-4" />} onSelect={() => navigate("/settings")}>
        Settings
      </DropdownItem>
      <DropdownItem
        icon={<FiHelpCircle className="h-4 w-4" />}
        onSelect={() => navigate("/help")}
      >
        Help Center
      </DropdownItem>
      <DropdownSeparator />
      <DropdownItem icon={<FiLogOut className="h-4 w-4" />} tone="danger" onSelect={logout}>
        Log out
      </DropdownItem>
    </Dropdown>
  )
}