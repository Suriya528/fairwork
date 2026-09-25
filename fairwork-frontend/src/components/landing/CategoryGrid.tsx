import { Link } from "react-router-dom"
import {
  FiArrowRight,
  FiCode,
  FiShield,
  FiLayout,
  FiCpu,
  FiSmartphone,
  FiCloud,
  FiEdit3,
  FiTrendingUp,
} from "react-icons/fi"
import { useAuth } from "@/context/AuthContext"

interface ServiceCategory {
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  categoryFilter: string
  accentColor: string
}

const popularServices: ServiceCategory[] = [
  {
    title: "Website Development",
    subtitle: "Build your web presence",
    icon: FiCode,
    gradient: "from-blue-600/90 to-indigo-900/90",
    accentColor: "border-blue-500/40 text-blue-400",
    categoryFilter: "dev",
  },
  {
    title: "Smart Contract Audits",
    subtitle: "Secure protocol funds",
    icon: FiShield,
    gradient: "from-emerald-600/90 to-teal-900/90",
    accentColor: "border-emerald-500/40 text-emerald-400",
    categoryFilter: "security",
  },
  {
    title: "UI/UX & Product Design",
    subtitle: "Craft intuitive interfaces",
    icon: FiLayout,
    gradient: "from-purple-600/90 to-pink-900/90",
    accentColor: "border-purple-500/40 text-purple-400",
    categoryFilter: "design",
  },
  {
    title: "AI Services & Agents",
    subtitle: "Scale with custom LLMs",
    icon: FiCpu,
    gradient: "from-cyan-600/90 to-blue-900/90",
    accentColor: "border-cyan-500/40 text-cyan-400",
    categoryFilter: "ai",
  },
  {
    title: "Mobile App Development",
    subtitle: "iOS & Android solutions",
    icon: FiSmartphone,
    gradient: "from-amber-600/90 to-orange-900/90",
    accentColor: "border-amber-500/40 text-amber-400",
    categoryFilter: "mobile",
  },
  {
    title: "Cloud & DevOps Infra",
    subtitle: "High-availability 99.99%",
    icon: FiCloud,
    gradient: "from-sky-600/90 to-slate-900/90",
    accentColor: "border-sky-500/40 text-sky-400",
    categoryFilter: "devops",
  },
  {
    title: "Web3 dApp Engineering",
    subtitle: "Solidity, Viem & Wallets",
    icon: FiTrendingUp,
    gradient: "from-violet-600/90 to-purple-900/90",
    accentColor: "border-violet-500/40 text-violet-400",
    categoryFilter: "web3",
  },
  {
    title: "Technical Writing & Specs",
    subtitle: "Docs & architecture guides",
    icon: FiEdit3,
    gradient: "from-rose-600/90 to-red-900/90",
    accentColor: "border-rose-500/40 text-rose-400",
    categoryFilter: "writing",
  },
]

export function CategoryGrid() {
  const { status } = useAuth()
  const isAuthed = status === "authenticated"
  const defaultDestination = isAuthed ? "/projects" : "/register"

  return (
    <section id="categories" className="w-full bg-base border-b border-border/40 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Popular services
            </h2>
            <p className="mt-2 text-base text-muted max-w-xl">
              Explore the most in-demand freelance talent and project categories on FairWork.
            </p>
          </div>

          <Link
            to={defaultDestination}
            className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <span>All categories</span>
            <FiArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Fiverr-Style Visual Service Cards Grid */}
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {popularServices.map((service) => {
            const Icon = service.icon
            return (
              <Link
                key={service.title}
                to={`/projects?category=${service.categoryFilter}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border p-6 shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:border-emerald-500/50 bg-surface cursor-pointer min-h-[220px]"
              >
                {/* Background Ambient Gradient Layer */}
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}
                />

                {/* Card Content Top */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-xl border bg-base/80 backdrop-blur-sm shadow-sm transition-transform duration-300 group-hover:scale-110 ${service.accentColor}`}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-base/60 text-subtle transition-all duration-200 group-hover:bg-emerald-500 group-hover:text-white">
                      <FiArrowRight className="h-4 w-4" />
                    </span>
                  </div>

                  <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted font-mono">
                    {service.subtitle}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-foreground group-hover:text-emerald-400 transition-colors">
                    {service.title}
                  </h3>
                </div>

                {/* Card Content Bottom */}
                <div className="relative z-10 pt-4 border-t border-border/40 flex items-center justify-between text-xs text-subtle">
                  <span>Explore talent</span>
                  <span className="font-semibold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Browse &rarr;
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
