# FairWork Smart Contract Infrastructure

> **Non-Custodial Milestone Escrow & Dispute Resolution Protocols**  
> Built with Hardhat, Solidity `0.8.28`, and OpenZeppelin Contracts v5.0.

---

## 📜 Contract Suite Overview

The `fairwork-blockchain` sub-repository houses the immutable on-chain escrow logic for the FairWork decentralized freelancing platform:

| Contract | Purpose | Standards & Guards |
| :--- | :--- | :--- |
| **`EscrowContract.sol`** | Governs multi-milestone escrow deposits, deliverable releases, client refunds, and dispute locking. | `Ownable`, `Pausable`, `ReentrancyGuard`, `SafeERC20` |
| **`DisputeContract.sol`** | Manages arbitration workflows for contested milestones and authorized fund reallocation. | `onlyDisputeContract` operational boundary |
| **`ReputationContract.sol`** | Records on-chain freelancer performance and verifiable completion history. | Verifiable reputation scoring ledger |
| **`test/MockERC20.sol`** | ERC-20 testnet stablecoin simulating USDC for local integration and staging verification. | 6-decimal scaling ($1\text{ USDC} = 1{,}000{,}000\text{ units}$) |

---

## 🛠️ Build & Compilation

### Prerequisites
- Node.js `v20+` or `v24 LTS`
- Dependencies installed via `npm install`

### Compile Contracts
```bash
npx hardhat compile
```
*Solidity profile: `0.8.28`, Optimizer enabled with `200` runs.*

---

## 🧪 Testing

Execute test suites via Hardhat and Node.js native test runner:

```bash
npx hardhat test
```

---

## 🚀 Deployment

### Deploy to Sepolia Testnet

1. Ensure `.env` is configured with your RPC URL and deployer private key:
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key
SEPOLIA_PRIVATE_KEY=your-hex-private-key-without-0x
```

2. Run the deployment script:
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

3. Note the deployed contract address and configure:
- `fairwork-backend/.env` -> `ESCROW_CONTRACT_ADDRESS`
- `fairwork-frontend/.env` -> `VITE_ESCROW_CONTRACT_ADDRESS`

---

## 🔒 Security Architecture Invariants

1. **SafeERC20 Compliance**: All token interactions utilize OpenZeppelin's `SafeERC20` wrapper (`safeTransfer`, `safeTransferFrom`) to guard against non-standard ERC-20 implementations that do not revert on failure.
2. **Reentrancy Protection**: Financial functions (`fund`, `releaseMilestone`, `refund`) are guarded by `nonReentrant` modifiers.
3. **Emergency Circuit Breaker**: The contract owner can invoke `pause()` / `unpause()` in the event of an identified vulnerability or protocol upgrade.
