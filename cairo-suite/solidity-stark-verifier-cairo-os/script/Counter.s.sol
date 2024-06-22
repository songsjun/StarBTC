// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
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

import {Script, console2} from "forge-std/Script.sol";

contract CounterScript is Script {
    function setUp() public {}

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

    function run() public {
        vm.startBroadcast();
        // TODO: find out what the MemoryPageFactRegistry does
        memoryPageFactRegistry = new MemoryPageFactRegistry();
        merkleStatementContract = new MerkleStatementContract();
        friStatementContract = new FriStatementContract();
        cpuOods = new CpuOods();
        // TODO: find the coefficients for this polynomial
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

        // bootloaderProgram = new CairoBootloaderProgram();

        bootloaderProgram = new CairoBootloaderProgram();

        // bootloaderProgramPartHalf2 = new bootloaderProgramPartHalf2();
        // TODO: what are these? Maybe ask Starkware for the pre-images
        hashedSupportedCairoVerifiers = 3178097804922730583543126053422762895998573737925004508949311089390705597156;
        // hashedSupportedCairoVerifiers = 37341341331504021525228390428349719127283617351070997452015539964478373189;
        simpleBootloaderProgramHash = 2962621603719000361370283216422448934312521782617806945663080079725495842070;
        // TODO: in reality these addresses map to different verifiers
        // For the sake of simplicity have the same amount of verifiers
        // as the on-chain contract but have them be all the same address
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
            // address(bootloaderProgramPart1),
            address(bootloaderProgram),
            address(memoryPageFactRegistry),
            cairoVerifierContracts,
            hashedSupportedCairoVerifiers,
            simpleBootloaderProgramHash
        );

        // == Contract Logs ==

        console2.log(
            "MemoryPageFactRegistry:",
            address(memoryPageFactRegistry)
        );
        console2.log(
            "MerkleStatementContract:",
            address(merkleStatementContract)
        );
        console2.log("FriStatementContract:", address(friStatementContract));
        console2.log("CpuOods:", address(cpuOods));
        console2.log("CpuConstraintPoly:", address(cpuConstraintPoly));
        console2.log("PedersenHashPointsX:", address(pedersenPointsX));
        console2.log("PedersenHashPointsY:", address(pedersenPointsY));
        console2.log("ECDSAPointsX:", address(ecdsaPointsX));
        console2.log("ECDSAPointsY:", address(ecdsaPointsY));
        console2.log(
            "PoseidonFullRoundKey0:",
            address(poseidonPoseidonFullRoundKey0Column)
        );
        console2.log(
            "PoseidonFullRoundKey1:",
            address(poseidonPoseidonFullRoundKey1Column)
        );
        console2.log(
            "PoseidonFullRoundKey2:",
            address(poseidonPoseidonFullRoundKey2Column)
        );
        console2.log(
            "PoseidonPartialRoundKey0:",
            address(poseidonPoseidonPartialRoundKey0Column)
        );
        console2.log(
            "PoseidonPartialRoundKey1:",
            address(poseidonPoseidonPartialRoundKey1Column)
        );

        console2.log("bootloaderProgram:", address(bootloaderProgram));

        console2.log("CairoFrilessVerifier:", address(cpuFrilessVerifier));

        console2.log("GPSStatementVerifier:", address(gpsStatementVerifier));

        vm.stopBroadcast();
    }
}
