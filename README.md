# StarBTC

StarBTC is a decentralized lending protocol that enables native Bitcoin collateralized loans without relying on wrapped BTC or cross-chain bridges. It leverages the BEL2(https://bel2.org) network for arbitration and zero-knowledge proofs for transaction verification.

## Overview

StarBTC allows users to borrow stablecoins like USDC against their BTC collateral directly on the Bitcoin mainnet. The protocol uses smart contracts and an arbiter network to ensure secure and trustless lending operations.

Key features:
- Native BTC collateralized loans
- Decentralized arbitration using BEL2
- Zero-knowledge proofs for BTC transaction verification
- Protection against malicious behavior through a challenge mechanism

## How it works

1. Alice locks her BTC in a collateral script on the Bitcoin network.
2. Bob lends USDC to Alice.
3. If Alice repays on time, both parties sign to release the collateral.
4. If there's a dispute, the BEL2 arbiter network can intervene.
5. Malicious actions can be challenged and penalized using zero-knowledge proofs.

## Repository Structure

- `cairo-suite/solidity-stark-verifier-cairo-os`: Cairo circuit for running and generating proofs
- `evm-contracts`: Solidity contracts for the BTC lending protocol
- `front-end`: User interface for the lending protocol
- `zk-bvm`: Zero-knowledge proof circuits for verifying BTC transaction validity
- `zkproof-contracts`: Solidity contracts for verifying STARK zero-knowledge proofs
- `starknet-btc-verifier-main`: Starknet contracts for verifying STARK zero-knowledge proofs

## Technology Stack

- BEL2 for arbitration network
- StarkWare's Cairo 1 for zero-knowledge proof circuits
- Solidity for smart contracts
- EVM-compatible blockchain for contract deployment
- StarkNet for Layer 2 scalability and low-cost transactions
