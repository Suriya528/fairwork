import { useState } from "react"
import {
  FiAlertTriangle,
  FiCheck,
  FiCheckCircle,
  FiCopy,
  FiDownload,
  FiExternalLink,
  FiLock,
  FiPlus,
  FiRefreshCw,
  FiShield,
  FiShieldOff,
} from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { WalletAddress } from "@/components/common/WalletAddress"
import { useWallet, OFFICIAL_METAMASK_INSTALL_URL } from "@/context/WalletContext"

export function Web3WalletCard({
  title = "Web3 Wallet Ownership & Connection",
  description = "Connect your Web3 wallet and verify cryptographically with an EIP-712 signature to unlock escrow funding and payouts.",
}: {
  title?: string
  description?: string
}) {
  const {
    errorState,
    errorMessage,
    connectedAccount,
    isCorrectNetwork,
    verifiedWalletAddress,
    isVerified,
    isConnecting,
    isVerifying,
    isProviderAvailable,
    verify,
    connectAndVerify,
    switchNetwork,
    disconnect,
    clearError,
    cancelPendingAction,
    addUsdcToWallet,
  } = useWallet()

  const [copied, setCopied] = useState(false)
  const [addingToken, setAddingToken] = useState(false)

  const usdcAddress = (
    import.meta.env.VITE_USDC_ADDRESS ||
    import.meta.env.VITE_TOKEN_ADDRESS ||
    "0xf21bdf6737a3009359f9ec1fa515e6d74702f575"
  ).trim()

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(usdcAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore clipboard error
    }
  }

  const handleAddToken = async () => {
    setAddingToken(true)
    try {
      await addUsdcToWallet()
    } finally {
      setAddingToken(false)
    }
  }

  const activeAddress = connectedAccount || verifiedWalletAddress

  return (
    <Card className="border border-border bg-surface shadow-md transition-all">
      <CardHeader className="flex flex-col gap-1.5 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <FiShield className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>

          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {isVerified ? (
              <Badge tone="success" className="flex items-center gap-1">
                <FiCheckCircle className="h-3 w-3" />
                Wallet Verified ✓
              </Badge>
            ) : connectedAccount ? (
              <Badge tone="warning" className="flex items-center gap-1">
                <FiShieldOff className="h-3 w-3" />
                Verification Required
              </Badge>
            ) : !isProviderAvailable ? (
              <Badge tone="neutral" className="flex items-center gap-1">
                <FiAlertTriangle className="h-3 w-3 text-warning" />
                Not Detected
              </Badge>
            ) : (
              <Badge tone="neutral">Not Connected</Badge>
            )}

            {connectedAccount && (
              isCorrectNetwork ? (
                <Badge tone="info">Sepolia (11155111)</Badge>
              ) : (
                <Badge tone="danger" className="flex items-center gap-1">
                  <FiAlertTriangle className="h-3 w-3" />
                  Wrong Network
                </Badge>
              )
            )}
          </div>
        </div>

        <CardDescription className="text-xs text-muted">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-2">
        {/* Error Alert Banner */}
        {errorMessage && (
          <div
            role="alert"
            className="flex items-start justify-between rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs text-danger"
          >
            <div className="flex items-start gap-2.5">
              <FiAlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold uppercase tracking-wider text-[11px]">
                  {errorState === "WRONG_NETWORK"
                    ? "Network Error"
                    : errorState === "WALLET_ALREADY_LINKED"
                    ? "Wallet Conflict"
                    : errorState === "USER_REJECTED"
                    ? "Action Cancelled"
                    : errorState === "PROVIDER_UNAVAILABLE"
                    ? "Wallet Not Detected"
                    : "Wallet Notice"}
                </p>
                <p>{errorMessage}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              {errorMessage.includes("already pending") && (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rounded-lg bg-danger/20 hover:bg-danger/30 text-rose-200 px-2 py-1 text-[11px] font-semibold border border-danger/30 cursor-pointer"
                  title="Reload tab to clear pending MetaMask connection request"
                >
                  Reload Tab to Reset
                </button>
              )}
              <button
                type="button"
                onClick={clearError}
                className="text-danger hover:underline text-[11px] font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Active Address Box */}
        <div className="rounded-xl border border-border bg-base p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-subtle">
              {isVerified
                ? "Linked Verified Address"
                : connectedAccount
                ? "Connected Account (Unverified)"
                : "Web3 Address"}
            </span>

            {activeAddress ? (
              <div className="flex items-center gap-2">
                <WalletAddress address={activeAddress} chars={8} className="text-sm font-mono font-bold text-foreground" />
                <a
                  href={`https://sepolia.etherscan.io/address/${activeAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded p-1 text-subtle hover:bg-elevated hover:text-primary transition-colors"
                  title="View on Etherscan"
                >
                  <FiExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            ) : (
              <span className="text-xs text-muted">
                {!isProviderAvailable
                  ? "No compatible Web3 browser wallet detected."
                  : "No Web3 wallet connected"}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {!isProviderAvailable ? (
              <>
                <a
                  href={OFFICIAL_METAMASK_INSTALL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90"
                >
                  <FiDownload className="h-3.5 w-3.5" />
                  Install MetaMask
                  <FiExternalLink className="h-3 w-3" />
                </a>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={isConnecting || isVerifying}
                    onClick={connectAndVerify}
                    leftIcon={<FiShield className="h-3.5 w-3.5" />}
                  >
                    Connect Wallet
                  </Button>
                  {(isConnecting || isVerifying) && (
                    <button
                      type="button"
                      onClick={cancelPendingAction}
                      className="text-xs text-muted hover:text-foreground underline px-1 py-1 cursor-pointer"
                      title="Cancel pending wallet request"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </>
            ) : !connectedAccount ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  loading={isConnecting || isVerifying}
                  onClick={connectAndVerify}
                  leftIcon={<FiShield className="h-4 w-4 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6" />}
                  className="cursor-pointer shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 ease-out"
                >
                  Connect &amp; Verify Wallet
                </Button>
                {(isConnecting || isVerifying) && (
                  <button
                    type="button"
                    onClick={cancelPendingAction}
                    className="text-xs text-muted hover:text-foreground underline px-1 py-1 cursor-pointer"
                    title="Cancel pending wallet request"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ) : !isCorrectNetwork ? (
              <Button
                size="sm"
                variant="outline"
                onClick={switchNetwork}
                leftIcon={<FiRefreshCw className="h-4 w-4" />}
              >
                Switch to Sepolia
              </Button>
            ) : !isVerified ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  loading={isVerifying}
                  onClick={() => verify()}
                  leftIcon={<FiLock className="h-4 w-4" />}
                >
                  Sign EIP-712 Verification
                </Button>
                {isVerifying && (
                  <button
                    type="button"
                    onClick={cancelPendingAction}
                    className="text-xs text-muted hover:text-foreground underline px-1 py-1 cursor-pointer"
                    title="Cancel pending verification"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={disconnect}
              >
                Disconnect
              </Button>
            )}
          </div>
        </div>

        {/* FairWork Escrow Token (USDC) Helper Card */}
        <div className="rounded-xl border border-border/80 bg-base/60 p-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-sm border border-blue-500/20">
                $
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">FairWork Escrow Token (USDC)</span>
                  <Badge tone="info" className="text-[10px] py-0 px-1.5 font-mono">Sepolia Testnet</Badge>
                  <Badge tone="neutral" className="text-[10px] py-0 px-1.5">6 Decimals</Badge>
                </div>
                <p className="text-[11px] text-muted">
                  Required for project escrow funding, milestone deposits, and payout balances.
                </p>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              loading={addingToken}
              onClick={handleAddToken}
              leftIcon={<FiPlus className="h-3.5 w-3.5 text-blue-500" />}
              className="text-xs shrink-0 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 cursor-pointer shadow-xs"
              title="Trigger MetaMask to automatically import this token"
            >
              Add USDC to MetaMask
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-border/60 text-xs">
            <div className="flex items-center gap-2 font-mono text-[11px] text-subtle">
              <span className="text-muted">Contract:</span>
              <span className="font-semibold text-foreground select-all">{usdcAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyAddress}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-hover hover:bg-elevated text-[11px] font-medium text-foreground border border-border/60 transition-colors cursor-pointer"
                title="Copy token contract address"
              >
                {copied ? (
                  <>
                    <FiCheck className="h-3 w-3 text-emerald-500" />
                    <span className="text-emerald-500 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <FiCopy className="h-3 w-3 text-muted" />
                    <span>Copy Address</span>
                  </>
                )}
              </button>
              <a
                href={`https://sepolia.etherscan.io/token/${usdcAddress}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-primary hover:underline hover:bg-primary/10 transition-colors"
                title="View on Etherscan"
              >
                <span>Etherscan</span>
                <FiExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Explanatory Footer Text */}
        <div className="text-[11px] text-subtle space-y-1">
          <p>
            • <strong>Connected:</strong> Your browser wallet is active on this device.
          </p>
          <p>
            • <strong>Verified:</strong> FairWork backend cryptographically verified your EIP-712 signature against a one-time challenge nonce.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
