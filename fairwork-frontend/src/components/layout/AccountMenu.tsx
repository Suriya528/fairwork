import { useNavigate } from "react-router-dom"
import { FiCreditCard, FiHelpCircle, FiLogOut, FiSettings, FiUser } from "react-icons/fi"
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
          </div>
          <span className="hidden text-left sm:block">
            <span className="flex items-center gap-1.5 text-sm font-medium leading-tight text-foreground">
              <span>{user.name}</span>
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
      </div>
      <DropdownSeparator />
      <DropdownItem icon={<FiUser className="h-4 w-4" />} onSelect={() => navigate("/profile")}>
        Profile
      </DropdownItem>
      {user.role !== "admin" && (
        <DropdownItem icon={<FiCreditCard className="h-4 w-4" />} onSelect={() => navigate("/wallet")}>
          Wallet &amp; Escrow
        </DropdownItem>
      )}
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