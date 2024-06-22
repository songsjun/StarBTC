// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

import "./interfaces/IAssetOracle.sol";
import "./utils/MyMath.sol";
import "./IInterest.sol";
import "hardhat/console.sol";

contract Interest is OwnableUpgradeable, IInterest {
    using Math for uint256;
    uint256 public decimalAdjustment;
    uint256 collateralFactor;
    uint256 public base;
    uint256 public btcPrecision;

    address public btc;
    address public assetOracle;

    ///@custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    function initialize() initializer public virtual {
        __Ownable_init(msg.sender);
        base = 10995;
        btcPrecision = 1e8;
        collateralFactor = 78;
        decimalAdjustment = 1e18;
        btc = 0xDF4191Bfe8FAE019fD6aF9433E8ED6bfC4B90CA1;
        assetOracle = 0x5117b046517ffA18d4d9897090D0537fF62A844A;
    }

    function GetLoanLimit(uint256 satoshiCount) external view returns(uint256) {
        //Loan Limit = [BTC AMOUNT] *[BTC PRICE] * [COLLATERAL FACTOR]
        uint256 price;
        uint256 limit;
        bool ok;

        uint256 btcPrice = this.getAssetPrice(btc);
        (ok, price) = satoshiCount.tryMul(btcPrice);
        require(ok, "priceMulError");
        (ok, limit) = price.tryMul(collateralFactor);
        require(ok, "limitMulError");
        (ok,limit) = limit.tryDiv(decimalAdjustment * 100);
        require(ok, "limitDivError");
        return limit;
    }

    function GetCollateralAmount(address token, uint256 tokenAmount, uint256 interest) external view returns(uint256) {
        //COLLATERAL_AMOUNT = ([LOAN_AMOUNT] + [INTEREST]) * [TOKEN_PRICE] / ([BTC PRICE] * [COLLATERAL FACTOR] )
       uint256 collateralAmount;
        bool ok;
        uint256 totalAmount;
        uint256 totalPrice;
        uint256 factorBtcPrice;
        (ok, totalAmount) = tokenAmount.tryAdd(interest);
        require(ok, "TotalAmountError");
        uint256 tokenPrice = this.getAssetPrice(token)/decimalAdjustment;
        if (tokenPrice == 0 ){
            return collateralAmount;
        }

        (ok, totalAmount) = totalAmount.tryMul(decimalAdjustment);
        require(ok, "AdjustTotalAmountError");
//
        (ok, totalPrice) = totalAmount.tryMul(tokenPrice);
        require(ok, "TotalPriceError");
        uint256 btcPrice = this.getAssetPrice(btc);

        (ok, factorBtcPrice) = btcPrice.tryMul(collateralFactor);
        require(ok, "FactorBtcPriceError");
        (ok, collateralAmount) = totalPrice.tryDiv(factorBtcPrice);
        require(ok, "CollateralAmountError");
        (ok, collateralAmount) = collateralAmount.tryMul(100);
        require(ok, "AmountMulError");
        return  collateralAmount * btcPrecision / decimalAdjustment;
    }

    function GetInterestRate(uint256 limitedDays) external view returns(uint256) {
        require(limitedDays >= 1, "DaysToSmall");
        uint256 exponent = (limitedDays -1 ) / 7;
        uint256 result = 1 ether;
        uint256 baseValue = base;
        while(exponent > 0) {
            if(exponent % 2 == 1) {
                result =  (result * baseValue) / 10000;
            }
            baseValue = baseValue * baseValue / 10000;
            exponent /= 2 ;
        }

        return result/100;
    }

    function GetInterestValue(uint256 seedAmount, uint256 interestRate) external pure returns(uint256) {
        require(interestRate > 0, "InterestRateMustBiggerThan0");
        bool ok;
        uint256 value;
        (ok,value) = seedAmount.tryMul(interestRate);
        require(ok,"MulError");
//        (ok, value) = value.tryDiv(100);
//        require(ok, "DivError");
        return value;
    }

    function getAssetPrice(address asset) external view returns(uint256) {
        //TODO delete this
        if(block.chainid != 20 && asset == 0xDF4191Bfe8FAE019fD6aF9433E8ED6bfC4B90CA1) {//btc
            return 70000000000000000000000;
        } else if (block.chainid == 21 && asset == 0x892A0c0951091A8a072A4b652926D4A8875F9bcB) {//usdt
            return 1000000000000000000;
        } else if(block.chainid == 21 && asset == 0x517E9e5d46C1EA8aB6f78677d6114Ef47F71f6c4) {//ela
            return 2691927811995680256;
         }
        if (block.chainid == 100 && asset == 0xA06be0F5950781cE28D965E5EFc6996e88a8C141) {//usdc
            return 1000316939678619776;
        }

        if (block.chainid != 20 && asset == 0xBA2D8B770d540124a4fD2cC319CB50629921f901) {//usdc
            return 1000316939678619776;
        }

        if (block.chainid == 100 && asset == 0x0daddd286487f3a03Ea9A1b693585fD46cdCcF9F) {//usdt
            return 1000000000000000000;
        }

        return IAssetOracle(assetOracle).assetPrices(asset);
    }

    function setBtcAddress(address _btc) external onlyOwner {
        btc = _btc;
        emit SetBtcAddress(_btc);
    }

    function setAssetOracle(address _oracle) external onlyOwner {
        assetOracle = _oracle;
        emit SetAssetOracle(_oracle);
    }

    function setCollateralFactor(uint256 _collateralFactory) external onlyOwner {
        collateralFactor = _collateralFactory;
        emit SetCollateralFactory(collateralFactor);
    }

    function setDecimalAdjustment(uint256 _adjust) external onlyOwner {
        decimalAdjustment = _adjust;
        emit SetDecimalAdjustment(_adjust);
    }

    function setBase(uint256 _base) external onlyOwner {
        base = _base;
        emit SetBaseEvent(_base);
    }
}
