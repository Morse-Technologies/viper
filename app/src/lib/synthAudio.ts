import { hash, seeded } from "@/lib/api/random";

/** Mock machine sound, made in the browser: shaft harmonics, broadband noise and, if faulty, a bearing tick. No recording of anyone. */
const SAMPLE_RATE = 16_000;
const HARMONICS = [1, 2, 3];
const NOISE = 0.08;
const TICK_EVERY = 1 / 88.3; // seconds between bearing impacts (BPFO of the mock extruder at 1,480 rpm)
const TICK_DECAY = 900;

function samples({ seconds, rpm, faulty, seed }: { seconds: number; rpm: number; faulty: boolean; seed: string }) {
  const rnd = seeded(hash(seed));
  const f1 = rpm / 60;
  const out = new Float32Array(Math.round(seconds * SAMPLE_RATE));
  for (let i = 0; i < out.length; i++) {
    const t = i / SAMPLE_RATE;
    const hum = HARMONICS.reduce((s, h) => s + Math.sin(2 * Math.PI * f1 * h * t) / (h * 3), 0);
    const tick = faulty ? Math.exp(-((t % TICK_EVERY) * TICK_DECAY)) * Math.sin(2 * Math.PI * 3200 * t) * 0.5 : 0;
    out[i] = (hum + tick + (rnd() - 0.5) * NOISE * 2) * 0.6;
  }
  return out;
}

/** 16-bit mono PCM WAV. */
function wav(data: Float32Array): Blob {
  const buf = new ArrayBuffer(44 + data.length * 2);
  const v = new DataView(buf);
  const text = (o: number, s: string) => [...s].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
  text(0, "RIFF"); v.setUint32(4, 36 + data.length * 2, true); text(8, "WAVEfmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, SAMPLE_RATE, true); v.setUint32(28, SAMPLE_RATE * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  text(36, "data"); v.setUint32(40, data.length * 2, true);
  data.forEach((s, i) => v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s)) * 0x7fff, true));
  return new Blob([buf], { type: "audio/wav" });
}

export const synthSnippet = (p: { seconds: number; rpm: number; faulty: boolean; seed: string }) => wav(samples(p));
