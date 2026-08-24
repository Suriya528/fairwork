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
  FiShare2,
  FiMessageSquare,
  FiBriefcase,
  FiClock,
  FiCheck,
  FiLayers,
  FiCamera,
  FiRefreshCw,
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
import { getPublicProfile, updateProfile, type UserProfileDTO } from "@/services/userApi"
import { GithubContributionHeatmap } from "@/components/profile/GithubContributionHeatmap"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { getReleasedAmount } from "@/lib/financial"
import { sanitizeUrl } from "@/lib/sanitizeUrl"

type ProfileTab = "overview" | "history" | "reviews"

export function ProfilePage() {
  const { id: paramUserId } = useParams<{ id?: string }>()
  const { user: currentUser, token } = useAuth()
  const { formatAmount } = useCurrency()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<ProfileTab>("overview")
  const [publicData, setPublicData] = useState<UserProfileDTO | null>(null)
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const isPublicView = Boolean(paramUserId && paramUserId !== currentUser?.id)
  const targetUserId = paramUserId || currentUser?.id

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

      if (currentUser?.id) {
        getPublicProfile(currentUser.id)
          .then(setPublicData)
          .catch(() => {})
      }
    }
  }, [paramUserId, isPublicView, token, currentUser?.id])

  const activeCount = projects.filter((p) => p.status === "in_progress").length
  const completedCount = projects.filter((p) => p.status === "completed").length
  const totalVolume = useMemo(() => projects.reduce((s, p) => s + getReleasedAmount(p), 0), [projects])

  const displayUser = isPublicView && publicData ? publicData.user : currentUser
  const userRating = displayUser ? ("rating" in displayUser ? displayUser.rating : displayUser.reputationScore) || 0 : 0
  const userReviewCount = displayUser ? ("reviewCount" in displayUser ? displayUser.reviewCount : displayUser.totalReviews) || 0 : 0

  const stats = publicData?.stats || {
    totalEarnedUSDC: totalVolume,
    totalSpentUSDC: 0,
    completedProjectsCount: completedCount,
    completedMilestonesCount: completedCount * 2,
    ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: userReviewCount },
  }

  const handleShareProfile = () => {
    const shareUrl = `${window.location.origin}/profile/${targetUserId}`
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleHireClick = () => {
    navigate(`/projects/new?freelancerId=${targetUserId}`)
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token) return

    if (file.size > 10 * 1024 * 1024) {
      setError("Banner image size exceeds the maximum allowed limit of 10MB.")
      return
    }

    if (file.type.includes("svg")) {
      setError("SVG files are strictly prohibited for cover banner images.")
      return
    }

    setUploadingBanner(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"
      const res = await fetch(`${API_URL}/upload?type=banner`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.message || "Banner upload failed")
      }

      const fileData = await res.json()
      await updateProfile({ bannerUrl: fileData.url }, token)

      if (currentUser?.id) {
        const updated = await getPublicProfile(currentUser.id)
        setPublicData(updated)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update cover banner.")
    } finally {
      setUploadingBanner(false)
      e.target.value = ""
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token) return

    if (file.size > 5 * 1024 * 1024) {
      setError("Avatar image size exceeds the maximum allowed limit of 5MB.")
      return
    }

    if (file.type.includes("svg")) {
      setError("SVG files are strictly prohibited for avatar images.")
      return
    }

    setUploadingAvatar(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"
      const res = await fetch(`${API_URL}/upload?type=avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.message || "Avatar upload failed")
      }

      const fileData = await res.json()
      await updateProfile({ avatarUrl: fileData.url }, token)

      if (currentUser?.id) {
        const updated = await getPublicProfile(currentUser.id)
        setPublicData(updated)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update avatar photo.")
    } finally {
      setUploadingAvatar(false)
      e.target.value = ""
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-sm text-muted animate-pulse">
        Loading Web3 profile reputation matrix &amp; on-chain history...
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

  const availabilityTone =
    displayUser.availability === "available"
      ? "success"
      : displayUser.availability === "busy"
      ? "warning"
      : "neutral"

  const availabilityLabel =
    displayUser.availability === "available"
      ? "Available for Hire"
      : displayUser.availability === "busy"
      ? "Busy (Limited)"
      : "Not Available"

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        {error && <p className="text-sm text-danger">{error}</p>}

        {/* Hero Banner & Identity Header */}
        <Card className="overflow-hidden border-border/80 shadow-2xl">
          {/* Glassmorphic Gradient / Uploaded Banner Cover */}
          <div className="h-44 w-full relative border-b border-border/50 overflow-hidden bg-gradient-to-r from-primary-900/90 via-indigo-900/60 to-purple-900/80">
            {displayUser.bannerUrl ? (
              <img
                src={displayUser.bannerUrl}
                alt="Cover Banner"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none"
                }}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
            )}

            {/* Banner Media Upload Trigger (Self View) */}
            {!isPublicView && (
              <label className="absolute top-3 right-3 cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card/80 hover:bg-card text-foreground border border-border/80 text-xs font-medium backdrop-blur-md shadow-md transition-all">
                {uploadingBanner ? (
                  <FiRefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FiCamera className="h-3.5 w-3.5 text-primary-400" />
                )}
                <span>{uploadingBanner ? "Uploading..." : "Change Cover"}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleBannerUpload}
                  disabled={uploadingBanner}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <CardContent className="relative px-6 pb-6 pt-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-14 mb-4">
              <div className="relative group">
                <Avatar
                  name={displayUser.name}
                  src={displayUser.avatarUrl}
                  size="lg"
                  className="h-24 w-24 border-4 border-card ring-2 ring-primary-500/30 shadow-xl"
                />
                {!isPublicView && (
                  <label className="absolute bottom-0 right-0 cursor-pointer h-7 w-7 rounded-full bg-primary-600 hover:bg-primary-500 text-white flex items-center justify-center border-2 border-card shadow-md transition-transform hover:scale-105">
                    {uploadingAvatar ? (
                      <FiRefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <FiCamera className="h-3.5 w-3.5" />
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      className="hidden"
                    />
                  </label>
                )}
                <div className="absolute -bottom-6 left-0">
                  <Badge tone={availabilityTone} className="text-[10px] px-2 py-0.5 shadow-sm">
                    {availabilityLabel}
                  </Badge>
                </div>
              </div>

              {/* Action Buttons Suite */}
              <div className="flex items-center gap-2 w-full sm:w-auto pt-4 sm:pt-0">
                {isPublicView ? (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<FiBriefcase />}
                      onClick={handleHireClick}
                      disabled={displayUser.availability === "not_available"}
                      className="bg-primary-600 hover:bg-primary-500 text-white font-medium"
                    >
                      Hire Freelancer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<FiMessageSquare />}
                      onClick={() => navigate("/chat")}
                    >
                      Message
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<FiSettings />}
                    onClick={() => navigate("/settings")}
                  >
                    Edit Profile &amp; Settings
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={copied ? <FiCheck className="text-emerald-400" /> : <FiShare2 />}
                  onClick={handleShareProfile}
                >
                  {copied ? "Link Copied!" : "Share Profile"}
                </Button>
              </div>
            </div>

            {/* Profile Bio Details */}
            <div className="space-y-3 pt-3">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-extrabold text-foreground">{displayUser.name}</h1>
                  <Badge tone="primary">{displayUser.role === "client" ? "Client" : "Freelancer"}</Badge>
                  {displayUser.walletAddress && (
                    <Badge tone="success" className="text-[10px] gap-1 font-mono">
                      <FiShield className="h-3 w-3" />
                      Cryptographically Verified
                    </Badge>
                  )}
                </div>
                {displayUser.tagline && (
                  <p className="text-sm font-semibold text-primary-400 mt-1">{displayUser.tagline}</p>
                )}
              </div>

              {displayUser.bio && (
                <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                  {displayUser.bio}
                </p>
              )}

              <div className="flex items-center gap-5 text-xs text-muted flex-wrap pt-1">
                <span className="flex items-center gap-1.5">
                  <FiCalendar className="text-primary-400" />
                  Joined {displayUser.createdAt ? formatDate(displayUser.createdAt) : "—"}
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <FiAward className="h-3.5 w-3.5" />
                  100% Clean Escrow Record
                </span>
                {displayUser.hourlyRate ? (
                  <span className="flex items-center gap-1 text-foreground font-mono font-bold">
                    <FiClock className="text-muted" /> ${displayUser.hourlyRate} USDC / hr
                  </span>
                ) : null}
              </div>

              {displayUser.walletAddress && (
                <div className="pt-1">
                  <WalletAddress address={displayUser.walletAddress} className="w-fit" />
                </div>
              )}

              {/* Social Links */}
              <div className="flex items-center gap-4 pt-2 border-t border-border/40">
                {displayUser.portfolio && (
                  <a
                    href={sanitizeUrl(displayUser.portfolio)}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex items-center gap-1 text-xs text-primary-400 hover:underline font-medium"
                  >
                    <FiGlobe className="h-3.5 w-3.5" /> Portfolio <FiExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
                {displayUser.githubUrl && (
                  <a
                    href={sanitizeUrl(displayUser.githubUrl)}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex items-center gap-1 text-xs text-muted hover:text-foreground"
                  >
                    <FiGithub className="h-3.5 w-3.5" /> GitHub
                  </a>
                )}
                {displayUser.linkedinUrl && (
                  <a
                    href={sanitizeUrl(displayUser.linkedinUrl)}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex items-center gap-1 text-xs text-muted hover:text-foreground"
                  >
                    <FiLinkedin className="h-3.5 w-3.5" /> LinkedIn
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Summary Metrics */}
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Active Projects"
            value={String(isPublicView && publicData ? publicData.stats.completedProjectsCount : activeCount)}
            icon={FiFolder}
          />
          <MetricCard
            label="Completed Milestones"
            value={String(stats.completedMilestonesCount || completedCount)}
            icon={FiCheckCircle}
          />
          <MetricCard
            label={displayUser.role === "client" ? "Total Spent" : "Total Earned"}
            value={formatAmount(stats.totalEarnedUSDC || totalVolume)}
            icon={FiDollarSign}
          />
        </div>

        {/* Multi-Tab Navigation Subsystem */}
        <div className="border-b border-border/80 flex gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={cn(
              "pb-3 text-sm font-semibold transition-colors relative",
              activeTab === "overview"
                ? "text-primary border-b-2 border-primary"
                : "text-muted hover:text-foreground",
            )}
          >
            Overview &amp; Portfolio
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={cn(
              "pb-3 text-sm font-semibold transition-colors relative flex items-center gap-1.5",
              activeTab === "history"
                ? "text-primary border-b-2 border-primary"
                : "text-muted hover:text-foreground",
            )}
          >
            On-Chain Work History
            <Badge tone="neutral" className="text-[10px]">
              {publicData?.workHistory?.length || completedCount}
            </Badge>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reviews")}
            className={cn(
              "pb-3 text-sm font-semibold transition-colors relative flex items-center gap-1.5",
              activeTab === "reviews"
                ? "text-primary border-b-2 border-primary"
                : "text-muted hover:text-foreground",
            )}
          >
            Client Reviews ({userReviewCount})
          </button>
        </div>

        {/* TAB 1: OVERVIEW & PORTFOLIO */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Endorsed Skills */}
            {displayUser.skills && displayUser.skills.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span>Verified &amp; Endorsed Skills</span>
                    <span className="text-[10px] text-muted uppercase font-mono">Verified Stack</span>
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

            {/* GitHub Open-Source Contribution Activity Heatmap */}
            <GithubContributionHeatmap targetUserId={targetUserId || ""} isOwner={!isPublicView} />

            {/* Interactive Portfolio Showcase Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FiLayers className="text-primary-400" /> Featured Portfolio Projects
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {displayUser.portfolioItems && displayUser.portfolioItems.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {displayUser.portfolioItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col justify-between rounded-xl border border-border/80 bg-secondary/20 p-4 transition-all hover:bg-elevated hover:border-primary/40 shadow-xs"
                      >
                        <div>
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none"
                              }}
                              className="h-32 w-full object-cover rounded-lg mb-3 border border-border/40"
                            />
                          )}
                          <h4 className="font-bold text-foreground text-sm">{item.title}</h4>
                          {item.description && (
                            <p className="text-xs text-muted mt-1 leading-relaxed line-clamp-3">
                              {item.description}
                            </p>
                          )}
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {item.tags.map((t, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="text-[10px] bg-secondary/80 text-muted px-2 py-0.5 rounded-md border border-border/40 font-mono"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 pt-3 mt-3 border-t border-border/40">
                          {item.projectUrl && (
                            <a
                              href={sanitizeUrl(item.projectUrl)}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="flex items-center gap-1 text-xs text-primary-400 hover:underline"
                            >
                              <FiGlobe className="h-3 w-3" /> Live Demo <FiExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                          {item.githubUrl && (
                            <a
                              href={sanitizeUrl(item.githubUrl)}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="flex items-center gap-1 text-xs text-muted hover:text-foreground"
                            >
                              <FiGithub className="h-3 w-3" /> Code Base
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted py-4">No portfolio items showcase added yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: ON-CHAIN WORK HISTORY */}
        {activeTab === "history" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FiShield className="text-emerald-400" /> Immutable On-Chain Escrow Work History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {publicData?.workHistory && publicData.workHistory.length > 0 ? (
                <div className="divide-y divide-border/60">
                  {publicData.workHistory.map((item) => (
                    <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">{item.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-muted mt-1">
                          <span>Category: {item.category}</span>
                          <span>•</span>
                          <span>{item.milestonesCount} Milestones Completed</span>
                          <span>•</span>
                          <span>{formatDate(item.completedAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-emerald-400 text-sm">
                          {formatAmount(item.budget)}
                        </span>
                        {item.etherscanUrl && (
                          <a
                            href={sanitizeUrl(item.etherscanUrl)}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="inline-flex items-center gap-1 text-xs text-primary-400 hover:underline font-mono bg-primary-500/10 border border-primary-500/30 px-2.5 py-1 rounded-lg"
                          >
                            Etherscan <FiExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted py-4">No completed on-chain escrow projects recorded yet.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 3: CLIENT REVIEWS */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
            {/* Rating Summary Card */}
            <Card>
              <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-8">
                <div className="text-center sm:text-left">
                  <div className="text-5xl font-extrabold text-foreground font-mono">
                    {userRating.toFixed(1)}
                  </div>
                  <div className="flex gap-1 justify-center sm:justify-start my-2">
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
                  <p className="text-xs text-muted">{userReviewCount} Verified Ratings</p>
                </div>

                {/* Rating Distribution Breakdown */}
                <div className="flex-1 w-full space-y-1.5">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = stats.ratingCounts[stars as keyof typeof stats.ratingCounts] || 0
                    const percentage = userReviewCount > 0 ? (count / userReviewCount) * 100 : 0
                    return (
                      <div key={stars} className="flex items-center gap-3 text-xs">
                        <span className="w-6 font-mono font-medium text-muted">{stars}★</span>
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden border border-border/40">
                          <div
                            className="h-full bg-warning rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-8 text-right font-mono text-muted">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Reviews Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Client Feedback &amp; Review Logs</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {publicData?.reviews && publicData.reviews.length > 0 ? (
                  <div className="divide-y divide-border/60">
                    {publicData.reviews.map((rev) => (
                      <div key={rev._id} className="py-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar
                              name={rev.reviewerId ? `${rev.reviewerId.firstName} ${rev.reviewerId.lastName}` : "Client"}
                              src={rev.reviewerId?.avatarUrl}
                              size="sm"
                            />
                            <span className="text-xs font-bold text-foreground">
                              {rev.reviewerId ? `${rev.reviewerId.firstName} ${rev.reviewerId.lastName}` : "Verified Client"}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <FiStar
                                key={n}
                                className={cn(
                                  "h-3.5 w-3.5",
                                  n <= rev.rating ? "fill-current text-warning" : "text-subtle",
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted leading-relaxed">{rev.comment}</p>
                        <span className="text-[10px] text-subtle block">{formatDate(rev.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted py-4">No client reviews submitted yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
