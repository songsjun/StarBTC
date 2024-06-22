// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {

  const ZkpOrder = await hre.ethers.getContractFactory("ZkpOrder");
  const implementation = await ZkpOrder.deploy();
  await implementation.deployed();

  const ownerUpgrade = "";
  const verifier = "0x3E368795f3d125f46267fe4a82e9433c13e710D6";
  const data = logic.interface.encodeFunctionData("initialize", [verifier]);
  const TransparentProxy = await ethers.getContractFactory("ZkpOrderProxy");
  const proxy = await TransparentProxy.deploy(implementation.address, ownerUpgrade, data);
  await proxy.deployed();

  const order = await ethers.getContractAt("ZkpOrder", proxy.address);

  console.log(`deployed to ${order.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
