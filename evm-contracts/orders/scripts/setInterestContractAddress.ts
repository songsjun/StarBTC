// @ts-ignore
import { network, ethers, upgrades, getChainId } from 'hardhat'
import {readConfig} from "./helper";

async function main() {
    let chainID = await getChainId();
    console.log("chainID==", chainID)

    let accounts = await ethers.getSigners()
    let account = accounts[0]
    console.log("account", account.address)
    let contractAddress = await readConfig(network.name,"LOAN_CONTRACT");
    const contractFactory = await ethers.getContractFactory('LoanContract',account)
    let contract  = await contractFactory.connect(account).attach(contractAddress);

    let tx = await contract.setInterestAddress("0xeFb6b5331E6fa5C72abb2858033Eada1F3E8e270");
    console.log(" setInterestAddress =", tx.hash);
    await tx.wait();
    let interest = await contract.interest();
    console.log("interest=", interest);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
