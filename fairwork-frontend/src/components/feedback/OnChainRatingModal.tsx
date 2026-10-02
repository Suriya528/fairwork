import { useState } from "react"
import { FiAward, FiCheck, FiExternalLink, FiLoader, FiStar, FiX } from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import { useToast } from "@/components/ui/Toast"
import { useAuth } from "@/context/AuthContext"
import { submitOnChainRating, reputationAddress } from "@/services/web3"

export interface OnChainRatingModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectTitle: string
  revieweeId: string
  revieweeName: string
  revieweeAddress?: string
  onSuccess?: () => void
}

export function OnChainRatingModal({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  revieweeId,
  revieweeName,
  revieweeAddress,
  onSuccess,
}: OnChainRatingModalProps) {
  const { token } = useAuth()
  const { toast } = useToast()

  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitOnChain, setSubmitOnChain] = useState(Boolean(revieweeAddress))
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    setSubmitting(true)
    let onChainSucceeded = false
    let minedTxHash = ""

    try {
      // 1. If on-chain submission requested and reviewee address exists, call ReputationContract.sol
      if (submitOnChain && revieweeAddress) {
        try {
          minedTxHash = await submitOnChainRating(projectId, revieweeAddress, rating, comment)
          onChainSucceeded = true
          toast({
            title: "On-Chain Rating Confirmed",
            description: `Rating published to Sepolia ReputationContract (${minedTxHash.slice(0, 10)}...).`,
            tone: "success",
          })
        } catch (onChainErr: any) {
          console.warn("On-chain rating failed or was cancelled:", onChainErr)
          toast({
            title: "On-Chain Transaction Declined",
            description: onChainErr?.message?.includes("User rejected")
              ? "MetaMask transaction was declined. Saving platform review..."
              : "On-chain rating could not be published. Saving platform review...",
            tone: "warning",
          })
        }
      }

      // 2. Save review to MongoDB for instant fast UI display
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"
      const res = await fetch(`${API_URL}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          revieweeId,
          rating,
          comment,
          onChainTxHash: minedTxHash || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Failed to save review")
      }

      toast({
        title: "Review Submitted",
        description: onChainSucceeded
          ? "Your rating was written to the Sepolia blockchain and saved to the profile!"
          : "Your review was saved successfully!",
        tone: "success",
      })

      onSuccess?.()
      onClose()
    } catch (err: any) {
      console.error("Submit review error:", err)
      toast({
        title: "Review Failed",
        description: err.message || "Could not complete review submission.",
        tone: "error",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-surface border border-border/80 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <FiAward className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Leave Completed Project Review</h2>
              <p className="text-xs text-muted">For {revieweeName} on &ldquo;{projectTitle}&rdquo;</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          {/* Star Rating Selector */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Performance Rating (1 - 5 Stars)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1.5 transition-transform hover:scale-110 focus:outline-none"
                >
                  <FiStar
                    className={`w-7 h-7 ${
                      (hoverRating || rating) >= star
                        ? "text-amber-400 fill-amber-400 drop-shadow"
                        : "text-muted/30"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-3 text-sm font-bold text-foreground">
                {rating} of 5 Stars
              </span>
            </div>
          </div>

          {/* Written Feedback */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Review Notes &amp; Testimonial
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Share details about your collaboration with ${revieweeName}...`}
              rows={3}
              maxLength={1000}
              className="w-full text-sm bg-base border border-border/80 rounded-xl px-3.5 py-2.5 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
            />
          </div>

          {/* On-Chain Sepolia Toggle */}
          {revieweeAddress ? (
            <div className="p-3.5 rounded-xl bg-surface-elevated/60 border border-border/80 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={submitOnChain}
                  onChange={(e) => setSubmitOnChain(e.target.checked)}
                  className="mt-0.5 rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <div className="text-xs">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    Record to Sepolia Blockchain
                    <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono">
                      ReputationContract.sol
                    </span>
                  </div>
                  <p className="text-muted mt-0.5">
                    Writes an immutable rating to the verified on-chain accumulator. Non-transferable &amp; permanent proof of performance.
                  </p>
                </div>
              </label>

              {reputationAddress && submitOnChain && (
                <div className="text-[11px] text-muted flex items-center justify-between pt-1 border-t border-border/40 font-mono">
                  <span>Target: {revieweeAddress.slice(0, 8)}...{revieweeAddress.slice(-6)}</span>
                  <a
                    href={`https://sepolia.etherscan.io/address/${reputationAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    Contract <FiExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-surface-elevated/40 border border-border/40 text-xs text-muted">
              Counterparty has not linked an Ethereum wallet yet. Review will be recorded within FairWork.
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting}
              className="bg-primary hover:bg-primary-hover text-white font-medium"
            >
              {submitting ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin mr-2" />
                  {submitOnChain ? "Signing on Sepolia..." : "Saving Review..."}
                </>
              ) : (
                <>
                  <FiCheck className="w-4 h-4 mr-1.5" />
                  Submit Rating
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
