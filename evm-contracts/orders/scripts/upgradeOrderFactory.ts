// @ts-ignore
import { network, ethers, upgrades, getChainId } from 'hardhat'
import {readConfig} from "./helper";


async function main() {
    let chainId = await getChainId();
    console.log("chainId is :" + chainId, " network ", network.name);

    const [ deployer ] = await ethers.getSigners();
    console.log("Deployer address", deployer.address);

    const orderFactoryAddress = await readConfig(network.name, "ORDER_FACTORY");

    console.log("orderFactory address", orderFactoryAddress);

    const contractFactory = await ethers.getContractFactory("OrderFactory");
    const newContract = await upgrades.upgradeProxy(orderFactoryAddress, contractFactory);

    const contract = await newContract.deployed();
    console.log("upgrade address ", contract.address);

    console.log('completed.');

}

main();
