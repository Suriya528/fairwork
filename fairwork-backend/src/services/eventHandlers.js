const Project = require('../models/Project.js');
const SettlementEvent = require('../models/SettlementEvent.js');
const OutboxEvent = require('../models/OutboxEvent.js');
const { buildBlockchainEventKey } = require('./reconciliationService.js');

async function recordSettlementAndOutbox({ verifiedEvent, session, content, extraFields = {} }) {
  const sourceEventKey = buildBlockchainEventKey({
    chainId: verifiedEvent.chainId,
    contractAddress: verifiedEvent.contractAddress,
    transactionHash: verifiedEvent.transactionHash,
    logIndex: verifiedEvent.logIndex,
  });

  const [settlementEvent] = await SettlementEvent.create(
    [
      {
        sourceEventKey,
        chainId: verifiedEvent.chainId,
        contractAddress: verifiedEvent.contractAddress.toLowerCase(),
        transactionHash: verifiedEvent.transactionHash.toLowerCase(),
        logIndex: verifiedEvent.logIndex,
        blockNumber: verifiedEvent.blockNumber,
        blockHash: verifiedEvent.blockHash,
        eventName: verifiedEvent.eventName,
        projectId: verifiedEvent.projectId,
        status: 'ACTIVE',
        ...extraFields,
      },
    ],
    { session }
  );

  await OutboxEvent.create(
    [
      {
        sourceEventKey,
        eventType: verifiedEvent.eventName,
        settlementEventId: settlementEvent._id,
        projectId: verifiedEvent.projectId,
        content,
        status: 'PENDING',
      },
    ],
    { session }
  );

  return settlementEvent;
}

async function handleEscrowFunded({ verifiedEvent, onChainEscrowState, session }) {
  const { projectId, transactionHash } = verifiedEvent;
  const result = await Project.updateOne(
    { _id: projectId, escrowFunded: { $ne: true } },
    {
      $set: {
        escrowFunded: true,
        escrowTxnHash: transactionHash,
        status: 'in_progress',
        'settlement.fundingLockedAt': new Date(),
      },
    },
    { session }
  );

  const sourceEventKey = buildBlockchainEventKey({
    chainId: verifiedEvent.chainId,
    contractAddress: verifiedEvent.contractAddress,
    transactionHash: verifiedEvent.transactionHash,
    logIndex: verifiedEvent.logIndex,
  });

  const existing = await SettlementEvent.findOne({ sourceEventKey }).session(session);
  if (!existing) {
    try {
      await recordSettlementAndOutbox({
        verifiedEvent,
        session,
        content: `Escrow project was funded on-chain with transaction ${transactionHash}.`,
        extraFields: {
          tokenAddress: onChainEscrowState?.token?.toLowerCase() || null,
          amountUnits: verifiedEvent.amount ? verifiedEvent.amount.toString() : (onChainEscrowState?.totalBudget ? onChainEscrowState.totalBudget.toString() : null),
        },
      });
      return 'MUTATED';
    } catch (err) {
      if (err.code === 11000) return 'ALREADY_PROCESSED';
      throw err;
    }
  }

  return result.modifiedCount === 1 ? 'MUTATED' : 'ALREADY_PROCESSED';
}

async function handleEscrowRefunded({ verifiedEvent, session }) {
  const { projectId } = verifiedEvent;
  const result = await Project.updateOne(
    { _id: projectId, escrowCompleted: { $ne: true } },
    {
      $set: {
        escrowCompleted: true,
        status: 'refunded',
        refundRequested: false,
      },
      $unset: { refundRequestedAt: '', refundTxnHash: '' },
    },
    { session }
  );

  const sourceEventKey = buildBlockchainEventKey({
    chainId: verifiedEvent.chainId,
    contractAddress: verifiedEvent.contractAddress,
    transactionHash: verifiedEvent.transactionHash,
    logIndex: verifiedEvent.logIndex,
  });

  const existing = await SettlementEvent.findOne({ sourceEventKey }).session(session);
  if (!existing) {
    try {
      await recordSettlementAndOutbox({
        verifiedEvent,
        session,
        content: 'Escrow was refunded to client on-chain.',
        extraFields: {
          amountUnits: verifiedEvent.amount ? verifiedEvent.amount.toString() : null,
        },
      });
      return 'MUTATED';
    } catch (err) {
      if (err.code === 11000) return 'ALREADY_PROCESSED';
      throw err;
    }
  }

  return result.modifiedCount === 1 ? 'MUTATED' : 'ALREADY_PROCESSED';
}

async function handleRefundRequested({ verifiedEvent, session }) {
  const { projectId } = verifiedEvent;
  const result = await Project.updateOne(
    { _id: projectId, refundRequested: { $ne: true } },
    {
      $set: {
        refundRequested: true,
        refundRequestedAt: new Date(),
        refundTxnHash: verifiedEvent.transactionHash,
      },
    },
    { session }
  );

  const sourceEventKey = buildBlockchainEventKey({
    chainId: verifiedEvent.chainId,
    contractAddress: verifiedEvent.contractAddress,
    transactionHash: verifiedEvent.transactionHash,
    logIndex: verifiedEvent.logIndex,
  });

  const existing = await SettlementEvent.findOne({ sourceEventKey }).session(session);
  if (!existing) {
    try {
      await recordSettlementAndOutbox({
        verifiedEvent,
        session,
        content: 'A refund request was submitted on-chain with a 48-hour timelock.',
      });
      return 'MUTATED';
    } catch (err) {
      if (err.code === 11000) return 'ALREADY_PROCESSED';
      throw err;
    }
  }

  return result.modifiedCount === 1 ? 'MUTATED' : 'ALREADY_PROCESSED';
}

async function handleRefundCancelled({ verifiedEvent, session }) {
  const { projectId } = verifiedEvent;
  const result = await Project.updateOne(
    { _id: projectId, refundRequested: true },
    {
      $set: { refundRequested: false, refundTxnHash: '' },
      $unset: { refundRequestedAt: '' },
    },
    { session }
  );

  const sourceEventKey = buildBlockchainEventKey({
    chainId: verifiedEvent.chainId,
    contractAddress: verifiedEvent.contractAddress,
    transactionHash: verifiedEvent.transactionHash,
    logIndex: verifiedEvent.logIndex,
  });

  const existing = await SettlementEvent.findOne({ sourceEventKey }).session(session);
  if (!existing) {
    try {
      await recordSettlementAndOutbox({
        verifiedEvent,
        session,
        content: 'Refund request was cancelled on-chain.',
      });
      return 'MUTATED';
    } catch (err) {
      if (err.code === 11000) return 'ALREADY_PROCESSED';
      throw err;
    }
  }

  return result.modifiedCount === 1 ? 'MUTATED' : 'ALREADY_PROCESSED';
}

async function handleEscrowDisputed({ verifiedEvent, session }) {
  const { projectId } = verifiedEvent;
  const result = await Project.updateOne(
    { _id: projectId, status: { $ne: 'disputed' } },
    {
      $set: {
        status: 'disputed',
        escrowDisputed: true,
        refundRequested: false,
        refundTxnHash: '',
      },
      $unset: { refundRequestedAt: '' },
    },
    { session }
  );

  const Dispute = require('../models/Dispute');
  const existingDispute = await Dispute.findOne({ projectId, status: 'pending' }).session(session);
  if (!existingDispute) {
    await Dispute.create(
      [
        {
          projectId,
          raisedBy: null,
          reason: 'On-chain dispute opened',
          status: 'pending',
        },
      ],
      { session }
    );
  }

  const sourceEventKey = buildBlockchainEventKey({
    chainId: verifiedEvent.chainId,
    contractAddress: verifiedEvent.contractAddress,
    transactionHash: verifiedEvent.transactionHash,
    logIndex: verifiedEvent.logIndex,
  });

  const existing = await SettlementEvent.findOne({ sourceEventKey }).session(session);
  if (!existing) {
    try {
      await recordSettlementAndOutbox({
        verifiedEvent,
        session,
        content: 'Escrow was frozen under on-chain dispute.',
      });
      return 'MUTATED';
    } catch (err) {
      if (err.code === 11000) return 'ALREADY_PROCESSED';
      throw err;
    }
  }

  return result.modifiedCount === 1 ? 'MUTATED' : 'ALREADY_PROCESSED';
}

async function handleDisputeResolved({ verifiedEvent, onChainEscrowState, session }) {
  const { projectId } = verifiedEvent;
  const project = await Project.findById(projectId).session(session);
  const isClientWinner = verifiedEvent.winner && (
    (project?.clientWalletAddress && verifiedEvent.winner.toLowerCase() === project.clientWalletAddress.toLowerCase()) ||
    (onChainEscrowState?.client && verifiedEvent.winner.toLowerCase() === onChainEscrowState.client.toLowerCase())
  );
  const resolvedStatus = isClientWinner ? 'refunded' : 'completed';

  const result = await Project.updateOne(
    { _id: projectId, escrowCompleted: { $ne: true } },
    {
      $set: {
        escrowCompleted: true,
        escrowDisputed: false,
        status: resolvedStatus,
      },
    },
    { session }
  );

  const Dispute = require('../models/Dispute');
  await Dispute.updateOne(
    { projectId, status: 'pending' },
    { $set: { status: 'resolved', winner: isClientWinner ? 'client' : 'freelancer' } },
    { session }
  );

  const sourceEventKey = buildBlockchainEventKey({
    chainId: verifiedEvent.chainId,
    contractAddress: verifiedEvent.contractAddress,
    transactionHash: verifiedEvent.transactionHash,
    logIndex: verifiedEvent.logIndex,
  });

  const existing = await SettlementEvent.findOne({ sourceEventKey }).session(session);
  if (!existing) {
    try {
      await recordSettlementAndOutbox({
        verifiedEvent,
        session,
        content: 'On-chain dispute was resolved by arbitrator.',
        extraFields: {
          amountUnits: verifiedEvent.amount ? verifiedEvent.amount.toString() : null,
        },
      });
      return 'MUTATED';
    } catch (err) {
      if (err.code === 11000) return 'ALREADY_PROCESSED';
      throw err;
    }
  }

  return result.modifiedCount === 1 ? 'MUTATED' : 'ALREADY_PROCESSED';
}

module.exports = {
  handleEscrowFunded,
  handleEscrowRefunded,
  handleRefundRequested,
  handleRefundCancelled,
  handleEscrowDisputed,
  handleDisputeResolved,
};
