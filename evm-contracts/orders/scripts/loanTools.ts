// @ts-ignore
import { network, ethers, upgrades, getChainId } from 'hardhat'
import {readConfig, sleep} from "./helper";
import {BigNumber} from "ethers";

async function main() {
    let chainID = await getChainId();
    console.log("chainID==", chainID)

    let accounts = await ethers.getSigners()
    let account = accounts[0]
    console.log("account", account.address)
    let contractAddress = await readConfig(network.name,"LOAN_CONTRACT");
    const contractFactory = await ethers.getContractFactory('LoanContract',account)
    let contract  = await contractFactory.connect(account).attach(contractAddress);

    let usdt= "0x0daddd286487f3a03Ea9A1b693585fD46cdCcF9F";
    let usdc = "0xA06be0F5950781cE28D965E5EFc6996e88a8C141";
    if (chainID == 21) {
        usdt = "0x892A0c0951091A8a072A4b652926D4A8875F9bcB";
        usdc = "0xBA2D8B770d540124a4fD2cC319CB50629921f901";
    }

    let token = usdt;
    let decimalNum = BigNumber.from("1000000000000000000");
    if(token == usdc) {
        decimalNum = BigNumber.from("1000000");
    }

    let price = await contract.getAssetPrice(token);
    console.log("price ", price);

    let loanTools = await contract.loanTools();
    console.log("loanTools ", loanTools);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
