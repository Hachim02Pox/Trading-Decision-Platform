"""Repairs render-and-publish-f4.cmd: an earlier sed turned `out\\f4` into a form-feed byte,
so the success check looked for a file that could never exist (false "RENDER FAILED")."""
from pathlib import Path

p = Path(__file__).resolve().parents[2] / "render-and-publish-f4.cmd"
b = p.read_bytes()
print("form-feeds found:", b.count(b"\x0c"))
p.write_bytes(b.replace(b"\x0c", b"\\f"))
print("fixed:", p)
