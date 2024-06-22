// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./interfaces/IPledge.sol";
import "./interfaces/ILoanTools.sol";

abstract contract Pledge is OwnableUpgradeable, IPledge {
    address internal loanTools;
    address internal orderFactory;

    uint256 internal takenExpireTime;
    uint256 internal submitProofExpireTime;
    uint256 internal repaidExpireTime;
    uint256 internal proofedDelayBlock;
    uint256 internal lockTime1;
    uint256 internal lockTime2;

    ///@custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    function initialize(address _loanTools, address _orderFactory) initializer public virtual {
        __Ownable_init(msg.sender);
        loanTools = _loanTools;
        orderFactory = _orderFactory;
        takenExpireTime = 3600 * 24 * 2;
        submitProofExpireTime = 3600 * 24 * 2;
        repaidExpireTime = 3600 * 24 * 3;
        proofedDelayBlock = 1;
        lockTime1 = 8 * 3600 * 24;
        lockTime2 = 15 * 3600 * 24;
    }

    function SetLoanToolsAddress(address tools) external onlyOwner {
        emit LoanToolsChanged(tools);
        loanTools = tools;
    }

    function setLockTime1(uint256 lockDaysInSeconds) external onlyOwner{
        lockTime1 = lockDaysInSeconds;
        emit LockTime1Changed(lockTime1);
    }

    function setLockTime2(uint256 lockDaysInSeconds) external onlyOwner{
        lockTime2 = lockDaysInSeconds;
        emit LockTime2Changed(lockTime2);
    }

    function changeProofedDelayBlock(uint256 num) external onlyOwner {
        proofedDelayBlock = num;
        emit DelayBlockChanged(num);
    }

    function changeTakenExpireTime(uint256 time) external onlyOwner {
        takenExpireTime = time;
        emit TakenExpireTimeChanged(takenExpireTime);
    }

    function changeSubmitProofExpireTime(uint256 time) external onlyOwner {
        submitProofExpireTime = time;
        emit SubmitProofExpireTimeChanged(submitProofExpireTime);
    }

    function changeRepaidExpireTime(uint256 time) external onlyOwner {
        repaidExpireTime = time;
        emit RepaidExpireTimeChanged(repaidExpireTime);
    }

    function setOrderFactory(address factory) external onlyOwner {
        orderFactory = factory;
        emit OrderFactoryChanged(orderFactory);
    }

    function getAssetPrice(address tokenAddress) external view returns(uint256) {
        if(block.chainid == 21 && tokenAddress == 0x2aD066FBFeCaD8D06Af389A36cE1A4cFa4711443) {//btc
            return 620894442086912816;
        }
        if(block.chainid == 21 && tokenAddress == 0x892A0c0951091A8a072A4b652926D4A8875F9bcB) {//usdt
            return 1000000000000000000;
        }
        if(block.chainid == 21 && tokenAddress == 0x517E9e5d46C1EA8aB6f78677d6114Ef47F71f6c4) {//ela
            return 2691927811995680256;
        }
        if(block.chainid == 21) {
            return 0;
        }
        return ILoanTools(loanTools).getAssetPrice(tokenAddress);
    }
}
