// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import "../interfaces/IStarkVerifierStorage.sol";
import "forge-std/console.sol";

contract TransactionParser is IStarkVerifierStorage {
    string version;

    constructor() public {
        version = "0.1";
    }

    function parseTransaction(
        bytes calldata data
    ) public view returns (VerifiedTransactionDetails memory) {
        VerifiedTransactionDetails memory txDetails;
        uint256 pointer = 0;

        txDetails.status = ProofStatus(uint8(data[pointer]));
        pointer += 1;

        uint256 txidLen = bytesToUint(data[pointer:pointer + 4]);
        pointer += 4;

        txDetails.txid = bytes32(data[pointer:pointer + txidLen]);
        pointer += txidLen;

        uint256 inputsLen = bytesToUint(data[pointer:pointer + 4]);
        pointer += 4;

        uint256 outputsLen = bytesToUint(data[pointer:pointer + 4]);
        pointer += 4;

        uint256 inputsBytes = bytesToUint(data[pointer:pointer + 4]);
        pointer += 4;

        txDetails.inputs = parseInputs(
            data[pointer:pointer + inputsBytes],
            inputsLen
        );
        pointer += inputsBytes;

        uint256 outputsBytes = bytesToUint(data[pointer:pointer + 4]);
        pointer += 4;

        txDetails.outputs = parseOutputs(
            data[pointer:pointer + outputsBytes],
            outputsLen
        );
        pointer += outputsBytes;

        uint256 addrLen = bytesToUint(data[pointer:pointer + 4]);
        pointer += 4;
        txDetails.proverAddress = 
            data[pointer:pointer + addrLen];
        pointer += addrLen;

        uint256 scriptLen = bytesToUint(data[pointer:pointer + 4]);
        pointer += 4;
        txDetails.script = data[pointer:pointer + scriptLen];
        pointer += scriptLen;

        uint256 wtxidLen = bytesToUint(data[pointer:pointer + 4]);
        pointer += 4;

        txDetails.wtxid = bytes32(data[pointer:pointer + wtxidLen]);

        return txDetails;
    }

    function parseInputs(
        bytes calldata data,
        uint256 txNum
    ) private view returns (TxIn[] memory) {
        TxIn[] memory inputs = new TxIn[](txNum);
        uint256 index = 0;
        for (uint256 i = 0; i < data.length; ) {
            uint256 txinLen = bytesToUint(data[i:i + 4]);
            i += 4;
            uint256 wtxid_len = bytesToUint(data[i:i + 4]);
            inputs[index].txid = bytes32(data[i + 4:i + 4 + wtxid_len]);
            inputs[index].amount = bytesToUint(
                data[i + 4 + wtxid_len:i + 4 + wtxid_len + 8]
            );
            i += txinLen;
            index += 1;
        }

        return inputs;
    }

    function parseOutputs(
        bytes calldata data,
        uint256 outputsNum
    ) private view returns (TxOut[] memory) {
        TxOut[] memory outputs = new TxOut[](outputsNum);
        uint256 index = 0;
        for (uint256 i = 0; i < data.length; ) {
            uint256 outputLen = bytesToUint(data[i:i + 4]);
            //console.log("outputLen", outputLen);
            i += 4;
            outputs[index].txType = AddressType(uint8(data[i]));
            //console.log(uint8(data[i]));
            uint256 addressLen = bytesToUint(data[i + 1:i + 5]);
            outputs[index].addr = data[i + 5:i + 5 + addressLen];
            //console.logAddress(outputs[index].addr);
            outputs[index].amount = bytesToUint(
                data[i + 5 + addressLen:i + 5 + addressLen + 8]
            );
            //console.log(outputs[index].amount);

            i += outputLen;
            index += 1;
        }

        return outputs;
    }

    //little
    function bytesToUint(bytes calldata b) private pure returns (uint256) {
        uint256 number;
        for (uint256 i = 0; i < b.length; i++) {
            number = number + uint256(uint8(b[i])) * (256 ** i);
        }
        return number;
    }
}
