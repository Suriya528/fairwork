import { useEffect, useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  FiCalendar,
  FiCheckCircle,
  FiDollarSign,
  FiFolder,
  FiSettings,
  FiStar,
  FiShield,
  FiGlobe,
  FiGithub,
  FiLinkedin,
  FiAward,
  FiExternalLink,
} from "react-icons/fi"
import { Avatar } from "@/components/ui/Avatar"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { MetricCard } from "@/components/common/MetricCard"
import { WalletAddress } from "@/components/common/WalletAddress"
import { useAuth } from "@/context/AuthContext"
import { useCurrency } from "@/context/CurrencyContext"
import { getMyProjects, type ApiProject } from "@/services/projectsApi"
import { getPublicProfile, type UserProfileDTO } from "@/services/userApi"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { getReleasedAmount } from "@/lib/financial"

export function ProfilePage() {
  const { id: paramUserId } = useParams<{ id?: string }>()
  const { user: currentUser, token } = useAuth()
  const { formatAmount } = useCurrency()
  const navigate = useNavigate()

  const [publicData, setPublicData] = useState<UserProfileDTO | null>(null)
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const isPublicView = Boolean(paramUserId && paramUserId !== currentUser?.id)

  useEffect(() => {
    if (isPublicView && paramUserId) {
      setLoading(true)
      getPublicProfile(paramUserId)
        .then(setPublicData)
        .catch((e: Error) => setError(e.message))
        .finally(() => setLoading(false))
    } else if (token) {
      getMyProjects(token)
        .then(setProjects)
        .catch((e: Error) => setError(e.message))
    }
  }, [paramUserId, isPublicView, token])

  const active = projects.filter((p) => p.status === "in_progress").length
  const completed = projects.filter((p) => p.status === "completed").length
  const total = useMemo(() => projects.reduce((s, p) => s + getReleasedAmount(p), 0), [projects])

  const displayUser = isPublicView && publicData ? publicData.user : currentUser
  const userRating = displayUser ? ("rating" in displayUser ? displayUser.rating : displayUser.reputationScore) || 0 : 0
  const userReviewCount = displayUser ? ("reviewCount" in displayUser ? displayUser.reviewCount : displayUser.totalReviews) || 0 : 0

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-muted">
        Loading Web3 profile reputation matrix...
      </div>
    )
  }

  if (!displayUser) {
    return (
      <div className="p-8 text-center text-sm text-danger">
        {error || "User profile not found."}
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        {error && <p className="text-sm text-danger">{error}</p>}

        {/* Profile Card Header */}
        <Card>
          <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start">
            <Avatar name={displayUser.name} src={displayUser.avatarUrl} size="lg" />
            <div className="flex flex-1 flex-col gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">{displayUser.name}</h1>
                <Badge tone="primary">{displayUser.role === "client" ? "Client" : "Freelancer"}</Badge>
                {displayUser.walletAddress && (
                  <Badge tone="success" className="text-[10px] gap-1 font-mono">
                    <FiShield className="h-3 w-3" />
                    Cryptographically Verified
                  </Badge>
                )}
              </div>

              {displayUser.bio && (
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                  {displayUser.bio}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-muted flex-wrap">
                <span className="flex items-center gap-1.5">
                  <FiCalendar className="text-primary-400" />
                  Member since {displayUser.createdAt ? formatDate(displayUser.createdAt) : "—"}
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <FiAward className="h-3.5 w-3.5" />
                  100% Clean Escrow History
                </span>
              </div>

              {displayUser.walletAddress && (
                <div className="mt-1">
                  <WalletAddress address={displayUser.walletAddress} className="w-fit" />
                </div>
              )}

              {/* Social Links (Self-Reported) */}
              <div className="flex items-center gap-3 pt-2">
                {displayUser.portfolio && (
                  <a
                    href={displayUser.portfolio}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-primary-400 hover:underline"
                  >
                    <FiGlobe className="h-3.5 w-3.5" /> Portfolio <FiExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
                {displayUser.githubUrl && (
                  <a
                    href={displayUser.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-muted hover:text-foreground"
                  >
                    <FiGithub className="h-3.5 w-3.5" /> GitHub
                  </a>
                )}
                {displayUser.linkedinUrl && (
                  <a
                    href={displayUser.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-muted hover:text-foreground"
                  >
                    <FiLinkedin className="h-3.5 w-3.5" /> LinkedIn
                  </a>
                )}
              </div>
            </div>

            {!isPublicView && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<FiSettings />}
                onClick={() => navigate("/settings")}
              >
                Edit Profile &amp; Settings
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Skills Matrix Card */}
        {displayUser.skills && displayUser.skills.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Verified &amp; Endorsed Skills</span>
                <span className="text-[10px] text-muted font-normal uppercase">Self-Reported &amp; Verified</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <div className="flex flex-wrap gap-2">
                {displayUser.skills.map((skill: string, idx: number) => (
                  <Badge
                    key={idx}
                    tone="neutral"
                    className="bg-secondary/50 border-border/80 text-foreground px-3 py-1 text-xs"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rating Breakdown & Reputation Card */}
        <Card>
          <CardContent className="flex items-center gap-6 p-6">
            <div className="text-4xl font-extrabold text-foreground font-mono">
              {userRating.toFixed(1)}
            </div>
            <div>
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <FiStar
                    key={n}
                    className={cn(
                      "h-4 w-4",
                      n <= Math.round(userRating) ? "fill-current text-warning" : "text-subtle",
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-subtle font-medium">
                {userReviewCount} client reviews &amp; verified milestone ratings
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Active projects"
            value={String(isPublicView && publicData ? publicData.completedProjectsCount : active)}
            icon={FiFolder}
          />
          <MetricCard
            label="Completed Milestones"
            value={String(isPublicView && publicData ? publicData.verifiedMilestonesCompleted : completed)}
            icon={FiCheckCircle}
          />
          <MetricCard
            label={displayUser.role === "client" ? "Total spent" : "Total earned"}
            value={formatAmount(isPublicView ? 0 : total)}
            icon={FiDollarSign}
          />
        </div>
      </div>
    </div>
  )
}
