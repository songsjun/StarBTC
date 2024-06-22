use starknet::ContractAddress;

#[derive(Drop, Serde)]
pub struct Input {
    txid: Array<u8>,
    amount: u256,
}

#[derive(Drop, Serde)]
pub struct Output {
    txType: AddrType,
    addr: felt252,
    amount: u256,
}

#[derive(Drop, Serde)]
enum AddrType {
    EMPTY,
    P2PK,
    P2PKH,
    P2MS,
    P2SH,
    P2WPKH,
    P2WSH,
    P2TR,
}

#[derive(Drop, Serde)]
pub enum VerifiedStatus {
    toBeVerified,
    verified,
    verifyFailed,
}

#[derive(Drop, Serde)]
enum ProvingStatus {
    OK,
    InvalidScript,
}

#[derive(Drop, Serde)]
pub struct Transaction {
    wtxid: Array<u8>,
    inputs: Array<Input>,
    outputs: Array<Output>,
    script: Array<u8>,
    status: VerifiedStatus,
}

#[derive(Drop, Serde)]
pub struct ProvingDetail {
    wtxid: Array<u8>,
    status: ProvingStatus,
    address: felt252,
}

#[starknet::interface]
pub trait IStarkVerifier<TContractState> {
    fn getTransaction(self: @TContractState, wtxid: Array<u8>, network: felt252) -> Array<felt252>;

    fn getProvingDetail(self: @TContractState, wtxid: Array<u8>, network: felt252) -> Array<felt252>;

    fn checkProofIsValid(self: @TContractState, wtxid: Array<u8>) -> bool;
}
