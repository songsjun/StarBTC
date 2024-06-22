// @ts-ignore
import { network, ethers, upgrades, getChainId } from 'hardhat'
import {readConfig} from "./helper";

async function main() {
    let chainID = await getChainId();
    console.log("chainID==", chainID)

    let accounts = await ethers.getSigners()
    let account = accounts[0]
    console.log("account", account.address)
    let contractAddress = await readConfig(network.name,"LoanTools");
    const contractFactory = await ethers.getContractFactory('LoanTools',account)
    let contract  = await contractFactory.connect(account).attach(contractAddress);

    let amount = ethers.utils.parseEther("0.1");
    let tx = await contract.setArbitrationCost(amount);
    console.log(" setArbitrationCost =", tx.hash);
    await tx.wait();

    let arbitrationCostValue = await  contract.arbitrationCostValue();
    console.log("arbitrationCostValue ", arbitrationCostValue);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
