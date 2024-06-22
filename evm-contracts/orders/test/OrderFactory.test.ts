// @ts-ignore
import {ethers, upgrades, getChainId, network} from 'hardhat'
import "@openzeppelin/hardhat-upgrades";
import {BigNumber} from "ethers";
import {writeConfig} from "../scripts/helper";

describe(`Interest Test `, () => {
    let contract: any;
    let signers = [];
    it("Deploy", async function () {
        let chainID = await getChainId();
        console.log("chainID ", chainID);
        signers = await ethers.getSigners()
        let deployer = signers[0]
        const factory = await ethers.getContractFactory("OrderFactory", deployer);
        contract = await upgrades.deployProxy(factory,
            [
            ],
            {
                initializer:  "initialize",
                unsafeAllowLinkedLibraries: true,
            });
        await contract.deployed();
        console.log("OrderFactory deployed", contract.address);

        const newContract = await upgrades.upgradeProxy(contract.address, factory);

        contract = await newContract.deployed();
        console.log("orderFactory upgraded");
    });


    it("createOrder test", async ()=> {
        let _loanTools = "0xc34a9318d0F436eB02FBA6eCF32eacc5Ea86454D";
        let _takenExpireTime = 3;
        let _submitProofExpireTime = 25;
        let _repaidExpireTime = 43;
        let _proofedDelayBlock = 1;
        let _arbitrationPayee = signers[0].address;
        let _lockTime1 = 23232;
        let _lockTime2 = 23232;

        let tx = await contract.createOrder(_loanTools,_takenExpireTime,_submitProofExpireTime,_repaidExpireTime,
            _proofedDelayBlock,_arbitrationPayee,_lockTime1,_lockTime2);
        console.log("tx=", tx.hash);

    })

})
