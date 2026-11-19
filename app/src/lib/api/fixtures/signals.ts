import { MOCK_NOW } from "@/lib/clock";
import { hash, seeded } from "../random";
import type { Channel, Machine, Range, Series, Signal, Snippet, Spectrogram, Spectrum } from "../types";
import { DRIVERS } from "./catalog";
import { MACHINES, ago } from "./world";

type Template = { key: string; name: string; unit: string; base: number; warn: number | null; alarm: number | null };

const COMMON: Template[] = [
  { key: "current", name: "motor_current", unit: "A", base: 42, warn: 52, alarm: 58 },
  { key: "temp", name: "bearing_temp", unit: "°C", base: 48, warn: 70, alarm: 80 },
];
const BY_KIND: Record<string, Template[]> = {
  Extruder: [{ key: "melt", name: "melt_pressure", unit: "bar", base: 160, warn: 190, alarm: 205 }, { key: "zone3", name: "barrel_zone3_temp", unit: "°C", base: 182, warn: 195, alarm: 205 }],
  "Hydraulic press": [{ key: "press", name: "cylinder_pressure", unit: "bar", base: 190, warn: 205, alarm: 210 }, { key: "cycle", name: "cycle_time", unit: "s", base: 6.4, warn: 7.2, alarm: 8 }],
  "Centrifugal pump": [{ key: "flow", name: "flow", unit: "m³/h", base: 120, warn: null, alarm: null }, { key: "suction", name: "suction_pressure", unit: "bar", base: 1.8, warn: 1.2, alarm: 0.9 }],
  "Screw compressor": [{ key: "disch", name: "discharge_temp", unit: "°C", base: 82, warn: 95, alarm: 105 }],
};
const VIBRATION: Template = { key: "vrms", name: "vib_rms_velocity", unit: "mm/s", base: 2.2, warn: 4.5, alarm: 7.1 };

const fromTemplate = (m: Machine, t: Template): Signal => ({
  id: `${m.id}.${t.key}`, machineId: m.id, name: t.name, unit: t.unit, base: t.base, warn: t.warn, alarm: t.alarm,
  modality: t.key === "vrms" ? "vibration" : "series",
});

export const SIGNALS: Signal[] = MACHINES.flatMap((m) => [
  ...COMMON, ...(BY_KIND[m.kind] ?? []), ...(m.modalities.includes("vibration") ? [VIBRATION] : []),
].map((t) => fromTemplate(m, t)));

const RANGE_SECONDS: Record<Range, number> = { "1h": 3600, "24h": 86_400, "7d": 604_800, "30d": 2_592_000 };
const AGG: Record<Range, Series["agg"]> = { "1h": "raw", "24h": "1m", "7d": "5m", "30d": "1h" };
const POINTS = 360;
const NOISE = 0.03;
const DRIFT_BY_HEALTH = { healthy: 0, watch: 0.12, alarm: 0.28, nodata: 0, stopped: 0 } as const;
const GAP_FRACTION = 0.12;

/** A deterministic series: daily rhythm, noise, a health-dependent drift and, for silent machines, a gap at the end. */
export function seriesFor(signal: Signal, range: Range): Series {
  const m = MACHINES.find((x) => x.id === signal.machineId)!;
  const rnd = seeded(hash(signal.id + range));
  const span = RANGE_SECONDS[range];
  const end = Math.floor(MOCK_NOW / 1000);
  const t = Array.from({ length: POINTS }, (_, i) => end - span + Math.round((span * i) / (POINTS - 1)));
  const drift = DRIFT_BY_HEALTH[m.health];
  const v = t.map((ts, i) => {
    const p = i / (POINTS - 1);
    if (m.health === "nodata" && p > 1 - GAP_FRACTION) return null;
    if (m.health === "stopped" && p > 0.7) return +(signal.base * 0.02).toFixed(2);
    const daily = Math.sin((ts / 86_400) * Math.PI * 2) * 0.04;
    const value = signal.base * (1 + daily + (rnd() - 0.5) * NOISE * 2 + drift * p * p);
    return +value.toFixed(2);
  });
  return { signalId: signal.id, agg: AGG[range], t, v };
}

export const CHANNELS: Channel[] = MACHINES.flatMap((m) => [
  ...(m.modalities.includes("vibration") ? [
    { id: `${m.id}.de-axial`, machineId: m.id, name: "DE-axial", kind: "vibration" as const, sampleRateHz: 25_600, driverId: DRIVERS[0].id },
    { id: `${m.id}.de-radial`, machineId: m.id, name: "DE-radial", kind: "vibration" as const, sampleRateHz: 25_600, driverId: DRIVERS[1].id },
  ] : []),
  ...(m.modalities.includes("audio") ? [{ id: `${m.id}.mic-01`, machineId: m.id, name: "MIC-01", kind: "audio" as const, sampleRateHz: 48_000, driverId: DRIVERS[3].id }] : []),
]);

const BINS = 400;
/** Shaft orders and bearing frequencies of these machines sit below 250 Hz; the envelope band is shown, not the raw 0–10 kHz. */
const MAX_HZ = 250;
/** Bearing defect frequencies as multiples of shaft speed for a 6309-like bearing. */
const BEARING = { BPFO: 3.58, BPFI: 5.42, BSF: 2.36, FTF: 0.4 };

export function spectrumFor(channelId: string): Spectrum {
  const ch = CHANNELS.find((c) => c.id === channelId)!;
  const m = MACHINES.find((x) => x.id === ch.machineId)!;
  const rpm = m.rpm ?? 1500;
  const f1 = rpm / 60;
  const rnd = seeded(hash(channelId));
  const faulty = m.health === "watch" || m.health === "alarm";
  const peaks: [number, number][] = [[f1, 1], [2 * f1, 0.45], [3 * f1, 0.2], ...(faulty ? [[BEARING.BPFO * f1, 0.75], [2 * BEARING.BPFO * f1, 0.3]] as [number, number][] : [])];
  const hz = Array.from({ length: BINS }, (_, i) => (i * MAX_HZ) / BINS);
  const amp = hz.map((f) => 0.02 + rnd() * 0.02 + peaks.reduce((s, [pf, a]) => s + a * Math.exp(-(((f - pf) / 0.8) ** 2)), 0));
  const markers = [
    { label: "1×", hz: f1, attributed: false }, { label: "2×", hz: 2 * f1, attributed: false }, { label: "3×", hz: 3 * f1, attributed: false },
    ...Object.entries(BEARING).map(([label, k]) => ({ label, hz: +(k * f1).toFixed(1), attributed: faulty && label === "BPFO" })),
  ].filter((mk) => mk.hz < MAX_HZ).sort((a, b) => a.hz - b.hz);
  return { channelId, hz, amp, markers, rpm };
}

const SPEC_ROWS = 84;
const SPEC_COLS = 96;

export function spectrogramFor(channelId: string): Spectrogram {
  const s = spectrumFor(channelId);
  const rnd = seeded(hash(channelId + "sg"));
  const peak = Math.max(...s.amp);
  const rows = Array.from({ length: SPEC_ROWS }, (_, r) => Array.from({ length: SPEC_COLS }, (_, c) => {
    const amp = s.amp[Math.floor((c / SPEC_COLS) * s.amp.length)] / peak;
    const growth = 0.55 + 0.45 * (r / SPEC_ROWS);
    return Math.min(1, amp * growth + rnd() * 0.08);
  }));
  return { channelId, rows, maxHz: MAX_HZ, days: 7 };
}

export const snippetsFor = (channelId: string): Snippet[] => [
  { id: `${channelId}.s1`, channelId, at: ago(65), seconds: 1, passedVoiceFilter: true },
  { id: `${channelId}.s2`, channelId, at: ago(139), seconds: 1, passedVoiceFilter: false },
  { id: `${channelId}.s3`, channelId, at: ago(212), seconds: 1, passedVoiceFilter: true },
  { id: `${channelId}.s4`, channelId, at: ago(500), seconds: 1, passedVoiceFilter: true },
];
