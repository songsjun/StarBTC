// @ts-ignore
import {ethers, upgrades, getChainId, network} from 'hardhat'
import "@openzeppelin/hardhat-upgrades";
import {BigNumber} from "ethers";


function getAdjustedAmount( _tokenAmount: BigNumber)  {
  let priceDecimal = 18;
  let tokenDecimal = 6;
  let adjusted;
  let amount = _tokenAmount;

  if (tokenDecimal < priceDecimal) {
    adjusted = priceDecimal - tokenDecimal;
    for(let i =0; i < adjusted; i++){
      amount = amount.mul(BigNumber.from("10"));
    }

  } else if (tokenDecimal > priceDecimal) {
    adjusted = tokenDecimal - priceDecimal;
    for(let i =0; i < adjusted; i++){
      amount = amount .div(BigNumber.from("10"));
    }
  } else {
    amount = _tokenAmount;
  }
  return amount;
}

describe(`Interest Test `, () => {
  let contract: any;
  let signers = [];
  it("Deploy", async function () {
    let chainID = await getChainId();
    console.log("chainID ", chainID);
    signers = await ethers.getSigners()
    let deployer = signers[0]
    const factory = await ethers.getContractFactory("Interest", deployer);
    contract = await upgrades.deployProxy(factory,
        [
        ],
        {
          initializer:  "initialize",
          unsafeAllowLinkedLibraries: true,
        });

    await contract.deployed();
    console.log("contract deployed ", contract.address);
  });

  it("GetCollateralAmount usdc test", async ()=> {
    let usdc = "0xa06be0f5950781ce28d965e5efc6996e88a8c141";
    let decimalNum = BigNumber.from("1000000");
    let lendingAmount = decimalNum.mul(5);

    let lendingDays = 1 * 7;
    console.log("limitDays", lendingDays)
    let interestRate = await contract.GetInterestRate(lendingDays);
    console.log("interestRate", interestRate);
    let adjustAmount = getAdjustedAmount(lendingAmount);
    console.log("adjustAmount ", adjustAmount);
    let interestValue = await contract.GetInterestValue(adjustAmount, interestRate)/1e18/1e6;

    console.log("interestValue", interestValue)
    console.log("adjustAmount", adjustAmount)
    let collateralAmount = await contract.GetCollateralAmount(usdc, adjustAmount, interestValue);
    console.log("collateralAmount=", collateralAmount);

    let limt = await contract.GetLoanLimit(adjustAmount);
    console.log("limit=", limt/1e8);
  })

  it("GetCollateralAmount usdt test", async ()=> {
    let usdt= "0x0daddd286487f3a03Ea9A1b693585fD46cdCcF9F";
    let decimalNum = BigNumber.from("1000000000000000000");
    let lendingAmount = decimalNum.mul(10);
    let interestRate = await contract.GetInterestRate(90);
    console.log("interestRate", interestRate);
    console.log("lendingAmount", lendingAmount);
    let interest = await contract.GetInterestValue(lendingAmount, interestRate)/1e18;
    console.log("interest=", interest);
    let amount = await contract.GetCollateralAmount(usdt, lendingAmount, interest);
    console.log("GetCollateralAmount=", amount);
  })

})
