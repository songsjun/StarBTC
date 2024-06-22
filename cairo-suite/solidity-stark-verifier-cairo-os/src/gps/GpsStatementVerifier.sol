// SPDX-License-Identifier: Apache-2.0.
pragma solidity >=0.6.12;

import "./CairoBootloaderProgram.sol";
import "../CairoVerifierContract.sol";
import "../MemoryPageFactRegistry.sol";
import "./Identity.sol";
import "../PrimeFieldElement0.sol";
import "./GpsOutputParser.sol";
import "../interfaces/IStarkVerifierStorage.sol";
import "../interfaces/IStarkVerifierTransaction.sol";
import "../utils/TransactionParser.sol";
import "../bech32/Bech32.sol";

contract GpsStatementVerifier is
    GpsOutputParser,
    Identity,
    CairoBootloaderProgramSize,
    PrimeFieldElement0,
    IStarkVerifierStorage,
    IStarkVerifierTransaction
{
    CairoBootloaderProgram bootloaderProgramContractAddress;
    MemoryPageFactRegistry memoryPageFactRegistry;
    CairoVerifierContract[] cairoVerifierContractAddresses;
    TransactionParser transactionParser;

    uint256 internal constant N_BUILTINS = 8;
    uint256 internal constant N_MAIN_ARGS = N_BUILTINS;
    uint256 internal constant N_MAIN_RETURN_VALUES = N_BUILTINS;

    bytes constant ALPHABET =
        "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    string internal constant MAINNET = "mainnet";
    string internal constant TESTNET = "testnet";
    // Cairo verifier program hash.
    uint256 immutable hashedSupportedCairoVerifiers_;
    // Simple bootloader program hash.
    uint256 immutable simpleBootloaderProgramHash_;

    bytes32 gwtxid;

    mapping(bytes32 => VerifiedTransactionDetails) private transactions;

    event TransactionStored(
        bytes32 indexed wtxid,
        ProofStatus status,
        TxIn[] inputs,
        TxOut[] outputs,
        bytes script,
        VerifyStatus verifyStatus
    );

    /*
      Constructs an instance of GpsStatementVerifier.
      bootloaderProgramContract is the address of the bootloader program contract
      and cairoVerifierContracts is a list of cairoVerifiers indexed by their id.
    */
    constructor(
        // address bootloaderProgramPart1Contract,
        address bootloaderProgramContract,
        address memoryPageFactRegistry_,
        address[] memory cairoVerifierContracts,
        uint256 hashedSupportedCairoVerifiers,
        uint256 simpleBootloaderProgramHash
    ) public {
        bootloaderProgramContractAddress = CairoBootloaderProgram(
            bootloaderProgramContract
        );
        // bootloaderProgramPart2ContractAddress = CairoBootloaderProgramPart2(
        //     bootloaderProgramPart2Contract
        // );
        memoryPageFactRegistry = MemoryPageFactRegistry(
            memoryPageFactRegistry_
        );
        cairoVerifierContractAddresses = new CairoVerifierContract[](
            cairoVerifierContracts.length
        );
        for (uint256 i = 0; i < cairoVerifierContracts.length; ++i) {
            cairoVerifierContractAddresses[i] = CairoVerifierContract(
                cairoVerifierContracts[i]
            );
        }
        transactionParser = new TransactionParser();
        hashedSupportedCairoVerifiers_ = hashedSupportedCairoVerifiers;
        simpleBootloaderProgramHash_ = simpleBootloaderProgramHash;
    }

    function identify() external pure override returns (string memory) {
        return "StarkWare_GpsStatementVerifier_2022_7";
    }

    /*
      Returns the bootloader config.
    */
    function getBootloaderConfig() external view returns (uint256, uint256) {
        return (simpleBootloaderProgramHash_, hashedSupportedCairoVerifiers_);
    }

    function getTransaction(
        bytes32 wtxid,
        string memory network
    )
        external
        view
        returns (
            bytes32,
            Input[] memory,
            Output[] memory,
            bytes memory, //script
            VerifiedStatus
        )
    {

        require(wtxid != bytes32(0), "Invalid wtxid");
        if (transactions[wtxid].wtxid == bytes32(0)) {
            // Transaction does not exist, return empty outputs
            Input[] memory emptyInput;
            Output[] memory emptyOutputs;
            return (wtxid, emptyInput , emptyOutputs, "", VerifiedStatus(0));
        }
        Output[] memory outputs = getOutputsAddress(
            transactions[wtxid].outputs,
            network
        );
        uint inputLen = transactions[wtxid].inputs.length;
        Input[] memory inputs = new Input[](inputLen);
        for(uint i = 0; i < inputLen; i++)
        {
            inputs[i] = Input(transactions[wtxid].inputs[i].txid, transactions[wtxid].inputs[i].amount);
        }

        console.log("getTransaction output length");
        console.log(transactions[wtxid].outputs.length);
        console.log(uint256(transactions[wtxid].outputs[0].txType));
        console.log(uint256(AddressType.P2PKH));
        
        return (
            transactions[wtxid].txid,
            inputs,
            outputs,
            transactions[wtxid].script,
            VerifiedStatus(uint(transactions[wtxid].verifyStatus))
        );
    }

        function getProvingDetail(
        bytes32 wtxid,
        string memory network
    )
        external
        view
        returns (
            bytes32, //wtxid
            ProvingStatus,
            string memory //proverAddress
        )
        {
            console.log("getProvingDetail");
            console.logBytes(transactions[wtxid].proverAddress);
        return (transactions[wtxid].txid, ProvingStatus(uint(transactions[wtxid].status)), string(abi.encodePacked(transactions[wtxid].proverAddress)));

        }

    function checkProofIsValid(bytes32 wtxid) external view returns (bool) {
        require(wtxid != bytes32(0), "Invalid wtxid");

        VerifiedTransactionDetails memory transaction = transactions[wtxid];
        return transaction.verifyStatus == VerifyStatus.verified;
    }

    function registerBitcoinTx(bytes calldata data) external {
        require(data.length > 0, "Bitcoin transaction is empty.");
        //TODO: Store the hash of txdata, will be checked in verifyProofAndRegister later

        VerifiedTransactionDetails memory tx = transactionParser
            .parseTransaction(data);
        console.log("registerBitcoinTx");
        console.logBytes32(tx.wtxid);
        console.logBytes32(tx.txid);
        console.logBytes(tx.proverAddress);
        console.logBytes(tx.script);
        gwtxid = tx.wtxid;

        addTransaction(
            tx.wtxid,
            tx.txid,
            tx.status,
            tx.proverAddress, //TODO
            tx.inputs,
            tx.outputs,
            tx.script,
            tx.verifyStatus
        );
    }

    /*
      Verifies a proof and registers the corresponding facts.
      For the structure of cairoAuxInput, see cpu/CpuPublicInputOffsets.sol.
      taskMetadata is structured as follows:
      1. Number of tasks.
      2. For each task:
         1. Task output size (including program hash and size).
         2. Program hash.
    */
    function verifyProofAndRegister(
        uint256[] calldata proofParams,
        uint256[] calldata proof,
        uint256[] calldata cairoAuxInput,
        uint256 cairoVerifierId,
        uint256[] calldata publicMemoryData
    ) external {
        require(
            cairoVerifierId < cairoVerifierContractAddresses.length,
            "cairoVerifierId is out of range."
        );
        CairoVerifierContract cairoVerifier = cairoVerifierContractAddresses[
            cairoVerifierId
        ];
        // The values z and alpha are used only for the fact registration of the main page.
        // They are not part of the public input of CpuVerifier as they are computed there.
        // Take the relevant slice from 'cairoAuxInput'.
        uint256[] calldata cairoPublicInput = (
            cairoAuxInput[:cairoAuxInput.length -
                // z and alpha.
                2]
        );

        uint256[] memory publicMemoryPages;
        {
            (
                uint256 publicMemoryOffset,
                uint256 selectedBuiltins
            ) = cairoVerifier.getLayoutInfo();
            require(
                cairoAuxInput.length > publicMemoryOffset,
                "Invalid cairoAuxInput length."
            );
            publicMemoryPages = (uint256[])(
                cairoPublicInput[publicMemoryOffset:]
            );
            uint256 nPages = publicMemoryPages[0];
            require(nPages < 10000, "Invalid nPages.");

            // Validate publicMemoryPages.length.
            // Each page has a page info and a cumulative product.
            // There is no 'page address' in the page info for page 0, but this 'free' slot is
            // used to store the number of pages.
            require(
                publicMemoryPages.length == nPages * (PAGE_INFO_SIZE + 1),
                "Invalid publicMemoryPages length."
            );
            // Process public memory.
            (
                uint256 publicMemoryLength,
                uint256 memoryHash,
                uint256 prod
            ) = registerPublicMemoryMainPage(
                    cairoAuxInput,
                    selectedBuiltins,
                    publicMemoryData
                );

            // Make sure the first page is valid.
            // If the size or the hash are invalid, it may indicate that there is a mismatch
            // between the prover and the verifier on the bootloader program or bootloader config.
            require(
                publicMemoryPages[PAGE_INFO_SIZE_OFFSET] == publicMemoryLength,
                "Invalid size for memory page 0."
            );
            require(
                publicMemoryPages[PAGE_INFO_HASH_OFFSET] == memoryHash,
                "Invalid hash for memory page 0."
            );
            require(
                publicMemoryPages[nPages * PAGE_INFO_SIZE] == prod,
                "Invalid cumulative product for memory page 0."
            );
        }

        // NOLINTNEXTLINE: reentrancy-benign.
        cairoVerifier.verifyProofExternal(
            proofParams,
            proof,
            (uint256[])(cairoPublicInput)
        );

        registerGpsFacts(
            publicMemoryPages,
            cairoAuxInput[OFFSET_OUTPUT_BEGIN_ADDR]
        );

        //bytes32 wtxid = wtxidFromPublicInputs(publicMemoryData);
        //Alex: TODO:

        updateTransactionStatus(gwtxid, VerifyStatus.verified);

    }

    function wtxidFromPublicInputs(
        uint256[] calldata publicMemoryData
    ) internal returns (bytes32) {
        uint256[] memory wtxidData = publicMemoryData[1:4];
        (bytes memory wtxid, uint256 _len) = deserializeBytes(wtxidData);
        return bytes32(wtxid);
        
    }

    uint256 constant CHUNK_SIZE = 252;

    function deserializeBytes(uint256[] memory serialized) internal pure returns (bytes memory, uint256) {
        if (serialized.length == 0) {
            return (new bytes(0), 0);
        }

        uint256 length = serialized[0];
        uint256 chunks = (length * 8 + CHUNK_SIZE - 1) / CHUNK_SIZE;

        bytes memory decodedBytes = new bytes(length);

        for (uint256 i = 0; i < chunks; i++) {
            uint256 chunk = serialized[i + 1];
            uint256 chunkSize = min(CHUNK_SIZE, length * 8 - i * CHUNK_SIZE);

            bytes memory b = new bytes(max(1, chunkSize / 8));
            uint256 bytesLength = b.length;

            for (uint256 j = 0; j < bytesLength; j++) {
                b[j] = bytes1(uint8(chunk >> (8 * (bytesLength - 1 - j))));
            }

            uint256 decodedBytesLength = decodedBytes.length;
            for (uint256 j = 0; j < bytesLength; j++) {
                if (i * bytesLength + j < decodedBytesLength) {
                    decodedBytes[i * bytesLength + j] = b[j];
                }
            }
        }

        return (decodedBytes, chunks);
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a : b;
    }

    function registerPublicMemoryMainPage(
        // uint256[] calldata taskMetadata,
        uint256[] calldata cairoAuxInput,
        uint256 selectedBuiltins,
        uint256[] calldata publicMemoryData
    )
        private
        returns (uint256 publicMemoryLength, uint256 memoryHash, uint256 prod)
    {
        uint256 nTasks = 0; //taskMetadata[0];
        // Ensure 'nTasks' is bounded as a sanity check (the bound is somewhat arbitrary).
        require(nTasks < 2 ** 30, "Invalid number of tasks.");

        //compute wtxid
        

        // Public memory length.
        publicMemoryLength = (PROGRAM_SIZE +
            2 +
            N_MAIN_ARGS +
            N_MAIN_RETURN_VALUES +
            publicMemoryData.length);
        uint256[] memory publicMemory = new uint256[](
            MEMORY_PAIR_SIZE * publicMemoryLength
        );

        uint256 offset = 0;

        // Write public memory, which is a list of pairs (address, value).
        {
            uint256[PROGRAM_SIZE]
                memory bootloaderProgram = bootloaderProgramContractAddress
                    .getCompiledProgram();
            for (uint256 i = 0; i < bootloaderProgram.length; i++) {
                publicMemory[offset] = i + INITIAL_PC;
                publicMemory[offset + 1] = bootloaderProgram[i];
                offset += 2;
            }
        }

        {
            // Execution segment - Make sure [initial_fp - 2] = initial_fp and .
            // This is required for the "safe call" feature (that is, all "call" instructions will
            // return, even if the called function is malicious).
            // It guarantees that it's not possible to create a cycle in the call stack.
            uint256 initialFp = cairoAuxInput[OFFSET_EXECUTION_BEGIN_ADDR];
            require(initialFp >= 2, "Invalid execution begin address.");
            publicMemory[offset + 0] = initialFp - 2;
            publicMemory[offset + 1] = initialFp;
            // Make sure [initial_fp - 1] = 0.
            publicMemory[offset + 2] = initialFp - 1;
            publicMemory[offset + 3] = 0;
            offset += 4;

            // Execution segment: Enforce main's arguments and return values.
            // Note that the page hash depends on the order of the (address, value) pair in the
            // publicMemory and consequently the arguments must be written before the return values.
            uint256 returnValuesAddress = cairoAuxInput[
                OFFSET_EXECUTION_STOP_PTR
            ] - N_BUILTINS;
            uint256 builtinSegmentInfoOffset = OFFSET_OUTPUT_BEGIN_ADDR;

            for (uint256 i = 0; i < N_BUILTINS; i++) {
                // Write argument address.
                publicMemory[offset] = initialFp + i;
                uint256 returnValueOffset = offset + 2 * N_BUILTINS;

                // Write return value address.
                publicMemory[returnValueOffset] = returnValuesAddress + i;

                if ((selectedBuiltins & 1) != 0) {
                    // Set the argument to the builtin start pointer.
                    publicMemory[offset + 1] = cairoAuxInput[
                        builtinSegmentInfoOffset
                    ];
                    // Set the return value to the builtin stop pointer.
                    publicMemory[returnValueOffset + 1] = cairoAuxInput[
                        builtinSegmentInfoOffset + 1
                    ];
                    builtinSegmentInfoOffset += 2;
                } else {
                    // Builtin is not present in layout, set the argument value and return value to 0.
                    publicMemory[offset + 1] = 0;
                    publicMemory[returnValueOffset + 1] = 0;
                }
                offset += 2;
                selectedBuiltins >>= 1;
            }
            require(
                selectedBuiltins == 0,
                "SELECTED_BUILTINS_VECTOR_IS_TOO_LONG"
            );
            // Skip the return values which were already written.
            offset += 2 * N_BUILTINS;
        }

        // Program output.
        {
            {
                uint256 outputAddress = cairoAuxInput[OFFSET_OUTPUT_BEGIN_ADDR];
                uint len = publicMemoryData.length;
                for(uint i = 0; i < len; i++)
                {
                    publicMemory[offset] = outputAddress + i;
                    offset++;
                    publicMemory[offset] = publicMemoryData[i];
                    offset++;

                }
                outputAddress += len;

                require(
                    cairoAuxInput[OFFSET_OUTPUT_STOP_PTR] == outputAddress,
                    "Inconsistent program output length."
                );
            }
        }

        require(
            publicMemory.length == offset,
            "Not all Cairo public inputs were written."
        );

        uint256 z = cairoAuxInput[cairoAuxInput.length - 2];
        uint256 alpha = cairoAuxInput[cairoAuxInput.length - 1];
        bytes32 factHash;
        (factHash, memoryHash, prod) = memoryPageFactRegistry
            .registerRegularMemoryPage(publicMemory, z, alpha, K_MODULUS);
    }

    function addTransaction(
        bytes32 wtxid,
        bytes32 txid,
        ProofStatus status,
        bytes memory proverAddress,
        TxIn[] memory inputs,
        TxOut[] memory outputs,
        bytes memory script,
        VerifyStatus verifyStatus
    ) private {
        require(wtxid != bytes32(0), "Invalid wtxid");
        require(inputs.length > 0, "No inputs provided");
        require(outputs.length > 0, "No outputs provided");

        VerifiedTransactionDetails storage existingTransaction = transactions[wtxid];

        if (existingTransaction.wtxid != bytes32(0)) {
            // Transaction already exists, update status
            updateTransactionStatus(wtxid, verifyStatus);
        } else {
            // Transaction does not exist, add new transaction
            VerifiedTransactionDetails storage newTransaction = transactions[wtxid];
            newTransaction.txid = txid;
            newTransaction.wtxid = wtxid;
            newTransaction.proverAddress = proverAddress;
            newTransaction.status = status;
            newTransaction.script = script;
            for (uint i = 0; i < inputs.length; i++) {
                newTransaction.inputs.push(TxIn(inputs[i].txid, inputs[i].amount));
            }
            for (uint i = 0; i < outputs.length; i++) {
                newTransaction.outputs.push(
                    TxOut(outputs[i].txType, outputs[i].addr, outputs[i].amount)
                );
            }

            emit TransactionStored(
                wtxid,
                status,
                inputs,
                outputs,
                script,
                verifyStatus
            );
        }
    }

    function updateTransactionStatus(
        bytes32 wtxid,
        VerifyStatus newStatus
    ) private {
        require(
            transactions[wtxid].wtxid != bytes32(0),
            "Transaction does not exist"
        );
        transactions[wtxid].verifyStatus = newStatus;
    }

    function getOutputsAddress(
        TxOut[] memory txOuts,
        string memory network
    ) private view returns (Output[] memory) {
        uint256 addrVersion = 0;
        bytes memory p2wVersion = 'bc';
        if (
            keccak256(abi.encodePacked(network)) ==
            keccak256(abi.encodePacked(TESTNET))
        ) {
            addrVersion = 0x6f;
            p2wVersion = 'tb';
        }

        Output[] memory outputs = new Output[](txOuts.length);
        for (uint i = 0; i < txOuts.length; i++) {
            if (
                (txOuts[i].txType == AddressType.P2PKH) ||
                (txOuts[i].txType == AddressType.P2SH)
            ) {
                outputs[i] = Output(AddrType(uint(txOuts[i].txType)), hash160ToAddress(
                    txOuts[i].addr,
                    addrVersion
                ), txOuts[i].amount);
            }
            if (
                (txOuts[i].txType == AddressType.P2WPKH) ||
                (txOuts[i].txType == AddressType.P2WSH)
            ) {
                outputs[i] = Output(AddrType(uint(txOuts[i].txType)), bech32Address(txOuts[i].addr, p2wVersion), txOuts[i].amount);
            }
        }
        return outputs;
    }

    /*
      Step 1: Add the address version number (e.g., Bitcoin mainnet version number "0x00") to the result from the previous step.
      Step 2: Calculate the SHA-256 hash of the result from the previous step.
      Step 3: Calculate the SHA-256 hash of the result from the previous step again.
      Step 4: Take the first four bytes (8 hex digits) of the result from the previous step, e.g., D61967F6, and append these four bytes to the end of the result from step one as a checksum (this is the hexadecimal form of a Bitcoin address).
      Step 5: Transform the address into base58 representation (this is the most common form of Bitcoin addresses).
    */
    function hash160ToAddress(
        bytes memory hash,
        uint256 addrVersion
    ) public view returns (string memory) {
        bytes memory base = abi.encodePacked(
            bytes1(uint8(addrVersion)),
            bytes20(hash)
        ); //To take left-most 20 bytes
        bytes memory firstSha256 = abi.encodePacked(sha256(base));
        bytes memory secSha256 = abi.encodePacked(sha256(firstSha256));

        bytes4 checkSum = (bytes4(secSha256[3]) >> 24) |
            (bytes4(secSha256[2]) >> 16) |
            (bytes4(secSha256[1]) >> 8) |
            (bytes4(secSha256[0]));

        bytes memory hexBtcAddr = abi.encodePacked(base, checkSum);

        return string(abi.encodePacked(encode(hexBtcAddr)));
    }

    /**
     * @notice encode is used to encode the given bytes in base58 standard.
     * @param data_ raw data, passed in as bytes.
     * @return base58 encoded data_, returned as bytes.
     */
    function encode(bytes memory data_) public pure returns (bytes memory) {
        unchecked {
            uint256 size = data_.length;
            uint256 zeroCount;
            while (zeroCount < size && data_[zeroCount] == 0) {
                zeroCount++;
            }
            size = zeroCount + ((size - zeroCount) * 8351) / 6115 + 1;
            bytes memory slot = new bytes(size);
            uint32 carry;
            int256 m;
            int256 high = int256(size) - 1;
            for (uint256 i = 0; i < data_.length; i++) {
                m = int256(size - 1);
                for (carry = uint8(data_[i]); m > high || carry != 0; m--) {
                    carry = carry + 256 * uint8(slot[uint256(m)]);
                    slot[uint256(m)] = bytes1(uint8(carry % 58));
                    carry /= 58;
                }
                high = m;
            }
            uint256 n;
            for (n = zeroCount; n < size && slot[n] == 0; n++) {}
            size = slot.length - (n - zeroCount);
            bytes memory out = new bytes(size);
            for (uint256 i = 0; i < size; i++) {
                uint256 j = i + n - zeroCount;
                out[i] = ALPHABET[uint8(slot[j])];
            }
            return out;
        }
    }

    //addrVersion mainnet:bc1 testnet:tb1
    function bech32Address(
        bytes memory witnessHash,
        bytes memory addrVersion
    ) public view returns (string memory) {
        uint256[] memory witness = bytesToUintArray(witnessHash);
        uint[] memory words = Bech32.convert(witness, 8, 5);

        uint[] memory version = new uint[](1);
        version[0] = 0;

        uint[] memory hrp = new uint[](2);
        hrp[0] = uint(uint8(addrVersion[0]));
        hrp[1] = uint(uint8(addrVersion[1]));

        bytes memory result = abi.encodePacked('1',Bech32.encode(hrp, Bech32.concat(version, words)));
        return string(abi.encodePacked(addrVersion,result));
    }

    function bytesToUintArray(
        bytes memory data
    ) public pure returns (uint[] memory) {
        uint[] memory result = new uint[](data.length);
    
        for (uint256 i = 0; i < data.length; i++) {
            result[i] = uint(uint8(data[i]));
    }
    
    return result;
}

    function hashFromPublicInputs(
        uint256[] calldata publicInputs
    ) internal returns (bytes32) {
    
    }
}
