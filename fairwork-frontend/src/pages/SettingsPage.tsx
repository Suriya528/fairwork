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
} from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Label } from "@/components/ui/Label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card"
import { PageHeader } from "@/components/common/PageHeader"
import { FlagIndia, FlagUSA } from "@/components/common/FlagIcons"
import { useCurrency } from "@/context/CurrencyContext"
import { useAuth } from "@/context/AuthContext"
import { Web3WalletCard } from "@/components/wallet/Web3WalletCard"
import { updateProfile, updatePreferences, type NotificationPreferences } from "@/services/userApi"
import { cn } from "@/lib/utils"

export function SettingsPage() {
  const { currency, setCurrency } = useCurrency()
  const { user, token } = useAuth()

  // Profile Form State
  const [firstName, setFirstName] = useState(user?.name ? user.name.split(" ")[0] || "" : "")
  const [lastName, setLastName] = useState(user?.name ? user.name.split(" ").slice(1).join(" ") || "" : "")
  const [bio, setBio] = useState(user?.bio || "")
  const [skillsInput, setSkillsInput] = useState(user?.skills ? user.skills.join(", ") : "")
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "")
  const [githubUrl, setGithubUrl] = useState(user?.githubUrl || "")
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedinUrl || "")
  const [portfolio, setPortfolio] = useState(user?.portfolio || "")

  const [savingProfile, setSavingProfile] = useState(false)
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

  useEffect(() => {
    if (user) {
      if (user.bio) setBio(user.bio)
      if (user.skills) setSkillsInput(user.skills.join(", "))
      if (user.avatarUrl) setAvatarUrl(user.avatarUrl)
      if (user.githubUrl) setGithubUrl(user.githubUrl)
      if (user.linkedinUrl) setLinkedinUrl(user.linkedinUrl)
      if (user.portfolio) setPortfolio(user.portfolio)
    }
  }, [user])

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
          skills: skillsArray,
          avatarUrl: avatarUrl.trim(),
          githubUrl: githubUrl.trim(),
          linkedinUrl: linkedinUrl.trim(),
          portfolio: portfolio.trim(),
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

  const handleExportData = () => {
    if (!token) return
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"
    window.open(`${API_URL}/users/export?token=${token}`, "_blank")
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <PageHeader title="Settings" description="Manage your profile information, display options, and security." />

        {error && <div className="p-3 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">{error}</div>}

        {/* Profile Information Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FiUser className="text-primary-400" /> Profile Information
            </CardTitle>
            <CardDescription>
              Update your public name, bio, skills, and portfolio links.
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
                    <FiGlobe className="h-3.5 w-3.5 text-muted" /> Portfolio URL
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
                    <FiGithub className="h-3.5 w-3.5 text-muted" /> GitHub Profile
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
            </CardContent>
            <CardFooter className="flex justify-end border-t border-border/60 pt-4">
              <Button type="submit" disabled={savingProfile} className="bg-primary-600 hover:bg-primary-500 text-white">
                {savingProfile ? (
                  <>
                    <FiRefreshCw className="h-4 w-4 animate-spin mr-2" /> Saving...
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
            <CardTitle>Display Currency (Settlement Invariant: USDC)</CardTitle>
            <CardDescription>
              Select your display currency for UI budget estimation. All Web3 contract deposits, transfers, and escrow commitments strictly settle in USDC on-chain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setCurrency("INR")}
                className={cn(
                  "group relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary overflow-hidden",
                  currency === "INR"
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border bg-surface hover:bg-elevated hover:border-primary/50",
                )}
              >
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/30 font-bold text-lg font-mono transition-transform duration-200 group-hover:scale-105">
                  <span>₹</span>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 scale-75 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100">
                    <FlagIndia className="h-5 w-7" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-xs font-bold text-foreground">INR (~₹ Estimated)</p>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted">Estimated Display Only</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={cn(
                  "group relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary overflow-hidden",
                  currency === "USD"
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border bg-surface hover:bg-elevated hover:border-emerald-500/50",
                )}
              >
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold text-lg font-mono transition-transform duration-200 group-hover:scale-105">
                  <span>$</span>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 scale-75 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100">
                    <FlagUSA className="h-5 w-7" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-xs font-bold text-foreground">USD ($ / USDC)</p>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted">On-Chain Settlement Value</p>
                </div>
              </button>
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
            <Button variant="outline" onClick={handleExportData} leftIcon={<FiDownload />}>
              Export Account Data (JSON)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
