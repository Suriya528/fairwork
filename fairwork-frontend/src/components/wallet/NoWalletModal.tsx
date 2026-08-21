import { useState } from "react"
import {
  FiAlertCircle,
  FiExternalLink,
  FiDownload,
  FiLock,
  FiRefreshCw,
  FiShield,
} from "react-icons/fi"
import { Dialog } from "@/components/ui/Dialog"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { OFFICIAL_METAMASK_INSTALL_URL } from "@/context/WalletContext"

export interface NoWalletModalProps {
  open: boolean
  onClose: () => void
  onRedetect: () => Promise<boolean>
}

/**
 * Production Guidance Dialog displayed when no compatible Web3 EVM provider is detected.
 * Strictly links to official MetaMask installation and reassures users that FairWork
 * never requests or stores private keys or seed phrases.
 */
export function NoWalletModal({ open, onClose, onRedetect }: NoWalletModalProps) {
  const [checking, setChecking] = useState(false)
  const [notFoundAfterRetry, setNotFoundAfterRetry] = useState(false)

  const handleRedetect = async () => {
    setChecking(true)
    setNotFoundAfterRetry(false)

    const detected = await onRedetect()
    setChecking(false)

    if (detected) {
      onClose()
    } else {
      setNotFoundAfterRetry(true)
    }
  }

  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  const handleModalClose = () => {
    setNotFoundAfterRetry(false)
    setChecking(false)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleModalClose}
      size="md"
      title={
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning-soft text-warning">
            <FiShield className="h-4 w-4" />
          </div>
          <span>No compatible wallet detected</span>
        </div>
      }
      description="FairWork uses Web3 EVM smart contracts for payment escrow protection and cryptographic EIP-712 wallet verification."
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2.5 w-full">
          <Button variant="secondary" size="md" onClick={handleModalClose}>
            Cancel
          </Button>

          <Button
            variant="secondary"
            size="md"
            loading={checking}
            onClick={handleRedetect}
            leftIcon={<FiRefreshCw className="h-4 w-4" />}
          >
            I've Installed MetaMask
          </Button>

          <a
            href={OFFICIAL_METAMASK_INSTALL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <FiDownload className="h-4 w-4" />
            Install MetaMask
            <FiExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      }
    >
      <div className="flex flex-col gap-4 text-xs">
        {/* Recommended Wallet Banner */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
              🦊
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground text-sm">Recommended Wallet: MetaMask</span>
              <span className="text-subtle text-[11px]">Official EVM Web3 Browser Extension &amp; Mobile Wallet</span>
            </div>
          </div>
          <Badge tone="primary">Sepolia Ready</Badge>
        </div>

        {/* Retry Failure Warning Alert */}
        {notFoundAfterRetry && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-3.5 text-warning"
          >
            <FiAlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1.5">
              <p className="font-medium leading-relaxed">
                MetaMask still isn't detected. If you just installed it, refresh this page and try Connect Wallet again.
              </p>
              <div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReload}
                  leftIcon={<FiRefreshCw className="h-3.5 w-3.5" />}
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Key Security Policy Callout */}
        <div className="rounded-xl border border-success/30 bg-success-soft/30 p-3.5 flex items-start gap-3 text-foreground">
          <FiLock className="h-4 w-4 shrink-0 text-success mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-success uppercase text-[10px] tracking-wider">
              Security Guarantee
            </span>
            <p className="text-muted leading-relaxed">
              FairWork <strong>never</strong> asks for or stores private keys, Secret Recovery Phrases, or wallet passwords. MetaMask handles wallet creation and key security.
            </p>
          </div>
        </div>

        {/* Setup Steps */}
        <div className="flex flex-col gap-2 pt-1">
          <span className="font-semibold text-subtle uppercase text-[10px] tracking-wider">
            Setup Instructions
          </span>
          <ol className="flex flex-col gap-2 pl-1">
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-elevated text-[11px] font-bold text-foreground">
                1
              </span>
              <span className="text-muted pt-0.5">
                Click <strong>Install MetaMask</strong> above to download the official browser extension or app.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-elevated text-[11px] font-bold text-foreground">
                2
              </span>
              <span className="text-muted pt-0.5">
                Create or import a wallet inside MetaMask.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-elevated text-[11px] font-bold text-foreground">
                3
              </span>
              <span className="text-muted pt-0.5">
                Return to FairWork and click <strong>Connect Wallet</strong>.
              </span>
            </li>
          </ol>
        </div>
      </div>
    </Dialog>
  )
}
