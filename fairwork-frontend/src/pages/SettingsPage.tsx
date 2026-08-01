import { Fragment, useState } from "react"
import { FiAlertTriangle, FiCheck } from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Checkbox } from "@/components/ui/Checkbox"
import { WalletAddress } from "@/components/common/WalletAddress"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { PageHeader } from "@/components/common/PageHeader"
import { users } from "@/data/users"
import { notificationPreferences } from "@/data/notifications"
import { validateEmail, validateRequired } from "@/lib/validation"
import type { NotificationCategory } from "@/types"

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  project: "Project updates",
  payment: "Payments & escrow",
  dispute: "Disputes",
  message: "Messages",
  system: "Product announcements",
}

const CATEGORY_ORDER: NotificationCategory[] = [
  "project",
  "payment",
  "dispute",
  "message",
  "system",
]

// TODO: replace with the real authenticated user once session/auth
// context exists (only services/authApi.ts is wired up so far).
const CURRENT_USER_ID = "usr_client_01"

export function SettingsPage() {
  const currentUser = users.find((u) => u.id === CURRENT_USER_ID)

  const [name, setName] = useState(currentUser?.name ?? "")
  const [email, setEmail] = useState(currentUser?.email ?? "")
  const [nameError, setNameError] = useState<string | undefined>()
  const [emailError, setEmailError] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const existingPrefs = notificationPreferences.find((p) => p.userId === CURRENT_USER_ID)
  const [emailPrefs, setEmailPrefs] = useState<Record<NotificationCategory, boolean>>(
    existingPrefs?.email ?? {
      project: true,
      payment: true,
      dispute: true,
      message: true,
      system: false,
    },
  )
  const [pushPrefs, setPushPrefs] = useState<Record<NotificationCategory, boolean>>(
    existingPrefs?.push ?? {
      project: true,
      payment: true,
      dispute: true,
      message: true,
      system: false,
    },
  )
  const [notifSaving, setNotifSaving] = useState(false)
  const [notifSaved, setNotifSaved] = useState(false)

  const [disconnectOpen, setDisconnectOpen] = useState(false)
  const [disconnectLoading, setDisconnectLoading] = useState(false)
  const [walletConnected, setWalletConnected] = useState(true)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  if (!currentUser) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-muted">No account found.</p>
      </div>
    )
  }

  const handleSaveAccount = async () => {
    const nErr = validateRequired(name, "Name")
    const eErr = validateEmail(email)
    setNameError(nErr)
    setEmailError(eErr)
    if (nErr || eErr) return

    setSaving(true)
    setSaved(false)
    await new Promise((r) => setTimeout(r, 900))
    setSaving(false)
    setSaved(true)
  }

  const handleSaveNotifications = async () => {
    setNotifSaving(true)
    setNotifSaved(false)
    await new Promise((r) => setTimeout(r, 700))
    setNotifSaving(false)
    setNotifSaved(true)
  }

  const toggleEmailPref = (category: NotificationCategory) => {
    setEmailPrefs((prev) => ({ ...prev, [category]: !prev[category] }))
    setNotifSaved(false)
  }

  const togglePushPref = (category: NotificationCategory) => {
    setPushPrefs((prev) => ({ ...prev, [category]: !prev[category] }))
    setNotifSaved(false)
  }

  const handleDisconnect = async () => {
    setDisconnectLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setWalletConnected(false)
    setDisconnectLoading(false)
    setDisconnectOpen(false)
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    setDeleteLoading(false)
    setDeleteOpen(false)
    // Real deletion + redirect would happen here once an account API exists.
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <PageHeader title="Settings" description="Manage your account, wallet, and preferences." />

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your name and email as shown to other users.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-name" required>
                Full name
              </Label>
              <Input
                id="settings-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setSaved(false)
                }}
                invalid={!!nameError}
              />
              {nameError && <p className="text-xs text-danger">{nameError}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-email" required>
                Email
              </Label>
              <Input
                id="settings-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setSaved(false)
                }}
                invalid={!!emailError}
              />
              {emailError && <p className="text-xs text-danger">{emailError}</p>}
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            {saved ? (
              <span className="flex items-center gap-1.5 text-xs text-success">
                <FiCheck className="h-3.5 w-3.5" />
                Saved
              </span>
            ) : (
              <span />
            )}
            <Button variant="primary" size="sm" loading={saving} onClick={handleSaveAccount}>
              Save changes
            </Button>
          </CardFooter>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Choose what you're alerted about, and where.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 gap-y-4">
              <span className="text-xs font-medium uppercase tracking-wide text-subtle">
                Category
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-subtle">
                Email
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-subtle">
                Push
              </span>

              {CATEGORY_ORDER.map((category) => (
                <Fragment key={category}>
                  <span className="text-sm text-foreground">
                    {CATEGORY_LABELS[category]}
                  </span>
                  <Checkbox
                    id={`notif-email-${category}`}
                    checked={emailPrefs[category]}
                    onChange={() => toggleEmailPref(category)}
                  />
                  <Checkbox
                    id={`notif-push-${category}`}
                    checked={pushPrefs[category]}
                    onChange={() => togglePushPref(category)}
                  />
                </Fragment>
              ))}
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            {notifSaved ? (
              <span className="flex items-center gap-1.5 text-xs text-success">
                <FiCheck className="h-3.5 w-3.5" />
                Saved
              </span>
            ) : (
              <span />
            )}
            <Button
              variant="primary"
              size="sm"
              loading={notifSaving}
              onClick={handleSaveNotifications}
            >
              Save preferences
            </Button>
          </CardFooter>
        </Card>

        {/* Wallet */}
        <Card>
          <CardHeader>
            <CardTitle>Wallet</CardTitle>
            <CardDescription>
              The wallet used to sign contracts and receive or send escrow payments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {walletConnected ? (
              <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
                <WalletAddress address={currentUser.walletAddress} chars={6} />
                <Button variant="outline" size="sm" onClick={() => setDisconnectOpen(true)}>
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-dashed border-border p-4">
                <span className="text-sm text-muted">No wallet connected</span>
                <Button variant="primary" size="sm" onClick={() => setWalletConnected(true)}>
                  Connect wallet
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card className="border-danger/25">
          <CardHeader>
            <CardTitle className="text-danger">Danger zone</CardTitle>
            <CardDescription>
              Deleting your account is permanent and cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<FiAlertTriangle className="h-4 w-4" />}
              onClick={() => setDeleteOpen(true)}
            >
              Delete account
            </Button>
          </CardFooter>
        </Card>
      </div>

      <ConfirmDialog
        open={disconnectOpen}
        onClose={() => setDisconnectOpen(false)}
        onConfirm={handleDisconnect}
        loading={disconnectLoading}
        title="Disconnect wallet?"
        confirmLabel="Disconnect"
        description="You won't be able to fund escrow or receive releases until you reconnect a wallet."
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteAccount}
        loading={deleteLoading}
        destructive
        title="Delete your account?"
        confirmLabel="Delete account"
        description="This permanently removes your profile, project history, and reputation. Funds already in escrow are not affected and will resolve per their existing terms."
      />
    </div>
  )
}