// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../interfaces/IStarkVerifier.sol";

contract MockStarkVerifier is IStarkVerifier {
    function checkProofIsValid(bytes32 rawDataHash) external pure returns (bool) {
        rawDataHash;
        return true;
    }

    function getTransaction(bytes32 hash, string memory network) external pure returns (
        bytes32,  //wtxid
        IStarkVerifier.Input[] memory,
        IStarkVerifier.Output[] memory,
        bytes memory, //script
        IStarkVerifier.VerifiedStatus
    ) {
        hash;network;

        IStarkVerifier.Input[] memory inputs = new IStarkVerifier.Input[](0);
        IStarkVerifier.Output[] memory outputs = new IStarkVerifier.Output[](0);

        return (hash, inputs, outputs, "0x6321020f8cb5261195d88c95a7", IStarkVerifier.VerifiedStatus.verified);
    }

    function getProvingDetail(bytes32 hash, string memory network) external pure returns (
        bytes32, //wtxid
        IStarkVerifier.ProvingStatus,
        string memory //proverAddress
    ) {
        hash;network;
        return (hash, IStarkVerifier.ProvingStatus.OK, "1FhNPRh1TxVidoKkWFEpdmK5RXw9vG1KUb");
    }
}
