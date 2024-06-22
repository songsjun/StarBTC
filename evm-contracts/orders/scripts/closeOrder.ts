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
    let orderContractAddress = "0x8c80d70da5b287573b8d250eb71c9cb09e0be2f9";
    const contractFactory = await ethers.getContractFactory('Order',account)
    let contract  = await contractFactory.connect(account).attach(orderContractAddress);
    let gas = await contract.estimateGas.closeOrder();
    console.log("gas= ", gas);
    // let tx = await contract.closeOrder();
    // console.log("closeOrder ", tx.hash);
    // await tx.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
