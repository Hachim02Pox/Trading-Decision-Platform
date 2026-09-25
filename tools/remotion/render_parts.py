"""Chunked render of a LONG family video, published on the site as several parts.

Usage (detached): python render_parts.py <prevFamily|-> f11 f11-options-volatilite "1-17:Titre 1" "18-24:Titre 2" ...

Same render as render_family.py (muted chunks of 5700 frames with a fresh Chrome each, audio once as
WAV, ffmpeg concat + mux, port 3190), then:
- waits first for "<PREV> DONE" in render-pipeline.log (renders never overlap), unless prev is "-";
- cuts the master at scene boundaries (scene indexes are 1-based, inclusive) into web parts, each
  re-encoded to stay under ~88 MB (GitHub refuses files over 100 MB);
- writes apps/frontend/public/videos/<slug>-p<N>.mp4 + -poster.jpg and <slug>-parts.json (titles).
Why parts: an 80+ minute explainer does not fit in one file under the GitHub limit, and chapters are
easier to watch in several sittings.
"""
import datetime
import json
import math
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
prev, fam, slug = sys.argv[1].upper(), sys.argv[2].lower(), sys.argv[3]
PARTS = [(tuple(int(x) for x in spec.split(":", 1)[0].split("-")), spec.split(":", 1)[1]) for spec in sys.argv[4:]]
FAM = fam.upper()
proj = HERE / fam
LOG = HERE / "render-pipeline.log"
SITE = ROOT / "apps" / "frontend" / "public" / "videos"
FF = proj / "node_modules" / "@remotion" / "compositor-win32-x64-msvc" / "ffmpeg.exe"
FP = FF.with_name("ffprobe.exe")
CHUNK = 5700
PORT = "3190"
MAX_MB = 88


def log(msg: str):
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(f"[{datetime.datetime.now():%Y-%m-%d %H:%M:%S}] {FAM} {msg}\n")


def run(args: list, logfile) -> int:
    return subprocess.run(["npx.cmd", "remotion", "render", "src/index.ts", f"{FAM}Video", *args, f"--port={PORT}"], cwd=proj, stdout=logfile, stderr=subprocess.STDOUT).returncode


if prev != "-":
    while True:
        text = LOG.read_text(encoding="utf-8", errors="ignore") if LOG.exists() else ""
        if any(line.endswith(f"{prev} DONE") or f"{prev} DONE (failed)" in line for line in text.splitlines()):
            break
        time.sleep(30)

tl = json.loads((proj / "src" / "data" / "timeline.json").read_text(encoding="utf-8"))
scene_frames = [round(s["durationSeconds"] * 30) for s in tl["scenes"]]
scene_frames[-1] += 90
starts = [sum(scene_frames[:i]) for i in range(len(scene_frames))]
total = sum(scene_frames)
chunks_dir = proj / "out" / "chunks"
chunks_dir.mkdir(parents=True, exist_ok=True)
for p in chunks_dir.glob("*"):
    p.unlink()
master = proj / "out" / f"{slug}.mp4"
master.unlink(missing_ok=True)

log(f"START chunked render ({total} frames, {len(PARTS)} web parts)")
n = math.ceil(total / CHUNK)
with open(proj / "out" / "render.log", "w", encoding="utf-8") as lf:
    for i in range(n):
        a, b = i * CHUNK, min(total - 1, (i + 1) * CHUNK - 1)
        out = chunks_dir / f"part{i + 1}.mp4"
        for attempt in range(2):
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
log("master OK, encoding web parts")

manifest = []
for pi, ((first, last), title) in enumerate(PARTS, start=1):
    t0 = starts[first - 1] / 30
    t1 = (starts[last - 1] + scene_frames[last - 1]) / 30
    dur = t1 - t0
    out = SITE / f"{slug}-p{pi}.mp4"
    base = [str(FF), "-v", "error", "-y", "-ss", f"{t0:.3f}", "-i", str(master), "-t", f"{dur:.3f}"]
    subprocess.run(base + ["-c:v", "libx264", "-crf", "27", "-preset", "slow", "-c:a", "aac", "-b:a", "112k", "-movflags", "+faststart", str(out)])
    if out.exists() and out.stat().st_size > MAX_MB * 1024 * 1024:
        kbps = int((MAX_MB * 8 * 1024 * 0.93) / dur) - 112
        subprocess.run(base + ["-c:v", "libx264", "-b:v", f"{kbps}k", "-maxrate", f"{int(kbps * 1.5)}k", "-bufsize", f"{kbps * 3}k", "-preset", "slow", "-c:a", "aac", "-b:a", "112k", "-movflags", "+faststart", str(out)])
    subprocess.run([str(FF), "-v", "error", "-y", "-ss", f"{t0 + 6:.3f}", "-i", str(master), "-frames:v", "1", "-q:v", "3", str(SITE / f"{slug}-p{pi}-poster.jpg")])
    size = out.stat().st_size / 1024 / 1024 if out.exists() else 0
    log(f"part {pi} scenes {first}-{last} ({dur / 60:.1f} min) -> {out.name} {size:.0f} MB")
    manifest.append({"src": f"/videos/{out.name}", "poster": f"/videos/{slug}-p{pi}-poster.jpg", "title": title, "minutes": round(dur / 60, 1)})
(proj / "out" / f"{slug}-parts.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
log(f"PUBLISHED {slug} ({len(PARTS)} parts)")
log("DONE")
