import { useEffect, useMemo, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  FiCalendar,
  FiCheckCircle,
  FiDollarSign,
  FiFolder,
  FiSettings,
  FiStar,
  FiShield,
  FiArrowRight,
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
  FiEdit3,
  FiPlus,
  FiZap,
  FiX,
} from "react-icons/fi"
import { Avatar } from "@/components/ui/Avatar"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { MetricCard } from "@/components/common/MetricCard"
import { WalletAddress } from "@/components/common/WalletAddress"
import { Modal } from "@/components/ui/Modal"
import { useAuth } from "@/context/AuthContext"
import { useCurrency } from "@/context/CurrencyContext"
import { getMyProjects, type ApiProject } from "@/services/projectsApi"
import { getPublicProfile, updateProfile, type UserProfileDTO, type PortfolioItem } from "@/services/userApi"
import { GithubContributionHeatmap } from "@/components/profile/GithubContributionHeatmap"
import { ProfileEditModal } from "@/components/profile/ProfileEditModal"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { getReleasedAmount } from "@/lib/financial"
import { sanitizeUrl } from "@/lib/sanitizeUrl"
import { getOnChainReputation, reputationAddress } from "@/services/web3"

type ProfileTab = "overview" | "portfolio" | "jobs" | "history" | "reviews"

export function ProfilePage() {
  const { id: paramUserId } = useParams<{ id?: string }>()
  const { user: currentUser, token, refreshUser } = useAuth()
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
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<PortfolioItem | null>(null)

  const isPublicView = Boolean(paramUserId && paramUserId !== currentUser?.id)
  const targetUserId = paramUserId || currentUser?.id

  const loadProfileData = useCallback(async () => {
    if (isPublicView && paramUserId) {
      setLoading(true)
      try {
        const data = await getPublicProfile(paramUserId)
        setPublicData(data)
      } catch (e: any) {
        setError(e.message || "Failed to load public profile")
      } finally {
        setLoading(false)
      }
    } else if (token) {
      try {
        const myProjs = await getMyProjects(token)
        setProjects(myProjs)
      } catch (e: any) {
        setError(e.message || "Failed to fetch user projects")
      }

      if (currentUser?.id) {
        try {
          const data = await getPublicProfile(currentUser.id)
          setPublicData(data)
        } catch {
          // Fallback to auth context
        }
      }
    }
  }, [paramUserId, isPublicView, token, currentUser?.id])

  useEffect(() => {
    loadProfileData()
  }, [loadProfileData])

  const displayUser = isPublicView && publicData ? publicData.user : currentUser
  const isFreelancer = displayUser?.role === "freelancer"
  const isClient = displayUser?.role === "client"
  const isAdmin = displayUser?.role === "admin"

  const activeCount = projects.filter((p) => p.status === "in_progress").length
  const completedCount = projects.filter((p) => p.status === "completed").length
  const totalVolume = useMemo(() => projects.reduce((s, p) => s + getReleasedAmount(p), 0), [projects])

  const userRating = displayUser ? ("rating" in displayUser ? displayUser.rating : displayUser.reputationScore) || 0 : 0
  const userReviewCount = displayUser ? ("reviewCount" in displayUser ? displayUser.reviewCount : displayUser.totalReviews) || 0 : 0

  const [onChainRep, setOnChainRep] = useState<{ average: number; totalReviews: number; isAvailable: boolean }>({
    average: 0,
    totalReviews: 0,
    isAvailable: false,
  })

  useEffect(() => {
    if (displayUser?.walletAddress) {
      getOnChainReputation(displayUser.walletAddress).then((rep) => {
        setOnChainRep(rep)
      })
    }
  }, [displayUser?.walletAddress])

  const stats = publicData?.stats || {
    totalEarnedUSDC: totalVolume,
    totalSpentUSDC: 0,
    completedProjectsCount: completedCount,
    completedMilestonesCount: completedCount * 2,
    ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  }

  const workHistoryList = useMemo(() => {
    if (publicData?.workHistory && publicData.workHistory.length > 0) {
      return publicData.workHistory
    }
    return projects
      .filter((p) => p.status === "completed")
      .map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        budget: p.budget,
        milestonesCount: p.milestones?.length || 0,
        escrowTxnHash: p.escrowTxnHash || "",
        etherscanUrl: p.escrowTxnHash ? `https://sepolia.etherscan.io/tx/${p.escrowTxnHash}` : null,
        completedAt: (p as any).updatedAt || new Date().toISOString(),
      }))
  }, [publicData?.workHistory, projects])

  // Profile completeness calculation for self-view
  const completeness = useMemo(() => {
    if (isPublicView || !currentUser) return 100
    let score = 25 // base registered account
    if (currentUser.avatarUrl) score += 15
    if (currentUser.bio && currentUser.bio.length > 20) score += 20
    if (currentUser.tagline) score += 15
    if (isFreelancer) {
      if (currentUser.skills && currentUser.skills.length > 0) score += 15
      if (currentUser.portfolioItems && currentUser.portfolioItems.length > 0) score += 10
    } else {
      if (currentUser.walletAddress) score += 15
      if (currentUser.portfolio || currentUser.linkedinUrl) score += 10
    }
    return Math.min(100, score)
  }, [isPublicView, currentUser, isFreelancer])

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
      await refreshUser()
      await loadProfileData()
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
      await refreshUser()
      await loadProfileData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update avatar photo.")
    } finally {
      setUploadingAvatar(false)
      e.target.value = ""
    }
  }

  if (loading) {
    return (
      <div className="p-16 text-center text-sm text-muted animate-pulse flex flex-col items-center justify-center gap-3">
        <FiRefreshCw className="h-6 w-6 animate-spin text-primary" />
        <span>Loading verified Web3 profile &amp; on-chain reputation ledger...</span>
      </div>
    )
  }

  if (!displayUser) {
    return (
      <div className="p-12 text-center text-sm text-danger max-w-lg mx-auto bg-danger/10 border border-danger/30 rounded-2xl my-8">
        <p className="font-semibold">{error || "User profile not found."}</p>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="mt-4">
          Return to previous page
        </Button>
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
      ? "Available for Hire • Immediate Start"
      : displayUser.availability === "busy"
      ? "Active in Contracts • Limited Capacity"
      : "Unavailable • Not Taking Work"

  const openProjectsList = publicData?.openProjects || []

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        {error && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="hover:opacity-75">
              <FiX className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* PROFILE COMPLETION NUDGE (Self View Only) */}
        {!isPublicView && completeness < 100 && (
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                {completeness}%
              </div>
              <div>
                <h4 className="font-bold text-foreground text-xs sm:text-sm">
                  Complete your {isFreelancer ? "Freelancer" : "Client"} profile to build marketplace credibility
                </h4>
                <p className="text-[11px] text-muted mt-0.5">
                  {isFreelancer
                    ? "Profiles with a verified bio, headline, and portfolio projects receive 3x more direct hire offers."
                    : "Clients with an organization bio and website receive faster responses from top talent."}
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setEditModalOpen(true)}
              className="whitespace-nowrap shrink-0 text-xs"
            >
              <FiEdit3 className="mr-1.5 h-3.5 w-3.5" /> Complete Profile
            </Button>
          </div>
        )}

        {/* HERO BANNER & IDENTITY STUDIO */}
        <Card className="overflow-hidden border-border/80 shadow-2xl relative">
          {/* Glassmorphic Cover Banner */}
          <div className="h-48 sm:h-56 w-full relative border-b border-border/60 overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950">
            {displayUser.bannerUrl ? (
              <img
                src={displayUser.bannerUrl}
                alt="Cover Banner"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = "none"
                }}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px] opacity-25" />
            )}

            {/* Banner Network & Escrow Status Pill */}
            <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/70 border border-white/10 text-[11px] font-mono text-emerald-400 backdrop-blur-md shadow-lg">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sepolia Network • Non-Custodial Escrow</span>
            </div>

            {/* Banner Media Upload Trigger (Self View) */}
            {!isPublicView && (
              <label className="absolute top-4 right-4 cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white border border-white/15 text-xs font-medium backdrop-blur-md shadow-lg transition-all hover:scale-105">
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

          <CardContent className="relative px-6 sm:px-8 pb-7 pt-0">
            {/* Avatar & Floating Header Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-5">
              <div className="relative group">
                <Avatar
                  name={displayUser.name}
                  src={displayUser.avatarUrl}
                  size="lg"
                  className="h-28 w-28 sm:h-32 sm:w-32 border-4 border-card ring-4 ring-primary-500/20 shadow-2xl rounded-2xl object-cover"
                />
                {!isPublicView && (
                  <label className="absolute bottom-1 right-1 cursor-pointer h-8 w-8 rounded-xl bg-primary-600 hover:bg-primary-500 text-white flex items-center justify-center border-2 border-card shadow-lg transition-transform hover:scale-110">
                    {uploadingAvatar ? (
                      <FiRefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <FiCamera className="h-4 w-4" />
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
              </div>

              {/* Action Suite (Hire, Message, Edit, Share) */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto pt-2 sm:pt-0 flex-wrap">
                {isPublicView ? (
                  <>
                    {isFreelancer && (
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<FiBriefcase />}
                        onClick={handleHireClick}
                        disabled={displayUser.availability === "not_available"}
                        className="bg-primary-600 hover:bg-primary-500 text-white font-semibold shadow-md px-4"
                      >
                        Hire Freelancer
                      </Button>
                    )}
                    {isClient && openProjectsList.length > 0 && (
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<FiFolder />}
                        onClick={() => setActiveTab("jobs")}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md px-4"
                      >
                        View Open Jobs ({openProjectsList.length})
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<FiMessageSquare />}
                      onClick={() => navigate("/chat")}
                      className="border-border/80"
                    >
                      Message
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<FiEdit3 />}
                      onClick={() => setEditModalOpen(true)}
                      className="bg-primary-600 hover:bg-primary-500 text-white font-semibold shadow-md"
                    >
                      Edit Profile
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<FiSettings />}
                      onClick={() => navigate("/settings")}
                      className="border-border/80"
                    >
                      Settings
                    </Button>
                  </>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={copied ? <FiCheck className="text-emerald-400" /> : <FiShare2 />}
                  onClick={handleShareProfile}
                  className="border-border/80"
                >
                  {copied ? "Link Copied!" : "Share Profile"}
                </Button>
              </div>
            </div>

            {/* Profile Bio & Credential Details */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    {displayUser.name}
                  </h1>

                  {/* Role Badge */}
                  <Badge
                    tone={isAdmin ? "warning" : isClient ? "primary" : "neutral"}
                    className={cn(
                      "text-xs px-2.5 py-0.5 font-bold shadow-xs",
                      isClient && "bg-indigo-500/15 border-indigo-500/30 text-indigo-400",
                      isFreelancer && "bg-blue-500/15 border-blue-500/30 text-blue-400",
                    )}
                  >
                    {isAdmin
                      ? "Platform Administrator"
                      : isClient
                      ? "Client"
                      : "Freelancer"}
                  </Badge>

                  {displayUser.walletAddress && (
                    <Badge tone="success" className="text-[10px] gap-1 font-mono">
                      <FiShield className="h-3 w-3" />
                      Cryptographically Verified
                    </Badge>
                  )}

                  {/* Availability or Guarantee Pill */}
                  {isFreelancer ? (
                    <Badge tone={availabilityTone} className="text-[11px] gap-1 px-2.5 py-0.5">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          displayUser.availability === "available"
                            ? "bg-emerald-400 animate-pulse"
                            : displayUser.availability === "busy"
                            ? "bg-amber-400"
                            : "bg-slate-400",
                        )}
                      />
                      {availabilityLabel}
                    </Badge>
                  ) : (
                    <Badge tone="success" className="text-[11px] gap-1 px-2.5 py-0.5 font-medium">
                      <FiShield className="h-3 w-3" />
                      100% Escrow Funded Guarantee
                    </Badge>
                  )}

                  {/* On-Chain Rating Badge */}
                  {onChainRep.isAvailable && onChainRep.totalReviews > 0 && reputationAddress && (
                    <a
                      href={`https://sepolia.etherscan.io/address/${reputationAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex"
                    >
                      <Badge tone="primary" className="text-[11px] gap-1 font-mono hover:underline cursor-pointer">
                        <FiStar className="h-3 w-3 fill-amber-400 text-amber-400" />
                        On-Chain: {onChainRep.average.toFixed(2)} ★ ({onChainRep.totalReviews})
                        <FiExternalLink className="h-2.5 w-2.5 ml-0.5 opacity-70" />
                      </Badge>
                    </a>
                  )}
                </div>

                {/* Professional Tagline */}
                {displayUser.tagline ? (
                  <p className="text-sm sm:text-base font-semibold text-primary-400 mt-1.5">
                    {displayUser.tagline}
                  </p>
                ) : !isPublicView ? (
                  <p
                    onClick={() => setEditModalOpen(true)}
                    className="text-xs text-muted hover:text-primary cursor-pointer mt-1 flex items-center gap-1 italic"
                  >
                    <FiPlus className="h-3 w-3" /> Add a headline tagline (e.g. "Senior Smart Contract Engineer")
                  </p>
                ) : null}
              </div>

              {/* Bio Summary */}
              {displayUser.bio ? (
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl whitespace-pre-line">
                  {displayUser.bio}
                </p>
              ) : !isPublicView ? (
                <div
                  onClick={() => setEditModalOpen(true)}
                  className="p-3.5 rounded-xl border border-dashed border-border/80 bg-secondary/20 hover:bg-secondary/40 cursor-pointer transition-colors text-xs text-muted max-w-2xl"
                >
                  <p className="font-medium text-foreground">Write your professional bio</p>
                  <p className="text-[11px] text-subtle mt-0.5">
                    Highlight your background, core specialties, and past achievements to build client trust.
                  </p>
                </div>
              ) : null}

              {/* Meta Credentials Grid */}
              <div className="flex items-center gap-5 text-xs text-muted flex-wrap pt-1 border-t border-border/40">
                <span className="flex items-center gap-1.5">
                  <FiCalendar className="text-primary-400" />
                  Member since {displayUser.createdAt ? formatDate(displayUser.createdAt) : "—"}
                </span>

                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <FiAward className="h-3.5 w-3.5" />
                  Clean Escrow Record (0 Disputes)
                </span>

                {isFreelancer && displayUser.hourlyRate ? (
                  <span className="flex items-center gap-1 text-foreground font-mono font-bold">
                    <FiClock className="text-muted" /> ${displayUser.hourlyRate} USDC / hr
                  </span>
                ) : null}

                {isClient && (
                  <span className="flex items-center gap-1 text-foreground font-mono font-bold">
                    <FiDollarSign className="text-muted" /> Sepolia Settlement Verified
                  </span>
                )}
              </div>

              {/* Cryptographic Wallet Address */}
              {displayUser.walletAddress && (
                <div className="pt-0.5">
                  <WalletAddress address={displayUser.walletAddress} className="w-fit" />
                </div>
              )}

              {/* Social & Web Presence Links */}
              <div className="flex items-center gap-4 pt-2.5 border-t border-border/40 flex-wrap">
                {displayUser.portfolio && (
                  <a
                    href={sanitizeUrl(displayUser.portfolio)}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex items-center gap-1 text-xs text-primary-400 hover:underline font-medium"
                  >
                    <FiGlobe className="h-3.5 w-3.5" /> Portfolio Website <FiExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
                {displayUser.githubUrl && (
                  <a
                    href={sanitizeUrl(displayUser.githubUrl)}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground font-medium"
                  >
                    <FiGithub className="h-3.5 w-3.5" /> GitHub Profile
                  </a>
                )}
                {displayUser.linkedinUrl && (
                  <a
                    href={sanitizeUrl(displayUser.linkedinUrl)}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:underline font-medium"
                  >
                    <FiLinkedin className="h-3.5 w-3.5" /> LinkedIn
                  </a>
                )}
                {!displayUser.portfolio && !displayUser.githubUrl && !displayUser.linkedinUrl && !isPublicView && (
                  <button
                    onClick={() => setEditModalOpen(true)}
                    className="text-xs text-subtle hover:text-primary flex items-center gap-1"
                  >
                    <FiPlus className="h-3 w-3" /> Connect website, GitHub, or LinkedIn
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* METRIC DASHBOARD (Role-Specific High-Trust SaaS Grid) */}
        {isAdmin ? (
          <div className="rounded-2xl border border-primary/25 bg-surface p-5 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FiShield className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Platform Administrator Account</h3>
                <p className="text-xs text-subtle">Authorized for system maintenance, dispute adjudication, and compliance oversight.</p>
              </div>
            </div>
            {!isPublicView && (
              <Button size="sm" variant="outline" onClick={() => navigate("/admin")}>
                Open Admin Console
              </Button>
            )}
          </div>
        ) : isClient ? (
          <div className="grid gap-4 sm:grid-cols-4">
            <MetricCard
              label="Total Spent"
              value={formatAmount(stats.totalSpentUSDC || totalVolume)}
              icon={FiDollarSign}
            />
            <MetricCard
              label="Projects Commissioned"
              value={String(isPublicView && publicData ? publicData.stats.completedProjectsCount : projects.length)}
              icon={FiFolder}
            />
            <MetricCard
              label="Milestones Settled"
              value={String(stats.completedMilestonesCount || completedCount * 2)}
              icon={FiCheckCircle}
            />
            <MetricCard
              label="Payment Reliability"
              value="100% Escrow"
              icon={FiShield}
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-4">
            <MetricCard
              label="Total Earned"
              value={formatAmount(stats.totalEarnedUSDC || totalVolume)}
              icon={FiDollarSign}
            />
            <MetricCard
              label="Job Satisfaction"
              value={userReviewCount > 0 ? `${userRating.toFixed(1)} ★` : "100% Score"}
              icon={FiStar}
            />
            <MetricCard
              label="Completed Milestones"
              value={String(stats.completedMilestonesCount || completedCount)}
              icon={FiCheckCircle}
            />
            <MetricCard
              label="Active Contracts"
              value={String(activeCount)}
              icon={FiFolder}
            />
          </div>
        )}

        {/* MULTI-TAB NAVIGATION SUITE */}
        <div className="border-b border-border/80 flex gap-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={cn(
              "pb-3.5 text-sm font-semibold transition-colors relative whitespace-nowrap",
              activeTab === "overview"
                ? "text-primary border-b-2 border-primary"
                : "text-muted hover:text-foreground",
            )}
          >
            {isAdmin
              ? "Administrator Overview"
              : isClient
              ? "Company & Overview"
              : "Overview & Stack"}
          </button>

          {isFreelancer && (
            <button
              type="button"
              onClick={() => setActiveTab("portfolio")}
              className={cn(
                "pb-3.5 text-sm font-semibold transition-colors relative flex items-center gap-1.5 whitespace-nowrap",
                activeTab === "portfolio"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted hover:text-foreground",
              )}
            >
              Featured Portfolio
              <Badge tone="neutral" className="text-[10px]">
                {displayUser.portfolioItems?.length || 0}
              </Badge>
            </button>
          )}

          {isClient && (
            <button
              type="button"
              onClick={() => setActiveTab("jobs")}
              className={cn(
                "pb-3.5 text-sm font-semibold transition-colors relative flex items-center gap-1.5 whitespace-nowrap",
                activeTab === "jobs"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted hover:text-foreground",
              )}
            >
              Open Opportunities
              <Badge tone="neutral" className="text-[10px]">
                {openProjectsList.length}
              </Badge>
            </button>
          )}

          {!isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={cn(
                  "pb-3.5 text-sm font-semibold transition-colors relative flex items-center gap-1.5 whitespace-nowrap",
                  activeTab === "history"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted hover:text-foreground",
                )}
              >
                On-Chain Work History
                <Badge tone="neutral" className="text-[10px]">
                  {workHistoryList.length}
                </Badge>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("reviews")}
                className={cn(
                  "pb-3.5 text-sm font-semibold transition-colors relative flex items-center gap-1.5 whitespace-nowrap",
                  activeTab === "reviews"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted hover:text-foreground",
                )}
              >
                {isClient ? "Freelancer Reviews" : "Client Reviews"} ({userReviewCount})
              </button>
            </>
          )}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Freelancer Verified Skills & Tech Stack */}
            {isFreelancer && (
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <FiZap className="text-primary-400" /> Verified Technical Skills &amp; Stack
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Endorsed languages, frameworks, smart contract tools, and protocol ecosystems
                    </CardDescription>
                  </div>
                  {!isPublicView && (
                    <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)} className="text-xs">
                      <FiPlus className="mr-1" /> Manage Skills
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  {displayUser.skills && displayUser.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {displayUser.skills.map((skill: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3.5 py-1.5 rounded-xl bg-secondary/40 border border-border/80 text-foreground text-xs font-medium shadow-xs hover:border-primary/40 transition-colors"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center border border-dashed border-border/80 rounded-xl">
                      <p className="text-xs text-muted mb-2">No verified skills added yet.</p>
                      {!isPublicView && (
                        <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)}>
                          Add Skills Now
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* GitHub Open-Source Proof-of-Work Activity Heatmap (Freelancer only) */}
            {isFreelancer && (
              <GithubContributionHeatmap targetUserId={targetUserId || ""} isOwner={!isPublicView} />
            )}

            {/* Client Company & Escrow Reliability Overview */}
            {isClient && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FiBriefcase className="text-primary-400" /> Organization Profile &amp; Hiring Scope
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs sm:text-sm text-muted leading-relaxed">
                      {displayUser.bio ||
                        "Verified client on FairWork. Commissions high-impact Web3 and technical projects with guaranteed smart contract milestone escrow."}
                    </p>

                    <div className="grid sm:grid-cols-3 gap-3 pt-2">
                      <div className="rounded-xl border border-border/80 bg-secondary/20 p-4">
                        <span className="text-[10px] font-mono uppercase text-muted block">Escrow Standard</span>
                        <span className="font-bold text-emerald-400 text-sm mt-1 block flex items-center gap-1.5">
                          <FiCheckCircle className="h-4 w-4" /> 100% Pre-Funded
                        </span>
                        <p className="text-[11px] text-subtle mt-1">Milestone funds deposited before work kicks off.</p>
                      </div>

                      <div className="rounded-xl border border-border/80 bg-secondary/20 p-4">
                        <span className="text-[10px] font-mono uppercase text-muted block">Settlement Rail</span>
                        <span className="font-bold text-foreground text-sm mt-1 block">
                          Sepolia USDC (ERC-20)
                        </span>
                        <p className="text-[11px] text-subtle mt-1">Direct wallet-to-wallet instant milestone settlements.</p>
                      </div>

                      <div className="rounded-xl border border-border/80 bg-secondary/20 p-4">
                        <span className="text-[10px] font-mono uppercase text-muted block">Dispute Protocol</span>
                        <span className="font-bold text-primary text-sm mt-1 block">
                          On-Chain Multi-Sig
                        </span>
                        <p className="text-[11px] text-subtle mt-1">Independent decentralized arbitration protection.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Why Freelancers Love Working with this Client */}
                <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                    <FiShield className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-foreground">FairWork Guaranteed Escrow Protection</h4>
                    <p className="text-xs text-muted mt-1 leading-relaxed">
                      When accepting contracts from this client, payments are mathematically locked inside non-custodial smart contracts. Once you submit completed milestones and they are verified, settlement occurs directly into your connected wallet without intermediary holds.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FEATURED PORTFOLIO (Freelancer Only) */}
        {activeTab === "portfolio" && isFreelancer && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FiLayers className="text-primary-400" /> Verified Portfolio Project Showcase
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Demonstrating production engineering, smart contract deployments, and client deliverables
                  </CardDescription>
                </div>
                {!isPublicView && (
                  <Button variant="primary" size="sm" onClick={() => setEditModalOpen(true)}>
                    <FiPlus className="mr-1" /> Add Project
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {displayUser.portfolioItems && displayUser.portfolioItems.length > 0 ? (
                  <div className="grid gap-5 sm:grid-cols-2">
                    {displayUser.portfolioItems.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedPortfolioItem(item)}
                        className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-secondary/15 hover:bg-surface hover:border-primary/50 p-5 transition-all cursor-pointer shadow-sm hover:shadow-xl"
                      >
                        <div>
                          {item.imageUrl ? (
                            <div className="h-40 w-full overflow-hidden rounded-xl mb-3.5 border border-border/40 bg-secondary/40">
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).style.display = "none"
                                }}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            </div>
                          ) : (
                            <div className="h-28 w-full rounded-xl mb-3.5 border border-dashed border-border/70 bg-secondary/30 flex items-center justify-center text-subtle">
                              <FiLayers className="h-7 w-7 opacity-40" />
                            </div>
                          )}

                          <h4 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                            {item.title}
                          </h4>

                          {item.description && (
                            <p className="text-xs text-muted mt-1.5 leading-relaxed line-clamp-3">
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

                        <div className="flex items-center gap-3 pt-4 mt-4 border-t border-border/40 text-xs">
                          {item.projectUrl && (
                            <a
                              href={sanitizeUrl(item.projectUrl)}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-primary-400 hover:underline font-medium"
                            >
                              <FiGlobe className="h-3.5 w-3.5" /> Live Demo <FiExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                          {item.githubUrl && (
                            <a
                              href={sanitizeUrl(item.githubUrl)}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-muted hover:text-foreground font-medium"
                            >
                              <FiGithub className="h-3.5 w-3.5" /> Repository
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center border border-dashed border-border/80 rounded-2xl">
                    <FiLayers className="h-8 w-8 text-subtle mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold text-foreground">No featured portfolio items added yet</p>
                    <p className="text-[11px] text-muted mt-1 mb-4">
                      Showcase past client contracts, open-source repositories, and DApps to boost credibility.
                    </p>
                    {!isPublicView && (
                      <Button variant="primary" size="sm" onClick={() => setEditModalOpen(true)}>
                        <FiPlus className="mr-1" /> Add Your First Project
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3: OPEN OPPORTUNITIES / JOBS POSTED (Client Only) */}
        {activeTab === "jobs" && isClient && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FiFolder className="text-primary-400" /> Active Hiring Opportunities
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Smart contract escrow projects open for proposals and freelancer talent
                  </CardDescription>
                </div>
                {!isPublicView && (
                  <Button variant="primary" size="sm" onClick={() => navigate("/projects/new")}>
                    <FiPlus className="mr-1" /> Post New Project
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {openProjectsList.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {openProjectsList.map((job) => (
                      <div
                        key={job.id}
                        className="flex flex-col justify-between p-5 rounded-2xl border border-border/80 bg-secondary/15 hover:bg-surface hover:border-primary/50 transition-all shadow-xs"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <Badge tone="neutral" className="text-[10px] font-mono">
                              {job.category}
                            </Badge>
                            <Badge
                              tone={job.status === "open" ? "success" : "primary"}
                              className="text-[10px] capitalize font-medium"
                            >
                              {job.status === "open" ? "Accepting Proposals" : "In Progress"}
                            </Badge>
                          </div>

                          <h4 className="font-bold text-foreground text-sm mt-2.5 line-clamp-1">{job.title}</h4>
                          {job.description && (
                            <p className="text-xs text-muted mt-1.5 leading-relaxed line-clamp-2">
                              {job.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-muted mt-3">
                            <span>{job.milestonesCount} Milestones</span>
                            <span>•</span>
                            <span>Posted {formatDate(job.createdAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40">
                          <div>
                            <span className="text-[10px] text-subtle font-mono uppercase block">Project Budget</span>
                            <span className="font-mono font-extrabold text-emerald-400 text-base">
                              {formatAmount(job.budget)}
                            </span>
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/projects/${job.id}`)}
                            className="text-xs"
                          >
                            View Project &amp; Apply
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center border border-dashed border-border/80 rounded-2xl">
                    <FiFolder className="h-8 w-8 text-subtle mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold text-foreground">No active hiring projects listed</p>
                    <p className="text-[11px] text-muted mt-1 mb-4">
                      When this client creates public projects with escrow funding, they will appear here.
                    </p>
                    {!isPublicView && (
                      <Button variant="primary" size="sm" onClick={() => navigate("/projects/new")}>
                        <FiPlus className="mr-1" /> Post a Project Now
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 4: IMMUTABLE ON-CHAIN WORK HISTORY */}
        {activeTab === "history" && !isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FiShield className="text-emerald-400" /> Immutable On-Chain Escrow Work History
              </CardTitle>
              <CardDescription className="text-xs">
                Verified milestone releases settled through the FairWork smart contract escrow
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {workHistoryList.length > 0 ? (
                <div className="divide-y divide-border/60">
                  {workHistoryList.map((item) => (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/projects/${item.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          navigate(`/projects/${item.id}`)
                        }
                      }}
                      className="py-4.5 px-3 -mx-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group hover:bg-surface-elevated/60 transition-all border border-transparent hover:border-border/60"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors truncate">
                            {item.title}
                          </h4>
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            View Details <FiArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted mt-1.5 flex-wrap">
                          <span className="font-medium text-foreground">{item.category}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-emerald-400 font-medium">
                            <FiCheckCircle className="h-3 w-3" />
                            {item.milestonesCount} Milestones Settled
                          </span>
                          <span>•</span>
                          <span>Completed {formatDate(item.completedAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                        <span className="font-mono font-extrabold text-emerald-400 text-sm">
                          {formatAmount(item.budget)}
                        </span>
                        {item.etherscanUrl && (
                          <a
                            href={sanitizeUrl(item.etherscanUrl)}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs text-primary-400 hover:underline font-mono bg-primary-500/10 border border-primary-500/30 px-2.5 py-1 rounded-lg transition-colors hover:bg-primary-500/20"
                          >
                            Sepolia Etherscan <FiExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/projects/${item.id}`)
                          }}
                          className="h-8 px-2.5 text-xs text-muted group-hover:text-primary group-hover:bg-primary/10"
                        >
                          Details <FiArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-border/80 rounded-2xl">
                  <FiAward className="h-8 w-8 text-subtle mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold text-foreground">No completed escrow settlements yet</p>
                  <p className="text-[11px] text-muted mt-1">
                    Completed project milestones with confirmed blockchain transactions will appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 5: CLIENT / FREELANCER REVIEWS */}
        {activeTab === "reviews" && !isAdmin && (
          <div className="space-y-6">
            {/* Rating Breakdown Studio */}
            <Card>
              <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-8">
                <div className="text-center sm:text-left shrink-0">
                  <div className="text-5xl font-extrabold text-foreground font-mono">
                    {userReviewCount > 0 ? userRating.toFixed(1) : "—"}
                  </div>
                  <div className="flex gap-1 justify-center sm:justify-start my-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <FiStar
                        key={n}
                        className={cn(
                          "h-4 w-4",
                          userReviewCount > 0 && n <= Math.round(userRating)
                            ? "fill-current text-warning"
                            : "text-subtle",
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted">
                    {userReviewCount > 0 ? `${userReviewCount} Platform Ratings` : "No ratings recorded yet"}
                  </p>
                  {onChainRep.isAvailable && (
                    <div className="mt-2.5 pt-2 border-t border-border/40">
                      <a
                        href={reputationAddress ? `https://sepolia.etherscan.io/address/${reputationAddress}` : "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 hover:underline"
                      >
                        <FiShield className="h-3 w-3" />
                        Sepolia On-Chain:{" "}
                        {onChainRep.totalReviews > 0
                          ? `${onChainRep.average.toFixed(2)} ★ (${onChainRep.totalReviews})`
                          : "Active Escrow Record"}
                        <FiExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Star Distribution Visual Bars */}
                {userReviewCount > 0 ? (
                  <div className="flex-1 w-full space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = stats.ratingCounts[stars as keyof typeof stats.ratingCounts] || 0
                      const percentage = (count / userReviewCount) * 100
                      return (
                        <div key={stars} className="flex items-center gap-3 text-xs">
                          <span className="w-6 font-mono font-medium text-muted">{stars}★</span>
                          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden border border-border/40">
                            <div
                              className="h-full bg-warning rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-8 text-right font-mono text-muted">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex-1 w-full flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-border/60 text-center">
                    <FiStar className="h-6 w-6 text-subtle mb-1" />
                    <p className="text-xs font-medium text-muted">No review distribution yet</p>
                    <p className="text-[11px] text-subtle">
                      Verified feedback and ratings will populate automatically as projects complete.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Testimonials Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {isClient ? "Freelancer Testimonials & Reviews" : "Client Feedback & Review History"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {publicData?.reviews && publicData.reviews.length > 0 ? (
                  <div className="divide-y divide-border/60">
                    {publicData.reviews.map((rev) => (
                      <div key={rev._id} className="py-4.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              name={
                                rev.reviewerId
                                  ? `${rev.reviewerId.firstName} ${rev.reviewerId.lastName}`
                                  : "Verified Counterparty"
                              }
                              src={rev.reviewerId?.avatarUrl}
                              size="sm"
                              className="h-8 w-8 rounded-lg"
                            />
                            <div>
                              <span className="text-xs font-bold text-foreground block">
                                {rev.reviewerId
                                  ? `${rev.reviewerId.firstName} ${rev.reviewerId.lastName}`
                                  : "Verified Counterparty"}
                              </span>
                              <span className="text-[10px] text-subtle font-mono">Verified Escrow Settler</span>
                            </div>
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
                        <p className="text-xs text-muted leading-relaxed pl-10">{rev.comment}</p>
                        <span className="text-[10px] text-subtle block pl-10">{formatDate(rev.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center border border-dashed border-border/80 rounded-2xl">
                    <FiMessageSquare className="h-8 w-8 text-subtle mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold text-foreground">No review comments yet</p>
                    <p className="text-[11px] text-muted mt-1">
                      Reviews submitted upon project completion will be logged here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* QUICK IN-PLACE PROFILE EDIT MODAL */}
      {!isPublicView && (
        <ProfileEditModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          currentUser={displayUser}
          token={token}
          onSaveSuccess={async () => {
            await refreshUser()
            await loadProfileData()
          }}
        />
      )}

      {/* PORTFOLIO ITEM PREVIEW MODAL */}
      {selectedPortfolioItem && (
        <Modal
          open={Boolean(selectedPortfolioItem)}
          onClose={() => setSelectedPortfolioItem(null)}
          size="lg"
          className="max-w-2xl overflow-hidden p-0 border border-border/80"
        >
          {selectedPortfolioItem.imageUrl && (
            <div className="h-60 w-full overflow-hidden bg-secondary/40 border-b border-border/60">
              <img
                src={selectedPortfolioItem.imageUrl}
                alt={selectedPortfolioItem.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">{selectedPortfolioItem.title}</h3>
                {selectedPortfolioItem.tags && selectedPortfolioItem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedPortfolioItem.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-secondary/80 text-foreground px-2.5 py-0.5 rounded-md border border-border/60 font-mono"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedPortfolioItem(null)}
                className="rounded-lg p-1.5 text-muted hover:bg-secondary hover:text-foreground"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {selectedPortfolioItem.description && (
              <p className="text-xs sm:text-sm text-muted leading-relaxed whitespace-pre-line">
                {selectedPortfolioItem.description}
              </p>
            )}

            <div className="flex items-center gap-4 pt-3 border-t border-border/60">
              {selectedPortfolioItem.projectUrl && (
                <a
                  href={sanitizeUrl(selectedPortfolioItem.projectUrl)}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
                >
                  <FiGlobe className="h-3.5 w-3.5" /> Visit Live Project <FiExternalLink className="h-3 w-3" />
                </a>
              )}
              {selectedPortfolioItem.githubUrl && (
                <a
                  href={sanitizeUrl(selectedPortfolioItem.githubUrl)}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80 border border-border transition-colors"
                >
                  <FiGithub className="h-3.5 w-3.5" /> View Source Code
                </a>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
