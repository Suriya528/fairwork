import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { parseEther, createTestClient, http, publicActions, walletActions } from "viem";
import { hardhat } from "viem/chains";
import hre from "hardhat";

describe("EscrowContract", async function () {
  let escrow: any;
  let client: any;
  let freelancer: any;
  let other: any;
  let publicClient: any;

  before(async function () {
    const testClient = createTestClient({
      chain: hardhat,
      mode: "hardhat",
      transport: http(),
    })
      .extend(publicActions)
      .extend(walletActions);

    publicClient = testClient;

    const accounts = await testClient.getAddresses();

    client = { account: { address: accounts[0] } };
    freelancer = { account: { address: accounts[1] } };
    other = { account: { address: accounts[2] } };

    const artifact = await hre.artifacts.readArtifact("EscrowContract");

    const hash = await testClient.deployContract({
      abi: artifact.abi,
      bytecode: artifact.bytecode as `0x${string}`,
      account: accounts[0],
    });

    const receipt = await testClient.waitForTransactionReceipt({ hash });

    escrow = {
      address: receipt.contractAddress,
      abi: artifact.abi,
      write: {
        deposit: async (args: any[], opts: any) =>
          testClient.writeContract({
            address: receipt.contractAddress!,
            abi: artifact.abi,
            functionName: "deposit",
            args,
            ...opts,
          }),
        releaseFunds: async (args: any[], opts: any) =>
          testClient.writeContract({
            address: receipt.contractAddress!,
            abi: artifact.abi,
            functionName: "releaseFunds",
            args,
            ...opts,
          }),
        refund: async (args: any[], opts: any) =>
          testClient.writeContract({
            address: receipt.contractAddress!,
            abi: artifact.abi,
            functionName: "refund",
            args,
            ...opts,
          }),
        raiseDispute: async (args: any[], opts: any) =>
          testClient.writeContract({
            address: receipt.contractAddress!,
            abi: artifact.abi,
            functionName: "raiseDispute",
            args,
            ...opts,
          }),
      },
      read: {
        getBalance: async (args: any[]) =>
          testClient.readContract({
            address: receipt.contractAddress!,
            abi: artifact.abi,
            functionName: "getBalance",
            args,
          }),
        escrows: async (args: any[]) =>
          testClient.readContract({
            address: receipt.contractAddress!,
            abi: artifact.abi,
            functionName: "escrows",
            args,
          }),
      },
    };
  });

  it("deposits ETH into escrow", async function () {
    await escrow.write.deposit(
      ["project-1", freelancer.account.address],
      { account: client.account.address, value: parseEther("1") }
    );
    const balance = await escrow.read.getBalance(["project-1"]);
    assert.equal(balance, parseEther("1"));
  });

  it("releases funds to freelancer", async function () {
    await escrow.write.deposit(
      ["project-2", freelancer.account.address],
      { account: client.account.address, value: parseEther("1") }
    );
    const before = await publicClient.getBalance({ address: freelancer.account.address });
    await escrow.write.releaseFunds(["project-2"], { account: client.account.address });
    const after = await publicClient.getBalance({ address: freelancer.account.address });
    assert.ok(after > before);
  });

  it("refunds client on cancel", async function () {
    await escrow.write.deposit(
      ["project-3", freelancer.account.address],
      { account: client.account.address, value: parseEther("1") }
    );
    const before = await publicClient.getBalance({ address: client.account.address });
    await escrow.write.refund(["project-3"], { account: client.account.address });
    const after = await publicClient.getBalance({ address: client.account.address });
    assert.ok(after > before);
  });

  it("freezes escrow on dispute", async function () {
    await escrow.write.deposit(
      ["project-4", freelancer.account.address],
      { account: client.account.address, value: parseEther("1") }
    );
    await escrow.write.raiseDispute(["project-4"], { account: freelancer.account.address });
    const data = await escrow.read.escrows(["project-4"]);
    assert.equal((data as any)[4], true);
  });

  it("blocks outsider from releasing funds", async function () {
    await escrow.write.deposit(
      ["project-5", freelancer.account.address],
      { account: client.account.address, value: parseEther("1") }
    );
    await assert.rejects(
      escrow.write.releaseFunds(["project-5"], { account: other.account.address })
    );
  });
});