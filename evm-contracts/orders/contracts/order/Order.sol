// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "../interfaces/ILoanTools.sol";
import "./IOrder.sol";
import {MyMath} from "../utils/MyMath.sol";
import {Bytes} from "../utils/Bytes.sol";

//import "hardhat/console.sol";

contract Order  is IOrder,Initializable, OwnableUpgradeable {
    address internal loanTools;

    OrderType public orderType;
    address public borrower;
    string public borrowerBtcAddress;
    bytes public borrowerPublicKey;

    address public token; // ERC20 token contract address
    uint256 public tokenAmount; // ERC20 token amount
    uint256 public limitedDays; // Loan duration in days

    address public lender;
    uint256 public interestRate; // 1e18 encoded
    uint256 public interestValue;//is a value , amount of tokens interest
    bytes public lenderPublicKey;
    AddressType public lenderAddressType;// lender's btc address type
    string public lenderBtcAddress;

    uint256 public collateralAmount;//The number of BTCs that need to be pledged

    uint256 public createTime; // The creation time of this order (Block timestamp (seconds))
    uint256 public takenTime; // The taken time of this order (Block timestamp (seconds))
    uint256 public borrowedTime; //The borrowing time for this order (Block timestamp (seconds))
    uint256 public borrowerRepaidTime; // Block timestamp (seconds) at which the borrower has repaid
    uint256 public borrowerProofTime; //The time when the borrower submits the proof （seconds）
    uint256 public lenderProofTime;//The time when the lender submits the proof （seconds）
    uint256 public proofedDelayBlock;//After the proof is passed, the number of Bitcoin blocks that need to be delayed

    uint256 public takenExpireTime; // Number of seconds the borrower has after taking an order, to submit the BTC transfer proof for verification
    uint256 public submitProofExpirationTime; // Number of seconds the borrower has after the borrow BTC payment has been made, to claim lender's tokens
    uint256 public repaidExpireTime; /// Time in seconds given to the lender unlock the BTC after the loan was repaid by the borrower When this time is elapsed, the borrower can request an arbitration

    uint256 public borrowerProofBlock; //Bitcoin height when borrower submits proof
    uint256 public lenderProofBlock;//Bitcoin height when lender submits proof

    TaprootTransaction public toLenderBtcTx; //Transfer to the lender's Bitcoin transaction，used to verify by zk
    TaprootTransaction public toBorrowerBtcTx;//Transfer to the borrower's Bitcoin transaction，used to verify by zk

    bytes32 public toLenderMerkleProofTx; //Transaction of Merkel's Proof of lender
    bytes32 public toBorrowerMerkleProofTx; //Transaction of Merkel's Proof of borrower

    uint256 public borrowerConfirmRewardsTips; //The borrower manually confirms the tip upon receiving Bitcoin，When the borrower manually confirms, transfer the funds
    uint256 public lenderConfirmRewardsTips;   //The lender manually confirms the tip upon receiving Bitcoin, Transfer funds when the borrower repays the loan

    bytes32 public preImageHash;// preImage on blow sha256 value
    bytes public preImage; // secret preImage from the borrower, provided at the time borrow() is called
    bytes public repaySignature; //  signature of the borrower after signing the unlock script tx
    bytes public repayBtcRawData; // Raw data from the borrower, stored to that the lender can retrieve it and publish the unlock btc tx using the same raw data as what the borrower signed.

    OrderStatus public status;
    string public network; // mainnet or testnet
    address public arbitrationPayee;// When requesting an arbitrator, the arbitrator's payment address
    bool internal lenderManuallyConfirmedBTCTransfer;//Whether the lender has manually confirmed borrower's BTC transfer to the lock script without ZKP processing
    uint256 public lockTime1; // Timelock for lender to unlock BTCs - Raw time in encoded format (encoding byte + encoded number of seconds by 512 groups)
    uint256 public lockTime2; // Timelock for borrower to unlock BTCs - Raw time in encoded format (encoding byte + encoded number of seconds by 512 groups)
    bytes public loanScript;// Lock script for staking Bitcoin, used to generate lender bitcoin addresses
    uint256 public borrowExpirationTime;//Number of seconds the borrower has to claim lender's tokens after lender manual confirmation
    uint256 public lenderManuallyConfirmBTCTime;// Lender manually confirms the time of receiving BTC (Block timestamp (seconds))
    function initialize(
        address _loanTools,
        uint256 _takenExpireTime,
        uint256 _submitProofExpireTime,
        uint256 _repaidExpireTime,
        uint256 _proofedDelayBlock,
        address _arbitrationPayee,
        uint256 _lockTime1,
        uint256 _lockTime2
    ) initializer public virtual {
        loanTools = _loanTools;
        takenExpireTime = _takenExpireTime;
        submitProofExpirationTime = _submitProofExpireTime;
        repaidExpireTime = _repaidExpireTime;
        proofedDelayBlock = _proofedDelayBlock;
        arbitrationPayee =_arbitrationPayee;
        lockTime1 = _lockTime1;
        lockTime2 = _lockTime2;
        borrowExpirationTime = _submitProofExpireTime;
        __Ownable_init(_arbitrationPayee);
    }

    function createBorrowOrder(
        address _token,
        uint256 _amount,
        uint256 _durationDays,
        string calldata _refundAddress,
        bytes calldata _publicKey,
        uint256 confirmPaymentTip
    ) external {
        require(token == address(0), "Created");
        orderType = OrderType.BORROW;

        borrower = tx.origin;
        token = _token;
        tokenAmount = _amount;
        limitedDays = _durationDays;
        borrowerBtcAddress = _refundAddress;
        borrowerPublicKey = _publicKey;
        createTime = block.timestamp;
        status = OrderStatus.CREATED;
        if (_durationDays < 1) {
            _durationDays = 1;
        }
        interestRate = ILoanTools(loanTools).getInterestRate(_durationDays);
        uint256 adjustAmount = ILoanTools(loanTools).getAdjustedAmount(token, tokenAmount);
        uint256 decimals = IERC20Metadata(token).decimals();
        interestValue = ILoanTools(loanTools).getInterestValue(adjustAmount, interestRate)/1e18;
        collateralAmount = ILoanTools(loanTools).getCollateralAmount(token, adjustAmount, interestValue);
        if (decimals < 18) {
            uint256 unit = MyMath.safePower(10, (18 - decimals));
            interestValue = interestValue/unit;
        } else if (decimals > 18) {
            uint256 unit = MyMath.safePower(10, (decimals - 18));
            interestValue = interestValue*unit;
        }
        lenderConfirmRewardsTips = confirmPaymentTip;

        calcLockTime();
    }

    function calcLockTime() private {
        lockTime1 =  ((limitedDays * 3600 * 24 + lockTime1)/ uint256(512)) | (1 << 22);
        lockTime2 = ((limitedDays * 3600 * 24 + lockTime2) / uint256(512)) | (1 << 22);
    }

    function createLendOrder(
        address _token,
        uint256 _amount,
        uint256 _duration,
        AddressType _addressType,
        bytes calldata _publicKey,
        uint256 confirmPaymentTip
    ) external {
        require(token == address(0), "Created");
        orderType = OrderType.LEND;
        lender = tx.origin;
        token = _token;
        tokenAmount = _amount;
        limitedDays = _duration;
        lenderPublicKey = _publicKey;
        lenderAddressType = _addressType;
        createTime = block.timestamp;
        status = OrderStatus.CREATED;
        if (_duration < 1) {
            _duration = 1;
        }
        interestRate = ILoanTools(loanTools).getInterestRate(_duration);
        uint256 adjustAmount = ILoanTools(loanTools).getAdjustedAmount(token, tokenAmount);
        uint256 decimals = IERC20Metadata(token).decimals();
        interestValue = ILoanTools(loanTools).getInterestValue(adjustAmount, interestRate)/1e18;
        collateralAmount = ILoanTools(loanTools).getCollateralAmount(token, adjustAmount, interestValue);
        if (decimals < 18) {
            uint256 unit = MyMath.safePower(10, (18 - decimals));
            interestValue = interestValue/unit;
        } else if (decimals > 18) {
            uint256 unit = MyMath.safePower(10, (decimals - 18));
            interestValue = interestValue*unit;
        }
        borrowerConfirmRewardsTips = confirmPaymentTip;

        calcLockTime();
    }

    function takeOrder(string calldata btcAddress,
        bytes calldata publicKey,
        bytes32 preimageHash,
        string memory net,
        uint256 confirmPaymentTip
    ) external {
        require(bytes(btcAddress).length > 0, "BtcAddress");
        require(status == OrderStatus.CREATED, "ErrorStatus");
        address sender = tx.origin;
        if (orderType == OrderType.BORROW) {
            lenderPublicKey = publicKey;
            lender = sender;
            IERC20Metadata(token).transferFrom(
                sender,
                address(this),
                tokenAmount
            );
            borrowerConfirmRewardsTips = confirmPaymentTip;
        } else if (orderType == OrderType.LEND) {
            borrowerBtcAddress = btcAddress;
            borrower = sender;
            borrowerPublicKey = publicKey;
            lenderConfirmRewardsTips = confirmPaymentTip;
        }
        preImageHash = preimageHash;

        loanScript = getLoanScript();
        lenderBtcAddress = ILoanTools(loanTools).getSegWitAddress(loanScript, net);
        takenTime = block.timestamp;
        network = net;
        status = OrderStatus.TAKEN;
        emit OrderTaken(address(this), btcAddress);
    }

    function submitToLenderTransferProof(
        bytes memory txData,
        bytes[] memory utxos,
        uint32 blockHeight,
        MerkleProofData calldata merkleProof
    ) external {
        checkSubmitter(borrower);
        BlockHeader memory header = ILoanTools(loanTools).checkMerkleRoot(
            blockHeight,
            merkleProof.root,
            merkleProof.proof,
            merkleProof.leaf,
            merkleProof.flags
        );
        toLenderMerkleProofTx = merkleProof.leaf;
        bytes32 txID = ILoanTools(loanTools).addZKPProof(txData, utxos, borrowerBtcAddress, loanScript);
        if (status == OrderStatus.TAKEN) {
            if (block.timestamp - takenTime < takenExpireTime) {
                borrowerProofTime = block.timestamp;
                borrowerProofBlock = header.height;
                status = OrderStatus.BORROWER_PROOF_SUBMITTED;
            }
        }
        toLenderBtcTx.wTxId = txID;
        toLenderBtcTx.txId = merkleProof.leaf;
        emit BorrowerBTCTransferProofSubmitted(address(this), txID, status);
    }

    function submitRegularUnlockTransferProof(
        bytes memory txData,
        bytes[] memory utxos,
        uint32 blockHeight,
        MerkleProofData calldata merkleProof
    ) external {
        checkSubmitter(lender);
        BlockHeader memory header = ILoanTools(loanTools).checkMerkleRoot(
            blockHeight,
            merkleProof.root,
            merkleProof.proof,
            merkleProof.leaf,
            merkleProof.flags
        );
        toBorrowerMerkleProofTx = merkleProof.leaf;
        bytes memory script = bytes("");
        bytes32 txID = ILoanTools(loanTools).addZKPProof(txData, utxos, lenderBtcAddress, script);
        if (status == OrderStatus.REPAID) {
            if (block.timestamp - borrowerRepaidTime <  repaidExpireTime) {
                lenderProofTime = block.timestamp;
                lenderProofBlock = header.height;
                status = OrderStatus.LENDER_PROOF_SUBMITTED;
            }
        }
        toBorrowerBtcTx.wTxId = txID;
        toBorrowerBtcTx.txId = merkleProof.leaf;
        emit LenderBTCTransferProofSubmitted(address(this),  txID, status);
    }

    function getToLenderTransferZkpStatus() external view returns (ProofStatus) {
        return ILoanTools(loanTools).getOrderStatus(toLenderBtcTx.wTxId);
    }

    function getRegularUnlockTransferZkpStatus() external view returns (ProofStatus) {
        return ILoanTools(loanTools).getOrderStatus(toBorrowerBtcTx.wTxId);
    }

    function isArbitrationProofValid() public view returns (bool) {
        ZKVeiryArguments memory arguments;
        arguments.btcTx = toLenderBtcTx.txId;
        arguments.network = network;
        arguments.script = loanScript;
        arguments.collateralAmount = collateralAmount;
        ILoanTools(loanTools).checkArbitrationProofValid(address(this), arguments);
        return true;
    }

    function confirmTransferToLender(bytes32 wTxId, bytes32 btcTxId) external {
        onlyLender();
        require(status >= OrderStatus.TAKEN && status < OrderStatus.BORROWER_PAYMENT_CONFIRMED, "ErrorStatus");
        if(status == OrderStatus.TAKEN) {
            lenderManuallyConfirmedBTCTransfer = true;
        }
        status = OrderStatus.BORROWER_PAYMENT_CONFIRMED;
        toLenderBtcTx.wTxId = wTxId;
        toLenderBtcTx.txId = btcTxId;
        lenderManuallyConfirmBTCTime = block.timestamp;
        emit LenderBTCTransferManuallyConfirmed(address(this));
    }

    function confirmRegularUnlockTransfer(bytes32 wTxId, bytes32 btcTxId) external {
        onlyBorrower();
        require(status >= OrderStatus.REPAID && status < OrderStatus.LENDER_PAYMENT_CONFIRMED, "ErrorStatus");

        status = OrderStatus.LENDER_PAYMENT_CONFIRMED;
        //transfer the tip
        if (borrowerConfirmRewardsTips > 0 ) {
            IERC20(token).transfer(borrower, borrowerConfirmRewardsTips);
        }
        toBorrowerBtcTx.wTxId = wTxId;
        toBorrowerBtcTx.txId = btcTxId;
        emit BorrowerBTCTransferManuallyConfirmed(address(this));
        this.closeOrder();
    }

    function borrow(bytes memory preimage) public {
        if (status == OrderStatus.BORROWER_PROOF_SUBMITTED) {
            require(
                block.timestamp - borrowerProofTime < submitProofExpirationTime,
                "Expired"
            );
            ZKVeiryArguments memory arguments;
            arguments.proofBlock = borrowerProofBlock;
            arguments.proofedDelayBlock = proofedDelayBlock;
            arguments.btcTx = toLenderBtcTx.wTxId;
            arguments.network = network;
            arguments.borrowerBtcAddress = borrowerBtcAddress;
            arguments.merkleProofTx = toLenderMerkleProofTx;
            arguments.script = loanScript;
            arguments.lenderBtcAddress = lenderBtcAddress;
            arguments.collateralAmount = collateralAmount;
            toLenderBtcTx.txId = ILoanTools(loanTools).checkToLenderZKPVerifyStatus(arguments);
        } else if (status == OrderStatus.BORROWER_PAYMENT_CONFIRMED) {
            require(
                block.timestamp - lenderManuallyConfirmBTCTime < borrowExpirationTime,
                "Expired"
            );
        } else {
            revert("ErrorStatus");
        }

        borrowedTime = block.timestamp;
        bytes32 hashValue = sha256(preimage);
        require(hashValue == preImageHash, "InvalidPreImage");
        preImage = preimage;
        status = OrderStatus.BORROWED;
        bool ok = IERC20Metadata(token).transfer(borrower, tokenAmount);
        require(ok, "TransferFailed");
        emit BorrowSuccessful(address(this));
    }

    function onlyLender() private view {
        require(tx.origin == lender, "NotLender");
    }

    function onlyBorrower() private view {
        require(tx.origin == borrower, "NotBorrower");
    }

    function repay(bytes calldata btcRawData, bytes memory signature) external {
        onlyBorrower();
        require(status ==  OrderStatus.BORROWED, "ErrorStatus");
        uint256 totalAmount = tokenAmount + interestValue;
        if (lenderManuallyConfirmedBTCTransfer) {
            totalAmount = totalAmount + lenderConfirmRewardsTips;
        }
        transferTokenFrom(token, borrower, address(this), totalAmount);
        borrowerRepaidTime = block.timestamp;
        status = OrderStatus.REPAID;
        repaySignature = signature;
        repayBtcRawData = btcRawData;
        emit RepaymentMade(address(this), interestValue, tokenAmount, btcRawData, signature);
    }

    function isAbleRequestArbitrator() private view returns(bool) {
       if (status == OrderStatus.BORROWER_PROOF_SUBMITTED) {
            bool expired = ILoanTools(loanTools).isBorrowerProofExpired(
                toLenderBtcTx.wTxId,
                borrowerProofTime,
                submitProofExpirationTime,
                borrowerProofBlock,
                proofedDelayBlock
            );
           require(expired, "NoExpired");
           ProofStatus proofStatus = this.getToLenderTransferZkpStatus();
           return proofStatus == ProofStatus.verified;
        } else if(status == OrderStatus.LENDER_PROOF_SUBMITTED) {
           ProofStatus proofStatus = this.getRegularUnlockTransferZkpStatus();
           return proofStatus == ProofStatus.verifyFailed;
       } else if (status == OrderStatus.REPAID) {
            return block.timestamp - borrowerRepaidTime > repaidExpireTime;
       }
        return false;
    }

    function isBorrowerOrLender() private view returns(bool){
        if (tx.origin == borrower) {
            return true;
        }
        if (tx.origin == lender) {
            return true;
        }
        return false;
    }

    function requestArbitration(bytes memory btcRawData, bytes memory signature) external {
        require(isBorrowerOrLender(), "NoBorrowerOrLender");
        require(isAbleRequestArbitrator(), "Can'tRequest");
        bytes memory script = "";
        if (tx.origin == borrower) {
            script = loanScript;
        }

        (address costToken, uint256 costValue) = ILoanTools(loanTools).requestArbitration(
            btcRawData,
            signature,
            script,
            address(this)
        );
        transferTokenFrom(costToken, tx.origin, address(this), costValue);
        IERC20Metadata(costToken).transfer(arbitrationPayee, costValue);
        status = OrderStatus.ARBITRATION_REQUESTED;
        emit ArbitrationRequested(address(this));
    }

    function closeOrder() external {
        require(status != OrderStatus.CLOSED, "Closed");
        if (status == OrderStatus.CREATED) {
            require(ILoanTools(loanTools).isCreatorValid(orderType, borrower, lender), "InvalidCreator");
        }
        require(isCloseable(), "NotCloseable");
        uint256 balance = IERC20Metadata(token).balanceOf(address(this));
        if (balance > 0) {
            IERC20Metadata(token).transfer(lender, balance);
        }

        status = OrderStatus.CLOSED;
        emit OrderClosed(address(this));
    }

    function isCloseable() private returns (bool) {
        if (status == OrderStatus.TAKEN) {
            return block.timestamp - takenTime > takenExpireTime;
        } else if (status == OrderStatus.BORROWER_PROOF_SUBMITTED) {
            return ILoanTools(loanTools).isBorrowerProofExpired(
                toLenderBtcTx.wTxId,
                borrowerProofTime,
                submitProofExpirationTime,
                borrowerProofBlock,
                proofedDelayBlock
            );
        } else if (status == OrderStatus.LENDER_PROOF_SUBMITTED) {
            ZKVeiryArguments memory arguments;
            arguments.proofBlock = lenderProofBlock;
            arguments.proofedDelayBlock = proofedDelayBlock;
            arguments.btcTx = toBorrowerBtcTx.wTxId;
            arguments.network = network;
            arguments.borrowerBtcAddress = borrowerBtcAddress;
            arguments.merkleProofTx = toBorrowerMerkleProofTx;

            arguments.script = bytes("");
            arguments.lenderBtcAddress = lenderBtcAddress;
            arguments.collateralAmount = collateralAmount;
            toBorrowerBtcTx.txId = ILoanTools(loanTools).checkToBorrowerZKPVerifyStatus(arguments, toLenderBtcTx.txId);
            return ILoanTools(loanTools).isLenderProofExpired(
                toBorrowerBtcTx.wTxId,
                lenderProofTime,
                submitProofExpirationTime,
                lenderProofBlock,
                proofedDelayBlock
            );
        } else if (status == OrderStatus.BORROWED) {
            return block.timestamp - borrowedTime > limitedDays * 24 * 3600;
        } else if (status == OrderStatus.REPAID) {
            return block.timestamp - borrowerRepaidTime > repaidExpireTime;
        } else if (status == OrderStatus.ARBITRATION_REQUESTED) {
            return this.isArbitrationProofValid();
        } else if (status == OrderStatus.BORROWER_PAYMENT_CONFIRMED) {
            return block.timestamp - lenderManuallyConfirmBTCTime > borrowExpirationTime;
        } else if (status == OrderStatus.LENDER_PAYMENT_CONFIRMED) {
            return true;
        } else if(status == OrderStatus.CREATED) {
            return true;
        }
        return false;
    }

    function checkSubmitter(address trader) private view {
        if (tx.origin == trader) {
            return;
        }
        require(ILoanTools(loanTools).checkSubmitter(tx.origin),"NoPermission");
    }

    function getLoanScript() internal view returns(bytes memory) {
        if (Bytes.equals(borrowerPublicKey, bytes("")) || Bytes.equals(lenderPublicKey, bytes(""))) {
            return "";
        }

        return ILoanTools(loanTools).getLoanScript(
            borrowerPublicKey,
            lenderPublicKey,
            preImageHash,
            lockTime1,
            lockTime2);
    }

    function transferTokenFrom(address transferToken, address from, address to, uint256 value) private {
        uint256 currentAllowance = IERC20Metadata(transferToken).allowance(from, to);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= value, "NoAllowance");
        }
        bool ok = IERC20Metadata(transferToken).transferFrom(
            from,
            to,
            value
        );
        require(ok, "TransferFailed");
    }

    function getArbitrationRequestCost() external view returns(uint256) {
        return ILoanTools(loanTools).arbitrationCostValue();
    }
}
