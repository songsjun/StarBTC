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
    let zkpOrderAddress = "0xB1f2Ce97276e776a9eF2dcD53849AdCEb21f96fF";
    if (chainID == 21) {
        zkpOrderAddress = "0x462FeA614D6Af68c8B72cB677EF0b66E33a0fB8A";
    }
    let tx = await contract.setZkpOrder(zkpOrderAddress);
    console.log(" setZkpOrder =", tx.hash);
    await tx.wait();
    let zkpOrder = await contract.zkpOrder();
    console.log("zkpOrder=", zkpOrder);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
