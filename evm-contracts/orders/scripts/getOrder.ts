// @ts-ignore
import { network, ethers, upgrades, getChainId } from 'hardhat'
import {readConfig} from "./helper";

async function main() {
    let chainID = await getChainId();
    console.log("chainID==", chainID)

    let accounts = await ethers.getSigners()
    let account = accounts[0]
    console.log("account", account.address)
    let orderContractAddress = "0x4f1af87091245f70adddac1a4ceafa6f7c91dabc"//"0xd6c4B6A09C1116E7ce44d8fbFA924d74FE79D2F0";//"0xe391cd92074b5e8af68504f53c104c51da7d5299";
    const contractFactory = await ethers.getContractFactory('Order',account)
    let contract  = await contractFactory.connect(account).attach(orderContractAddress);

    let script = await contract.loanScript();
    console.log("script ", script);

    let interestRate = await contract.interestRate();
    console.log("interestRate=", interestRate);


    let interestValue = await contract.interestValue();
    console.log("interestValue", interestValue);

    // let workNetwork = await contract.network();
    // console.log("network ", workNetwork);

    let orderStatus = await contract.status();
    console.log("orderStatus=", orderStatus);

    let collateralAmount = await contract.collateralAmount();
    console.log("collateralAmount=", collateralAmount);
    let lenderAddress = await contract.lenderBtcAddress();
    console.log("lenderAddress ", lenderAddress);

    let lender = await contract.lender();
    console.log("lender=", lender);

    let borrower = await contract.borrower();
    console.log("borrower=", borrower);

    let token = await contract.token();
    console.log("token=", token);


    let borrowerBtcAddress = await contract.borrowerBtcAddress();
    console.log("borrowerBtcAddress=", borrowerBtcAddress);
    let toBorrowerBtcTx = await contract.toBorrowerBtcTx();
    console.log("toBorrowerBtcTx=", toBorrowerBtcTx);

    let toLenderBtcTx = await contract.toLenderBtcTx();
    console.log("toLenderBtcTx=", toLenderBtcTx);
    let borrowerProofStatus = await contract.getToLenderTransferZkpStatus();
    console.log("borrowerProofStatus",borrowerProofStatus);

    let lenderProofStatus = await contract.getRegularUnlockTransferZkpStatus();
    console.log("lenderProofStatus",lenderProofStatus);

    let tokenAmount = await contract.tokenAmount();
    console.log("tokenAmount ", tokenAmount);


    let takenTime = await contract.takenTime();
    console.log("takenTime", takenTime);
    let takenExpireTime = await contract.takenExpireTime();
    console.log("takenExpireTime", takenExpireTime);

    let createTime = await contract.createTime();
    console.log("createTime", createTime);

    let lockTime1 = await contract.lockTime1();
    console.log("lockTime1", lockTime1);
    let lockTime2 = await contract.lockTime2();
    console.log("lockTime2", lockTime2);

    let borrowerProofTime = await contract.borrowerProofTime();
    console.log("borrowerProofTime = ", borrowerProofTime);

    let submitProofExpireTime = await contract.submitProofExpireTime();
    console.log("submitProofExpireTime = ", submitProofExpireTime);

    let borrowedTime = await contract.borrowedTime();
    console.log("borrowedTime = ", borrowedTime);

    let preImage = await contract.preImage();
    console.log("preImage ", preImage);
    let preImageHash = await contract.preImageHash();
    console.log("preImageHash= ", preImageHash);

    let requestArbitratorCostUSDT = await contract.getArbitrationRequestCost();
    console.log("requestArbitratorCostUSDT = ", requestArbitratorCostUSDT);

    let lenderConfirmRewardsTips = await contract.lenderConfirmRewardsTips();
    console.log("lenderConfirmRewardsTips = ", lenderConfirmRewardsTips);

    let borrowerConfirmRewardsTips = await contract.borrowerConfirmRewardsTips();
    console.log("borrowerConfirmRewardsTips = ", borrowerConfirmRewardsTips);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
