// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

interface IStarkVerifierTransaction {
    enum AddrType {
        EMPTY,
        P2PK,
        P2PKH,
        P2MS,
        P2SH,
        P2WPKH,
        P2WSH,
        P2TR
    }
    struct Input {
        bytes32 txid;
        uint256 amount;
    }

    struct Output {
        AddrType txType;
        string addr;
        uint256 amount;
    }

    enum ProvingStatus {
        OK,
        InvalidScript
    }
    enum VerifiedStatus {
        toBeVerified,
        verified,
        verifyFailed
    }

    function getTransaction(
        bytes32 wtxid,
        string memory network
    )
        external
        view
        returns (
            bytes32,  //txid
            Input[] memory,
            Output[] memory,
            bytes memory, //script
            VerifiedStatus
        );

    function getProvingDetail(
        bytes32 wtxid,
        string memory network
    )
        external
        view
        returns (
            bytes32, //txid
            ProvingStatus,
            string memory //proverAddress
        );

    function checkProofIsValid(bytes32 wtxid) external view returns (bool);
}
