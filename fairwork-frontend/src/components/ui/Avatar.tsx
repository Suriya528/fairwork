import { useState } from "react"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/format"

export interface AvatarProps {
  name: string
  src?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeStyles = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
}

/** User avatar with graceful fallback to initials. */
export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const [errored, setErrored] = useState(false)
  const showImage = src && !errored

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-strong bg-elevated font-semibold text-muted",
        sizeStyles[size],
        className,
      )}
    >
      {showImage ? (
        <img
          src={src || "/placeholder.svg"}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <span aria-hidden>{getInitials(name)}</span>
      )}
    </span>
  )
}
