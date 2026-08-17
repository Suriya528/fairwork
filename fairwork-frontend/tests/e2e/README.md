# FairWork browser E2E tests

Run `npm run test:e2e` from `fairwork-frontend`. The suite starts Vite and uses Playwright request interception only for deterministic browser/UI scenarios; it never contacts MongoDB, Sepolia, deployed contracts, or a wallet.

These tests cover authentication screens, protected-route behavior, client assignment visibility, and authoritative escrow UI gating. They do **not** claim to execute wallet signatures, ERC-20 approvals, funding, milestone releases, or dispute transactions. Those require a separately configured, safe browser-wallet and chain environment.

Install Chromium once with `npx playwright install chromium` when the browser is not already available.
