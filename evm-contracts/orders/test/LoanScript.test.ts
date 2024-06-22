// @ts-ignore
import {ethers, upgrades, getChainId, network} from 'hardhat'
import "@openzeppelin/hardhat-upgrades";
import {BigNumber} from "ethers";

describe(`Interest Test `, () => {
    let contract: any;
    let signers = [];
    it("Deploy", async function () {
        let chainID = await getChainId();
        console.log("chainID ", chainID);
        signers = await ethers.getSigners()
        let deployer = signers[0]
        const factory = await ethers.getContractFactory("LoanScript", deployer);
        contract = await upgrades.deployProxy(factory,
            [
            ],
            {
                initializer:  "initialize",
                unsafeAllowLinkedLibraries: true,
            });

        await contract.deployed();
        console.log("contract deployed ", contract.address);
    });


    it("getScript test", async ()=> {
        let alice="0x020f8cb5261195d88c95a76fd3007e16814a2e39f994c685988e770ce45d9783f7";
        let bob = "0x02a12298f9e970f87b2d2059c8ac5bb95f34c1b4a2b5013c5120fabb7120e184e2";
        let arbiter="0x0200493eb975eedf5d5d2f7f5458e790e8264576ec137df06c8f3f90c91b0a6f78";
        let lockTime1=4194305;
        let lockTime2=4194810;
        let preImagehash="0x9f64a747e1b97f131fabb6b447296c9b6f0201e79fb3c5356e6c77e89b6a806a";
        let data = await contract.getScript(alice, bob, arbiter, lockTime1, lockTime2, preImagehash);
        console.log("getScript=", data);
    })

})
