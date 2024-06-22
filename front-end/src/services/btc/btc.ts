import ecc from '@bitcoinerlab/secp256k1';
import { reverseHexString } from "@services/evm/conversions";
import { doubleSha256 } from "@utils/crypto/sha256";
import BigNumber from "bignumber.js";
import { initEccLib } from "bitcoinjs-lib";
const bip66 = require('bip66'); // No existing TS types

// Init curve for BTC taproot address support
initEccLib(ecc);

export const satsPerBTC = new BigNumber("100000000");

export const BTC_ZERO_TX_ID = "0000000000000000000000000000000000000000000000000000000000000000";

export const btcToSats = (btc: BigNumber | string | number): BigNumber => {
  return satsPerBTC.multipliedBy(btc);
}

export const satsToBtc = (sats: BigNumber | string): BigNumber => {
  return new BigNumber(sats).dividedBy(satsPerBTC);
}

/**
 * Rounds the given BTC value, which might contain lots of decimals (eg after rate conversion)
 * into the closest valid satoshi value.
 */
export const toClosestValidValue = (btcAmount: BigNumber): BigNumber => {
  if (!btcAmount)
    return undefined;

  return btcAmount.multipliedBy(satsPerBTC).decimalPlaces(0).dividedBy(satsPerBTC);
}

/**
 * Converts a bytes sequence coming from bitcoin chain such a transaction or block ID, not
 * starting with 0x, into a reverted endianness string starting with 0x (to use on an EVM).
 */
export const btcToEVMHexBytes = (btcHexBytes: string): string => {
  return reverseHexString(`0x${btcHexBytes}`);
}

export const isNullBitcoinTxId = (txId: string): boolean => {
  return !txId || txId === BTC_ZERO_TX_ID;
}

export const isValidBtcTransactionHash = (hash: string): boolean => {
  if (hash.length !== 64)
    return false;

  // Check if all characters are valid hexadecimal digits
  const hexRegex = /^[0-9a-fA-F]+$/;
  return hexRegex.test(hash);
}

/**
 * Converts a 64 bytes string coming from a bitcoin wallet signData(), made of R|S components,
 * into a DER signature ready to publish as a bitcoin transaction.
 */
export const rsSignatureToDer = (rs: string): string => {
  const rsBuffer = Buffer.from(rs, "hex");
  if (rsBuffer.length != 64)
    throw new Error('Invalid rs string signature length. Buffer length is ${rsBuffer.length}, expected 64');

  // Check for leading zeros indicating positive values - otherwise we can get "R is negative" errors.
  const isRPaddingNeeded = rsBuffer[0] & 0x80;
  const isSPaddingNeeded = rsBuffer[32] & 0x80;

  // Extract R and S with padding for negative values if needed
  const r = isRPaddingNeeded ? Buffer.concat([new Uint8Array([0]), rsBuffer.subarray(0, 32)]) : rsBuffer.subarray(0, 32);
  const s = isSPaddingNeeded ? Buffer.concat([new Uint8Array([0]), rsBuffer.subarray(32)]) : rsBuffer.subarray(32);

  // console.log("r", r);
  // console.log("s", s);

  if (![32, 33].includes(r.length) || ![32, 33].includes(s.length))
    throw new Error('Invalid r or s length');

  const derSignature = bip66.encode(r, s);
  const hexDerSignature = derSignature.toString('hex');

  console.log('DER-encoded signature:', hexDerSignature);

  return hexDerSignature;
}

/**
 * From a fully signed btc txid with witnesses, returns the wtxid
 * (witness txid). 
 * NOTE: if there is no witness, wtxid == txid.
 */
export const fullBTCTransactionToWTxId = (fullBtcTxHex: string): string => {
  return doubleSha256(Buffer.from(fullBtcTxHex, "hex")).reverse().toString("hex");
}