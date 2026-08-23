import React, { useEffect, useState } from "react"
import {
  FiGithub,
  FiZap,
  FiCalendar,
  FiExternalLink,
  FiStar,
  FiGitBranch,
  FiCode,
  FiLock,
  FiRefreshCw,
  FiAward,
} from "react-icons/fi"
import { getGithubActivity, GithubActivityDTO } from "../../services/userApi"
import { useAuth } from "../../context/AuthContext"

interface Props {
  targetUserId: string
  isOwner?: boolean
}

export const GithubContributionHeatmap: React.FC<Props> = ({ targetUserId, isOwner }) => {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<GithubActivityDTO | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number } | null>(null)

  useEffect(() => {
    let isSubscribed = true
    async function loadActivity() {
      try {
        setLoading(true)
        setError(null)
        const res = await getGithubActivity(targetUserId, token || undefined)
        if (isSubscribed) setData(res)
      } catch (err: any) {
        if (isSubscribed) {
          if (err.status === 403) {
            setError("PRIVATE_PROFILE")
          } else if (err.status === 404) {
            setError("NOT_CONNECTED")
          } else {
            setError(err.message || "Failed to load GitHub activity")
          }
        }
      } finally {
        if (isSubscribed) setLoading(false)
      }
    }
    loadActivity()
    return () => {
      isSubscribed = false
    }
  }, [targetUserId, token])

  if (loading) {
    return (
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-xl" />
            <div>
              <div className="w-32 h-4 bg-slate-800 rounded mb-2" />
              <div className="w-24 h-3 bg-slate-800/60 rounded" />
            </div>
          </div>
          <div className="w-28 h-8 bg-slate-800 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-800/50 rounded-xl" />
          ))}
        </div>
        <div className="h-32 bg-slate-800/40 rounded-xl" />
      </div>
    )
  }

  if (error === "NOT_CONNECTED") {
    if (!isOwner) return null // Don't render empty section on other users' profiles if not connected
    return (
      <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-8 text-center backdrop-blur-xl">
        <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-400">
          <FiGithub className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-semibold text-slate-100 mb-1">Connect GitHub Profile</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
          Showcase your open-source contributions, commit activity streaks, and top coding languages directly on your FairWork profile.
        </p>
        <a
          href={`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/users/github/connect`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-purple-600/20"
        >
          <FiGithub className="w-4 h-4" />
          Connect GitHub Account
        </a>
      </div>
    )
  }

  if (error === "PRIVATE_PROFILE") {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center backdrop-blur-xl">
        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-3 text-slate-400">
          <FiLock className="w-6 h-6" />
        </div>
        <h4 className="text-base font-medium text-slate-200 mb-1">GitHub Activity Private</h4>
        <p className="text-xs text-slate-400">This freelancer has set their GitHub contribution graph to private mode.</p>
      </div>
    )
  }

  if (error || !data) {
    return null
  }

  const { identity, activity } = data
  const calendar = activity?.contributionCalendar || { weeks: [] }
  const weeks = calendar.weeks || []
  const topLangs = activity?.topLanguages || []
  const repos = activity?.topRepositories || []

  // Helper for heatmap tile color
  const getIntensityClass = (count: number) => {
    if (count === 0) return "bg-slate-800/70 border-slate-800/40"
    if (count <= 3) return "bg-emerald-900/80 border-emerald-800/50"
    if (count <= 6) return "bg-emerald-600 border-emerald-500/50"
    if (count <= 9) return "bg-emerald-500 border-emerald-400/50"
    return "bg-emerald-400 border-emerald-300/50 shadow-sm shadow-emerald-400/30"
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={identity.avatarUrl || "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"}
              alt={identity.username}
              className="w-11 h-11 rounded-xl border border-slate-700 object-cover"
            />
            <div className="absolute -bottom-1 -right-1 bg-slate-950 p-0.5 rounded-full">
              <FiGithub className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-100">{identity.username}</h3>
              {identity.visibility === "PRIVATE" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <FiLock className="w-2.5 h-2.5" /> Private Mode
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">GitHub Verified Developer Profile</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={identity.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700/80 transition-all"
          >
            <span>View on GitHub</span>
            <FiExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <FiCalendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-100">{activity.totalContributionsYear.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 font-medium">Yearly Contributions</div>
          </div>
        </div>

        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <FiZap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-100">{activity.currentStreak} Days</div>
            <div className="text-[11px] text-slate-400 font-medium">Current Active Streak</div>
          </div>
        </div>

        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <FiAward className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-100">{activity.longestStreak} Days</div>
            <div className="text-[11px] text-slate-400 font-medium">Longest Streak</div>
          </div>
        </div>

        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FiCode className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-100">{topLangs[0]?.name || "N/A"}</div>
            <div className="text-[11px] text-slate-400 font-medium">Primary Language</div>
          </div>
        </div>
      </div>

      {/* 52-Week Heatmap Graph */}
      <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <FiCalendar className="w-3.5 h-3.5 text-purple-400" />
            52-Week Contribution Activity
          </span>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>Less</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-800/70 border border-slate-800/40" />
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-900/80 border border-emerald-800/50" />
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
            <span>More</span>
          </div>
        </div>

        <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="inline-flex gap-1 min-w-[700px]">
            {weeks.map((week, wIndex) => (
              <div key={wIndex} className="flex flex-col gap-1">
                {week.contributionDays.map((day, dIndex) => (
                  <div
                    key={dIndex}
                    onMouseEnter={() => setHoveredDay({ date: day.date, count: day.contributionCount })}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`w-3 h-3 rounded-xs border transition-all duration-150 cursor-pointer ${getIntensityClass(
                      day.contributionCount
                    )}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Hover Tooltip Indicator */}
        <div className="h-5 text-xs text-slate-400 text-center font-mono">
          {hoveredDay ? (
            <span className="text-emerald-400 font-medium">
              {hoveredDay.count} contribution{hoveredDay.count !== 1 ? "s" : ""} on {hoveredDay.date}
            </span>
          ) : (
            <span className="text-slate-500 text-[11px]">Hover over squares to inspect daily activity</span>
          )}
        </div>
      </div>

      {/* Top Languages & Top Repositories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
        {/* Language Breakdown */}
        {topLangs.length > 0 && (
          <div className="bg-slate-800/30 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FiCode className="w-3.5 h-3.5 text-purple-400" />
              Top Languages Distribution
            </h4>
            {/* Multi-segmented Progress Bar */}
            <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
              {topLangs.map((lang, idx) => (
                <div
                  key={idx}
                  style={{ width: `${lang.percentage}%`, backgroundColor: lang.color || "#8b5cf6" }}
                  className="h-full transition-all duration-500"
                  title={`${lang.name}: ${lang.percentage}%`}
                />
              ))}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 text-xs">
              {topLangs.map((lang, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lang.color || "#8b5cf6" }} />
                  <span className="text-slate-300 font-medium">{lang.name}</span>
                  <span className="text-slate-500 text-[11px]">{lang.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Featured Public Repositories */}
        {repos.length > 0 && (
          <div className="bg-slate-800/30 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FiGithub className="w-3.5 h-3.5 text-purple-400" />
              Featured Public Repositories
            </h4>
            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {repos.slice(0, 3).map((repo, idx) => (
                <a
                  key={idx}
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 rounded-lg transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-200 group-hover:text-purple-400 transition-colors flex items-center gap-1">
                      {repo.name}
                      <FiExternalLink className="w-3 h-3 text-slate-500 group-hover:text-purple-400" />
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-0.5">
                        <FiStar className="w-3 h-3 text-amber-400" /> {repo.stars}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <FiGitBranch className="w-3 h-3 text-slate-400" /> {repo.forks}
                      </span>
                    </div>
                  </div>
                  {repo.description && (
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{repo.description}</p>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
