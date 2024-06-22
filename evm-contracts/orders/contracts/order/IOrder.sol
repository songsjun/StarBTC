// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "../interfaces/IZKPOrder.sol";

enum OrderType {
    BORROW,
    LEND
}

struct TaprootTransaction {
    bytes32 wTxId;
    bytes32 txId;
}

struct MerkleProofData {
    bytes32[] proof;
    bytes32 root;
    bytes32 leaf;
    bool[] flags;
}

enum OrderStatus {
    CREATED, // Initial state
    TAKEN, // A taker has agreed to make the deal (borrower or lender, depending on order type)
    BORROWER_PROOF_SUBMITTED, // The borrower has supposedly locked the BTC and has submitted a proof (not yet verified)
    BORROWER_PAYMENT_CONFIRMED, // Lender has manually confirmed that the lock script has received lender's BTC transfer
    BORROWED, // The borrower BTC lock proof has been verified and tokens have been transfered to the borrower. Now waiting for repayment.
    REPAID, // Borrower has repaid the borrowed tokens. Lender has not confirmed
    LENDER_PROOF_SUBMITTED, // After token repayment, the lender or the proof service have confirmed that the repayment was done (ZKP proof verified)
    LENDER_PAYMENT_CONFIRMED, // Borrower has manually confirmed that the lender has executed the unlock script so that his BTC have been unlocked and received.
    ARBITRATION_REQUESTED, // After a repayment, the borrower has made a call to the arbiter to solve a dispute. Now waiting for the arbiter to submit proofs.
    CLOSED // Final order state, nothing can happen after that
}

interface IOrder {
    event OrderTaken(address indexed orderId, string takerBtcAddress);
    event BorrowerBTCTransferProofSubmitted(
        address indexed orderId,
        bytes32 zkTxHash,
        OrderStatus status
    );
    event LenderBTCTransferProofSubmitted(
        address indexed orderId,
        bytes32 zkTxHash,
        OrderStatus status
    );
    event LenderBTCTransferManuallyConfirmed(address indexed orderId);
    event BorrowerBTCTransferManuallyConfirmed(address indexed orderId);
    event BorrowSuccessful(address indexed orderId);
    event RepaymentMade(
        address indexed orderId,
        uint256 interest,
        uint256 principal,
        bytes btcTxData,
        bytes signature
    );
    event ArbitrationRequested(address indexed orderId);
    event OrderClosed(address indexed orderId);

    /**
     * @dev Creates a borrow order.
     *
     * @param token The EVM address of the token to borrow.
     * @param amount The amount to borrow, in token ERC20 encoding.
     * @param durationDays The max number of days to borrow.
     * @param refundAddress The bitcoin refund address.
     * @param publicKey Borrower's bitcoin public key.
     * @param confirmPaymentTip lender confirm received the locked btc , then can received the reward
     */
    function createBorrowOrder(
        address token,
        uint256 amount,
        uint256 durationDays,
        string calldata refundAddress,
        bytes calldata publicKey,
        uint256 confirmPaymentTip
    ) external;

    /**
     * @dev Creates a lending order.
     *
     * @param token The EVM address of the token to lend.
     * @param amount The amount to lend, in token ERC20 encoding.
     * @param duration The max duration of the loan in days.
     * @param addressType Lender's bitcoin address type (P2SH, etc).
     * @param publicKey Lender's bitcoin public key.
     * @param confirmPaymentTip borrower confirm received the unlock btc , then can received the reward
     */
    function createLendOrder(
        address token,
        uint256 amount,
        uint256 duration,
        AddressType addressType,
        bytes calldata publicKey,
        uint256 confirmPaymentTip
    ) external;

    /**
     * @dev Take an order, meaning that the taker becomes the order maker's counterpart. After taking an order,
     * it becomes mandatory to repay.
     *
     * @param btcAddress Taker's bitcoin address.
     * @param publicKey Taker's bitcoin public key.
     * @param preImageHash sha256 hash of the secret preImage that the taker keeps for himself for now, and that is used to unlock the BTC tokens later on.
     * @param network Bitcoin network to use. "mainnet" or "testnet"
     * @param confirmPaymentTip lender confirm received the lock btc , then can received the reward
     */
    function takeOrder(
        string calldata btcAddress,
        bytes calldata publicKey,
        bytes32 preImageHash,
        string memory network,
        uint256 confirmPaymentTip
    ) external;

    /**
     * @dev The borrower, or any third party, submits the proof that the BTC transfer expected from the borrower to
     * the lender has been successfully completed on the bitcoin chain. When this method is called, this submits a ZKP
     * verification request so that this contract can verify the BTC transfer validity afterwards before letting
     * the borrower claim the lent tokens.
     *
     * @param txData Bitcoin transaction raw data.
     * @param utxos Raw bitcoin data (hex) of every transaction represented by current transaction's UTXO (this tx -> list of utxos -> utxo.txid -> tx data -> hex code)
     * @param blockHeight Bitcoin block height at which the BTC transfer ahs been mined.
     * @param merkleProof Merkle proof data required to ensure this transaction belongs to the target block.
     */
    function submitToLenderTransferProof(
        bytes calldata txData,
        bytes[] calldata utxos,
        uint32 blockHeight,
        MerkleProofData calldata merkleProof
    ) external;

    /**
     * @dev The lender, or any third party, submits the proof that the BTC transfer expected from the lender to
     * the unlock script address (regular unlock signed by borrower and lender) has been successfully completed
     * on the bitcoin chain. When this method is called, this submits a ZKP verification request so that this
     * contract can verify the BTC transfer validity afterwards before letting the lender retrieve his lent tokens.
     *
     * @param txData The raw data of the Bitcoin transaction.
     * @param utxos The UTXOs.
     * @param blockHeight The Bitcoin block height.
     * @param merkleProof The Merkle proof.
     */
    function submitRegularUnlockTransferProof(
        bytes calldata txData,
        bytes[] calldata utxos,
        uint32 blockHeight,
        MerkleProofData calldata merkleProof
    ) external;

    /**
     * @dev The lender manually confirms the borrower's bitcoin transfer to the unlock script. This method
     * makes the flow faster by avoiding ZKP verification. As a result, the lender gets a bonus amount for this manual
     * confirmation that helps both parties. If this method is called, submitBorrowerTransferProof() does not need to be called.
     * @param wTxId the unlock btc transaction wTxId, don't contain the witness
     * @param btcTxId the transfer to lender btc transaction id;
     */
    function confirmTransferToLender(bytes32 wTxId, bytes32 btcTxId) external;

    /**
     * @dev The borrower manually confirms that the lender has unlocked his BTC by calling the unlock script. This method
     * makes the flow faster by avoiding ZKP verification. As a result, the borrower gets a bonus amount for this manual
     * confirmation that helps both parties. If this method is called, submitLenderTransferProof() does not need to be called.
     * @param wTxId the unlock btc transaction wTxId, don't contain the witness
     * @param btcTxId the unlock btc transaction id;
     */
    function confirmRegularUnlockTransfer(bytes32 wTxId, bytes32 btcTxId) external;

    /**
     * @dev Transfers the lent tokens to the borrower. This method must be called either after confirmTransferToLender(),
     * or after submitBorrowerTransferProof()+ZKP verified.
     *
     * @param preImage  Secret preImage initially generated by the borrower. This preImage is used by the lender to unlock the BTCs after his timelock.
     */
    function borrow(bytes calldata preImage) external;

    /**
     * @dev Lets the borrower repay the EVM tokens he previously borrowed. The unlock script raw data is passed to make sure
     * both the lender and the borrower sign the same raw transaction to unlock tokens. At the same time, the borrower signs that
     * transaction and his signature is saved. After that, the lender is able to sign the same transaction and publish it to unlock
     * the borrowser's BTCs.
     *
     * @param btcRawData The raw data of the Bitcoin transaction.
     * @param signature Borrower signature of the bitcoint raw transaction.
     */
    function repay(bytes calldata btcRawData, bytes memory signature) external;

    /**
     * @dev Closes the order, making it finalized and not usable forever. This method can be called by different
     * parties (borrower, lender) and while in different states (created, taken, repaid...) but the outcome depends on
     * many criteria checked by the contract. In the main use case where this method is called by the order maker after
     * the other party has repaid his part, this returns tokens to the order maker.
     */
    function closeOrder() external;

    /**
     * @dev Gets the status of the borrower's bitcoin transaction ZKP proof request.
     * This status changes when submitToLenderTransferProof() has been called, while
     * the third party ZKP verification status is running.
     *
     * @return The ZKP proof status.
     */
    function getToLenderTransferZkpStatus() external view returns (ProofStatus);

    /**
     * @dev Gets the status of the lender's bitcoin transaction ZKP proof request.
     * This status changes when submitRegularUnlockTransferProof() has been called, while
     * the third party ZKP verification status is running.
     *
     * @return The ZKP proof status.
     */
    function getRegularUnlockTransferZkpStatus()
    external
    view
    returns (ProofStatus);

    /**
     * @dev Requests arbitration.
     *
     * TODO: What exactly happens here?
     */
    function requestArbitration(
        bytes memory btcRawData,
        bytes memory signature
    ) external;

    /**
     * @dev the cost when call requestArbitration; the decimal is 18
     *
     */
    function getArbitrationRequestCost() external view returns(uint256);

    /**
     * @dev Checks if the arbitration proof is valid.
     *
     * TODO: What exactly happens here?
     *
     * @return True if the arbitration proof is valid, false otherwise.
     */
    function isArbitrationProofValid() external view returns (bool);

    function collateralAmount() external view returns(uint256);
}
