use zkbvm_transaction::transaction::UtxoTrait;
use core::array::ArrayTrait;
use core::traits::TryInto;
use core::result::ResultTrait;
use alexandria_data_structures::byte_reader::ByteReader;
use alexandria_data_structures::array_ext::SpanTraitExt;
use zkbvm_transaction::transaction::TxOutTrait;
use zkbvm_utils::parser::ParserTrait;
use zkbvm_transaction::transaction::{TransactionTrait, ScriptBufTrait, Utxo};
use super::types::{Address, AddressType, UtxoTxidAmounts, Input};

pub fn parse_utxos(utxos: Span<Span<u8>>) -> Array<UtxoTxidAmounts> {
    let mut i = 0;
    let mut out = array![];
    let utxos_len = utxos.len();
    while i < utxos_len {
        let utxo = ParserTrait::read_utxo(*utxos.at(i));
        let txid = utxo.txid.hash.span().reverse().span();

        let mut j = 0;
        let mut amounts = array![];
        let outputs = utxo.outputs();
        let outputs_len = outputs.len();
        while j < outputs_len {
            amounts.append(*outputs[j].amount());
            j += 1;
        };

        let parsed_utxo = UtxoTxidAmounts { txid: txid, amounts: amounts };
        out.append(parsed_utxo);
        i += 1;
    };
    out
}

pub fn parse_input(txid: Span<u8>, vout: u32, utxos: Span<UtxoTxidAmounts>) -> Input {
    let mut i = 0;
    let mut amount: u64 = 0;
    let utxos_len = utxos.len();
    while i < utxos_len {
        let utxo: @UtxoTxidAmounts = utxos[i];
        if utxo.txid == @txid {
            amount = *utxo.amounts[vout];
            break;
        }
        i += 1;
    };

    Input { txid: txid, amount: amount }
}


pub fn parse_output_script(script_buf: @zkbvm_transaction::transaction::ScriptBuf) -> Address {
    let bytes = script_buf.script_buf().clone();
    if (script_buf.is_p2pkh()) {
        return Address { address_type: AddressType::P2PKH, address: bytes.slice(3, 20) };
    }

    if script_buf.is_p2sh() {
        return Address { address_type: AddressType::P2SH, address: bytes.slice(2, 20) };
    }

    if script_buf.is_p2wpkh() {
        return Address { address_type: AddressType::P2WPKH, address: bytes.slice(2, 20) };
    }

    if script_buf.is_p2wsh() {
        return Address { address_type: AddressType::P2WSH, address: bytes.slice(2, 32) };
    }

    if script_buf.is_p2pk() {
        return Address {
            address_type: AddressType::P2PK, address: script_buf.p2pk_pubkey_bytes().unwrap()
        };
    }

    if script_buf.is_p2tr() {
        return Address { address_type: AddressType::P2TR, address: bytes.slice(2, 32), };
    }

    if script_buf.is_multisig() {
        return Address {
            address_type: AddressType::P2MS, address: bytes.slice(0, bytes.len() - 1),
        };
    }

    Address { address_type: AddressType::Unknown, address: array![].span() }
}
