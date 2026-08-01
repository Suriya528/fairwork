import type { HelpArticle } from "@/types"

export const helpArticles: HelpArticle[] = [
  {
    id: "help_01",
    category: "Getting Started",
    question: "How does FairWork protect my payment?",
    answer:
      "When a client funds a project, the full budget is locked in an Ethereum smart contract — not held by FairWork. Funds only move to the freelancer when a milestone is approved, and only the two parties involved can trigger a release or a dispute.",
  },
  {
    id: "help_02",
    category: "Getting Started",
    question: "Do I need a crypto wallet to use FairWork?",
    answer:
      "Yes. Every project's escrow lives on-chain, so you'll need a wallet (like MetaMask) connected to sign contracts and receive or send funds. You can connect one from Settings at any time.",
  },
  {
    id: "help_03",
    category: "Escrow & Payments",
    question: "When does a milestone get paid out?",
    answer:
      "As soon as a client approves a submitted milestone, the corresponding funds are released from escrow to the freelancer's wallet automatically — no manual invoicing required.",
  },
  {
    id: "help_04",
    category: "Escrow & Payments",
    question: "What happens if a client never approves my work?",
    answer:
      "If a milestone sits in review without a response, either party can raise a dispute. This freezes the funds and opens the case up for evidence and resolution rather than leaving payment indefinitely stuck.",
  },
  {
    id: "help_05",
    category: "Escrow & Payments",
    question: "Can I withdraw funds to a different wallet than the one I signed up with?",
    answer:
      "Your connected wallet is the default withdrawal destination. To send funds elsewhere, disconnect your current wallet in Settings and connect the one you'd like to use before withdrawing.",
  },
  {
    id: "help_06",
    category: "Disputes",
    question: "How are disputes resolved?",
    answer:
      "Both sides submit evidence — files, links, or written context — attached to the dispute. From there, resolution can come from either a direct agreement between both parties or a platform review, and the outcome determines whether funds release to the freelancer or return to the client.",
  },
  {
    id: "help_07",
    category: "Disputes",
    question: "Is my milestone payment still safe while a dispute is open?",
    answer:
      "Yes. Raising a dispute freezes the funds in escrow — they can't be released to either party until the dispute reaches a resolution, so nothing is lost while the case is being reviewed.",
  },
  {
    id: "help_08",
    category: "Contracts",
    question: "What is the contract for each project?",
    answer:
      "Every project has an auto-generated service agreement covering scope, payment terms, and milestones. Both the client and freelancer need to sign it before work formally begins, and once signed, its hash is anchored on-chain for a tamper-proof record.",
  },
  {
    id: "help_09",
    category: "Contracts",
    question: "Can a contract be changed after both parties sign?",
    answer:
      "No — once anchored on-chain, a contract's terms are immutable. If the scope needs to change, that requires a new milestone or a new project rather than editing a signed agreement.",
  },
  {
    id: "help_10",
    category: "Account",
    question: "How is my reputation score calculated?",
    answer:
      "Your rating is the average of reviews left by clients or freelancers you've completed projects with. Because reviews are written on-chain, they can't be edited or removed after the fact.",
  },
  {
    id: "help_11",
    category: "Account",
    question: "Can I delete my account?",
    answer:
      "Yes, from the Danger Zone in Settings. Deleting your account removes your profile and project history, but any funds already in escrow are unaffected and resolve according to their existing terms.",
  },
]

export function getHelpCategories(): string[] {
  return Array.from(new Set(helpArticles.map((a) => a.category)))
}