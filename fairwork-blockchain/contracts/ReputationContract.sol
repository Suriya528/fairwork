// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IEscrowForReputation {
    function getEscrowParties(string calldata projectId) external view returns (
        address client, address freelancer, bool isFunded, bool isDisputed, bool isCompleted
    );
}

/**
 * @title ReputationContract
 * @notice On-chain reputation system for FairWork platform participants.
 * @dev C-4 FIX: Uses running totals (totalScore + ratingCount) instead of
 *      unbounded arrays to prevent gas-limit DoS on getReputation().
 *      Previous design stored Rating[] per user and iterated in a loop,
 *      which would exceed block gas limit after ~1000+ ratings.
 */
contract ReputationContract {
    IEscrowForReputation public immutable escrowContract;

    /// @dev Running aggregates per user — O(1) reads, no unbounded iteration
    mapping(address => uint256) public totalScore;
    mapping(address => uint256) public ratingCount;

    /// @dev Sybil guard: one rating per reviewer per project
    mapping(string => mapping(address => bool)) public hasRated;

    event RatingSubmitted(string projectId, address indexed reviewer, address indexed reviewee, uint8 score, string comment);

    constructor(address _escrowContract) {
        require(_escrowContract != address(0), "Invalid escrow contract");
        escrowContract = IEscrowForReputation(_escrowContract);
    }

    function submitRating(
        string memory projectId,
        address reviewee,
        uint8 score,
        string memory comment
    ) external {
        require(score >= 1 && score <= 5, "Score must be 1-5");
        require(!hasRated[projectId][msg.sender], "Already rated");
        require(msg.sender != reviewee, "Cannot rate yourself");

        // Access control: verify caller is a participant in a completed project
        (address client, address freelancer, , , bool isCompleted) = escrowContract.getEscrowParties(projectId);
        require(isCompleted, "Project not completed");
        require(msg.sender == client || msg.sender == freelancer, "Not a project participant");
        require(reviewee == client || reviewee == freelancer, "Reviewee not a participant");

        // O(1) aggregate update — no unbounded array push
        totalScore[reviewee] += score;
        ratingCount[reviewee] += 1;

        hasRated[projectId][msg.sender] = true;
        emit RatingSubmitted(projectId, msg.sender, reviewee, score, comment);
    }

    /**
     * @notice Returns the average reputation score (scaled by 100) and total review count.
     * @dev O(1) — reads two storage slots instead of iterating an unbounded array.
     *      Example: average=350 means 3.50 out of 5.00
     */
    function getReputation(address user) external view returns (uint256 average, uint256 totalReviews) {
        totalReviews = ratingCount[user];
        if (totalReviews == 0) return (0, 0);
        average = (totalScore[user] * 100) / totalReviews;
        return (average, totalReviews);
    }

    function getRatingCount(address user) external view returns (uint256) {
        return ratingCount[user];
    }
}