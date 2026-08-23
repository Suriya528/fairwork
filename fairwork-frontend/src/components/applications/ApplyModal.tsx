import { useState } from "react"
import { FiDollarSign, FiPaperclip, FiSend, FiX } from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { applyToProject, type ApiApplication } from "@/services/applicationsApi"
import { useAuth } from "@/context/AuthContext"
import { useCurrency } from "@/context/CurrencyContext"

interface ApplyModalProps {
  projectId: string
  projectTitle: string
  projectBudget: number
  open: boolean
  onClose: () => void
  onSuccess: (application: ApiApplication) => void
}

export function ApplyModal({
  projectId,
  projectTitle,
  projectBudget,
  open,
  onClose,
  onSuccess,
}: ApplyModalProps) {
  const { token, user } = useAuth()
  const { currency, convertAmount, formatAmount } = useCurrency()
  const [proposalText, setProposalText] = useState("")
  const [proposedAmount, setProposedAmount] = useState(String(convertAmount(projectBudget)))
  const [estimatedDelivery, setEstimatedDelivery] = useState("7 days")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setError("")

    if (!user?.isEmailVerified) {
      setError("Email verification required before submitting proposals. Please update and verify your email address in Settings.")
      return
    }

    if (!proposalText.trim()) {
      setError("Please describe your proposal and approach.")
      return
    }

    const numAmount = Number(proposedAmount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid positive proposed amount.")
      return
    }

    if (!estimatedDelivery.trim()) {
      setError("Please specify your estimated delivery timeframe.")
      return
    }

    const amountInUSD = currency === "INR" ? numAmount / 83 : numAmount

    setLoading(true)
    try {
      const app = await applyToProject(
        {
          projectId,
          proposalText: proposalText.trim(),
          proposedAmount: amountInUSD,
          estimatedDelivery: estimatedDelivery.trim(),
        },
        token,
      )
      onSuccess(app)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit proposal.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-overlay/80 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">Submit Proposal</h2>
            <p className="text-xs text-muted truncate max-w-xs sm:max-w-md">{projectTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-subtle hover:bg-elevated hover:text-foreground"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          {error && <div className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-2.5 text-xs text-danger">{error}</div>}

          <div>
            <label htmlFor="proposalText" className="block text-xs font-semibold text-foreground mb-1.5">
              Proposal / Cover Letter
            </label>
            <textarea
              id="proposalText"
              rows={4}
              value={proposalText}
              onChange={(e) => setProposalText(e.target.value)}
              placeholder="Detail your relevant experience, approach, and how you will complete the milestones..."
              className="w-full rounded-xl border border-border bg-base p-3 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="proposedAmount" className="block text-xs font-semibold text-foreground mb-1.5">
                Proposed Amount ($)
              </label>
              <Input
                id="proposedAmount"
                type="number"
                value={proposedAmount}
                onChange={(e) => setProposedAmount(e.target.value)}
                leftIcon={<FiDollarSign className="h-4 w-4" />}
                placeholder="e.g. 500"
              />
              <span className="mt-1 block text-[11px] text-subtle">Client budget: {formatAmount(projectBudget)}</span>
            </div>

            <div>
              <label htmlFor="estimatedDelivery" className="block text-xs font-semibold text-foreground mb-1.5">
                Estimated Delivery
              </label>
              <Input
                id="estimatedDelivery"
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
                leftIcon={<FiPaperclip className="h-4 w-4" />}
                placeholder="e.g. 7 days, 2 weeks"
              />
            </div>
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={loading} leftIcon={<FiSend className="h-4 w-4" />}>
              Submit Application
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
