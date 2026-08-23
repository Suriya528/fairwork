import {
  FiAlertTriangle,
  FiCheckCircle,
  FiDownload,
  FiExternalLink,
  FiLock,
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
    openNoWalletModal,
    verify,
    connectAndVerify,
    switchNetwork,
    disconnect,
    clearError,
  } = useWallet()

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
            <button
              type="button"
              onClick={clearError}
              className="text-danger hover:underline text-[11px] font-medium shrink-0 ml-2"
            >
              Dismiss
            </button>
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
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={openNoWalletModal}
                  leftIcon={<FiShield className="h-3.5 w-3.5" />}
                >
                  Connect Wallet
                </Button>
              </>
            ) : !connectedAccount ? (
              <Button
                size="sm"
                variant="primary"
                loading={isConnecting || isVerifying}
                onClick={connectAndVerify}
                leftIcon={<FiShield className="h-4 w-4" />}
              >
                Connect &amp; Verify Wallet
              </Button>
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
              <Button
                size="sm"
                variant="primary"
                loading={isVerifying}
                onClick={verify}
                leftIcon={<FiLock className="h-4 w-4" />}
              >
                Sign EIP-712 Verification
              </Button>
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
