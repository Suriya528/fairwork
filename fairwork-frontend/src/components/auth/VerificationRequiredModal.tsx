import { useNavigate } from "react-router-dom"
import { FiLock, FiArrowRight, FiX } from "react-icons/fi"
import { Button } from "@/components/ui/Button"

interface VerificationRequiredModalProps {
  open: boolean
  onClose: () => void
  actionName?: string
}

export function VerificationRequiredModal({
  open,
  onClose,
  actionName = "perform this action",
}: VerificationRequiredModalProps) {
  const navigate = useNavigate()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-amber-500/30 bg-surface p-6 shadow-2xl space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-subtle hover:text-foreground p-1 rounded-lg transition-colors"
          aria-label="Close modal"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <FiLock className="h-6 w-6" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-foreground">Action Locked: Verification Required</h3>
          <p className="mt-1 text-xs text-muted leading-relaxed">
            You must verify your email address to {actionName}. Email verification protects project contracts, escrow deposits, and platform security.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/60">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onClose()
              navigate("/settings")
            }}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
          >
            <span>Go to Settings to Verify</span>
            <FiArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
