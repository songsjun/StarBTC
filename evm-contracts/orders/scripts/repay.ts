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
    let orderContractAddress = "0x5069298E7a2e043e11f5925BcC74B7dF2eb35814"//"0x3435cb2003fa45dbfd16ac58d7eac7de4b84b67b";
    const contractFactory = await ethers.getContractFactory('Order',account)
    let contract  = await contractFactory.connect(account).attach(orderContractAddress);
    let btcRawData = "0x020000000191e121af72dfb87df7ede2f1f633252af19de8e84efd6dc2999e8f827518414b00000000000000000001d5230000000000002200208fb633ae25bf7f8cf158e760a9394d66a6687cb6d831dbc6b3c2993ccbd7af4900000000";
    let borrowerSignature = "0x3045022100920698267053c34840820d95f3c9533fae08b0f69dc0f2166a5d2250d5c5a61f022002d2f744be519bd37d3fa298afa4aa0b1c2bb59620eb38e3606dae78a183359d01";

    // let decimalNum = BigNumber.from("1000000000000000000");
    let tx = await contract.repay(btcRawData, borrowerSignature);
    console.log("tx==", tx.hash)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
