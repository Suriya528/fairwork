// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ReputationContract {

    struct Rating {
        address reviewer;
        address reviewee;
        string projectId;
        uint8 score;
        string comment;
        uint256 timestamp;
    }

    // wallet address => all ratings received
    mapping(address => Rating[]) public ratings;

    // projectId => already rated (prevent double rating)
    mapping(string => mapping(address => bool)) public hasRated;

    event RatingSubmitted(
        string projectId,
        address reviewer,
        address reviewee,
        uint8 score
    );

    function submitRating(
        string memory projectId,
        address reviewee,
        uint8 score,
        string memory comment
    ) external {
        require(score >= 1 && score <= 5, "Score must be 1-5");
        require(!hasRated[projectId][msg.sender], "Already rated");
        require(msg.sender != reviewee, "Cannot rate yourself");

        ratings[reviewee].push(Rating({
            reviewer: msg.sender,
            reviewee: reviewee,
            projectId: projectId,
            score: score,
            comment: comment,
            timestamp: block.timestamp
        }));

        hasRated[projectId][msg.sender] = true;

        emit RatingSubmitted(projectId, msg.sender, reviewee, score);
    }

    function getReputation(address user)
        external
        view
        returns (uint256 average, uint256 totalReviews)
    {
        Rating[] memory userRatings = ratings[user];
        totalReviews = userRatings.length;

        if (totalReviews == 0) return (0, 0);

        uint256 total = 0;
        for (uint256 i = 0; i < totalReviews; i++) {
            total += userRatings[i].score;
        }

        average = (total * 100) / totalReviews;
        return (average, totalReviews);
    }

    function getRatingCount(address user) external view returns (uint256) {
        return ratings[user].length;
    }
}