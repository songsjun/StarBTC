// @ts-ignore
import { network, ethers, upgrades, getChainId } from 'hardhat'
import {readConfig} from "./helper";
const { MerkleTree } = require('merkletreejs')
import {getBlock, getTransactionDetails} from "./btcAPI"
import {createHash} from "node:crypto";

async function main() {
    let chainID = await getChainId();
    console.log("chainID==", chainID)

    let accounts = await ethers.getSigners()
    let account = accounts[0]
    console.log("account", account.address)
    let orderContractAddress = "0x8c80d70da5b287573b8d250eb71c9cb09e0be2f9"//"0xd6c4B6A09C1116E7ce44d8fbFA924d74FE79D2F0";//"0xe391cd92074b5e8af68504f53c104c51da7d5299";
    const contractFactory = await ethers.getContractFactory('Order',account)
    let contract  = await contractFactory.connect(account).attach(orderContractAddress);
    let btcTx = "f4999076f606992c9e1c2d3a884fbce2d7ebff9f4db22978742d417d7ec3cac7";
    // let params:object = await getFillOrderProofParams(btcTx);
    // console.log("params = ", params);
    // struct MerkleProofData {
    //     bytes32[] proof;
    //     bytes32 root;
    //     bytes32 leaf;
    //     bool[] flags;
    // }
    let proof =  [
        '0x060224fa599772914a17b10dd6ce541564646e0748859c2f1fc5ffb1f0d9e117',
        '0x1ea4f442fc28e9d8ae131c9382d5dc2a122f513b39bfc164cb3315d280260c22',
        '0xe97172d1b396f756e9db6d8e3caa377f9a3bfaa6d10eec6aa3d83a43a7f92652',
        '0xbc3ecdad9613cb645d3c4f2a610f4775bdd4ec1cad5defeba4aacc3abe0cf865',
        '0xb97346bbe8f4a32e4260ef927d76c007b4e5753fd1396e2dce0866fe5a00673a',
        '0x880d190c04bbc574816ec915ff2675f54d22f528603f15230d5933eda1fc83bc',
        '0x8ff1303a051e9a815c937dbd7ae66e609d4537122c2b66b260412b03fc8dde04',
        '0x7bdf5b7a487916d7d29fa69c88620685998b39e9292f33d6255762d923955d99',
        '0x35de955bd6c7bd7d2eced30685986e71774549065753d5897bff1d6dcb6e85ce',
        '0xae1481fb9dd5a2f1fa4aeee42107af96d26dd37767bffdc275932ca0ef023e17',
        '0x340da234fb5c5b3b715c7570fe9f7638db073d7b1cec92a46ca122501014b06c',
        '0x21dc452ad80728846211133638f48de98c3e3f4cb3f68295f2b78caf66040162',
        '0x016cd2ecffa57b041d6809d1346475832580ec71aad495f894c5d6c04d467806'
    ]
    let merkleRoot = "0x4e89064023b04e9953fc2f56c9a04cbfefc466fcd04c2a43a2a25cfc72ce0be8";
    let leaf = "0xf4999076f606992c9e1c2d3a884fbce2d7ebff9f4db22978742d417d7ec3cac7";
    let flags = [
            true,  true,  false,
            false, false, true,
            false, false, true,
            true,  true,  true,
            true
        ]
    ;
    let merkleData={
        proof: proof,
        root: merkleRoot,
        leaf: leaf,
        flags: flags
    }
    let rawData="0x02000000000101c18203699c5b0576590bba5f32828e6efe09ae07217547fadeffe0e49d4979d000000000000000000001230a000000000000225120cfadd81c404e6a858d412f2418ecfcc3c0af57bda66a53f8fddd69973e278da8044730440220369a835e71b33d8b950007041e70637d6455aa02efcb2e1f3c53263e7aef8b3e022074772eb3680b574bef56960b822bfb1006f5c66276349b23c84114380790e790014730440220369a835e71b33d8b950007041e70637d6455aa02efcb2e1f3c53263e7aef8b3e022074772eb3680b574bef56960b822bfb1006f5c66276349b23c84114380790e790010101fd0a016321020e0ae8c8fb9645dbdf6425b173f8ade49b5abbac20d887d98e8515d02a97ddddad21020e0ae8c8fb9645dbdf6425b173f8ade49b5abbac20d887d98e8515d02a97ddddac676321020e0ae8c8fb9645dbdf6425b173f8ade49b5abbac20d887d98e8515d02a97ddddad210366e0c54864cf3468e2d9f047cfd6e971ab4c0b779499b9d8bbc7000178dfe627ac676303e30940b27521020e0ae8c8fb9645dbdf6425b173f8ade49b5abbac20d887d98e8515d02a97ddddada820380f1c94ebb4e344a3a7e8ad10812794a9fb79c8edafa5fd1d981cf571055027876703800e40b27521020e0ae8c8fb9645dbdf6425b173f8ade49b5abbac20d887d98e8515d02a97ddddac68686800000000";
    let utxos=["0x0200000000010148923bffc62ca4e2c9fae02fac35672ef3127d3b3e3b7aa3348101cf9c0f4ee40100000000ffffffff023525000000000000220020104653132b02fba366f379279f9d3e0faa21f2a7ac11c32f4ef4187c63a9a550f088050000000000225120cfadd81c404e6a858d412f2418ecfcc3c0af57bda66a53f8fddd69973e278da80140728f48947d1f3b6de7b6e3e6bf6ba1bfac443ef61b68363bdedce1c46981a6ab4918b0a8b443dc04342ed48a2898dd451a27d680f607f64290f4ebbb2996d38e00000000"];
    let blockHeight =847592;
    let tx = await contract.submitRegularUnlockTransferProof(rawData,utxos,blockHeight,merkleData);
    console.log("tx=",tx.hash)
}

async function getFillOrderProofParams(txId) {
    console.log("Building fill order proof parameters for transaction ID:", txId);

    const txDetails = await getTransactionDetails(txId);
    if (!txDetails) {
        console.log("no transaction", txId);
        return null;
    }
    const { blockInfo, txIds } = (await getBlock(txDetails["blockHash"], true)) || {};
    if (!blockInfo) {
        console.log("error block", txDetails["blockHash"]);
        return null;
    }
    const blockHeight = blockInfo.height;
    const txRawData = "0x" + txDetails.hex;
    const { merkleRoot, proof, leaf, positions } = generateMerkleProof(txIds, txId);

    // TBD: Apparently, the utxos array is composed of the raw transaction data (not byte reversed) of every parent transaction in "vin"
    const utxos = [];
    for (const vin of txDetails["vin"]) {
        const txData = await getTransactionDetails(vin["txid"]);
        if (!txData)
            return null;

        utxos.push("0x" + txData.hex);
    }

    return {
        blockHeight,
        txRawData,
        utxos,
        proof,
        merkleRoot,
        leaf,
        positions
    };
}

function generateMerkleProof(btcTxIds, paymentBtcTxId) {
    const leaf = "0x" + paymentBtcTxId;
    const leaves = btcTxIds.map(tx => "0x" + tx);
    const tree = new MerkleTree(leaves, sha256, { isBitcoinTree: true, duplicateOdd: false, sort: false });
    const merkleRoot = tree.getHexRoot();
    const proof = tree.getHexProof(leaf);
    const positions = tree.getProof(leaf).map(p => p.position === "right");

    console.log("Computed tree root:", tree.getHexRoot())
    console.log("Verified?:", tree.verify(tree.getProof(leaf), leaf, tree.getRoot()));
    // console.log(tree.toString())

    return {
        merkleRoot,
        leaf,
        proof,
        positions
    };
}

function sha256(data) {
    const hash = createHash('sha256');
    hash.update(data);
    let digest = hash.digest("hex");
    return digest;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
