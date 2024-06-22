// @ts-ignore
import { network, ethers, upgrades, getChainId } from 'hardhat'
import {readConfig} from "./helper";
import {getBlock, getTransactionDetails} from "./btcAPI";

async function main() {
    let chainID = await getChainId();
    console.log("chainID==", chainID)

    let accounts = await ethers.getSigners()
    let account = accounts[0]
    console.log("account", account.address)
    let orderContractAddress = "0x49D353cBB8304B196281b795be9E9cB9518A9951";
    const contractFactory = await ethers.getContractFactory('Order',account)
    let contract  = await contractFactory.connect(account).attach(orderContractAddress);
    // let toLenderBtcTx = await contract.toLenderBtcTx();
    // let txid = toLenderBtcTx.txId.toString();
    // txid = txid.substring(2, txid.length);
    //
    // console.log("toLenderBtcTx=", toLenderBtcTx.txId.toString(), " txid", txid);
    // const txDetails = await getTransactionDetails(txid);
    // if (!txDetails) {
    //     console.log("no transaction", toLenderBtcTx);
    //     return null;
    // }
    // const txRawData = "0x" + txDetails.hex;
    // console.log("txDetails", txDetails)
    let txRawData = "0x473044022073f3c79e7a841da27614fc7b329f61cdf7f40e00b817eb767eef0601c299db4d02203a6fb313b345d153a23cc5df472db02b6e2ffb4b3ee8f6c1623965b0bcfd10d60121033c4a1ff86053230096f48caacf13e9a445d80d5ea4844dc6b3466fdf135ab6a4";
    let signature = "0x3045022100da4920399bd497630a3542ae759cf528643028bcb63d4ea4723a5a2c9f1f428602206161a4cdcdb03dea6d7080e2191e807eca1459fead661a9d4e0b76bf81e6d74401";
    let tx = await contract.requestArbitration(txRawData, signature);
    console.log("tx.hash == ", tx.hash);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
