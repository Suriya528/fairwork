import { cn } from "@/lib/utils"

export function FlagIndia({ className = "h-3.5 w-5" }: { className?: string }) {
  return (
    <svg
      className={cn("inline-block rounded-[2px] overflow-hidden shadow-sm shrink-0 border border-black/10 transition-transform duration-200", className)}
      viewBox="0 0 30 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="30" height="6.67" fill="#FF9933" />
      <rect y="6.67" width="30" height="6.67" fill="#FFFFFF" />
      <rect y="13.33" width="30" height="6.67" fill="#128807" />
      <circle cx="15" cy="10" r="2.2" fill="none" stroke="#000080" strokeWidth="0.6" />
      <circle cx="15" cy="10" r="0.4" fill="#000080" />
    </svg>
  )
}

export function FlagUSA({ className = "h-3.5 w-5" }: { className?: string }) {
  return (
    <svg
      className={cn("inline-block rounded-[2px] overflow-hidden shadow-sm shrink-0 border border-black/10 transition-transform duration-200", className)}
      viewBox="0 0 30 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="30" height="20" fill="#B22234" />
      <rect y="2.86" width="30" height="2.86" fill="#FFFFFF" />
      <rect y="8.57" width="30" height="2.86" fill="#FFFFFF" />
      <rect y="14.28" width="30" height="2.86" fill="#FFFFFF" />
      <rect width="12" height="11.43" fill="#3C3B6E" />
      <circle cx="2.5" cy="2.5" r="0.6" fill="#FFFFFF" />
      <circle cx="6" cy="2.5" r="0.6" fill="#FFFFFF" />
      <circle cx="9.5" cy="2.5" r="0.6" fill="#FFFFFF" />
      <circle cx="4.25" cy="5.7" r="0.6" fill="#FFFFFF" />
      <circle cx="7.75" cy="5.7" r="0.6" fill="#FFFFFF" />
      <circle cx="2.5" cy="8.9" r="0.6" fill="#FFFFFF" />
      <circle cx="6" cy="8.9" r="0.6" fill="#FFFFFF" />
      <circle cx="9.5" cy="8.9" r="0.6" fill="#FFFFFF" />
    </svg>
  )
}
