import { createPublicClient, createWalletClient, custom, formatUnits, http, parseUnits } from "viem"
import { sepolia } from "viem/chains"

/* ────────────────────────────────────────────────────────────
 * Blockchain Configuration — Environment-Only Resolution
 *
 * Contract addresses MUST come from environment variables.
 * No hardcoded deployment address literals.
 *
 * Canonical keys:         Legacy aliases (backward compat):
 *   VITE_ESCROW_CONTRACT_ADDRESS   ← VITE_ESCROW_ADDRESS
 *   VITE_DISPUTE_CONTRACT_ADDRESS  ← VITE_DISPUTE_ADDRESS
 *   VITE_USDC_ADDRESS              ← VITE_TOKEN_ADDRESS
 *   VITE_SEPOLIA_RPC_URL           (no alias)
 * ──────────────────────────────────────────────────────────── */

function resolveAddressEnv(canonicalKey: string, aliasKey: string): `0x${string}` | undefined {
  const canonical = (import.meta.env[canonicalKey] as string | undefined)?.trim()
  const alias = (import.meta.env[aliasKey] as string | undefined)?.trim()

  if (canonical && alias && canonical.toLowerCase() !== alias.toLowerCase()) {
    throw new Error(
      `Blockchain configuration conflict: Both ${canonicalKey} ("${canonical}") and legacy alias ${aliasKey} ("${alias}") are defined with different values. Resolve this conflict in your environment configuration.`
    )
  }

  const value = canonical || alias || ""
  return value ? (value as `0x${string}`) : undefined
}

export const escrowAddress = resolveAddressEnv("VITE_ESCROW_CONTRACT_ADDRESS", "VITE_ESCROW_ADDRESS")
export const disputeAddress = resolveAddressEnv("VITE_DISPUTE_CONTRACT_ADDRESS", "VITE_DISPUTE_ADDRESS")
export const usdcAddress = resolveAddressEnv("VITE_USDC_ADDRESS", "VITE_TOKEN_ADDRESS")

const sepoliaRpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL as string | undefined
export const publicClient = sepoliaRpcUrl
  ? createPublicClient({ chain: sepolia, transport: http(sepoliaRpcUrl) })
  : undefined

export const ERC20_ABI = [
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address", name: "owner" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ type: "address", name: "owner" }, { type: "address", name: "spender" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ type: "address", name: "spender" }, { type: "uint256", name: "amount" }], outputs: [{ type: "bool" }] },
] as const

export const ESCROW_ABI = [
  { type: "function", name: "createEscrow", stateMutability: "nonpayable", inputs: [{ type: "string", name: "projectId" }, { type: "address", name: "freelancer" }, { type: "address", name: "token" }, { type: "uint256[]", name: "milestoneAmounts" }], outputs: [] },
  { type: "function", name: "fund", stateMutability: "nonpayable", inputs: [{ type: "string", name: "projectId" }], outputs: [] },
  { type: "function", name: "releaseMilestone", stateMutability: "nonpayable", inputs: [{ type: "string", name: "projectId" }, { type: "uint256", name: "index" }], outputs: [] },
  { type: "function", name: "getEscrowParties", stateMutability: "view", inputs: [{ type: "string", name: "projectId" }], outputs: [{ type: "address", name: "client" }, { type: "address", name: "freelancer" }, { type: "bool", name: "isFunded" }, { type: "bool", name: "isDisputed" }, { type: "bool", name: "isCompleted" }] },
] as const

export const DISPUTE_ABI = [
  { type: "function", name: "raiseDispute", stateMutability: "nonpayable", inputs: [{ type: "string", name: "projectId" }, { type: "string", name: "reason" }], outputs: [] },
] as const

export async function connectWallet() {
  if (typeof window === "undefined" || !window.ethereum) throw new Error("No browser wallet was found.")
  const wallet = createWalletClient({ chain: sepolia, transport: custom(window.ethereum) })
  const [account] = await wallet.requestAddresses()
  if ((await wallet.getChainId()) !== sepolia.id) await wallet.switchChain({ id: sepolia.id })
  return { wallet, account }
}

/**
 * Validates that all required blockchain configuration is present.
 * Throws a descriptive error if any required address or RPC client is missing.
 */
function configured() {
  const missing: string[] = []
  if (!publicClient) missing.push("VITE_SEPOLIA_RPC_URL")
  if (!escrowAddress) missing.push("VITE_ESCROW_CONTRACT_ADDRESS")
  if (!disputeAddress) missing.push("VITE_DISPUTE_CONTRACT_ADDRESS")
  if (!usdcAddress) missing.push("VITE_USDC_ADDRESS")
  if (missing.length > 0) {
    throw new Error(`Blockchain configuration is incomplete. Missing: ${missing.join(", ")}`)
  }
  return { publicClient: publicClient!, escrowAddress: escrowAddress!, disputeAddress: disputeAddress!, usdcAddress: usdcAddress! }
}

/** Returns true if blockchain configuration is fully available. */
export function isBlockchainConfigured(): boolean {
  return Boolean(publicClient && escrowAddress && disputeAddress && usdcAddress)
}

async function units(token: `0x${string}`, amount: string) {
  const c = configured()
  const decimals = await c.publicClient.readContract({ address: token, abi: ERC20_ABI, functionName: "decimals" })
  return parseUnits(amount, decimals)
}

async function confirm(hash: `0x${string}`) {
  const receipt = await configured().publicClient.waitForTransactionReceipt({ hash })
  if (receipt.status !== "success") throw new Error("Transaction reverted.")
  return receipt
}

function requireVerifiedAccount(account: `0x${string}`, verifiedWallet: string) {
  if (!verifiedWallet || account.toLowerCase() !== verifiedWallet.toLowerCase()) {
    throw new Error("Connect the wallet verified for this FairWork account.")
  }
}

/**
 * Fund escrow for a project. Returns the confirmed funding transaction hash.
 *
 * Flow: validate → check balance → create escrow (if needed) → approve ERC-20 → fund
 * All transactions wait for receipt confirmation before proceeding.
 */
export async function fundEscrow(
  projectId: string,
  freelancer: `0x${string}`,
  amountsText: string[],
  verifiedWallet: string,
  onStage: (value: string) => void,
): Promise<`0x${string}`> {
  const c = configured()
  const { wallet, account } = await connectWallet()
  requireVerifiedAccount(account, verifiedWallet)

  const amounts = await Promise.all(amountsText.map((a) => units(c.usdcAddress, a)))
  const total = amounts.reduce((a, b) => a + b, 0n)

  // Audit exact token balance calculation
  const decimals = await c.publicClient.readContract({ address: c.usdcAddress, abi: ERC20_ABI, functionName: "decimals" })
  let symbol = "USDC"
  try {
    symbol = await c.publicClient.readContract({ address: c.usdcAddress, abi: ERC20_ABI, functionName: "symbol" })
  } catch {
    // default symbol fallback
  }

  const rawBalance = await c.publicClient.readContract({ address: c.usdcAddress, abi: ERC20_ABI, functionName: "balanceOf", args: [account] })
  const formattedBalance = formatUnits(rawBalance, decimals)
  const formattedRequired = formatUnits(total, decimals)

  console.info("=== FAIRWORK ESCROW FUNDING DIAGNOSTIC ===", {
    connectedWalletAddress: account,
    configuredTokenContractAddress: c.usdcAddress,
    tokenSymbol: symbol,
    tokenDecimals: decimals,
    rawTokenBalance: rawBalance.toString(),
    formattedTokenBalance: `${formattedBalance} ${symbol}`,
    requiredRawAmount: total.toString(),
    formattedRequiredAmount: `${formattedRequired} ${symbol}`,
  })

  if (rawBalance < total) {
    throw new Error(
      `Insufficient ${symbol} token balance on Sepolia testnet. Connected wallet (${account}) has ${formattedBalance} ${symbol}, but project requires ${formattedRequired} ${symbol}. Note: Sepolia ETH is used for gas fees and cannot be used as ${symbol} escrow tokens.`
    )
  }

  const escrow = await c.publicClient.readContract({
    address: c.escrowAddress,
    abi: ESCROW_ABI,
    functionName: "getEscrowParties",
    args: [projectId],
  })

  if (escrow[0] === "0x0000000000000000000000000000000000000000") {
    onStage("Creating escrow on-chain")
    await confirm(
      await wallet.writeContract({
        account,
        address: c.escrowAddress,
        abi: ESCROW_ABI,
        functionName: "createEscrow",
        args: [projectId, freelancer, c.usdcAddress, amounts],
      }),
    )
  } else if (escrow[0].toLowerCase() !== account.toLowerCase()) {
    throw new Error("Connected wallet is not this escrow's client.")
  }

  if (
    (await c.publicClient.readContract({
      address: c.usdcAddress,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [account, c.escrowAddress],
    })) < total
  ) {
    onStage("Approving token allowance")
    await confirm(
      await wallet.writeContract({
        account,
        address: c.usdcAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [c.escrowAddress, total],
      }),
    )
  }

  onStage("Funding escrow — confirm in wallet")
  const fundTxHash = await wallet.writeContract({
    account,
    address: c.escrowAddress,
    abi: ESCROW_ABI,
    functionName: "fund",
    args: [projectId],
  })
  onStage("Waiting for blockchain confirmation...")
  await confirm(fundTxHash)
  return fundTxHash
}

/**
 * Release a milestone payment. Returns the confirmed release transaction hash.
 *
 * The transaction originates from the authorized Client wallet.
 * paymentReleased MUST NOT be set to true until this function returns successfully.
 */
export async function releaseEscrowMilestone(
  projectId: string,
  index: number,
  verifiedWallet: string,
): Promise<`0x${string}`> {
  const c = configured()
  const { wallet, account } = await connectWallet()
  requireVerifiedAccount(account, verifiedWallet)
  const releaseTxHash = await wallet.writeContract({
    account,
    address: c.escrowAddress,
    abi: ESCROW_ABI,
    functionName: "releaseMilestone",
    args: [projectId, BigInt(index)],
  })
  await confirm(releaseTxHash)
  return releaseTxHash
}

export async function raiseEscrowDispute(projectId: string, reason: string, verifiedWallet: string) {
  const c = configured()
  const { wallet, account } = await connectWallet()
  requireVerifiedAccount(account, verifiedWallet)
  await confirm(
    await wallet.writeContract({
      account,
      address: c.disputeAddress,
      abi: DISPUTE_ABI,
      functionName: "raiseDispute",
      args: [projectId, reason],
    }),
  )
}
