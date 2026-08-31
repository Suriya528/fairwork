#!/usr/bin/env node

/**
 * FairWork Post-Deployment Smoke Test Runner
 *
 * Verifies live deployment health, security headers, database readiness,
 * and API error boundary behavior.
 *
 * Usage:
 *   node scripts/smoke-test.mjs <BACKEND_URL> [FRONTEND_URL]
 *
 * Example:
 *   node scripts/smoke-test.mjs http://localhost:5000 http://localhost:3000
 */

const backendUrl = (process.argv[2] || process.env.API_URL || "http://localhost:5000").replace(/\/$/, "");
const frontendUrl = process.argv[3] ? process.argv[3].replace(/\/$/, "") : null;

console.log(`\n🔍 Running FairWork Production Smoke Tests`);
console.log(`📡 Backend Target:  ${backendUrl}`);
if (frontendUrl) console.log(`🌐 Frontend Target: ${frontendUrl}`);
console.log(`--------------------------------------------------\n`);

let passed = 0;
let failed = 0;

async function check(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name} -> ${err.message}`);
    failed++;
  }
}

async function runSmokeTests() {
  // Test 1: Health Check Endpoint
  await check("Backend /health responds 200 OK with valid JSON", async () => {
    const res = await fetch(`${backendUrl}/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    if (data.status !== "ok") throw new Error(`Unexpected status payload: ${JSON.stringify(data)}`);
  });

  // Test 2: Database Readiness Endpoint (/readyz)
  await check("Backend /readyz reports MongoDB connection ready", async () => {
    const res = await fetch(`${backendUrl}/readyz`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    if (data.status !== "ready") throw new Error(`MongoDB not ready: ${JSON.stringify(data)}`);
  });

  // Test 3: Helmet Security Headers
  await check("Security headers (X-Content-Type-Options: nosniff) are present", async () => {
    const res = await fetch(`${backendUrl}/health`);
    const nosniff = res.headers.get("x-content-type-options");
    if (nosniff !== "nosniff") {
      throw new Error(`Expected x-content-type-options: nosniff, got '${nosniff}'`);
    }
  });

  // Test 4: Global 404 Route Handling
  await check("Undefined routes return structured 404 JSON (no HTML leak)", async () => {
    const res = await fetch(`${backendUrl}/api/v1/smoke-test-non-existent-route`);
    if (res.status !== 404) throw new Error(`Expected 404, got HTTP ${res.status}`);
    const data = await res.json();
    if (data.code !== "NOT_FOUND") throw new Error(`Expected code: NOT_FOUND, got: ${JSON.stringify(data)}`);
  });

  // Test 5: Protected Route Auth Guard
  await check("Protected route (/api/projects) rejects unauthenticated request with 401", async () => {
    const res = await fetch(`${backendUrl}/api/projects`);
    if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got HTTP ${res.status}`);
  });

  // Test 6: Frontend Static Asset & HTML Serving (if frontendUrl provided)
  if (frontendUrl) {
    await check("Frontend serves valid HTML with root mount element", async () => {
      const res = await fetch(frontendUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const text = await res.text();
      if (!text.includes("<div id=\"root\">") && !text.includes("<div id='root'>") && !text.includes("root")) {
        throw new Error("Frontend index.html does not contain expected root mount point.");
      }
    });
  }

  console.log(`\n--------------------------------------------------`);
  console.log(`🏁 Smoke Test Summary: ${passed} Passed, ${failed} Failed`);

  if (failed > 0) {
    console.error(`\n🚨 DEPLOYMENT SMOKE GATES FAILED! Do NOT promote to live traffic.\n`);
    process.exit(1);
  } else {
    console.log(`\n🎉 ALL DEPLOYMENT SMOKE GATES PASSED!\n`);
    process.exit(0);
  }
}

runSmokeTests();
