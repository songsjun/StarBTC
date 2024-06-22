// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;
import "./interfaces/IBtcBlockHeaders.sol";
import "./interfaces/IZKPOrder.sol";
import "./interfaces/IOrder.sol";

struct ZKVeiryArguments{
    uint256 proofBlock;
    uint256 proofedDelayBlock;
    bytes32 btcTx;
    string network;
    string borrowerBtcAddress;
    string lenderBtcAddress;
    bytes32 merkleProofTx;
    bytes script;
    uint256 collateralAmount;
}


interface ILoanTools {
    event InterestChanged(address indexed oldAddress, address indexed newAddress);
    event BTCHeaderDataChanged(address indexed oldAddress, address indexed newAddress);
    event ZKPOrderChanged(address indexed oldAddress, address indexed newAddress);
    event AssetOracleChanged(address indexed oldAddress, address indexed newAddress);
    event ProofSubmitter(address indexed oldAddress, address indexed newAddress);
    event ArbiterChanged(address indexed oldAddress, address indexed newAddress);
    event LoanScriptChanged(address indexed oldAddress, address indexed newAddress);
    event RequestArbitratorCost(uint256 amount);

    /**
     * Initiate a request for arbitration by the arbitrator
    */
    function requestArbitration(
        bytes memory _btcTxToSign,
        bytes memory _signature,
        bytes memory lockScript,
        address _orderId) external returns(address costToken, uint256 costValue);

    /**
    * View arbitrator's results
    */
    function checkArbitrationProofValid(address orderID, ZKVeiryArguments memory arguments) external view;

    /**
    * Obtain the arbitrator's public key
    */
    function getArbitratorPublicKey() external view returns(bytes memory);

    function checkMerkleRoot(
        uint32 blockHeight,
        bytes32 merkleRoot,
        bytes32[] memory proof,
        bytes32 leaf,
        bool[] memory positions
    ) external view returns(BlockHeader memory);

    function addZKPProof(
        bytes memory rawData,
        bytes[] memory utxos,
        string memory prover,
        bytes memory script
    ) external returns(bytes32);

    function checkSubmitter(address trader) external view returns (bool);

    function getOrderStatus(bytes32 hash) external view returns(ProofStatus);
    function getOrderDetails(bytes32 hash, string memory network) external view returns (
        bytes32,  //wtxid
        Input[] memory,
        Output[] memory,
        bytes memory, //script
        ProofStatus);

    function getProvingDetail(bytes32 hash, string memory network) external view returns (
        bytes32, //wtxid
        ProvingStatus,
        string memory //proverAddress
    );

    function getLoanScript(
        bytes memory borrowerPublicKey,
        bytes memory lenderPublicKey,
        bytes32 preImageHash,
        uint256 lockTime1,
        uint256 lockTime2
    ) external view returns(bytes memory);

    function getLoanLimit(uint256 satoshiCount) external view returns(uint256);
    function getCollateralAmount(address token, uint256 tokenAmount, uint256 interest) external view returns(uint256);
    function getInterestRate(uint256 limitedDays) external view returns(uint256);
    function getInterestValue(uint256 seedAmount, uint256 interestRate) external view returns(uint256);

    function getSegWitAddress(bytes memory script, string memory network) external pure returns(string memory);
    function setBTCDataAddress(address btcHeader) external;
    function getAssetPrice(address asset) external view returns(uint256);
    function setAssetOracle(address oracle) external;
    function setZkpOrder(address zkpOrderAddress) external;
    function setInterestAddress(address interestAddress) external;
    function setProofSubmitter(address submitter) external;
    function setArbiterAddress(address arbiterAddress) external;
    function setLoanScriptAddress(address loanScriptAddress) external;
    function lastBtcHeight() external view returns(uint256);

    function isCreatorValid(OrderType orderType, address borrower, address lender) external view returns (bool);

    function isBorrowerProofExpired(
        bytes32 toLenderBtcTx,
        uint256 borrowerProofTime,
        uint256 submitProofExpireTime,
        uint256 borrowerProofBlock,
        uint256 proofedDelayBlock) external view returns (bool);

    function isLenderProofExpired(
        bytes32 toBorrowerBtcTx,
        uint256 lenderProofTime,
        uint256 submitProofExpireTime,
        uint256 lenderProofBlock,
        uint256 proofedDelayBlock
    ) external view returns (bool);

    /**
   * Calculate the corresponding quantity based on the accuracy of the token
   */
    function getAdjustedAmount(address _token, uint256 _tokenAmount) external view returns(uint256);

    function transferTokenFrom(address token, address from, address to, uint256 value) external;

    function confirmPaymentRewardsToken() external view returns(address);

    function checkToLenderZKPVerifyStatus(
        ZKVeiryArguments memory arguments
    ) external view returns (bytes32);

    function checkToBorrowerZKPVerifyStatus(
        ZKVeiryArguments memory arguments,
        bytes32 toLenderBtcTx
    ) external view returns(bytes32);

    function arbitrationCostValue() external view returns(uint256);

    function setArbitrationCost(uint256 amount) external;
}
