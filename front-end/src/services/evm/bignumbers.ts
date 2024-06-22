import BigNumber from "bignumber.js";
import { BigNumber as EthersBigNumber } from "ethers";

export const etherToStdBigNumber = (ethersBN: EthersBigNumber): BigNumber => {
  return new BigNumber(ethersBN.toString());
}

export const stdToEthersBigNumber = (stdBN: BigNumber): EthersBigNumber => {
  return EthersBigNumber.from(stdBN.toFixed());
}