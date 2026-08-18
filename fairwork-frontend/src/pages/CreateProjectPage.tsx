import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FiPlus, FiTrash2 } from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Textarea } from "@/components/ui/Textarea"
import { PageHeader } from "@/components/common/PageHeader"
import { useAuth } from "@/context/AuthContext"
import { useCurrency } from "@/context/CurrencyContext"
import { createProject } from "@/services/projectsApi"
import { PROJECT_CATEGORIES } from "@/data/categories"

interface Draft {
  id: string
  title: string
  amount: string
}

const draft = (): Draft => ({
  id: crypto.randomUUID(),
  title: "",
  amount: "",
})

export function CreateProjectPage() {
  const { token } = useAuth()
  const { currency, formatAmount } = useCurrency()
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<string>("")
  const [description, setDescription] = useState("")
  const [budget, setBudget] = useState("")
  const [milestones, setMilestones] = useState<Draft[]>([draft()])
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const currencyTag = currency === "INR" ? "₹ INR" : "$ USD"
  const allocation = milestones.reduce((s, m) => s + (Number(m.amount) || 0), 0)

  const update = (id: string, field: "title" | "amount", value: string) =>
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
    setSaving(true)
    setError("")
    try {
      const project = await createProject(
        {
          title: title.trim(),
          category,
          description: description.trim(),
          budget: value,
          milestones: milestones.map((m) => ({
            title: m.title.trim(),
            amount: Number(m.amount),
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
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="Post a new project"
          description={`Describe the work, select a category, and divide its budget into milestone amounts (${currencyTag}).`}
        />
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Project details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div>
              <Label htmlFor="title" required>
                Project title
              </Label>
              <Input
                id="title"
                value={title}
                placeholder="e.g. Mobile App Onboarding Flow"
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
                onChange={(e) => setCategory(e.target.value)}
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
            <div>
              <Label htmlFor="description" required>
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                placeholder="Describe project scope and key deliverables"
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
                <div key={m.id} className="flex gap-2">
                  <Input
                    value={m.title}
                    onChange={(e) => update(m.id, "title", e.target.value)}
                    placeholder={`Milestone ${i + 1} title`}
                  />
                  <Input
                    type="number"
                    min="0"
                    value={m.amount}
                    onChange={(e) => update(m.id, "amount", e.target.value)}
                    placeholder={`Amount (${currencyTag})`}
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
