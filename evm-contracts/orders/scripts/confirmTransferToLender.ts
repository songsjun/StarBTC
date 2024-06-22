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
    let orderContractAddress = "0x5069298E7a2e043e11f5925BcC74B7dF2eb35814";
    const contractFactory = await ethers.getContractFactory('Order',account)
    let contract  = await contractFactory.connect(account).attach(orderContractAddress);
    let btcTxId = "0x044559d116aaff7ef6537dc767f9cbe0523a3154e04cdc38f935be8535973546";
    let tx = await contract.confirmTransferToLender(btcTxId, btcTxId);
    console.log("confirmTransferToLender ", tx.hash);
    await tx.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
