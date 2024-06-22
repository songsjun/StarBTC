// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IPledge {
    event LoanToolsChanged(address indexed tools);
    event TakenExpireTimeChanged(uint256 time);
    event SubmitProofExpireTimeChanged(uint256 time);
    event RepaidExpireTimeChanged(uint256 time);
    event DelayBlockChanged(uint256 value);
    event LockTime1Changed(uint256 value);
    event LockTime2Changed(uint256 value);
    event OrderFactoryChanged(address indexed factory);

    function changeTakenExpireTime(uint256 time) external;
    function changeSubmitProofExpireTime(uint256 time) external;
    function changeRepaidExpireTime(uint256 time) external;
    function changeProofedDelayBlock(uint256 num) external;

    function getAssetPrice(address tokenAddress) external view returns(uint256);

    function setLockTime1(uint256 lockDaysInSeconds) external;
    function setLockTime2(uint256 lockDaysInSeconds) external;

    function setOrderFactory(address factory) external;
}
