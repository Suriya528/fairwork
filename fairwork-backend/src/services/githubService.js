const crypto = require("crypto");
const axios = require("axios");
const GithubActivityCache = require("../models/GithubActivityCache");
const GithubOAuthCredential = require("../models/GithubOAuthCredential");

// Derives a 32-byte AES key using HKDF-SHA256 from master secret
function getEncryptionKey() {
  const secret = process.env.ENCRYPTION_SECRET || process.env.JWT_SECRET || "default-fairwork-encryption-secret-32bytes";
  return crypto.hkdfSync("sha256", secret, "", "fairwork-github-tokens-v1", 32);
}

function encryptToken(token) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let ciphertext = cipher.update(token, "utf8", "hex");
  ciphertext += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return {
    version: 1,
    keyId: "hkdf-sha256-v1",
    iv: iv.toString("hex"),
    ciphertext,
    authTag,
  };
}

function decryptToken(encrypted) {
  const key = getEncryptionKey();
  const iv = Buffer.from(encrypted.iv, "hex");
  const authTag = Buffer.from(encrypted.authTag, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted.ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// Streak calculation algorithm
function calculateStreaks(weeks = []) {
  const days = [];
  for (const week of weeks) {
    if (week && Array.isArray(week.contributionDays)) {
      for (const day of week.contributionDays) {
        days.push({
          date: day.date,
          count: Number(day.contributionCount || 0),
        });
      }
    }
  }

  days.sort((a, b) => new Date(a.date) - new Date(b.date));

  let totalContributionsYear = 0;
  let longestStreak = 0;
  let currentStreak = 0;
  let tempStreak = 0;

  for (const d of days) {
    totalContributionsYear += d.count;
    if (d.count > 0) {
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  // Calculate current active streak backwards from latest day
  let activeStreak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) {
      activeStreak++;
    } else {
      // Allow today to have 0 if yesterday had contributions
      if (i === days.length - 1) continue;
      break;
    }
  }
  currentStreak = activeStreak;

  return { totalContributionsYear, longestStreak, currentStreak, days };
}

// Calculate top languages by total byte size across top repositories
function calculateTopLanguages(repos = []) {
  const langTotals = {};
  const langColors = {};

  for (const repo of repos) {
    const edges = repo?.languages?.edges || [];
    for (const edge of edges) {
      const name = edge?.node?.name;
      const color = edge?.node?.color || "#8b5cf6";
      const size = Number(edge?.size || 0);
      if (name) {
        langTotals[name] = (langTotals[name] || 0) + size;
        langColors[name] = color;
      }
    }
  }

  const grandTotal = Object.values(langTotals).reduce((a, b) => a + b, 0);
  if (grandTotal === 0) return [];

  return Object.keys(langTotals)
    .map((name) => ({
      name,
      color: langColors[name],
      percentage: Math.round((langTotals[name] / grandTotal) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);
}

// Query GitHub GraphQL API using authenticated `viewer` root query
async function fetchGithubViewerData(accessToken) {
  const graphqlQuery = {
    query: `
      query {
        viewer {
          id
          login
          name
          avatarUrl
          url
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                  color
                }
              }
            }
          }
          repositories(first: 10, orderBy: {field: STARGAZERS, direction: DESC}, ownerAffiliations: OWNER, isFork: false) {
            nodes {
              name
              description
              stargazerCount
              forkCount
              url
              languages(first: 5, orderBy: {field: SIZE, direction: DESC}) {
                edges {
                  size
                  node { name color }
                }
              }
            }
          }
        }
      }
    `,
  };

  const response = await axios.post("https://api.github.com/graphql", graphqlQuery, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "FairWork-App",
    },
    timeout: 10000,
  });

  if (response.data.errors && response.data.errors.length > 0) {
    throw new Error(`GitHub GraphQL Error: ${response.data.errors[0].message}`);
  }

  const viewer = response.data?.data?.viewer;
  if (!viewer) throw new Error("Malformed response from GitHub GraphQL API");

  return viewer;
}

// Process and store activity snapshot into GithubActivityCache
async function refreshGithubActivity(githubUserId, accessToken) {
  try {
    const viewer = await fetchGithubViewerData(accessToken);
    const calendar = viewer.contributionsCollection?.contributionCalendar || { weeks: [] };
    const repos = viewer.repositories?.nodes || [];

    const { totalContributionsYear, longestStreak, currentStreak } = calculateStreaks(calendar.weeks);
    const topLanguages = calculateTopLanguages(repos);

    const topRepositories = repos.map((r) => ({
      name: r.name,
      description: r.description || "",
      stars: Number(r.stargazerCount || 0),
      forks: Number(r.forkCount || 0),
      url: r.url,
      language: r.languages?.edges?.[0]?.node?.name || "",
    }));

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 3600000); // 1 hour freshness
    const retentionExpiresAt = new Date(now.getTime() + 7 * 86400000); // 7 days retention

    const doc = await GithubActivityCache.findOneAndUpdate(
      { githubUserId: String(githubUserId) },
      {
        githubUserId: String(githubUserId),
        contributionCalendar: calendar,
        topLanguages,
        topRepositories,
        longestStreak,
        currentStreak,
        totalContributionsYear,
        fetchedAt: now,
        expiresAt,
        retentionExpiresAt,
        lastError: null,
      },
      { upsert: true, new: true }
    );

    return doc;
  } catch (err) {
    console.error(`GitHub activity refresh error for ${githubUserId}:`, err.message);
    // Update error field on existing cache if present
    await GithubActivityCache.updateOne(
      { githubUserId: String(githubUserId) },
      { $set: { lastError: err.message } }
    ).catch(() => {});
    throw err;
  }
}

// Stale-While-Revalidate getter
async function getUserGithubActivity(githubUserId) {
  const cache = await GithubActivityCache.findOne({ githubUserId: String(githubUserId) });
  const now = new Date();

  if (cache) {
    if (now < cache.expiresAt) {
      // Fresh cache hit
      return cache;
    }
    if (now < cache.retentionExpiresAt) {
      // Stale cache hit: return cached data immediately, trigger async refresh in background
      GithubOAuthCredential.findOne({ githubUserId: String(githubUserId) })
        .then((cred) => {
          if (cred && cred.encryptedAccessToken) {
            const token = decryptToken(cred.encryptedAccessToken);
            refreshGithubActivity(githubUserId, token).catch(() => {});
          }
        })
        .catch(() => {});
      return cache;
    }
  }

  // Cache miss or expired: fetch synchronously if credential exists
  const cred = await GithubOAuthCredential.findOne({ githubUserId: String(githubUserId) });
  if (!cred || !cred.encryptedAccessToken) {
    return cache || null;
  }

  const token = decryptToken(cred.encryptedAccessToken);
  return await refreshGithubActivity(githubUserId, token);
}

module.exports = {
  encryptToken,
  decryptToken,
  calculateStreaks,
  calculateTopLanguages,
  fetchGithubViewerData,
  refreshGithubActivity,
  getUserGithubActivity,
};
