import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { createWalletClient, custom } from "viem"
import { sepolia } from "viem/chains"
import { useAuth } from "./AuthContext"
import { getWalletNonce, verifyWallet as apiVerifyWallet } from "@/services/authApi"

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
  connect: () => Promise<string | null>
  verify: () => Promise<boolean>
  connectAndVerify: () => Promise<boolean>
  switchNetwork: () => Promise<boolean>
  disconnect: () => void
  clearError: () => void
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined)

const TARGET_CHAIN_ID = sepolia.id // 11155111
const TARGET_CHAIN_HEX = `0x${TARGET_CHAIN_ID.toString(16)}`

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user, token, updateWallet } = useAuth()

  const [walletState, setWalletState] = useState<WalletState>("DISCONNECTED")
  const [errorState, setErrorState] = useState<WalletErrorState>(null)
  const [errorMessage, setErrorMessage] = useState("")

  const [connectedAccount, setConnectedAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)

  const verifiedWalletAddress = user?.walletAddress ? user.walletAddress.toLowerCase() : null
  const isCorrectNetwork = chainId === TARGET_CHAIN_ID
  const isVerified = Boolean(
    verifiedWalletAddress &&
      connectedAccount &&
      connectedAccount.toLowerCase() === verifiedWalletAddress,
  )

  const clearError = useCallback(() => {
    setErrorState(null)
    setErrorMessage("")
  }, [])

  // Auto-detect existing connected accounts & Listen for MetaMask changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum || typeof window.ethereum.request !== "function") return

    const provider = window.ethereum

    try {
      provider
        .request({ method: "eth_accounts" })
        .then((res: unknown) => {
          const accounts = res as string[]
          if (accounts && accounts.length > 0) {
            setConnectedAccount(accounts[0].toLowerCase())
            setWalletState(
              verifiedWalletAddress && accounts[0].toLowerCase() === verifiedWalletAddress
                ? "VERIFIED"
                : "CONNECTED",
            )
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

    // Event handler: Account switched in wallet
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts && accounts.length > 0) {
        const newAcc = accounts[0].toLowerCase()
        setConnectedAccount(newAcc)
        setWalletState(
          verifiedWalletAddress && newAcc === verifiedWalletAddress
            ? "VERIFIED"
            : "CONNECTED",
        )
      } else {
        setConnectedAccount(null)
        setWalletState("DISCONNECTED")
      }
    }

    // Event handler: Network/Chain switched in wallet
    const handleChainChanged = (hexChainId: string) => {
      const parsed = parseInt(hexChainId, 16)
      setChainId(parsed)
      if (parsed !== TARGET_CHAIN_ID) {
        setErrorState("WRONG_NETWORK")
        setErrorMessage("Please switch your Web3 wallet to the Sepolia test network.")
      } else {
        setErrorState((prev) => (prev === "WRONG_NETWORK" ? null : prev))
        if (errorState === "WRONG_NETWORK") setErrorMessage("")
      }
    }

    provider.on("accountsChanged", handleAccountsChanged)
    provider.on("chainChanged", handleChainChanged)

    return () => {
      if (provider.removeListener) {
        provider.removeListener("accountsChanged", handleAccountsChanged)
        provider.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [verifiedWalletAddress, errorState])

  // Sync walletState with user.walletAddress when user updates
  useEffect(() => {
    if (connectedAccount && verifiedWalletAddress && connectedAccount.toLowerCase() === verifiedWalletAddress) {
      setWalletState("VERIFIED")
    } else if (connectedAccount) {
      setWalletState("CONNECTED")
    } else {
      setWalletState("DISCONNECTED")
    }
  }, [connectedAccount, verifiedWalletAddress])

  // Step 1: Connect Wallet Account
  const connect = useCallback(async (): Promise<string | null> => {
    clearError()

    if (typeof window === "undefined" || !window.ethereum) {
      setErrorState("PROVIDER_UNAVAILABLE")
      setErrorMessage("No Web3 wallet detected. Please install MetaMask or another compatible browser wallet.")
      return null
    }

    setWalletState("CONNECTING")

    try {
      const wallet = createWalletClient({ chain: sepolia, transport: custom(window.ethereum) })
      const [account] = await wallet.requestAddresses()
      const currentChain = await wallet.getChainId()

      const normalizedAccount = account.toLowerCase()
      setConnectedAccount(normalizedAccount)
      setChainId(currentChain)

      if (currentChain !== TARGET_CHAIN_ID) {
        setErrorState("WRONG_NETWORK")
        setErrorMessage("Connected to incorrect network. Please switch to Sepolia.")
        try {
          await wallet.switchChain({ id: TARGET_CHAIN_ID })
          setChainId(TARGET_CHAIN_ID)
          setErrorState(null)
          setErrorMessage("")
        } catch {
          // Switch prompt failed or was dismissed
        }
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
      } else {
        setErrorState("PROVIDER_UNAVAILABLE")
        setErrorMessage(msg)
      }
      setWalletState("DISCONNECTED")
      return null
    }
  }, [clearError, verifiedWalletAddress])

  // Step 2: Switch Network to Sepolia
  const switchNetwork = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !window.ethereum) return false
    clearError()

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: TARGET_CHAIN_HEX }],
      })
      setChainId(TARGET_CHAIN_ID)
      setErrorState(null)
      setErrorMessage("")
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network switch failed"
      setErrorState("WRONG_NETWORK")
      setErrorMessage(msg.includes("rejected") ? "Network switch request was cancelled." : msg)
      return false
    }
  }, [clearError])

  // Step 3: Cryptographic EIP-712 Ownership Verification & Backend Link
  const verify = useCallback(async (): Promise<boolean> => {
    clearError()

    if (!token) {
      setErrorState("VERIFICATION_FAILED")
      setErrorMessage("You must be logged in to FairWork to verify a wallet.")
      return false
    }

    if (!connectedAccount) {
      const acc = await connect()
      if (!acc) return false
    }

    setWalletState("VERIFYING")

    try {
      const wallet = createWalletClient({ chain: sepolia, transport: custom(window.ethereum!) })
      const currentChain = await wallet.getChainId()

      if (currentChain !== TARGET_CHAIN_ID) {
        try {
          await wallet.switchChain({ id: TARGET_CHAIN_ID })
          setChainId(TARGET_CHAIN_ID)
        } catch {
          setErrorState("WRONG_NETWORK")
          setErrorMessage("Please switch to the Sepolia test network to complete verification.")
          setWalletState("CONNECTED")
          return false
        }
      }

      // Fetch one-time backend challenge nonce
      const challenge = await getWalletNonce(token)

      // Sign EIP-712 typed data
      const signature = await wallet.signTypedData({
        account: connectedAccount as `0x${string}`,
        domain: challenge.domain,
        types: challenge.types,
        primaryType: challenge.primaryType,
        message: {
          walletAddress: connectedAccount,
          nonce: challenge.nonce,
          purpose: challenge.purpose,
        },
      })

      // Submit cryptographic proof to backend
      const verifiedUser = await apiVerifyWallet(connectedAccount!, challenge.nonce, signature, token)

      // Update local auth context
      await updateWallet(verifiedUser.walletAddress)

      setWalletState("VERIFIED")
      setErrorState(null)
      setErrorMessage("Wallet ownership verified successfully!")
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Wallet verification failed"

      if (msg.includes("already associated") || msg.includes("already linked")) {
        setErrorState("WALLET_ALREADY_LINKED")
        setErrorMessage("This wallet address is already linked to another FairWork account.")
      } else if (msg.includes("rejected") || msg.includes("User rejected")) {
        setErrorState("USER_REJECTED")
        setErrorMessage("EIP-712 signature request was cancelled.")
      } else {
        setErrorState("VERIFICATION_FAILED")
        setErrorMessage(msg)
      }

      setWalletState(connectedAccount ? "CONNECTED" : "DISCONNECTED")
      return false
    }
  }, [clearError, connectedAccount, connect, token, updateWallet])

  // Full Seamless Flow: Connect + Verify
  const connectAndVerify = useCallback(async (): Promise<boolean> => {
    const acc = await connect()
    if (!acc) return false
    return await verify()
  }, [connect, verify])

  // Disconnect Browser Wallet Session
  const disconnect = useCallback(() => {
    setConnectedAccount(null)
    setWalletState("DISCONNECTED")
    clearError()
  }, [clearError])

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
        connect,
        verify,
        connectAndVerify,
        switchNetwork,
        disconnect,
        clearError,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider")
  return ctx
}
