import { useState, useEffect } from "react"
import {
  FiRefreshCw,
  FiCheckCircle,
} from "react-icons/fi"
import { Dialog } from "@/components/ui/Dialog"
import { Button } from "@/components/ui/Button"

export interface PendingApprovalModalProps {
  open: boolean
  onClose: () => void
  onCheckApproval: () => Promise<boolean>
}

/**
 * Production Guidance Dialog displayed when MetaMask has a pending prompt in the toolbar (-32002).
 * Explains browser extension security architecture, guides user to the browser toolbar/puzzle piece,
 * and actively polls for approval in real-time.
 */
export function PendingApprovalModal({
  open,
  onClose,
  onCheckApproval,
}: PendingApprovalModalProps) {
  const [checking, setChecking] = useState(false)
  const [approved, setApproved] = useState(false)

  // Auto-poll eth_accounts every 1000ms while modal is open
  useEffect(() => {
    if (!open || approved) return

    let cancelled = false
    const interval = setInterval(async () => {
      if (cancelled) return
      try {
        const ok = await onCheckApproval()
        if (ok && !cancelled) {
          setApproved(true)
          setTimeout(() => {
            onClose()
          }, 800)
        }
      } catch {
        // Ignore polling errors
      }
    }, 1200)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [open, approved, onCheckApproval, onClose])

  const handleManualCheck = async () => {
    setChecking(true)
    try {
      const ok = await onCheckApproval()
      if (ok) {
        setApproved(true)
        setTimeout(() => {
          onClose()
        }, 600)
      }
    } finally {
      setChecking(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="md"
      title="MetaMask Approval Waiting in Browser"
      description="Chrome keeps your connection prompt in the extension toolbar when dismissed."
    >
      <div className="space-y-5 pt-2 text-foreground">
        {/* Animated Visual Guidance Card */}
        <div className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-950/40 via-surface to-elevated p-5">
          <div className="flex items-start gap-4">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-3xl shadow-inner">
              <span>🦊</span>
              {/* Pulsing radar ring */}
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex h-4 w-4 rounded-full bg-sky-500 text-[10px] font-bold text-white items-center justify-center">
                  1
                </span>
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-sky-300">
                Prompt is waiting in your browser toolbar
              </h4>
              <p className="text-xs text-muted leading-relaxed">
                Because MetaMask was previously opened, Chromium minimizes the approval into your browser toolbar. Web security prevents opening a second popup while one is waiting.
              </p>
            </div>
          </div>

          {/* Visual Step-by-Step Instructions */}
          <div className="mt-4 grid gap-2.5 rounded-xl border border-border/80 bg-base/80 p-3.5 text-xs">
            <div className="flex items-center gap-2.5 font-medium text-foreground">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-[11px]">
                1
              </span>
              <span>
                Look at the <strong>top-right corner</strong> of your browser window (next to the address bar).
              </span>
            </div>

            <div className="flex items-center gap-2.5 font-medium text-foreground">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-[11px]">
                2
              </span>
              <span>
                Click the <strong>🦊 MetaMask icon</strong> (or click the <strong>🧩 Puzzle piece</strong> if hidden).
              </span>
            </div>

            <div className="flex items-center gap-2.5 font-medium text-foreground">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-[11px]">
                3
              </span>
              <span>
                Click <strong>"Next"</strong> and <strong>"Connect"</strong>. FairWork will auto-detect it immediately!
              </span>
            </div>
          </div>
        </div>

        {/* Live Detection Radar Status */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-base px-3.5 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            {approved ? (
              <>
                <FiCheckCircle className="h-4 w-4 text-emerald-400" />
                <span className="font-semibold text-emerald-400">
                  Approved! Connecting wallet...
                </span>
              </>
            ) : (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                </span>
                <span className="text-muted">
                  Listening for authorization in extension...
                </span>
              </>
            )}
          </div>

          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleManualCheck}
            loading={checking}
            leftIcon={<FiRefreshCw className="h-3.5 w-3.5" />}
          >
            Check Now
          </Button>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted hover:text-foreground underline cursor-pointer"
          >
            Cancel / Close Modal
          </button>

          <Button
            type="button"
            variant="primary"
            onClick={handleManualCheck}
            loading={checking}
          >
            I've Approved in MetaMask
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
