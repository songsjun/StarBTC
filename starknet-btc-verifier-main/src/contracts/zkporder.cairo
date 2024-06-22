use zkproof_cairo_contracts::interfaces::starkverifier::{IStarkVerifier, Input, Output, VerifiedStatus, Transaction, ProvingDetail};
use starknet::ContractAddress;

#[derive(Drop, Serde, starknet::Store, PartialEq)]
enum ProofStatus {
    ToBeVerified,
    Verified,
    VerifyFailed,
}

#[derive(Drop, Serde, starknet::Store, starknet::Event)]
struct RawTransaction {
    raw_data: ByteArray,
    utxos: [ByteArray; 10],
    prover: felt252,
    script: ByteArray,
    status: ProofStatus,
    owner: ContractAddress,
    timestamp: u256,
}

#[starknet::interface]
pub trait IZkpOrder<TContractState> {

    fn is_contract(self: @TContractState, account: Array<u8>) -> bool;

    fn set_verifier(ref self: TContractState, verifier: ContractAddress);

    fn add_transaction(ref self: TContractState, raw_data: ByteArray, utxos: [ByteArray; 10], prover: felt252, script: ByteArray) -> Array<u8>;

    fn mark_transaction_verified(ref self: TContractState, hash: Array<u8>);

    fn get_order_status(self: @TContractState, hash: Array<u8>) -> Array<felt252>;

    fn get_order_data(self: @TContractState, hash: Array<u8>) -> Array<u8>;

    fn get_order_utxos(self: @TContractState, hash: Array<u8>) -> Array<ByteArray>;

    fn get_owner(self: @TContractState, hash: Array<u8>) -> Array<u8>;

    fn get_timestamp(self: @TContractState, hash: Array<u8>) -> u256;

    fn get_order_details(self: @TContractState, hash: Array<u8>, network: felt252) -> Array<felt252>;

    fn get_proving_detail(self: @TContractState, hash: Array<u8>, network: felt252) -> Array<felt252>;

    fn reverse(self: @TContractState, hash: [u32; 8]) -> Array<u8>;
}

#[starknet::contract]
mod ZkpOrder {
    use core::traits::Into;
use core::traits::TryInto;
use starknet::{
        ContractAddress, ClassHash, contract_address_const, get_contract_address, get_caller_address, get_block_info, get_block_timestamp, EthAddress
    };
    use core::sha256::compute_sha256_byte_array;
    use super::{ProofStatus, RawTransaction};

    #[storage]
    struct Storage {
        verifier: ContractAddress, 
        orders: LegacyMap::<Array<u8>, RawTransaction>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        RawTransaction: RawTransaction,
    }

    #[constructor]
    fn constructor(ref self: ContractState, verifier: ContractAddress) {
        self.verifier.write(verifier);
    }

    #[abi(embed_v0)]
    impl ZkpOrderImpl of super::IZkpOrder<ContractState> {
        
        fn is_contract(self: @ContractState, account: Array<u8>) -> bool {
            // 返回 account 是否为合约地址的布尔值
            false
        }

        fn set_verifier(ref self: ContractState, verifier: ContractAddress) {
            self.verifier.write(verifier);
        }

        fn add_transaction(ref self: ContractState, raw_data: ByteArray, utxos: [ByteArray; 10], prover: felt252, script: ByteArray) -> Array<u8> {
            // assert(utxos.len() > 0, 'UTXOS is empty');

            // calculate double sha256
            let hash = compute_sha256_byte_array(@raw_data);

            // reverse the hash
            let reversed = self.reverse(hash);

            // convert to bytes32
            let hash_bytes32: Array<u8> = bytes32(reversed);

            // check if the transaction already exists
            let existing_transaction = self.orders.read(hash_bytes32);
            assert(existing_transaction.raw_data.len() == 0, 'Transaction already exists');

            // check if the owner can rewrite the transaction
            if (existing_transaction.status == ProofStatus::Verified) {
                assert(get_caller_address() == existing_transaction.owner, 'Only owner could rewrite');
                assert(get_block_timestamp() - existing_transaction.timestamp.try_into().unwrap() > 1800, 'Rewrite time must be greater than 30 minutes');
            }

            // add the transaction to the orders map
            let new_transaction = RawTransaction {raw_data: raw_data, utxos: utxos, prover: prover, script: script, status:ProofStatus::ToBeVerified, owner: get_caller_address(), timestamp: get_block_timestamp().into()};
            self.orders.write(hash_bytes32, new_transaction);

            // emit the RawTransaction event
            self.emit(new_transaction);

            // return the transaction hash
            hash_bytes32
        }

        fn mark_transaction_verified(ref self: ContractState, hash: Array<u8>) {
            // 标记交易为已验证
            unimplemented!()
        }

        fn get_order_status(self: @ContractState, hash: Array<u8>) -> Array<felt252> {
            // 返回订单状态
            unimplemented!()
        }

        fn get_order_data(self: @ContractState, hash: Array<u8>) -> Array<u8> {
            // 返回订单数据
            unimplemented!()
        }

        fn get_order_utxos(self: @ContractState, hash: Array<u8>) -> Array<ByteArray> {
            // 返回订单 UTXOs
            unimplemented!()
        }

        fn get_owner(self: @ContractState, hash: Array<u8>) -> Array<u8> {
            // 返回订单拥有者
            unimplemented!()
        }

        fn get_timestamp(self: @ContractState, hash: Array<u8>) -> u256 {
            // 返回订单时间戳
            unimplemented!()
        }

        fn get_order_details(self: @ContractState, hash: Array<u8>, network: felt252) -> Array<felt252> {
            // 返回订单详细信息
            unimplemented!()
        }

        fn get_proving_detail(self: @ContractState, hash: Array<u8>, network: felt252) -> Array<felt252> {
            // 返回证明详细信息
            unimplemented!()
        }

        fn reverse(self: @ContractState, hash: [u32; 8]) -> Array<u8> {
            // 反转数组
            unimplemented!()
        }
    }
}
