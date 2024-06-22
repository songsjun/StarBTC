// @ts-ignore
import { network, ethers, upgrades, getChainId } from 'hardhat'
import {readConfig} from "./helper";
import {BigNumber} from "ethers";

async function main() {
    let chainID = await getChainId();
    console.log("chainID==", chainID)

    let accounts = await ethers.getSigners()
    let account = accounts[0]
    console.log("account", account.address)
    let contractAddress = await readConfig(network.name,"INTEREST");
    const contractFactory = await ethers.getContractFactory('Interest',account)

    let contract  = await contractFactory.connect(account).attach(contractAddress);

    let decimalNum = BigNumber.from("1000000000000000000");
    let lendingAmount = decimalNum.mul(1);
    let rate = await contract.GetInterestRate(1 * 7);
    let interestValue =  await contract.GetInterestValue(lendingAmount, rate)/1e18;
    console.log("interestValue ", interestValue);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
