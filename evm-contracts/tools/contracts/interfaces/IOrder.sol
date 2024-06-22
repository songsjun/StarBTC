// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

enum OrderType {
    BORROW,
    LEND
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

struct MerkleProofData {
    bytes32[] proof;
    bytes32 root;
    bytes32 leaf;
    bool[] flags;
}