import { Link } from "react-router-dom"
import { FiArrowRight, FiFileText, FiFolder, FiPlusCircle } from "react-icons/fi"
import type { IconType } from "react-icons"
import { Card } from "@/components/ui/Card"

const clientActions: { title: string; description: string; to: string; icon: IconType }[] = [
  { title: "Create project", description: "Start a new project with milestones", to: "/projects/new", icon: FiPlusCircle },
  { title: "My projects", description: "Review projects you created", to: "/projects/mine", icon: FiFolder },
  { title: "Contracts", description: "Review project agreements", to: "/contracts", icon: FiFileText },
]
const freelancerActions: { title: string; description: string; to: string; icon: IconType }[] = [
  { title: "Browse projects", description: "Explore available project opportunities", to: "/projects", icon: FiFolder },
  { title: "My projects", description: "Review projects assigned to you", to: "/projects/mine", icon: FiFileText },
]

export function QuickActions({ role }: { role: "client" | "freelancer" }) {
  const actions = role === "client" ? clientActions : freelancerActions
  return <section aria-labelledby="quick-actions-heading"><h2 id="quick-actions-heading" className="sr-only">Quick actions</h2><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{actions.map((action) => { const Icon = action.icon; return <Card key={action.to} interactive className="group"><Link to={action.to} className="flex h-full flex-col gap-3 rounded-2xl p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><div className="flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-elevated text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><Icon className="h-4 w-4" aria-hidden /></span><FiArrowRight className="h-4 w-4 -translate-x-1 text-subtle opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" aria-hidden /></div><div><p className="text-sm font-semibold text-foreground">{action.title}</p><p className="mt-0.5 text-xs leading-relaxed text-subtle">{action.description}</p></div></Link></Card> })}</div></section>
}
