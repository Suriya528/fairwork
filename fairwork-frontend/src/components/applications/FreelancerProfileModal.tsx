import { useEffect, useState } from "react"
import {
  FiX,
  FiCalendar,
  FiStar,
  FiCheckCircle,
  FiGithub,
  FiExternalLink,
  FiLinkedin,
  FiGlobe,
  FiUserCheck,
  FiShield,
} from "react-icons/fi"
import { Modal } from "@/components/ui/Modal"
import { Avatar } from "@/components/ui/Avatar"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Spinner } from "@/components/ui/Spinner"
import { getPublicProfile } from "@/services/userApi"
import type { UserProfileDTO } from "@/services/userApi"

interface FreelancerProfileModalProps {
  open: boolean
  onClose: () => void
  freelancerId: string | null
  onHire?: () => void
  hiring?: boolean
  isHired?: boolean
  canHire?: boolean
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "N/A"
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return dateStr
  }
}

function shortenAddress(addr?: string) {
  if (!addr) return ""
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function FreelancerProfileModal({
  open,
  onClose,
  freelancerId,
  onHire,
  hiring = false,
  isHired = false,
  canHire = false,
}: FreelancerProfileModalProps) {
  const [profile, setProfile] = useState<UserProfileDTO | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !freelancerId) {
      setProfile(null)
      setError(null)
      return
    }

    let active = true
    setLoading(true)
    setError(null)

    getPublicProfile(freelancerId)
      .then((data) => {
        if (active) setProfile(data)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load freelancer profile")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [open, freelancerId])

  if (!open) return null

  const user = profile?.user
  const stats = profile?.stats
  const githubUser =
    user?.githubIdentity?.username ||
    (user?.githubUrl?.includes("github.com/")
      ? user.githubUrl.split("github.com/")[1]?.split("/")[0]
      : null)
  const githubHref =
    user?.githubUrl || (githubUser ? `https://github.com/${githubUser}` : null)

  return (
    <Modal open={open} onClose={onClose} size="lg" className="max-w-2xl overflow-hidden p-0">
      <div className="flex max-h-[85vh] flex-col overflow-hidden bg-surface">
        {/* Header with Background Gradient */}
        <div className="relative border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-surface px-6 pt-6 pb-5">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-lg p-1.5 text-muted transition hover:bg-elevated hover:text-foreground"
            aria-label="Close modal"
          >
            <FiX className="h-5 w-5" />
          </button>

          {loading ? (
            <div className="flex h-24 items-center justify-center">
              <Spinner className="h-6 w-6 text-primary" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-danger/20 bg-danger-soft p-4 text-xs text-danger">
              {error}
            </div>
          ) : user ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar
                name={user.name || `${user.firstName} ${user.lastName}`}
                src={user.avatarUrl}
                size="lg"
                className="h-16 w-16 text-lg ring-2 ring-primary/20"
              />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">
                    {user.name || `${user.firstName} ${user.lastName}`}
                  </h3>
                  <Badge tone="success" dot className="text-[11px]">
                    Verified Freelancer
                  </Badge>
                </div>

                {user.tagline && (
                  <p className="text-xs font-medium text-muted">{user.tagline}</p>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-subtle">
                  <span className="flex items-center gap-1">
                    <FiCalendar className="h-3.5 w-3.5 text-primary" />
                    Member since {formatDate(user.createdAt)}
                  </span>
                  {user.walletAddress && (
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <FiShield className="h-3.5 w-3.5 text-success" />
                      <a
                        href={`https://sepolia.etherscan.io/address/${user.walletAddress}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-primary hover:underline"
                      >
                        {shortenAddress(user.walletAddress)}
                      </a>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="space-y-4 py-8 text-center text-xs text-muted">
              <Spinner className="h-6 w-6 text-primary" />
              <p>Fetching verified freelancer credentials...</p>
            </div>
          ) : user ? (
            <>
              {/* Highlights & Reputation Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-border bg-base p-3.5 text-center">
                  <span className="block text-[11px] font-medium text-muted">Reputation</span>
                  <div className="mt-1 flex items-center justify-center gap-1 text-sm font-bold text-warning">
                    <FiStar className="h-4 w-4 fill-current" />
                    <span>{(user.reputationScore ? (user.reputationScore / 20).toFixed(1) : "5.0")}</span>
                  </div>
                  <span className="text-[10px] text-subtle">{user.totalReviews || 0} reviews</span>
                </div>

                <div className="rounded-xl border border-border bg-base p-3.5 text-center">
                  <span className="block text-[11px] font-medium text-muted">Completed Projects</span>
                  <p className="mt-1 text-sm font-bold text-foreground">
                    {stats?.completedProjectsCount ?? 0}
                  </p>
                  <span className="text-[10px] text-subtle">Escrow cleared</span>
                </div>

                <div className="rounded-xl border border-border bg-base p-3.5 text-center">
                  <span className="block text-[11px] font-medium text-muted">Milestones Done</span>
                  <p className="mt-1 text-sm font-bold text-foreground">
                    {stats?.completedMilestonesCount ?? 0}
                  </p>
                  <span className="text-[10px] text-subtle">Deliverables passed</span>
                </div>

                <div className="rounded-xl border border-border bg-base p-3.5 text-center">
                  <span className="block text-[11px] font-medium text-muted">Hourly Rate</span>
                  <p className="mt-1 text-sm font-bold text-primary">
                    {user.hourlyRate ? `$${user.hourlyRate}/hr` : "Negotiable"}
                  </p>
                  <span className="text-[10px] text-subtle">USDC / USD</span>
                </div>
              </div>

              {/* Verified GitHub Card */}
              {githubHref && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-foreground shadow-sm">
                        <FiGithub className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground">
                            {githubUser ? `@${githubUser}` : "Verified GitHub Profile"}
                          </span>
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                            <FiCheckCircle className="h-3 w-3" />
                            Verified Developer
                          </span>
                        </div>
                        <p className="text-[11px] text-muted mt-0.5">
                          Cryptographically linked GitHub identity & codebase contributions
                        </p>
                      </div>
                    </div>
                    <a
                      href={githubHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-elevated hover:text-primary shrink-0"
                    >
                      <span>View GitHub</span>
                      <FiExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              )}

              {/* Bio / About */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  About Freelancer
                </h4>
                <p className="rounded-xl border border-border bg-base p-4 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                  {user.bio || "No professional biography provided yet."}
                </p>
              </div>

              {/* Skills Tags */}
              {user.skills && user.skills.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Technical Skills &amp; Stack
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {user.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-lg border border-border bg-elevated/50 px-2.5 py-1 text-xs font-medium text-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio / External Links */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  External Links &amp; Profiles
                </h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  {user.portfolio && (
                    <a
                      href={user.portfolio}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-border bg-base px-3 py-1.5 text-muted hover:text-primary transition"
                    >
                      <FiGlobe className="h-3.5 w-3.5" />
                      <span>Portfolio Website</span>
                      <FiExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {user.linkedinUrl && (
                    <a
                      href={user.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-border bg-base px-3 py-1.5 text-muted hover:text-primary transition"
                    >
                      <FiLinkedin className="h-3.5 w-3.5" />
                      <span>LinkedIn Profile</span>
                      <FiExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {!user.portfolio && !user.linkedinUrl && !githubHref && (
                    <p className="text-xs text-subtle">No external links provided.</p>
                  )}
                </div>
              </div>

              {/* Portfolio Items List if any */}
              {user.portfolioItems && user.portfolioItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Showcase Portfolio Items ({user.portfolioItems.length})
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {user.portfolioItems.map((item, idx) => (
                      <div
                        key={item._id || idx}
                        className="rounded-xl border border-border bg-base p-3.5 space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-xs font-bold text-foreground truncate">{item.title}</h5>
                          {item.projectUrl && (
                            <a
                              href={item.projectUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-subtle hover:text-primary shrink-0"
                            >
                              <FiExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-muted line-clamp-2">{item.description}</p>
                        )}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {item.tags.slice(0, 3).map((t) => (
                              <span
                                key={t}
                                className="rounded bg-elevated px-1.5 py-0.5 text-[10px] text-subtle"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Reviews if any */}
              {profile.reviews && profile.reviews.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Client Feedback &amp; Reviews ({profile.reviews.length})
                  </h4>
                  <div className="space-y-2">
                    {profile.reviews.slice(0, 3).map((rev) => (
                      <div key={rev._id} className="rounded-xl border border-border bg-base p-3 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground">
                            {rev.reviewerId?.firstName} {rev.reviewerId?.lastName}
                          </span>
                          <span className="flex items-center gap-1 font-bold text-warning">
                            <FiStar className="h-3 w-3 fill-current" />
                            {rev.rating.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted italic">&ldquo;{rev.comment}&rdquo;</p>
                        <span className="block text-[10px] text-subtle">{formatDate(rev.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between border-t border-border bg-elevated/40 px-6 py-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>

          {canHire && !isHired && onHire && (
            <Button
              variant="primary"
              size="sm"
              loading={hiring}
              leftIcon={<FiUserCheck className="h-4 w-4" />}
              onClick={onHire}
            >
              Hire Freelancer
            </Button>
          )}

          {isHired && (
            <Badge tone="success" className="px-3 py-1">
              ✓ Already Hired For This Project
            </Badge>
          )}
        </div>
      </div>
    </Modal>
  )
}
