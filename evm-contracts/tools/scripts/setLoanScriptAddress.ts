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
    let loanScriptAddress = "0xf0D8F222814707F0Cc002c594C8a223e046EF8c5";
    if (chainID == 21) {
        loanScriptAddress = "0x0DD0d4B6Eafcb5ac4c89408e12d925fA8E4D914B";
    }

    let tx = await contract.setLoanScriptAddress(loanScriptAddress);
    console.log(" setLoanScriptAddress =", tx.hash);
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
