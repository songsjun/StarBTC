import { Value } from "@graphprotocol/graph-ts";

import { Global } from "../../generated/schema";

const onlyGlobalId = "global";

export function getGlobal(): Global {
  let globalOrNull = Global.load(onlyGlobalId);

  if (globalOrNull != null) {
    return globalOrNull as Global;
  } else {
    let newGlobal = new Global(onlyGlobalId);

    newGlobal.orderCount = 0;
    newGlobal.transactionCount = 0;
    newGlobal.changeCount = 0;

    return newGlobal;
  }
}

function increaseCounter(key: string): i32 {
  let global = getGlobal();

  let count = 0;
  let temp = global.get(key);
  if (temp !== null) {
    count = temp.toI32();
  }
  global.set(key, Value.fromI32(count + 1));
  global.save();

  return count;
}

export function getTransactionSequenceNumber(): i32 {
  return increaseCounter("transactionCount");
}

export function getChangeSequenceNumber(): i32 {
  return increaseCounter("changeCount");
}

export function increaseOrderCount(): void {
  increaseCounter("orderCount");
}
