use alexandria_data_structures::array_ext::SpanTraitExt;
use alexandria_data_structures::byte_reader::{Len, ArrayU8LenImpl};
use core::array::ArrayTrait;
use core::array::SpanTrait;
use zkbvm_utils::writter::{Writter, WritterTrait};

// App type of utxo which contains txid and amounts
#[derive(Drop)]
pub struct UtxoTxidAmounts {
    pub txid: Span<u8>,
    pub amounts: Array<u64>,
}

#[derive(Serde, Drop)]
pub struct Input {
    pub txid: Span<u8>,
    pub amount: u64,
}

#[derive(Serde, Drop)]
pub struct Output {
    pub address: Address,
    pub amount: u64,
}

#[derive(Serde, Drop, PartialEq)]
pub struct Address {
    pub address_type: AddressType,
    pub address: Span<u8>,
}

#[derive(Serde, Copy, Drop, PartialEq)]
pub enum AddressType {
    Unknown,
    P2PK,
    P2PKH,
    P2MS,
    P2SH,
    P2WPKH,
    P2WSH,
    P2TR,
}

#[generate_trait]
pub impl AddressTypeImpl of AddressTypeTrait {
    fn to_u8(self: @AddressType) -> u8 {
        match self {
            AddressType::Unknown => 0,
            AddressType::P2PK => 1,
            AddressType::P2PKH => 2,
            AddressType::P2MS => 3,
            AddressType::P2SH => 4,
            AddressType::P2WPKH => 5,
            AddressType::P2WSH => 6,
            AddressType::P2TR => 7,
        }
    }
}

#[derive(Copy, Drop,)]
pub enum Status {
    Ok,
    InvalidScript,
}

#[generate_trait]
pub impl StatusImpl of StatusTrait {
    fn code(self: @Status) -> u8 {
        match self {
            Status::Ok => 0,
            Status::InvalidScript => 1,
        }
    }
}
