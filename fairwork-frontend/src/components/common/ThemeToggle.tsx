import { FiSun, FiMoon } from "react-icons/fi"
import { useTheme } from "@/context/ThemeContext"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border border-border bg-surface p-2 text-muted transition-all duration-150 hover:border-border-strong hover:bg-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      <span className="relative flex h-4 w-4 items-center justify-center">
        {isDark ? (
          <FiSun className="h-4 w-4 text-amber-400 transition-transform" />
        ) : (
          <FiMoon className="h-4 w-4 text-indigo-500 transition-transform" />
        )}
      </span>
      {showLabel && (
        <span className="text-xs font-semibold font-mono">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  )
}
