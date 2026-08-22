import { useState } from "react"
import { FiZap, FiX, FiCheck, FiRefreshCw, FiDollarSign } from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Label } from "@/components/ui/Label"
import { Badge } from "@/components/ui/Badge"
import { useAuth } from "@/context/AuthContext"
import { generateAiProjectScope, type GeneratedProjectScope } from "@/services/aiApi"

interface AiProjectGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  onApplyScope: (scope: GeneratedProjectScope) => void
  currentBudget: number
}

export function AiProjectGeneratorModal({
  isOpen,
  onClose,
  onApplyScope,
  currentBudget,
}: AiProjectGeneratorModalProps) {
  const { token } = useAuth()
  const [prompt, setPrompt] = useState("")
  const [budget, setBudget] = useState<number>(currentBudget || 1000)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [generatedScope, setGeneratedScope] = useState<GeneratedProjectScope | null>(null)

  if (!isOpen) return null

  const handleGenerate = async () => {
    if (!prompt.trim() || budget <= 0 || !token) {
      setError("Please provide a project prompt and a positive budget.")
      return
    }

    setLoading(true)
    setError("")
    try {
      const scope = await generateAiProjectScope(prompt.trim(), budget, token)
      setGeneratedScope(scope)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate project scope.")
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (generatedScope) {
      onApplyScope(generatedScope)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400 border border-primary-500/30">
              <FiZap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Ask AI — Scope & Milestone Generator</h2>
              <p className="text-xs text-muted-foreground">Generates model-A balanced milestone breakdowns</p>
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
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg">
              {error}
            </div>
          )}

          {!generatedScope ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="ai-prompt" required>
                  What do you want to build?
                </Label>
                <Textarea
                  id="ai-prompt"
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Build a Web3 NFT marketplace with Stripe integration, wallet auth, and IPFS metadata storage..."
                  className="mt-1.5 bg-secondary/40 border-border/80"
                />
              </div>

              <div>
                <Label htmlFor="ai-budget" required>
                  Target Project Budget (USD)
                </Label>
                <div className="relative mt-1.5">
                  <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="ai-budget"
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="pl-9 bg-secondary/40 border-border/80"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-primary-500/10 border border-primary-500/20 p-3 rounded-xl">
                <div>
                  <Badge tone="info" className="mb-1 text-[10px]">
                    GENERATED DRAFT
                  </Badge>
                  <h3 className="font-semibold text-foreground text-sm">{generatedScope.title}</h3>
                </div>
                <Badge tone="success" className="font-mono text-xs">
                  ${generatedScope.budget.toLocaleString()} USD
                </Badge>
              </div>

              <div className="bg-secondary/30 p-3 rounded-xl border border-border/60">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Description</h4>
                <p className="text-xs text-foreground leading-relaxed">{generatedScope.description}</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Balanced Milestones ({generatedScope.milestones.length})
                </h4>
                <div className="space-y-2">
                  {generatedScope.milestones.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/60 text-xs"
                    >
                      <span className="font-medium text-foreground">{m.title}</span>
                      <span className="font-mono font-semibold text-primary-400">${m.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/80 bg-secondary/20 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {!generatedScope ? (
            <Button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="bg-primary-600 hover:bg-primary-500 text-white"
            >
              {loading ? (
                <>
                  <FiRefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Generating Scope...
                </>
              ) : (
                <>
                  <FiZap className="h-4 w-4 mr-2" />
                  Generate Scope & Milestones
                </>
              )}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setGeneratedScope(null)}>
                Try Again
              </Button>
              <Button onClick={handleApply} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                <FiCheck className="h-4 w-4 mr-2" />
                Apply Generated Scope
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
