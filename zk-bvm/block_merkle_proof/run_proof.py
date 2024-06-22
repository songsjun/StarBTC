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


def hex_to_array_reversed(hex: str) -> list[int]:
    hex = hex.lower()
    return [int(hex[i:i+2], 16) for i in reversed(range(0, len(hex), 2))]


def hex_to_array_str_reversed(hex: str) -> str:
    return serialize.list_to_str(hex_to_array_reversed(hex))


def hex_proofs_to_array_str(list: list[str]) -> str:
    if len(list) == 0:
        return '[]'
    intlist = [hex_to_array_reversed(i) for i in list]
    return '[' + ' '.join(' '.join([str(j) for j in i]) for i in intlist) + ']'


def bool_str_to_int(value: str) -> int:
    if value.lower() in ('yes', 'true', 't', 'y', '1'):
        return 1
    elif value.lower() in ('no', 'false', 'f', 'n', '0'):
        return 0
    else:
        raise argparse.ArgumentTypeError('Boolean value expected.')


def bool_to_array_str(list: list[str]) -> str:
    return serialize.list_to_str([str(bool_str_to_int(i)) for i in list])


class ProofInput(serialize.Structure):
    root = serialize.List1D()
    leaf = serialize.List1D()
    proofs = serialize.List2D()
    pos = serialize.List1D()

    def __init__(self, root: str, leaf: str, proofs: list[str], pos: list[str]):
        self.root = list(list(bytes.fromhex(root)).__reversed__())
        self.leaf = list(list(bytes.fromhex(leaf)).__reversed__())
        self.proofs = [list(list(bytes.fromhex(proof)).__reversed__())
                       for proof in proofs]
        self.pos = [bool_str_to_int(i) for i in pos]


class Output(serialize.Structure):
    ok = serialize.Integer()

    def __init__(self) -> None:
        self.ok = 0


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Process some integers.')

    parser.add_argument('--root', type=str)
    parser.add_argument('--leaf', type=str)
    parser.add_argument('--proofs', type=str)
    parser.add_argument('--pos', type=str)

    args = parser.parse_args()

    root = args.root
    leaf = args.leaf
    proofs = args.proofs.split(',')
    pos = args.pos.split(',')

    proof_input = ProofInput(root, leaf, proofs, pos)

    args = proof_input.serde_serialize()

    res = run_proof.run_proof(serialize.list_to_str(args))

    o = Output()

    o: Output = serialize.serde_deserialize(run_proof.output_to_list(res), o)
    print(o.to_str())
