const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/**
 * Script to derive expected bytecode hashes from compiled Hardhat artifacts.
 */
function deriveBytecodeHashes() {
  const escrowPath = path.join(__dirname, "../../fairwork-blockchain/artifacts/contracts/EscrowContract.sol/EscrowContract.json");

  if (!fs.existsSync(escrowPath)) {
    console.warn(`WARNING: Contract artifact not found at ${escrowPath}`);
    return;
  }

  const raw = fs.readFileSync(escrowPath, "utf-8");
  const parsed = JSON.parse(raw);
  const deployedBytecode = parsed.deployedBytecode;

  if (deployedBytecode) {
    const hash = crypto.createHash("sha256").update(deployedBytecode).digest("hex");
    console.log(`EXPECTED_ESCROW_BYTECODE_HASH=${hash}`);
  }
}

if (require.main === module) {
  deriveBytecodeHashes();
}

module.exports = { deriveBytecodeHashes };
