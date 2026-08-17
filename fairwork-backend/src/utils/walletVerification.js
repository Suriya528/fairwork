const { recoverTypedDataAddress } = require("viem");
const DOMAIN = { name: "FairWork", version: "1", chainId: 11155111 };
const TYPES = { WalletVerification: [
  { name: "walletAddress", type: "address" }, { name: "nonce", type: "string" }, { name: "purpose", type: "string" },
] };
const PURPOSE = "Verify wallet ownership for FairWork";
async function verifyWalletSignature(walletAddress, nonce, signature) {
  return (await recoverTypedDataAddress({ domain: DOMAIN, types: TYPES, primaryType: "WalletVerification", message: { walletAddress, nonce, purpose: PURPOSE }, signature })).toLowerCase();
}
module.exports = { DOMAIN, TYPES, PURPOSE, verifyWalletSignature };
