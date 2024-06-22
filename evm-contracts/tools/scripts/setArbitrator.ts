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
    let arbitrator = "0xb136cF92EfE857911C4c7efcA1dE2424545b5186"
    if (chainID == 21) {
        arbitrator = "0xD0C8dFa17c264285D47cFD1a9C0e82be63354f33"
    }
    let tx = await contract.setArbiterAddress(arbitrator);
    console.log(" setArbiterAddress =", tx.hash);
    await tx.wait();
    let arbiter = await contract.arbiter();
    console.log("arbiter=", arbiter);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
