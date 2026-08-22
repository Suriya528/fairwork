import { useState } from "react"
import { FiZap, FiX, FiCheck, FiRefreshCw } from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import { Textarea } from "@/components/ui/Textarea"
import { Label } from "@/components/ui/Label"
import { useAuth } from "@/context/AuthContext"
import { generateAiProposal } from "@/services/aiApi"

interface AiProposalAssistantModalProps {
  isOpen: boolean
  onClose: () => void
  onApplyProposal: (proposalText: string) => void
  projectTitle: string
  projectDescription: string
}

export function AiProposalAssistantModal({
  isOpen,
  onClose,
  onApplyProposal,
  projectTitle,
  projectDescription,
}: AiProposalAssistantModalProps) {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [draft, setDraft] = useState("")

  if (!isOpen) return null

  const handleGenerate = async () => {
    if (!token) return
    setLoading(true)
    setError("")
    try {
      const text = await generateAiProposal(projectTitle, projectDescription, token)
      setDraft(text)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to draft proposal.")
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (draft) {
      onApplyProposal(draft)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400 border border-primary-500/30">
              <FiZap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Ask AI — Proposal Writing Assistant</h2>
              <p className="text-xs text-muted-foreground">Draft customized cover letter tailored to project</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg">
              {error}
            </div>
          )}

          {!draft ? (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20">
                <FiZap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Generate AI Proposal Cover Letter</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  AI will analyze "{projectTitle}" and write a tailored proposal letter highlighting relevant skills.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <Label htmlFor="proposal-draft" className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                Generated Proposal Letter
              </Label>
              <Textarea
                id="proposal-draft"
                rows={10}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="mt-1 bg-secondary/40 border-border/80 text-xs font-mono leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/80 bg-secondary/20 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {!draft ? (
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-primary-600 hover:bg-primary-500 text-white"
            >
              {loading ? (
                <>
                  <FiRefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Drafting Proposal...
                </>
              ) : (
                <>
                  <FiZap className="h-4 w-4 mr-2" />
                  Draft Proposal
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleApply} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              <FiCheck className="h-4 w-4 mr-2" />
              Apply Proposal Letter
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
