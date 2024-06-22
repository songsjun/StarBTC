// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "./order/Order.sol";
import "./Pledge.sol";
import "./interfaces/ILoanContract.sol";
import "./order/IOrderFactory.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract LoanContract  is OwnableUpgradeable, ILoanContract,Pledge {
    mapping(address => bool) internal orders;
    ///@custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    function initialize(address _loanTools, address _orderFactory) initializer public override {
        Pledge.initialize(_loanTools, _orderFactory);
    }

    function createBorrowOrder(
        address token,
        uint256 amount,
        uint256 durationDays,
        string memory btcAddress,
        bytes memory publicKey,
        uint256 confirmPaymentTip
    ) external {
        require(amount > 0, "amount");
//        require(durationDays > 0, "days");
        require(bytes(btcAddress).length > 0, "btcAddress");

        address order = IOrderFactory(orderFactory).createOrder(
            loanTools,
            takenExpireTime,
            submitProofExpireTime,
            repaidExpireTime,
            proofedDelayBlock,
            owner(),
            lockTime1,
            lockTime2
        );

        IOrder(order).createBorrowOrder(token, amount, durationDays, btcAddress, publicKey,confirmPaymentTip);
        orders[address(order)] = true;

        emit OrderCreated(order, OrderType.BORROW, IOrder(order).collateralAmount(), token, amount);
    }

    function transferTokenFrom(address transferToken, address from, address to, uint256 value) private {
        uint256 currentAllowance = IERC20Metadata(transferToken).allowance(from, to);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= value, "InsufficientAllowance");
        }
        bool ok = IERC20Metadata(transferToken).transferFrom(
            from,
            to,
            value
        );
        require(ok, "TransferFailed");
    }

    function createLendingOrder(
        address _token,
        uint256 _amount,
        uint256 _durationDays,
        AddressType _addressType,
        bytes memory _publicKey,
        uint256 confirmPaymentTip
    ) external {
        require(_amount > 0, "amountToSmall");
//        require(_durationDays > 0, "days");

        address order = IOrderFactory(orderFactory).createOrder(
            loanTools,
            takenExpireTime,
            submitProofExpireTime,
            repaidExpireTime,
            proofedDelayBlock,
            owner(),
            lockTime1,
            lockTime2
        );
        IOrder(order).createLendOrder(_token, _amount, _durationDays, _addressType, _publicKey,confirmPaymentTip);
        orders[order] = true;

        address sender = msg.sender;
        uint256 collateralAmount = IOrder(order).collateralAmount();
        uint256 limit =  ILoanTools(loanTools).getLoanLimit(collateralAmount * 1e8)/1e8;
        require(collateralAmount <= limit, "ToMuch");
//
        //transfer lend token
        transferTokenFrom(_token, sender, address(this), _amount);
        IERC20Metadata(_token).transfer(order, _amount);

        emit OrderCreated(order, OrderType.LEND, collateralAmount, _token, _amount);
    }
}
