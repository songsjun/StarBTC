// @ts-ignore
import { network, ethers, upgrades, getChainId } from 'hardhat'
import {readConfig} from "./helper";

async function main() {
    let chainID = await getChainId();
    console.log("chainID==", chainID)

    let accounts = await ethers.getSigners()
    let account = accounts[0]
    console.log("account", account.address)
    let orderContractAddress = "0x5069298E7a2e043e11f5925BcC74B7dF2eb35814"//"0x3435cb2003fa45dbfd16ac58d7eac7de4b84b67b";
    const contractFactory = await ethers.getContractFactory('Order',account)
    let contract  = await contractFactory.connect(account).attach(orderContractAddress);
    let preImage = "0x6211b7a0cdde84ad1b6da4c4ae9bec59443d9e2435574ba433414d781241f25032cd70d7d6c46f177bd206c4b78de20419761cee8601b6efe815b59e2da6a2271b";
    let gas = await contract.estimateGas.borrow(preImage);
    console.log("gas== ", gas);
    let tx = await contract.borrow(preImage);
    console.log("tx==", tx.hash)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
