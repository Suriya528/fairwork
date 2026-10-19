import { useState, useEffect } from "react"
import {
  FiX,
  FiUser,
  FiBriefcase,
  FiGlobe,
  FiGithub,
  FiLinkedin,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiAlertCircle,
} from "react-icons/fi"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Label } from "@/components/ui/Label"
import { Badge } from "@/components/ui/Badge"
import { updateProfile, type PortfolioItem } from "@/services/userApi"

interface ProfileEditModalProps {
  open: boolean
  onClose: () => void
  currentUser: any
  token: string | null
  onSaveSuccess: () => Promise<void> | void
}

type EditTab = "basic" | "work" | "social" | "portfolio"

export function ProfileEditModal({
  open,
  onClose,
  currentUser,
  token,
  onSaveSuccess,
}: ProfileEditModalProps) {
  const isFreelancer = currentUser?.role === "freelancer"

  const [activeTab, setActiveTab] = useState<EditTab>("basic")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [tagline, setTagline] = useState("")
  const [bio, setBio] = useState("")
  const [hourlyRate, setHourlyRate] = useState("0")
  const [availability, setAvailability] = useState<"available" | "busy" | "not_available">("available")
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [portfolio, setPortfolio] = useState("")
  const [githubUrl, setGithubUrl] = useState("")
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])

  // New portfolio item temporary form
  const [newItemTitle, setNewItemTitle] = useState("")
  const [newItemDesc, setNewItemDesc] = useState("")
  const [newItemImage, setNewItemImage] = useState("")
  const [newItemDemo, setNewItemDemo] = useState("")
  const [newItemGithub, setNewItemGithub] = useState("")
  const [newItemTags, setNewItemTags] = useState("")

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (open && currentUser) {
      const parts = (currentUser.name || "").split(" ")
      setFirstName(currentUser.firstName || parts[0] || "")
      setLastName(currentUser.lastName || parts.slice(1).join(" ") || "")
      setTagline(currentUser.tagline || "")
      setBio(currentUser.bio || "")
      setHourlyRate(String(currentUser.hourlyRate || "0"))
      setAvailability(currentUser.availability || "available")
      setSkills(currentUser.skills || [])
      setPortfolio(currentUser.portfolio || "")
      setGithubUrl(currentUser.githubUrl || "")
      setLinkedinUrl(currentUser.linkedinUrl || "")
      setPortfolioItems(currentUser.portfolioItems ? [...currentUser.portfolioItems] : [])
      setError(null)
      setSuccess(null)
    }
  }, [open, currentUser])

  const handleAddSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = newSkill.trim()
    if (!trimmed) return
    if (!skills.includes(trimmed)) {
      setSkills([...skills, trimmed])
    }
    setNewSkill("")
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove))
  }

  const handleAddPortfolioItem = () => {
    if (!newItemTitle.trim()) {
      setError("Portfolio project must have a title.")
      return
    }
    if (portfolioItems.length >= 12) {
      setError("Maximum limit of 12 portfolio items reached.")
      return
    }

    const item: PortfolioItem = {
      title: newItemTitle.trim(),
      description: newItemDesc.trim(),
      imageUrl: newItemImage.trim() || undefined,
      projectUrl: newItemDemo.trim() || undefined,
      githubUrl: newItemGithub.trim() || undefined,
      tags: newItemTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    }

    setPortfolioItems([...portfolioItems, item])
    setNewItemTitle("")
    setNewItemDesc("")
    setNewItemImage("")
    setNewItemDemo("")
    setNewItemGithub("")
    setNewItemTags("")
    setError(null)
  }

  const handleRemovePortfolioItem = (index: number) => {
    setPortfolioItems(portfolioItems.filter((_, idx) => idx !== index))
  }

  const handleSave = async () => {
    if (!token) return
    setError(null)
    setSuccess(null)

    // URL Validations
    if (githubUrl && !githubUrl.startsWith("https://github.com/")) {
      setError("GitHub URL must strictly begin with 'https://github.com/'")
      setActiveTab("social")
      return
    }

    if (linkedinUrl && !linkedinUrl.startsWith("https://linkedin.com/") && !linkedinUrl.startsWith("https://www.linkedin.com/")) {
      setError("LinkedIn URL must strictly belong to 'https://linkedin.com/'")
      setActiveTab("social")
      return
    }

    if (portfolio && !portfolio.startsWith("https://")) {
      setError("Portfolio URL must strictly begin with 'https://'")
      setActiveTab("social")
      return
    }

    setSaving(true)

    try {
      await updateProfile(
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          tagline: tagline.trim(),
          bio: bio.trim(),
          hourlyRate: isFreelancer ? Math.max(0, Number(hourlyRate) || 0) : undefined,
          availability: isFreelancer ? availability : undefined,
          skills: isFreelancer ? skills : undefined,
          portfolio: portfolio.trim(),
          githubUrl: githubUrl.trim(),
          linkedinUrl: linkedinUrl.trim(),
          portfolioItems: isFreelancer ? portfolioItems : undefined,
        },
        token,
      )

      setSuccess("Profile updated successfully!")
      await onSaveSuccess()
      setTimeout(() => {
        onClose()
      }, 700)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.")
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} size="lg" className="max-w-3xl overflow-hidden p-0 border border-border/80">
      <div className="flex items-center justify-between border-b border-border/80 px-6 py-4 bg-surface">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {isFreelancer ? <FiUser className="h-4 w-4" /> : <FiBriefcase className="h-4 w-4" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              {isFreelancer ? "Edit Professional Freelancer Profile" : "Edit Client & Organization Profile"}
            </h3>
            <p className="text-xs text-muted">Customize your public credentials, availability, and showcase portfolio</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-muted hover:bg-secondary hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-border/80 px-6 gap-6 bg-surface/50 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("basic")}
          className={`py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "basic"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          General Information
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("work")}
          className={`py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "work"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          {isFreelancer ? "Rates, Availability & Skills" : "Hiring & Settlement"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("social")}
          className={`py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "social"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          Social &amp; Web Links
        </button>
        {isFreelancer && (
          <button
            type="button"
            onClick={() => setActiveTab("portfolio")}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "portfolio"
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            Portfolio Items
            <Badge tone="neutral" className="text-[10px] px-1.5 py-0.5">
              {portfolioItems.length}
            </Badge>
          </button>
        )}
      </div>

      <div className="max-h-[68vh] overflow-y-auto p-6 space-y-5">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs">
            <FiAlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
            <FiCheck className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* TAB 1: BASIC INFO */}
        {activeTab === "basic" && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-xs font-medium">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Satoshi"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-xs font-medium">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Nakamoto"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tagline" className="text-xs font-medium">
                {isFreelancer ? "Professional Headline / Tagline" : "Company / Organization Headline"}
              </Label>
              <Input
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder={
                  isFreelancer
                    ? "e.g. Senior Full-Stack & Smart Contract Auditor"
                    : "e.g. Decentralized DeFi Protocol & Escrow Backer"
                }
                className="mt-1"
              />
              <p className="text-[11px] text-subtle mt-1">
                A concise one-line summary displayed alongside your name on proposals and search listings.
              </p>
            </div>

            <div>
              <Label htmlFor="bio" className="text-xs font-medium">
                {isFreelancer ? "Professional Bio & Summary" : "Organization Bio & Mission"}
              </Label>
              <Textarea
                id="bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={
                  isFreelancer
                    ? "Describe your expertise, past projects, smart contract audits, and how you collaborate with clients..."
                    : "Share your company background, project scope, and what you look for in top talent..."
                }
                className="mt-1 text-xs"
              />
              <div className="flex justify-between items-center text-[11px] text-subtle mt-1">
                <span>Supports plain text formatting.</span>
                <span>{bio.length} characters</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WORK, RATES & SKILLS */}
        {activeTab === "work" && (
          <div className="space-y-5">
            {isFreelancer ? (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hourlyRate" className="text-xs font-medium">
                      Hourly Rate (USDC)
                    </Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle text-xs font-mono">
                        $
                      </span>
                      <Input
                        id="hourlyRate"
                        type="number"
                        min="0"
                        step="1"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        placeholder="75"
                        className="pl-7"
                      />
                    </div>
                    <p className="text-[11px] text-subtle mt-1">Base consulting rate in USDC per hour.</p>
                  </div>

                  <div>
                    <Label htmlFor="availability" className="text-xs font-medium">
                      Current Availability Status
                    </Label>
                    <select
                      id="availability"
                      value={availability}
                      onChange={(e) =>
                        setAvailability(e.target.value as "available" | "busy" | "not_available")
                      }
                      className="mt-1 h-10 w-full rounded-lg border border-input-border bg-input px-3 text-xs text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                    >
                      <option value="available">🟢 Available for Hire (Accepting new contracts)</option>
                      <option value="busy">🟡 Busy (Limited capacity / active escrows)</option>
                      <option value="not_available">⚪ Not Available (Fully booked)</option>
                    </select>
                    <p className="text-[11px] text-subtle mt-1">Signals your capacity on project marketplace listings.</p>
                  </div>
                </div>

                <div className="border-t border-border/60 pt-4">
                  <Label className="text-xs font-medium">Verified Skills &amp; Tech Stack</Label>
                  <p className="text-[11px] text-subtle mb-3">
                    Add primary languages, frameworks, blockchain protocols, and tools you excel in.
                  </p>

                  <div className="flex gap-2 mb-3">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddSkill()
                        }
                      }}
                      placeholder="e.g. Solidity, React, TypeScript, Rust, Hardhat"
                      className="text-xs"
                    />
                    <Button type="button" size="sm" variant="outline" onClick={() => handleAddSkill()}>
                      <FiPlus className="h-4 w-4" /> Add
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 min-h-[40px] p-3 rounded-xl border border-border/70 bg-secondary/20">
                    {skills.length > 0 ? (
                      skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface border border-border text-foreground text-xs font-medium shadow-xs"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="text-subtle hover:text-danger ml-0.5"
                          >
                            <FiX className="h-3 w-3" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-muted italic">No skills added yet. Type a skill and click Add.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                  <h4 className="text-xs font-bold text-primary flex items-center gap-2">
                    <FiBriefcase /> Client Escrow Verification Policy
                  </h4>
                  <p className="text-xs text-muted leading-relaxed">
                    FairWork clients fund smart contract escrows with USDC before work begins. This guarantees freelancer payment protection and zero dispute risk.
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium">Supported Settlement Network</Label>
                  <Input value="Ethereum Sepolia Testnet (USDC ERC-20)" disabled className="mt-1 opacity-70" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SOCIAL & WEB */}
        {activeTab === "social" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="portfolio" className="text-xs font-medium flex items-center gap-1.5">
                <FiGlobe className="text-primary-400" /> Personal Portfolio or Company Website
              </Label>
              <Input
                id="portfolio"
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                placeholder="https://yourdomain.com"
                className="mt-1 text-xs"
              />
              <p className="text-[11px] text-subtle mt-1">Must strictly begin with https://</p>
            </div>

            <div>
              <Label htmlFor="githubUrl" className="text-xs font-medium flex items-center gap-1.5">
                <FiGithub /> GitHub Profile URL
              </Label>
              <Input
                id="githubUrl"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username"
                className="mt-1 text-xs"
              />
              <p className="text-[11px] text-subtle mt-1">Must strictly begin with https://github.com/</p>
            </div>

            <div>
              <Label htmlFor="linkedinUrl" className="text-xs font-medium flex items-center gap-1.5">
                <FiLinkedin className="text-blue-400" /> LinkedIn Profile URL
              </Label>
              <Input
                id="linkedinUrl"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="mt-1 text-xs"
              />
              <p className="text-[11px] text-subtle mt-1">Must strictly begin with https://linkedin.com/</p>
            </div>
          </div>
        )}

        {/* TAB 4: PORTFOLIO SHOWCASE (Freelancer only) */}
        {activeTab === "portfolio" && isFreelancer && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl border border-border/80 bg-secondary/20 space-y-3">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FiPlus className="text-primary-400" /> Add New Featured Project (Max 12)
              </h4>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input
                  placeholder="Project Title (e.g. DeFi Staking Vault)"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  className="text-xs"
                />
                <Input
                  placeholder="Image URL (https://...)"
                  value={newItemImage}
                  onChange={(e) => setNewItemImage(e.target.value)}
                  className="text-xs"
                />
              </div>
              <Textarea
                rows={2}
                placeholder="Brief project description & technical achievements..."
                value={newItemDesc}
                onChange={(e) => setNewItemDesc(e.target.value)}
                className="text-xs"
              />
              <div className="grid sm:grid-cols-2 gap-3">
                <Input
                  placeholder="Live Demo URL (https://...)"
                  value={newItemDemo}
                  onChange={(e) => setNewItemDemo(e.target.value)}
                  className="text-xs"
                />
                <Input
                  placeholder="GitHub Repository (https://github.com/...)"
                  value={newItemGithub}
                  onChange={(e) => setNewItemGithub(e.target.value)}
                  className="text-xs"
                />
              </div>
              <Input
                placeholder="Tags comma-separated (e.g. Solidity, Next.js, Wagmi)"
                value={newItemTags}
                onChange={(e) => setNewItemTags(e.target.value)}
                className="text-xs"
              />
              <div className="flex justify-end pt-1">
                <Button type="button" size="sm" variant="primary" onClick={handleAddPortfolioItem}>
                  <FiPlus className="mr-1" /> Add Project to Portfolio
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-foreground">
                Current Portfolio Items ({portfolioItems.length} / 12)
              </h4>
              {portfolioItems.length > 0 ? (
                <div className="space-y-2">
                  {portfolioItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-surface text-xs"
                    >
                      <div className="flex-1 pr-4">
                        <div className="font-bold text-foreground">{item.title}</div>
                        {item.description && (
                          <div className="text-muted text-[11px] line-clamp-1 mt-0.5">{item.description}</div>
                        )}
                        <div className="flex items-center gap-3 text-[10px] text-subtle mt-1">
                          {item.projectUrl && <span>Demo: {item.projectUrl}</span>}
                          {item.githubUrl && <span>GitHub: {item.githubUrl}</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePortfolioItem(idx)}
                        className="text-subtle hover:text-danger p-1 rounded-lg hover:bg-secondary transition-colors"
                        title="Delete project"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted italic">No portfolio items added yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border/80 px-6 py-4 bg-surface">
        <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving} className="min-w-[110px]">
          {saving ? "Saving Changes..." : "Save Profile"}
        </Button>
      </div>
    </Modal>
  )
}
