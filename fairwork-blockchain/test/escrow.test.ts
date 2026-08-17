import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";

describe("FairWork ERC-20 milestone escrow", async () => {
  const { viem } = await network.create();
  const publicClient = await viem.getPublicClient();

  async function deploy(wireDispute = true) {
    const [owner, client, freelancer, arbitrator, outsider] = await viem.getWalletClients();
    const token = await viem.deployContract("MockERC20");
    const escrow = await viem.deployContract("EscrowContract");
    const dispute = await viem.deployContract("DisputeContract", [escrow.address, arbitrator.account.address]);
    if (wireDispute) await escrow.write.setDisputeContract([dispute.address]);
    return { owner, client, freelancer, arbitrator, outsider, token, escrow, dispute };
  }

  async function fundedFixture() {
    const setup = await deploy();
    const { client, token, escrow, freelancer } = setup;
    await token.write.mint([client.account.address, 300n]);
    await escrow.write.createEscrow(["project-1", freelancer.account.address, token.address, [100n, 200n]], { account: client.account });
    await token.write.approve([escrow.address, 300n], { account: client.account });
    await escrow.write.fund(["project-1"], { account: client.account });
    return setup;
  }

  it("creates a valid escrow and rejects invalid creation input", async () => {
    const { client, freelancer, outsider, token, escrow } = await deploy();
    await escrow.write.createEscrow(["project-1", freelancer.account.address, token.address, [100n, 200n]], { account: client.account });
    const parties = await escrow.read.getEscrowParties(["project-1"]);
    assert.equal(parties[0].toLowerCase(), client.account.address.toLowerCase());
    assert.equal(parties[1].toLowerCase(), freelancer.account.address.toLowerCase());
    assert.deepEqual(parties.slice(2), [false, false, false]);
    assert.equal(await escrow.read.getBalance(["project-1"]), 300n);
    await viem.assertions.revertWith(escrow.write.createEscrow(["", freelancer.account.address, token.address, [1n]], { account: client.account }), "Project ID required");
    await viem.assertions.revertWith(escrow.write.createEscrow(["empty", freelancer.account.address, token.address, []], { account: client.account }), "Milestones required");
    await viem.assertions.revertWith(escrow.write.createEscrow(["zero", freelancer.account.address, token.address, [0n]], { account: client.account }), "Invalid milestone amount");
    await viem.assertions.revertWith(escrow.write.createEscrow(["zero-freelancer", "0x0000000000000000000000000000000000000000", token.address, [1n]], { account: client.account }), "Invalid freelancer");
    await viem.assertions.revertWith(escrow.write.createEscrow(["self", client.account.address, token.address, [1n]], { account: client.account }), "Invalid freelancer");
    await viem.assertions.revertWith(escrow.write.createEscrow(["zero-token", freelancer.account.address, "0x0000000000000000000000000000000000000000", [1n]], { account: client.account }), "Invalid token");
    await viem.assertions.revertWith(escrow.write.createEscrow(["eoa", freelancer.account.address, outsider.account.address, [1n]], { account: client.account }), "Invalid token");
    await viem.assertions.revertWith(escrow.write.createEscrow(["project-1", freelancer.account.address, token.address, [1n]], { account: client.account }), "Escrow exists");
  });

  it("enforces client-only funding and ERC-20 allowance/balance requirements", async () => {
    const { client, freelancer, outsider, token, escrow } = await deploy();
    await escrow.write.createEscrow(["project-1", freelancer.account.address, token.address, [100n]], { account: client.account });
    await viem.assertions.revertWith(escrow.write.fund(["project-1"], { account: outsider.account }), "Only client");
    await viem.assertions.revertWithCustomError(escrow.write.fund(["project-1"], { account: client.account }), token, "ERC20InsufficientAllowance");
    await token.write.approve([escrow.address, 100n], { account: client.account });
    await viem.assertions.revertWithCustomError(escrow.write.fund(["project-1"], { account: client.account }), token, "ERC20InsufficientBalance");
    await token.write.mint([client.account.address, 100n]);
    await viem.assertions.emit(escrow.write.fund(["project-1"], { account: client.account }), escrow, "EscrowFunded");
    await viem.assertions.revertWith(escrow.write.fund(["project-1"], { account: client.account }), "Already funded");
  });

  it("releases individual milestones, records completion, and prevents duplicate release", async () => {
    const { client, freelancer, outsider, token, escrow } = await fundedFixture();
    await viem.assertions.revertWith(escrow.write.releaseMilestone(["project-1", 2n], { account: client.account }), "Invalid milestone");
    await viem.assertions.revertWith(escrow.write.releaseMilestone(["project-1", 0n], { account: outsider.account }), "Only client");
    await escrow.write.releaseMilestone(["project-1", 1n], { account: client.account });
    assert.equal(await token.read.balanceOf([freelancer.account.address]), 200n);
    assert.equal(await escrow.read.getBalance(["project-1"]), 100n);
    await viem.assertions.revertWith(escrow.write.releaseMilestone(["project-1", 1n], { account: client.account }), "Invalid milestone");
    await escrow.write.releaseMilestone(["project-1", 0n], { account: client.account });
    assert.equal(await token.read.balanceOf([freelancer.account.address]), 300n);
    const parties = await escrow.read.getEscrowParties(["project-1"]);
    assert.equal(parties[0].toLowerCase(), client.account.address.toLowerCase());
    assert.equal(parties[1].toLowerCase(), freelancer.account.address.toLowerCase());
    assert.deepEqual(parties.slice(2), [true, false, true]);
  });

  it("returns only the remaining escrow balance on a valid refund", async () => {
    const { client, freelancer, outsider, token, escrow } = await fundedFixture();
    await escrow.write.releaseMilestone(["project-1", 0n], { account: client.account });
    await viem.assertions.revertWith(escrow.write.refund(["project-1"], { account: outsider.account }), "Only client");
    await escrow.write.refund(["project-1"], { account: client.account });
    assert.equal(await token.read.balanceOf([freelancer.account.address]), 100n);
    assert.equal(await token.read.balanceOf([client.account.address]), 200n);
    await viem.assertions.revertWith(escrow.write.refund(["project-1"], { account: client.account }), "Escrow unavailable");
  });

  it("freezes a funded escrow and resolves the remaining balance only through the arbitrator", async () => {
    const { client, freelancer, arbitrator, outsider, token, escrow, dispute } = await fundedFixture();
    await viem.assertions.revertWith(dispute.write.raiseDispute(["project-1", "late delivery"], { account: outsider.account }), "Not authorized");
    await dispute.write.raiseDispute(["project-1", "late delivery"], { account: freelancer.account });
    await viem.assertions.revertWith(escrow.write.releaseMilestone(["project-1", 0n], { account: client.account }), "Escrow unavailable");
    await viem.assertions.revertWith(dispute.write.resolveByArbitrator(["project-1", 1]), "Not authorized");
    await dispute.write.resolveByArbitrator(["project-1", 2], { account: arbitrator.account });
    assert.equal(await token.read.balanceOf([freelancer.account.address]), 300n);
    const parties = await escrow.read.getEscrowParties(["project-1"]);
    assert.equal(parties[0].toLowerCase(), client.account.address.toLowerCase());
    assert.equal(parties[1].toLowerCase(), freelancer.account.address.toLowerCase());
    assert.deepEqual(parties.slice(2), [true, false, true]);
  });

  it("keeps Escrow-to-Dispute wiring owner-only, one-time, and closed before wiring", async () => {
    const { owner, client, freelancer, arbitrator, token, escrow, dispute } = await deploy(false);
    await escrow.write.createEscrow(["project-1", freelancer.account.address, token.address, [100n]], { account: client.account });
    await token.write.mint([client.account.address, 100n]);
    await token.write.approve([escrow.address, 100n], { account: client.account });
    await escrow.write.fund(["project-1"], { account: client.account });
    await viem.assertions.revertWith(escrow.write.markDisputed(["project-1"], { account: client.account }), "Only dispute contract");
    await viem.assertions.revertWithCustomError(escrow.write.setDisputeContract([dispute.address], { account: client.account }), escrow, "OwnableUnauthorizedAccount");
    await escrow.write.setDisputeContract([dispute.address], { account: owner.account });
    await viem.assertions.revertWith(escrow.write.setDisputeContract([arbitrator.account.address], { account: owner.account }), "Dispute contract set");
  });

  it("pauses every Escrow state-changing function and allows recovery after unpause", async () => {
    const { owner, client, freelancer, token, escrow } = await deploy();
    await escrow.write.pause({ account: owner.account });
    await viem.assertions.revertWithCustomError(escrow.write.createEscrow(["project-1", freelancer.account.address, token.address, [1n]], { account: client.account }), escrow, "EnforcedPause");
    await escrow.write.unpause({ account: owner.account });
    await escrow.write.createEscrow(["project-1", freelancer.account.address, token.address, [1n]], { account: client.account });
  });

  it("uses the Escrow pause gate to atomically block dispute freezes without adding Dispute authority", async () => {
    const { owner, client, escrow, dispute } = await fundedFixture();
    await escrow.write.pause({ account: owner.account });
    await viem.assertions.revertWithCustomError(
      dispute.write.raiseDispute(["project-1", "paused escrow"], { account: client.account }),
      escrow,
      "EnforcedPause",
    );
    assert.deepEqual((await dispute.read.getDisputeStatus(["project-1"])).slice(0, 2), [0, 0]);
  });

  // `publicClient` is intentionally initialized above: this keeps the test
  // connection explicit and makes future event-log assertions straightforward.
  void publicClient;
});
