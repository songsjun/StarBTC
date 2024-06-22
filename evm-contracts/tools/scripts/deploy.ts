// @ts-ignore
import { network, ethers, upgrades, getChainId } from 'hardhat'
import "@openzeppelin/hardhat-upgrades";
import {readConfig, writeConfig} from "./helper";
import {BigNumber} from "ethers";

async function main() {
  let chainID = await getChainId();
  console.log("chainID ", chainID);

  let assetOracle = "0x5117b046517ffA18d4d9897090D0537fF62A844A";
  let zkpOrder = "0xB1f2Ce97276e776a9eF2dcD53849AdCEb21f96fF";
  let btcHeaderData = "0x7a581772B0b21f5B8880E881C495cb7AfDfA228c";
  let proofSubmitter = "0xF3748F86D901aDca1C4310F844206C17634B48d5";
  let btc = "0xDF4191Bfe8FAE019fD6aF9433E8ED6bfC4B90CA1";
  let interest = "0xeFb6b5331E6fa5C72abb2858033Eada1F3E8e270";
  let loanScript = "0xf0D8F222814707F0Cc002c594C8a223e046EF8c5";
  let arbiter = "0xb136cF92EfE857911C4c7efcA1dE2424545b5186";
  let CostToken_USDT= "0x0daddd286487f3a03Ea9A1b693585fD46cdCcF9F";
  let arbitrationCostValue = BigNumber.from("1000000000000000000").mul(5);//5 usdt

  if (chainID == 21) {
      console.log("is testnet chain")
    btcHeaderData = "0xb4FEc0051eC19e71b89234D0523C97c0E2101B0F";
    CostToken_USDT = "0x892A0c0951091A8a072A4b652926D4A8875F9bcB";
    btc = "0x2aD066FBFeCaD8D06Af389A36cE1A4cFa4711443";
    loanScript = "0x0DD0d4B6Eafcb5ac4c89408e12d925fA8E4D914B";
    interest = "0x7e84FCb34B8A117DB8AF1F3b4F459511b29933Ef";
    zkpOrder = "0x462FeA614D6Af68c8B72cB677EF0b66E33a0fB8A";
    arbiter = "0xD0C8dFa17c264285D47cFD1a9C0e82be63354f33";
  }
    if (network.name == "prod") {
        proofSubmitter = "0x3909be751B1f3174102b29A75469B58E6DD1a311";
        arbiter = "";
    }
    let confirmPaymentRewardsToken = CostToken_USDT;
    let signers = await ethers.getSigners()
    let deployer = signers[0]
    const factory = await ethers.getContractFactory("LoanTools", deployer);

  let contract = await upgrades.deployProxy(factory,
      [
        assetOracle,
        zkpOrder,
        btcHeaderData,
        proofSubmitter,
        btc,
        interest,
        loanScript,
        arbiter,
        confirmPaymentRewardsToken,
        CostToken_USDT,
        arbitrationCostValue
      ],
      {
        initializer:  "initialize",
        unsafeAllowLinkedLibraries: true,
      });
  await writeConfig(network.name, network.name, "LoanTools", contract.address);

  await contract.deployed();

  console.log("contract deployed ", contract.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
