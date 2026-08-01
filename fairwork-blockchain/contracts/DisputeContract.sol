// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract DisputeContract {

    enum DisputeStatus { Pending, Resolved }
    enum Winner { None, Client, Freelancer }

    struct Dispute {
        string projectId;
        address client;
        address freelancer;
        address raisedBy;
        string reason;
        DisputeStatus status;
        Winner winner;
        uint256 clientVotes;
        uint256 freelancerVotes;
        uint256 createdAt;
    }

    // projectId => Dispute
    mapping(string => Dispute) public disputes;

    // projectId => voter => hasVoted
    mapping(string => mapping(address => bool)) public hasVoted;

    event DisputeRaised(string projectId, address raisedBy, string reason);
    event VoteCast(string projectId, address voter, Winner vote);
    event DisputeResolved(string projectId, Winner winner);

    function raiseDispute(
        string memory projectId,
        address client,
        address freelancer,
        string memory reason
    ) external {
        require(
            msg.sender == client || msg.sender == freelancer,
            "Not authorized"
        );
        require(disputes[projectId].raisedBy == address(0), "Dispute already exists");

        disputes[projectId] = Dispute({
            projectId: projectId,
            client: client,
            freelancer: freelancer,
            raisedBy: msg.sender,
            reason: reason,
            status: DisputeStatus.Pending,
            winner: Winner.None,
            clientVotes: 0,
            freelancerVotes: 0,
            createdAt: block.timestamp
        });

        emit DisputeRaised(projectId, msg.sender, reason);
    }

    function castVote(string memory projectId, Winner vote) external {
        Dispute storage dispute = disputes[projectId];

        require(dispute.raisedBy != address(0), "Dispute does not exist");
        require(dispute.status == DisputeStatus.Pending, "Dispute already resolved");
        require(!hasVoted[projectId][msg.sender], "Already voted");
        require(
            msg.sender != dispute.client && msg.sender != dispute.freelancer,
            "Parties cannot vote"
        );
        require(vote == Winner.Client || vote == Winner.Freelancer, "Invalid vote");

        hasVoted[projectId][msg.sender] = true;

        if (vote == Winner.Client) {
            dispute.clientVotes++;
        } else {
            dispute.freelancerVotes++;
        }

        emit VoteCast(projectId, msg.sender, vote);
    }

    function resolveByArbitrator(
        string memory projectId,
        Winner winner
    ) external {
        Dispute storage dispute = disputes[projectId];

        require(dispute.raisedBy != address(0), "Dispute does not exist");
        require(dispute.status == DisputeStatus.Pending, "Already resolved");
        require(winner != Winner.None, "Invalid winner");

        dispute.status = DisputeStatus.Resolved;
        dispute.winner = winner;

        emit DisputeResolved(projectId, winner);
    }

    function getDisputeStatus(string memory projectId)
        external
        view
        returns (DisputeStatus, Winner, uint256, uint256)
    {
        Dispute storage d = disputes[projectId];
        return (d.status, d.winner, d.clientVotes, d.freelancerVotes);
    }
}