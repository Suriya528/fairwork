import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { FiPlus, FiTrash2, FiClock, FiCalendar, FiZap } from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Textarea } from "@/components/ui/Textarea"
import { Badge } from "@/components/ui/Badge"
import { PageHeader } from "@/components/common/PageHeader"
import { useAuth } from "@/context/AuthContext"
import { useCurrency } from "@/context/CurrencyContext"
import { createProject } from "@/services/projectsApi"
import { PROJECT_CATEGORIES } from "@/data/categories"
import { formatDateTime, formatDeadlineCountdown } from "@/lib/format"
import { AiProjectGeneratorModal } from "@/components/ai/AiProjectGeneratorModal"

interface Draft {
  id: string
  title: string
  amount: string
  dueDate: string
}

const draft = (): Draft => ({
  id: crypto.randomUUID(),
  title: "",
  amount: "",
  dueDate: "",
})

export function CreateProjectPage() {
  const { token } = useAuth()
  const { currency, formatAmount } = useCurrency()
  const navigate = useNavigate()

  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<string>("")
  const [customCategory, setCustomCategory] = useState<string>("")
  const [description, setDescription] = useState("")
  const [budget, setBudget] = useState("")

  // Deadline state
  const [deadlineMode, setDeadlineMode] = useState<"duration" | "exact">("duration")
  const [durationValue, setDurationValue] = useState<number>(1)
  const [durationUnit, setDurationUnit] = useState<"hours" | "days" | "weeks" | "months">("days")

  const defaultDateStr = useMemo(() => {
    const tomorrow = new Date(Date.now() + 86400 * 1000)
    return tomorrow.toISOString().split("T")[0]
  }, [])
  const [exactDate, setExactDate] = useState<string>(defaultDateStr)
  const [exactTime, setExactTime] = useState<string>("18:00")

  const [milestones, setMilestones] = useState<Draft[]>([draft()])
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const [isAiModalOpen, setIsAiModalOpen] = useState(false)

  const handleApplyAiScope = (scope: {
    title: string
    category: string
    description: string
    budget: number
    milestones: { title: string; amount: number }[]
  }) => {
    setTitle(scope.title)
    if (scope.category) setCategory(scope.category)
    setDescription(scope.description)
    const displayBudget = currency === "INR" ? Math.round(scope.budget * 83) : scope.budget
    setBudget(String(displayBudget))
    setMilestones(
      scope.milestones.map((m) => ({
        id: crypto.randomUUID(),
        title: m.title,
        amount: String(currency === "INR" ? Math.round(m.amount * 83) : m.amount),
        dueDate: "",
      })),
    )
  }

  const currencyTag = currency === "INR" ? "₹ INR" : "$ USD"
  const allocation = milestones.reduce((s, m) => s + (Number(m.amount) || 0), 0)

  // Calculated deadline for preview
  const calculatedDeadline = useMemo(() => {
    if (deadlineMode === "exact") {
      if (!exactDate || !exactTime) return null
      const dateObj = new Date(`${exactDate}T${exactTime}:00`)
      return isNaN(dateObj.getTime()) ? null : dateObj
    }
    const val = Number(durationValue) > 0 ? Number(durationValue) : 1
    let ms = val * 86400 * 1000
    if (durationUnit === "hours") ms = val * 3600 * 1000
    else if (durationUnit === "weeks") ms = val * 7 * 86400 * 1000
    else if (durationUnit === "months") ms = val * 30 * 86400 * 1000
    return new Date(Date.now() + ms)
  }, [deadlineMode, exactDate, exactTime, durationValue, durationUnit])

  const countdown = useMemo(() => {
    return formatDeadlineCountdown(calculatedDeadline)
  }, [calculatedDeadline])

  const handleCategoryChange = (val: string) => {
    setCategory(val)
    if (val !== "Other") {
      setCustomCategory("")
    }
  }

  const update = (id: string, field: "title" | "amount" | "dueDate", value: string) =>
    setMilestones((all) =>
      all.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    )

  const submit = async () => {
    const value = Number(budget)
    if (
      !token ||
      !title.trim() ||
      !category ||
      !description.trim() ||
      value <= 0 ||
      milestones.some((m) => !m.title.trim() || Number(m.amount) <= 0) ||
      allocation !== value
    ) {
      setError(
        "Provide a title, category, description, positive budget, and milestones that total the budget.",
      )
      return
    }

    if (category === "Other" && customCategory.trim().length < 2) {
      setError("Please specify your custom category (at least 2 characters).")
      return
    }

    if (!calculatedDeadline || calculatedDeadline.getTime() <= Date.now()) {
      setError("Project deadline must be strictly in the future.")
      return
    }

    const budgetInUSD = currency === "INR" ? value / 83 : value

    setSaving(true)
    setError("")
    try {
      const project = await createProject(
        {
          title: title.trim(),
          category,
          customCategory: category === "Other" ? customCategory.trim() : "",
          description: description.trim(),
          budget: budgetInUSD,
          deadlineMode,
          durationValue: Number(durationValue) || 1,
          durationUnit,
          deadlineAt: calculatedDeadline.toISOString(),
          milestones: milestones.map((m) => ({
            title: m.title.trim(),
            amount: currency === "INR" ? Number(m.amount) / 83 : Number(m.amount),
            dueDate: m.dueDate ? new Date(m.dueDate).toISOString() : undefined,
          })),
        },
        token,
      )
      navigate(`/projects/${project.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create project.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <AiProjectGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyScope={handleApplyAiScope}
        currentBudget={Number(budget) || 1000}
      />
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="Post a new project"
          description={`Describe the work, select a category, set the target deadline, and divide its budget into milestones (${currencyTag}).`}
        />
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Project details</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Ask AI project scope generator"
              onClick={() => setIsAiModalOpen(true)}
              className="border-primary-500/30 text-primary-400 hover:bg-primary-500/10 text-xs"
            >
              <FiZap className="h-3.5 w-3.5 mr-1.5 text-accent-300 animate-pulse" />
              Ask AI
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div>
              <Label htmlFor="title" required>
                Project title
              </Label>
              <Input
                id="title"
                value={title}
                placeholder="e.g. Mobile App Onboarding Flow (1-Day Fix)"
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="category" required>
                Category
              </Label>
              <select
                id="category"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-xl border border-border bg-base px-3 text-sm text-foreground outline-none transition-colors focus:border-border-strong focus:ring-2 focus:ring-ring/40"
              >
                <option value="" disabled>
                  Select a category
                </option>
                {PROJECT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {category === "Other" && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <Label htmlFor="customCategory" required>
                  Specify category
                </Label>
                <Input
                  id="customCategory"
                  value={customCategory}
                  placeholder="Enter your project category"
                  onChange={(e) => setCustomCategory(e.target.value)}
                />
              </div>
            )}

            <div>
              <Label htmlFor="description" required>
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                placeholder="Describe project scope, requirements, and key deliverables"
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
            </div>

            <div>
              <Label htmlFor="budget" required>
                Total budget ({currencyTag})
              </Label>
              <Input
                id="budget"
                type="number"
                min="0"
                placeholder={currency === "INR" ? "e.g. 50000" : "e.g. 500"}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>

            {/* DEADLINE SYSTEM CONFIGURATION */}
            <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiClock className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Project Deadline</h3>
                    <p className="text-xs text-muted">Set an estimated duration or an exact date & time deadline.</p>
                  </div>
                </div>
                <div className="flex rounded-xl border border-border bg-base p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setDeadlineMode("duration")}
                    className={`rounded-lg px-3 py-1 font-medium transition-all ${
                      deadlineMode === "duration"
                        ? "bg-elevated text-foreground shadow-sm"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    Duration
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeadlineMode("exact")}
                    className={`rounded-lg px-3 py-1 font-medium transition-all ${
                      deadlineMode === "exact"
                        ? "bg-elevated text-foreground shadow-sm"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    Exact Date & Time
                  </button>
                </div>
              </div>

              {deadlineMode === "duration" ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="durationValue" required>
                      Duration
                    </Label>
                    <Input
                      id="durationValue"
                      type="number"
                      min="1"
                      value={durationValue}
                      onChange={(e) => setDurationValue(Math.max(1, Number(e.target.value)))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="durationUnit" required>
                      Unit
                    </Label>
                    <select
                      id="durationUnit"
                      value={durationUnit}
                      onChange={(e) => setDurationUnit(e.target.value as any)}
                      className="mt-1 flex h-10 w-full rounded-xl border border-border bg-base px-3 text-sm text-foreground outline-none transition-colors focus:border-border-strong focus:ring-2 focus:ring-ring/40"
                    >
                      <option value="hours">Hours (Urgent)</option>
                      <option value="days">Days (Standard)</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="exactDate" required>
                      Completion Date
                    </Label>
                    <Input
                      id="exactDate"
                      type="date"
                      value={exactDate}
                      onChange={(e) => setExactDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="exactTime" required>
                      Completion Time ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                    </Label>
                    <Input
                      id="exactTime"
                      type="time"
                      value={exactTime}
                      onChange={(e) => setExactTime(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* LIVE DEADLINE PREVIEW */}
              {calculatedDeadline && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/80 bg-elevated/50 p-3 text-xs">
                  <div className="flex items-center gap-2 text-muted">
                    <FiCalendar className="h-4 w-4 text-primary" />
                    <span>Calculated Target: <strong className="font-semibold text-foreground">{formatDateTime(calculatedDeadline)}</strong></span>
                  </div>
                  <Badge tone={countdown.isUrgent ? "warning" : "info"}>
                    {countdown.isUrgent && <FiZap className="h-3 w-3 mr-1" />}
                    {countdown.text}
                  </Badge>
                </div>
              )}
            </div>

            {/* MILESTONES */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label>Milestones ({currencyTag})</Label>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<FiPlus />}
                  onClick={() => setMilestones((v) => [...v, draft()])}
                >
                  Add milestone
                </Button>
              </div>
              {milestones.map((m, i) => (
                <div key={m.id} className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center">
                  <Input
                    value={m.title}
                    onChange={(e) => update(m.id, "title", e.target.value)}
                    placeholder={`Milestone ${i + 1} title`}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min="0"
                    value={m.amount}
                    onChange={(e) => update(m.id, "amount", e.target.value)}
                    placeholder={`Amount (${currencyTag})`}
                    className="w-full sm:w-36"
                  />
                  <Input
                    type="date"
                    value={m.dueDate}
                    onChange={(e) => update(m.id, "dueDate", e.target.value)}
                    title="Milestone Due Date (Optional)"
                    className="w-full sm:w-36"
                  />
                  <Button
                    variant="ghost"
                    aria-label="Remove milestone"
                    disabled={milestones.length === 1}
                    onClick={() =>
                      setMilestones((v) => v.filter((x) => x.id !== m.id))
                    }
                  >
                    <FiTrash2 />
                  </Button>
                </div>
              ))}
              <p
                className={
                  allocation === Number(budget) && allocation > 0
                    ? "text-xs text-success font-medium"
                    : "text-xs text-muted"
                }
              >
                Allocated: {formatAmount(allocation)} of{" "}
                {formatAmount(Number(budget) || 0)}
              </p>
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
          </CardContent>
          <CardFooter className="justify-end">
            <Button loading={saving} onClick={submit}>
              Post project
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
