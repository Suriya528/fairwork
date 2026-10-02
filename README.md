# FAIRWORK — Decentralized Web3 Freelance Settlement Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests: 69 Backend + 12 Hardhat](https://img.shields.io/badge/Tests-81%20Passing-brightgreen.svg)](#11-test-suite--verification-matrix-69-backend--12-hardhat-tests)
[![Solidity: 0.8.28](https://img.shields.io/badge/Solidity-0.8.28-blue.svg)](https://soliditylang.org/)
[![Node: 24 LTS](https://img.shields.io/badge/Node.js-24%20LTS-green.svg)](https://nodejs.org/)
[![React: 19](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Network: Ethereum Sepolia](https://img.shields.io/badge/Network-Ethereum%20Sepolia-627eea.svg)](https://sepolia.etherscan.io/)
[![Frontend: Vercel](https://img.shields.io/badge/Frontend-Live%20on%20Vercel-black.svg)](https://fairwork-org.vercel.app)
[![Backend: Render](https://img.shields.io/badge/Backend-Live%20on%20Render-46E3B7.svg)](https://fairwork.onrender.com)

> **Production Architecture Specification & Real-Time Settlement Infrastructure**  
> *FairWork is a high-throughput Web3 freelance marketplace engineered with trustless Solidity escrow contracts (`EscrowContract.sol`), a 5-pillar distributed settlement engine, EIP-712 cryptographic wallet binding, OAuth 2.0 PKCE social authentication, and exclusive US Dollar (USDC) milestone settlement.*

---

## 🌐 Live Deployments & Testnet Links

| Component | Provider | Live URL / Endpoint | Status |
| :--- | :--- | :--- | :---: |
| **Web Application** | **Vercel** | [**https://fairwork-org.vercel.app**](https://fairwork-org.vercel.app) | 🟢 Live |
| **Secondary App Alias** | Vercel | [https://fairwork-frontend-mu.vercel.app](https://fairwork-frontend-mu.vercel.app) | 🟢 Live |
| **Backend API Gateway** | **Render** | [**https://fairwork.onrender.com**](https://fairwork.onrender.com) | 🟢 Active |
| **API Healthcheck** | Render | [`/health`](https://fairwork.onrender.com/health) | `status: "ok"` |
| **Kubernetes / Pod Readiness** | Render | [`/readyz`](https://fairwork.onrender.com/readyz) | DB & Indexer Synced |

### 📜 Deployed Smart Contracts (Ethereum Sepolia Testnet)

All smart contracts have been compiled with Solidity `0.8.28` (optimizer runs: `200`), deployed to Ethereum Sepolia, and verified on public block explorers:

| Contract | Address | Explorer Link | Source Verification |
| :--- | :--- | :--- | :---: |
| **EscrowContract** | `0xc0d1b74a30a82d6fb846e446758a8c2ff391376c` | [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0xc0d1b74a30a82d6fb846e446758a8c2ff391376c) | [Sourcify Verified](https://sourcify.dev/server/repo-ui/11155111/0xc0d1b74a30a82d6fb846e446758a8c2ff391376c) |
| **ReputationContract** | `0xfa25823ccf7343fdfd7fa20a785d996331e66674` | [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0xfa25823ccf7343fdfd7fa20a785d996331e66674) | [Sourcify Verified](https://sourcify.dev/server/repo-ui/11155111/0xfa25823ccf7343fdfd7fa20a785d996331e66674) |
| **DisputeContract** | `0x0423025a6a8c4bbbe1f9ecf0cb5d4542ac5b7193` | [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0x0423025a6a8c4bbbe1f9ecf0cb5d4542ac5b7193) | [Sourcify Verified](https://sourcify.dev/server/repo-ui/11155111/0x0423025a6a8c4bbbe1f9ecf0cb5d4542ac5b7193) |
| **Mock USDC (mUSDC)** | `0xf21bdf6737a3009359f9ec1fa515e6d74702f575` | [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0xf21bdf6737a3009359f9ec1fa515e6d74702f575) | Active (6 decimals) |

---

## 📋 Table of Contents

- [1. Executive Architectural Summary](#1-executive-architectural-summary)
- [2. System Architecture & 5-Pillar Settlement Engine](#2-system-architecture--5-pillar-settlement-engine)
- [3. Implementation & Verification Status Matrix](#3-implementation--verification-status-matrix)
- [4. Financial Invariant & US Dollar Escrow Standard](#4-financial-invariant--us-dollar-escrow-standard)
- [5. Core Security, Hardening & Authentication Protocols](#5-core-security-hardening--authentication-protocols)
- [6. Smart Contract Architecture (Solidity 0.8.28)](#6-smart-contract-architecture-solidity-0828)
- [7. Freelancer GitHub Profile & Activity Integration](#7-freelancer-github-profile--activity-integration)
- [8. Technology Stack & Installed Toolchain](#8-technology-stack--installed-toolchain)
- [9. Complete Directory Structure](#9-complete-directory-structure)
- [10. Getting Started & Installation](#10-getting-started--installation)
- [11. Test Suite & Verification Matrix (69 Backend + 12 Hardhat Tests)](#11-test-suite--verification-matrix-69-backend--12-hardhat-tests)
- [12. Production Deployment Guidelines](#12-production-deployment-guidelines)
- [13. License & Authors](#13-license--authors)

---

## 1. Executive Architectural Summary

FairWork redefines the freelance economy by eliminating centralized custody risk. Client funds and milestone payouts are governed on-chain by non-custodial smart contracts (`EscrowContract.sol`). Off-chain microservices maintain verifiable, zero-trust synchronization with Ethereum state via an epoch-leased fencing protocol, a branch-aware reorg engine, and a transactional outbox pipeline.

```
                           ┌──────────────────────────────────────────┐
                           │          ETH / L2 BLOCKCHAIN             │
                           │   (USDC ERC-20 & EscrowContract.sol)   │
                           └────────────────────┬─────────────────────┘
                                                │
                                       LOGS & STATE EVENTS
                                                │
                                                ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              FAIRWORK DISTRIBUTED NODE POD                                    │
│                                                                                              │
│  ┌───────────────────────┐   ┌───────────────────────┐   ┌────────────────────────────────┐  │
│  │ 1. BLOCKCHAIN LISTENER │──►│ 2. REORG ENGINE       │──►│ 3. LEASE-FENCED TRANSACTION   │  │
│  │    (Topic0 Filter)     │   │    (Ancestor Rollback)│   │    (Snapshot Fencing Guard)    │  │
│  └───────────────────────┘   └───────────────────────┘   └───────────────┬────────────────┘  │
│                                                                          │                   │
│                                                                          ▼                   │
│  ┌───────────────────────┐   ┌───────────────────────┐   ┌────────────────────────────────┐  │
│  │ 5. SOCKET.IO ROOMS    │◄──│ 5. CATCH-UP REST API  │◄──│ 4. TRANSACTIONAL OUTBOX        │  │
│  │    (Best-Effort Live) │   │    (Monotonic Cursor) │   │    (Claim Token Fenced)        │  │
│  └───────────────────────┘   └───────────────────────┘   └────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. System Architecture & 5-Pillar Settlement Engine

The core settlement processor operates under a **5-Pillar Distributed Engine** architecture to guarantee crash-safe, idempotent, and replayable execution:

```
LAYER 1: BLOCKCHAIN TRUTH & REORG ENGINE
RAW RPC LOG ──► TOPIC0 PRE-FILTER ──► ETHERS ABI DECODER ──► CANONICAL BLOCKCHECKPOINT LINK CHECK
                                                                      │
                                                ┌─────────────────────┴─────────────────────┐
                                                ▼                                           ▼
                                      [HASH MATCH / VALID]                        [REORG MISMATCH]
                                                │                                           │
                                     CONFIRMED HEAD CHECK                         BRANCH-AWARE REORG ENGINE
                                 (latestHead - confirmationDepth)                 - Bounded scan (MAX_REORG_DEPTH = 100)
                                                │                                 - Trace orphaned block hashes
                                                │                                 - Scoped ACID Transaction:
                                                │                                   • Mark SettlementEvents ORPHANED
                                                │                                   • Reset Milestone metadata
                                                │                                   • Set OutboxEvent status = CANCELLED
                                                │                                   • Mark Messages ORPHANED_REORGED
                                                │                                   • Execute Fencing Guard Write
                                                │                                   • Rewind SyncState cursor to A
                                                │                                 - Replay logs from A + 1
                                                │                                           │
LAYER 2: ON-CHAIN & FINANCIAL RECONCILIATION    │◄──────────────────────────────────────────┘
ON-CHAIN ESCROW CHECK (client, freelancer, token, funded, completed)
  └─► Validates exact 6-decimal token units == Decimal128 (scale <= 2 via MoneyDomain)
                                │
LAYER 3: ATOMIC FENCED MONGO TRANSACTION
  ├─► Insert SettlementEvent (unique source key + blockHash)
  ├─► Mutate Project.paymentReleased = true & settlementEventId = evt._id
  ├─► Insert OutboxEvent (unique source key)
  └─► FENCING WRITE: SyncState.updateOne WHERE owner==podId && gen==epoch && expiry>now
      REQUIRE modifiedCount === 1 BEFORE COMMIT (w: majority, snapshot isolation)
                                │ COMMIT
                                ▼
LAYER 4: CHECKPOINT ADVANCE & DURABLE DELIVERY
CHECKPOINT ADVANCE ──► OUTBOX WORKER (Claim Fenced) ──► IDEMPOTENT MESSAGE UPSERT ──► SOCKET BROADCAST
                        - Checks SettlementEvent == ACTIVE                      (Best-effort opt)
```

### Key Pillars
1. **Topic0 Event Listener & Ethers ABI Decoder**: Filters EVM logs by `MILESTONE_RELEASED_TOPIC0` signature, parses Hardhat-compiled artifacts via `ethers.Interface`, and validates confirmation depth (`latestHead - confirmationDepth`).
2. **Branch-Aware Reorg Rollback**: Detects chain reorganizations via `BlockCheckpoint` hash verification, traces common ancestor block $A$ up to `MAX_REORG_DEPTH = 100`, and executes a single ACID transaction to revert attributable project milestone metadata, cancel pending outbox events, and flag orphaned messages (`ORPHANED_REORGED`).
3. **Epoch Lease Fencing Protocol**: Protects against race conditions during pod failovers. Transactions enforce `writeConcern: { w: "majority" }` and `readConcern: { level: "snapshot" }` with an atomic fencing write guard (`SyncState.updateOne`) requiring `modifiedCount === 1` before committing financial state.
4. **Transactional Outbox Pipeline**: Decouples financial state changes from external delivery side effects. Outbox workers claim tasks using random UUID `claimTokens` and `lockedUntil` expiration with full-jitter exponential backoff.
5. **Durable Message Truth & Monotonic Catch-Up REST API**: The database `Message` collection is the single source of truth (`systemEventKey = sourceEventKey`). Connected clients receive live Socket.IO events, while reconnecting clients invoke the monotonic cursor catch-up REST API (`GET /api/projects/:id/messages?afterCreatedAt=...&afterId=...`, sorted by `createdAt ASC, _id ASC`).

---

## 3. Implementation & Verification Status Matrix

All platform components are implemented in production code and verified through automated test suites:

| Component | Status | Implementation / Verification Evidence |
| :--- | :---: | :--- |
| **Escrow Smart Contracts** | ✅ **Verified** | `EscrowContract.sol` (Solidity 0.8.28, OpenZeppelin 5.0, SafeERC20, ReentrancyGuard, 48h timelock). |
| **Dispute & Arbitration Engine** | ✅ **Verified** | `DisputeContract.sol` single-key arbitration boundary with mutual evidence submission. |
| **5-Pillar Settlement Processor** | ✅ **Verified** | 24-scenario test suite passing: epoch lease fencing, reorg rollback, ABI checksum, outbox races. |
| **OAuth 2.0 PKCE & Role Tokens** | ✅ **Verified** | PKCE code verifiers, state JWTs, signed `roleSelectionToken`, unit test suite passing 10/10. |
| **GitHub Profile & Contribution Heatmap** | ✅ **Verified** | AES-256-GCM + HKDF encryption, GraphQL viewer fetch, 52-week heatmap, passing 4/4 tests. |
| **Web3 Wallet Binding (EIP-712)** | ✅ **Verified** | Cryptographic signature verification, EIP-712 domain binding, `Web3WalletCard` frontend component. |
| **Security & Reverse Proxy Hardening** | ✅ **Verified** | `trust proxy` resolution, crash traps (`unhandledRejection`), rate limiting, error masking. |
| **Operator Alerting & Circuit Breaker** | ✅ **Verified** | Webhook dispatcher (`alertNotifier.js`), 5-failure indexer halt, runbook documented. |
| **US Dollar Currency Settlement** | ✅ **Verified** | System-wide fixed-budget USD standard, Decimal128 scale validation, zero floating-point math. |

---

## 4. Financial Invariant & US Dollar Escrow Standard

FairWork operates exclusively on a **US Dollar (USD / USDC) milestone escrow standard**:

1. **Fixed-Budget Milestones Only**: Projects are partitioned into discrete, deliverable-backed milestones. The platform schema does not support unverified "hourly rates".
2. **Strict Currency Invariant**: All commitments, deposits, and releases occur strictly in US Dollars. Dual-currency display estimation (e.g. INR) has been formally purged to avoid exchange rate divergence between UI display and on-chain escrow locks.
3. **Exact Decimal128 Representation**: Off-chain balances, milestone allocations, and fee calculations are stored in MongoDB using `Decimal128` (via `MoneyDomain`) with a scale constraint $\le 2$. Floating-point arithmetic is strictly prohibited in settlement routines.
4. **Token Scaling Invariant**: On-chain, USDC uses 6 decimals ($1\text{ USD} = 1{,}000{,}000\text{ units}$). Conversion between `Decimal128` and EVM integer units is validated during reconciliation startup.
5. **48-Hour Refund Timelock**: Invariant protection prevents sudden capital drains. When a client requests a refund, funds enter a 48-hour challenge timelock window allowing freelancers to review deliverables or file for arbitrator review before capital withdrawal.

---

## 5. Core Security, Hardening & Authentication Protocols

### A. Reverse Proxy & Rate Limiting Hardening
- **Trust Proxy Configuration**: In production (`NODE_ENV === "production"`), Express is configured with `app.set("trust proxy", 1)`, ensuring client IPs are accurately resolved behind Nginx, Cloudflare, or Docker reverse proxies for rate limiting.
- **Fail-Closed Auth Rate Limiting**: All sensitive endpoints (`/api/auth/login`, `/api/auth/register`, `/api/auth/resend-verification`, `/api/auth/forgot-password`) enforce strict rate limits backed by Redis fail-closed evaluation in production, with in-memory sliding-windows during development.
- **Process Crash Traps**: `process.on("unhandledRejection")` and `process.on("uncaughtException")` handlers log structured diagnostic metadata and prevent unmonitored node process crashes.
- **Error Masking**: Database exceptions, Mongoose validation internals, and database stack traces are sanitized from all client-facing responses, returning standardized domain constants.
- **Operator Alert Dispatcher**: Immediate notifications sent via webhooks for critical conditions (`INDEXER_HALTED`, `REORG_DEEP`, `DLQ_PERSISTENCE_FAILURE`).

### B. OAuth 2.0 PKCE & Social Authentication
```
          CLIENT BROWSER                         BACKEND OAUTH CONTROLLER                   OAUTH PROVIDER (Google / GitHub)
                │                                           │                                              │
                ├─────── GET /api/auth/google ─────────────►│                                              │
                │                                           ├───── Redirect with PKCE S256 Challenge ─────►│
                │                                           │                                              │
                │◄───────────────────────────── User Consents & Redirects to Callback ──────────────────────┤
                │                                           │                                              │
                ├─────── GET /api/auth/google/callback ────►│                                              │
                │                                           ├────── Code Exchange (code_verifier) ────────►│
                │                                           │◄───── Returns User Identity Profile ─────────┤
                │                                           │
                │                                  [REGISTERED USER?]
                │                                 /                  \
                │                           YES  /                    \  NO (New User)
                │                               /                      \
                │    ISSUES JWT SESSION TOKEN  /                        \ ISSUES SIGNED ROLE SELECTION TOKEN
                │◄────────────────────────────┘                          └─────────────────────────────────►│
```
- **PKCE Code Verification (S256)**: Protects against authorization code interception attacks across Google and GitHub OAuth flows.
- **Signed Role Selection Tokens**: Unregistered social OAuth users receive a 5-minute signed JWT `roleSelectionToken` preventing role forgery or client profile tampering before onboarding completion.
- **Unified `authVerifier`**: Shared verification logic across Express HTTP routes and Socket.IO handshake handlers enforcing `HS256`, `issuer: "fairwork-api"`, `audience: "fairwork-client"`, token expiration, and instant suspension eviction.

---

## 6. Smart Contract Architecture (Solidity 0.8.28)

The blockchain infrastructure is located in `fairwork-blockchain/` and compiled with Hardhat using Solidity `0.8.28` (optimizer: 200 runs):

```text
fairwork-blockchain/contracts/
├── EscrowContract.sol        # Core milestone escrow (Ownable, Pausable, ReentrancyGuard, SafeERC20, 48h Timelock)
├── DisputeContract.sol       # Independent arbitrator dispute locking and allocation
├── ReputationContract.sol    # On-chain freelancer performance and completion scoring
└── test/MockERC20.sol        # Testnet mock USDC token (6 decimals)
```

### Milestone Release Invariant
```solidity
function releaseMilestone(string calldata projectId, uint256 index) external nonReentrant whenNotPaused {
    Escrow storage e = escrows[projectId];
    require(e.client != address(0), "Escrow missing");
    require(msg.sender == e.client, "Only client");
    require(e.isFunded, "Not funded");
    require(!e.isDisputed && !e.isCompleted, "Escrow unavailable");
    require(index < e.milestones.length && !e.milestones[index].released, "Invalid milestone");

    Milestone storage m = e.milestones[index];
    m.released = true;
    e.releasedAmount += m.amount;
    if (e.releasedAmount == e.totalAmount) e.isCompleted = true;

    IERC20(e.token).safeTransfer(e.freelancer, m.amount);
    emit MilestoneReleased(projectId, index, e.freelancer, m.amount);
}
```

---

## 7. Freelancer GitHub Profile & Activity Integration

Freelancers can link their GitHub account to display an authentic open-source contribution graph and language statistics on their public profile:

```text
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │  FREELANCER PROFILE — GITHUB DEVELOPER INTEGRATION                                     │
  │                                                                                        │
  │  ┌────────────────────────┐  ┌────────────────────────┐  ┌──────────────────────────┐  │
  │  │ YEARLY CONTRIBUTIONS   │  │ CURRENT ACTIVE STREAK  │  │ LONGEST COMMIT STREAK    │  │
  │  │        1,428           │  │        18 Days         │  │         42 Days          │  │
  │  └────────────────────────┘  └────────────────────────┘  └──────────────────────────┘  │
  │                                                                                        │
  │  52-WEEK CONTRIBUTION HEATMAP                                                          │
  │  ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■  │
  │  ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■  │
  │                                                                                        │
  │  TOP LANGUAGES:  TypeScript (68%)  │  JavaScript (22%)  │  Solidity (10%)             │
  └────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Encrypted Token Storage (`GithubOAuthCredential.js`)**: Access tokens encrypted with AES-256-GCM using HKDF-SHA256 derived keys (`{ version: 1, keyId: "hkdf-sha256-v1", iv, ciphertext, authTag }`).
- **Stale-While-Revalidate Caching (`GithubActivityCache.js`)**: Serves cached GraphQL activity snapshots instantly (`expiresAt = 1h`), triggering background refresh queries asynchronously.
- **Derived Metrics Algorithm**: A contribution day is defined as a UTC calendar day with $\ge 1$ qualifying commit/PR. Streaks and language distributions are calculated deterministically.

---

## 8. Technology Stack & Installed Toolchain

| Area | Technologies | Version |
| :--- | :--- | :--- |
| **Frontend** | React, TypeScript, Vite, TailwindCSS, Viem, React Router | React 19, TS 5.7, Vite 6, Tailwind v4 |
| **Backend** | Node.js, Express, Socket.IO, MongoDB, Mongoose, ioredis | Node 24 LTS, Express 5.x, Mongoose 8.x |
| **Blockchain** | Solidity, Hardhat 3, OpenZeppelin 5.x, Viem | Solidity 0.8.28, OZ 5.0, Viem v2 |
| **Cloud Hosting** | Vercel (Frontend SPA), Render (API Gateway), MongoDB Atlas | Production Live |
| **Security** | JWT, Bcrypt, AES-256-GCM, HKDF-SHA256, PKCE | Enterprise Grade |

---

## 9. Complete Directory Structure

```text
FAIRWORK/
├── fairwork-backend/               # Node.js API & Settlement Engine
│   ├── src/
│   │   ├── abi/                    # EscrowContract.abi.json & checksum
│   │   ├── config/                 # Environment validation & db connection
│   │   ├── controllers/            # Auth, OAuth, Escrow, Project, User controllers
│   │   ├── middleware/             # JWT auth, rate limiters, admin guards, suspension eviction
│   │   ├── models/                 # User, Project, Escrow, SyncState, OutboxEvent, SettlementEvent
│   │   ├── routes/                 # Express API routers (auth, users, escrow, projects, githubConnect)
│   │   ├── services/               # blockchainListener, leaseManager, reorgEngine, outboxWorker
│   │   ├── utils/                  # authVerifier, alertNotifier, crypto helpers, decimalUtils
│   │   └── index.js                # Express gateway, Socket.IO, healthcheck & readyz endpoints
│   ├── test/                       # Node.js native test runner test suites (69 scenarios)
│   │   ├── authorization.test.js   # Authorization test suite (14 scenarios)
│   │   ├── github.test.js          # GitHub integration test suite (4 scenarios)
│   │   ├── integration.test.js     # Integration gate test suite (14 scenarios)
│   │   ├── oauth.test.js           # OAuth security test suite (10 scenarios)
│   │   └── settlement.test.js      # Settlement test suite (24 scenarios)
│   └── package.json
│
├── fairwork-frontend/              # React 19 Client Web Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/               # LoginForm, RegisterForm, SocialAuth
│   │   │   ├── common/             # Logo, PageHeader, FlagIcons
│   │   │   ├── landing/            # HeroSection, EscrowFlowBlueprint, PlatformFeatures, VerifiedProtocolShowcase, Footer
│   │   │   ├── layout/             # Topbar, AccountMenu, Sidebar
│   │   │   ├── profile/            # GithubContributionHeatmap, Portfolio
│   │   │   ├── ui/                 # Accessible Card, Button, Input, Modal, Badge primitives
│   │   │   └── wallet/             # Web3WalletCard (EIP-712 binding)
│   │   ├── context/                # AuthContext, CurrencyContext, WalletContext
│   │   ├── pages/                  # LandingPage, ProjectsPage, DashboardPage, WalletPage
│   │   ├── services/               # authApi, userApi, projectsApi, escrowApi, web3
│   │   ├── styles/                 # globals.css (Tailwind v4 tokens)
│   │   ├── App.tsx                 # Full application route tree
│   │   └── main.tsx                # Client entry point
│   ├── vercel.json                 # SPA rewrite rules for single-page routing
│   └── package.json
│
├── fairwork-blockchain/            # Solidity Smart Contract Suite
│   ├── contracts/
│   │   ├── EscrowContract.sol      # Non-custodial multi-milestone escrow contract
│   │   ├── DisputeContract.sol     # Arbitrator dispute resolution contract
│   │   ├── ReputationContract.sol  # On-chain reputation ledger contract
│   │   └── test/MockERC20.sol      # Test token for local and staging verification
│   ├── scripts/
│   │   ├── deploy.ts               # Deployment script for Sepolia and mainnets
│   │   ├── mintTokensToUser.ts     # Faucet script for test mUSDC
│   │   └── executeRealTransactions.ts # End-to-end on-chain rehearsal script
│   ├── test/                       # Hardhat test suites (12 passing tests)
│   ├── hardhat.config.ts           # Hardhat 3 configuration (Solidity 0.8.28, optimizer: 200)
│   └── package.json
│
├── docs/
│   └── INCIDENT_RUNBOOK.md         # Production operator procedures & alert responses
└── README.md
```

---

## 10. Getting Started & Installation

### Prerequisites
- **Node.js**: `v20.0.0` or higher (`v24.x LTS` recommended)
- **MongoDB**: `v6.0` or higher (Replica set or MongoDB Atlas required for ACID snapshot transactions)
- **Git**: `v2.30` or higher
- **MetaMask / EVM Wallet**: Configured for **Ethereum Sepolia Testnet**

### 1. Clone Repository & Install Dependencies

```bash
git clone https://github.com/Suriya528/fairwork.git
cd FAIRWORK

# Backend
cd fairwork-backend && npm install

# Frontend
cd ../fairwork-frontend && npm install

# Blockchain
cd ../fairwork-blockchain && npm install
```

### 2. Environment Configuration

#### Backend (`fairwork-backend/.env`)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/users
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
CLIENT_URL=https://fairwork-org.vercel.app,http://localhost:5173
BACKEND_URL=https://fairwork.onrender.com

# Sepolia Blockchain Parameters
CHAIN_ID=11155111
START_BLOCK=11808800
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key
ESCROW_CONTRACT_ADDRESS=0xc0d1b74a30a82d6fb846e446758a8c2ff391376c
CANONICAL_ESCROW_ADDRESS=0xc0d1b74a30a82d6fb846e446758a8c2ff391376c
USDC_CONTRACT_ADDRESS=0xf21bdf6737a3009359f9ec1fa515e6d74702f575
REPUTATION_CONTRACT_ADDRESS=0xfa25823ccf7343fdfd7fa20a785d996331e66674
DISPUTE_CONTRACT_ADDRESS=0x0423025a6a8c4bbbe1f9ecf0cb5d4542ac5b7193
EXPECTED_ESCROW_BYTECODE_HASH=5e8141742fa5c5a42d897b88e6c08c3038ebc42ea65dec2a556df152ffb490ad
```

#### Frontend (`fairwork-frontend/.env`)
```env
VITE_API_URL=https://fairwork.onrender.com/api
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key
VITE_ESCROW_CONTRACT_ADDRESS=0xc0d1b74a30a82d6fb846e446758a8c2ff391376c
VITE_DISPUTE_CONTRACT_ADDRESS=0x0423025a6a8c4bbbe1f9ecf0cb5d4542ac5b7193
VITE_USDC_ADDRESS=0xf21bdf6737a3009359f9ec1fa515e6d74702f575
VITE_REPUTATION_ADDRESS=0xfa25823ccf7343fdfd7fa20a785d996331e66674
```

### 3. Launch Development Servers

```bash
# Terminal 1: Backend API & Real-time Event Indexer
cd fairwork-backend && npm run dev

# Terminal 2: Frontend Web Application
cd fairwork-frontend && npm run dev
```

---

## 11. Test Suite & Verification Matrix (69 Backend + 12 Hardhat Tests)

The backend features an automated test suite executed via the native Node.js test runner (`node --test`). All **69 backend scenarios** and **12 Hardhat contract tests** pass with 0 failures:

```bash
cd fairwork-backend
npm test
```

```text
▶ Authorization Test Suite — 14 Production Scenarios
  ✔ Scenario 25: Message reconnect catch-up (cursor pagination, orphaned exclusion)
  ✔ Scenario 26: Equal-timestamp cursor pagination correctness
  ✔ Scenario 27: Suspended socket disconnect
  ✔ Scenario 28: REST project membership enforcement (non-member -> 403)
  ✔ Scenario 29: REST project completion authorization (non-owner + unsettled -> 403/409)
  ✔ Scenario 30: OAuth suspension protection
  ✔ Scenario 31: OAuth provider state isolation (separate cookies)
  ✔ Scenario 32: GitHub login PKCE verifier mismatch rejection
  ✔ Scenario 33: URL scheme rejection (javascript:, data:, credentials in URL)
  ✔ Scenario 34: Token verification preserves sessionId and tokenVersion claims
  ✔ Scenario 35: Auth endpoint rate limiting (Redis fail-closed)
  ✔ Scenario 36: Decimal128 scale validation and business<->settlement separation
  ✔ Scenario 37: Settlement-token decimal startup verification
  ✔ Scenario 38: Deployed MongoDB index verification (explain + COLLSCAN absence)

▶ GitHub Integration & Service Tests
  ✔ 1. AES-256-GCM + HKDF Token Encryption & Decryption Roundtrip
  ✔ 2. Streak Calculation Algorithm - Consecutive Days & Longest Streak
  ✔ 3. Top Languages Aggregation - Percentage Distribution Calculation
  ✔ 4. Decrypted Secret Confidentiality Guard

▶ Integration-Gate Logic Suite — 14 Gates
  ✔ Gate 1: Fail-fast Startup Validator (Staging Invariants)
  ✔ Gate 2: Single Controlled Write Boundary for Settlement Snapshot
  ✔ Gate 3: Generation-Based Lease Fencing Takeover Simulation
  ✔ Gate 4: USD Exact Decimal128 Validation & Formatting
  ✔ Gate 5: Strict URL Scheme Filtering & XSS Prevention
  ✔ Gate 6: Project CAS State Machine Invariants
  ✔ Gate 7: End-to-End Settlement Traceability Correlation
  ✔ Gate 8: Reorg Common-Ancestor Rollback Strategy
  ✔ Gate 9: Mongoose Models & Index Schema Validation
  ✔ Gate 10: Dynamic Multi-Chain Resolver Verification (Mainnet, L2s, Sepolia)
  ✔ Gate 11: SettlementEvent Schema & Reorg Reversal Functionality
  ✔ Gate 12: Startup Validator with Optional vs Explicit OAuth
  ✔ Gate 13: RPC 429 Rate-Limit During Reorg Check Rejection & Safe Halting
  ✔ Gate 14: 5 Consecutive RPC Failures Flip Halted Flag & Halt Indexer Safely

▶ OAuth Security Suite
  ✔ initiateGoogleAuth generates PKCE challenge and signed state cookie
  ✔ initiateGithubAuth constructs authorization URL with state token
  ✔ handleGoogleCallback rejects invalid/tampered state token
  ✔ handleGoogleCallback rejects state nonce mismatch
  ✔ handleGoogleCallback rejects denied authorization from provider
  ✔ handleGoogleCallback handles successful OAuth exchange & existing user linking
  ✔ handleGithubCallback processes primary verified email & account linking
  ✔ exchangeOAuthCode redeems code, enforces single-use, issues JWT
  ✔ exchangeOAuthCode returns signed roleSelectionToken for pending OAuth users
  ✔ completeOAuthRoleSelection validates roleSelectionToken and prevents forged profiles

▶ Settlement Test Suite — 24 Production Scenarios
  ✔ Scenario 1: Lease initialization via ensureSyncState()
  ✔ Scenario 2: Lease acquisition race (concurrent pods)
  ✔ Scenario 3: Lease generation takeover (expired lease)
  ✔ Scenario 4: Heartbeat generation stability (renew does not increment)
  ✔ Scenario 5: Stale worker financial fencing (generation mismatch -> abort)
  ✔ Scenario 6: Stale worker reorg fencing
  ✔ Scenario 7: Duplicate settlement event race (same sourceEventKey)
  ✔ Scenario 8: Settlement conflict detection (different event, same milestone)
  ✔ Scenario 9: ABI checksum against deployed artifact
  ✔ Scenario 10: Wrong contract address rejection
  ✔ Scenario 11: Wrong chain ID rejection
  ✔ Scenario 12: Wrong token address rejection
  ✔ Scenario 13: Beneficiary mismatch rejection
  ✔ Scenario 14: Amount mismatch rejection (against locked settlement.expectedMilestoneUnits)
  ✔ Scenario 15: Reorg common-ancestor rollback (canonical hash comparison)
  ✔ Scenario 16: Reorg deeper than MAX_REORG_DEPTH -> HALT
  ✔ Scenario 17: Reorg replacement settlement replay (Case 2 + Case 3)
  ✔ Scenario 18: DLQ persistence failure -> HALT
  ✔ Scenario 19: Outbox duplicate race (concurrent claim)
  ✔ Scenario 20: Outbox stale claim reclaim (expired lockedUntil)
  ✔ Scenario 21: Outbox crash recovery (idempotent Message + reclaim)
  ✔ Scenario 22: Reorg<->outbox concurrent race (atomic serialization)
  ✔ Scenario 23: Funding reconciliation mismatch rejection (on-chain total != expected)
  ✔ Scenario 24: On-chain escrow project identity mismatch rejection

ℹ tests 69 | suites 5 | pass 69 | fail 0
```

### Run Hardhat Smart Contract Tests

```bash
cd fairwork-blockchain
npx hardhat test
```
```text
  12 passing
```

### Run Frontend Production Verification

```bash
cd fairwork-frontend
npm run lint    # tsc --noEmit -> 0 errors
npm run build   # tsc -b && vite build -> Clean production bundle
```

---

## 12. Production Deployment Guidelines

1. **MongoDB Replica Set Mandatory**: All financial settlement writes require a MongoDB replica set supporting `writeConcern: { w: "majority" }` and `readConcern: { level: "snapshot" }`.
2. **Reverse Proxy Configuration**: Ensure reverse proxies (Nginx / Cloudflare / Render) forward `X-Forwarded-For` and `X-Forwarded-Proto` headers with `trust proxy` enabled.
3. **Clock Drift Invariant**: Host instances must run NTP/Chrony with clock drift bounded to $\le 50\text{ms}$ for epoch lease synchronization.
4. **RPC Redundancy**: Provide high-availability RPC URLs with fallback endpoints to ensure continuous chain head synchronization.
5. **Operator Runbooks**: Refer to [`docs/INCIDENT_RUNBOOK.md`](docs/INCIDENT_RUNBOOK.md) for automated alert routing, emergency pause procedures, and reorg manual intervention workflows.

---

## 13. License & Authors

- **License**: [MIT License](LICENSE)
- **Authors**: Suriya E & Vignesh V
- **Repository**: [https://github.com/Suriya528/fairwork](https://github.com/Suriya528/fairwork)
- **Live Demo**: [https://fairwork-org.vercel.app](https://fairwork-org.vercel.app)
