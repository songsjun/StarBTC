use core::clone::Clone;
use core::array::ArrayTrait;
use zkbvm_block::merkle_tree::{MerkleTree, MerkleTreeTrait};

#[derive(Serde, Drop)]
struct ProofInput {
    root: Array<u8>,
    leaf: Array<u8>,
    proofs: Array<Array<u8>>,
    poses: Array<bool>
}

fn main(serialized: Array<felt252>) -> Array<felt252> {
    let mut s = serialized.span();
    let data: ProofInput = Serde::<ProofInput>::deserialize(ref s).unwrap();

    let mut merkle = MerkleTreeTrait::new();
    let ret = merkle.compute_root_with_proof_position(data.leaf, data.proofs, data.poses.span());

    if ret == data.root {
        return array![1];
    }
    array![0]
}

fn span_to_array(data: Span<u8>) -> Array<u8> {
    let mut array: Array<u8> = array![];
    array.append_span(data);

    array
}
