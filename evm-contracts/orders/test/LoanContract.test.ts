// @ts-ignore
import {ethers, upgrades, getChainId, network} from 'hardhat'
import "@openzeppelin/hardhat-upgrades";
import {sleep, writeConfig} from "../scripts/helper";
import {BigNumber} from "ethers";

describe(`LoanContract Test `, () => {
    let contract;
    let signers = [];
    it("Deploy", async function () {
        let chainID = await getChainId();
        console.log("chainID ", chainID);
        let signers = await ethers.getSigners()
        let deployer = signers[0]
        let loanTools = "0x98568A3abB586B92294cDb4AD5b03E560BCADb06";
        if (chainID == 21) {
            loanTools= "0x9b5f23a95A1627cd59791FA1950Dd1c9DEC41F69";
        }
        const factory = await ethers.getContractFactory("LoanContract", deployer);
        contract = await upgrades.deployProxy(factory,
            [
                loanTools
            ],
            {
                initializer:  "initialize",
                unsafeAllowLinkedLibraries: true,
            });

        await contract.deployed();
        contract.on("OrderCreated", async (orderId, orderType, collateral, token, tokenAmount) => {
            console.log("OrderCreated event received:", {
                orderId: orderId,
                orderType: orderType,
                collateral: collateral,
                token: token,
                tokenAmount: tokenAmount
            });
        })
        console.log("contract deployed ", contract.address);
        await sleep(2000);
    });

    it("CreateBorrowOrder Test", async ()=> {

        let usdt= "0x0daddd286487f3a03Ea9A1b693585fD46cdCcF9F";
        let decimalNum = BigNumber.from("1000000000000000000");
        let lendingAmount = decimalNum.mul(1);
        let lendingDays = 1 * 7;
        let btcAddress = "2N9BmGSMvd7srA5vUaf5htbwuQoWh79sKUg";
        let publicKey = "0x7c18b9b7a9b51e978f5a25ace2ea081b84bec00dca1f02145b576455b454edf4";
        let confirmPaymentTip = decimalNum.mul(1);
        let tx = await contract.createBorrowOrder(usdt, lendingAmount, lendingDays, btcAddress, publicKey,confirmPaymentTip);
        console.log("createBorrowOrder ", tx.hash);
        tx.wait();
        await sleep(2000);
    })

    // it("CreateLendingOrder Test", async ()=> {
    //     let usdt= "0x0daddd286487f3a03Ea9A1b693585fD46cdCcF9F";
    //     let decimalNum = BigNumber.from("1000000000000000000");
    //     let lendingAmount = decimalNum.mul(15);
    //     lendingAmount = lendingAmount.div(100);
    //     let lendingDays = 1 * 7;
    //     let lenderAddressType = 2;
    //     let publicKey = "0x036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5";
    //
    //     let tx = await contract.createLendingOrder(usdt, lendingAmount, lendingDays, lenderAddressType, publicKey);
    //     console.log("createLendingOrder ", tx.hash);
    //     tx.wait();
    //     await sleep(2000);
    // })


    // it("testTapScript Test", async ()=> {
    //     let pka = "0x020f8cb5261195d88c95a76fd3007e16814a2e39f994c685988e770ce45d9783f7";
    //     let pkb = "0x02a12298f9e970f87b2d2059c8ac5bb95f34c1b4a2b5013c5120fabb7120e184e2";
    //     let pkc = "0x0200493eb975eedf5d5d2f7f5458e790e8264576ec137df06c8f3f90c91b0a6f78";
    //
    //
    //     let tx = await contract.testTapScript(pka, pkb, pkc, 4194305, 4194810, "0x9f64a747e1b97f131fabb6b447296c9b6f0201e79fb3c5356e6c77e89b6a806a");
    //     console.log("tx.hash = ", tx.hash);
    //     tx.wait();
    //
    //     let a = await contract.getScript();
    //     let hexa = Buffer.from(a).toString("hex");
    //     console.log("hexa== ", hexa);

        // hexa="6321020f8cb5261195d88c95a76fd3007e16814a2e39f994c685988e770ce45d9783f7ad2102a12298f9e970f87b2d2059c8ac5bb95f34c1b4a2b5013c5120fabb7120e184e2ac676321020f8cb5261195d88c95a76fd3007e16814a2e39f994c685988e770ce45d9783f7ad210200493eb975eedf5d5d2f7f5458e790e8264576ec137df06c8f3f90c91b0a6f78ac676303010040b2752102a12298f9e970f87b2d2059c8ac5bb95f34c1b4a2b5013c5120fabb7120e184e2ada8209f64a747e1b97f131fabb6b447296c9b6f0201e79fb3c5356e6c77e89b6a806a876703fa0140b27521020f8cb5261195d88c95a76fd3007e16814a2e39f994c685988e770ce45d9783f7ac686868";
    // })



})
