"""Generate per-scene TTS narration + word timings for the F5 video.

Difference with F2-F4: instead of sending a whole scene to edge-tts in one go (uniform,
"read aloud" pacing), every sentence is synthesized on its own, trimmed to its real speech,
then re-assembled with pauses of varying length (short after a statement, longer after a
question or a `[pause]` marker). A light voice treatment follows (warmth, less harshness,
gentle leveling, a very small room). Word timings come from edge-tts WordBoundary events,
shifted to their final position, so the Remotion scenes can cue visuals on exact words.

Usage:
  python generate_audio.py                      # full narration -> audio/, public/audio/, src/data/timeline.json
  python generate_audio.py --voice fr-FR-DeniseNeural --rate -2%
  python generate_audio.py --samples            # same passage in several voices -> out/voice-samples/
"""
import argparse
import asyncio
import json
import re
import subprocess
import sys
import wave
from pathlib import Path

import edge_tts
import numpy as np

ROOT = Path(__file__).parent
SCRIPT_PATH = next((ROOT / "script").glob("*-narration.fr.md"))  # one narration file per family
AUDIO_DIR = ROOT / "audio"
PUBLIC_AUDIO_DIR = ROOT / "public" / "audio"
TIMELINE_PATH = ROOT / "src" / "data" / "timeline.json"
TMP_DIR = ROOT / "out" / "tts-tmp"
FFMPEG = ROOT / "node_modules" / "@remotion" / "compositor-win32-x64-msvc" / "ffmpeg.exe"

DEFAULT_VOICE = "fr-FR-HenriNeural"
DEFAULT_RATE = "-4%"
SR = 24000  # edge-tts native rate

MIN_CHUNK_WORDS = 3
MAX_CHUNK_WORDS = 7
LEAD_KEEP_S = 0.05
TAIL_KEEP_S = 0.09
SCENE_HEAD_S = 0.25
SCENE_TAIL_S = 0.6

SAMPLE_VOICES = [
    ("fr-FR-HenriNeural", "-4%"),
    ("fr-FR-DeniseNeural", "-2%"),
    ("fr-FR-RemyMultilingualNeural", "+0%"),
    ("fr-FR-VivienneMultilingualNeural", "+0%"),
    ("en-US-AndrewMultilingualNeural", "+0%"),
    ("en-US-AvaMultilingualNeural", "+0%"),
    ("en-US-BrianMultilingualNeural", "+0%"),
    ("en-US-EmmaMultilingualNeural", "+0%"),
]


def parse_scenes(md_text: str):
    pattern = re.compile(r"^## SCENE (\d+) — id: ([a-z0-9-]+)\s*\n(.*?)(?=^## SCENE |\Z)", re.MULTILINE | re.DOTALL)
    return [
        {"index": int(m.group(1)), "id": m.group(2), "text": re.sub(r"\s+", " ", m.group(3).strip())}
        for m in pattern.finditer(md_text)
    ]


def split_sentences(text: str):
    """Returns [(sentence, pause_after_s)]. Splits on . ? ! (not on '...'), [pause] = long breath."""
    out = []
    blocks = [b.strip() for b in text.split("[pause]")]
    for bi, block in enumerate(blocks):
        if not block:
            continue
        parts = [p.strip() for p in re.split(r"(?<=[^.][.?!])\s+(?=[A-ZÀ-ÖØ-Þ0-9])", block) if p.strip()]
        for pi, sentence in enumerate(parts):
            last_of_block = pi == len(parts) - 1
            h = sum(ord(ch) for ch in sentence) % 7  # deterministic variation, no randomness between runs
            if last_of_block and bi < len(blocks) - 1:
                pause = 0.78 + h * 0.03
            elif sentence.endswith("?"):
                pause = 0.52 + h * 0.015
            else:
                pause = 0.36 + h * 0.022
            out.append((sentence, round(pause, 3)))
    return out


async def synth_sentence(text: str, voice: str, rate: str, path: Path, attempts=4):
    last_err = None
    for attempt in range(attempts):
        words = []
        try:
            communicate = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
            with open(path, "wb") as f:
                async for chunk in communicate.stream():
                    if chunk["type"] == "audio":
                        f.write(chunk["data"])
                    elif chunk["type"] == "WordBoundary":
                        words.append({
                            "text": chunk["text"],
                            "start": chunk["offset"] / 1e7,
                            "end": (chunk["offset"] + chunk["duration"]) / 1e7,
                        })
            if path.stat().st_size > 2000 and words:
                return words
            last_err = RuntimeError(f"empty audio or no words for: {text[:40]}")
        except Exception as err:  # network hiccups happen; retry
            last_err = err
        await asyncio.sleep(1.5 * (attempt + 1))
    raise last_err


def decode(mp3: Path) -> np.ndarray:
    wav_path = mp3.with_suffix(".wav")
    subprocess.run([str(FFMPEG), "-v", "error", "-y", "-i", str(mp3), "-ac", "1", "-ar", str(SR), "-c:a", "pcm_s16le", str(wav_path)], check=True)
    with wave.open(str(wav_path), "rb") as w:
        data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768.0
    return data


def biquad(x: np.ndarray, b, a) -> np.ndarray:
    b0, b1, b2 = (v / a[0] for v in b)
    a1, a2 = a[1] / a[0], a[2] / a[0]
    y = np.zeros_like(x)
    x1 = x2 = y1 = y2 = 0.0
    xs = x.tolist()
    ys = [0.0] * len(xs)
    for i, xi in enumerate(xs):
        yi = b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        x2, x1, y2, y1 = x1, xi, y1, yi
        ys[i] = yi
    y[:] = ys
    return y


def shelf(freq, gain_db, high: bool):
    """RBJ cookbook shelving filter coefficients (S=1)."""
    A = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * freq / SR
    cos, sin = np.cos(w0), np.sin(w0)
    alpha = sin / 2 * np.sqrt(2)
    sq = 2 * np.sqrt(A) * alpha
    if high:
        b = [A * ((A + 1) + (A - 1) * cos + sq), -2 * A * ((A - 1) + (A + 1) * cos), A * ((A + 1) + (A - 1) * cos - sq)]
        a = [(A + 1) - (A - 1) * cos + sq, 2 * ((A - 1) - (A + 1) * cos), (A + 1) - (A - 1) * cos - sq]
    else:
        b = [A * ((A + 1) - (A - 1) * cos + sq), 2 * A * ((A - 1) - (A + 1) * cos), A * ((A + 1) - (A - 1) * cos - sq)]
        a = [(A + 1) + (A - 1) * cos + sq, -2 * ((A - 1) + (A + 1) * cos), (A + 1) + (A - 1) * cos - sq]
    return b, a


def polish(x: np.ndarray) -> np.ndarray:
    """Warmth (+2 dB low shelf 220 Hz), less synthetic sheen (-2.5 dB high shelf 6.5 kHz),
    gentle 2:1 leveling, and two faint early reflections (a small room instead of dead air)."""
    x = biquad(x, *shelf(220, 2.0, high=False))
    x = biquad(x, *shelf(6500, -2.5, high=True))
    win = int(0.03 * SR)
    env = np.sqrt(np.convolve(x * x, np.ones(win) / win, mode="same") + 1e-9)
    thr = 10 ** (-24 / 20)
    gain = np.where(env > thr, (thr / env) ** 0.5, 1.0)  # ratio 2:1 above threshold
    gain = np.convolve(gain, np.ones(win) / win, mode="same")
    x = x * gain
    room = np.zeros_like(x)
    for delay_s, g in ((0.017, 0.06), (0.029, 0.04)):
        d = int(delay_s * SR)
        room[d:] += x[:-d] * g
    x = x + room
    peak = np.max(np.abs(x)) or 1.0
    return x / peak * 0.89


def write_mp3(samples: np.ndarray, out_mp3: Path):
    wav_path = out_mp3.with_suffix(".tmp.wav")
    pcm = (np.clip(samples, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(wav_path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    subprocess.run([str(FFMPEG), "-v", "error", "-y", "-i", str(wav_path), "-af", "loudnorm=I=-16:TP=-1.5:LRA=9", "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "128k", str(out_mp3)], check=True)
    wav_path.unlink()


async def build_scene_audio(scene_key: str, text: str, voice: str, rate: str, out_mp3: Path):
    sentences = split_sentences(text)
    pieces = []
    words_all = []
    cursor = SCENE_HEAD_S
    pieces.append(np.zeros(int(SCENE_HEAD_S * SR)))
    rng = np.random.default_rng(len(text))
    for si, (sentence, pause) in enumerate(sentences):
        mp3 = TMP_DIR / f"{scene_key}-{si:03d}.mp3"
        words = await synth_sentence(sentence, voice, rate, mp3)
        audio = decode(mp3)
        a = max(0, int((words[0]["start"] - LEAD_KEEP_S) * SR))
        b = min(len(audio), int((words[-1]["end"] + TAIL_KEEP_S) * SR))
        seg = audio[a:b]
        fade = min(len(seg) // 4, int(0.012 * SR))
        if fade > 0:
            seg[:fade] *= np.linspace(0, 1, fade)
            seg[-fade:] *= np.linspace(1, 0, fade)
        offset = cursor - a / SR
        for w in words:
            words_all.append({"text": w["text"], "start": round(w["start"] + offset, 3), "end": round(w["end"] + offset, 3)})
        pieces.append(seg)
        cursor += len(seg) / SR
        gap = pause if si < len(sentences) - 1 else SCENE_TAIL_S
        pieces.append(rng.normal(0, 10 ** (-66 / 20), int(gap * SR)))  # faint room tone, not digital silence
        cursor += gap
    full = polish(np.concatenate(pieces))
    write_mp3(full, out_mp3)
    return words_all, round(len(full) / SR, 3)


def build_subtitles(words: list):
    chunks, current = [], []
    for i, w in enumerate(words):
        current.append(w)
        is_last = i == len(words) - 1
        gap = (words[i + 1]["start"] - w["end"]) if not is_last else None
        ends_sentence = gap is not None and gap >= 0.45  # re-assembled sentence gaps are >= 0.5 s; comma pauses ~0.3 s
        natural_break = gap is not None and gap >= 0.12
        if len(current) >= MAX_CHUNK_WORDS or is_last or ends_sentence or (natural_break and len(current) >= MIN_CHUNK_WORDS):
            chunks.append(current)
            current = []
    if current:
        chunks.append(current)
    merged = []
    for ch in chunks:  # an orphan word left after a comma joins the previous chunk of the same sentence
        if merged and len(ch) == 1 and ch[0]["start"] - merged[-1][-1]["end"] < 0.45 and len(merged[-1]) <= MAX_CHUNK_WORDS:
            merged[-1] = merged[-1] + ch
        else:
            merged.append(ch)
    chunks = merged
    return [{"text": " ".join(w["text"] for w in c), "start": c[0]["start"], "end": c[-1]["end"]} for c in chunks]


def probe_ok(path: Path) -> bool:
    r = subprocess.run([str(FFMPEG).replace("ffmpeg.exe", "ffprobe.exe"), "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)], capture_output=True, text=True)
    try:
        return float(r.stdout.strip()) > 1.0
    except ValueError:
        return False


async def main_only(ids: list, voice: str, rate: str):
    """Re-voices only the given scene ids and patches them into the existing timeline."""
    scenes = {s["id"]: s for s in parse_scenes(SCRIPT_PATH.read_text(encoding="utf-8"))}
    timeline = json.loads(TIMELINE_PATH.read_text(encoding="utf-8"))
    for sc in timeline["scenes"]:
        if sc["id"] not in ids:
            continue
        scene = scenes[sc["id"]]
        name = sc["audioFile"]
        words, duration = await build_scene_audio(f"s{scene['index']:02d}", scene["text"], voice, rate, AUDIO_DIR / name)
        if not probe_ok(AUDIO_DIR / name):
            sys.exit(f"ffprobe rejected {name}")
        (PUBLIC_AUDIO_DIR / name).write_bytes((AUDIO_DIR / name).read_bytes())
        sc.update({"durationSeconds": duration, "wordCount": len(words), "subtitles": build_subtitles(words), "words": words})
        print(f"re-voiced {sc['id']}: {duration:.2f}s", flush=True)
    timeline["totalDurationSeconds"] = round(sum(s["durationSeconds"] for s in timeline["scenes"]), 3)
    TIMELINE_PATH.write_text(json.dumps(timeline, ensure_ascii=False, indent=1), encoding="utf-8")
    (AUDIO_DIR / "timeline.json").write_text(TIMELINE_PATH.read_text(encoding="utf-8"), encoding="utf-8")


async def main_full(voice: str, rate: str):
    for d in (AUDIO_DIR, PUBLIC_AUDIO_DIR, TMP_DIR, TIMELINE_PATH.parent):
        d.mkdir(parents=True, exist_ok=True)
    scenes = parse_scenes(SCRIPT_PATH.read_text(encoding="utf-8"))
    if not scenes:
        sys.exit("No scenes parsed")
    timeline = {"voice": voice, "rate": rate, "scenes": []}
    total = 0.0
    for scene in scenes:
        name = f"scene-{scene['index']:02d}.mp3"
        words, duration = await build_scene_audio(f"s{scene['index']:02d}", scene["text"], voice, rate, AUDIO_DIR / name)
        if not probe_ok(AUDIO_DIR / name):
            sys.exit(f"ffprobe rejected {name}")
        (PUBLIC_AUDIO_DIR / name).write_bytes((AUDIO_DIR / name).read_bytes())
        timeline["scenes"].append({
            "index": scene["index"], "id": scene["id"], "audioFile": name, "durationSeconds": duration,
            "wordCount": len(words), "subtitles": build_subtitles(words), "words": words,
        })
        total += duration
        print(f"scene {scene['index']:02d} ({scene['id']}): {len(words)} words, {duration:.2f}s", flush=True)
    timeline["totalDurationSeconds"] = round(total, 3)
    TIMELINE_PATH.write_text(json.dumps(timeline, ensure_ascii=False, indent=1), encoding="utf-8")
    (AUDIO_DIR / "timeline.json").write_text(TIMELINE_PATH.read_text(encoding="utf-8"), encoding="utf-8")
    print(f"\nTotal: {int(total // 60)}m{total % 60:04.1f}s")


async def main_samples():
    out = ROOT / "out" / "voice-samples"
    out.mkdir(parents=True, exist_ok=True)
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    scenes = parse_scenes(SCRIPT_PATH.read_text(encoding="utf-8"))
    text = next((s["text"] for s in scenes if s["id"] == "unemployment"), scenes[1]["text"])
    if "Un exemple." in text:
        text = text[text.index("Un exemple."):]
    for i, (voice, rate) in enumerate(SAMPLE_VOICES, start=1):
        target = out / f"{i}-{voice}.mp3"
        await build_scene_audio(f"sample{i}", text, voice, rate, target)
        print("ok", target.name, flush=True)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default=DEFAULT_VOICE)
    ap.add_argument("--rate", default=DEFAULT_RATE)
    ap.add_argument("--samples", action="store_true")
    ap.add_argument("--only", default="", help="comma-separated scene ids to re-voice into the existing timeline")
    ap.add_argument("--resub", action="store_true", help="rebuild subtitle chunks from stored word timings only")
    args = ap.parse_args()
    if args.resub:
        tl = json.loads(TIMELINE_PATH.read_text(encoding="utf-8"))
        for sc in tl["scenes"]:
            sc["subtitles"] = build_subtitles(sc["words"])
        TIMELINE_PATH.write_text(json.dumps(tl, ensure_ascii=False, indent=1), encoding="utf-8")
        (AUDIO_DIR / "timeline.json").write_text(TIMELINE_PATH.read_text(encoding="utf-8"), encoding="utf-8")
        sys.exit(0)
    if args.only:
        asyncio.run(main_only(args.only.split(","), args.voice, args.rate))
        sys.exit(0)
    asyncio.run(main_samples() if args.samples else main_full(args.voice, args.rate))
