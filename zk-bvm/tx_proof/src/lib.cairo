use zkbvm_transaction::transaction::ScriptBufTrait;
use core::serde::Serde;
use core::option::OptionTrait;
use alexandria_data_structures::byte_appender::ByteAppender;
use alexandria_data_structures::array_ext::ArrayTraitExt;
use alexandria_bytes::{Bytes, BytesTrait};
use alexandria_data_structures::byte_reader::ByteReader;
use alexandria_data_structures::array_ext::SpanTraitExt;
use core::array::SpanTrait;
use core::array::ArrayTrait;
use zkbvm_transaction::transaction::TxOutTrait;
use zkbvm_transaction::transaction::TxInTrait;
use zkbvm_transaction::transaction::TransactionTrait;
use zkbvm_transaction::transaction::Transaction;
use zkbvm_transaction::transaction::ScriptBufImpl;
use zkbvm_utils::common::BytesToArrayU8;
use zkbvm_utils::parser::ParserTrait;
use zkbvm_crypto::hashes::{sha256, hash160, sha2d};

mod types;
mod parser;
mod taproot;
use types::{Input, Output, Address, AddressType, Status, StatusTrait};
use parser::{parse_utxos, parse_input, parse_output_script};
use taproot::script_to_taproot_address;

#[derive(Serde, Drop)]
struct ProofInput {
    rawtx: Span<u8>,
    utxos: Span<Span<u8>>,
    address: Array<u8>,
    script_buf_bytes: Span<u8>
}

#[derive(Serde, Drop)]
struct ProofOutput {
    status: u8,
    tx_hash: Array<u8>,
    inputs: Array<Input>,
    outputs: Array<Output>,
    len_inputs: u32,
    len_outputs: u32,
    address: Array<u8>,
    script_address: Span<u8>,
    wtxid: Array<u8>
}

fn main(serialized: Array<felt252>) -> Array<felt252> {
    let mut s = serialized.span();
    let data: ProofInput = Serde::<ProofInput>::deserialize(ref s).unwrap();

    let res = parse_tx(data.rawtx, data.utxos, data.address, data.script_buf_bytes);

    let mut output_array = array![];
    res.serialize(ref output_array);

    return output_array;
}

fn parse_tx(
    rawtx: Span<u8>, utxos: Span<Span<u8>>, address: Array<u8>, script_buf_bytes: Span<u8>,
) -> ProofOutput {
    let tx = ParserTrait::read_tx(rawtx);
    let inputs = tx.inputs();
    let outputs = tx.outputs();

    let mut result = ProofOutput {
        status: Status::Ok.code(),
        tx_hash: tx.tx_hash().hash.span().reverse(),
        inputs: array![],
        outputs: array![],
        len_inputs: inputs.len(),
        len_outputs: outputs.len(),
        address: address,
        script_address: array![].span(),
        wtxid: tx.wtx_hash().hash.span().reverse()
    };

    let parsed_utxos = parse_utxos(utxos);

    let mut i = 0;
    while i < result
        .len_inputs {
            let txid = inputs[i].txid();
            let vout = inputs[i].vout();
            result.inputs.append(parse_input(*txid, *vout, parsed_utxos.span()));
            i += 1;
        };

    let mut i = 0;
    while i < result
        .len_outputs {
            let parsed_output = Output {
                address: parse_output_script(outputs[i].script_pub_key()),
                amount: *outputs[i].amount(),
            };
            result.outputs.append(parsed_output);
            i += 1;
        };

    if script_buf_bytes.len() != 0 {
        let (found, scriptaddr) = verify_lock_script(@result.outputs, script_buf_bytes);
        if found {
            result.script_address = scriptaddr;
        } else {
            result.status = Status::InvalidScript.code();
        }
    }

    return result;
}

fn verify_lock_script(outputs: @Array<Output>, script_buf_bytes: Span<u8>) -> (bool, Span<u8>) {
    let mut i = 0;
    let mut script_buf_address: Span<u8> = array![].span();
    let len = outputs.len();
    // TODO: should check other output script types
    while i < len {
        let output: @Output = outputs[i];

        let eq = match output.address.address_type {
            AddressType::P2WSH => { // The P2SH locking script contains the hash of another locking script (Script Hash)
                let script_address = sha256(span_to_array(script_buf_bytes)).span();
                script_address == *output.address.address
            },
            AddressType::P2WPKH => { // To create a P2WPKH lock, you just need to place an OP_0 followed by a data push of a public key hash in the ScriptPubKey.
                let script_address = hash160(span_to_array(script_buf_bytes)).span();
                script_address == *output.address.address
            },
            AddressType::P2PK => { // To create a P2PK lock you just need to place a public key and a OP_CHECKSIG opcode in the ScriptPubKey
                let script_buf = ScriptBufImpl::from_bytes(script_buf_bytes);
                match script_buf.p2pk_pubkey_bytes() {
                    Option::Some(pubkey_bytes) => pubkey_bytes == *output.address.address,
                    Option::None => false,
                }
            },
            AddressType::P2PKH => { // The P2PKH script pattern contains a public key hash
                let script_buf = ScriptBufImpl::from_bytes(script_buf_bytes);
                match script_buf.is_p2pkh() {
                    true => {
                        let script_address = script_buf_bytes.slice(3, 20);
                        @script_address == output.address.address
                    },
                    false => false,
                }
            },
            AddressType::P2TR => {
                let script_address = script_to_taproot_address(script_buf_bytes).span();
                script_address == *output.address.address
            },
            _ => false
        };

        if eq {
            script_buf_address = *output.address.address;
            break;
        }

        i += 1;
    };

    if i < len {
        return (true, script_buf_address);
    }

    return (false, script_buf_address);
}

fn span_to_array(data: Span<u8>) -> Array<u8> {
    let mut array: Array<u8> = array![];
    array.append_span(data);

    array
}
