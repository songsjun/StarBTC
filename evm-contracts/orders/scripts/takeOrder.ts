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
    let orderContractAddress = "0x49D353cBB8304B196281b795be9E9cB9518A9951";
    const contractFactory = await ethers.getContractFactory('Order',account)
    let contract  = await contractFactory.connect(account).attach(orderContractAddress);

    let btcAddress = "2N9BmGSMvd7srA5vUaf5htbwuQoWh79sKUg";
    let publicKey = "0x7c18b9b7a9b51e978f5a25ace2ea081b84bec00dca1f02145b576455b454edf4";
    let preimageHash = "0x805238c4310f7cf30919f6f18bb8632438094b5dff9a1f9af53bcb926cf1899a";
    let net = "testnet";
    if(chainID == 20) {
        net = "mainnet";
    }
    // let decimalNum = BigNumber.from("1000000");
    let decimalNum = BigNumber.from("1000000000000000000");
    let confirmPaymentTip = decimalNum.mul(1);
    console.log("confirmPaymentTip =",confirmPaymentTip);
     let tx = await contract.takeOrder(btcAddress, publicKey, preimageHash, net,confirmPaymentTip);
     console.log("take order == ", tx.hash);
     tx.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
