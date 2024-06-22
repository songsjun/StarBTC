// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import {IProofSubmitters} from "../interfaces/IProofSubmitters.sol";

contract ProofSubmitters is OwnableUpgradeable, IProofSubmitters {

    mapping(address => bool) members;

    function initialize(address[] memory submitters) initializer public {
        __Ownable_init(msg.sender);
        for (uint i = 0; i < submitters.length; i++) {
            members[submitters[i]] = true;
        }
    }

    function addSubmitter(address account) external virtual override onlyOwner {
        if (!members[account]) {
            members[account] = true;
            emit SubmitterAdded(account);
        }
    }

    function removeSubmitter(address account) external virtual override onlyOwner {
        if (members[account]) {
            members[account] = false;
            emit SubmitterRemoved(account);
        }
    }

    function checkRole(address account) external view returns(bool) {
        return members[account];
    }

}
