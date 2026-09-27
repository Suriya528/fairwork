// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IEscrowReentrantTarget {
    function releaseMilestone(string calldata projectId, uint256 index) external;
    function refund(string calldata projectId) external;
}

/**
 * @title MaliciousReentrantToken
 * @notice Hostile ERC-20 token that hooks into transfer() to execute a reentrant call
 *         back into EscrowContract before the initial transaction completes.
 */
contract MaliciousReentrantToken is ERC20 {
    address public attackTarget;
    string public attackProjectId;
    uint256 public attackMilestoneIndex;
    bool public shouldAttack;
    bool public attackAttempted;
    bytes public attackRevertData;

    constructor() ERC20("Malicious Token", "BAD") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function setAttackConfig(
        address _target,
        string calldata _projectId,
        uint256 _milestoneIndex
    ) external {
        attackTarget = _target;
        attackProjectId = _projectId;
        attackMilestoneIndex = _milestoneIndex;
        shouldAttack = true;
        attackAttempted = false;
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        if (shouldAttack && attackTarget != address(0)) {
            shouldAttack = false;
            attackAttempted = true;
            // Attempt cross-function or same-function reentrancy into EscrowContract
            (bool success, bytes memory data) = attackTarget.call(
                abi.encodeWithSelector(
                    IEscrowReentrantTarget.releaseMilestone.selector,
                    attackProjectId,
                    attackMilestoneIndex
                )
            );
            attackRevertData = data;
            // If the reentrancy attack succeeded, that would be a critical vulnerability.
            // When nonReentrant is working properly, success MUST be false.
            require(!success, "REENTRANCY_ATTACK_SUCCEEDED_VULNERABILITY_FOUND");
        }
        return super.transfer(to, amount);
    }
}
