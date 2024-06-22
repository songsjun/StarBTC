// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./interfaces/IStarkVerifier.sol";

contract ZkpOrder is Initializable, Ownable2StepUpgradeable {
    using SafeMath for uint256;

    enum ProofStatus {
        toBeVerified,
        verified,
        verifyFailed
    }

    struct RawTransaction {
        bytes rawData;
        bytes[] utxos;
        string prover;
        bytes script;
        ProofStatus status;
        address owner;
        uint256 timestamp;
    }

    event TransactionAdded(bytes32 indexed hash, bytes rawData, bytes[] utxos, string prover, bytes script);
    event TransactionVerified(bytes32 indexed hash);
    event VerifierChanged(address indexed verifier);

    mapping (bytes32 => RawTransaction) public orders;
    IStarkVerifier public verifier;

    /**
     * @dev Returns true if `account` is a contract.
     *
     * [IMPORTANT]
     * ====
     * It is unsafe to assume that an address for which this function returns
     * false is an externally-owned account (EOA) and not a contract.
     *
     * Among others, `isContract` will return false for the following
     * types of addresses:
     *
     *  - an externally-owned account
     *  - a contract in construction
     *  - an address where a contract will be created
     *  - an address where a contract lived, but was destroyed
     * ====
     *
     * [IMPORTANT]
     * ====
     * You shouldn't rely on `isContract` to protect against flash loan attacks!
     *
     * Preventing calls from contracts is highly discouraged. It breaks composability, breaks support for smart wallets
     * like Gnosis Safe, and does not provide security since it can be circumvented by calling from a contract
     * constructor.
     * ====
     */
    function isContract(address account) internal view returns (bool) {
        // This method relies on extcodesize/address.code.length, which returns 0
        // for contracts in construction, since the code is only stored at the end
        // of the constructor execution.

        return account.code.length > 0;
    }

    function initialize(address _verifier) public initializer {
        __Ownable_init();
        require(isContract(_verifier), "verifier is not a contract");
        verifier = IStarkVerifier(_verifier);
    }

    constructor() {
        _disableInitializers();
    }

    function setVerifier(address _verifier) external onlyOwner {
        require(isContract(_verifier), "verifier is not a contract");
        verifier = IStarkVerifier(_verifier);

        emit VerifierChanged(_verifier);
    }

    function addTransaction(bytes memory rawData, bytes[] memory utxos, string memory prover, bytes memory script) external returns (bytes32) {
        require(utxos.length > 0, "UTXOS is empty");

        // double sha256
        bytes32 hash = sha256(bytes.concat(sha256(rawData)));
        uint256 reversed = reverse(uint256(hash));
        hash = bytes32(reversed);

        if (orders[hash].rawData.length != 0) {
            require(orders[hash].status != ProofStatus.verified, "Verified tx cannot be rewrite");
            require(msg.sender == orders[hash].owner, "only owner could rewrite");
            require(block.timestamp.sub(orders[hash].timestamp) > 1800, "rewrite time must be greater than 30 minuts");
        }

        orders[hash] = RawTransaction(rawData, utxos, prover, script, ProofStatus.toBeVerified, msg.sender, block.timestamp);
        emit TransactionAdded(hash, rawData, utxos, prover, script);

        return hash;
    }

    function markTransactionVerified(bytes32 hash) external {
        RawTransaction storage transaction = orders[hash];
        require(orders[hash].rawData.length > 0, "transaction does not exist");

        bool valid = verifier.checkProofIsValid(hash);
        if (valid) {
            transaction.status = ProofStatus.verified;
            emit TransactionVerified(hash);
        }
    }

    function getOrderStatus(bytes32 hash) external view returns(ProofStatus) {
        return orders[hash].status;
    }

    function getOrderData(bytes32 hash) external view returns(bytes memory) {
        return orders[hash].rawData;
    }

    function getOrderUtxos(bytes32 hash) external view returns(bytes[] memory) {
        return orders[hash].utxos;
    }

    function getOwner(bytes32 hash) external view returns(address) {
        return orders[hash].owner;
    }

    function getTimestamp(bytes32 hash) external view returns(uint256) {
        return orders[hash].timestamp;
    }

    function getOrderDetails(bytes32 hash, string memory network) external view returns (
        bytes32,  //wtxid
        IStarkVerifier.Input[] memory,
        IStarkVerifier.Output[] memory,
        bytes memory, //script
        IStarkVerifier.VerifiedStatus) {
        return verifier.getTransaction(hash, network);
    }

    function getProvingDetail(bytes32 hash, string memory network) external view returns (
        bytes32, //wtxid
        IStarkVerifier.ProvingStatus,
        string memory //proverAddress
    ) {
        return verifier.getProvingDetail(hash, network);
    }

    function reverse(uint256 input) internal pure returns (uint256 v) {
        v = input;

        // swap bytes
        v = ((v & 0xFF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00) >> 8) |
            ((v & 0x00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF) << 8);

        // swap 2-byte long pairs
        v = ((v & 0xFFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000) >> 16) |
            ((v & 0x0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF) << 16);

        // swap 4-byte long pairs
        v = ((v & 0xFFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000) >> 32) |
            ((v & 0x00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF) << 32);

        // swap 8-byte long pairs
        v = ((v & 0xFFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF0000000000000000) >> 64) |
            ((v & 0x0000000000000000FFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF) << 64);

        // swap 16-byte long pairs
        v = (v >> 128) | (v << 128);
    }
}
