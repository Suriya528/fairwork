import { useState } from "react"
import { Link } from "react-router-dom"
import { FiStar, FiHeart, FiArrowRight } from "react-icons/fi"
import { useCurrency } from "@/context/CurrencyContext"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

interface Gig {
  id: string
  sellerName: string
  sellerInitials: string
  sellerLevel: "Pro Verified" | "Top Rated" | "Level 2"
  sellerAvatarColor: string
  title: string
  rating: number
  reviewCount: number
  startingPriceUSD: number
  category: "all" | "web3" | "dev" | "design" | "ai"
  tags: string[]
  badgeColor: string
}

const gigsData: Gig[] = [
  {
    id: "gig-1",
    sellerName: "Alex Rivera",
    sellerInitials: "AR",
    sellerLevel: "Pro Verified",
    sellerAvatarColor: "from-emerald-500 to-teal-600",
    title: "I will audit your Solidity smart contracts with formal verification & reorg safety",
    rating: 5.0,
    reviewCount: 94,
    startingPriceUSD: 500,
    category: "web3",
    tags: ["Solidity", "Security", "EVM"],
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  {
    id: "gig-2",
    sellerName: "Sophia Zhang",
    sellerInitials: "SZ",
    sellerLevel: "Top Rated",
    sellerAvatarColor: "from-blue-500 to-indigo-600",
    title: "I will build a high-performance React 19 & Next.js dApp with Viem and Tailwind CSS",
    rating: 4.9,
    reviewCount: 128,
    startingPriceUSD: 350,
    category: "dev",
    tags: ["React 19", "Next.js", "Viem"],
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  },
  {
    id: "gig-3",
    sellerName: "Marco Silva",
    sellerInitials: "MS",
    sellerLevel: "Pro Verified",
    sellerAvatarColor: "from-purple-500 to-pink-600",
    title: "I will design an intuitive Web3 DeFi dashboard and design system in Figma",
    rating: 5.0,
    reviewCount: 76,
    startingPriceUSD: 280,
    category: "design",
    tags: ["Figma", "UI/UX", "DeFi"],
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  },
  {
    id: "gig-4",
    sellerName: "Priya Sharma",
    sellerInitials: "PS",
    sellerLevel: "Top Rated",
    sellerAvatarColor: "from-cyan-500 to-blue-600",
    title: "I will develop autonomous AI agents, LangChain tools, and RAG pipelines in Python",
    rating: 4.9,
    reviewCount: 62,
    startingPriceUSD: 400,
    category: "ai",
    tags: ["Python", "LLMs", "RAG"],
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  },
  {
    id: "gig-5",
    sellerName: "Lucas Vance",
    sellerInitials: "LV",
    sellerLevel: "Level 2",
    sellerAvatarColor: "from-amber-500 to-orange-600",
    title: "I will engineer non-custodial milestone escrow contracts with timelock protection",
    rating: 5.0,
    reviewCount: 48,
    startingPriceUSD: 450,
    category: "web3",
    tags: ["Escrow", "EIP-712", "Sepolia"],
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  {
    id: "gig-6",
    sellerName: "Elena Rostova",
    sellerInitials: "ER",
    sellerLevel: "Pro Verified",
    sellerAvatarColor: "from-emerald-500 to-cyan-600",
    title: "I will build scalable Node.js microservices and Webhook outbox architectures",
    rating: 5.0,
    reviewCount: 110,
    startingPriceUSD: 300,
    category: "dev",
    tags: ["Node.js", "Express", "MongoDB"],
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
]

export function GigShowcase() {
  const { formatAmount } = useCurrency()
  const { status } = useAuth()
  const isAuthed = status === "authenticated"
  const destination = isAuthed ? "/projects" : "/register"

  const [selectedCategory, setSelectedCategory] = useState<"all" | "web3" | "dev" | "design" | "ai">("all")
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})

  const filteredGigs = selectedCategory === "all"
    ? gigsData
    : gigsData.filter((g) => g.category === selectedCategory)

  function toggleFavorite(id: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <section id="pro-services" className="w-full bg-base border-b border-border/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono">
              Fiverr-Style Freelance Marketplace
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Explore services on FairWork
            </h2>
            <p className="mt-2 text-base text-muted max-w-xl">
              Browse top-rated gigs offering fixed-price deliverables with milestone escrow safety.
            </p>
          </div>

          <Link
            to={destination}
            className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <span>See all gigs</span>
            <FiArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Filter Category Tabs */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {[
            { id: "all", label: "All Services" },
            { id: "web3", label: "Web3 & Smart Contracts" },
            { id: "dev", label: "Programming & Tech" },
            { id: "design", label: "UI/UX & Design" },
            { id: "ai", label: "AI & Automation" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id as typeof selectedCategory)}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all cursor-pointer",
                selectedCategory === tab.id
                  ? "bg-foreground text-base shadow-sm"
                  : "border border-border bg-surface text-muted hover:border-border-strong hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Fiverr-Style Gig Cards Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGigs.map((gig) => {
            const isFav = !!favorites[gig.id]
            return (
              <Link
                key={gig.id}
                to={destination}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-200 hover:-translate-y-1 hover:border-border-strong hover:shadow-xl hover:shadow-black/20"
              >
                <div>
                  {/* Gig Preview Banner Area */}
                  <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-surface via-elevated to-base p-4 flex flex-col justify-between border-b border-border">
                    <div className="flex items-center justify-between">
                      <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-mono font-bold", gig.badgeColor)}>
                        {gig.sellerLevel}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(gig.id, e)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-base/80 text-muted backdrop-blur-sm transition-colors hover:text-rose-500 cursor-pointer"
                        aria-label="Add to favorites"
                      >
                        <FiHeart className={cn("h-4 w-4", isFav && "fill-rose-500 text-rose-500")} />
                      </button>
                    </div>

                    {/* Tags preview */}
                    <div className="flex flex-wrap gap-1.5">
                      {gig.tags.map((tag) => (
                        <span key={tag} className="rounded bg-base/90 px-2 py-0.5 text-[10px] font-mono text-muted border border-border">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Seller Bio Info */}
                  <div className="p-5">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("h-9 w-9 rounded-full bg-gradient-to-tr p-0.5 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm", gig.sellerAvatarColor)}>
                        {gig.sellerInitials}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-foreground truncate">{gig.sellerName}</p>
                        <p className="text-[11px] text-subtle font-mono truncate">Available for milestones</p>
                      </div>
                    </div>

                    {/* Gig Title */}
                    <h3 className="mt-3 text-sm font-semibold text-foreground group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                      {gig.title}
                    </h3>

                    {/* Star Rating */}
                    <div className="mt-3 flex items-center gap-1.5 text-xs">
                      <FiStar className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-foreground">{gig.rating.toFixed(1)}</span>
                      <span className="text-subtle font-mono">({gig.reviewCount})</span>
                    </div>
                  </div>
                </div>

                {/* Footer with Starting Price */}
                <div className="flex items-center justify-between border-t border-border px-5 py-3.5 bg-surface-hover/30">
                  <span className="text-[11px] uppercase tracking-wider text-subtle font-mono">
                    Starting at
                  </span>
                  <div className="text-sm font-extrabold text-foreground font-mono">
                    {formatAmount(gig.startingPriceUSD * 100)}{" "}
                    <span className="text-[11px] text-subtle font-normal font-sans">USDC</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
