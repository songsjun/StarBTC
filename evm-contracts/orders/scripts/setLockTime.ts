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

    let lockTime1 = 512;// 8 * 3600 * 24;
    let lockTime2 = 512;//15 * 3600 * 24;

    let tx = await contract.setLockTime1(lockTime1);
    console.log(" setLockTime1 =", tx.hash);
    await tx.wait();
    tx = await contract.setLockTime2(lockTime2);
    console.log(" setLockTime2 =", tx.hash);
    await tx.wait();

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
