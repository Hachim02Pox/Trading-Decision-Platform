"""Waits until a previous family render is finished, then renders the next one.

Usage (detached): python render_after.py f6 f7 f7-risque-credit-vol
Renders never overlap (they share CPU and the Remotion port).
"""
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
LOG = HERE / "render-pipeline.log"
prev, fam, slug = sys.argv[1].upper(), sys.argv[2], sys.argv[3]

while True:
    text = LOG.read_text(encoding="utf-8", errors="ignore") if LOG.exists() else ""
    if any(line.endswith(f"{prev} DONE") or f"{prev} DONE (failed)" in line for line in text.splitlines()):
        break
    time.sleep(30)

subprocess.run([sys.executable, str(HERE / "render_family.py"), fam, slug])
