// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./ILoanTools.sol";
import "./interfaces/IArbitrator.sol";
import "./interfaces/IProofSubmitters.sol";
import "./interfaces/ILoanScript.sol";
import "./interfaces/IInterest.sol";
import "./interfaces/IAssetOracle.sol";
import "./interfaces/IZKPOrder.sol";
import {Bech32} from "./lib/Bech32.sol";
import {BytesLib} from "./lib/BytesLib.sol";
import {MyMath} from "./lib/MyMath.sol";
import {MerkleProof} from "./lib/MerkleProof.sol";

// Uncomment this line to use console.log
 import "hardhat/console.sol";

contract LoanTools is OwnableUpgradeable, ILoanTools{
    using Strings for string;
    address public assetOracle;
    address public zkpOrder;
    address public btcHeaderData;
    address public proofSubmitter;
    address public btc;
    address public arbiter;
    address public interest;
    address public loanScript;
    address public confirmPaymentRewardsToken;
    address public costToken;
    uint256 public arbitrationCostValue;

    ///@custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    function initialize(
        address _assetOracle,
        address _zkpOrder,
        address _btcHeaderData,
        address _proofSubmitter,
        address _btc,
        address _interest,
        address _loanScript,
        address _arbiter,
        address _confirmPaymentRewardsToken,
        address _costToken,
        uint256 _arbitrationCostValue

    ) initializer public virtual {
        __Ownable_init(msg.sender);
        assetOracle = _assetOracle;
        zkpOrder = _zkpOrder;
        btcHeaderData = _btcHeaderData;
        proofSubmitter = _proofSubmitter;
        btc = _btc;
        interest = _interest;
        loanScript = _loanScript;
        arbiter = _arbiter;
        costToken = _costToken;
        arbitrationCostValue = _arbitrationCostValue;
        confirmPaymentRewardsToken = _confirmPaymentRewardsToken;
    }

    function requestArbitration(
        bytes memory _btcTxToSign,
        bytes memory _signature,
        bytes memory lockScript,
        address _orderId
    ) external returns(address, uint256) {
        require(arbiter != address(0), "Arbiter");
        bytes32 queryID = getArbitratorQueryID(_orderId);
        IArbitrator(arbiter).requestArbitration(_btcTxToSign, _signature, lockScript, queryID);
        return (costToken, arbitrationCostValue);
    }

    function transferTokenFrom(address token, address from, address to, uint256 value) external {
        uint256 currentAllowance = IERC20Metadata(token).allowance(from, to);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= value, "InsufficientAllowance");
        }
        bool ok = IERC20Metadata(token).transferFrom(
            from,
            to,
            value
        );
        require(ok, "TransferFailed");
    }

    function checkArbitrationProofValid(address orderID, ZKVeiryArguments memory arguments) external view {
        bytes32 queryID = getArbitratorQueryID(orderID);
        IArbitrator.ArbitrationData memory arbitrationData = IArbitrator(arbiter).getArbitrationData((queryID));

        (,ProvingStatus provingStatus,
        string memory prover) = IArbitrator(arbiter).getProvingDetail(queryID, arguments.network);
        require(Strings.equal(prover, arbitrationData.prover), "ErrorProver");
        require(provingStatus == ProvingStatus.OK, "InvalidScript");

        (bytes32 btcTxId,Input[] memory inputs,
        ,
        bytes memory scriptHash,
        ProofStatus proofStatus) =  IArbitrator(arbiter).getArbitrationDetails(queryID,arguments.network);
        require(btcTxId == arbitrationData.merkleProof.leaf, "checkLeafError");
        if (proofStatus == ProofStatus.verifyFailed) {
            revert("ZKVerifyFailed");
        }
        if (proofStatus == ProofStatus.toBeVerified) {
            revert("ZKVerifying");
        }

        if (!BytesLib.equal(scriptHash, bytes(""))) {
            bytes memory selfScriptHash = BytesLib.toBytes(sha256(arguments.script));
            require(BytesLib.equal(selfScriptHash, scriptHash), "ErrorScript");
        }

        uint256 lockAmount = 0;
        for(uint256 i = 0; i < inputs.length; i++) {
            if (arguments.btcTx == inputs[i].txid) {
                lockAmount = lockAmount + inputs[i].amount;
            }
        }
        require(lockAmount >= arguments.collateralAmount, "ErrorInput");
    }

    /**
     *Convert the order ID to the ID of the requesting arbitrator
     */
    function getArbitratorQueryID(address orderID) private pure returns(bytes32) {
        bytes32 id = bytes32(uint256(uint160(orderID)));
        return id;
    }

    function getArbitratorPublicKey() external view returns(bytes memory) {
        return IArbitrator(arbiter).getArbitratorPublicKey();
    }

    function checkMerkleRoot(
        uint32 blockHeight,
        bytes32 merkleRoot,
        bytes32[] memory proof,
        bytes32 leaf,
        bool[] memory positions
    ) external view returns(BlockHeader memory) {
        BlockHeader memory header = IBtcBlockHeaders(btcHeaderData).getBlockByHeight(blockHeight);
        require(header.merkleRoot == merkleRoot, "MerkleRoot");

        bytes32 root = MerkleProof.getBitCoinMerkleRoot(
            proof,
            leaf,
            positions);
        require(root == merkleRoot, "MerkleFailed");

        return header;
    }

    function addZKPProof(
        bytes memory rawData,
        bytes[] memory utxos,
        string memory prover,
        bytes memory script
    ) external returns(bytes32) {
       return IZKPOrder(zkpOrder).addTransaction(rawData, utxos, prover, script);
    }
    function getOrderStatus(bytes32 hash) external view returns(ProofStatus) {
        return IZKPOrder(zkpOrder).getOrderStatus(hash);
    }

    function getOrderDetails(bytes32 hash, string memory network) external view returns (
        bytes32,  //wtxid
        Input[] memory,
        Output[] memory,
        bytes memory, //script
        ProofStatus
    ) {
        require(hash != bytes32(0), "txIdIsNull");
        return IZKPOrder(zkpOrder).getOrderDetails(hash, network);
    }

    function getProvingDetail(bytes32 hash, string memory network) external view returns (
        bytes32, //wtxid
        ProvingStatus,
        string memory //proverAddress
    ) {
        return IZKPOrder(zkpOrder).getProvingDetail(hash, network);
    }

    function checkSubmitter(address trader) external view returns (bool) {
        return IProofSubmitters(proofSubmitter).checkRole(trader);
    }

    function getLoanScript(
        bytes memory borrowerPublicKey,
        bytes memory lenderPublicKey,
        bytes32 preImageHash,
        uint256 lockTime1,
        uint256 lockTime2
    ) external view returns(bytes memory) {
        require(loanScript != address(0),"NoLoanScript");

        bytes memory arbitrator = IArbitrator(arbiter).getArbitratorPublicKey();
        return ILoanScript(loanScript).getScript(
            borrowerPublicKey,
            lenderPublicKey,
            arbitrator,
            lockTime1,
            lockTime2,
            preImageHash
        );
    }

    function getLoanLimit(uint256 satoshiCount) external view returns(uint256) {
        return IInterest(interest).GetLoanLimit(satoshiCount);
    }

    function getCollateralAmount(address token, uint256 tokenAmount, uint256 interestValue) external view returns(uint256) {
        return IInterest(interest).GetCollateralAmount(token, tokenAmount, interestValue);
    }

    function getInterestRate(uint256 limitedDays) external view returns(uint256) {
        return IInterest(interest).GetInterestRate(limitedDays);
    }

    function getInterestValue(uint256 seedAmount, uint256 interestRate) external view returns(uint256) {
        return IInterest(interest).GetInterestValue(seedAmount, interestRate);
    }

    function getSegWitAddress(bytes memory script, string memory network) external pure returns(string memory) {
        bytes memory hrp = new bytes(2);
        if(network.equal("mainnet")) {
            hrp[0] = 'b';
            hrp[1] = 'c';
        } else {
            hrp[0] = 't';
            hrp[1] = 'b';
        }
        return segwitAddress(hrp, 0, sha256(script));
    }

    function segwitAddress(bytes memory hrp, uint8 version, bytes32 hash) public pure returns (string memory) {
        uint[] memory hrp_convert = BytesLib.bytesToUintArray(hrp);
        uint[] memory data = Bech32.convert(BytesLib.bytesToUintArray(abi.encodePacked(hash)), 8, 5);
        uint[] memory data_version = uintArrayInsertFirst(uint(version), data);
        bytes memory prefix = abi.encodePacked(hrp, '1');
        bytes memory segwitAddr = BytesLib.concat(prefix, Bech32.encode(hrp_convert, data_version));
        return string(segwitAddr);
    }

    function uintArrayInsertFirst(uint prefix, uint[] memory data) internal pure returns (uint[] memory) {
        uint[] memory array = new uint[](data.length + 1);
        array[0] = prefix;

        for (uint i = 1; i < array.length; i++) {
            array[i] = data[i - 1];
        }
        return array;
    }

    function setBTCDataAddress(address btcHeader) external onlyOwner {
        emit BTCHeaderDataChanged(btcHeaderData, btcHeader);
        btcHeaderData = btcHeader;
    }

    function getAssetPrice(address asset) external view returns(uint256) {
        return IAssetOracle(assetOracle).assetPrices(asset);
    }
    function setAssetOracle(address oracle) external onlyOwner {
        emit AssetOracleChanged(assetOracle, oracle);
        assetOracle = oracle;
    }
    function setZkpOrder(address zkpOrderAddress) external onlyOwner {
        emit ZKPOrderChanged(zkpOrder, zkpOrderAddress);
        zkpOrder = zkpOrderAddress;
    }

    function setInterestAddress(address interestAddress) external onlyOwner {
        emit InterestChanged(interest, interestAddress);
        interest = interestAddress;
    }

    function setProofSubmitter(address submitter) external onlyOwner {
        emit ProofSubmitter(proofSubmitter, submitter);
        proofSubmitter = submitter;
    }

    function setArbiterAddress(address arbiterAddress) external onlyOwner {
        emit ArbiterChanged(arbiter, arbiterAddress);
        arbiter = arbiterAddress;
    }

    function setLoanScriptAddress(address loanScriptAddress) external onlyOwner {
        emit LoanScriptChanged(loanScript, loanScriptAddress);
        loanScript = loanScriptAddress;
    }

    function lastBtcHeight() external view returns(uint256) {
        return IBtcBlockHeaders(btcHeaderData).lastHeight();
    }

    function getAdjustedAmount(address _token, uint256 _tokenAmount) external view returns(uint256) {
        uint256 priceDecimal = 18;
        uint256 tokenDecimal = IERC20Metadata(_token).decimals();
        uint256 adjusted;
        uint256 amount;
        uint256 power;

        if (tokenDecimal < priceDecimal) {
            adjusted = priceDecimal - tokenDecimal;
            power = MyMath.safePower(10, adjusted);
            amount = _tokenAmount * power;
        } else if (tokenDecimal > priceDecimal) {
            adjusted = tokenDecimal - priceDecimal;
            power = MyMath.safePower(10, adjusted);
            amount = _tokenAmount / power;
        } else {
            amount = _tokenAmount;
        }
        return amount;
    }

    function isCreatorValid(OrderType orderType, address borrower, address lender) external view returns (bool) {
        if (orderType == OrderType.BORROW) {
            return borrower == tx.origin;
        } else if (orderType == OrderType.LEND) {
            return lender == tx.origin;
        }
        return false;
    }

    function isBorrowerProofExpired(
        bytes32 toLenderBtcTx,
        uint256 borrowerProofTime,
        uint256 submitProofExpireTime,
        uint256 borrowerProofBlock,
        uint256 proofedDelayBlock) external view returns (bool) {
        ProofStatus zkStatus = this.getOrderStatus(toLenderBtcTx);
        if (zkStatus == ProofStatus.verified || zkStatus == ProofStatus.toBeVerified) {
            return block.timestamp - borrowerProofTime > submitProofExpireTime;
        }
        return this.lastBtcHeight() - borrowerProofBlock > proofedDelayBlock;
    }

    function isLenderProofExpired(
        bytes32 toBorrowerBtcTx,
        uint256 lenderProofTime,
        uint256 submitProofExpireTime,
        uint256 lenderProofBlock,
        uint256 proofedDelayBlock
    ) external view returns (bool) {
        ProofStatus zkStatus = this.getOrderStatus(toBorrowerBtcTx);
        if (zkStatus != ProofStatus.verified) {
            return block.timestamp - lenderProofTime > submitProofExpireTime;
        } else {
            return this.lastBtcHeight() - lenderProofBlock >= proofedDelayBlock;
        }
    }

    function checkToLenderZKPVerifyStatus(
        ZKVeiryArguments memory arguments
    ) external view returns (bytes32) {
        uint256 pass = this.lastBtcHeight() - arguments.proofBlock;
        require(pass >= arguments.proofedDelayBlock, "NoDelay");

        (,ProvingStatus provingStatus,
        string memory btcAddress) = this.getProvingDetail(arguments.btcTx, arguments.network);
        require(Strings.equal(btcAddress, arguments.borrowerBtcAddress), "ErrorBtcAddress");
        require(provingStatus == ProvingStatus.OK, "InvalidScript");

        (bytes32 btcTxId,,
        Output[] memory outputs,
        bytes memory scriptHash,
        ProofStatus proofStatus) = this.getOrderDetails(arguments.btcTx, arguments.network);
        require(btcTxId == arguments.merkleProofTx, "checkBtcTxIDError");
        if (proofStatus == ProofStatus.verifyFailed) {
            revert("ZKVerifyFailed");
        }
        if (proofStatus == ProofStatus.toBeVerified) {
            revert("ZKVerifying");
        }
        bytes memory selfScriptHash = BytesLib.toBytes(sha256(arguments.script));
        require(BytesLib.equal(selfScriptHash, scriptHash), "errorScript");

        uint256 buyAmount = 0;
        for(uint256 i = 0; i < outputs.length; i++) {
            if (Strings.equal(arguments.lenderBtcAddress, outputs[i].addr)) {
                buyAmount = buyAmount + outputs[i].amount;
            }
        }

        require(buyAmount >= arguments.collateralAmount, "btcNotEnough");
        return  btcTxId;
    }

    function checkToBorrowerZKPVerifyStatus(
        ZKVeiryArguments memory arguments,
        bytes32 toLenderBtcTx
    ) external view returns(bytes32) {
        uint256 pass = this.lastBtcHeight() - arguments.proofBlock;
        require(pass >= arguments.proofedDelayBlock, "NoDelay");

        (,ProvingStatus provingStatus,
        string memory btcAddress) = this.getProvingDetail(arguments.btcTx, arguments.network);
        require(Strings.equal(btcAddress, arguments.lenderBtcAddress), "ErrorBtcAddress");
        require(provingStatus == ProvingStatus.OK, "InvalidScript");

        (bytes32 btcTxId,Input[] memory inputs,
        ,
        bytes memory scriptHash,
        ProofStatus proofStatus) = this.getOrderDetails(arguments.btcTx,arguments.network);
        require(btcTxId == arguments.merkleProofTx, "checkBtcTxIDError");
        if (proofStatus == ProofStatus.verifyFailed) {
            revert("ZKVerifyFailed");
        }
        if (proofStatus == ProofStatus.toBeVerified) {
            revert("ZKVerifying");
        }

        if (!BytesLib.equal(scriptHash, bytes(""))) {
            bytes memory selfScriptHash = BytesLib.toBytes(sha256(arguments.script));
            require(BytesLib.equal(selfScriptHash, scriptHash), "ErrorScript");
        }

        uint256 lockAmount = 0;
        for(uint256 i = 0; i < inputs.length; i++) {
            if (toLenderBtcTx == inputs[i].txid) {
                lockAmount = lockAmount + inputs[i].amount;
            }
        }
        require(lockAmount >= arguments.collateralAmount, "ErrorInput");

        return btcTxId;
    }

    function setArbitrationCost(uint256 amount) external onlyOwner {
        arbitrationCostValue = amount;
        emit RequestArbitratorCost(arbitrationCostValue);
    }
}
