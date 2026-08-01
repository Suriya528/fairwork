import type { Dispute, EscrowAccount, Transaction } from "@/types"

export const transactions: Transaction[] = [
  {
    id: "tx_01",
    projectId: "prj_01",
    milestoneId: null,
    type: "deposit",
    status: "confirmed",
    amount: 9000,
    symbol: "USDC",
    hash: "0xa1b2c3d4e5f60718293a4b5c6d7e8f9012a3b4c5d6e7f8091a2b3c4d5e6f7081",
    from: "0x1f9a7C4b2E5d8A3f6B0c1D4e7F2a9B3c5D6e8F0a",
    to: "0xEsc0000000000000000000000000000000000001",
    createdAt: "2026-06-10T10:05:00Z",
    confirmedAt: "2026-06-10T10:06:12Z",
    gasFee: 2.14,
  },
  {
    id: "tx_02",
    projectId: "prj_01",
    milestoneId: "ms_01",
    type: "release",
    status: "confirmed",
    amount: 2500,
    symbol: "USDC",
    hash: "0xb2c3d4e5f60718293a4b5c6d7e8f9012a3b4c5d6e7f8091a2b3c4d5e6f7081a2",
    from: "0xEsc0000000000000000000000000000000000001",
    to: "0x8B3c5D6e8F0a1f9A7c4B2e5D8a3F6b0C1d4E7f2A",
    createdAt: "2026-06-19T09:05:00Z",
    confirmedAt: "2026-06-19T09:05:48Z",
    gasFee: 1.87,
  },
  {
    id: "tx_03",
    projectId: "prj_02",
    milestoneId: null,
    type: "deposit",
    status: "pending",
    amount: 3.1,
    symbol: "ETH",
    hash: "0xc3d4e5f60718293a4b5c6d7e8f9012a3b4c5d6e7f8091a2b3c4d5e6f7081a2b3",
    from: "0x1f9a7C4b2E5d8A3f6B0c1D4e7F2a9B3c5D6e8F0a",
    to: "0xEsc0000000000000000000000000000000000002",
    createdAt: "2026-07-20T15:00:00Z",
    confirmedAt: null,
  },
  {
    id: "tx_04",
    projectId: "prj_03",
    milestoneId: "ms_06",
    type: "dispute_hold",
    status: "confirmed",
    amount: 3500,
    symbol: "USDC",
    hash: "0xd4e5f60718293a4b5c6d7e8f9012a3b4c5d6e7f8091a2b3c4d5e6f7081a2b3c4",
    from: "0xEsc0000000000000000000000000000000000003",
    to: "0xEsc0000000000000000000000000000000000003",
    createdAt: "2026-07-06T08:00:00Z",
    confirmedAt: "2026-07-06T08:01:03Z",
  },
  {
    id: "tx_05",
    projectId: "prj_04",
    milestoneId: null,
    type: "withdrawal",
    status: "confirmed",
    amount: 5000,
    symbol: "USDC",
    hash: "0xe5f60718293a4b5c6d7e8f9012a3b4c5d6e7f8091a2b3c4d5e6f7081a2b3c4d5",
    from: "0x2D7e4F1a8C5b3E6d9A0c2B5e8F1a4C7d0E3f6B9a",
    to: "0x9C4b2E5d8A3f6B0c1D4e7F2a9B3c5D6e8F0a1f9A",
    createdAt: "2026-05-16T13:20:00Z",
    confirmedAt: "2026-05-16T13:21:40Z",
    gasFee: 1.42,
  },
  {
    id: "tx_06",
    projectId: "prj_01",
    milestoneId: "ms_02",
    type: "fee",
    status: "confirmed",
    amount: 40,
    symbol: "USDC",
    hash: "0xf60718293a4b5c6d7e8f9012a3b4c5d6e7f8091a2b3c4d5e6f7081a2b3c4d5e6",
    from: "0xEsc0000000000000000000000000000000000001",
    to: "0xFairWorkProtocolTreasury000000000000001",
    createdAt: "2026-06-19T09:06:00Z",
    confirmedAt: "2026-06-19T09:06:12Z",
    gasFee: 0.34,
  },
]

export const escrowAccounts: EscrowAccount[] = [
  {
    projectId: "prj_01",
    contractAddress: "0xEsc0000000000000000000000000000000000001",
    totalDeposited: 9000,
    totalReleased: 2500,
    totalLocked: 6500,
    symbol: "USDC",
  },
  {
    projectId: "prj_02",
    contractAddress: "0xEsc0000000000000000000000000000000000002",
    totalDeposited: 3.1,
    totalReleased: 0,
    totalLocked: 3.1,
    symbol: "ETH",
  },
  {
    projectId: "prj_03",
    contractAddress: "0xEsc0000000000000000000000000000000000003",
    totalDeposited: 3500,
    totalReleased: 0,
    totalLocked: 3500,
    symbol: "USDC",
  },
]

export const disputes: Dispute[] = [
  {
    id: "dsp_01",
    projectId: "prj_03",
    milestoneId: "ms_06",
    raisedById: "usr_client_02",
    status: "evidence",
    reason:
      "The onboarding animations do not match the approved prototype and two screens are missing.",
    resolution: "pending",
    createdAt: "2026-07-06T08:00:00Z",
    updatedAt: "2026-07-18T10:30:00Z",
    evidence: [
      {
        id: "ev_01",
        submittedById: "usr_client_02",
        note: "Comparison between approved prototype and delivered build.",
        attachments: [
          {
            id: "dl_ev_01",
            name: "prototype-vs-build.pdf",
            type: "file",
            url: "#",
            size: "6.1 MB",
            uploadedAt: "2026-07-08T10:00:00Z",
          },
        ],
        submittedAt: "2026-07-08T10:00:00Z",
      },
      {
        id: "ev_02",
        submittedById: "usr_free_01",
        note: "Scope change requests were made mid-project; original screens were delivered as agreed.",
        attachments: [],
        submittedAt: "2026-07-12T14:20:00Z",
      },
    ],
  },
]

export function getTransactionsForProject(projectId: string): Transaction[] {
  return transactions.filter((t) => t.projectId === projectId)
}

export function getEscrowForProject(
  projectId: string,
): EscrowAccount | undefined {
  return escrowAccounts.find((e) => e.projectId === projectId)
}