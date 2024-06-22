import { Address, Value } from "@graphprotocol/graph-ts";

import { EVMUser } from "../../generated/schema";

export function getUser(_user: Address): EVMUser {
  let id = _user.toHexString();
  let userOrNull = EVMUser.load(id);

  if (userOrNull != null) {
    return userOrNull as EVMUser;
  } else {
    let newUser = new EVMUser(id);

    newUser.createdOrdersCount = 0;
    newUser.takenOrdersCount = 0;
    newUser.save();

    return newUser;
  }
}

function increaseCounter(_user: Address, key: string): void {
  let user = getUser(_user);

  let count = 0;
  let temp = user.get(key);
  if (temp !== null) {
    count = temp.toI32();
  }
  user.set(key, Value.fromI32(count + 1));
  user.save();
}

export function increaseCreatedOrdersCount(_user: Address): void {
  increaseCounter(_user, "createdOrdersCount");
}

export function increaseTakenOrdersCount(_user: Address): void {
  increaseCounter(_user, "takenOrdersCount");
}
