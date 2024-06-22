import { isMainnetNetworkInUse } from '@services/network/network';
import * as bitcoin from 'bitcoinjs-lib';

type P2WSHScriptAndAddress = {
  script: string;
  address: string;
}

/**
 * Creates the bitcoin script (and its address) used to lock borrowers BTC during the loan.
 */
export const createLendingLockP2WSHScript = (
  borrowerPublicKey: string,
  lenderPublicKey: string,
  arbiterPublicKey: string,
  preImageHash: string, // sha256 hash of the preImage
  lockTime1: number, // script-encoded format, including the SequenceLockTimeIsSeconds byte and groups of 512 seconds
  lockTime2: number // script-encoded format, including the SequenceLockTimeIsSeconds byte and groups of 512 seconds
): P2WSHScriptAndAddress => {
  const borrowerPublicKeyBuffer = Buffer.from(borrowerPublicKey, 'hex');
  const lenderPublicKeyBuffer = Buffer.from(lenderPublicKey, 'hex');
  const arbiterPublicKeyBuffer = Buffer.from(arbiterPublicKey, 'hex');
  const preImageHashBuffer = Buffer.from(preImageHash, 'hex')

  const lenderLockTime = lockTime1;
  const borrowerLockTime = lockTime2;
  const lenderLockTimeBuffer = bitcoin.script.number.encode(lenderLockTime)
  const borrowerLockTimeBuffer = bitcoin.script.number.encode(borrowerLockTime)

  console.log("borrowerPublicKeyBuffer", borrowerPublicKeyBuffer);
  console.log("lenderPublicKeyBuffer", lenderPublicKeyBuffer);
  console.log("arbiterPublicKeyBuffer", arbiterPublicKeyBuffer);
  console.log("preImageHashBuffer", preImageHashBuffer);
  console.log("lenderLockTime", lenderLockTime);
  console.log("borrowerLockTime", borrowerLockTime);
  console.log("lockTime1", lockTime1);
  console.log("lockTime2", lockTime2);

  // Get P2WSH script
  const script = bitcoin.script.compile([
    bitcoin.opcodes.OP_IF,
    borrowerPublicKeyBuffer, bitcoin.opcodes.OP_CHECKSIGVERIFY,
    lenderPublicKeyBuffer, bitcoin.opcodes.OP_CHECKSIG,
    bitcoin.opcodes.OP_ELSE,
    bitcoin.opcodes.OP_IF,
    borrowerPublicKeyBuffer, bitcoin.opcodes.OP_CHECKSIGVERIFY,
    arbiterPublicKeyBuffer, bitcoin.opcodes.OP_CHECKSIG,
    bitcoin.opcodes.OP_ELSE,
    bitcoin.opcodes.OP_IF,
    lenderLockTimeBuffer, bitcoin.opcodes.OP_CHECKSEQUENCEVERIFY, bitcoin.opcodes.OP_DROP,
    lenderPublicKeyBuffer, bitcoin.opcodes.OP_CHECKSIGVERIFY,
    bitcoin.opcodes.OP_SHA256, preImageHashBuffer, bitcoin.opcodes.OP_EQUAL,
    bitcoin.opcodes.OP_ELSE,
    borrowerLockTimeBuffer, bitcoin.opcodes.OP_CHECKSEQUENCEVERIFY, bitcoin.opcodes.OP_DROP,
    borrowerPublicKeyBuffer, bitcoin.opcodes.OP_CHECKSIG,
    bitcoin.opcodes.OP_ENDIF,
    bitcoin.opcodes.OP_ENDIF,
    bitcoin.opcodes.OP_ENDIF
  ]);

  console.log("script buffer hex", script.toString("hex"))
  console.log("script ASM", bitcoin.script.toASM(script))

  // console.log('script:', script.toString('hex'))

  //  Get P2WSH address
  const p2wsh = bitcoin.payments.p2wsh({ redeem: { output: script, network: isMainnetNetworkInUse() ? bitcoin.networks.bitcoin : bitcoin.networks.testnet } });
  const address = p2wsh.address;

  console.log("address", address);

  return { script: bitcoin.script.toASM(script), address: address };
}
