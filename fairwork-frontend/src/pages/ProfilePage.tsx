import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiDollarSign,
  FiFolder,
  FiMapPin,
  FiSettings,
  FiStar,
} from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Card, CardContent } from "@/components/ui/Card"
import { Avatar } from "@/components/ui/Avatar"
import { WalletAddress } from "@/components/common/WalletAddress"
import { MetricCard } from "@/components/common/MetricCard"
import { cn } from "@/lib/utils"
import { getMilestonesForProject, projects } from "@/data/projects"
import { users } from "@/data/users"
import { formatCurrency, formatDate } from "@/lib/format"
 
// TODO: replace with the real authenticated user once session/auth
// context exists (only services/authApi.ts is wired up so far).
const CURRENT_USER_ID = "usr_client_01"
 
export function ProfilePage() {
  const navigate = useNavigate()
  const currentUser = users.find((u) => u.id === CURRENT_USER_ID)
 
  const isClient = currentUser?.role === "client"
 
  const myProjects = useMemo(() => {
    if (!currentUser) return []
    return projects.filter((p) =>
      isClient ? p.clientId === currentUser.id : p.freelancerId === currentUser.id,
    )
  }, [currentUser, isClient])
 
  const completedCount = myProjects.filter((p) => p.status === "completed").length
  const activeCount = myProjects.filter((p) =>
    ["funding", "active", "in_review"].includes(p.status),
  ).length
 
  const totalReleased = useMemo(() => {
    return myProjects.reduce((sum, project) => {
      const released = getMilestonesForProject(project.id)
        .filter((m) => m.status === "released")
        .reduce((s, m) => s + m.amount, 0)
      return sum + released
    }, 0)
  }, [myProjects])
 
  if (!currentUser) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-muted">No profile found.</p>
      </div>
    )
  }
 
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        {/* Identity header */}
        <Card>
          <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start">
            <Avatar name={currentUser.name} src={currentUser.avatarUrl} size="lg" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  {currentUser.name}
                </h1>
                {currentUser.verified && (
                  <Badge tone="success" dot>
                    Verified
                  </Badge>
                )}
                <Badge tone="neutral">
                  {isClient ? "Client" : "Freelancer"}
                </Badge>
              </div>
 
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                {currentUser.title && (
                  <span className="flex items-center gap-1.5">
                    <FiBriefcase className="h-3.5 w-3.5 text-subtle" />
                    {currentUser.title}
                  </span>
                )}
                {currentUser.location && (
                  <span className="flex items-center gap-1.5">
                    <FiMapPin className="h-3.5 w-3.5 text-subtle" />
                    {currentUser.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <FiCalendar className="h-3.5 w-3.5 text-subtle" />
                  Member since {formatDate(currentUser.joinedAt)}
                </span>
              </div>
 
              <WalletAddress address={currentUser.walletAddress} className="w-fit" />
            </div>
 
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FiSettings className="h-4 w-4" />}
              onClick={() => navigate("/settings")}
            >
              Edit in settings
            </Button>
          </CardContent>
        </Card>
 
        {/* Reputation */}
        <Card>
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold tabular-nums text-foreground">
                {currentUser.rating.toFixed(1)}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <FiStar
                      key={n}
                      className={cn(
                        "h-4 w-4",
                        n <= Math.round(currentUser.rating)
                          ? "fill-current text-warning"
                          : "text-subtle",
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs text-subtle">
                  {currentUser.reviewCount} review{currentUser.reviewCount !== 1 ? "s" : ""} on-chain
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
 
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard label="Active projects" value={String(activeCount)} icon={FiFolder} />
          <MetricCard label="Completed" value={String(completedCount)} icon={FiCheckCircle} />
          <MetricCard
            label={isClient ? "Total spent" : "Total earned"}
            value={formatCurrency(totalReleased)}
            icon={FiDollarSign}
          />
        </div>
      </div>
    </div>
  )
}