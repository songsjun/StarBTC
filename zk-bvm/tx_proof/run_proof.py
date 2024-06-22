from enum import Enum
from typing import Self, Protocol, TypeVar

#fmt: off
from pathlib import Path
import sys
current_path = Path(__file__).resolve()
parent_path = current_path.parent.parent
sys.path.append(str(parent_path))
from scripts import run_proof
from scripts import mempool
from scripts import serialize
#fmt: on


class Input(serialize.Structure):
    rawtx = serialize.Bytes()
    utxos = serialize.ListBytes()
    address = serialize.Bytes()
    script_buf_bytes = serialize.Bytes()

    def __init__(self, rawtx: bytes, utxos: list[bytes], address: bytes, script_buf_bytes: bytes):
        self.rawtx = rawtx
        self.utxos = utxos
        self.address = address
        self.script_buf_bytes = script_buf_bytes


class TxIn(serialize.Structure):
    txid = serialize.Bytes()
    amount = serialize.Integer()

    def __init__(self, txid: bytes, amount: int):
        self.txid = txid
        self.amount = amount


class TxOut(serialize.Structure):
    address_type = serialize.Integer()
    address = serialize.Bytes()
    amount = serialize.Integer()

    def __init__(self, address_type: int, address: bytes, amount: int):
        self.address_type = address_type
        self.address = address
        self.amount = amount


class Output(serialize.Structure):
    status = serialize.Integer()
    tx_hash = serialize.Bytes()
    inputs = serialize.ListStruct()
    outputs = serialize.ListStruct()
    len_inputs = serialize.Integer()
    len_outputs = serialize.Integer()
    address = serialize.Bytes()
    script_address = serialize.Bytes()
    wtxid = serialize.Bytes()

    def __init__(self) -> None:
        self.status = 0
        self.tx_hash = bytes()
        self.inputs = [TxIn(bytes(), 0)]
        self.outputs = [TxOut(0, bytes(), 0)]
        self.len_inputs = 0
        self.len_outputs = 0
        self.address = bytes()
        self.script_address = bytes()
        self.wtxid = bytes()


class AddressType(Enum):
    P2PK = 1
    P2PKH = 2
    P2MS = 3
    P2SH = 4
    P2WPKH = 5
    P2WSH = 6
    P2TR = 7


class Status(Enum):
    OK = 0
    InvalidScript = 1

    def from_bytes(bytes: bytes) -> Self:
        return Status(int.from_bytes(bytes[0:1], 'little'))

    def __str__(self) -> str:
        return self.name


class Tx:
    def __init__(self, txid: str, address: str, script: str) -> None:
        self.txid = mempool.rawtx(txid)
        self.utxoids = [vin['txid'] for vin in mempool.txinfo(txid)['vin']]
        self.address = bytes.fromhex(address)
        self.script = bytes.fromhex(script)

    def to_input(self) -> Input:
        utxos = []
        for utxo in self.utxoids:
            utxos.append(mempool.rawtx(utxo).raw)
        return Input(self.txid.raw, utxos, self.address, self.script)


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Process some integers.')

    parser.add_argument(
        '--txid', type=str, default='5ec440c64676b341c4cdf7d190b174e2768b716de24790fcc60e105f5479419a')
    parser.add_argument('--address', type=str)
    parser.add_argument('--script', type=str)

    cairo_run_args = parser.parse_args()

    txid = cairo_run_args.txid
    address = cairo_run_args.address
    script = cairo_run_args.script

    tx = Tx(txid, address, script)

    args = tx.to_input().serde_serialize()

    res = run_proof.run_proof(serialize.list_to_str(args))

    o = Output()

    o: Output = serialize.serde_deserialize(run_proof.output_to_list(res), o)
    print(o.to_str())
