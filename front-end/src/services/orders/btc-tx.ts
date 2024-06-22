import { isMainnetNetworkInUse } from '@services/network/network';
import { sha256 } from '@utils/crypto/sha256';
import { Transaction, address, networks } from 'bitcoinjs-lib';

const EMPTY_BUFFER = Buffer.allocUnsafe(0);
const BUFFER_ONE = Buffer.from([0x01]);
const SIGHASH_ALL_BUFFER = Buffer.from([Transaction.SIGHASH_ALL]);

// export const LENDER_LOCK_TIME = 4195654; // 8 days in uint32, according to zehua
// export const BORROWER_LOCK_TIME = 4196835; // 15 days in uint32, according to zehua

type BTCUTXO = {
  txid: string;
  hash: string;
  value: string; //satoshi
  height: number;
  vout: number;
  confirmations: number;
  scriptPubKey?: string;
  utxoHex?: string
}

export enum LockScriptTransactionPurpose {
  UNSIGNED, /** Purpose of creating the transaction is only to get the raw transaction, possibly to sign it, without publishing now */

  // Publish purpose
  BORROWER_LENDER_UNLOCK, /** Case 1 - regular case, lender confirms repayment normally */
  BORROWER_ARBITER_UNLOCK, /** Case 2 - Lender didn't confirm payment, lender asked arbiter to confirm the repayment and unlock */
  LENDER_TIME_UNLOCK, /** Case 3 - Borrower didn't repay, lender gets the BTC */
  BORROWER_TIME_UNLOCK /** Case 4 - Last case, if all other cases weren't used, lender can get his BTC back after time 2 */
}

/**
 * Here is the list of various witnesses that must be created based on the conditional branch we want to execute in the script:
 * Bob is the lender, Alice is the borrower.
 *
 * - LockScriptTransactionPurpose.BORROWER_LENDER_UNLOCK:
 *    - Alice + Bob sign
 *    - Witness: [BobSignature, AliceSignature, [0x01], script]
 * - LockScriptTransactionPurpose.BORROWER_ARBITER_UNLOCK:
 *    - Alice + Arbiter sign
 *    - Witness: [ArbiterSignature, AliceSignature, [0x01], nil, script]
 * - LockScriptTransactionPurpose.LENDER_TIME_UNLOCK:
 *    - After LockTimeBob, Bob signs + preImage reveal
 *    - Witness: [preimage, BobSignature, [0x01], nil, nil, script]
 *    - txIn[0].sequence = LockTimeBob
 * - LockScriptTransactionPurpose.BORROWER_TIME_UNLOCK:
 *    - After LockTimeAlice, Alice signs
 *    - Witness: [AliceSignature, nil, nil, nil, script]
 *    - txIn[0].sequence = LockTimeAlice
 */
const appendWitnesses = (purpose: LockScriptTransactionPurpose, transaction: Transaction, script: string, borrowerUnlockSignature: string = null, lenderUnlockSignature: string = null, preImage: string = null) => {
  // Sign only, don't add any witness
  if (purpose === LockScriptTransactionPurpose.UNSIGNED)
    return;

  console.log("script:", script);

  const scriptBuffer = Buffer.from(script, 'hex');
  const borrowerSignatureBuffer = borrowerUnlockSignature && Buffer.concat([Buffer.from(borrowerUnlockSignature, 'hex'), SIGHASH_ALL_BUFFER]);
  const lenderSignatureBuffer = lenderUnlockSignature && Buffer.concat([Buffer.from(lenderUnlockSignature, 'hex'), SIGHASH_ALL_BUFFER]);
  const preImageBuffer = preImage && Buffer.from(preImage, 'hex');

  console.log("preImage", preImage)
  console.log("preImage hash", preImageBuffer && sha256(preImageBuffer)?.toString("hex"))

  let witness: Buffer[];
  switch (purpose) {
    case LockScriptTransactionPurpose.BORROWER_LENDER_UNLOCK:
      if (!lenderSignatureBuffer || !borrowerSignatureBuffer || !scriptBuffer)
        throw new Error(`appendWitnesses() error: purpose BORROWER_LENDER_UNLOCK requires lender, borrower and script buffers`);

      witness = [lenderSignatureBuffer]
        .concat(borrowerSignatureBuffer)
        .concat(BUFFER_ONE)
        .concat(scriptBuffer);
      break;

    case LockScriptTransactionPurpose.LENDER_TIME_UNLOCK:
      if (!preImage)
        throw new Error(`preImage must be provided when transaction purpose is LENDER_TIME_UNLOCK!`);

      if (!preImageBuffer || !lenderSignatureBuffer || !scriptBuffer)
        throw new Error(`appendWitnesses() error: purpose LENDER_TIME_UNLOCK requires preImage, lender and script buffers`);

      witness = [preImageBuffer]
        .concat(lenderSignatureBuffer)
        .concat(BUFFER_ONE)
        .concat(EMPTY_BUFFER)
        .concat(EMPTY_BUFFER)
        .concat(scriptBuffer);
      break;

    default:
      throw new Error(`Unhandled lock transaction script purpose ${purpose}`);
  }

  transaction.setWitness(0, witness);
}

const appendFakeWitnesses = (transaction: Transaction, script: string) => {
  const scriptBuffer = Buffer.from(script, 'hex');
  const borrowerSignatureBuffer = Buffer.concat([Buffer.alloc(34), SIGHASH_ALL_BUFFER]);
  const lenderSignatureBuffer = Buffer.concat([Buffer.alloc(34), SIGHASH_ALL_BUFFER]);
  const preImageBuffer = Buffer.alloc(66); // Our pre-image being made by eth_signedTypedV4, we always get a 66 bytes buffer

  const witness = [preImageBuffer]
    .concat(lenderSignatureBuffer)
    .concat(borrowerSignatureBuffer)
    .concat(EMPTY_BUFFER)
    .concat(EMPTY_BUFFER)
    .concat(scriptBuffer);

  transaction.setWitness(0, witness);
}

/**
 * @param inputUTXO UTXO to spend. Normally, only one UTXO, the only one owned by the unlock script address.
 * @param script The unlock script (from createLendingLockP2WSHScript())
 * @param outputAddress The unlock script address (from createLendingLockP2WSHScript())
 * @param valueInSat The gross output utxo value. Gas fees will be automatically computed and deduced from this value
 */
export const createBitcoinTransactionForLoanScript = (
  purpose: LockScriptTransactionPurpose,
  includeWitnesses: boolean,
  inputUTXO: BTCUTXO,
  script: string,
  outputAddress: string, // ie: borrower address
  borrowerUnlockSignature: string = null,
  lenderUnlockSignature: string = null,
  outputValueSat: number,
  preImage: string,
  satsPerVb: number,
  lockTime1: number, // script-encoded format, including the SequenceLockTimeIsSeconds byte and groups of 512 seconds
  lockTime2: number // script-encoded format, including the SequenceLockTimeIsSeconds byte and groups of 512 seconds
): Transaction => {
  let lockTime: number;
  switch (purpose) {
    case LockScriptTransactionPurpose.LENDER_TIME_UNLOCK:
      lockTime = lockTime1;
      if (!lockTime)
        throw new Error("You may not use a lockTime of 0 when purpose is LENDER_TIME_UNLOCK! Check params");
      break;
    case LockScriptTransactionPurpose.BORROWER_TIME_UNLOCK:
      lockTime = lockTime2;
      if (!lockTime)
        throw new Error("You may not use a lockTime of 0 when purpose is BORROWER_TIME_UNLOCK! Check params");
      break;
    default:
      lockTime = 0;
  }

  const network = isMainnetNetworkInUse() ? networks.bitcoin : networks.testnet;

  const scriptAddress = address.toOutputScript(outputAddress, network);

  // First create a fake TX with placeholder witnesses, to simulate the largest possible fully signed transaction, to ensure we compute enough gas
  const fakeTx = new Transaction();
  fakeTx.version = 2;
  fakeTx.addInput(Buffer.from(inputUTXO.txid, 'hex').reverse(), inputUTXO.vout, lockTime);
  fakeTx.addOutput(scriptAddress, 0)
  appendFakeWitnesses(fakeTx, script);

  // Deduce the tx cost from the expected output value
  const txSize = fakeTx.virtualSize(); // satspervb
  const txCost = Math.ceil(txSize * satsPerVb);
  const realOutputValue = Math.max(0, outputValueSat - txCost); // Output can never be below 0, and always an integer number of sats

  console.log("Real output value after gas deduction:", realOutputValue);

  if (realOutputValue === 0)
    throw new Error(`Transaction fees cannot cover the total number of BTC in the transaction. Provided ${outputValueSat} sats in total, transaction cost is ${txCost} sats.`);

  // Build the real transaction, using the right output value
  const tx = new Transaction();
  tx.version = 2;
  tx.addInput(Buffer.from(inputUTXO.txid, 'hex').reverse(), inputUTXO.vout, lockTime);
  tx.addOutput(scriptAddress, realOutputValue);
  if (includeWitnesses) {
    // Append witnesses if any
    appendWitnesses(purpose, tx, script, borrowerUnlockSignature, lenderUnlockSignature, preImage);
  }

  console.log("Purpose:", purpose);
  console.log("Include witnesses?:", includeWitnesses);
  console.log("Script:", script);
  console.log("Input UTXO:", inputUTXO);
  console.log("lockTime:", lockTime);
  console.log("Borrower signature:", borrowerUnlockSignature);
  console.log("Lender signature:", lenderUnlockSignature);
  console.log("Output address:", scriptAddress.toString("hex"));
  console.log("Initial output value:", outputValueSat);
  console.log("Real output value:", realOutputValue);
  console.log("Preimage:", preImage);
  console.log("TX object:", tx);
  console.log("Created tx HEX:", tx.toHex());
  console.log("Created tx HASH:", tx.getHash().toString("hex"));

  return tx;
}
