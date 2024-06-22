# tx_proof

## how to run

Refer to [cairo1-run](https://github.com/lambdaclass/cairo-vm/blob/main/cairo1-run/README.md)

### run

1. check scarb version:

```shell
# scarb version should be 2.6.3
scarb --release build
```

2. prepare cairo-run:

```shell
git clone https://github.com/lambdaclass/cairo-vm
cd cairo-vm/cairo1-run
git checkout 59840b36be82fb7d486939e01799251b3865b97a
make deps
```

3. run the program:

```shell
CAIRO1_RUN=/path/to/cairo-vm/cairo1-run python3 run_proof.py --txid f4999076f606992c9e1c2d3a884fbce2d7ebff9f4db22978742d417d7ec3cac7 --address 1234 --script 6321020e0ae8c8fb9645dbdf6425b173f8ade49b5abbac20d887d98e8515d02a97ddddad21020e0ae8c8fb9645dbdf6425b173f8ade49b5abbac20d887d98e8515d02a97ddddac676321020e0ae8c8fb9645dbdf6425b173f8ade49b5abbac20d887d98e8515d02a97ddddad210366e0c54864cf3468e2d9f047cfd6e971ab4c0b779499b9d8bbc7000178dfe627ac676303e30940b27521020e0ae8c8fb9645dbdf6425b173f8ade49b5abbac20d887d98e8515d02a97ddddada820380f1c94ebb4e344a3a7e8ad10812794a9fb79c8edafa5fd1d981cf571055027876703800e40b27521020e0ae8c8fb9645dbdf6425b173f8ade49b5abbac20d887d98e8515d02a97ddddac686868
```
