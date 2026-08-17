import { FiStar } from "react-icons/fi"
import { Card, CardBody } from "@/components/ui/Card"
import { Avatar } from "@/components/ui/Avatar"
import { Badge } from "@/components/ui/Badge"
import { WalletAddress } from "@/components/common/WalletAddress"
import { useAuth } from "@/context/AuthContext"

/**
 * Small identity card for the signed-in user — reads real session data
 * from AuthContext instead of dummy data/users.ts.
 *
 * Two fields from the dummy version don't exist on the real backend
 * User model and weren't faked:
 *  - `verified` — no such flag on the schema. The checkmark and the
 *    "Verification: Verified/Pending" row are both removed rather than
 *    always showing a state that isn't real.
 *  - `title` (e.g. "Senior Developer") — the schema has no headline
 *    field. Substituted with `bio`, the closest real field serving the
 *    same "short line under the name" role, rather than deleting the
 *    line and changing the card's layout rhythm.
 *
 * Note: the "View profile" button still points at /profile, which is
 * its own separate page not yet migrated off dummy data — clicking it
 * currently lands on a different (fake) user's profile. Not fixed here;
 * that page is outside this module.
 */
export function ProfileSummary() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <Card>
      <CardBody className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} src={user.avatarUrl} size="lg" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{user.name}</p>
            {user.bio && <p className="truncate text-xs text-muted">{user.bio}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone="primary" className="capitalize">
            {user.role}
          </Badge>
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <FiStar className="h-3.5 w-3.5 text-warning" aria-hidden />
            <span className="font-medium tabular-nums text-foreground">
              {user.rating.toFixed(2)}
            </span>
            ({user.reviewCount})
          </span>
        </div>

        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-subtle">Wallet</span>
            {user.walletAddress ? (
              <WalletAddress address={user.walletAddress} />
            ) : (
              <span className="text-xs text-subtle">Not connected</span>
            )}
          </div>
        </div>

      </CardBody>
    </Card>
  )
}
