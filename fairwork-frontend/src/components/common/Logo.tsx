import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  showWordmark?: boolean
  wordmarkClassName?: string
}

/**
 * Official FairWork Emblem & Wordmark Component.
 * Concept: Escrow protection shield with Client (left) and Freelancer (right)
 * collaboration chevrons converging around a central milestone core node.
 */
export function Logo({
  className,
  size = "md",
  showWordmark = true,
  wordmarkClassName,
}: LogoProps) {
  const iconSizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  }

  return (
    <div className={cn("inline-flex items-center gap-2.5 shrink-0 group", className)}>
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(iconSizes[size], "shrink-0 transition-transform duration-200 group-hover:scale-105")}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="fw-shield-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="fw-accent-grad" x1="40" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {/* Escrow Shield Protection Framework */}
        <path
          d="M20 3.5L34 9.5V20.5C34 28.8 28.1 35.8 20 38.5C11.9 35.8 6 28.8 6 20.5V9.5L20 3.5Z"
          fill="url(#fw-shield-grad)"
          fillOpacity="0.12"
          stroke="url(#fw-shield-grad)"
          strokeWidth="2.25"
          strokeLinejoin="round"
        />

        {/* Left Side Client Arm & 'F' Monogram Accent */}
        <path
          d="M13.5 14H24.5M13.5 14V26M13.5 20H21.5"
          stroke="currentColor"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-foreground"
        />

        {/* Right Side Freelancer Arm & 'W' Monogram Accent */}
        <path
          d="M20.5 26L23.5 19.5L26.5 26L29.5 19.5"
          stroke="url(#fw-accent-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Central Milestone Settlement Node */}
        <circle cx="20.5" cy="14" r="2" fill="#10b981" />
      </svg>

      {showWordmark && (
        <span className={cn("text-base font-bold tracking-tight text-foreground font-sans", wordmarkClassName)}>
          FairWork
        </span>
      )}
    </div>
  )
}
