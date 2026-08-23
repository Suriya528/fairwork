# FAIRWORK — Decentralized Web3 Freelance Settlement Platform

> **Production Architecture Specification & Real-Time Escrow Infrastructure**  
> *FairWork is a high-throughput Web3 freelance marketplace engineered with trustless Solidity escrow smart contracts, a 5-pillar distributed blockchain settlement engine, EIP-712 cryptographic wallet identity binding, and OAuth 2.0 PKCE social authentication.*

---

## 📋 Table of Contents

- [1. Executive Architectural Summary](#1-executive-architectural-summary)
- [2. System Architecture & 5-Pillar Settlement Engine](#2-system-architecture--5-pillar-settlement-engine)
- [3. Implementation & Verification Status Matrix](#3-implementation--verification-status-matrix)
- [4. Core Security & OAuth 2.0 Protocol](#4-core-security--oauth-20-protocol)
- [5. Freelancer GitHub Profile & Activity Integration](#5-freelancer-github-profile--activity-integration)
- [6. Technology Stack & Installed Toolchain](#6-technology-stack--installed-toolchain)
- [7. Directory Structure](#7-directory-structure)
- [8. Getting Started & Installation](#8-getting-started--installation)
- [9. Test Suite & Verification Matrix](#9-test-suite--verification-matrix)
- [10. Production Deployment Guidelines](#10-production-deployment-guidelines)
- [11. License & Verification Status](#11-license--verification-status)

---

## 1. Executive Architectural Summary

FairWork redefines the Web3 freelance economy by eliminating traditional centralized platform risk. Payments and milestone releases are governed by immutable smart contracts (`EscrowContract.sol`), while off-chain services maintain zero-trust synchronization with Ethereum state through a transactional outbox and distributed epoch lease fencing system.

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

The core settlement indexer is designed under a **5-Pillar Distributed Engine** architecture to provide crash-safe, replayable, and idempotent settlement processing:

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
2. **Branch-Aware Reorg Rollback**: Detects chain reorgs via `BlockCheckpoint` block hash verification, traces common ancestor block $A$ up to `MAX_REORG_DEPTH = 100`, and executes a single ACID transaction to revert attributable project milestone metadata, cancel outbox events, and flag orphaned messages (`ORPHANED_REORGED`).
3. **Epoch Lease Fencing Protocol**: Protects against race conditions during pod failovers. Transactions enforce `writeConcern: { w: "majority" }` and `readConcern: { level: "snapshot" }` with an atomic fencing write guard (`SyncState.updateOne`) requiring `modifiedCount === 1` before committing financial state.
4. **Transactional Outbox Pipeline**: Decouples financial transactions from notification side effects. Outbox workers claim tasks using random UUID `claimTokens` and `lockedUntil` expiration with full-jitter exponential backoff.
5. **Durable Message Truth & Monotonic Catch-Up REST API**: The database `Message` collection is the single source of truth (`systemEventKey = sourceEventKey`). Connected clients receive live Socket.IO events, while reconnecting clients invoke the monotonic cursor catch-up REST API (`GET /api/projects/:id/messages?afterCreatedAt=...&afterId=...`, sorted by `createdAt ASC, _id ASC`).

---

## 3. Implementation & Verification Status Matrix

To maintain high technical accuracy, the system components are categorized into verified implemented code versus architectural integration specifications:

| Component | Status | Implementation / Verification Evidence |
| :--- | :---: | :--- |
| **OAuth 2.0 PKCE & Role Tokens** | ✅ **Implemented & Verified** | Full PKCE code verifier, state JWT, signed `roleSelectionToken`, unit test suite passing 10/10. |
| **GitHub Profile & Heatmap** | ✅ **Implemented & Verified** | AES-256-GCM + HKDF encryption, GraphQL viewer fetch, 52-week heatmap, streak logic, passing 4/4 tests. |
| **Web3 Wallet Binding (EIP-712)** | ✅ **Implemented & Verified** | Cryptographic signature verification, EIP-712 domain binding, `Web3WalletCard` frontend component. |
| **Escrow Reconciliation Engine** | ✅ **Implemented & Verified** | On-chain bytecode escrow validation, Decimal128 precision, single-writer epoch lease guards. |
| **Socket.IO Room Gateway** | ✅ **Implemented & Verified** | JWT auth middleware, `user:<userId>` room isolation, immediate suspension eviction (`socket.disconnect(true)`). |
| **Branch-Aware Reorg Rollback** | 🟡 *Architectural Specification* | Detailed multi-chain block hash link check & common ancestor reversal protocol (`MAX_REORG_DEPTH = 100`). |
| **Transactional Outbox Pipeline** | 🟡 *Architectural Specification* | Idempotent `OutboxEvent` schema, worker claim fencing (`claimToken`), and cursor catch-up REST API. |

---

## 4. Core Security & OAuth 2.0 Protocol

FairWork implements OpenID-style social authentication with PKCE verification and locally issued application JWT session tokens:

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

- **PKCE Code Verification (S256)**: Guards against authorization code interception attacks across all OAuth authorization code flows.
- **Signed Role Selection Tokens**: Unregistered social OAuth users receive a 5-minute signed JWT `roleSelectionToken` preventing client-side profile tampering or role forgery.
- **Unified `authVerifier`**: Shared auth verification logic across Express HTTP routes and Socket.IO handshake handlers enforcing `HS256`, `issuer: "FairWork"`, `audience: "FairWork-App"`, token expiration, and user suspension checks.

---

## 5. Freelancer GitHub Profile & Activity Integration

Freelancers can link their GitHub account to display an open-source contribution graph and developer metrics on their public profile:

```
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

- **Encrypted Token Storage (`GithubOAuthCredential.js`)**: Access tokens encrypted with AES-256-GCM using HKDF-SHA256 derived keys (`{ version: 1, keyId: "hkdf-sha256-v1", iv, ciphertext, authTag }`). Supports zero-downtime key rotation via `version` and `keyId` metadata.
- **Stale-While-Revalidate Caching (`GithubActivityCache.js`)**: Serves cached GraphQL activity snapshots instantly (`expiresAt = 1h`), triggering background refresh queries asynchronously.
- **Derived Metrics Definition**: A contribution day is defined as a UTC calendar day with $\ge 1$ qualifying contribution. Streaks and language percentages are derived reproducibly from GitHub GraphQL `viewer` data.
- **Privacy Controls**: Freelancers can toggle contribution graph visibility between `PUBLIC` and `PRIVATE`.

---

## 6. Technology Stack & Installed Toolchain

### Frontend Application (`fairwork-frontend`)
- **Core Framework**: React 19, TypeScript 5.7, Vite 6
- **Routing & State**: React Router v7, React Auth Context
- **Styling & Aesthetics**: TailwindCSS v4, Glassmorphic Modern Dark Mode
- **Icons & Visuals**: React Icons (`react-icons/fi`), Recharts
- **Web3 Integration**: Viem v2, Ethers.js v6

### Backend API & Microservices (`fairwork-backend`)
- **Runtime & Framework**: Node.js v24 LTS, Express 4.x
- **Database & Modeling**: MongoDB, Mongoose 8.x (`Decimal128` financial precision via `MoneyDomain`)
- **Real-Time Gateway**: Socket.IO 4.8 with room-level access control
- **Security & Crypto**: JSONWebTokens, Bcrypt, AES-256-GCM + HKDF-SHA256
- **Smart Contract Interop**: Ethers.js v6, Hardhat-compiled JSON ABI artifacts

### Smart Contracts & Solidity Infrastructure
- **Solidity Compiler**: `solc 0.8.20`
- **Standards & Dependencies**: OpenZeppelin Contracts (ERC-20 USDC)
- **Development Environment**: Hardhat, Sepolia / Mainnet Fork Testing

---

## 7. Directory Structure

```text
FAIRWORK/
├── fairwork-backend/
│   ├── src/
│   │   ├── controllers/         # Auth, OAuth, User, Project, Escrow controllers
│   │   ├── middleware/          # JWT auth, admin guards, suspension eviction
│   │   ├── models/              # User, Project, Escrow, SyncState, OutboxEvent, etc.
│   │   ├── routes/              # Express API routers (auth, users, githubConnect, etc.)
│   │   ├── services/            # githubService, reconciliationService, MoneyDomain
│   │   ├── utils/               # authVerifier, crypto helpers
│   │   └── index.js             # HTTP server & Socket.IO gateway initialization
│   ├── test/                    # Node.js native test runner test suites
│   │   ├── oauth.test.js        # OAuth security suite (10 tests)
│   │   └── github.test.js       # GitHub integration suite (4 tests)
│   └── package.json
│
├── fairwork-frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/            # SocialAuth, LoginForm, RegisterForm
│   │   │   ├── common/          # PageHeader, MetricCard, WalletAddress
│   │   │   ├── profile/         # GithubContributionHeatmap
│   │   │   ├── ui/              # Button, Card, Input, Textarea, Avatar
│   │   │   └── wallet/          # Web3WalletCard
│   │   ├── context/             # AuthContext, CurrencyContext
│   │   ├── pages/               # ProfilePage, SettingsPage, WorkroomPage, etc.
│   │   ├── services/            # authApi, userApi, projectsApi, apiClient
│   │   ├── App.tsx              # Main route tree and protected layout shell
│   │   └── main.tsx             # Application mount point
│   └── package.json
│
└── README.md
```

---

## 8. Getting Started & Installation

### Prerequisites
- **Node.js**: `v20.0.0` or higher
- **MongoDB**: `v6.0` or higher (Replica set required for ACID transactions)
- **Git**: `v2.30` or higher

### 1. Clone Repository & Install Dependencies

```bash
git clone https://github.com/Suriya528/fairwork.git
cd FAIRWORK

# Install Backend Dependencies
cd fairwork-backend
npm install

# Install Frontend Dependencies
cd ../fairwork-frontend
npm install
```

### 2. Environment Configuration

Create `.env` in `fairwork-backend`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/fairwork
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
ENCRYPTION_SECRET=your-super-secret-encryption-key-min-32-chars
CLIENT_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

Create `.env` in `fairwork-frontend`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Launch Local Development Servers

```bash
# Terminal 1: Backend API & Socket Server
cd fairwork-backend
npm run dev

# Terminal 2: Frontend Web Application
cd fairwork-frontend
npm run dev
```

---

## 9. Test Suite & Verification Matrix

FairWork includes an automated test suite verifying OAuth security, PKCE verification, AES token encryption, streak calculation algorithms, and privacy settings.

### Run Backend Unit Tests

```bash
cd fairwork-backend
npm test
```

#### Test Execution Output

```text
▶ GitHub Integration & Service Tests
  ✔ 1. AES-256-GCM + HKDF Token Encryption & Decryption Roundtrip (4.26ms)
  ✔ 2. Streak Calculation Algorithm - Consecutive Days & Longest Streak (0.75ms)
  ✔ 3. Top Languages Aggregation - Percentage Distribution Calculation (0.45ms)
  ✔ 4. Decrypted Secret Confidentiality Guard (0.42ms)
✔ GitHub Integration & Service Tests (7.37ms)

▶ OAuth Security Suite
  ✔ initiateGoogleAuth generates PKCE challenge and signed state cookie (10.27ms)
  ✔ initiateGithubAuth constructs authorization URL with state token (1.22ms)
  ✔ handleGoogleCallback rejects invalid/tampered state token (0.78ms)
  ✔ handleGoogleCallback rejects state nonce mismatch (0.83ms)
  ✔ handleGoogleCallback rejects denied authorization from provider (0.22ms)
  ✔ handleGoogleCallback handles successful OAuth exchange & existing user linking (1.13ms)
  ✔ handleGithubCallback processes primary verified email & account linking (2.75ms)
  ✔ exchangeOAuthCode redeems code, enforces single-use, issues JWT (1.39ms)
  ✔ exchangeOAuthCode returns signed roleSelectionToken for pending OAuth users (0.77ms)
  ✔ completeOAuthRoleSelection validates roleSelectionToken and prevents forged profiles (9.30ms)

ℹ tests 14 | suites 2 | pass 14 | fail 0 | duration 10.9s
```

### Run Frontend Type Safety Verification

```bash
cd fairwork-frontend
npx tsc --noEmit
```

---

## 10. Production Deployment Guidelines

1. **MongoDB Replica Set**: Transactions require a running MongoDB replica set (`w: majority` write concern).
2. **Clock Synchronization (NTP)**: Node host instances must run Chrony/NTP to maintain clock drift $\le 50\text{ms}$.
3. **Environment Secrets**: Ensure `ENCRYPTION_SECRET` and `JWT_SECRET` use cryptographically secure 256-bit random keys.
4. **CORS Configuration**: Restrict `CLIENT_URL` and `allowedOrigins` strictly to production domains.

---

## 11. License & Verification Status

- **Status**: Production Architecture Candidate (`v2.0.0-rc`)
- **License**: MIT License
- **Author**: Suriya E & Vignesh V 
