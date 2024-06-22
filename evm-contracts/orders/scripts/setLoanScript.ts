// @ts-ignore
import { network, ethers, upgrades, getChainId } from 'hardhat'
import {readConfig} from "./helper";

async function main() {
    let chainID = await getChainId();
    console.log("chainID==", chainID)

    let accounts = await ethers.getSigners()
    let account = accounts[0]
    console.log("account", account.address)
    let contractAddress = await readConfig(network.name,"LOAN_CONTRACT");
    const contractFactory = await ethers.getContractFactory('LoanContract',account)
    let contract  = await contractFactory.connect(account).attach(contractAddress);

    let loanScriptAddress = await readConfig(network.name, "LOAN_SCRIPT");
    let tx = await contract.setLoanScriptAddress(loanScriptAddress);
    console.log(" loanScriptAddress =", tx.hash);
    await tx.wait();
    let loanScript = await contract.loanScript();
    console.log("loanScript=", loanScript);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
