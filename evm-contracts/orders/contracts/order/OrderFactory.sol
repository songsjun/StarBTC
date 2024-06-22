// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./IOrderFactory.sol";
import "./Order.sol";
import "./OrderProxy.sol";

import "hardhat/console.sol";

contract OrderFactory is IOrderFactory, OwnableUpgradeable {
    constructor(){
    }

    function initialize() initializer public {
        __Ownable_init(msg.sender);
    }

    function createOrder(
        address _loanTools,
        uint256 _takenExpireTime,
        uint256 _submitProofExpireTime,
        uint256 _repaidExpireTime,
        uint256 _proofedDelayBlock,
        address _arbitrationPayee,
        uint256 _lockTime1,
        uint256 _lockTime2
    ) external returns(address) {
        Order order = new Order();
        OrderProxy proxy = new OrderProxy {value:0}(
            address(order),
            abi.encodeWithSelector(
                Order.initialize.selector,
                _loanTools,
                _takenExpireTime,
                _submitProofExpireTime,
                _repaidExpireTime,
                _proofedDelayBlock,
                _arbitrationPayee,
                _lockTime1,
                _lockTime2
            ),
            owner()
        );
        return address(proxy);
    }
}
