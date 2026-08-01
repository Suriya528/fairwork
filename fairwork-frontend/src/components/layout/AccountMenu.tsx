import { useNavigate } from "react-router-dom"
import { FiHelpCircle, FiLogOut, FiSettings, FiUser } from "react-icons/fi"
import { Avatar } from "@/components/ui/Avatar"
import { Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui/Dropdown"
import { useAuth } from "@/context/AuthContext"

/**
 * Reads the real logged-in user from AuthContext (was data/users.ts's
 * dummy `currentUser` before). Purely a display + logout concern — no
 * business-data filtering here, so this one was safe to switch over.
 */
export function AccountMenu() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // AccountMenu only renders inside ProtectedRoute-gated AppLayout, so
  // `user` is guaranteed non-null in practice — this is just for TS.
  if (!user) return null

  return (
    <Dropdown
      trigger={
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 hover:bg-elevated"
          aria-label="Account menu"
        >
          <Avatar name={user.name} size="sm" />
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-medium leading-tight text-foreground">
              {user.name}
            </span>
            <span className="block text-xs capitalize leading-tight text-subtle">
              {user.role}
            </span>
          </span>
        </button>
      }
      menuClassName="w-56"
    >
      <div className="px-2.5 py-2">
        <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
        <p className="truncate text-xs text-subtle">{user.email}</p>
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