import { MOCK_NOW } from "@/lib/clock";
import { hash, seeded } from "../random";
import type { Baseline, Bearing, CommissionDraft, Kurtogram, Mounting, TestCapture } from "../types";
import { machineSpectrum } from "./signals";
import { MACHINES } from "./world";

/** Defect frequencies as multiples of shaft speed, for bearings like these (fictitious catalogue values). */
export const BEARINGS: Bearing[] = [
  { model: "6205", kind: "Deep groove ball", bpfo: 3.59, bpfi: 5.41, bsf: 2.36, ftf: 0.4 },
  { model: "6309", kind: "Deep groove ball", bpfo: 3.58, bpfi: 5.42, bsf: 2.36, ftf: 0.4 },
  { model: "6312", kind: "Deep groove ball", bpfo: 3.07, bpfi: 4.93, bsf: 2.03, ftf: 0.38 },
  { model: "NU 216", kind: "Cylindrical roller", bpfo: 6.3, bpfi: 8.7, bsf: 2.84, ftf: 0.42 },
  { model: "22216 E", kind: "Spherical roller", bpfo: 7.62, bpfi: 10.38, bsf: 3.18, ftf: 0.42 },
];

/** How high a mounting can be trusted: a stud carries the most, a hand-held probe the least. */
export const MOUNTING_MAX_HZ: Record<Mounting, number> = { stud: 5000, adhesive: 4000, magnet: 2000, probe: 1000 };

const CAPTURE_RESOLUTION_HZ = 1;
const KURTOGRAM_LEVELS = 6;
const RESONANCE_HZ = 2850;
const BEST_WIDTH_HZ = 900;

/** One second of signal: 1 Hz lines up to the mounting's band, plus the checks a technician reads before going on. */
export function testCapture(d: CommissionDraft): TestCapture {
  const m = MACHINES.find((x) => x.id === d.machineId)!;
  const full = machineSpectrum(m, `${d.machineId}.${d.input}.test`, d.rpm ?? undefined);
  const top = MOUNTING_MAX_HZ[d.mounting];
  const step = CAPTURE_RESOLUTION_HZ / (full.hz[1] - full.hz[0]);
  const keep = full.hz.map((_, i) => i).filter((i) => i % step === 0 && full.hz[i] <= top);
  const spectrum = { ...full, hz: keep.map((i) => full.hz[i]), amp: keep.map((i) => full.amp[i]), markers: full.markers.filter((x) => x.hz <= top).map((x) => ({ ...x, attributed: false })) };
  const r = seeded(hash(d.machineId + d.input));
  const f1 = (d.rpm ?? m.rpm ?? 1500) / 60;
  const magnetLoose = d.mounting === "magnet" && r() < 0.15;
  return {
    at: new Date(MOCK_NOW).toISOString(),
    spectrum,
    checks: [
      { key: "level", label: "Signal level", value: `${(0.3 + r() * 0.4).toFixed(2)} g RMS`, ok: true },
      { key: "clip", label: "No clipping", value: "Peak at 18% of range", ok: true },
      { key: "bias", label: "Sensor bias", value: `${(11.4 + r() * 0.8).toFixed(1)} V`, ok: true },
      { key: "shaft", label: "Shaft peak where the speed says", value: `${f1.toFixed(1)} Hz`, ok: true },
      { key: "mount", label: "Mounting resonance above the band", value: magnetLoose ? "Resonance at 1.6 kHz: reseat the magnet" : "None below the band", ok: !magnetLoose },
    ],
  };
}

/** Spectral kurtosis rises in the band where bearing impacts ring the structure (around 2.85 kHz here). */
export function kurtogram(d: CommissionDraft): Kurtogram {
  const maxHz = MOUNTING_MAX_HZ[d.mounting];
  const m = MACHINES.find((x) => x.id === d.machineId)!;
  const r = seeded(hash(`${d.machineId}.kurt`));
  const impacts = m.health === "watch" || m.health === "alarm" ? 1 : 0.45;
  const centre = Math.min(RESONANCE_HZ, maxHz * 0.7);
  let best = { level: 0, index: 0, from: 0, to: maxHz, kurtosis: 0 };
  const levels = Array.from({ length: KURTOGRAM_LEVELS }, (_, k) => {
    const n = 2 ** k;
    const width = maxHz / n;
    return Array.from({ length: n }, (_, i) => {
      const from = i * width, to = (i + 1) * width;
      // Bands that hold the resonance score highest, best near 900 Hz wide: wider ones dilute the impacts, narrower ones lose the ringing.
      const miss = centre >= from && centre <= to ? 0 : Math.min(Math.abs(centre - from), Math.abs(centre - to));
      const fit = Math.exp(-((miss / 300) ** 2)) * Math.exp(-(Math.log2(width / BEST_WIDTH_HZ) ** 2) / 2);
      const value = +(3 + impacts * 6 * fit * (0.85 + r() * 0.3) + r() * 0.6).toFixed(1);
      if (value > best.kurtosis) best = { level: k, index: i, from: Math.round(i * width), to: Math.round((i + 1) * width), kurtosis: value };
      return value;
    });
  });
  return { maxHz, levels, best };
}

const DAY_MS = 86_400_000;
export const baseline = (d: CommissionDraft): Baseline => ({
  pointId: `pt-${d.machineId}-${d.input}`.toLowerCase(), machineId: d.machineId,
  startedAt: new Date(MOCK_NOW).toISOString(), endsAt: new Date(MOCK_NOW + d.baselineDays * DAY_MS).toISOString(),
});
