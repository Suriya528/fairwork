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
  /** Optional AI-inspired moving gradient glow on hover (yellow -> coral/red -> violet) */
  aiGlow?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm",
  secondary:
    "bg-elevated text-foreground hover:bg-surface-hover border border-border-strong",
  outline:
    "border border-border-strong text-foreground hover:bg-surface-hover hover:border-subtle",
  ghost: "text-muted hover:text-foreground hover:bg-surface-hover",
  danger: "bg-danger/90 text-white hover:bg-danger",
  success: "bg-success/90 text-black hover:bg-success",
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
  icon: "h-10 w-10 justify-center",
}

/**
 * Primary interactive button with variant/size system and a built-in
 * loading state. Fully keyboard accessible via native <button>.
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
          "inline-flex items-center justify-center rounded-lg font-medium",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          aiGlow && "ai-glow-cta",
          className,
        )}
        {...props}
      >
        {loading ? (
          <Spinner className="h-4 w-4" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    )
  },
)

Button.displayName = "Button"
