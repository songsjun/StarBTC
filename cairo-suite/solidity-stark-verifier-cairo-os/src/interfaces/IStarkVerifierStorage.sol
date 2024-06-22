// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

interface IStarkVerifierStorage {
    enum AddressType {
        EMPTY,
        P2PK,
        P2PKH,
        P2MS,
        P2SH,
        P2WPKH,
        P2WSH,
        P2TR
    }
    struct TxIn {
        bytes32 txid;
        uint256 amount;
    }

    struct TxOut {
        AddressType txType;
        bytes addr;
        uint256 amount;
    }

    enum ProofStatus {
        OK,
        InvalidScript
    }
    enum VerifyStatus {
        toBeVerified,
        verified,
        verifyFailed
    }

    struct VerifiedTransactionDetails {
        bytes32 wtxid;
        bytes32 txid;
        ProofStatus status;
        bytes proverAddress;
        TxIn[] inputs;
        TxOut[] outputs;
        bytes script;
        VerifyStatus verifyStatus;
    }
}
