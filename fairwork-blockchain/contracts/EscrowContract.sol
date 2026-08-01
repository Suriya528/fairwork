// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract EscrowContract {

    // Every project has one escrow
    struct Escrow {
        address client;
        address freelancer;
        uint256 totalAmount;
        uint256 releasedAmount;
        bool isDisputed;
        bool isCompleted;
    }

    // projectId => Escrow
    mapping(string => Escrow) public escrows;

    // Events — logged on blockchain
    event FundsDeposited(string projectId, address client, uint256 amount);
    event FundsReleased(string projectId, address freelancer, uint256 amount);
    event DisputeRaised(string projectId, address raisedBy);
    event RefundIssued(string projectId, address client, uint256 amount);

    // Client deposits ETH into escrow
    function deposit(string memory projectId, address freelancer) external payable {
        require(msg.value > 0, "Must send ETH");
        require(escrows[projectId].client == address(0), "Escrow already exists");

        escrows[projectId] = Escrow({
            client: msg.sender,
            freelancer: freelancer,
            totalAmount: msg.value,
            releasedAmount: 0,
            isDisputed: false,
            isCompleted: false
        });

        emit FundsDeposited(projectId, msg.sender, msg.value);
    }

    // Client approves — releases ETH to freelancer
    function releaseFunds(string memory projectId) external {
        Escrow storage escrow = escrows[projectId];

        require(msg.sender == escrow.client, "Only client can release");
        require(!escrow.isDisputed, "Project is disputed");
        require(!escrow.isCompleted, "Already completed");

        uint256 amount = escrow.totalAmount - escrow.releasedAmount;
        escrow.releasedAmount = escrow.totalAmount;
        escrow.isCompleted = true;

        payable(escrow.freelancer).transfer(amount);

        emit FundsReleased(projectId, escrow.freelancer, amount);
    }

    // Client cancels before work starts — refund
    function refund(string memory projectId) external {
        Escrow storage escrow = escrows[projectId];

        require(msg.sender == escrow.client, "Only client can refund");
        require(!escrow.isCompleted, "Already completed");
        require(!escrow.isDisputed, "Project is disputed");

        uint256 amount = escrow.totalAmount - escrow.releasedAmount;
        escrow.isCompleted = true;

        payable(escrow.client).transfer(amount);

        emit RefundIssued(projectId, escrow.client, amount);
    }

    // Either party raises a dispute — freezes funds
    function raiseDispute(string memory projectId) external {
        Escrow storage escrow = escrows[projectId];

        require(
            msg.sender == escrow.client || msg.sender == escrow.freelancer,
            "Not authorized"
        );
        require(!escrow.isCompleted, "Already completed");

        escrow.isDisputed = true;

        emit DisputeRaised(projectId, msg.sender);
    }

    // Check escrow balance for a project
    function getBalance(string memory projectId) external view returns (uint256) {
        Escrow storage escrow = escrows[projectId];
        return escrow.totalAmount - escrow.releasedAmount;
    }
}