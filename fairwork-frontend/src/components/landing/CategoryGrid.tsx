import { Link } from "react-router-dom"
import {
  FiCode,
  FiSmartphone,
  FiLayout,
  FiServer,
  FiCpu,
  FiLink,
  FiCloud,
  FiEdit3,
  FiArrowUpRight,
} from "react-icons/fi"
import { useAuth } from "@/context/AuthContext"

/**
 * Static category list derived from existing project tags in the codebase.
 * Enriched with tech tags and protocol metadata for discovery.
 */
const categories = [
  {
    label: "Web3 & Smart Contracts",
    icon: FiLink,
    description: "Solidity, Viem, EIP-712, Smart Contract Escrow",
    tags: ["Solidity", "ETH", "USDC"],
    highlight: true,
  },
  {
    label: "Full-Stack Web Development",
    icon: FiCode,
    description: "React 19, Next.js, TypeScript, Tailwind CSS",
    tags: ["React", "TypeScript", "Next.js"],
    highlight: false,
  },
  {
    label: "UI/UX & Product Design",
    icon: FiLayout,
    description: "Figma Libraries, Tokens, Design Systems",
    tags: ["Figma", "Design System", "Tokens"],
    highlight: false,
  },
  {
    label: "Backend & API Systems",
    icon: FiServer,
    description: "Node.js, Express, Microservices, REST & GraphQL",
    tags: ["Node.js", "Express", "REST"],
    highlight: false,
  },
  {
    label: "Mobile App Development",
    icon: FiSmartphone,
    description: "iOS, Android, React Native, Cross-Platform",
    tags: ["iOS", "Mobile", "React Native"],
    highlight: false,
  },
  {
    label: "AI & Machine Learning",
    icon: FiCpu,
    description: "ML Models, Data Pipelines, LLM Integrations",
    tags: ["Python", "AI", "Data"],
    highlight: false,
  },
  {
    label: "Cloud & DevOps Infrastructure",
    icon: FiCloud,
    description: "AWS, Docker, CI/CD Pipelines, Serverless",
    tags: ["Cloud", "DevOps", "Docker"],
    highlight: false,
  },
  {
    label: "Technical Content & Docs",
    icon: FiEdit3,
    description: "API Documentation, Architecture Guides, Specs",
    tags: ["Docs", "Writing", "Specs"],
    highlight: false,
  },
] as const

export function CategoryGrid() {
  const { status } = useAuth()
  const isAuthed = status === "authenticated"
  const destination = isAuthed ? "/projects" : "/register"

  return (
    <section id="categories" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-primary font-mono">
            Marketplace Taxonomy
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Explore core technical disciplines
          </h2>
          <p className="mt-3 max-w-xl text-base text-muted">
            Connect with specialized freelancers across core development, design, and protocol engineering domains.
          </p>
        </div>

        <Link
          to={destination}
          className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
        >
          View all project categories
          <FiArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map(({ label, icon: Icon, description, tags, highlight }) => (
          <Link
            key={label}
            to={destination}
            className={`group relative flex flex-col justify-between rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40 ${
              highlight
                ? "border-primary/50 bg-gradient-to-b from-primary/10 via-surface to-surface shadow-md shadow-primary/10"
                : "border-border bg-surface hover:border-border-strong hover:bg-surface-hover"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                    highlight
                      ? "bg-primary text-primary-foreground"
                      : "bg-elevated text-primary group-hover:bg-primary/15"
                  }`}
                >
                  <Icon className="h-5.5 w-5.5" aria-hidden />
                </span>
                <FiArrowUpRight className="h-4 w-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
              </div>

              <h3 className="mt-5 text-base font-bold text-foreground group-hover:text-primary transition-colors">
                {label}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted">{description}</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-1.5 pt-3 border-t border-border/60">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-base px-2 py-0.5 font-mono text-[10px] text-subtle border border-border/80"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
