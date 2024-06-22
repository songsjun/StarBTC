// @ts-ignore
import { network, ethers, upgrades, getChainId } from 'hardhat'
import {readConfig} from "./helper";


async function main() {
    let chainId = await getChainId();
    console.log("chainId is :" + chainId, " network ", network.name);

    const [ deployer ] = await ethers.getSigners();
    console.log("Deployer address", deployer.address);

    const orderContract = "0x06A5B28fABAB9aFdED03B3871a517830658a41C0";

    console.log("orderContract address", orderContract);

    const contractFactory = await ethers.getContractFactory("OrderProxy");
    let contract  = await contractFactory.connect(deployer).attach(orderContract);
    console.log("order proxy address ", await contract.address);
    console.log("implement address ", await contract.getImplementation());

    const OrderFactory = await ethers.getContractFactory("Order");
    let deployedOrder = await OrderFactory.deploy();
    await deployedOrder.deployed();
    console.log("new order upgrade to", deployedOrder.address);
    let tx = await contract.upgradeTo(
        deployedOrder.address,
    );
    console.log("tx== ", tx.hash);
    await tx.wait();
    console.log('completed.');
}

main();
