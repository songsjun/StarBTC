// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "../order/IOrder.sol";
import "./IBtcBlockHeaders.sol";

interface ILoanContract {
    event OrderCreated(address indexed orderId, OrderType indexed orderType, uint256 collateral, address token, uint256 tokenAmount);
    function createBorrowOrder(
        address _token,
        uint256 _amount,
        uint256 _durationDays,
        string memory _btcAddress,
        bytes memory _publicKey,
        uint256 confirmPaymentTip
    ) external;

//    function createLendingOrder(
//        address _token,
//        uint256 _amount,
//        uint256 _durationDays,
//        AddressType _addressType,
//        bytes memory _publicKey,
//        uint256 confirmPaymentTip
//    ) external;

}
