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

    let tx = await contract.setProofSubmitter("0xF3748F86D901aDca1C4310F844206C17634B48d5");
    console.log(" setProofSubmitter =", tx.hash);
    await tx.wait();
    let proofSubmitter = await contract.proofSubmitter();
    console.log("proofSubmitter=", proofSubmitter);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
