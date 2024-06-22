// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./ILoanScript.sol";

import {Bytes} from "../utils/Bytes.sol";
import {MyMath} from "../utils/MyMath.sol";
import {Memory} from "../utils/Memory.sol";

contract LoanScript is OwnableUpgradeable, ILoanScript {
    ///@custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    function initialize() initializer public virtual {
        __Ownable_init(msg.sender);
    }

    function getScript(
        bytes memory borrowerPublicKey,
        bytes memory lenderPublicKey,
        bytes memory arbiterPublicKey,
        uint256 lockTime1,
        uint256 lockTime2,
        bytes32 preImageHash
    ) external pure returns(bytes memory) {
        bytes memory script = hex"6321";
        script = Bytes.concat(script, borrowerPublicKey);
        script = Bytes.concat(script, hex"ad21");
        script = Bytes.concat(script, lenderPublicKey);
        script = Bytes.concat(script, hex"ac676321");
        script = Bytes.concat(script, borrowerPublicKey);
        script = Bytes.concat(script, hex"ad21");
        script = Bytes.concat(script, arbiterPublicKey);
        script = Bytes.concat(script, hex"ac676303");
        bytes memory lockTime = MyMath.toBytes(lockTime1);
        script = Bytes.concat(script, lockTime);
        script = Bytes.concat(script, hex"b27521");
        script = Bytes.concat(script, lenderPublicKey);
        script = Bytes.concat(script, hex"ada820");
        script = Bytes.concat(script, Bytes.toBytes(preImageHash));
        script = Bytes.concat(script, hex"876703");
        lockTime = MyMath.toBytes(lockTime2);
        script = Bytes.concat(script, lockTime);
        script = Bytes.concat(script, hex"b27521");
        script = Bytes.concat(script, borrowerPublicKey);
        script = Bytes.concat(script, hex"ac686868");
        return script;
    }
}
