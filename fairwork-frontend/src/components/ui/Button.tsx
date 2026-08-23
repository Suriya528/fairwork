import { forwardRef } from "react"
import type { ButtonHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Spinner } from "./Spinner"

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success"

type ButtonSize = "sm" | "md" | "lg" | "icon"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
  /** Optional AI-inspired moving gradient glow on hover */
  aiGlow?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm hover:shadow-primary/20",
  secondary:
    "bg-elevated text-foreground hover:bg-surface-hover border border-border-strong hover:border-primary/40",
  outline:
    "border border-border-strong text-foreground hover:bg-surface-hover hover:border-primary/40 hover:text-primary",
  ghost: "text-muted hover:text-foreground hover:bg-surface-hover",
  danger: "bg-danger/90 text-white hover:bg-danger shadow-sm hover:shadow-danger/20",
  success: "bg-success/90 text-black hover:bg-success shadow-sm hover:shadow-success/20",
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
  icon: "h-10 w-10 justify-center",
}

/**
 * World-class interactive button with micro-animations, active depth press,
 * smooth hover elevation, and built-in keyboard accessibility.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth,
      aiGlow = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          "group relative inline-flex items-center justify-center rounded-xl font-semibold overflow-hidden",
          "transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50 disabled:transform-none",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          aiGlow && "ai-glow-cta",
          className,
        )}
        {...props}
      >
        <span className="relative z-10 inline-flex items-center justify-center gap-2">
          {loading ? (
            <Spinner className="h-4 w-4" />
          ) : (
            leftIcon && <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">{leftIcon}</span>
          )}
          {children}
          {!loading && rightIcon && <span className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:scale-110">{rightIcon}</span>}
        </span>
      </button>
    )
  },
)

Button.displayName = "Button"
