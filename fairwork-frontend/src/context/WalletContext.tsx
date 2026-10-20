import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { createWalletClient, custom, getAddress } from "viem"
import { useAuth } from "./AuthContext"
import { useToast } from "@/components/ui/Toast"
import { getWalletNonce, verifyWallet as apiVerifyWallet } from "@/services/authApi"
import { NoWalletModal } from "@/components/wallet/NoWalletModal"
import { PendingApprovalModal } from "@/components/wallet/PendingApprovalModal"
import { targetChain } from "@/services/web3"

export const OFFICIAL_METAMASK_INSTALL_URL = "https://metamask.io/download/"

export type WalletState = "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "VERIFYING" | "VERIFIED"

export type WalletErrorState =
  | null
  | "WRONG_NETWORK"
  | "USER_REJECTED"
  | "PROVIDER_UNAVAILABLE"
  | "VERIFICATION_FAILED"
  | "WALLET_ALREADY_LINKED"
  | "NETWORK_ERROR"

interface WalletContextValue {
  walletState: WalletState
  errorState: WalletErrorState
  errorMessage: string
  connectedAccount: string | null
  chainId: number | null
  isCorrectNetwork: boolean
  verifiedWalletAddress: string | null
  isVerified: boolean
  isConnecting: boolean
  isVerifying: boolean
  isProviderAvailable: boolean
  hasMetaMask: boolean
  noWalletModalOpen: boolean
  openNoWalletModal: () => void
  closeNoWalletModal: () => void
  pendingApprovalModalOpen: boolean
  openPendingApprovalModal: () => void
  closePendingApprovalModal: () => void
  checkPendingApproval: () => Promise<boolean>
  redetectProvider: () => Promise<boolean>
  connect: () => Promise<string | null>
  verify: (providedAccount?: string) => Promise<boolean>
  connectAndVerify: () => Promise<boolean>
  switchNetwork: () => Promise<boolean>
  disconnect: () => void
  unlinkWallet: () => Promise<boolean>
  clearError: () => void
  cancelPendingAction: () => void
  addUsdcToWallet: () => Promise<boolean>
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined)

const TARGET_CHAIN_ID = targetChain.id
const TARGET_CHAIN_HEX = `0x${TARGET_CHAIN_ID.toString(16)}`

/**
 * Wraps a promise in a bounded timeout to prevent hanging UI states
 * if a user closes or dismisses an extension popup without an explicit RPC reject.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 12000,
  timeoutMessage = "Wallet request timed out or was closed in MetaMask."
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(timeoutMessage))
    }, timeoutMs)
  })
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer)
  })
}

// Global EIP-6963 announced provider registry
const announcedProviders: any[] = []

if (typeof window !== "undefined") {
  window.addEventListener("eip6963:announceProvider", (event: any) => {
    if (event?.detail?.provider && !announcedProviders.some((p) => p === event.detail.provider)) {
      announcedProviders.push(event.detail.provider)
    }
  })
  window.dispatchEvent(new Event("eip6963:requestProvider"))
}

/**
 * Safely inspects browser window for injected Web3 EVM provider.
 * Supports window.ethereum, multiple injected providers, and EIP-6963 discovered providers.
 */
export function getInjectedProvider(): any {
  if (typeof window === "undefined") return null

  const eth = (window as any).ethereum
  if (eth) {
    if (Array.isArray(eth.providers) && eth.providers.length > 0) {
      const mm = eth.providers.find((p: any) => p && p.isMetaMask)
      return mm || eth.providers[0]
    }
    return eth
  }

  if (announcedProviders.length > 0) {
    const mm = announcedProviders.find((p: any) => p && p.isMetaMask)
    return mm || announcedProviders[0]
  }

  const legacy = (window as any).web3?.currentProvider
  if (legacy) return legacy

  return null
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user, token, updateWallet, unlinkWallet: authUnlinkWallet } = useAuth()
  const { toast } = useToast()

  const [walletState, setWalletState] = useState<WalletState>("DISCONNECTED")
  const [errorState, setErrorState] = useState<WalletErrorState>(null)
  const [errorMessage, setErrorMessage] = useState("")

  const [connectedAccount, setConnectedAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)

  const [noWalletModalOpen, setNoWalletModalOpen] = useState(false)
  const [pendingApprovalModalOpen, setPendingApprovalModalOpen] = useState(false)
  const [isProviderAvailable, setIsProviderAvailable] = useState<boolean>(() => Boolean(getInjectedProvider()))
  const [hasMetaMask, setHasMetaMask] = useState<boolean>(() => Boolean(getInjectedProvider()?.isMetaMask))

  const verifiedWalletAddress = user?.walletAddress ? user.walletAddress.toLowerCase() : null
  const verifiedWalletAddressRef = useRef(verifiedWalletAddress)
  verifiedWalletAddressRef.current = verifiedWalletAddress

  const activeRequestIdRef = useRef(0)
  const requestStartTimeRef = useRef(0)

  const isCorrectNetwork = chainId === TARGET_CHAIN_ID
  const isVerified = Boolean(
    verifiedWalletAddress &&
      connectedAccount &&
      connectedAccount.toLowerCase() === verifiedWalletAddress,
  )

  const openNoWalletModal = useCallback(() => {
    setNoWalletModalOpen(true)
  }, [])

  const closeNoWalletModal = useCallback(() => {
    setNoWalletModalOpen(false)
  }, [])

  const openPendingApprovalModal = useCallback(() => {
    setPendingApprovalModalOpen(true)
  }, [])

  const closePendingApprovalModal = useCallback(() => {
    setPendingApprovalModalOpen(false)
  }, [])

  const clearError = useCallback(() => {
    setErrorState(null)
    setErrorMessage("")
  }, [])

  const checkPendingApproval = useCallback(async (): Promise<boolean> => {
    try {
      const provider = getInjectedProvider()
      if (!provider) return false
      const currentAccounts = await provider.request({ method: "eth_accounts" })
      if (Array.isArray(currentAccounts) && currentAccounts.length > 0) {
        const acc = currentAccounts[0].toLowerCase()
        setConnectedAccount(acc)
        const vAddr = verifiedWalletAddressRef.current
        setWalletState(vAddr && acc === vAddr ? "VERIFIED" : "CONNECTED")
        clearError()
        setPendingApprovalModalOpen(false)
        return true
      }
    } catch {
      // ignore
    }
    return false
  }, [clearError])

  // Check provider availability
  const checkProviderState = useCallback(() => {
    const provider = getInjectedProvider()
    const available = Boolean(provider)
    const isMM = Boolean(provider?.isMetaMask)
    setIsProviderAvailable(available)
    setHasMetaMask(isMM)
    return available
  }, [])

  // Bounded re-detection helper for "I've Installed MetaMask"
  const redetectProvider = useCallback(async (): Promise<boolean> => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const available = checkProviderState()
      if (available) {
        clearError()
        setNoWalletModalOpen(false)
        return true
      }
      await new Promise((r) => setTimeout(r, 500))
    }
    return false
  }, [checkProviderState, clearError])

  // EIP-6963 & ethereum#initialized late-injection listener with periodic async polling
  useEffect(() => {
    checkProviderState()

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("eip6963:requestProvider"))
    }

    const pollTimers = [
      setTimeout(checkProviderState, 150),
      setTimeout(checkProviderState, 500),
      setTimeout(checkProviderState, 1200),
      setTimeout(checkProviderState, 2500),
    ]

    const handleInitialized = () => {
      checkProviderState()
    }

    if (typeof window !== "undefined") {
      window.addEventListener("ethereum#initialized", handleInitialized)
      window.addEventListener("eip6963:announceProvider", handleInitialized as EventListener)
    }

    return () => {
      pollTimers.forEach(clearTimeout)
      if (typeof window !== "undefined") {
        window.removeEventListener("ethereum#initialized", handleInitialized)
        window.removeEventListener("eip6963:announceProvider", handleInitialized as EventListener)
      }
    }
  }, [checkProviderState])

  // Stable event handlers for accountsChanged and chainChanged
  const activeProviderRef = useRef<any>(null)

  useEffect(() => {
    const provider = getInjectedProvider()
    if (!provider || typeof provider.request !== "function") return

    activeProviderRef.current = provider
    setIsProviderAvailable(true)
    setHasMetaMask(Boolean(provider.isMetaMask))

    try {
      provider
        .request({ method: "eth_accounts" })
        .then((res: unknown) => {
          const accounts = res as string[]
          if (accounts && accounts.length > 0) {
            const acc = accounts[0].toLowerCase()
            setConnectedAccount(acc)
            const vAddr = verifiedWalletAddressRef.current
            setWalletState(vAddr && acc === vAddr ? "VERIFIED" : "CONNECTED")
          }
        })
        .catch(() => {})

      provider
        .request({ method: "eth_chainId" })
        .then((res: unknown) => {
          const hexChainId = res as string
          if (hexChainId) {
            const parsed = parseInt(hexChainId, 16)
            setChainId(parsed)
          }
        })
        .catch(() => {})
    } catch {
      // Ignore provider initialization errors
    }

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts && accounts.length > 0) {
        const newAcc = accounts[0].toLowerCase()
        setConnectedAccount(newAcc)
        const vAddr = verifiedWalletAddressRef.current
        setWalletState(vAddr && newAcc === vAddr ? "VERIFIED" : "CONNECTED")
        setErrorState(null)
        setErrorMessage("")
      } else {
        setConnectedAccount(null)
        setWalletState("DISCONNECTED")
      }
    }

    const handleChainChanged = (hexChainId: string) => {
      const parsed = parseInt(hexChainId, 16)
      setChainId(parsed)
      if (parsed !== TARGET_CHAIN_ID) {
        setErrorState("WRONG_NETWORK")
        setErrorMessage("Please switch your Web3 wallet to the Sepolia test network.")
      } else {
        setErrorState((prev) => (prev === "WRONG_NETWORK" ? null : prev))
      }
    }

    if (provider.on) {
      provider.on("accountsChanged", handleAccountsChanged)
      provider.on("chainChanged", handleChainChanged)
    }

    return () => {
      try {
        if (provider.removeListener) {
          provider.removeListener("accountsChanged", handleAccountsChanged)
          provider.removeListener("chainChanged", handleChainChanged)
        }
      } catch {
        // Ignore unmount cleanup errors on custom providers
      }
    }
  }, [isProviderAvailable])

  // Sync walletState with user.walletAddress
  useEffect(() => {
    if (connectedAccount && verifiedWalletAddress && connectedAccount.toLowerCase() === verifiedWalletAddress) {
      setWalletState("VERIFIED")
    } else if (connectedAccount) {
      setWalletState("CONNECTED")
    } else {
      setWalletState("DISCONNECTED")
    }
  }, [connectedAccount, verifiedWalletAddress])

  // Active Watchdog to detect when user closed or dismissed MetaMask popup without approving
  useEffect(() => {
    if (typeof window === "undefined") return
    if (walletState !== "CONNECTING" && walletState !== "VERIFYING") return

    let isCancelled = false
    let hasBlurred = false

    const handleBlur = () => {
      hasBlurred = true
    }

    const checkAndRecoverIfClosed = async (delayMs = 200) => {
      if (delayMs > 0) {
        await new Promise((r) => setTimeout(r, delayMs))
      }
      if (isCancelled) return

      try {
        const provider = getInjectedProvider()
        if (!provider) return

        const currentAccounts = await provider.request({ method: "eth_accounts" })
        if (Array.isArray(currentAccounts) && currentAccounts.length > 0) {
          const acc = currentAccounts[0].toLowerCase()
          setConnectedAccount(acc)
          const vAddr = verifiedWalletAddressRef.current
          if (walletState === "VERIFYING" && (!vAddr || acc !== vAddr)) {
            activeRequestIdRef.current++
            setWalletState("CONNECTED")
            setErrorState("USER_REJECTED")
            setErrorMessage("Signature request was closed or cancelled in MetaMask. Click 'Sign EIP-712 Verification' to try again.")
          } else {
            setWalletState(vAddr && acc === vAddr ? "VERIFIED" : "CONNECTED")
            clearError()
          }
        } else {
          // If no accounts authorized and user is back on the page:
          activeRequestIdRef.current++
          setWalletState(connectedAccount ? "CONNECTED" : "DISCONNECTED")
          setErrorState("USER_REJECTED")
          setErrorMessage("Wallet prompt was closed or cancelled. Click 'Connect Wallet' to try again.")
        }
      } catch {
        activeRequestIdRef.current++
        setWalletState(connectedAccount ? "CONNECTED" : "DISCONNECTED")
      }
    }

    // 1. User clicked anywhere on the webpage while connecting/verifying
    // In Chromium, clicking on the webpage closes any open extension popup.
    const handlePointerDown = () => {
      if (Date.now() - requestStartTimeRef.current > 500) {
        void checkAndRecoverIfClosed(150)
      }
    }

    // 2. User pressed Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        activeRequestIdRef.current++
        setWalletState(connectedAccount ? "CONNECTED" : "DISCONNECTED")
        clearError()
      }
    }

    // 3. Window focus or visibility change
    const handleFocusOrVisible = () => {
      if (Date.now() - requestStartTimeRef.current > 500) {
        void checkAndRecoverIfClosed(250)
      }
    }

    // 4. If window blurred (MetaMask opened) and subsequently regained focus
    const interval = setInterval(() => {
      if (hasBlurred && document.hasFocus() && Date.now() - requestStartTimeRef.current > 800) {
        void checkAndRecoverIfClosed(150)
      }
    }, 800)

    window.addEventListener("blur", handleBlur)
    window.addEventListener("pointerdown", handlePointerDown, { passive: true })
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("focus", handleFocusOrVisible)
    document.addEventListener("visibilitychange", handleFocusOrVisible)

    return () => {
      isCancelled = true
      clearInterval(interval)
      window.removeEventListener("blur", handleBlur)
      window.removeEventListener("pointerdown", handlePointerDown)
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("focus", handleFocusOrVisible)
      document.removeEventListener("visibilitychange", handleFocusOrVisible)
    }
  }, [walletState, connectedAccount, clearError])

  // Step 1: Switch Network to Sepolia
  const switchNetwork = useCallback(async (): Promise<boolean> => {
    const provider = getInjectedProvider()
    if (!provider) return false
    clearError()

    try {
      await withTimeout(
        provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: TARGET_CHAIN_HEX }],
        }),
        25000,
        "Network switch request timed out or was closed in MetaMask."
      )
      setChainId(TARGET_CHAIN_ID)
      setErrorState(null)
      setErrorMessage("")
      return true
    } catch (err: any) {
      if (err?.code === 4902 || (typeof err?.message === "string" && err.message.includes("Unrecognized chain"))) {
        try {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: TARGET_CHAIN_HEX,
                chainName: targetChain.name,
                nativeCurrency: targetChain.nativeCurrency,
                rpcUrls: targetChain.rpcUrls?.default?.http || [],
                blockExplorerUrls: targetChain.blockExplorers?.default?.url ? [targetChain.blockExplorers.default.url] : [],
              },
            ],
          })
          setChainId(TARGET_CHAIN_ID)
          setErrorState(null)
          setErrorMessage("")
          return true
        } catch {
          // ignore and fall through
        }
      }
      const msg = err instanceof Error ? err.message : "Network switch failed"
      setErrorState("WRONG_NETWORK")
      setErrorMessage(msg.includes("rejected") ? "Network switch request was cancelled." : msg)
      return false
    }
  }, [clearError])

  // Step 2: Connect Wallet Account
  const connect = useCallback(async (): Promise<string | null> => {
    clearError()
    const currentReqId = ++activeRequestIdRef.current
    requestStartTimeRef.current = Date.now()

    const provider = getInjectedProvider()
    if (!provider) {
      setErrorState("PROVIDER_UNAVAILABLE")
      setErrorMessage("No compatible wallet detected. Install MetaMask, create or import your wallet there, then return to FairWork and connect it.")
      setIsProviderAvailable(false)
      setNoWalletModalOpen(true)
      toast({
        title: "No Wallet Detected",
        description: "Please install or unlock MetaMask, then try again.",
        tone: "warning",
      })
      return null
    }

    setWalletState("CONNECTING")

    try {
      const wallet = createWalletClient({ chain: targetChain, transport: custom(provider) })

      let accounts: string[] = []
      try {
        const existing = await provider.request({ method: "eth_accounts" })
        if (Array.isArray(existing) && existing.length > 0) {
          accounts = existing
        }
      } catch {
        // Fall back to requesting
      }

      if (accounts.length === 0) {
        try {
          accounts = await withTimeout(
            wallet.requestAddresses(),
            12000,
            "Wallet connection request timed out or was closed in MetaMask."
          )
        } catch (reqErr: any) {
          if (currentReqId !== activeRequestIdRef.current) return null
          if (reqErr?.code === -32002 || (typeof reqErr?.message === "string" && reqErr.message.includes("already pending"))) {
            try {
              const retryAccounts = await provider.request({ method: "eth_accounts" })
              if (Array.isArray(retryAccounts) && retryAccounts.length > 0) {
                accounts = retryAccounts
              } else {
                throw reqErr
              }
            } catch {
              throw reqErr
            }
          } else {
            throw reqErr
          }
        }
      }

      if (currentReqId !== activeRequestIdRef.current) return null

      const account = accounts[0]
      if (!account) {
        throw new Error("No account authorized.")
      }

      const currentChain = await wallet.getChainId()
      const normalizedAccount = account.toLowerCase()
      setConnectedAccount(normalizedAccount)
      setChainId(currentChain)

      if (currentChain !== TARGET_CHAIN_ID) {
        setErrorState("WRONG_NETWORK")
        setErrorMessage(`Connected to incorrect network. Please switch to ${targetChain.name}.`)
        await switchNetwork()
      }

      const isUserVerified = Boolean(
        verifiedWalletAddress && normalizedAccount === verifiedWalletAddress,
      )
      setWalletState(isUserVerified ? "VERIFIED" : "CONNECTED")
      return normalizedAccount
    } catch (err: unknown) {
      if (currentReqId !== activeRequestIdRef.current) return null
      const msg = err instanceof Error ? err.message : "Failed to connect wallet"
      if (msg.includes("rejected") || msg.includes("denied") || msg.includes("User rejected")) {
        setErrorState("USER_REJECTED")
        setErrorMessage("Wallet connection request was cancelled.")
        toast({
          title: "Connection Cancelled",
          description: "Wallet connection request was cancelled in your wallet.",
          tone: "info",
        })
      } else if (msg.includes("already pending") || (err as any)?.code === -32002) {
        setErrorState("PROVIDER_UNAVAILABLE")
        setErrorMessage("A connection prompt is already pending in MetaMask. Look for the 🦊 MetaMask icon in your browser toolbar (top-right next to the address bar) and click it to approve, or click 'Reload Tab to Reset'.")
        setPendingApprovalModalOpen(true)
        toast({
          title: "MetaMask Prompt Pending in Toolbar",
          description: "Click the 🦊 MetaMask extension icon in your browser toolbar to approve, or click 'Reload Tab to Reset'.",
          tone: "warning",
        })

        // Poll eth_accounts in background for up to 30s to auto-detect approval
        let pollCount = 0
        const pollInterval = setInterval(async () => {
          pollCount++
          if (currentReqId !== activeRequestIdRef.current) {
            clearInterval(pollInterval)
            return
          }
          try {
            const p = getInjectedProvider()
            if (p) {
              const pendingAccs = await p.request({ method: "eth_accounts" })
              if (Array.isArray(pendingAccs) && pendingAccs.length > 0) {
                clearInterval(pollInterval)
                const newAcc = pendingAccs[0].toLowerCase()
                setConnectedAccount(newAcc)
                setErrorState(null)
                setErrorMessage("")
                const vAddr = verifiedWalletAddressRef.current
                setWalletState(vAddr && newAcc === vAddr ? "VERIFIED" : "CONNECTED")
                setPendingApprovalModalOpen(false)
                toast({
                  title: "Wallet Connected",
                  description: `Connected to ${newAcc.slice(0, 6)}...${newAcc.slice(-4)}. You can now verify wallet ownership.`,
                  tone: "info",
                })
              }
            }
          } catch {
            // ignore
          }
          if (pollCount >= 30) {
            clearInterval(pollInterval)
          }
        }, 1000)
      } else {
        setErrorState("PROVIDER_UNAVAILABLE")
        setErrorMessage(msg)
        toast({
          title: "Connection Failed",
          description: msg,
          tone: "error",
        })
      }
      if (currentReqId === activeRequestIdRef.current) {
        setWalletState("DISCONNECTED")
      }
      return null
    }
  }, [clearError, switchNetwork, toast, verifiedWalletAddress])

  // Step 3: Cryptographic EIP-712 Ownership Verification & Backend Link
  const verify = useCallback(async (providedAccount?: string): Promise<boolean> => {
    clearError()
    const currentReqId = ++activeRequestIdRef.current
    requestStartTimeRef.current = Date.now()

    if (!token) {
      setErrorState("VERIFICATION_FAILED")
      setErrorMessage("You must be logged in to FairWork to verify a wallet.")
      toast({
        title: "Authentication Required",
        description: "You must be signed in to link a Web3 wallet.",
        tone: "error",
      })
      return false
    }

    const provider = getInjectedProvider()
    if (!provider) {
      setErrorState("PROVIDER_UNAVAILABLE")
      setErrorMessage("No compatible wallet detected. Please install MetaMask.")
      setNoWalletModalOpen(true)
      toast({
        title: "No Wallet Detected",
        description: "Please install or unlock MetaMask, then try again.",
        tone: "warning",
      })
      return false
    }

    let activeAccount = providedAccount || connectedAccount
    if (!activeAccount) {
      const acc = await connect()
      if (!acc || currentReqId !== activeRequestIdRef.current) return false
      activeAccount = acc
    }

    setWalletState("VERIFYING")

    try {
      const wallet = createWalletClient({ chain: targetChain, transport: custom(provider) })
      const currentChain = await wallet.getChainId()

      if (currentChain !== TARGET_CHAIN_ID) {
        const switched = await switchNetwork()
        if (!switched) {
          setErrorState("WRONG_NETWORK")
          setErrorMessage(`Please switch to the ${targetChain.name} network to complete verification.`)
          setWalletState("CONNECTED")
          toast({
            title: "Network Switch Required",
            description: `Please switch to ${targetChain.name} in MetaMask to verify.`,
            tone: "warning",
          })
          return false
        }
      }

      if (currentReqId !== activeRequestIdRef.current) return false

      const challenge = await getWalletNonce(token)

      const signature = await withTimeout(
        wallet.signTypedData({
          account: activeAccount as `0x${string}`,
          domain: challenge.domain,
          types: challenge.types,
          primaryType: challenge.primaryType,
          message: {
            walletAddress: activeAccount,
            nonce: challenge.nonce,
            purpose: challenge.purpose,
          },
        }),
        15000,
        "EIP-712 signature request timed out or was closed in MetaMask."
      )

      if (currentReqId !== activeRequestIdRef.current) return false

      const verifiedUser = await apiVerifyWallet(activeAccount, challenge.nonce, signature, token)

      await updateWallet(verifiedUser.walletAddress, verifiedUser)

      setWalletState("VERIFIED")
      setErrorState(null)
      setErrorMessage("Wallet ownership verified successfully!")
      toast({
        title: "Wallet Verified",
        description: `Wallet ${activeAccount.slice(0, 6)}...${activeAccount.slice(-4)} linked successfully!`,
        tone: "success",
      })
      return true
    } catch (err: unknown) {
      if (currentReqId !== activeRequestIdRef.current) return false
      const msg = err instanceof Error ? err.message : "Wallet verification failed"

      if (msg.includes("already associated") || msg.includes("already linked")) {
        setErrorState("WALLET_ALREADY_LINKED")
        setErrorMessage("This wallet address is already linked to another FairWork account.")
        toast({
          title: "Wallet Already Linked",
          description: "This wallet address is already associated with another account.",
          tone: "error",
        })
      } else if (msg.includes("rejected") || msg.includes("User rejected")) {
        setErrorState("USER_REJECTED")
        setErrorMessage("EIP-712 signature request was cancelled.")
        toast({
          title: "Signature Cancelled",
          description: "Verification signature was cancelled in your wallet.",
          tone: "info",
        })
      } else if (msg.includes("already pending") || (err as any)?.code === -32002) {
        setErrorState("PROVIDER_UNAVAILABLE")
        setErrorMessage("A signature request is already pending in MetaMask. Please open MetaMask to sign.")
        toast({
          title: "MetaMask Prompt Pending",
          description: "Please click on the MetaMask extension icon in your browser to sign the verification request.",
          tone: "warning",
        })
      } else {
        setErrorState("VERIFICATION_FAILED")
        setErrorMessage(msg)
        toast({
          title: "Verification Failed",
          description: msg,
          tone: "error",
        })
      }

      setWalletState(connectedAccount ? "CONNECTED" : "DISCONNECTED")
      return false
    }
  }, [clearError, connectedAccount, connect, switchNetwork, toast, token, updateWallet])

  // Full Flow: Connect + Verify
  const connectAndVerify = useCallback(async (): Promise<boolean> => {
    const acc = await connect()
    if (!acc) return false
    return await verify(acc)
  }, [connect, verify])

  // Disconnect Browser Wallet Session
  const disconnect = useCallback(() => {
    setConnectedAccount(null)
    setWalletState("DISCONNECTED")
    clearError()
  }, [clearError])

  // Unlink verified wallet from FairWork profile (backend + state)
  const unlinkWallet = useCallback(async (): Promise<boolean> => {
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "You must be signed in to unlink your wallet.",
        tone: "error",
      })
      return false
    }

    try {
      await authUnlinkWallet()
      setWalletState(connectedAccount ? "CONNECTED" : "DISCONNECTED")
      toast({
        title: "Wallet Unlinked",
        description: "Your Web3 wallet has been unlinked from your FairWork account.",
        tone: "info",
      })
      return true
    } catch (err: any) {
      toast({
        title: "Unlink Failed",
        description: err?.message || "Failed to unlink wallet.",
        tone: "error",
      })
      return false
    }
  }, [authUnlinkWallet, connectedAccount, toast, token])

  // Explicitly cancel any pending connect / verify UI loading state
  const cancelPendingAction = useCallback(() => {
    activeRequestIdRef.current++
    setWalletState(connectedAccount ? "CONNECTED" : "DISCONNECTED")
    setErrorState(null)
    setErrorMessage("")
  }, [connectedAccount])

  // 1-Click Import of FairWork Mock USDC into MetaMask (EIP-747)
  const addUsdcToWallet = useCallback(async (): Promise<boolean> => {
    const rawAddress = (
      import.meta.env.VITE_USDC_ADDRESS ||
      import.meta.env.VITE_TOKEN_ADDRESS ||
      "0xf21bdf6737a3009359f9ec1fa515e6d74702f575"
    ).trim()

    let checksumAddress = rawAddress
    try {
      checksumAddress = getAddress(rawAddress)
    } catch {
      checksumAddress = rawAddress
    }

    const provider = getInjectedProvider()
    if (!provider) {
      try {
        await navigator.clipboard.writeText(checksumAddress)
      } catch {}
      setNoWalletModalOpen(true)
      toast({
        title: "No Wallet Detected",
        description: "No Web3 browser wallet found. Token address copied to clipboard!",
        tone: "warning",
      })
      return false
    }

    try {
      // Step 1: Ensure wallet account is authorized / active
      let activeAcc = connectedAccount
      if (!activeAcc) {
        try {
          const existing = await provider.request({ method: "eth_accounts" })
          if (Array.isArray(existing) && existing.length > 0) {
            activeAcc = existing[0]
            setConnectedAccount(existing[0].toLowerCase())
          } else {
            const requested = await withTimeout(
              provider.request({ method: "eth_requestAccounts" }),
              15000,
              "Wallet connection timed out or was closed in MetaMask."
            )
            if (Array.isArray(requested) && requested.length > 0) {
              activeAcc = requested[0]
              setConnectedAccount(requested[0].toLowerCase())
            }
          }
        } catch (accErr: any) {
          if (accErr?.code === 4001 || (typeof accErr?.message === "string" && accErr.message.includes("User rejected"))) {
            toast({
              title: "Connection Required",
              description: "Please connect and authorize your wallet before importing tokens.",
              tone: "info",
            })
            return false
          }
          if (accErr?.code === -32002 || (typeof accErr?.message === "string" && accErr.message.includes("already pending"))) {
            setPendingApprovalModalOpen(true)
            toast({
              title: "MetaMask Prompt Pending",
              description: "Click the 🦊 MetaMask extension icon in your browser toolbar to approve the pending request.",
              tone: "warning",
            })
            return false
          }
        }
      }

      // Step 2: Ensure the wallet is actively on Sepolia (Chain ID 11155111 / 0xaa36a7)
      try {
        const currentChainHex = await provider.request({ method: "eth_chainId" })
        if (currentChainHex && currentChainHex.toLowerCase() !== TARGET_CHAIN_HEX.toLowerCase()) {
          toast({
            title: "Switching to Sepolia",
            description: `Switching wallet network to ${targetChain.name}...`,
            tone: "info",
          })
          const switched = await switchNetwork()
          if (!switched) {
            toast({
              title: "Network Switch Required",
              description: `Please switch to ${targetChain.name} (Chain ID ${TARGET_CHAIN_ID}) to import USDC.`,
              tone: "warning",
            })
            return false
          }
        }
      } catch (chainErr) {
        console.warn("Chain ID verification failed before token import:", chainErr)
      }

      // Step 3: Trigger wallet_watchAsset (EIP-747)
      const imageUri = typeof window !== "undefined"
        ? `${window.location.origin}/usdc.svg`
        : "https://cryptologos.cc/logos/usd-coin-usdc-logo.png"

      let wasAdded: boolean | undefined = false
      try {
        wasAdded = await withTimeout(
          provider.request({
            method: "wallet_watchAsset",
            params: {
              type: "ERC20",
              options: {
                address: checksumAddress,
                symbol: "mUSDC",
                decimals: 6,
                image: imageUri,
              },
            },
          }),
          30000,
          "Token import prompt timed out. Please check the MetaMask popup."
        )
      } catch (watchErr: any) {
        // If user cancelled or rejected
        if (watchErr?.code === 4001 || (typeof watchErr?.message === "string" && watchErr.message.includes("User rejected"))) {
          try {
            await navigator.clipboard.writeText(checksumAddress)
          } catch {}
          toast({
            title: "Import Cancelled",
            description: "Token import was cancelled in MetaMask. Contract address copied to clipboard.",
            tone: "info",
          })
          return false
        }

        // If another request is pending in toolbar
        if (watchErr?.code === -32002 || (typeof watchErr?.message === "string" && watchErr.message.includes("already pending"))) {
          setPendingApprovalModalOpen(true)
          toast({
            title: "MetaMask Prompt Pending",
            description: "Click the 🦊 MetaMask icon in your browser toolbar to approve the token import.",
            tone: "warning",
          })
          return false
        }

        // Fallback retry 1: without image (in case external SVG/image triggers CSP or CORS rejection)
        try {
          wasAdded = await provider.request({
            method: "wallet_watchAsset",
            params: {
              type: "ERC20",
              options: {
                address: checksumAddress,
                symbol: "mUSDC",
                decimals: 6,
              },
            },
          })
        } catch (retryErr: any) {
          // Fallback retry 2: with array-wrapped params for non-standard wallet wrappers
          try {
            wasAdded = await provider.request({
              method: "wallet_watchAsset",
              params: [
                {
                  type: "ERC20",
                  options: {
                    address: checksumAddress,
                    symbol: "mUSDC",
                    decimals: 6,
                  },
                },
              ],
            })
          } catch {
            throw retryErr || watchErr
          }
        }
      }

      if (wasAdded || wasAdded === undefined) {
        toast({
          title: "Token Imported Successfully",
          description: "FairWork USDC (6 decimals) added to your MetaMask wallet on Sepolia!",
          tone: "success",
        })
        return true
      } else {
        // When MetaMask returns false without an error, it often means the token is already tracked
        try {
          await navigator.clipboard.writeText(checksumAddress)
        } catch {}
        toast({
          title: "USDC Token Verified",
          description: "Token is already tracked in MetaMask or prompt was dismissed. Contract address copied!",
          tone: "info",
        })
        return true
      }
    } catch (err: any) {
      console.error("Failed to add USDC token to wallet:", err)
      try {
        await navigator.clipboard.writeText(checksumAddress)
      } catch {}

      if (err?.code === 4001 || (typeof err?.message === "string" && err.message.includes("User rejected"))) {
        toast({
          title: "Import Cancelled",
          description: "Token import was cancelled in MetaMask. Contract address copied to clipboard.",
          tone: "info",
        })
      } else if (err?.code === -32002 || (typeof err?.message === "string" && err.message.includes("already pending"))) {
        setPendingApprovalModalOpen(true)
        toast({
          title: "MetaMask Prompt Pending",
          description: "A request is already pending in MetaMask. Click the MetaMask icon in your browser toolbar.",
          tone: "warning",
        })
      } else {
        toast({
          title: "Manual Import Available",
          description: `MetaMask auto-import unavailable (${err?.message || "error"}). Token address copied to clipboard! Paste it into MetaMask > Import tokens.`,
          tone: "warning",
        })
      }
      return false
    }
  }, [connectedAccount, switchNetwork, toast])

  return (
    <WalletContext.Provider
      value={{
        walletState,
        errorState,
        errorMessage,
        connectedAccount,
        chainId,
        isCorrectNetwork,
        verifiedWalletAddress,
        isVerified,
        isConnecting: walletState === "CONNECTING",
        isVerifying: walletState === "VERIFYING",
        isProviderAvailable,
        hasMetaMask,
        noWalletModalOpen,
        openNoWalletModal,
        closeNoWalletModal,
        pendingApprovalModalOpen,
        openPendingApprovalModal,
        closePendingApprovalModal,
        checkPendingApproval,
        redetectProvider,
        connect,
        verify,
        connectAndVerify,
        switchNetwork,
        disconnect,
        unlinkWallet,
        clearError,
        cancelPendingAction,
        addUsdcToWallet,
      }}
    >
      {children}
      <NoWalletModal
        open={noWalletModalOpen}
        onClose={closeNoWalletModal}
        onRedetect={redetectProvider}
      />
      <PendingApprovalModal
        open={pendingApprovalModalOpen}
        onClose={closePendingApprovalModal}
        onCheckApproval={checkPendingApproval}
      />
    </WalletContext.Provider>
  )
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext)
  if (!ctx) {
    return {
      walletState: "DISCONNECTED",
      errorState: null,
      errorMessage: "",
      connectedAccount: null,
      chainId: null,
      isCorrectNetwork: true,
      verifiedWalletAddress: null,
      isVerified: false,
      isConnecting: false,
      isVerifying: false,
      isProviderAvailable: false,
      hasMetaMask: false,
      noWalletModalOpen: false,
      openNoWalletModal: () => {},
      closeNoWalletModal: () => {},
      pendingApprovalModalOpen: false,
      openPendingApprovalModal: () => {},
      closePendingApprovalModal: () => {},
      checkPendingApproval: async () => false,
      redetectProvider: async () => false,
      connect: async () => null,
      verify: async (_providedAccount?: string) => false,
      connectAndVerify: async () => false,
      switchNetwork: async () => false,
      disconnect: () => {},
      unlinkWallet: async () => false,
      clearError: () => {},
      cancelPendingAction: () => {},
      addUsdcToWallet: async () => false,
    }
  }
  return ctx
}
