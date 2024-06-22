// @ts-ignore
import { network, ethers, upgrades, getChainId } from 'hardhat'
import {readConfig} from "./helper";


async function main() {
    let chainId = await getChainId();
    console.log("chainId is :" + chainId, " network ", network.name);

    const [ deployer ] = await ethers.getSigners();
    console.log("Deployer address", deployer.address);

    const interestAddress = await readConfig(network.name, "INTEREST");

    console.log("Interest address", interestAddress);

    const contractFactory = await ethers.getContractFactory("Interest");
    const newContract = await upgrades.upgradeProxy(interestAddress, contractFactory);

    const contract = await newContract.deployed();
    console.log("upgrade address ", contract.address);

    console.log('completed.');

}

main();
