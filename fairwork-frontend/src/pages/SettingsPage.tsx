import { useState } from "react"
import { FiAlertTriangle, FiSun, FiMoon } from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card"
import { WalletAddress } from "@/components/common/WalletAddress"
import { PageHeader } from "@/components/common/PageHeader"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/context/ThemeContext"
import { connectWallet } from "@/services/web3"
import { getWalletNonce, verifyWallet } from "@/services/authApi"
import { cn } from "@/lib/utils"

export function SettingsPage() {
  const { user, token, updateWallet } = useAuth()
  const { theme, setTheme } = useTheme()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const verify = async () => {
    if (!token) return
    setSaving(true)
    setMessage("")
    try {
      const { wallet, account } = await connectWallet()
      const nonce = await getWalletNonce(token)
      const signature = await wallet.signTypedData({
        account,
        domain: nonce.domain,
        types: nonce.types,
        primaryType: nonce.primaryType,
        message: { walletAddress: account, nonce: nonce.nonce, purpose: nonce.purpose },
      })
      const verified = await verifyWallet(account, nonce.nonce, signature, token)
      await updateWallet(verified.walletAddress)
      setMessage("Wallet verified.")
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Wallet verification failed.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <PageHeader title="Settings" description="Manage your account preferences and connected wallet." />

        {/* Theme Appearance Card */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance &amp; Theme</CardTitle>
            <CardDescription>
              Customize how FairWork looks on your device. Choose between Dark and Light mode.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={cn(
                  "flex flex-col items-center gap-3 rounded-xl border p-4 text-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  theme === "dark"
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border bg-surface hover:bg-elevated",
                )}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-950 text-amber-400 border border-gray-800">
                  <FiSun className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-foreground">Dark Mode</p>
                  <p className="mt-0.5 text-[11px] text-muted">Original dark theme</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTheme("light")}
                className={cn(
                  "flex flex-col items-center gap-3 rounded-xl border p-4 text-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  theme === "light"
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border bg-surface hover:bg-elevated",
                )}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-indigo-600 border border-slate-300">
                  <FiMoon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-foreground">Light Mode</p>
                  <p className="mt-0.5 text-[11px] text-muted">Crisp light theme</p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Verification Card */}
        <Card>
          <CardHeader>
            <CardTitle>Wallet</CardTitle>
            <CardDescription>
              Connect and sign an EIP-712 message to verify wallet ownership.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user?.walletAddress ? (
              <WalletAddress address={user.walletAddress} />
            ) : (
              <p className="text-sm text-muted">No verified wallet connected.</p>
            )}
            {message && <p className="mt-3 text-sm text-foreground">{message}</p>}
          </CardContent>
          <CardFooter>
            <Button loading={saving} onClick={verify}>
              Connect &amp; verify wallet
            </Button>
          </CardFooter>
        </Card>

        {/* Danger Zone */}
        <Card className="border-danger/25">
          <CardHeader>
            <CardTitle className="text-danger">Danger zone</CardTitle>
          </CardHeader>
          <CardFooter>
            <Button variant="danger" disabled leftIcon={<FiAlertTriangle />}>
              Delete account unavailable
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
