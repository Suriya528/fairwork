// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IEscrow {
    function getEscrowParties(string calldata) external view returns(address,address,bool,bool,bool);
    function markDisputed(string calldata) external;
    function resolveDispute(string calldata,address) external;
}

contract DisputeContract is Ownable {
    enum DisputeStatus { Pending, Resolved }
    enum Winner { None, Client, Freelancer }

    struct Dispute {
        string projectId;
        address raisedBy;
        string reason;
        DisputeStatus status;
        Winner winner;
        uint256 createdAt;
    }

    mapping(string => Dispute) public disputes;
    address public immutable escrowContract;
    address public arbitrator;

    event DisputeRaised(string projectId, address indexed raisedBy, string reason);
    event DisputeResolvedByArbitrator(string projectId, address indexed winner);
    event ArbitratorUpdated(address indexed oldArbitrator, address indexed newArbitrator);

    constructor(address _escrowContract, address _arbitrator) Ownable(msg.sender) {
        require(_escrowContract != address(0), "Invalid escrow contract");
        require(_arbitrator != address(0), "Invalid arbitrator");
        escrowContract = _escrowContract;
        arbitrator = _arbitrator;
    }

    function setArbitrator(address newArbitrator) external onlyOwner {
        require(newArbitrator != address(0), "Invalid arbitrator");
        emit ArbitratorUpdated(arbitrator, newArbitrator);
        arbitrator = newArbitrator;
    }

    function raiseDispute(string calldata projectId, string calldata reason) external {
        (address c, address f, bool funded, bool disputed, bool completed) = IEscrow(escrowContract).getEscrowParties(projectId);
        require(c != address(0) && funded && !disputed && !completed, "Escrow unavailable");
        require(msg.sender == c || msg.sender == f, "Not authorized");
        require(disputes[projectId].raisedBy == address(0), "Dispute exists");
        disputes[projectId] = Dispute(projectId, msg.sender, reason, DisputeStatus.Pending, Winner.None, block.timestamp);
        IEscrow(escrowContract).markDisputed(projectId);
        emit DisputeRaised(projectId, msg.sender, reason);
    }

    function resolveByArbitrator(string calldata projectId, Winner winner) external {
        require(msg.sender == arbitrator, "Not authorized");
        Dispute storage d = disputes[projectId];
        require(d.raisedBy != address(0) && d.status == DisputeStatus.Pending, "Dispute unavailable");
        require(winner == Winner.Client || winner == Winner.Freelancer, "Invalid winner");
        d.status = DisputeStatus.Resolved;
        d.winner = winner;
        (address c, address f,,,) = IEscrow(escrowContract).getEscrowParties(projectId);
        address target = winner == Winner.Client ? c : f;
        IEscrow(escrowContract).resolveDispute(projectId, target);
        emit DisputeResolvedByArbitrator(projectId, target);
    }

    function getDisputeStatus(string calldata projectId) external view returns(DisputeStatus, Winner, uint256) {
        Dispute storage d = disputes[projectId];
        return (d.status, d.winner, d.createdAt);
    }
}
