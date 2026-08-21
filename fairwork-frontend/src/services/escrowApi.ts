/**
 * Escrow domain service — backend calls for routes/escrow.js.
 *
 * These endpoints synchronize on-chain escrow state with the database.
 * They should only be called AFTER the corresponding blockchain
 * transaction has been confirmed on-chain.
 */

import { apiFetch } from "./apiClient"

interface EscrowDepositResponse {
  message: string
  project: {
    _id: string
    escrowFunded: boolean
    escrowTxnHash: string
    [key: string]: unknown
  }
}

interface EscrowReleaseResponse {
  message: string
  project: {
    _id: string
    milestones: Array<{
      _id: string
      title: string
      amount: number
      status: string
      paymentReleased: boolean
    }>
    escrowCompleted: boolean
    status: string
    [key: string]: unknown
  }
}

/**
 * Notify the backend that escrow has been funded on-chain.
 * Must be called only after the funding transaction is confirmed.
 */
export async function depositEscrow(
  projectId: string,
  txnHash: string,
  token: string,
): Promise<EscrowDepositResponse> {
  return apiFetch<EscrowDepositResponse>("/escrow/deposit", {
    method: "POST",
    token,
    body: { projectId, txnHash },
  })
}

/**
 * Notify the backend that a milestone payment has been released on-chain.
 * Must be called only after the release transaction is confirmed.
 */
export async function releaseEscrowPayment(
  projectId: string,
  milestoneIndex: number,
  txnHash: string,
  token: string,
): Promise<EscrowReleaseResponse> {
  return apiFetch<EscrowReleaseResponse>("/escrow/release", {
    method: "POST",
    token,
    body: { projectId, milestoneIndex, txnHash },
  })
}
