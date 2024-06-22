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
    let interest = "0xeFb6b5331E6fa5C72abb2858033Eada1F3E8e270";
    if (chainID == 21) {
        interest = "0x7e84FCb34B8A117DB8AF1F3b4F459511b29933Ef";
    }

    let tx = await contract.setInterestAddress(interest);
    console.log(" setInterestAddress =", tx.hash);
    await tx.wait();
    let interestAddress = await contract.interest();
    console.log("interestAddress=", interestAddress);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
