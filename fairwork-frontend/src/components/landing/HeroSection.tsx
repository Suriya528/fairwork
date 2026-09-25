import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  FiGitPullRequest,
  FiGitMerge,
  FiCheck,
  FiArrowRight,
  FiTerminal,
} from "react-icons/fi"
import { useAuth } from "@/context/AuthContext"
import { useCurrency } from "@/context/CurrencyContext"

const quickTechFilters = [
  "Smart Contract Escrow",
  "React Web Applications",
  "Design Systems",
  "AI Autonomous Agents",
  "Mobile Engineering",
] as const

export function HeroSection() {
  const { status } = useAuth()
  const { formatAmount } = useCurrency()
  const navigate = useNavigate()
  const isAuthed = status === "authenticated"
  const destination = isAuthed ? "/projects" : "/register"

  const [inputQuery, setInputQuery] = useState("")

  function handleStartProject(e: React.FormEvent) {
    e.preventDefault()
    if (inputQuery.trim()) {
      navigate(`/projects?search=${encodeURIComponent(inputQuery.trim())}`)
    } else {
      navigate(destination)
    }
  }

  return (
    <section className="relative w-full bg-base border-b border-border/40 pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden">
      {/* GitHub Hero Ambient Lighting */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-blue-500/10 via-emerald-500/5 to-transparent blur-3xl" />
        <div className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-purple-600/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* GitHub Signature Vertical Spine Container */}
        <div className="relative pl-6 sm:pl-10">
          {/* Vertical Glowing Spine Line (Spans the entire height) */}
          <div
            className="pointer-events-none absolute left-0 top-2 bottom-0 w-[2px] bg-gradient-to-b from-purple-500 via-emerald-500 to-blue-500"
            aria-hidden
          />

          {/* Node 1: Purple Git Pull Request Node on Spine */}
          <div className="absolute -left-[11px] top-0 flex h-6 w-6 items-center justify-center rounded-full border border-purple-400 bg-base text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.5)]">
            <FiGitPullRequest className="h-3 w-3" />
          </div>

          {/* Hero Content Header */}
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-mono text-muted mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Milestone-Verified Software Development</span>
            </div>

            <h1 className="text-balance text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl leading-[1.06]">
              Where the world builds software.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400">
                And settles every milestone.
              </span>
            </h1>

            <p className="mt-6 text-base text-muted sm:text-xl leading-relaxed max-w-2xl font-sans">
              Scope technical deliverables, review working code through verified pull requests, and release non-custodial smart contract escrow without middleman hold or fees.
            </p>

            {/* GitHub-style Dual Action Search Form */}
            <form onSubmit={handleStartProject} className="mt-8 flex flex-col sm:flex-row items-stretch gap-3 max-w-2xl">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Enter a project brief or skill (e.g. Next.js, Solidity, Foundry)..."
                  className="h-12 w-full rounded-md border border-border-strong bg-surface px-4 text-xs sm:text-sm text-foreground placeholder:text-subtle focus:border-emerald-500 focus:outline-none transition-all font-mono"
                  aria-label="Project brief input"
                />
              </div>

              {/* GitHub signature green button */}
              <button
                type="submit"
                className="flex h-12 items-center justify-center gap-2 rounded-md bg-[#238636] hover:bg-[#2ea043] px-6 text-xs sm:text-sm font-bold text-white shadow-sm transition-colors shrink-0"
              >
                <span>Start a project</span>
                <FiArrowRight className="h-4 w-4" />
              </button>

              <Link
                to={destination}
                className="flex h-12 items-center justify-center rounded-md border border-border-strong bg-surface px-5 text-xs sm:text-sm font-semibold text-foreground hover:bg-elevated transition-colors shrink-0"
              >
                Browse briefs
              </Link>
            </form>

            {/* Quick Tech Chips */}
            <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-subtle font-mono">
              <span className="text-muted">Trending stacks:</span>
              {quickTechFilters.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => navigate(`/projects?search=${encodeURIComponent(chip)}`)}
                  className="rounded border border-border/80 bg-surface/70 px-2 py-0.5 text-[11px] text-muted hover:border-emerald-500 hover:text-foreground transition-colors cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* GitHub PR & Milestone Review Interface Window */}
          <div className="mt-12 max-w-5xl overflow-hidden rounded-xl border border-border-strong bg-[#0d1117] shadow-2xl">
            {/* Window Titlebar */}
            <div className="flex items-center justify-between border-b border-border bg-[#161b22] px-4 py-2.5 text-xs">
              <div className="flex items-center gap-2 font-mono text-muted">
                <FiTerminal className="h-3.5 w-3.5 text-subtle" />
                <span className="text-foreground font-semibold">fairwork</span>
                <span>/</span>
                <span className="text-foreground font-semibold">escrow-milestone-review</span>
              </div>

              <div className="flex items-center gap-2 font-mono text-[11px] text-subtle">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>Deterministic Execution</span>
              </div>
            </div>

            {/* Pull Request Header Banner */}
            <div className="border-b border-border/80 p-5 sm:p-6 bg-[#0d1117]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* GitHub Merged Purple Pill */}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#8957e5] px-3 py-1 text-xs font-semibold text-white">
                    <FiGitMerge className="h-3.5 w-3.5" />
                    Merged
                  </span>

                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-foreground">
                      Milestone 02: Production dApp Interface &amp; Invariant Testing{" "}
                      <span className="text-subtle font-normal font-mono">#42</span>
                    </h2>
                  </div>
                </div>

                <div className="font-mono text-xs">
                  <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-400 font-bold">
                    Escrow Settled: {formatAmount(180000)}
                  </span>
                </div>
              </div>

              {/* PR Sub-bar */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-subtle">
                <span>
                  <strong className="text-foreground font-semibold">@alex-dev</strong> merged 8 commits into{" "}
                  <code className="rounded bg-surface px-1 py-0.5 text-foreground text-[11px]">main</code>
                </span>
                <span>•</span>
                <span>12 files changed</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">+840 lines</span>
              </div>
            </div>

            {/* GitHub Actions Checks Box */}
            <div className="border-b border-border/80 bg-[#161b22]/70 p-5 font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#238636] text-white">
                    <FiCheck className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-bold text-foreground">
                    All milestone verification checks have passed
                  </span>
                </div>
                <span className="text-subtle text-[11px]">4 successful checks</span>
              </div>

              <div className="mt-3 divide-y divide-border/40">
                {[
                  { name: "Continuous Integration / Typecheck & Unit Tests", detail: "Passed in 14s", status: "success" },
                  { name: "Slither Security Analysis / Invariant Verification", detail: "0 high/medium vulnerabilities", status: "success" },
                  { name: "Escrow Deposit Lockbox Verification", detail: "1,800 USDC locked in contract storage", status: "success" },
                  { name: "Client Deliverable Review & Atomic Settlement", detail: "Signed on-chain • Payout transferred", status: "success" },
                ].map((check) => (
                  <div key={check.name} className="flex items-center justify-between py-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <FiCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span className="text-foreground">{check.name}</span>
                    </div>
                    <span className="text-subtle">{check.detail}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Real Diff View Box */}
            <div className="bg-[#0d1117] p-4 sm:p-5 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 mb-2 text-subtle text-[11px] border-b border-border/50">
                <span>diff --git a/contracts/EscrowSettlement.sol</span>
                <span className="text-emerald-400">100% P2P Payout</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="text-subtle">@@ -142,6 +142,8 @@ function releaseMilestone() @@</div>
                <div className="rounded bg-rose-500/10 px-2 py-0.5 text-rose-300">
                  - e.milestones[index].status = MilestoneStatus.Locked;
                </div>
                <div className="rounded bg-emerald-500/15 px-2 py-0.5 text-emerald-300">
                  + e.milestones[index].status = MilestoneStatus.Released;
                </div>
                <div className="rounded bg-emerald-500/15 px-2 py-0.5 text-emerald-300">
                  + IERC20(token).safeTransfer(freelancer, 1800 * 1e6); // Direct to wallet
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
