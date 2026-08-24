const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/**
 * Build script: extracts ABI from Hardhat compilation artifacts,
 * writes EscrowContract.abi.json, and generates EscrowContract.abi.sha256.
 */
function syncAbi() {
  const artifactPath = path.join(__dirname, "../../fairwork-blockchain/artifacts/contracts/EscrowContract.sol/EscrowContract.json");
  const targetDir = path.join(__dirname, "../src/abi");

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  if (!fs.existsSync(artifactPath)) {
    console.warn(`WARNING: Hardhat artifact not found at ${artifactPath}. Using existing ABI in src/abi.`);
    return;
  }

  const rawArtifact = fs.readFileSync(artifactPath, "utf-8");
  const parsed = JSON.parse(rawArtifact);
  const abiJson = JSON.stringify(parsed.abi, null, 2);
  const sha256 = crypto.createHash("sha256").update(abiJson).digest("hex");

  const abiFile = path.join(targetDir, "EscrowContract.abi.json");
  const shaFile = path.join(targetDir, "EscrowContract.abi.sha256");

  fs.writeFileSync(abiFile, abiJson, "utf-8");
  fs.writeFileSync(shaFile, sha256 + "\n", "utf-8");

  console.log(`Successfully synced ABI to ${abiFile}`);
  console.log(`ABI SHA-256: ${sha256}`);
}

if (require.main === module) {
  syncAbi();
}

module.exports = { syncAbi };
