import { useState } from "react"
import { FiCopy, FiCheck } from "react-icons/fi"
import { truncateAddress } from "@/lib/format"
import { cn } from "@/lib/utils"

export interface WalletAddressProps {
  address: string
  chars?: number
  className?: string
}

/** Monospace wallet/tx address with copy-to-clipboard. */
export function WalletAddress({
  address,
  chars = 4,
  className,
}: WalletAddressProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={address}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-md border border-border bg-elevated px-2 py-1 font-mono text-xs text-muted transition-colors hover:border-border-strong hover:text-foreground",
        className,
      )}
    >
      {truncateAddress(address, chars)}
      {copied ? (
        <FiCheck size={12} className="text-success" />
      ) : (
        <FiCopy size={12} className="text-subtle group-hover:text-foreground" />
      )}
    </button>
  )
}
