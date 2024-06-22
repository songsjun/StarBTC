import urllib.request as requests
import os
import json


class rawtx:
    raw: bytes

    def __init__(self, txid: str):
        try:
            hex = __cache__.get(txid)
        except:
            rsp: bytes = requests.urlopen(
                f'https://mempool.space/api/tx/{txid}/hex').read()
            hex = rsp.decode("utf-8")
            __cache__.save(txid, hex)
        self.raw = bytes.fromhex(hex)


def txinfo(txid: str) -> dict:
    key = f'txinfo_{txid}'
    try:
        rsp = __cache__.get(key)
    except:
        rsp: bytes = requests.urlopen(
            f'https://mempool.space/api/tx/{txid}').read().decode("utf-8")
        __cache__.save(key, rsp)

    return json.loads(rsp)


class cache:
    pycache_path: str

    def __init__(self):
        script_directory = os.path.dirname(os.path.abspath(__file__))
        self.pycache_path = os.path.join(script_directory, "__pycache__")

    def save(self, key: str, data: str) -> None:
        file_path = os.path.join(self.pycache_path, "cache", f"{key}.tmp")
        with open(file_path, "w") as file:
            file.write(data)

    def get(self, key: str) -> str:
        file_path = os.path.join(self.pycache_path, "cache", f"{key}.tmp")
        with open(file_path, "r") as file:
            return file.read()

__cache__ = cache()
