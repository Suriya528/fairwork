import type { Contract } from "@/types"

export const contracts: Contract[] = [
  {
    id: "ctr_01",
    projectId: "prj_01",
    title: "Design System Overhaul — Service Agreement",
    content:
      "This agreement is entered into between the Client and Freelancer for the delivery of a complete design system with a project budget of ₹90,000 INR. The equivalent 900 USDC is held in escrow and released across three milestones as each is approved. The Freelancer retains no ownership over final deliverables upon full payment. Either party may raise a dispute through the FairWork protocol if deliverables do not match the agreed scope. This contract is governed by the terms encoded in the associated EscrowContract smart contract deployed on Ethereum.",
    status: "active",
    clientSigned: true,
    clientSignedAt: "2026-06-10T10:02:00Z",
    freelancerSigned: true,
    freelancerSignedAt: "2026-06-10T11:15:00Z",
    blockchainHash: "0x7a1b2c3d4e5f60718293a4b5c6d7e8f9012a3b4c5d6e7f8091a2b3c4d5e6f70",
    createdAt: "2026-06-10T09:50:00Z",
  },
  {
    id: "ctr_02",
    projectId: "prj_02",
    title: "Marketing Website Rebuild — Service Agreement",
    content:
      "This agreement covers the design and development of a new responsive marketing website with a project budget of ₹90,000 INR. The equivalent 0.35 ETH is held in escrow and released across two milestones. The Client agrees to provide brand assets and copy within 5 business days of contract signing. Delays caused by missing Client materials do not count against Freelancer delivery deadlines.",
    status: "pending_signatures",
    clientSigned: true,
    clientSignedAt: "2026-07-12T09:10:00Z",
    freelancerSigned: false,
    freelancerSignedAt: null,
    blockchainHash: null,
    createdAt: "2026-07-12T09:00:00Z",
  },
  {
    id: "ctr_03",
    projectId: "prj_03",
    title: "Mobile App Onboarding — Service Agreement",
    content:
      "This agreement covers design and implementation of an animated onboarding flow for the Client's iOS application with a project budget of ₹35,000 INR (350 USDC held in escrow). Upon delivery, the Client has 5 business days to approve or raise a dispute. This contract's terms are currently under review as part of an active dispute filed on the associated milestone.",
    status: "voided",
    clientSigned: true,
    clientSignedAt: "2026-06-25T11:05:00Z",
    freelancerSigned: true,
    freelancerSignedAt: "2026-06-25T14:30:00Z",
    blockchainHash: "0x9c4b2e5d8a3f6b0c1d4e7f2a9b3c5d6e8f0a1f9a7c4b2e5d8a3f6b0c1d4e7f2a",
    createdAt: "2026-06-25T10:45:00Z",
  },
  {
    id: "ctr_04",
    projectId: "prj_04",
    title: "API Integration Sprint — Service Agreement",
    content:
      "This agreement covers integration of payment processing and notification microservices into the Client's existing platform with a project budget of ₹50,000 INR (500 USDC held in escrow). Released as a single milestone upon successful integration testing. Both parties confirmed successful completion and the full contract amount has been released.",
    status: "completed",
    clientSigned: true,
    clientSignedAt: "2026-04-01T10:05:00Z",
    freelancerSigned: true,
    freelancerSignedAt: "2026-04-01T12:00:00Z",
    blockchainHash: "0x3f6b0c1d4e7f2a9b3c5d6e8f0a1f9a7c4b2e5d8a3f6b0c1d4e7f2a9b3c5d6e8f",
    createdAt: "2026-04-01T09:55:00Z",
  },
]

export function getContractByProjectId(projectId: string): Contract | undefined {
  return contracts.find((c) => c.projectId === projectId)
}