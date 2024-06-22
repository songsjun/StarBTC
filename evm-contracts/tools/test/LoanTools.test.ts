// @ts-ignore
import {ethers, upgrades, getChainId, network} from 'hardhat'
import "@openzeppelin/hardhat-upgrades";
import {BigNumber} from "ethers";
import {writeConfig} from "../scripts/helper";

describe(`Interest Test `, () => {
  let contract: any;
  let signers = [];
  it("Deploy", async function () {
    let chainID = await getChainId();
    console.log("chainID ", chainID);
    let signers = await ethers.getSigners()
    let deployer = signers[0]
    const factory = await ethers.getContractFactory("LoanTools", deployer);

    let assetOracle = "0x5117b046517ffA18d4d9897090D0537fF62A844A";
    let zkpOrder = "0xB1f2Ce97276e776a9eF2dcD53849AdCEb21f96fF";
    let btcHeaderData = "0x7a581772B0b21f5B8880E881C495cb7AfDfA228c";
    let proofSubmitter = "0xF3748F86D901aDca1C4310F844206C17634B48d5";
    let btc = "0xDF4191Bfe8FAE019fD6aF9433E8ED6bfC4B90CA1";
    let interest = "0xeFb6b5331E6fa5C72abb2858033Eada1F3E8e270";
    let loanScript = "0xf0D8F222814707F0Cc002c594C8a223e046EF8c5";
    let arbiter = "0x32D45fa21B6efe0404911B0FE5aa3243D120Bc62";
    let CostToken_USDT= "0x0daddd286487f3a03Ea9A1b693585fD46cdCcF9F";
    let arbitrationCostValue = BigNumber.from("1000000000000000000").mul(5);//5 usdt
    let confirmPaymentRewardsToken = CostToken_USDT;

    contract = await upgrades.deployProxy(factory,
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


    await contract.deployed();
    console.log("contract deployed ", contract.address);
  });


  it("getScript test", async ()=> {
    // let alice="0x020f8cb5261195d88c95a76fd3007e16814a2e39f994c685988e770ce45d9783f7";
    // let bob = "0x02a12298f9e970f87b2d2059c8ac5bb95f34c1b4a2b5013c5120fabb7120e184e2";
    // let arbiter="0x0200493eb975eedf5d5d2f7f5458e790e8264576ec137df06c8f3f90c91b0a6f78";
    // let lockTime1=4194305;
    // let lockTime2=4194810;
    // let preImagehash="0x9f64a747e1b97f131fabb6b447296c9b6f0201e79fb3c5356e6c77e89b6a806a";
    // await contract.getLoanScript(alice, bob, preImagehash)

    let script = "0x6321036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ad21036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ac676321036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ad210200493eb975eedf5d5d2f7f5458e790e8264576ec137df06c8f3f90c91b0a6f78ac676303460540b27521036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ada8202b9b4e159067bd2ddbb4164bd4d9bc2d8730f925cbb8be59df2aba29ef48f640876703e30940b27521036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ac686868"//;
    let btcAddress = await contract.getSegWitAddress(script, "mainnet");
    console.log("btcAddress ", btcAddress);

  // ### addr: bc1qwgmg8fr4936af6emuh6rfc5rq7m6g55eyu72s7rn323fc3mj028qj9natr
  // ### p2wsh: 0020723683a4752c75d4eb3be5f434e28307b7a45299273ca878738aa29c47727a8e
  })

})
