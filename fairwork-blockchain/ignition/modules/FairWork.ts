import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Addresses are deployment inputs, never application constants.
export default buildModule("FairWork", (m) => {
  const arbitrator = m.getParameter("arbitrator");
  const escrow = m.contract("EscrowContract");
  const dispute = m.contract("DisputeContract", [escrow, arbitrator]);
  m.call(escrow, "setDisputeContract", [dispute]);
  return { escrow, dispute };
});
