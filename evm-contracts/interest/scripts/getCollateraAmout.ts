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

    let usdt= "0x0daddd286487f3a03Ea9A1b693585fD46cdCcF9F";
    let decimalNum = BigNumber.from("1000000000000000000");
    let lendingAmount = decimalNum.mul(15);
    lendingAmount = lendingAmount.div(100);
    let interest = BigNumber.from("15000000000000");

    let amount = await contract.GetCollateralAmount(usdt, lendingAmount, interest);
    console.log("GetCollateralAmount=", amount);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
