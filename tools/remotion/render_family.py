"""Chunked render + web publish for one Knowledge family video (lessons from F5).

Usage (launch detached so it survives an editor restart):
  python render_family.py f6 f6-dollar-change

- Video rendered in muted chunks of ~5700 frames, a fresh Chrome each time (a single 22k-frame run
  crashed Chrome from memory build-up around frame 11 500).
- Audio rendered once as WAV, then ffmpeg concat (no video re-encode) + AAC mux.
- --port 3190: the terminal's Next dev server usually owns :3000, which made Remotion fetch audio
  from the terminal and get a 404.
- Result: apps/frontend/public/videos/<slug>.mp4 (+ -poster.jpg). Progress goes to render-pipeline.log.
"""
import datetime
import json
import math
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
fam, slug = sys.argv[1].lower(), sys.argv[2]
FAM = fam.upper()
proj = HERE / fam
LOG = HERE / "render-pipeline.log"
SITE = ROOT / "apps" / "frontend" / "public" / "videos"
FF = proj / "node_modules" / "@remotion" / "compositor-win32-x64-msvc" / "ffmpeg.exe"
CHUNK = 5700
PORT = "3190"


def log(msg: str):
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(f"[{datetime.datetime.now():%Y-%m-%d %H:%M:%S}] {FAM} {msg}\n")


def run(args: list, logfile) -> int:
    return subprocess.run(["npx.cmd", "remotion", "render", "src/index.ts", f"{FAM}Video", *args, f"--port={PORT}"], cwd=proj, stdout=logfile, stderr=subprocess.STDOUT).returncode


tl = json.loads((proj / "src" / "data" / "timeline.json").read_text(encoding="utf-8"))
total = sum(round(s["durationSeconds"] * 30) for s in tl["scenes"]) + 90
chunks_dir = proj / "out" / "chunks"
chunks_dir.mkdir(parents=True, exist_ok=True)
for p in chunks_dir.glob("*"):
    p.unlink()
master = proj / "out" / f"{slug}.mp4"
master.unlink(missing_ok=True)

log(f"START chunked render ({total} frames)")
n = math.ceil(total / CHUNK)
with open(proj / "out" / "render.log", "w", encoding="utf-8") as lf:
    for i in range(n):
        a, b = i * CHUNK, min(total - 1, (i + 1) * CHUNK - 1)
        out = chunks_dir / f"part{i + 1}.mp4"
        for attempt in range(2):  # one retry per chunk
            log(f"chunk {i + 1}/{n} frames {a}-{b} (try {attempt + 1})")
            run([f"out/chunks/part{i + 1}.mp4", f"--frames={a}-{b}", "--codec", "h264", "--crf", "17", "--concurrency=6", "--muted"], lf)
            if out.exists():
                break
        if not out.exists():
            log(f"CHUNK {i + 1} FAILED - see {fam}/out/render.log")
            log("DONE (failed)")
            sys.exit(1)
    run(["out/chunks/audio.wav", "--codec=wav"], lf)
    if not (chunks_dir / "audio.wav").exists():
        log("AUDIO FAILED")
        log("DONE (failed)")
        sys.exit(1)
    (chunks_dir / "list.txt").write_text("".join(f"file 'part{i + 1}.mp4'\n" for i in range(n)), encoding="utf-8")
    subprocess.run([str(FF), "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(chunks_dir / "list.txt"), "-i", str(chunks_dir / "audio.wav"),
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", str(master)], stdout=lf, stderr=subprocess.STDOUT)
if not master.exists():
    log("STITCH FAILED")
    log("DONE (failed)")
    sys.exit(1)
subprocess.run([str(FF), "-v", "error", "-y", "-i", str(master), "-c:v", "libx264", "-crf", "26", "-preset", "fast", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", str(SITE / f"{slug}.mp4")])
subprocess.run([str(FF), "-v", "error", "-y", "-ss", "5", "-i", str(master), "-frames:v", "1", "-q:v", "3", str(SITE / f"{slug}-poster.jpg")])
log(f"PUBLISHED {slug}")
log("DONE")
