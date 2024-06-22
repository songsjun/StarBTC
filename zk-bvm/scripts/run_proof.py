import os
import subprocess


def package_name() -> str:
    with open("Scarb.toml", "r") as f:
        for line in f:
            if line.startswith("name"):
                return line.split("=")[1].strip().strip()
    return ""


def output_to_list(input: str) -> list[int]:
    inputs = input.removeprefix('[').removesuffix(']').split(' ')

    values = []
    for v in inputs:
        values.append(int(v))
    return values


def run_proof(args: str) -> list[int]:
    workdir = os.getenv('CAIRO1_RUN')
    current = os.getcwd()
    subprocess.run(["scarb", "--release", "build"])
    name = package_name().removeprefix('"').removesuffix('"')
    sierra = f"{current}/target/release/{name}.sierra.json"

    res = subprocess.run(["cargo", "run", "--release", sierra,
                          "--layout", "all_cairo", "--args", args, "--proof_mode", "--print_output",
                          ], cwd=workdir, capture_output=True)

    if res.returncode != 0:
        print(res.stderr.decode("utf-8"))
        print(res.stdout.decode("utf-8"))
        raise Exception("Error running proof")

    res = res.stdout.decode("utf-8")
    res = res.removeprefix('Program Output :').strip()
    return res
