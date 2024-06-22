use core::serde::Serde;
use core::array::ArrayTrait;
use alexandria_data_structures::array_ext::ArrayTraitExt;
use zkbvm_transaction::transaction::{Transaction, TransactionTrait, Utxo};
use zkbvm_utils::parser::ParserTrait;
use zkbvm_transaction::validation::precheck;

#[derive(Serde, Drop)]
struct Input {
    rawtx: Array<u8>,
    block_height: u32,
    time_stamp: u64,
    rawutxos: Array<Array<u8>>,
    prev_heights: Array<u32>,
    prev_median_times: Array<u64>
}

#[derive(Serde, Drop)]
struct Output {
    fee: u64,
    txid: Array<u8>
}

fn main(serialized: Array<felt252>) -> Array<felt252> {
    let mut s = serialized.span();
    let data: Input = Serde::<Input>::deserialize(ref s).unwrap();

    let mut utxos: Array<Utxo> = array![];

    let mut i = 0;
    while i < data
        .rawutxos
        .len() {
            let rawutxo = data.rawutxos[i];
            let utxo = ParserTrait::read_utxo(rawutxo.span());
            utxos.append(utxo);

            i += 1;
        };

    let tx = ParserTrait::read_tx(data.rawtx.span());

    let txid = tx.tx_hash().hash.reverse();

    let fee = precheck(
        @tx, data.block_height, data.time_stamp, @utxos, @data.prev_heights, @data.prev_median_times
    );

    let res = Output { fee, txid };

    let mut output_array = array![];
    res.serialize(ref output_array);

    return output_array;
}
