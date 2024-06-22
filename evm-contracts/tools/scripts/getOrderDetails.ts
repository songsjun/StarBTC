// @ts-ignore
import { network, ethers, upgrades, getChainId } from 'hardhat'
import {readConfig} from "./helper";
import {hexString} from "hardhat/internal/core/config/config-validation";

async function main() {
    let chainID = await getChainId();
    console.log("chainID==", chainID)

    let accounts = await ethers.getSigners()
    let account = accounts[0]
    console.log("account", account.address);
    console.log("network ==", network.name);
    let contractAddress = await readConfig(network.name,"LoanTools");
    const contractFactory = await ethers.getContractFactory('LoanTools',account)
    let contract  = await contractFactory.connect(account).attach(contractAddress);

    let zkporder = await contract.zkpOrder();
    console.log("zkpOrder ==", zkporder);
    let txid = "0x051c5c0c42f498d578d580535aa2e566463850892fc85917a3ebe9952ca069ec";
    let networkType = "mainnet";
    let details = await contract.getOrderDetails(txid, networkType);
    console.log("details=", details);

    let provingDetail = await contract.getProvingDetail(txid,networkType);
    console.log("provingDetail=", provingDetail);

    // let btcAddress= await contract.getSegWitAddress(script);
    // console.log("btcAddress=", btcAddress);

    let btcheight = await contract.lastBtcHeight();
    console.log("btcHeight ", btcheight);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
