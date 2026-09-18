"""Generate per-scene TTS narration + word-boundary subtitle timing for the F2 video.

Reads script/f2-narration.fr.md (## SCENE blocks), synthesizes one MP3 per scene
with edge-tts, captures WordBoundary events (the actual TTS timing, not a manual
estimate), groups them into 3-7 word subtitle chunks, and writes
audio/timeline.json consumed directly by the Remotion project.
"""
import asyncio
import json
import re
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).parent
SCRIPT_PATH = ROOT / "script" / "f2-narration.fr.md"
AUDIO_DIR = ROOT / "audio"
VOICE = "fr-FR-DeniseNeural"
RATE = "-2%"
MIN_CHUNK_WORDS = 3
MAX_CHUNK_WORDS = 7
PAUSE_BREAK_S = 0.12  # a gap this long between two TTS words means the engine paused for punctuation
SCENE_TAIL_PAD_S = 0.45  # short breathing room after the last word of a scene


def parse_scenes(md_text: str):
    pattern = re.compile(
        r"^## SCENE (\d+) — id: ([a-z0-9-]+)\s*\n(.*?)(?=^## SCENE |\Z)",
        re.MULTILINE | re.DOTALL,
    )
    scenes = []
    for match in pattern.finditer(md_text):
        index = int(match.group(1))
        scene_id = match.group(2)
        text = match.group(3).strip()
        text = re.sub(r"\s+", " ", text)
        scenes.append({"index": index, "id": scene_id, "text": text})
    return scenes


async def synth_scene(scene: dict):
    communicate = edge_tts.Communicate(scene["text"], VOICE, rate=RATE, boundary="WordBoundary")
    submaker_words = []
    audio_path = AUDIO_DIR / f"scene-{scene['index']:02d}.mp3"
    with open(audio_path, "wb") as audio_file:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_file.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                submaker_words.append(
                    {
                        "text": chunk["text"],
                        "start": chunk["offset"] / 1e7,
                        "end": (chunk["offset"] + chunk["duration"]) / 1e7,
                    }
                )
    return audio_path.name, submaker_words


def build_subtitles(words: list):
    """Group TTS words into 3-7 word subtitle chunks, breaking at the engine's
    own pauses (punctuation) instead of guessing — a gap between two
    WordBoundary events means edge-tts paused there for a comma/period."""
    chunks = []
    current = []
    for i, w in enumerate(words):
        current.append(w)
        is_last = i == len(words) - 1
        gap = (words[i + 1]["start"] - w["end"]) if not is_last else None
        natural_break = gap is not None and gap >= PAUSE_BREAK_S
        if len(current) >= MAX_CHUNK_WORDS or is_last or (natural_break and len(current) >= MIN_CHUNK_WORDS):
            chunks.append(current)
            current = []
    if current:
        if chunks and len(current) < MIN_CHUNK_WORDS:
            chunks[-1].extend(current)
        else:
            chunks.append(current)

    subtitles = []
    for chunk in chunks:
        subtitles.append(
            {
                "text": " ".join(w["text"] for w in chunk),
                "start": round(chunk[0]["start"], 3),
                "end": round(chunk[-1]["end"], 3),
            }
        )
    return subtitles


async def main():
    AUDIO_DIR.mkdir(exist_ok=True)
    md_text = SCRIPT_PATH.read_text(encoding="utf-8")
    scenes = parse_scenes(md_text)
    if not scenes:
        print("No scenes parsed from script markdown", file=sys.stderr)
        sys.exit(1)

    timeline = {"voice": VOICE, "rate": RATE, "scenes": []}
    total_duration = 0.0
    for scene in scenes:
        audio_file, words = await synth_scene(scene)
        duration = (words[-1]["end"] if words else 0.0) + SCENE_TAIL_PAD_S
        subtitles = build_subtitles(words)
        timeline["scenes"].append(
            {
                "index": scene["index"],
                "id": scene["id"],
                "audioFile": audio_file,
                "durationSeconds": round(duration, 3),
                "wordCount": len(words),
                "subtitles": subtitles,
            }
        )
        total_duration += duration
        print(f"scene {scene['index']:02d} ({scene['id']}): {len(words)} words, {duration:.2f}s")

    timeline["totalDurationSeconds"] = round(total_duration, 3)
    (AUDIO_DIR / "timeline.json").write_text(
        json.dumps(timeline, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    minutes = int(total_duration // 60)
    seconds = total_duration - minutes * 60
    print(f"\nTotal narration duration: {minutes}m{seconds:04.1f}s")


if __name__ == "__main__":
    asyncio.run(main())
