"""Scaffolds tools/remotion/<fN>/ from the F5 v4 base (same look, same tooling).

Usage: python new_family.py f6

- Anything already in <fN>/ (older v3 cut) is moved to <fN>/_old-v3/ (never deleted).
- node_modules is a directory junction to f5/node_modules (no 525 MB reinstall per family).
- Shared visual primitives (shared/stage/characters/props/props5) are copied, not linked, so a
  family can tweak them without touching F5.
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
BASE = HERE / "f5"

fam = sys.argv[1].lower()
FAM = fam.upper()
dst = HERE / fam
dst.mkdir(exist_ok=True)

keep = {"_old-v3"}
existing = [p for p in dst.iterdir() if p.name not in keep]
if existing:
    arch = dst / "_old-v3"
    arch.mkdir(exist_ok=True)
    for p in existing:
        if p.name in ("node_modules", ".venv"):
            if p.is_symlink() or p.name == ".venv":
                shutil.rmtree(p, ignore_errors=True) if p.name == ".venv" else p.unlink()
            else:
                shutil.rmtree(p, ignore_errors=True)
            continue
        shutil.move(str(p), str(arch / p.name))

for d in ["src/scenes", "src/data", "script", "storyboard", "scripts", "public/audio", "audio", "out/check"]:
    (dst / d).mkdir(parents=True, exist_ok=True)

for f in ["src/theme.ts", "src/Subtitles.tsx", "src/index.ts", "tsconfig.json", "remotion.config.ts", "generate_audio.py",
          "src/scenes/shared.tsx", "src/scenes/stage.tsx", "src/scenes/characters.tsx", "src/scenes/props.tsx", "src/scenes/props5.tsx",
          "scripts/stills.mjs", "scripts/sheet.py", "scripts/grid.py"]:
    shutil.copy2(BASE / f, dst / f)
shutil.copytree(BASE / "public" / "sfx", dst / "public" / "sfx", dirs_exist_ok=True)

pkg = json.loads((BASE / "package.json").read_text(encoding="utf-8"))
pkg["name"] = f"{fam}-education-video"
pkg["description"] = f"Remotion project for the {FAM} Knowledge explainer video."
pkg["scripts"] = {"start": "remotion studio src/index.ts", "typecheck": "tsc --noEmit"}
(dst / "package.json").write_text(json.dumps(pkg, indent=2) + "\n", encoding="utf-8")

video = (BASE / "src" / "F5Video.tsx").read_text(encoding="utf-8").replace("F5Video", f"{FAM}Video")
(dst / "src" / f"{FAM}Video.tsx").write_text(video, encoding="utf-8")
root = (BASE / "src" / "Root.tsx").read_text(encoding="utf-8").replace("F5Video", f"{FAM}Video")
(dst / "src" / "Root.tsx").write_text(root, encoding="utf-8")

# stills.mjs targets the composition id
st = (dst / "scripts" / "stills.mjs").read_text(encoding="utf-8").replace('"F5Video"', f'"{FAM}Video"')
(dst / "scripts" / "stills.mjs").write_text(st, encoding="utf-8")

nm = dst / "node_modules"
if not nm.exists():
    subprocess.run(["cmd", "/c", "mklink", "/J", str(nm), str(BASE / "node_modules")], check=True, capture_output=True)
print("scaffolded", dst)
