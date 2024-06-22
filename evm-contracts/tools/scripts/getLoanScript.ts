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

    let alice="0x0262aB0ED65373cC855C34529fDdeAa0e686D913";
    let bob = "0x0262aB0ED65373cC855C34529fDdeAa0e686D913";
    let usedays = 366;
    let lockTime1=4195654;
    let lockTime2=4196835;
    let preImagehash="0x0000000000000000000000000000000000000000000000000000000000000000";

    let script = await contract.getLoanScript(alice, bob, preImagehash, usedays, lockTime1, lockTime2);
    console.log("getScript=", script);

    let btcAddress= await contract.getSegWitAddress(script, "testnet");
    console.log("btcAddress=", btcAddress);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
