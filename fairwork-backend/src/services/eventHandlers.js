const Project = require('../models/Project.js');

async function handleEscrowFunded({ verifiedEvent, onChainEscrowState, session }) {
  const { projectId, transactionHash } = verifiedEvent;
  const result = await Project.updateOne(
    { _id: projectId, escrowFunded: { $ne: true } },
    { $set: { escrowFunded: true, escrowTxnHash: transactionHash, status: 'in_progress' } },
    { session }
  );
  return result.modifiedCount === 1 ? 'MUTATED' : 'ALREADY_PROCESSED';
}

async function handleEscrowRefunded({ verifiedEvent, session }) {
  const { projectId } = verifiedEvent;
  const result = await Project.updateOne(
    { _id: projectId, escrowCompleted: { $ne: true } },
    { $set: { escrowCompleted: true, status: 'completed' } },
    { session }
  );
  return result.modifiedCount === 1 ? 'MUTATED' : 'ALREADY_PROCESSED';
}

async function handleRefundRequested({ verifiedEvent, session }) {
  const { projectId } = verifiedEvent;
  const result = await Project.updateOne(
    { _id: projectId, refundRequested: { $ne: true } },
    { $set: { refundRequested: true, refundRequestedAt: new Date() } },
    { session }
  );
  return result.modifiedCount === 1 ? 'MUTATED' : 'ALREADY_PROCESSED';
}

async function handleRefundCancelled({ verifiedEvent, session }) {
  const { projectId } = verifiedEvent;
  const result = await Project.updateOne(
    { _id: projectId, refundRequested: true },
    { $set: { refundRequested: false }, $unset: { refundRequestedAt: '' } },
    { session }
  );
  return result.modifiedCount === 1 ? 'MUTATED' : 'ALREADY_PROCESSED';
}

async function handleEscrowDisputed({ verifiedEvent, session }) {
  const { projectId } = verifiedEvent;
  const result = await Project.updateOne(
    { _id: projectId, status: { $ne: 'disputed' } },
    { $set: { status: 'disputed', refundRequested: false }, $unset: { refundRequestedAt: '' } },
    { session }
  );
  return result.modifiedCount === 1 ? 'MUTATED' : 'ALREADY_PROCESSED';
}

async function handleDisputeResolved({ verifiedEvent, onChainEscrowState, session }) {
  const { projectId } = verifiedEvent;
  const result = await Project.updateOne(
    { _id: projectId, escrowCompleted: { $ne: true } },
    { $set: { escrowCompleted: true, status: 'completed' } },
    { session }
  );
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
