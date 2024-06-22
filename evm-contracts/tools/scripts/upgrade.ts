// @ts-ignore
import { network, ethers, upgrades, getChainId } from 'hardhat'
import {readConfig} from "./helper";


async function main() {
    let chainId = await getChainId();
    console.log("chainId is :" + chainId, " network ", network.name);

    const [ deployer ] = await ethers.getSigners();
    console.log("Deployer address", deployer.address);

    const contracdtAddress = await readConfig(network.name, "LoanTools");

    console.log("contracdtAddress address", contracdtAddress);

    const contractFactory = await ethers.getContractFactory("LoanTools");
    const newContract = await upgrades.upgradeProxy(contracdtAddress, contractFactory);

    const contract = await newContract.deployed();
    console.log("upgrade address ", contract.address);

    console.log('completed.');

}

main();
