use zkbvm_vm::taproot::{tagged_hash, HasherType};
use zkbvm_crypto::secp256k1_schnorr::ec_mult;
use starknet::{secp256k1::Secp256k1Point, secp256_trait::{Secp256Trait, Secp256PointTrait}};
use zkbvm_utils::common::from_bytes_to_u256;
use alexandria_data_structures::byte_appender::ByteAppender;


pub fn script_to_taproot_address(script: Span<u8>) -> Array<u8> {
    let key_x = script.slice(3, 32);

    let tweak = tagged_hash(key_x, HasherType::TAPTWEAK);
    let tweak = from_bytes_to_u256(tweak.span()).unwrap();

    let pkey_point: Secp256k1Point = Secp256Trait::secp256_ec_get_point_from_x_syscall(
        from_bytes_to_u256(key_x).unwrap(), false
    )
        .unwrap()
        .unwrap();

    let tweak_add = ec_mult(pkey_point, 1, tweak).unwrap();

    let (x, _) = tweak_add.get_coordinates().unwrap();

    let mut pubkey = array![];

    pubkey.append_u256(x);

    pubkey
}
