// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract EscrowContract is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Milestone { uint256 amount; bool released; }
    struct Escrow {
        address client; address freelancer; address token; uint256 totalAmount; uint256 releasedAmount;
        bool isFunded; bool isDisputed; bool isCompleted; Milestone[] milestones;
    }
    mapping(string => Escrow) public escrows;
    address public disputeContract;

    event EscrowCreated(string indexed projectId, address indexed client, address indexed freelancer, address token, uint256 totalAmount);
    event EscrowFunded(string indexed projectId, address indexed client, uint256 amount);
    event MilestoneReleased(string indexed projectId, uint256 milestoneIndex, address indexed freelancer, uint256 amount);
    event EscrowRefunded(string indexed projectId, address indexed client, uint256 amount);
    event EscrowDisputed(string indexed projectId);
    event DisputeResolved(string indexed projectId, address indexed winner, uint256 amount);

    // OpenZeppelin 5 is pinned by this repository; it requires an explicit owner.
    constructor() Ownable(msg.sender) {}
    modifier onlyDisputeContract() { require(msg.sender == disputeContract, "Only dispute contract"); _; }

    function createEscrow(string calldata projectId, address freelancer, address token, uint256[] calldata milestoneAmounts) external whenNotPaused {
        require(bytes(projectId).length > 0, "Project ID required");
        require(milestoneAmounts.length > 0, "Milestones required");
        require(freelancer != address(0) && freelancer != msg.sender, "Invalid freelancer");
        require(token != address(0) && token.code.length > 0, "Invalid token");
        require(escrows[projectId].client == address(0), "Escrow exists");
        Escrow storage escrow = escrows[projectId];
        escrow.client = msg.sender; escrow.freelancer = freelancer; escrow.token = token;
        for (uint256 i; i < milestoneAmounts.length; ++i) {
            require(milestoneAmounts[i] > 0, "Invalid milestone amount");
            escrow.totalAmount += milestoneAmounts[i];
            escrow.milestones.push(Milestone({amount: milestoneAmounts[i], released: false}));
        }
        emit EscrowCreated(projectId, msg.sender, freelancer, token, escrow.totalAmount);
    }
    function fund(string calldata projectId) external nonReentrant whenNotPaused {
        Escrow storage e = escrows[projectId];
        require(e.client != address(0), "Escrow missing"); require(msg.sender == e.client, "Only client"); require(!e.isFunded, "Already funded");
        e.isFunded = true; IERC20(e.token).safeTransferFrom(msg.sender, address(this), e.totalAmount);
        emit EscrowFunded(projectId, msg.sender, e.totalAmount);
    }
    function releaseMilestone(string calldata projectId, uint256 index) external nonReentrant whenNotPaused {
        Escrow storage e = escrows[projectId];
        require(e.client != address(0), "Escrow missing"); require(msg.sender == e.client, "Only client"); require(e.isFunded, "Not funded"); require(!e.isDisputed && !e.isCompleted, "Escrow unavailable");
        require(index < e.milestones.length && !e.milestones[index].released, "Invalid milestone");
        Milestone storage m = e.milestones[index]; m.released = true; e.releasedAmount += m.amount; if (e.releasedAmount == e.totalAmount) e.isCompleted = true;
        IERC20(e.token).safeTransfer(e.freelancer, m.amount); emit MilestoneReleased(projectId, index, e.freelancer, m.amount);
    }
    function refund(string calldata projectId) external nonReentrant whenNotPaused {
        Escrow storage e = escrows[projectId]; require(e.client != address(0), "Escrow missing"); require(msg.sender == e.client, "Only client"); require(e.isFunded && !e.isDisputed && !e.isCompleted, "Escrow unavailable");
        uint256 amount = e.totalAmount - e.releasedAmount; e.isCompleted = true; IERC20(e.token).safeTransfer(e.client, amount); emit EscrowRefunded(projectId, e.client, amount);
    }
    function markDisputed(string calldata projectId) external onlyDisputeContract whenNotPaused {
        Escrow storage e = escrows[projectId]; require(e.client != address(0), "Escrow missing"); require(e.isFunded && !e.isCompleted && !e.isDisputed, "Escrow unavailable"); e.isDisputed = true; emit EscrowDisputed(projectId);
    }
    function resolveDispute(string calldata projectId, address winner) external nonReentrant onlyDisputeContract whenNotPaused {
        Escrow storage e = escrows[projectId]; require(e.client != address(0), "Escrow missing"); require(e.isDisputed, "Not disputed"); require(winner == e.client || winner == e.freelancer, "Invalid winner");
        uint256 amount = e.totalAmount - e.releasedAmount; e.releasedAmount = e.totalAmount; e.isCompleted = true; e.isDisputed = false; IERC20(e.token).safeTransfer(winner, amount); emit DisputeResolved(projectId, winner, amount);
    }
    function getEscrowParties(string calldata projectId) external view returns (address client, address freelancer, bool isFunded, bool isDisputed, bool isCompleted) { Escrow storage e = escrows[projectId]; return (e.client, e.freelancer, e.isFunded, e.isDisputed, e.isCompleted); }
    function getBalance(string calldata projectId) external view returns (uint256) { Escrow storage e = escrows[projectId]; return e.totalAmount - e.releasedAmount; }
    function setDisputeContract(address _disputeContract) external onlyOwner { require(disputeContract == address(0), "Dispute contract set"); require(_disputeContract != address(0), "Invalid dispute contract"); disputeContract = _disputeContract; }
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
