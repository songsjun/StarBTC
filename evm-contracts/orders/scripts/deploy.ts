// @ts-ignore
import { network, ethers, upgrades, getChainId } from 'hardhat'
import "@openzeppelin/hardhat-upgrades";
import {deployOrderFactory, readConfig, writeConfig} from "./helper";

async function main() {
  let chainID = await getChainId();
  console.log("chainID ", chainID);
  let signers = await ethers.getSigners()
  let deployer = signers[0]
  let loanTools = "0x98568A3abB586B92294cDb4AD5b03E560BCADb06";
  if (chainID == 21) {
    loanTools= "0x9b5f23a95A1627cd59791FA1950Dd1c9DEC41F69";
  }
  let orderFactory = await readConfig(network.name, "ORDER_FACTORY");
  console.log("orderFactory = ", orderFactory);

  if (network.name == "prod") {
    loanTools = "";
  }
  const factory = await ethers.getContractFactory("LoanContract", deployer);
  let contract = await upgrades.deployProxy(factory,
      [
        loanTools,
        orderFactory
      ],
      {
        initializer:  "initialize",
        unsafeAllowLinkedLibraries: true,
      });
  await writeConfig(network.name, network.name, "LOAN_CONTRACT", contract.address);

  await contract.deployed();

  console.log("contract deployed ", contract.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
