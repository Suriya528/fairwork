import { useState, useEffect } from "react"
import {
  FiUser,
  FiBell,
  FiShield,
  FiDownload,
  FiCheck,
  FiRefreshCw,
  FiGlobe,
  FiGithub,
  FiLinkedin,
  FiPlus,
  FiTrash2,
  FiCamera,
  FiImage,
  FiAlertTriangle,
} from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Label } from "@/components/ui/Label"
import { Avatar } from "@/components/ui/Avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card"
import { PageHeader } from "@/components/common/PageHeader"
import { FlagUSA } from "@/components/common/FlagIcons"
import { useAuth } from "@/context/AuthContext"
import { Web3WalletCard } from "@/components/wallet/Web3WalletCard"
import { updateProfile, updatePreferences, type NotificationPreferences, type PortfolioItem } from "@/services/userApi"
import { apiFetch } from "@/services/apiClient"

export function SettingsPage() {
  const { user, token } = useAuth()

  // Profile Form State
  const [firstName, setFirstName] = useState(user?.name ? user.name.split(" ")[0] || "" : "")
  const [lastName, setLastName] = useState(user?.name ? user.name.split(" ").slice(1).join(" ") || "" : "")
  const [bio, setBio] = useState(user?.bio || "")
  const [tagline, setTagline] = useState(user?.tagline || "")
  const [hourlyRate, setHourlyRate] = useState(user?.hourlyRate ? String(user.hourlyRate) : "0")
  const [availability, setAvailability] = useState<"available" | "busy" | "not_available">(
    user?.availability || "available",
  )
  const [skillsInput, setSkillsInput] = useState(user?.skills ? user.skills.join(", ") : "")
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "")
  const [bannerUrl, setBannerUrl] = useState(user?.bannerUrl || "")
  const [githubUrl, setGithubUrl] = useState(user?.githubUrl || "")
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedinUrl || "")
  const [portfolio, setPortfolio] = useState(user?.portfolio || "")
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(user?.portfolioItems || [])

  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState("")

  // Notification Preferences State
  const [notifs, setNotifs] = useState<NotificationPreferences>({
    escrowDeposits: true,
    milestoneReleases: true,
    chatMessages: true,
    disputeAlerts: true,
    emailNotifications: true,
  })
  const [savingNotifs, setSavingNotifs] = useState(false)
  const [notifSuccess, setNotifSuccess] = useState("")
  const [error, setError] = useState("")

  const [emailInput, setEmailInput] = useState(user?.email || "")
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState("")

  useEffect(() => {
    if (user) {
      if (user.email) setEmailInput(user.email)
      if (user.bio) setBio(user.bio)
      if (user.tagline) setTagline(user.tagline)
      if (user.hourlyRate) setHourlyRate(String(user.hourlyRate))
      if (user.availability) setAvailability(user.availability)
      if (user.skills) setSkillsInput(user.skills.join(", "))
      if (user.avatarUrl) setAvatarUrl(user.avatarUrl)
      if (user.bannerUrl) setBannerUrl(user.bannerUrl)
      if (user.githubUrl) setGithubUrl(user.githubUrl)
      if (user.linkedinUrl) setLinkedinUrl(user.linkedinUrl)
      if (user.portfolio) setPortfolio(user.portfolio)
      if (user.portfolioItems) setPortfolioItems(user.portfolioItems)
    }
  }, [user])

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !emailInput.trim()) return
    setSavingEmail(true)
    setError("")
    setEmailSuccess("")

    try {
      await updateProfile({ email: emailInput.trim() }, token)
      setEmailSuccess("Email address updated successfully! Future notifications and logins will use this address.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update email address.")
    } finally {
      setSavingEmail(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token) return

    if (file.size > 5 * 1024 * 1024) {
      setError("Avatar photo size exceeds the maximum allowed limit of 5MB.")
      return
    }

    if (file.type.includes("svg")) {
      setError("SVG files are strictly prohibited for profile avatar images.")
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
      setAvatarUrl(fileData.url)
      await updateProfile({ avatarUrl: fileData.url }, token)
      setProfileSuccess("Avatar photo updated successfully!")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar photo.")
    } finally {
      setUploadingAvatar(false)
      e.target.value = ""
    }
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token) return

    if (file.size > 10 * 1024 * 1024) {
      setError("Cover banner image size exceeds the maximum allowed limit of 10MB.")
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
      setBannerUrl(fileData.url)
      await updateProfile({ bannerUrl: fileData.url }, token)
      setProfileSuccess("Cover banner photo updated successfully!")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload cover banner.")
    } finally {
      setUploadingBanner(false)
      e.target.value = ""
    }
  }

  const handleAddPortfolioItem = () => {
    setPortfolioItems([
      ...portfolioItems,
      {
        title: "",
        description: "",
        imageUrl: "",
        projectUrl: "",
        githubUrl: "",
        tags: [],
      },
    ])
  }

  const handleRemovePortfolioItem = (index: number) => {
    setPortfolioItems(portfolioItems.filter((_, i) => i !== index))
  }

  const handlePortfolioChange = (index: number, field: keyof PortfolioItem, value: string) => {
    const updated = [...portfolioItems]
    if (field === "tags") {
      updated[index] = { ...updated[index], tags: value.split(",").map((t) => t.trim()).filter(Boolean) }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setPortfolioItems(updated)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    setSavingProfile(true)
    setError("")
    setProfileSuccess("")

    try {
      const skillsArray = skillsInput
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)

      await updateProfile(
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          bio: bio.trim(),
          tagline: tagline.trim(),
          hourlyRate: Number(hourlyRate) || 0,
          availability,
          skills: skillsArray,
          avatarUrl: avatarUrl.trim(),
          bannerUrl: bannerUrl.trim(),
          githubUrl: githubUrl.trim(),
          linkedinUrl: linkedinUrl.trim(),
          portfolio: portfolio.trim(),
          portfolioItems,
        },
        token,
      )
      setProfileSuccess("Profile information saved successfully!")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.")
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSaveNotifs = async () => {
    if (!token) return
    setSavingNotifs(true)
    setError("")
    setNotifSuccess("")

    try {
      await updatePreferences(notifs, token)
      setNotifSuccess("Notification preferences saved!")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update preferences.")
    } finally {
      setSavingNotifs(false)
    }
  }

  const [exportingData, setExportingData] = useState(false)

  const handleExportData = async () => {
    if (!token) return
    setExportingData(true)
    setError("")

    try {
      const data = await apiFetch<unknown>("/users/export", { token })
      const jsonString = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonString], { type: "application/json" })
      const downloadUrl = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = downloadUrl
      anchor.download = `fairwork-user-export-${user?.id || "account"}.json`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export user account data.")
    } finally {
      setExportingData(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <PageHeader title="Settings" description="Manage your profile information, media assets, display options, and security." />

        {error && <div className="p-3 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">{error}</div>}

        {/* Account Email & Real-World Verification Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <FiShield className="text-primary-400" /> Account Email &amp; Verification Status
              </CardTitle>
              {user?.isEmailVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                  <FiCheck className="h-3.5 w-3.5" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                  Unverified
                </span>
              )}
            </div>
            <CardDescription>
              Manage your account contact email. Unverified or sample placeholder emails must be updated to a valid real-world inbox.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleUpdateEmail}>
            <CardContent className="space-y-4">
              {!user?.isEmailVerified && (
                <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-xs text-amber-200 backdrop-blur-xs">
                  <div className="flex items-center gap-2 font-semibold text-amber-100">
                    <FiAlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>Action Required: Email Verification Pending</span>
                  </div>
                  <p className="mt-1.5 leading-relaxed text-amber-200/90">
                    Your current account email address (<code className="font-mono text-amber-100 bg-amber-500/15 px-1.5 py-0.5 rounded">{user?.email}</code>) is unverified. Please enter your valid email address below and click <strong className="font-semibold text-amber-100">Update to Verify</strong> to receive security alerts and unlock full platform access.
                  </p>
                </div>
              )}

              {emailSuccess && (
                <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center gap-2">
                  <FiCheck className="h-4 w-4" /> {emailSuccess}
                </div>
              )}
              <div>
                <Label htmlFor="emailInput">Account Contact Email Address</Label>
                <Input
                  id="emailInput"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="your.real.email@gmail.com"
                  className="mt-1"
                />
                <p className="mt-1 text-[11px] text-muted">
                  Your primary email address for milestone release alerts, dispute notifications, and account recovery.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-border/60 pt-4">
              <Button type="submit" loading={savingEmail} variant={user?.isEmailVerified ? "secondary" : "primary"} size="sm">
                {user?.isEmailVerified ? "Save Email Address" : "Update to Verify"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Profile Media Assets Zone (Avatar & Cover Banner) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FiImage className="text-primary-400" /> Profile Photo &amp; Cover Banner Media
            </CardTitle>
            <CardDescription>
              Upload custom WebP-optimized avatar photos and hero cover banners.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cover Banner Media Zone */}
            <div>
              <Label className="text-xs font-semibold mb-2 block">Hero Cover Banner Image</Label>
              <div className="h-28 w-full rounded-xl border border-border/80 relative overflow-hidden bg-gradient-to-r from-primary-900/90 via-indigo-900/60 to-purple-900/80 flex items-center justify-center">
                {bannerUrl ? (
                  <img
                    src={bannerUrl}
                    alt="Cover Preview"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none"
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-muted">Default Web3 Gradient Cover</span>
                )}

                <label className="absolute bottom-2 right-2 cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-card/90 hover:bg-card text-foreground border border-border text-xs shadow-md">
                  {uploadingBanner ? (
                    <FiRefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FiCamera className="h-3.5 w-3.5 text-primary-400" />
                  )}
                  <span>{uploadingBanner ? "Uploading..." : "Upload Cover"}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleBannerUpload}
                    disabled={uploadingBanner}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Avatar Photo Media Zone */}
            <div className="flex items-center gap-4 pt-2">
              <Avatar name={user?.name || "User"} src={avatarUrl} size="lg" className="h-16 w-16" />
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Avatar Photo</Label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/60 hover:bg-secondary text-foreground border border-border/80 text-xs font-medium shadow-xs">
                    {uploadingAvatar ? (
                      <FiRefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <FiCamera className="h-3.5 w-3.5 text-primary-400" />
                    )}
                    <span>{uploadingAvatar ? "Uploading Photo..." : "Upload New Photo"}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      className="hidden"
                    />
                  </label>
                  {avatarUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAvatarUrl("")}
                      className="text-xs text-danger"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FiUser className="text-primary-400" /> Profile &amp; Professional Reputation Information
            </CardTitle>
            <CardDescription>
              Update your public tagline, availability, bio, skills, and portfolio items.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSaveProfile}>
            <CardContent className="space-y-4">
              {profileSuccess && (
                <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center gap-2">
                  <FiCheck className="h-4 w-4" /> {profileSuccess}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" required>
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" required>
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tagline">Professional Tagline</Label>
                <Input
                  id="tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Senior Smart Contract &amp; Full-Stack Architect"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hourlyRate">Target Rate ($ USDC / hr)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="85"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="availability">Workplace Availability</Label>
                  <select
                    id="availability"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value as "available" | "busy" | "not_available")}
                    className="mt-1 w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                  >
                    <option value="available">Available for Hire</option>
                    <option value="busy">Busy (Limited Availability)</option>
                    <option value="not_available">Not Available</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell clients or freelancers about your background, experience, and specialization..."
                  className="mt-1 bg-secondary/40 border-border/80 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="skills">Skills &amp; Expertise (Comma Separated)</Label>
                <Input
                  id="skills"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="e.g. Solidity, React, Node.js, Viem, TypeScript"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="portfolio" className="flex items-center gap-1">
                    <FiGlobe className="h-3.5 w-3.5 text-muted" /> Portfolio Website (https://)
                  </Label>
                  <Input
                    id="portfolio"
                    type="url"
                    value={portfolio}
                    onChange={(e) => setPortfolio(e.target.value)}
                    placeholder="https://myportfolio.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="githubUrl" className="flex items-center gap-1">
                    <FiGithub className="h-3.5 w-3.5 text-muted" /> GitHub Profile (https://)
                  </Label>
                  <Input
                    id="githubUrl"
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="linkedinUrl" className="flex items-center gap-1">
                  <FiLinkedin className="h-3.5 w-3.5 text-muted" /> LinkedIn Profile (https://)
                </Label>
                <Input
                  id="linkedinUrl"
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="mt-1"
                />
              </div>

              {/* Portfolio Showcase Management */}
              <div className="pt-4 border-t border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold text-sm">Portfolio Featured Items</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<FiPlus />}
                    onClick={handleAddPortfolioItem}
                    className="text-xs"
                  >
                    Add Portfolio Card
                  </Button>
                </div>

                {portfolioItems.map((item, idx) => (
                  <div key={idx} className="p-3 border border-border/80 rounded-xl bg-secondary/20 space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted">Item #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePortfolioItem(idx)}
                        className="text-danger hover:text-red-400 p-1 text-xs"
                      >
                        <FiTrash2 />
                      </button>
                    </div>

                    <Input
                      placeholder="Project Title"
                      value={item.title}
                      onChange={(e) => handlePortfolioChange(idx, "title", e.target.value)}
                      className="text-xs"
                    />

                    <Textarea
                      placeholder="Short Description"
                      rows={2}
                      value={item.description}
                      onChange={(e) => handlePortfolioChange(idx, "description", e.target.value)}
                      className="text-xs bg-secondary/40"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Live Demo URL (https://)"
                        value={item.projectUrl || ""}
                        onChange={(e) => handlePortfolioChange(idx, "projectUrl", e.target.value)}
                        className="text-xs"
                      />
                      <Input
                        placeholder="GitHub Repository URL (https://)"
                        value={item.githubUrl || ""}
                        onChange={(e) => handlePortfolioChange(idx, "githubUrl", e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <Input
                      placeholder="Tech Stack Tags (Comma Separated, e.g. Solidity, React, Viem)"
                      value={item.tags ? item.tags.join(", ") : ""}
                      onChange={(e) => handlePortfolioChange(idx, "tags", e.target.value)}
                      className="text-xs"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-border/60 pt-4">
              <Button type="submit" disabled={savingProfile} className="bg-primary-600 hover:bg-primary-500 text-white">
                {savingProfile ? (
                  <>
                    <FiRefreshCw className="h-4 w-4 animate-spin mr-2" /> Saving Profile...
                  </>
                ) : (
                  "Save Profile Changes"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Currency Display Preference Card */}
        <Card>
          <CardHeader>
            <CardTitle>Platform & Settlement Currency</CardTitle>
            <CardDescription>
              FairWork operates exclusively in US Dollars. All Web3 contract deposits, milestone allocations, transfers, and escrow commitments strictly settle in USD / USDC on-chain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
              <div className="flex items-center gap-3.5 rounded-xl border border-primary/40 bg-primary/10 p-4 shadow-sm">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/20 border border-primary/30">
                  <FlagUSA className="h-6 w-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">US Dollar (USD / USDC)</p>
                    <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 font-mono text-[10px] text-emerald-400 font-semibold">
                      Standard
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">Fixed-budget milestone settlement currency</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences Matrix */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FiBell className="text-primary-400" /> Notification Preferences
            </CardTitle>
            <CardDescription>
              Configure automated alerts for escrow deposits, milestone payments, and messages.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifSuccess && (
              <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center gap-2">
                <FiCheck className="h-4 w-4" /> {notifSuccess}
              </div>
            )}

            <label className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/60 text-xs cursor-pointer">
              <span>Escrow Deposit Notifications</span>
              <input
                type="checkbox"
                checked={notifs.escrowDeposits}
                onChange={(e) => setNotifs({ ...notifs, escrowDeposits: e.target.checked })}
                className="h-4 w-4 accent-primary"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/60 text-xs cursor-pointer">
              <span>Milestone Release Alerts</span>
              <input
                type="checkbox"
                checked={notifs.milestoneReleases}
                onChange={(e) => setNotifs({ ...notifs, milestoneReleases: e.target.checked })}
                className="h-4 w-4 accent-primary"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/60 text-xs cursor-pointer">
              <span>Workroom Direct Chat Messages</span>
              <input
                type="checkbox"
                checked={notifs.chatMessages}
                onChange={(e) => setNotifs({ ...notifs, chatMessages: e.target.checked })}
                className="h-4 w-4 accent-primary"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/60 text-xs cursor-pointer">
              <span>Dispute &amp; Resolution Warnings</span>
              <input
                type="checkbox"
                checked={notifs.disputeAlerts}
                onChange={(e) => setNotifs({ ...notifs, disputeAlerts: e.target.checked })}
                className="h-4 w-4 accent-primary"
              />
            </label>
          </CardContent>
          <CardFooter className="flex justify-end border-t border-border/60 pt-4">
            <Button onClick={handleSaveNotifs} disabled={savingNotifs} variant="outline">
              Save Notification Matrix
            </Button>
          </CardFooter>
        </Card>

        {/* Connected Accounts & GitHub Developer Integration Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <FiGithub className="text-purple-400" /> Connected Accounts &amp; Developer Verification
              </CardTitle>
              {user?.githubIdentity ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                  <FiCheck className="h-3.5 w-3.5" /> Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/15 border border-slate-500/30 px-2.5 py-0.5 text-xs font-semibold text-slate-400">
                  Not Linked
                </span>
              )}
            </div>
            <CardDescription>
              Link your GitHub account to showcase open-source contribution heatmaps, commit activity streaks, and language stats on your freelancer profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.githubIdentity ? (
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.githubIdentity.avatarUrl || "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"}
                      alt={user.githubIdentity.username}
                      className="w-10 h-10 rounded-xl border border-border object-cover"
                    />
                    <div>
                      <div className="font-semibold text-sm text-foreground">@{user.githubIdentity.username}</div>
                      <div className="text-xs text-muted">
                        Linked on {user.githubIdentity.connectedAt ? new Date(user.githubIdentity.connectedAt).toLocaleDateString() : "Active Session"}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-danger hover:bg-danger/10 border-danger/30"
                    onClick={async () => {
                      if (!token) return
                      if (confirm("Disconnect your GitHub account? Activity metrics will no longer be visible on your profile.")) {
                        try {
                          await (await import("@/services/userApi")).disconnectGithub(token)
                          window.location.reload()
                        } catch (err: any) {
                          alert(err.message || "Failed to disconnect")
                        }
                      }
                    }}
                  >
                    Disconnect
                  </Button>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-foreground">Contribution Heatmap Visibility</div>
                    <div className="text-[11px] text-muted">
                      {user.githubIdentity.visibility === "PUBLIC"
                        ? "Visible to all clients and visitors on your public profile"
                        : "Private mode — only visible to you when logged in"}
                    </div>
                  </div>

                  <select
                    value={user.githubIdentity.visibility}
                    onChange={async (e) => {
                      if (!token) return
                      const newVis = e.target.value as "PUBLIC" | "PRIVATE"
                      try {
                        await (await import("@/services/userApi")).updateGithubVisibility(newVis, token)
                        window.location.reload()
                      } catch (err: any) {
                        alert(err.message || "Failed to update visibility")
                      }
                    }}
                    className="rounded-xl border border-border/80 bg-surface px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                  >
                    <option value="PUBLIC">Public (Recommended)</option>
                    <option value="PRIVATE">Private (Owner Only)</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-secondary/20 border border-dashed border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="text-xs font-semibold text-foreground">GitHub Developer Profile Unlinked</div>
                  <div className="text-xs text-muted">
                    Connecting your GitHub account grants read-only access to your public contribution activity graph.
                  </div>
                </div>

                <a
                  href={`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/users/github/connect`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-purple-600/20 shrink-0"
                >
                  <FiGithub className="h-4 w-4" />
                  Connect GitHub Account
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Web3 Wallet Security Card */}
        <Web3WalletCard
          title="Connected Web3 Wallet &amp; EIP-712 Ownership Verification"
          description="Connect your browser wallet and sign a cryptographically secure backend challenge to verify wallet ownership."
        />

        {/* Data Privacy & Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FiShield className="text-primary-400" /> Data Privacy &amp; Web3 Export
            </CardTitle>
            <CardDescription>
              Download a complete JSON record of your account details, projects, and transaction history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" loading={exportingData} onClick={handleExportData} leftIcon={<FiDownload />}>
              Export Account Data (JSON)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
