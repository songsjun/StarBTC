from pathlib import Path
import sys
from typing import Iterable, Self
import urllib.request as requests
import json
import argparse

#fmt: off
current_path = Path(__file__).resolve()
parent_path = current_path.parent.parent
sys.path.append(str(parent_path))
from scripts import run_proof
from scripts import mempool
from scripts import serialize
#fmt: on


class Input(serialize.Structure):
    """
    struct Input {
        rawtx: Array<u8>,
        block_height: u32,
        time_stamp: u64,
        rawutxos: Array<Array<u8>>,
        prev_heights: Array<u32>,
        prev_median_times: Array<u64>
    }
    """
    raw = serialize.Bytes()
    block_height = serialize.Integer()
    time_stamp = serialize.Integer()
    rawutxos = serialize.List1D()
    prev_heights = serialize.List1D()
    prev_median_times = serialize.List1D()
    def __init__(self, rawtx, block_height, time_stamp, rawutxos, prev_heights, prev_median_times):
        self.raw = rawtx
        self.block_height = block_height
        self.time_stamp = time_stamp
        self.rawutxos = rawutxos
        self.prev_heights = prev_heights
        self.prev_median_times = prev_median_times


class Tx:
    raw: mempool.rawtx
    height: int
    timestamp: int
    utxos: list[Self]

    def __init__(self, txid: str, load_utxos: bool = True):
        self.raw = mempool.rawtx(txid)
        txinfo = mempool.txinfo(txid)
        self.height = txinfo['status']['block_height']
        self.timestamp = txinfo['status']['block_time']
        self.utxos = []

        if load_utxos:
            for id in txinfo['vin']:
                self.utxos.append(Tx(id['txid'], load_utxos=False))

    def to_input(self) -> Input:
        return Input(
            rawtx=self.raw.raw,
            block_height=self.height,
            time_stamp=self.timestamp,
            rawutxos=[utxo.raw.raw for utxo in self.utxos],
            prev_heights=[utxo.height for utxo in self.utxos],
            prev_median_times=[utxo.timestamp for utxo in self.utxos]
        )

class Output(serialize.Structure):
    fee = serialize.Integer()
    txid = serialize.Bytes()

if __name__ == '__main__':

    parser = argparse.ArgumentParser(description='')

    parser.add_argument('--txid', type=str, default='aa7f58f81237c90fe9a5227d0c2a7a9dd42934492970ee94e15bd839162101c3')

    args = parser.parse_args()

    tx = Tx(args.txid)

    args = tx.to_input().serde_serialize()

    res = run_proof.run_proof(serialize.list_to_str(args))

    o = Output()

    o:Output = serialize.serde_deserialize(run_proof.output_to_list(res),o)
    print(o.to_str())
