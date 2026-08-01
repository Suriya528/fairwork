import { useMemo, useState } from "react"
import type { ComponentType, ReactNode, SVGProps } from "react"
import { useNavigate } from "react-router-dom"
import {
  FiArrowLeft,
  FiArrowRight,
  FiCalendar,
  FiCheck,
  FiDollarSign,
  FiFileText,
  FiHexagon,
  FiLayers,
  FiPlus,
  FiTag,
  FiTrash2,
  FiTrendingUp,
  FiX,
} from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Select, type SelectOption } from "@/components/ui/Select"
import { Textarea } from "@/components/ui/Textarea"
import { Label } from "@/components/ui/Label"
import { Progress } from "@/components/ui/Progress"
import { PageHeader } from "@/components/common/PageHeader"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/format"
import { validateRequired } from "@/lib/validation"
 
type IconType = ComponentType<SVGProps<SVGSVGElement>>
 
/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
 
interface MilestoneDraft {
  id: string
  title: string
  amount: string
  dueDate: string
}
 
interface StepOneErrors {
  title?: string
  category?: string
  description?: string
}
 
interface StepTwoErrors {
  budget?: string
  dueDate?: string
  milestones?: string
}
 
/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */
 
const STEPS = [
  { id: 1, label: "Project basics" },
  { id: 2, label: "Budget & milestones" },
  { id: 3, label: "Review & post" },
] as const
 
const CATEGORY_OPTIONS: SelectOption[] = [
  { label: "Web development", value: "web_development" },
  { label: "Mobile development", value: "mobile_development" },
  { label: "Design & UX", value: "design" },
  { label: "Blockchain & Web3", value: "blockchain" },
  { label: "Backend & API", value: "backend" },
  { label: "Writing & content", value: "writing" },
  { label: "Other", value: "other" },
]
 
const ESCROW_OPTIONS: SelectOption[] = [
  { label: "USDC — stablecoin", value: "USDC" },
  { label: "ETH — Ethereum", value: "ETH" },
]
 
function createEmptyMilestone(): MilestoneDraft {
  return { id: crypto.randomUUID(), title: "", amount: "", dueDate: "" }
}
 
/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */
 
function validateStepOne(data: {
  title: string
  category: string
  description: string
}): StepOneErrors {
  const errors: StepOneErrors = {}
 
  const titleError = validateRequired(data.title, "Project title")
  if (titleError) errors.title = titleError
 
  if (!data.category) errors.category = "Select a category"
 
  const descError = validateRequired(data.description, "Description")
  if (descError) errors.description = descError
  else if (data.description.trim().length < 30) {
    errors.description =
      "Add a bit more detail — at least 30 characters helps freelancers scope the work"
  }
 
  return errors
}
 
function validateStepTwo(data: {
  budget: string
  dueDate: string
  milestones: MilestoneDraft[]
}): StepTwoErrors {
  const errors: StepTwoErrors = {}
  const budgetNum = Number(data.budget)
 
  if (!data.budget) errors.budget = "Total budget is required"
  else if (Number.isNaN(budgetNum) || budgetNum <= 0) {
    errors.budget = "Enter a budget greater than $0"
  }
 
  if (!data.dueDate) errors.dueDate = "Project due date is required"
  else if (new Date(data.dueDate).getTime() < Date.now()) {
    errors.dueDate = "Due date must be in the future"
  }
 
  const hasEmptyMilestone = data.milestones.some(
    (m) => !m.title.trim() || !m.amount || !m.dueDate,
  )
  const allocated = data.milestones.reduce(
    (sum, m) => sum + (Number(m.amount) || 0),
    0,
  )
 
  if (hasEmptyMilestone) {
    errors.milestones = "Fill in every milestone field, or remove unused rows"
  } else if (budgetNum > 0 && allocated !== budgetNum) {
    errors.milestones = `Milestones must total the full budget — currently ${
      allocated > budgetNum ? "over" : "under"
    } by ${formatCurrency(Math.abs(budgetNum - allocated))}`
  }
 
  return errors
}
 
/* ------------------------------------------------------------------ */
/* Step indicator                                                      */
/* ------------------------------------------------------------------ */
 
function StepIndicator({ current }: { current: number }) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center">
        {STEPS.map((step, idx) => {
          const isCompleted = step.id < current
          const isActive = step.id === current
          return (
            <li key={step.id} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <div
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                    isCompleted && "border-success/40 bg-success-soft text-success",
                    isActive && "border-primary bg-primary-soft text-info",
                    !isCompleted &&
                      !isActive &&
                      "border-border bg-surface text-subtle",
                  )}
                >
                  {isCompleted ? <FiCheck className="h-4 w-4" /> : step.id}
                </div>
                <span
                  className={cn(
                    "hidden text-xs font-medium sm:block",
                    isActive ? "text-foreground" : "text-subtle",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-px flex-1 transition-colors",
                    isCompleted ? "bg-success/40" : "bg-border",
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
 
/* ------------------------------------------------------------------ */
/* Tag input                                                           */
/* ------------------------------------------------------------------ */
 
function TagInput({
  tags,
  onChange,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
}) {
  const [draft, setDraft] = useState("")
 
  const addTag = () => {
    const trimmed = draft.trim()
    if (trimmed && !tags.includes(trimmed)) onChange([...tags, trimmed])
    setDraft("")
  }
 
  const removeTag = (tag: string) => onChange(tags.filter((t) => t !== tag))
 
  return (
    <div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addTag()
            }
          }}
          placeholder="e.g. React, Figma, Solidity"
          leftIcon={<FiTag className="h-4 w-4" />}
        />
        <Button type="button" variant="outline" onClick={addTag}>
          Add
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} tone="neutral" className="gap-1.5 py-1 pr-1.5">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
                className="rounded-full p-0.5 text-subtle transition-colors hover:bg-elevated hover:text-foreground"
              >
                <FiX className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
 
/* ------------------------------------------------------------------ */
/* Milestone row                                                       */
/* ------------------------------------------------------------------ */
 
function MilestoneRow({
  milestone,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: {
  milestone: MilestoneDraft
  index: number
  onUpdate: (id: string, field: keyof MilestoneDraft, value: string) => void
  onRemove: (id: string) => void
  canRemove: boolean
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-start">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-elevated text-xs font-medium text-muted sm:mt-2">
        {index + 1}
      </div>
      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-[1fr_140px_140px]">
        <Input
          value={milestone.title}
          onChange={(e) => onUpdate(milestone.id, "title", e.target.value)}
          placeholder="Milestone title"
        />
        <Input
          type="number"
          min="0"
          value={milestone.amount}
          onChange={(e) => onUpdate(milestone.id, "amount", e.target.value)}
          placeholder="Amount"
          leftIcon={<FiDollarSign className="h-4 w-4" />}
        />
        <Input
          type="date"
          value={milestone.dueDate}
          onChange={(e) => onUpdate(milestone.id, "dueDate", e.target.value)}
        />
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(milestone.id)}
          aria-label="Remove milestone"
          className="self-start rounded-lg p-2 text-subtle transition-colors hover:bg-danger-soft hover:text-danger sm:mt-0.5"
        >
          <FiTrash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
 
/* ------------------------------------------------------------------ */
/* Allocation summary                                                  */
/* ------------------------------------------------------------------ */
 
function AllocationSummary({
  budget,
  allocated,
}: {
  budget: number
  allocated: number
}) {
  if (budget <= 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-4 text-xs text-subtle">
        Enter a total budget above to track how milestones add up.
      </div>
    )
  }
 
  const remaining = budget - allocated
  const percent = Math.min(100, Math.round((allocated / budget) * 100))
  const isBalanced = remaining === 0
  const isOver = remaining < 0
 
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-muted">Allocated to milestones</span>
        <span
          className={cn(
            "font-semibold",
            isBalanced ? "text-success" : isOver ? "text-danger" : "text-foreground",
          )}
        >
          {formatCurrency(allocated)} of {formatCurrency(budget)}
        </span>
      </div>
      <Progress
        value={percent}
        tone={isOver ? "danger" : isBalanced ? "success" : "primary"}
      />
      {!isBalanced && (
        <p className={cn("mt-2 text-xs", isOver ? "text-danger" : "text-subtle")}>
          {isOver
            ? `Milestones exceed the total budget by ${formatCurrency(Math.abs(remaining))}.`
            : `${formatCurrency(remaining)} left to allocate before you can continue.`}
        </p>
      )}
    </div>
  )
}
 
/* ------------------------------------------------------------------ */
/* Summary row (review step)                                           */
/* ------------------------------------------------------------------ */
 
function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: IconType
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon className="h-4 w-4 shrink-0 text-subtle" />
      <span className="w-32 shrink-0 text-xs text-subtle">{label}</span>
      <span className="truncate text-sm text-foreground">{value}</span>
    </div>
  )
}
 
/* ------------------------------------------------------------------ */
/* Main page                                                           */
/* ------------------------------------------------------------------ */
 
export function CreateProjectPage() {
  const navigate = useNavigate()
 
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
 
  // Step 1
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [stepOneErrors, setStepOneErrors] = useState<StepOneErrors>({})
 
  // Step 2
  const [budget, setBudget] = useState("")
  const [escrowSymbol, setEscrowSymbol] = useState<"ETH" | "USDC">("USDC")
  const [dueDate, setDueDate] = useState("")
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([
    createEmptyMilestone(),
  ])
  const [stepTwoErrors, setStepTwoErrors] = useState<StepTwoErrors>({})
 
  const budgetNum = Number(budget) || 0
  const allocated = useMemo(
    () => milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0),
    [milestones],
  )
  const categoryLabel = useMemo(
    () => CATEGORY_OPTIONS.find((c) => c.value === category)?.label ?? "—",
    [category],
  )
 
  const updateMilestone = (
    id: string,
    field: keyof MilestoneDraft,
    value: string,
  ) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    )
  }
 
  const addMilestone = () =>
    setMilestones((prev) => [...prev, createEmptyMilestone()])
 
  const removeMilestone = (id: string) =>
    setMilestones((prev) => prev.filter((m) => m.id !== id))
 
  const handleNext = () => {
    if (step === 1) {
      const errors = validateStepOne({ title, category, description })
      setStepOneErrors(errors)
      if (Object.keys(errors).length > 0) return
    }
    if (step === 2) {
      const errors = validateStepTwo({ budget, dueDate, milestones })
      setStepTwoErrors(errors)
      if (Object.keys(errors).length > 0) return
    }
    setStep((s) => Math.min(s + 1, 3))
  }
 
  const handleBack = () => setStep((s) => Math.max(s - 1, 1))
 
  const handleSubmit = async () => {
    setSubmitting(true)
    // Simulated network delay — real API call wires in here later
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setSubmitting(false)
    setSubmitted(true)
  }
 
  const handleReset = () => {
    setStep(1)
    setTitle("")
    setCategory("")
    setDescription("")
    setTags([])
    setBudget("")
    setEscrowSymbol("USDC")
    setDueDate("")
    setMilestones([createEmptyMilestone()])
    setStepOneErrors({})
    setStepTwoErrors({})
    setSubmitted(false)
  }
 
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <PageHeader
          title="Post a new project"
          description="Define the scope, secure the budget in escrow, and break the work into milestones."
        />
 
        <StepIndicator current={step} />
 
        {/* Step 1 — Basics */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Project basics</CardTitle>
              <CardDescription>What are you looking to get done?</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title" required>
                  Project title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Rebuild marketing website"
                  invalid={!!stepOneErrors.title}
                />
                {stepOneErrors.title && (
                  <p className="text-xs text-danger">{stepOneErrors.title}</p>
                )}
              </div>
 
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="category" required>
                  Category
                </Label>
                <Select
                  id="category"
                  options={CATEGORY_OPTIONS}
                  placeholder="Select a category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  invalid={!!stepOneErrors.category}
                />
                {stepOneErrors.category && (
                  <p className="text-xs text-danger">{stepOneErrors.category}</p>
                )}
              </div>
 
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description" required>
                  Description
                </Label>
                <Textarea
                  id="description"
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the scope, deliverables, and any technical requirements…"
                  invalid={!!stepOneErrors.description}
                />
                <div className="flex items-center justify-between">
                  {stepOneErrors.description ? (
                    <p className="text-xs text-danger">{stepOneErrors.description}</p>
                  ) : (
                    <span />
                  )}
                  <span className="shrink-0 text-xs text-subtle">
                    {description.trim().length} characters
                  </span>
                </div>
              </div>
 
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tags">Skills & tags</Label>
                <TagInput tags={tags} onChange={setTags} />
              </div>
            </CardContent>
          </Card>
        )}
 
        {/* Step 2 — Budget & milestones */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Budget & escrow</CardTitle>
                <CardDescription>
                  Funds are locked in escrow and released as milestones are approved.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="budget" required>
                      Total budget
                    </Label>
                    <Input
                      id="budget"
                      type="number"
                      min="0"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="5000"
                      leftIcon={<FiDollarSign className="h-4 w-4" />}
                      invalid={!!stepTwoErrors.budget}
                    />
                    {stepTwoErrors.budget && (
                      <p className="text-xs text-danger">{stepTwoErrors.budget}</p>
                    )}
                  </div>
 
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="escrowSymbol">Escrow token</Label>
                    <Select
                      id="escrowSymbol"
                      options={ESCROW_OPTIONS}
                      value={escrowSymbol}
                      onChange={(e) =>
                        setEscrowSymbol(e.target.value as "ETH" | "USDC")
                      }
                    />
                  </div>
                </div>
 
                <div className="flex flex-col gap-1.5 sm:w-1/2 sm:pr-2.5">
                  <Label htmlFor="dueDate" required>
                    Project due date
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    leftIcon={<FiCalendar className="h-4 w-4" />}
                    invalid={!!stepTwoErrors.dueDate}
                  />
                  {stepTwoErrors.dueDate && (
                    <p className="text-xs text-danger">{stepTwoErrors.dueDate}</p>
                  )}
                </div>
              </CardContent>
            </Card>
 
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <CardTitle>Milestones</CardTitle>
                  <CardDescription>
                    Break the project into fundable stages.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<FiPlus className="h-4 w-4" />}
                  onClick={addMilestone}
                >
                  Add milestone
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {milestones.map((m, idx) => (
                  <MilestoneRow
                    key={m.id}
                    milestone={m}
                    index={idx}
                    onUpdate={updateMilestone}
                    onRemove={removeMilestone}
                    canRemove={milestones.length > 1}
                  />
                ))}
 
                <AllocationSummary budget={budgetNum} allocated={allocated} />
                {stepTwoErrors.milestones && (
                  <p className="text-xs text-danger">{stepTwoErrors.milestones}</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
 
        {/* Step 3 — Review & post */}
        {step === 3 && !submitted && (
          <Card>
            <CardHeader>
              <CardTitle>Review & post</CardTitle>
              <CardDescription>
                Confirm the details before publishing your project.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
                <SummaryRow icon={FiFileText} label="Title" value={title} />
                <SummaryRow icon={FiLayers} label="Category" value={categoryLabel} />
                <SummaryRow
                  icon={FiDollarSign}
                  label="Budget"
                  value={formatCurrency(budgetNum)}
                />
                <SummaryRow icon={FiHexagon} label="Escrow token" value={escrowSymbol} />
                <SummaryRow
                  icon={FiCalendar}
                  label="Due date"
                  value={dueDate ? formatDate(dueDate) : "—"}
                />
                <SummaryRow
                  icon={FiTrendingUp}
                  label="Milestones"
                  value={`${milestones.length} stage${milestones.length !== 1 ? "s" : ""} · ${formatCurrency(allocated)} allocated`}
                />
              </div>
 
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <Badge key={tag} tone="neutral">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
 
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-subtle">
                  Description
                </p>
                <p className="text-sm leading-relaxed text-muted">{description}</p>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                leftIcon={<FiArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSubmit}
                loading={submitting}
                leftIcon={<FiCheck className="h-4 w-4" />}
              >
                Post project
              </Button>
            </CardFooter>
          </Card>
        )}
 
        {/* Success state */}
        {submitted && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-success/25 bg-success-soft">
                <FiCheck className="h-6 w-6 text-success" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold text-foreground">
                  Project posted
                </h3>
                <p className="max-w-sm text-sm text-muted">
                  &ldquo;{title}&rdquo; is live. Fund the escrow once a freelancer
                  accepts to kick off the first milestone.
                </p>
              </div>
              <div className="mt-2 flex gap-3">
                <Button type="button" variant="outline" onClick={handleReset}>
                  Post another
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => navigate("/projects")}
                >
                  View projects
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
 
        {/* Bottom nav — steps 1 & 2 only */}
        {!submitted && step < 3 && (
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={step === 1 ? () => navigate("/projects") : handleBack}
              leftIcon={<FiArrowLeft className="h-4 w-4" />}
            >
              {step === 1 ? "Cancel" : "Back"}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleNext}
              rightIcon={<FiArrowRight className="h-4 w-4" />}
            >
              Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}