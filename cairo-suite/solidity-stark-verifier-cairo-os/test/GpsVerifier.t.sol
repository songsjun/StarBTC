// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import "../src/verifier/CpuConstraintPoly.sol";
import "../src/periodic_columns/PoseidonPoseidonFullRoundKey0Column.sol";
import "../src/periodic_columns/PoseidonPoseidonFullRoundKey1Column.sol";
import "../src/periodic_columns/PoseidonPoseidonFullRoundKey2Column.sol";
import "../src/periodic_columns/PoseidonPoseidonPartialRoundKey0Column.sol";
import "../src/periodic_columns/PoseidonPoseidonPartialRoundKey1Column.sol";
import "../src/periodic_columns/EcdsaPointsXColumn.sol";
import "../src/periodic_columns/EcdsaPointsYColumn.sol";
import "../src/periodic_columns/PedersenHashPointsXColumn.sol";
import "../src/periodic_columns/PedersenHashPointsYColumn.sol";
import "../src/gps/CairoBootloaderProgram.sol";
import "../src/verifier/FriStatementVerifier.sol";
import "../src/verifier/CpuFrilessVerifier.sol";
import "../src/MemoryPageFactRegistry.sol";
import "../src/verifier/FriStatementContract.sol";
import "../src/verifier/VerifierChannel.sol";
import "../src/CpuOods.sol";
import "../src/gps/GpsStatementVerifier.sol";
import "./AutoGenProofData.sol";
import "../src/utils/TransactionParser.sol";
import "../src/interfaces/IStarkVerifierStorage.sol";
import "../src/interfaces/IStarkVerifierTransaction.sol";

contract StarkNetVerifierTest is Test {
    // == CPU layout6 verifier ==
    // https://etherscan.io/address/0xe9664d230490d5a515ef7ef30033d8075a8d0e24#code
    uint256 numSecurityBits = 96;
    uint256 minProofOfWorkBits = 30;
    CpuConstraintPoly public cpuConstraintPoly;
    PedersenHashPointsXColumn pedersenPointsX;
    PedersenHashPointsYColumn pedersenPointsY;
    EcdsaPointsXColumn ecdsaPointsX;
    EcdsaPointsYColumn ecdsaPointsY;
    PoseidonPoseidonFullRoundKey0Column poseidonPoseidonFullRoundKey0Column;
    PoseidonPoseidonFullRoundKey1Column poseidonPoseidonFullRoundKey1Column;
    PoseidonPoseidonFullRoundKey2Column poseidonPoseidonFullRoundKey2Column;
    PoseidonPoseidonPartialRoundKey0Column poseidonPoseidonPartialRoundKey0Column;
    PoseidonPoseidonPartialRoundKey1Column poseidonPoseidonPartialRoundKey1Column;
    address[] public auxPolynomials;
    MemoryPageFactRegistry public memoryPageFactRegistry;
    MerkleStatementContract public merkleStatementContract;
    FriStatementContract public friStatementContract;
    FriStatementVerifier public friStatementVerifier;
    CpuOods cpuOods;
    CpuFrilessVerifier public cpuFrilessVerifier;

    // == GPS statement verifier ==
    // https://etherscan.io/address/0x6cB3EE90C50a38A0e4662bB7e7E6e40B91361BF6#code
    CairoBootloaderProgram public bootloaderProgram;
    address[] public cairoVerifierContracts;
    uint256 hashedSupportedCairoVerifiers;
    uint256 simpleBootloaderProgramHash;
    GpsStatementVerifier public gpsStatementVerifier;
    uint8[] dataArray = [1,32,0,0,0,173,13,7,41,147,228,244,130,254,151,9,125,60,222,194,186,36,6,142,7,2,143,137,46,227,150,120,249,226,12,159,54,1,0,0,0,1,0,0,0,48,0,0,0,44,0,0,0,32,0,0,0,80,29,116,54,15,138,73,33,120,33,68,48,19,187,28,227,69,116,59,182,168,17,75,140,137,196,150,216,116,176,44,15,184,11,0,0,0,0,0,0,49,0,0,0,45,0,0,0,6,32,0,0,0,173,136,93,207,186,177,65,231,114,27,146,44,115,210,58,139,161,193,53,129,187,149,117,65,213,119,125,223,155,70,202,37,232,3,0,0,0,0,0,0,20,0,0,0,106,226,88,13,186,8,174,254,233,135,222,143,86,252,73,28,60,39,138,69,0,0,0,0,32,0,0,0,220,230,162,15,6,140,194,51,162,216,163,220,80,111,202,226,116,132,103,78,89,61,134,234,223,164,200,153,112,99,132,222];
    function setUp() public {
        memoryPageFactRegistry = new MemoryPageFactRegistry();
        merkleStatementContract = new MerkleStatementContract();
        friStatementContract = new FriStatementContract();
        cpuOods = new CpuOods();
        cpuConstraintPoly = new CpuConstraintPoly();
        pedersenPointsX = new PedersenHashPointsXColumn();
        pedersenPointsY = new PedersenHashPointsYColumn();
        ecdsaPointsX = new EcdsaPointsXColumn();
        ecdsaPointsY = new EcdsaPointsYColumn();
        poseidonPoseidonFullRoundKey0Column = new PoseidonPoseidonFullRoundKey0Column();
        poseidonPoseidonFullRoundKey1Column = new PoseidonPoseidonFullRoundKey1Column();
        poseidonPoseidonFullRoundKey2Column = new PoseidonPoseidonFullRoundKey2Column();
        poseidonPoseidonPartialRoundKey0Column = new PoseidonPoseidonPartialRoundKey0Column();
        poseidonPoseidonPartialRoundKey1Column = new PoseidonPoseidonPartialRoundKey1Column();
        auxPolynomials = [
            address(cpuConstraintPoly),
            address(pedersenPointsX),
            address(pedersenPointsY),
            address(ecdsaPointsX),
            address(ecdsaPointsY),
            address(poseidonPoseidonFullRoundKey0Column),
            address(poseidonPoseidonFullRoundKey1Column),
            address(poseidonPoseidonFullRoundKey2Column),
            address(poseidonPoseidonPartialRoundKey0Column),
            address(poseidonPoseidonPartialRoundKey1Column)
        ];
        cpuFrilessVerifier = new CpuFrilessVerifier(
            auxPolynomials,
            address(cpuOods),
            address(memoryPageFactRegistry),
            address(merkleStatementContract),
            address(friStatementContract),
            numSecurityBits,
            minProofOfWorkBits
        );

        bootloaderProgram = new CairoBootloaderProgram();
        hashedSupportedCairoVerifiers = 3178097804922730583543126053422762895998573737925004508949311089390705597156;
        simpleBootloaderProgramHash = 2962621603719000361370283216422448934312521782617806945663080079725495842070;
        cairoVerifierContracts = [
            address(cpuFrilessVerifier),
            address(cpuFrilessVerifier),
            address(cpuFrilessVerifier),
            address(cpuFrilessVerifier),
            address(cpuFrilessVerifier),
            address(cpuFrilessVerifier),
            address(cpuFrilessVerifier),
            address(cpuFrilessVerifier)
        ];
        gpsStatementVerifier = new GpsStatementVerifier(
            address(bootloaderProgram),
            address(memoryPageFactRegistry),
            cairoVerifierContracts,
            hashedSupportedCairoVerifiers,
            simpleBootloaderProgramHash
        );
    }

    function testWholeWorkFlow() public {
        AutoGenProofData proofData = new AutoGenProofData();
        uint256 cairoVerifierId = proofData.cairoVerifierId();
        console.logUint(proofData.cairoVerifierId());

        merkleStatementContract.verifyMerkle(
            proofData.getBaseTraceMerkleView(),
            proofData.getBaseTraceMerkleInitials(),
            proofData.baseTraceMerkleHeight(),
            proofData.baseTraceMerkleRoot()
        );
        merkleStatementContract.verifyMerkle(
            proofData.getExtensionTraceMerkleView(),
            proofData.getExtensionTraceMerkleInitials(),
            proofData.extensionTraceMerkleHeight(),
            proofData.extensionTraceMerkleRoot()
        );
        merkleStatementContract.verifyMerkle(
            proofData.getCompositionTraceMerkleView(),
            proofData.getCompositionTraceMerkleInitials(),
            proofData.compositionTraceMerkleHeight(),
            proofData.compositionTraceMerkleRoot()
        );

        FriDataLayer[] memory friDataLayers = proofData.getFriDataLayers();
        for (uint i = 0; i < friDataLayers.length; i++) {
            console.log("verifying fri layer", i);
            FriDataLayer friDataLayer = friDataLayers[i];
            friStatementContract.verifyFRI(
                friDataLayer.getProof(),
                friDataLayer.getQueue(),
                friDataLayer.evalPoint(),
                friDataLayer.stepSize(),
                friDataLayer.root()
            );
        }

        bytes memory data = new bytes(dataArray.length);
        for (uint256 i = 0; i < dataArray.length; i++) {
            data[i] = bytes1(dataArray[i]);
        }
        gpsStatementVerifier.registerBitcoinTx(data);
        console.log("verifying verifyProofAndRegisteryer");
        gpsStatementVerifier.verifyProofAndRegister(
            proofData.getProofParams(),
            proofData.getProof(),
            proofData.getCairoAuxInput(),
            proofData.cairoVerifierId(),
            proofData.getPublicMemoryData()
        );

        (
            bytes32 txid,
            IStarkVerifierTransaction.Input[] memory inputs,
            IStarkVerifierTransaction.Output[] memory outputs,
            bytes memory script,
            IStarkVerifierTransaction.VerifiedStatus verifiedStatus
        ) = gpsStatementVerifier.getTransaction(
                0xdce6a20f068cc233a2d8a3dc506fcae27484674e593d86eadfa4c899706384de,
                "mainnet"
            );
        (
            bytes32 txid1,
            IStarkVerifierTransaction.ProvingStatus provingStatus,
            string memory provingAddress
        ) = gpsStatementVerifier.getProvingDetail(
                0xdce6a20f068cc233a2d8a3dc506fcae27484674e593d86eadfa4c899706384de,
                "mainnet"
            );
            console.logBytes32(txid);
            console.logBytes32(txid1);
        console.log(provingAddress);
        for (uint i = 0; i < outputs.length; i++) {
            console.log("output address: ");
            console.log(outputs[i].addr);
        }
    }

    function testParserTransaction() public {
        bytes memory data = new bytes(dataArray.length);
        for (uint256 i = 0; i < dataArray.length; i++) {
            data[i] = bytes1(dataArray[i]);
        }
        TransactionParser txParser = new TransactionParser();
        txParser.parseTransaction(data);
    }

    function testBech32Address() public {
        bytes memory input = hex"ad885dcfbab141e7721b922c73d23a8ba1c13581bb957541d5777ddf9b46ca25";
        console.log("testBech32Address");
        string memory addr = gpsStatementVerifier.bech32Address(
            input, 'tb');
        assertEq(addr, "tb1q4ky9mna6k9q7wusmjgk885363wsuzdvphw2h2sw4wa7alx6xegjsjj4cgx");
    }

    function testTransactionNotExist() public {
        gpsStatementVerifier.getTransaction(0x3a3f3ea81efe36cfb3a055ff0d3adf08ba1fb011a1afc34461a97c0609c8cc61, "mainnet");
    }

    function testAddingDuplicateTransaction() public {        
        bytes32 wtxid = bytes32("0x123");
        IStarkVerifierStorage.ProofStatus status  = IStarkVerifierStorage.ProofStatus.OK; 
        bytes memory proverAddress = "123";
        IStarkVerifierStorage.TxIn[] memory inputs = new IStarkVerifierStorage.TxIn[](2);
        inputs[0] = IStarkVerifierStorage.TxIn(bytes32("456"), 456);
        inputs[1] = IStarkVerifierStorage.TxIn(bytes32("789"), 789);
        IStarkVerifierStorage.TxOut[] memory outputs = new IStarkVerifierStorage.TxOut[](2);
        outputs[0] = IStarkVerifierStorage.TxOut(IStarkVerifierStorage.AddressType.EMPTY, "456", 456);
        outputs[1] = IStarkVerifierStorage.TxOut(IStarkVerifierStorage.AddressType.P2MS, "456", 456);
        bytes memory script = "123";
        IStarkVerifierStorage.VerifyStatus verifyStatus = IStarkVerifierStorage.VerifyStatus.verified;
        
        // Add the transaction once
        // gpsStatementVerifier.addTransaction(wtxid, status, proverAddress, inputs, outputs, script, verifyStatus);
        
        // // Check the initial status
        // (, , , , IStarkVerifierTransaction.VerifiedStatus ver) = gpsStatementVerifier.getTransaction(wtxid, "mainnet");
        // require(ver == IStarkVerifierTransaction.VerifiedStatus.toBeVerified, "Initial transaction status is incorrect");
        
        // // Change the status
        // IStarkVerifierStorage.VerifyStatus newVerifyStatus = IStarkVerifierStorage.VerifyStatus.verifyFailed;
        
        // // Add the transaction again
        // gpsStatementVerifier.addTransaction(wtxid, status, proverAddress, inputs, outputs, "098", newVerifyStatus);
        // // check 
        // gpsStatementVerifier.getTransaction(wtxid, "mainnet");

    }

}
