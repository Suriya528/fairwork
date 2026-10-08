const fs = require('fs');
const path = require('path');
const { chromium } = require(path.join(__dirname, '..', 'fairwork-frontend', 'node_modules', '@playwright', 'test'));

const figuresDir = path.join(__dirname, '..', 'docs', 'figures');

const diagrams = [
  {
    name: 'fig_arch_suriya.png',
    width: 1200,
    height: 720,
    html: `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 32px; border-radius: 12px; width: 1136px; height: 656px; box-sizing: border-box;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #334155; padding-bottom: 16px; margin-bottom: 24px;">
        <div>
          <span style="font-size: 20px; font-weight: 800; color: #38bdf8; letter-spacing: 0.5px;">FAIRWORK PROTOCOL</span>
          <span style="font-size: 16px; color: #94a3b8; margin-left: 12px;">End-to-End System Architecture (Blockchain & Backend Plane)</span>
        </div>
        <div style="font-size: 12px; background: #1e293b; padding: 6px 12px; border-radius: 20px; border: 1px solid #475569; color: #cbd5e1;">
          Ethereum Sepolia (Chain ID 11155111) &middot; Node.js v20 LTS
        </div>
      </div>

      <!-- Tier 1: Client & Wallet -->
      <div style="background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
        <div style="font-size: 12px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
          Tier 1: Client Application & Web3 Injected Signer
        </div>
        <div style="display: flex; gap: 16px;">
          <div style="flex: 1; background: #0f172a; border: 1px solid #475569; border-radius: 8px; padding: 12px;">
            <div style="font-weight: 700; color: #f1f5f9; font-size: 14px;">React 19 + TypeScript SPA</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Vite 6 &middot; Tailwind CSS &middot; Client-Side State &middot; Viem Client</div>
          </div>
          <div style="flex: 1; background: #0f172a; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px;">
            <div style="font-weight: 700; color: #fbbf24; font-size: 14px;">MetaMask Wallet (EIP-712)</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Non-Custodial Signer &middot; USDC Allowance &middot; Milestone Release Gas</div>
          </div>
          <div style="flex: 1; background: #0f172a; border: 1px solid #3b82f6; border-radius: 8px; padding: 12px;">
            <div style="font-weight: 700; color: #60a5fa; font-size: 14px;">Alchemy JSON-RPC Gateway</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Sepolia HTTPS/WSS Endpoints &middot; Block Header Subscription</div>
          </div>
        </div>
      </div>

      <!-- Connecting arrows -->
      <div style="display: flex; justify-content: space-around; margin: -10px 0 10px 0; font-size: 11px; color: #64748b; font-weight: 600;">
        <span>&#8595; REST API (JWT Bearer)</span>
        <span>&#8595; JSON-RPC (eth_sendRawTransaction)</span>
        <span>&#8595; WebSocket Block Stream</span>
      </div>

      <!-- Tier 2: Application Gateway & Settlement Engine -->
      <div style="display: flex; gap: 20px; margin-bottom: 20px;">
        <div style="flex: 1; background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 16px;">
          <div style="font-size: 12px; font-weight: 700; color: #10b981; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
            Tier 2: Express API Gateway & Auth
          </div>
          <div style="background: #0f172a; border: 1px solid #475569; border-radius: 8px; padding: 10px; margin-bottom: 8px;">
            <div style="font-weight: 700; font-size: 13px; color: #f1f5f9;">Auth & Security Engine</div>
            <div style="font-size: 11px; color: #94a3b8;">JWT Session Cookies &middot; GitHub OAuth PKCE &middot; Redis Fail-Closed Limiter</div>
          </div>
          <div style="background: #0f172a; border: 1px solid #475569; border-radius: 8px; padding: 10px;">
            <div style="font-weight: 700; font-size: 13px; color: #f1f5f9;">Gemini AI Legal & Mediation</div>
            <div style="font-size: 11px; color: #94a3b8;">Automated Contract Generator &middot; Objective Technical Dispute Evaluation</div>
          </div>
        </div>

        <div style="flex: 1.2; background: #1e293b; border: 1px solid #8b5cf6; border-radius: 10px; padding: 16px;">
          <div style="font-size: 12px; font-weight: 700; color: #a78bfa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
            Tier 3: 5-Pillar Financial Settlement Engine
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div style="background: #0f172a; border: 1px solid #6d28d9; border-radius: 8px; padding: 8px;">
              <div style="font-weight: 700; font-size: 12px; color: #c4b5fd;">Lease Manager</div>
              <div style="font-size: 10px; color: #94a3b8;">Generation Fencing &middot; Multi-Pod Anti-Split-Brain</div>
            </div>
            <div style="background: #0f172a; border: 1px solid #6d28d9; border-radius: 8px; padding: 8px;">
              <div style="font-weight: 700; font-size: 12px; color: #c4b5fd;">Reorg Engine</div>
              <div style="font-size: 10px; color: #94a3b8;">Common Ancestor Rollback &middot; Sliding Window</div>
            </div>
            <div style="background: #0f172a; border: 1px solid #6d28d9; border-radius: 8px; padding: 8px;">
              <div style="font-weight: 700; font-size: 12px; color: #c4b5fd;">Arbitrator Relay</div>
              <div style="font-size: 10px; color: #94a3b8;">Viem Client &middot; Sepolia On-Chain Settlement</div>
            </div>
            <div style="background: #0f172a; border: 1px solid #6d28d9; border-radius: 8px; padding: 8px;">
              <div style="font-weight: 700; font-size: 12px; color: #c4b5fd;">Contract Integrity</div>
              <div style="font-size: 10px; color: #94a3b8;">Startup Bytecode Verification &middot; Fail-Fast</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tier 4: Storage & Blockchain Plane -->
      <div style="background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 16px;">
        <div style="font-size: 12px; font-weight: 700; color: #ec4899; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
          Tier 4: Distributed Storage & Sepolia Smart Contract Core
        </div>
        <div style="display: flex; gap: 16px;">
          <div style="flex: 1; background: #0f172a; border: 1px solid #059669; border-radius: 8px; padding: 12px;">
            <div style="font-weight: 700; color: #34d399; font-size: 13px;">MongoDB Replica Cluster</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Projects &middot; SyncLease Collection &middot; SettlementEvents Log &middot; Reviews</div>
          </div>
          <div style="flex: 1; background: #0f172a; border: 1px solid #6366f1; border-radius: 8px; padding: 12px;">
            <div style="font-weight: 700; color: #818cf8; font-size: 13px;">EscrowContract.sol</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">0xc0d1b74a...376c &middot; Non-reentrant multi-milestone vault &middot; 48h Timelock</div>
          </div>
          <div style="flex: 1; background: #0f172a; border: 1px solid #f43f5e; border-radius: 8px; padding: 12px;">
            <div style="font-weight: 700; color: #fb7185; font-size: 13px;">DisputeContract.sol</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">0x0423025a...7193 &middot; Arbitrator isolation &middot; Binary fund allocation</div>
          </div>
          <div style="flex: 1; background: #0f172a; border: 1px solid #eab308; border-radius: 8px; padding: 12px;">
            <div style="font-weight: 700; color: #facc15; font-size: 13px;">ReputationContract.sol</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">0xfa25823c...6674 &middot; O(1) Gas accumulator &middot; Immutable ratings</div>
          </div>
        </div>
      </div>
    </div>
    `
  },
  {
    name: 'fig_escrow_statemachine.png',
    width: 1200,
    height: 520,
    html: `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 28px; border-radius: 12px; width: 1144px; height: 464px; box-sizing: border-box;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #334155; padding-bottom: 12px; margin-bottom: 24px;">
        <div>
          <span style="font-size: 18px; font-weight: 800; color: #34d399;">SMART CONTRACT ESCROW STATE MACHINE</span>
          <span style="font-size: 14px; color: #94a3b8; margin-left: 12px;">EscrowContract.sol Lifecycle Transitions & Security Invariants</span>
        </div>
        <div style="font-size: 11px; background: #1e293b; padding: 4px 10px; border-radius: 16px; border: 1px solid #475569; color: #cbd5e1;">
          Mathematical Reentrancy Guard &middot; OpenZeppelin SafeERC20
        </div>
      </div>

      <!-- Main Flow (Happy Path) -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px;">
        <div style="background: #1e293b; border: 2px solid #38bdf8; border-radius: 10px; padding: 14px 20px; width: 160px; text-align: center;">
          <div style="font-size: 10px; color: #38bdf8; font-weight: 700; text-transform: uppercase;">State 01</div>
          <div style="font-size: 15px; font-weight: 800; color: #ffffff; margin-top: 2px;">CREATED</div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Milestones Defined</div>
        </div>

        <div style="font-size: 20px; color: #38bdf8; font-weight: bold;">&rarr;<br/><span style="font-size: 10px; color: #94a3b8;">fundEscrow()</span></div>

        <div style="background: #1e293b; border: 2px solid #34d399; border-radius: 10px; padding: 14px 20px; width: 160px; text-align: center;">
          <div style="font-size: 10px; color: #34d399; font-weight: 700; text-transform: uppercase;">State 02</div>
          <div style="font-size: 15px; font-weight: 800; color: #ffffff; margin-top: 2px;">FUNDED</div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">USDC Vault Locked</div>
        </div>

        <div style="font-size: 20px; color: #34d399; font-weight: bold;">&rarr;<br/><span style="font-size: 10px; color: #94a3b8;">submitWork()</span></div>

        <div style="background: #1e293b; border: 2px solid #a855f7; border-radius: 10px; padding: 14px 20px; width: 160px; text-align: center;">
          <div style="font-size: 10px; color: #a855f7; font-weight: 700; text-transform: uppercase;">State 03</div>
          <div style="font-size: 15px; font-weight: 800; color: #ffffff; margin-top: 2px;">SUBMITTED</div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Deliverable + CI PR</div>
        </div>

        <div style="font-size: 20px; color: #a855f7; font-weight: bold;">&rarr;<br/><span style="font-size: 10px; color: #94a3b8;">clientApprove()</span></div>

        <div style="background: #1e293b; border: 2px solid #eab308; border-radius: 10px; padding: 14px 20px; width: 160px; text-align: center;">
          <div style="font-size: 10px; color: #eab308; font-weight: 700; text-transform: uppercase;">State 04</div>
          <div style="font-size: 15px; font-weight: 800; color: #ffffff; margin-top: 2px;">APPROVED</div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Client Signoff Given</div>
        </div>

        <div style="font-size: 20px; color: #eab308; font-weight: bold;">&rarr;<br/><span style="font-size: 10px; color: #94a3b8;">releaseMilestone()</span></div>

        <div style="background: #064e3b; border: 2px solid #10b981; border-radius: 10px; padding: 14px 20px; width: 160px; text-align: center;">
          <div style="font-size: 10px; color: #6ee7b7; font-weight: 700; text-transform: uppercase;">State 05</div>
          <div style="font-size: 15px; font-weight: 800; color: #ffffff; margin-top: 2px;">RELEASED</div>
          <div style="font-size: 10px; color: #a7f3d0; margin-top: 4px;">100% Paid to Freelancer</div>
        </div>
      </div>

      <!-- Alternate Branches (Dispute & Timelock) -->
      <div style="display: flex; gap: 24px;">
        <!-- Dispute Branch -->
        <div style="flex: 1; background: #1e1b4b; border: 1px solid #6366f1; border-radius: 10px; padding: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; font-weight: 700; color: #a5b4fc;">DISPUTE RESOLUTION BRANCH</span>
            <span style="font-size: 10px; background: #312e81; padding: 2px 8px; border-radius: 12px; color: #c7d2fe;">freezeOnDispute()</span>
          </div>
          <div style="margin-top: 10px; font-size: 12px; color: #e0e7ff; line-height: 1.6;">
            <strong>Vault Frozen:</strong> Milestones locked on Sepolia. Gemini AI reviews specifications and code deliverable. When both parties accept consensus, the Arbitrator Relay executes <code>resolveDisputeTransfer()</code>.
          </div>
        </div>

        <!-- Timelock Refund Branch -->
        <div style="flex: 1; background: #451a03; border: 1px solid #f59e0b; border-radius: 10px; padding: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; font-weight: 700; color: #fcd34d;">48-HOUR CHALLENGE TIMELOCK</span>
            <span style="font-size: 10px; background: #78350f; padding: 2px 8px; border-radius: 12px; color: #fde68a;">requestRefund()</span>
          </div>
          <div style="margin-top: 10px; font-size: 12px; color: #fef3c7; line-height: 1.6;">
            <strong>Anti-Capital-Drain Invariant:</strong> Client refund initiates mandatory 48-hour challenge lock. If freelancer does not dispute within 48h, client invokes <code>claimRefund()</code>. Early cancellation reverts cleanly.
          </div>
        </div>
      </div>
    </div>
    `
  },
  {
    name: 'fig_dfd_suriya.png',
    width: 1200,
    height: 560,
    html: `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 28px; border-radius: 12px; width: 1144px; height: 504px; box-sizing: border-box;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #334155; padding-bottom: 12px; margin-bottom: 24px;">
        <div>
          <span style="font-size: 18px; font-weight: 800; color: #38bdf8;">DATA FLOW DIAGRAM (LEVEL 1)</span>
          <span style="font-size: 14px; color: #94a3b8; margin-left: 12px;">Financial Escrow Settlement & Indexer Event Flow</span>
        </div>
        <div style="font-size: 11px; background: #1e293b; padding: 4px 10px; border-radius: 16px; border: 1px solid #475569; color: #cbd5e1;">
          Sliding Window Rollback &middot; Generation Fencing
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 240px 1fr 240px; gap: 24px; align-items: center; height: 380px;">
        <!-- Left: Actors -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <div style="background: #1e293b; border: 2px solid #3b82f6; border-radius: 10px; padding: 18px; text-align: center;">
            <div style="font-size: 24px;">&#128100;</div>
            <div style="font-weight: 800; font-size: 15px; color: #93c5fd; margin-top: 4px;">CLIENT</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Creates Project &middot; Deposits USDC &middot; Releases Funds</div>
          </div>
          <div style="background: #1e293b; border: 2px solid #10b981; border-radius: 10px; padding: 18px; text-align: center;">
            <div style="font-size: 24px;">&#128187;</div>
            <div style="font-weight: 800; font-size: 15px; color: #6ee7b7; margin-top: 4px;">FREELANCER</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Submits Code &middot; Attaches GitHub PR &middot; Receives Payout</div>
          </div>
        </div>

        <!-- Center: Processes -->
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div style="background: #1e293b; border: 1px solid #475569; border-radius: 8px; padding: 12px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="font-weight: 700; font-size: 13px; color: #f1f5f9;">1.0 Deposit & Approve</span>
              <span style="font-size: 11px; color: #38bdf8;">MetaMask &rarr; ERC-20</span>
            </div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Client approves allowance and transfers USDC to EscrowContract.sol vault.</div>
          </div>

          <div style="background: #1e293b; border: 1px solid #8b5cf6; border-radius: 8px; padding: 12px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="font-weight: 700; font-size: 13px; color: #c4b5fd;">2.0 Event Indexing & Fencing</span>
              <span style="font-size: 11px; color: #a78bfa;">leaseManager.js</span>
            </div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Active indexer pod consumes <code>EscrowFunded</code> / <code>MilestoneReleased</code> with generation fence.</div>
          </div>

          <div style="background: #1e293b; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="font-weight: 700; font-size: 13px; color: #fde68a;">3.0 Reorg Reconciliation</span>
              <span style="font-size: 11px; color: #fbbf24;">reorgEngine.js</span>
            </div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Compares historical block hashes. Reverts speculative events upon fork detection.</div>
          </div>

          <div style="background: #1e293b; border: 1px solid #10b981; border-radius: 8px; padding: 12px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="font-weight: 700; font-size: 13px; color: #a7f3d0;">4.0 Final Settlement Payout</span>
              <span style="font-size: 11px; color: #34d399;">SafeERC20</span>
            </div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Direct non-custodial transfer of USDC to freelancer address without take-rate.</div>
          </div>
        </div>

        <!-- Right: Data Stores -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <div style="background: #1e293b; border: 2px solid #8b5cf6; border-radius: 10px; padding: 18px; text-align: center;">
            <div style="font-size: 24px;">&#9939;</div>
            <div style="font-weight: 800; font-size: 14px; color: #c4b5fd; margin-top: 4px;">ETHEREUM SEPOLIA</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">EscrowContract.sol<br/>DisputeContract.sol<br/>ReputationContract.sol</div>
          </div>
          <div style="background: #1e293b; border: 2px solid #059669; border-radius: 10px; padding: 18px; text-align: center;">
            <div style="font-size: 24px;">&#128451;</div>
            <div style="font-weight: 800; font-size: 14px; color: #6ee7b7; margin-top: 4px;">MONGODB CLUSTER</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Projects &middot; Milestones<br/>SettlementEvents Log<br/>SyncLease State</div>
          </div>
        </div>
      </div>
    </div>
    `
  },
  {
    name: 'fig_arch_vignesh.png',
    width: 1200,
    height: 720,
    html: `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 32px; border-radius: 12px; width: 1136px; height: 656px; box-sizing: border-box;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #334155; padding-bottom: 16px; margin-bottom: 24px;">
        <div>
          <span style="font-size: 20px; font-weight: 800; color: #a78bfa; letter-spacing: 0.5px;">FAIRWORK CLIENT PLATFORM</span>
          <span style="font-size: 16px; color: #94a3b8; margin-left: 12px;">React 19 Frontend Architecture & Component Hierarchy</span>
        </div>
        <div style="font-size: 12px; background: #1e293b; padding: 6px 12px; border-radius: 20px; border: 1px solid #475569; color: #cbd5e1;">
          TypeScript 5.5 &middot; Vite 6 &middot; Tailwind CSS 3.4
        </div>
      </div>

      <!-- App Shell & Global Providers -->
      <div style="background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 14px; margin-bottom: 18px;">
        <div style="font-size: 12px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
          Global Context Providers (App Shell)
        </div>
        <div style="display: flex; gap: 12px;">
          <div style="flex: 1; background: #0f172a; border: 1px solid #475569; border-radius: 6px; padding: 8px 12px; text-align: center;">
            <div style="font-weight: 700; font-size: 12px; color: #f1f5f9;">AuthContext</div>
            <div style="font-size: 10px; color: #94a3b8;">JWT Token &middot; Roles</div>
          </div>
          <div style="flex: 1; background: #0f172a; border: 1px solid #475569; border-radius: 6px; padding: 8px 12px; text-align: center;">
            <div style="font-weight: 700; font-size: 12px; color: #f1f5f9;">ThemeProvider</div>
            <div style="font-size: 10px; color: #94a3b8;">Dark / Light Tokens</div>
          </div>
          <div style="flex: 1; background: #0f172a; border: 1px solid #475569; border-radius: 6px; padding: 8px 12px; text-align: center;">
            <div style="font-weight: 700; font-size: 12px; color: #f1f5f9;">ToastProvider</div>
            <div style="font-size: 10px; color: #94a3b8;">Portal Floating Alerts</div>
          </div>
          <div style="flex: 1; background: #0f172a; border: 1px solid #475569; border-radius: 6px; padding: 8px 12px; text-align: center;">
            <div style="font-weight: 700; font-size: 12px; color: #f1f5f9;">CurrencyContext</div>
            <div style="font-size: 10px; color: #94a3b8;">USD Formatting</div>
          </div>
        </div>
      </div>

      <!-- Route Views & Workspace Pages -->
      <div style="background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 14px; margin-bottom: 18px;">
        <div style="font-size: 12px; font-weight: 700; color: #10b981; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
          Primary Application Pages (React Router DOM v7)
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
          <div style="background: #0f172a; border: 1px solid #10b981; border-radius: 8px; padding: 10px;">
            <div style="font-weight: 700; font-size: 13px; color: #6ee7b7;">LandingPage.tsx</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">HeroSection &middot; EscrowBlueprint &middot; ProjectCalculator &middot; VerifiedRegistry</div>
          </div>
          <div style="background: #0f172a; border: 1px solid #38bdf8; border-radius: 8px; padding: 10px;">
            <div style="font-weight: 700; font-size: 13px; color: #7dd3fc;">ProjectDetailPage.tsx</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Milestones &middot; Files &middot; GitHub CI Badge &middot; Fund/Release Triggers</div>
          </div>
          <div style="background: #0f172a; border: 1px solid #f43f5e; border-radius: 8px; padding: 10px;">
            <div style="font-weight: 700; font-size: 13px; color: #fda4af;">DisputesPage.tsx</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Gemini AI Recommendation &middot; 48h Consensus Window &middot; Mutual Accept</div>
          </div>
          <div style="background: #0f172a; border: 1px solid #eab308; border-radius: 8px; padding: 10px;">
            <div style="font-weight: 700; font-size: 13px; color: #fde047;">ProfilePage.tsx</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">On-Chain Rating Modal &middot; GitHub 52-Wk Heatmap &middot; Language Stats</div>
          </div>
        </div>
      </div>

      <!-- Atomic Design Primitives & API Client -->
      <div style="display: flex; gap: 18px;">
        <div style="flex: 1.2; background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 14px;">
          <div style="font-size: 12px; font-weight: 700; color: #f59e0b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
            Atomic Design Primitives (components/ui/)
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            <span style="background: #0f172a; border: 1px solid #475569; padding: 4px 8px; border-radius: 4px; font-size: 11px;">Button.tsx</span>
            <span style="background: #0f172a; border: 1px solid #475569; padding: 4px 8px; border-radius: 4px; font-size: 11px;">Card.tsx</span>
            <span style="background: #0f172a; border: 1px solid #475569; padding: 4px 8px; border-radius: 4px; font-size: 11px;">Badge.tsx</span>
            <span style="background: #0f172a; border: 1px solid #475569; padding: 4px 8px; border-radius: 4px; font-size: 11px;">Tabs.tsx</span>
            <span style="background: #0f172a; border: 1px solid #475569; padding: 4px 8px; border-radius: 4px; font-size: 11px;">Progress.tsx</span>
            <span style="background: #0f172a; border: 1px solid #475569; padding: 4px 8px; border-radius: 4px; font-size: 11px;">Toast.tsx</span>
            <span style="background: #0f172a; border: 1px solid #475569; padding: 4px 8px; border-radius: 4px; font-size: 11px;">Modal.tsx</span>
          </div>
        </div>

        <div style="flex: 1; background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 14px;">
          <div style="font-size: 12px; font-weight: 700; color: #ec4899; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
            Integration Client Layer
          </div>
          <div style="font-size: 11px; color: #cbd5e1; line-height: 1.6;">
            <strong>projectsApi.ts</strong>: Type-safe REST endpoints with JWT<br/>
            <strong>web3.ts</strong>: Viem client, MetaMask EIP-712 wallet binding<br/>
            <strong>GitHub CI Hook</strong>: Pull request check-run polling & badging
          </div>
        </div>
      </div>
    </div>
    `
  },
  {
    name: 'fig_user_workflows.png',
    width: 1200,
    height: 600,
    html: `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 28px; border-radius: 12px; width: 1144px; height: 544px; box-sizing: border-box;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #334155; padding-bottom: 12px; margin-bottom: 20px;">
        <div>
          <span style="font-size: 18px; font-weight: 800; color: #38bdf8;">COLLABORATION & USER WORKFLOWS</span>
          <span style="font-size: 14px; color: #94a3b8; margin-left: 12px;">Client, Freelancer, and AI Mediation State Sequences</span>
        </div>
        <div style="font-size: 11px; background: #1e293b; padding: 4px 10px; border-radius: 16px; border: 1px solid #475569; color: #cbd5e1;">
          Enterprise Usability &middot; Viem Web3 Integration
        </div>
      </div>

      <!-- Flow 1: Client Escrow Flow -->
      <div style="background: #1e293b; border: 1px solid #3b82f6; border-radius: 8px; padding: 14px; margin-bottom: 14px;">
        <div style="font-size: 12px; font-weight: 700; color: #60a5fa; margin-bottom: 8px;">WORKFLOW 1: CLIENT ESCROW & RELEASE LIFECYCLE</div>
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; font-weight: 600;">
          <span style="background: #0f172a; border: 1px solid #334155; padding: 6px 10px; border-radius: 6px;">1. Post Project Brief</span>
          <span>&rarr;</span>
          <span style="background: #0f172a; border: 1px solid #334155; padding: 6px 10px; border-radius: 6px;">2. Review Proposals</span>
          <span>&rarr;</span>
          <span style="background: #0f172a; border: 1px solid #334155; padding: 6px 10px; border-radius: 6px;">3. E-Sign AI Agreement</span>
          <span>&rarr;</span>
          <span style="background: #0f172a; border: 1px solid #f59e0b; padding: 6px 10px; border-radius: 6px; color: #fbbf24;">4. Fund Escrow (MetaMask)</span>
          <span>&rarr;</span>
          <span style="background: #0f172a; border: 1px solid #334155; padding: 6px 10px; border-radius: 6px;">5. Inspect CI Badge</span>
          <span>&rarr;</span>
          <span style="background: #064e3b; border: 1px solid #10b981; padding: 6px 10px; border-radius: 6px; color: #6ee7b7;">6. Release Milestone (100%)</span>
        </div>
      </div>

      <!-- Flow 2: Freelancer Submission & GitHub CI -->
      <div style="background: #1e293b; border: 1px solid #10b981; border-radius: 8px; padding: 14px; margin-bottom: 14px;">
        <div style="font-size: 12px; font-weight: 700; color: #34d399; margin-bottom: 8px;">WORKFLOW 2: FREELANCER SUBMISSION & GITHUB CI BADGING</div>
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; font-weight: 600;">
          <span style="background: #0f172a; border: 1px solid #334155; padding: 6px 10px; border-radius: 6px;">1. Submit Proposal</span>
          <span>&rarr;</span>
          <span style="background: #0f172a; border: 1px solid #334155; padding: 6px 10px; border-radius: 6px;">2. Hired & Sign Contract</span>
          <span>&rarr;</span>
          <span style="background: #0f172a; border: 1px solid #334155; padding: 6px 10px; border-radius: 6px;">3. Open GitHub PR (#14)</span>
          <span>&rarr;</span>
          <span style="background: #0f172a; border: 1px solid #334155; padding: 6px 10px; border-radius: 6px;">4. Submit Work Modal</span>
          <span>&rarr;</span>
          <span style="background: #0f172a; border: 1px solid #10b981; padding: 6px 10px; border-radius: 6px; color: #6ee7b7;">5. UI Shows "✓ CI Green"</span>
          <span>&rarr;</span>
          <span style="background: #064e3b; border: 1px solid #10b981; padding: 6px 10px; border-radius: 6px; color: #6ee7b7;">6. Instant Wallet Settlement</span>
        </div>
      </div>

      <!-- Flow 3: AI Dispute Mediation -->
      <div style="background: #1e293b; border: 1px solid #f43f5e; border-radius: 8px; padding: 14px;">
        <div style="font-size: 12px; font-weight: 700; color: #fb7185; margin-bottom: 8px;">WORKFLOW 3: AI DISPUTE MEDIATION & BILATERAL CONSENSUS</div>
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; font-weight: 600;">
          <span style="background: #0f172a; border: 1px solid #e11d48; padding: 6px 10px; border-radius: 6px; color: #fca5a5;">1. Open Dispute (Frozen)</span>
          <span>&rarr;</span>
          <span style="background: #0f172a; border: 1px solid #334155; padding: 6px 10px; border-radius: 6px;">2. Request AI Assessment</span>
          <span>&rarr;</span>
          <span style="background: #0f172a; border: 1px solid #a855f7; padding: 6px 10px; border-radius: 6px; color: #d8b4fe;">3. Gemini AI Analysis</span>
          <span>&rarr;</span>
          <span style="background: #0f172a; border: 1px solid #f59e0b; padding: 6px 10px; border-radius: 6px; color: #fde68a;">4. 48h Mutual Window</span>
          <span>&rarr;</span>
          <span style="background: #0f172a; border: 1px solid #334155; padding: 6px 10px; border-radius: 6px;">5. Both Parties Consent</span>
          <span>&rarr;</span>
          <span style="background: #064e3b; border: 1px solid #10b981; padding: 6px 10px; border-radius: 6px; color: #6ee7b7;">6. Relay Executes On-Chain</span>
        </div>
      </div>
    </div>
    `
  }
];

(async () => {
  console.log("Launching Chromium to render high-resolution diagram PNGs...");
  const browser = await chromium.launch();
  const page = await browser.newPage({
    deviceScaleFactor: 2 // 2x Retina resolution for razor-sharp vector clarity in Word and PDF
  });

  for (const diag of diagrams) {
    await page.setViewportSize({ width: diag.width, height: diag.height });
    await page.setContent(diag.html);
    const dest = path.join(figuresDir, diag.name);
    await page.screenshot({ path: dest, fullPage: true });
    const stats = fs.statSync(dest);
    console.log(`✓ Rendered: ${diag.name} (${(stats.size / 1024).toFixed(1)} KB)`);
  }

  await browser.close();
  console.log("All diagram renderings completed successfully!");
})();
