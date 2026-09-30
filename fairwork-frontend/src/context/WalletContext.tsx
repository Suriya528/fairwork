import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { createWalletClient, custom } from "viem"
import { useAuth } from "./AuthContext"
import { useToast } from "@/components/ui/Toast"
import { getWalletNonce, verifyWallet as apiVerifyWallet } from "@/services/authApi"
import { NoWalletModal } from "@/components/wallet/NoWalletModal"
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
  redetectProvider: () => Promise<boolean>
  connect: () => Promise<string | null>
  verify: (providedAccount?: string) => Promise<boolean>
  connectAndVerify: () => Promise<boolean>
  switchNetwork: () => Promise<boolean>
  disconnect: () => void
  clearError: () => void
  cancelPendingAction: () => void
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
  timeoutMs = 35000,
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
  const { user, token, updateWallet } = useAuth()
  const { toast } = useToast()

  const [walletState, setWalletState] = useState<WalletState>("DISCONNECTED")
  const [errorState, setErrorState] = useState<WalletErrorState>(null)
  const [errorMessage, setErrorMessage] = useState("")

  const [connectedAccount, setConnectedAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)

  const [noWalletModalOpen, setNoWalletModalOpen] = useState(false)
  const [isProviderAvailable, setIsProviderAvailable] = useState<boolean>(() => Boolean(getInjectedProvider()))
  const [hasMetaMask, setHasMetaMask] = useState<boolean>(() => Boolean(getInjectedProvider()?.isMetaMask))

  const verifiedWalletAddress = user?.walletAddress ? user.walletAddress.toLowerCase() : null
  const verifiedWalletAddressRef = useRef(verifiedWalletAddress)
  verifiedWalletAddressRef.current = verifiedWalletAddress

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

  const clearError = useCallback(() => {
    setErrorState(null)
    setErrorMessage("")
  }, [])

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

  // Auto-detect when MetaMask extension popup is closed or dismissed without approving
  useEffect(() => {
    if (typeof window === "undefined") return

    let focusTimer: ReturnType<typeof setTimeout>

    const handleWindowFocus = () => {
      // If we are currently CONNECTING or VERIFYING when the window regains focus:
      if (walletState === "CONNECTING" || walletState === "VERIFYING") {
        clearTimeout(focusTimer)
        focusTimer = setTimeout(async () => {
          try {
            const provider = getInjectedProvider()
            if (!provider) return

            const currentAccounts = await provider.request({ method: "eth_accounts" })
            if (Array.isArray(currentAccounts) && currentAccounts.length > 0) {
              const acc = currentAccounts[0].toLowerCase()
              setConnectedAccount(acc)
              const vAddr = verifiedWalletAddressRef.current
              setWalletState(vAddr && acc === vAddr ? "VERIFIED" : "CONNECTED")
              clearError()
            } else if (walletState === "CONNECTING") {
              // The user focused back on the tab, but no accounts were authorized.
              // MetaMask popup was closed or dismissed without approving.
              setWalletState("DISCONNECTED")
              setErrorState("USER_REJECTED")
              setErrorMessage("Wallet prompt was closed or cancelled in MetaMask. Click 'Connect Wallet' to try again.")
            } else if (walletState === "VERIFYING") {
              // The user focused back on the tab, but verification was not completed.
              setWalletState(connectedAccount ? "CONNECTED" : "DISCONNECTED")
              setErrorState("USER_REJECTED")
              setErrorMessage("Signature request was closed or cancelled in MetaMask. Click 'Sign EIP-712 Verification' to try again.")
            }
          } catch {
            if (walletState === "CONNECTING") {
              setWalletState("DISCONNECTED")
            }
          }
        }, 1200)
      }
    }

    window.addEventListener("focus", handleWindowFocus)
    return () => {
      clearTimeout(focusTimer)
      window.removeEventListener("focus", handleWindowFocus)
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
            35000,
            "Wallet connection request timed out or was closed in MetaMask."
          )
        } catch (reqErr: any) {
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
        setErrorMessage("A connection prompt is already pending in MetaMask. Please click the MetaMask extension icon in your browser toolbar to approve it.")
        toast({
          title: "MetaMask Prompt Pending",
          description: "Please click on the MetaMask extension icon in your browser toolbar to approve the connection.",
          tone: "warning",
        })

        // Poll eth_accounts in background for up to 15s to auto-detect approval
        let pollCount = 0
        const pollInterval = setInterval(async () => {
          pollCount++
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
          if (pollCount >= 15) {
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
      setWalletState("DISCONNECTED")
      return null
    }
  }, [clearError, switchNetwork, toast, verifiedWalletAddress])

  // Step 3: Cryptographic EIP-712 Ownership Verification & Backend Link
  const verify = useCallback(async (providedAccount?: string): Promise<boolean> => {
    clearError()

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
      if (!acc) return false
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
        45000,
        "EIP-712 signature request timed out or was closed in MetaMask."
      )

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

  // Explicitly cancel any pending connect / verify UI loading state
  const cancelPendingAction = useCallback(() => {
    setWalletState(connectedAccount ? "CONNECTED" : "DISCONNECTED")
    setErrorState(null)
    setErrorMessage("")
  }, [connectedAccount])

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
        redetectProvider,
        connect,
        verify,
        connectAndVerify,
        switchNetwork,
        disconnect,
        clearError,
        cancelPendingAction,
      }}
    >
      {children}
      <NoWalletModal
        open={noWalletModalOpen}
        onClose={closeNoWalletModal}
        onRedetect={redetectProvider}
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
      redetectProvider: async () => false,
      connect: async () => null,
      verify: async (_providedAccount?: string) => false,
      connectAndVerify: async () => false,
      switchNetwork: async () => false,
      disconnect: () => {},
      clearError: () => {},
      cancelPendingAction: () => {},
    }
  }
  return ctx
}
