// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface ILoanScript {
    function getScript(
        bytes memory borrowerPublicKey,
        bytes memory lenderPublicKey,
        bytes memory arbiterPublicKey,
        uint256 lockTime1,
        uint256 lockTime2,
        bytes32 preImageHash
    ) external pure returns(bytes memory);
}
