// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;


interface IOrderFactory {
    function createOrder(
        address _loanTools,
        uint256 _takenExpireTime,
        uint256 _submitProofExpireTime,
        uint256 _repaidExpireTime,
        uint256 _proofedDelayBlock,
        address _arbitrationPayee,
        uint256 _lockTime1,
        uint256 _lockTime2
    ) external returns(address);
}
