const { test, describe } = require("node:test");
const assert = require("node:assert");
const {
  encryptToken,
  decryptToken,
  calculateStreaks,
  calculateTopLanguages,
} = require("../src/services/githubService");

describe("GitHub Integration & Service Tests", () => {
  test("1. AES-256-GCM + HKDF Token Encryption & Decryption Roundtrip", () => {
    const rawToken = "gho_test_token_1234567890abcdefghijklmnopqrstuvwxyz";
    const encrypted = encryptToken(rawToken);

    assert.strictEqual(encrypted.version, 1);
    assert.strictEqual(encrypted.keyId, "hkdf-sha256-v1");
    assert.ok(encrypted.iv);
    assert.ok(encrypted.ciphertext);
    assert.ok(encrypted.authTag);
    assert.notStrictEqual(encrypted.ciphertext, rawToken);

    const decrypted = decryptToken(encrypted);
    assert.strictEqual(decrypted, rawToken);
  });

  test("2. Streak Calculation Algorithm - Consecutive Days & Longest Streak", () => {
    const mockWeeks = [
      {
        contributionDays: [
          { date: "2026-01-01", contributionCount: 5 },
          { date: "2026-01-02", contributionCount: 2 },
          { date: "2026-01-03", contributionCount: 0 },
          { date: "2026-01-04", contributionCount: 1 },
          { date: "2026-01-05", contributionCount: 3 },
          { date: "2026-01-06", contributionCount: 4 },
          { date: "2026-01-07", contributionCount: 2 },
        ],
      },
    ];

    const { totalContributionsYear, longestStreak, currentStreak } = calculateStreaks(mockWeeks);

    assert.strictEqual(totalContributionsYear, 17);
    assert.strictEqual(longestStreak, 4); // Jan 4, 5, 6, 7 = 4 days
    assert.strictEqual(currentStreak, 4);
  });

  test("3. Top Languages Aggregation - Percentage Distribution Calculation", () => {
    const mockRepos = [
      {
        languages: {
          edges: [
            { size: 6000, node: { name: "TypeScript", color: "#3178c6" } },
            { size: 4000, node: { name: "JavaScript", color: "#f1e05a" } },
          ],
        },
      },
      {
        languages: {
          edges: [
            { size: 10000, node: { name: "TypeScript", color: "#3178c6" } },
          ],
        },
      },
    ];

    const topLangs = calculateTopLanguages(mockRepos);

    assert.strictEqual(topLangs.length, 2);
    assert.strictEqual(topLangs[0].name, "TypeScript");
    assert.strictEqual(topLangs[0].percentage, 80); // 16,000 / 20,000 = 80%
    assert.strictEqual(topLangs[1].name, "JavaScript");
    assert.strictEqual(topLangs[1].percentage, 20); // 4,000 / 20,000 = 20%
  });

  test("4. Decrypted Secret Confidentiality Guard", () => {
    const token = "ghp_sensitive_user_access_token";
    const encrypted = encryptToken(token);
    const jsonString = JSON.stringify(encrypted);

    assert.strictEqual(jsonString.includes(token), false);
  });
});
