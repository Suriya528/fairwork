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
import { PageHeader } from "@/components/common/PageHeader"
import { FlagIndia, FlagUSA } from "@/components/common/FlagIcons"
import { useTheme } from "@/context/ThemeContext"
import { useCurrency } from "@/context/CurrencyContext"
import { Web3WalletCard } from "@/components/wallet/Web3WalletCard"
import { cn } from "@/lib/utils"

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { currency, setCurrency } = useCurrency()

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <PageHeader title="Settings" description="Manage your account preferences and connected wallet." />

        {/* Currency Display Preference Card */}
        <Card>
          <CardHeader>
            <CardTitle>Display Currency</CardTitle>
            <CardDescription>
              Select your preferred display currency for project budgets and application financial summaries.
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
                  <span className="transition-opacity duration-200 group-hover:opacity-20">₹</span>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 scale-75 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100">
                    <FlagIndia className="h-5 w-7" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-xs font-bold text-foreground">INR (₹)</p>
                    <FlagIndia className="h-3 w-4 opacity-70 transition-all duration-200 group-hover:opacity-100 group-hover:scale-110" />
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted">Indian Rupee</p>
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
                  <span className="transition-opacity duration-200 group-hover:opacity-20">$</span>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 scale-75 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100">
                    <FlagUSA className="h-5 w-7" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-xs font-bold text-foreground">USD ($)</p>
                    <FlagUSA className="h-3 w-4 opacity-70 transition-all duration-200 group-hover:opacity-100 group-hover:scale-110" />
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted">US Dollar</p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

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

        <Web3WalletCard
          title="Connected Web3 Wallet &amp; EIP-712 Ownership Verification"
          description="Connect your browser wallet and sign a cryptographically secure one-time backend challenge to link ownership to your FairWork account."
        />

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
