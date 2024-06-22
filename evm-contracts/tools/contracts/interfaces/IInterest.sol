// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IInterest {
    event SetCollateralFactory(uint256 v);
    event SetDecimalAdjustment(uint256 adjust);
    event SetBaseEvent(uint256 v);
    event SetBtcAddress(address btcAddress);
    event SetAssetOracle(address oracle);

    function GetLoanLimit(uint256 satoshiCount) external view returns(uint256);
    function GetCollateralAmount(address token, uint256 tokenAmount, uint256 interest) external view returns(uint256);
    function GetInterestRate(uint256 limitedDays) external view returns(uint256);
    function GetInterestValue(uint256 seedAmount, uint256 interestRate) external pure returns(uint256);

    function getAssetPrice(address asset) external view returns(uint256);

    function setCollateralFactor(uint256 _collateralFactory) external;
    function setBase(uint256 _base) external;
    function setDecimalAdjustment(uint256 _adjust) external;

    function setBtcAddress(address _btc) external;
    function setAssetOracle(address _oracle) external;
}
