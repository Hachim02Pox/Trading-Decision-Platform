// Synthesizes a minimal SFX kit as 16-bit mono WAVs — no external assets needed.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SR = 44100;
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "sfx");
mkdirSync(OUT, { recursive: true });

function wav(samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  return buf;
}

const secs = (s) => Math.round(s * SR);

// whoosh — noise burst, lowpassed, swelling then dying (scene transitions)
{
  const N = secs(0.4);
  const out = new Float32Array(N);
  let lp = 0;
  for (let i = 0; i < N; i++) {
    const t = i / N;
    const env = Math.sin(Math.PI * Math.pow(t, 0.7)) ** 2;
    const cutoff = 0.05 + 0.25 * Math.sin(Math.PI * t);
    lp += cutoff * ((Math.random() * 2 - 1) - lp);
    out[i] = lp * env * 0.9;
  }
  writeFileSync(join(OUT, "whoosh.wav"), wav(out));
}

// pop — quick pitch-dropping sine (coin/cash/card entrances)
{
  const N = secs(0.14);
  const out = new Float32Array(N);
  let phase = 0;
  for (let i = 0; i < N; i++) {
    const t = i / N;
    const f = 700 - 380 * t;
    phase += (2 * Math.PI * f) / SR;
    out[i] = Math.sin(phase) * Math.exp(-t * 9) * 0.8;
  }
  writeFileSync(join(OUT, "pop.wav"), wav(out));
}

// chime — bright two-partial pluck (glossary cards, KPI numbers landing)
{
  const N = secs(0.3);
  const out = new Float32Array(N);
  let p1 = 0;
  let p2 = 0;
  for (let i = 0; i < N; i++) {
    const t = i / N;
    p1 += (2 * Math.PI * 1046.5) / SR;
    p2 += (2 * Math.PI * 1568) / SR;
    out[i] = (Math.sin(p1) * 0.6 + Math.sin(p2) * 0.4) * Math.exp(-t * 7) * 0.55;
  }
  writeFileSync(join(OUT, "chime.wav"), wav(out));
}

// tick — tiny high blip (counters, glossary rhythm)
{
  const N = secs(0.05);
  const out = new Float32Array(N);
  let phase = 0;
  for (let i = 0; i < N; i++) {
    const t = i / N;
    phase += (2 * Math.PI * 1900) / SR;
    out[i] = Math.sin(phase) * Math.exp(-t * 14) * 0.5;
  }
  writeFileSync(join(OUT, "tick.wav"), wav(out));
}

// bass — low thump on scene cuts / big reveals
{
  const N = secs(0.45);
  const out = new Float32Array(N);
  let phase = 0;
  for (let i = 0; i < N; i++) {
    const t = i / N;
    const f = 85 - 25 * t;
    phase += (2 * Math.PI * f) / SR;
    out[i] = Math.sin(phase) * Math.exp(-t * 6) * 0.95;
  }
  writeFileSync(join(OUT, "bass.wav"), wav(out));
}

// click — UI click for the terminal-usage mockup (KPI card / drawer open)
{
  const N = secs(0.09);
  const out = new Float32Array(N);
  let phase = 0;
  for (let i = 0; i < N; i++) {
    const t = i / N;
    phase += (2 * Math.PI * 2400) / SR;
    out[i] = Math.sin(phase) * Math.exp(-t * 20) * 0.45;
  }
  writeFileSync(join(OUT, "click.wav"), wav(out));
}

// pad — warm detuned drone loop, very low in the mix, one long bed for the whole video
{
  const DUR = 45;
  const N = secs(DUR);
  const out = new Float32Array(N);
  const freqs = [82.41, 123.47, 164.81, 207.65]; // E2 B2 E3 G#3 — warm minor-ish bed
  const detune = 1.0013;
  for (const f of freqs) {
    for (const d of [f / detune, f * detune]) {
      let phase = Math.random() * Math.PI * 2;
      for (let i = 0; i < N; i++) {
        phase += (2 * Math.PI * d) / SR;
        out[i] += Math.sin(phase);
      }
    }
  }
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const attack = Math.min(1, t / 2.5);
    const release = Math.min(1, (DUR - t) / 3);
    const trem = 1 - 0.12 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.09 * t));
    out[i] *= (0.4 / (freqs.length * 2)) * attack * release * trem;
  }
  writeFileSync(join(OUT, "pad.wav"), wav(out));
}

console.log("SFX written to", OUT);
