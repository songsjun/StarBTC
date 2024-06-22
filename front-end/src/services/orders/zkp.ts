import { AddressType, getAddressInfo } from 'bitcoin-address-validation';
import { LoanOrderVerificationStatus } from './model/loan-order';

export enum ZkpAddressType {
  EMPTY,
  P2PK,
  P2PKH,
  P2MS,
  P2SH,
  P2WPKH,
  P2WSH,
  P2TR
}

export const bitcoinAddressToZKPType = (bitcoinAddress: string): ZkpAddressType => {
  const info = getAddressInfo(bitcoinAddress);
  if (!info)
    throw new Error(`Unable to retrieve address info for bitcoin address ${bitcoinAddress}`);

  switch (info.type) {
    case AddressType.p2pkh: return ZkpAddressType.P2PKH;
    case AddressType.p2sh: return ZkpAddressType.P2SH;
    case AddressType.p2wpkh: return ZkpAddressType.P2WPKH;
    case AddressType.p2wsh: return ZkpAddressType.P2WSH;
    case AddressType.p2tr: return ZkpAddressType.P2TR;
    default:
      throw new Error(`Unsupported address type ${info.type} for bitcoin address ${bitcoinAddress}`);
  }
}

export const displayableZKPStatus = (zkpStatus: LoanOrderVerificationStatus) => {
  switch (zkpStatus) {
    case LoanOrderVerificationStatus.PENDING: return "Pending";
    case LoanOrderVerificationStatus.VERIFICATION_FAILED: return "Verification failed";
    case LoanOrderVerificationStatus.VERIFIED: return "Verified";
  }
}