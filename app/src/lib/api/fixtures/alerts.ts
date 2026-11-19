import type { Alert, Evidence, Modality, Severity } from "../types";
import { ago, machineByCode } from "./world";

type Seed = {
  code: string; severity: Severity; status: Alert["status"]; title: string; summary: string;
  minutes: number; rule: string; model: string | null; mix: [Modality, number][];
};

const SEEDS: Seed[] = [
  { code: "EXT-01", severity: "high", status: "open", minutes: 134, rule: "fusion", model: "bearing-envelope v4",
    title: "Possible outer race defect (drive-end bearing)",
    summary: "Since 11:40 the axial envelope shows peaks at BPFO (88.3 Hz) and harmonics; motor current is 12% over its baseline. The 13:55 frame differs from the reference in the marked zone.",
    mix: [["vibration", 62], ["series", 23], ["camera", 15]] },
  { code: "PRS-04", severity: "high", status: "open", minutes: 52, rule: "threshold", model: null,
    title: "Hydraulic pressure above alarm limit",
    summary: "Main cylinder pressure has stayed above 212 bar (alarm 210) for 18 minutes. The gauge reading on CAM-03 agrees with the transmitter.",
    mix: [["series", 71], ["gauge", 29]] },
  { code: "GRB-02", severity: "high", status: "acknowledged", minutes: 410, rule: "model", model: "gear-mesh v2",
    title: "Gear mesh sidebands rising",
    summary: "Sidebands around the gear mesh frequency grew 9 dB in 3 days. Oil temperature is stable, so lubrication is not the first suspect.",
    mix: [["vibration", 88], ["series", 12]] },
  { code: "BMB-11", severity: "medium", status: "open", minutes: 190, rule: "quiet-source", model: null,
    title: "Source went quiet",
    summary: "No valid data from flow and current since 13:50. Check the OPC UA tag or the sensor cable.",
    mix: [["series", 100]] },
  { code: "CMP-01", severity: "medium", status: "open", minutes: 300, rule: "model", model: "tabular-iforest v7",
    title: "Discharge temperature drifting up",
    summary: "Discharge temperature rose 6 °C over its learned baseline for the same load. Ambient did not change.",
    mix: [["series", 58], ["thermal", 42]] },
  { code: "FAN-03", severity: "medium", status: "open", minutes: 520, rule: "model", model: "acoustic-ae v3",
    title: "Unusual tonal noise at 1.2 kHz",
    summary: "The acoustic model flags a new tone near 1.2 kHz during the last two shifts. Vibration at 1× rose slightly.",
    mix: [["audio", 67], ["vibration", 33]] },
  { code: "MOT-09", severity: "medium", status: "open", minutes: 760, rule: "model", model: "tabular-iforest v7",
    title: "Current imbalance between phases",
    summary: "Phase B current is 7% under A and C since the 06:00 start. Check connections in the motor terminal box.",
    mix: [["series", 100]] },
  { code: "EXT-01", severity: "low", status: "open", minutes: 900, rule: "vision", model: "frame-anomaly v2",
    title: "Material build-up near the die",
    summary: "The anomaly map shows build-up at the die exit compared with the approved reference.",
    mix: [["camera", 100]] },
  { code: "PRS-22", severity: "high", status: "open", minutes: 75, rule: "fusion", model: "press-cycle v3",
    title: "Cycle time and ram vibration out of pattern",
    summary: "Cycle time grew 0.8 s and ram vibration doubled over the last 40 cycles. The gauge reads within limits.",
    mix: [["series", 54], ["vibration", 38], ["gauge", 8]] },
  { code: "GRB-11", severity: "medium", status: "open", minutes: 640, rule: "model", model: "gear-mesh v2",
    title: "Gear mesh energy trending up",
    summary: "Gear mesh energy rises slowly over 9 days. It would cross the warning limit in 20–35 days (estimate).",
    mix: [["vibration", 100]] },
  { code: "EXT-12", severity: "low", status: "open", minutes: 1100, rule: "threshold", model: null,
    title: "Barrel zone 3 temperature near warning",
    summary: "Zone 3 has stayed within 2 °C of the warning limit for 4 hours.",
    mix: [["series", 100]] },
  { code: "FAN-41", severity: "high", status: "open", minutes: 38, rule: "fusion", model: "fan-unbalance v1",
    title: "Fan unbalance (1× radial)",
    summary: "Radial vibration at 1× jumped from 2.1 to 7.9 mm/s within an hour. The sound level rose 4 dB(A).",
    mix: [["vibration", 74], ["audio", 26]] },
  { code: "BMB-41", severity: "low", status: "open", minutes: 1500, rule: "model", model: "pump-cavitation v2",
    title: "Early cavitation pattern",
    summary: "Broadband energy over 2 kHz rises at low suction pressure. Not yet over the warning limit.",
    mix: [["audio", 61], ["series", 39]] },
  { code: "PRS-04", severity: "medium", status: "resolved", minutes: 4320, rule: "threshold", model: null,
    title: "Oil temperature above warning", summary: "Oil temperature exceeded 58 °C; the cooler was cleaned.",
    mix: [["series", 100]] },
  { code: "CMP-02", severity: "low", status: "rejected", minutes: 2880, rule: "model", model: "tabular-iforest v6",
    title: "Load pattern change", summary: "A planned change of shift pattern, marked as a false alarm.",
    mix: [["series", 100]] },
  { code: "MOT-07", severity: "low", status: "resolved", minutes: 7200, rule: "model", model: "bearing-envelope v3",
    title: "Bearing lubrication", summary: "High-frequency noise fell after regreasing.", mix: [["vibration", 100]] },
];

const SOURCE: Record<Modality, (code: string) => string> = {
  series: () => "motor_current", vibration: () => "DE-axial", audio: () => "MIC-01", camera: (c) => `CAM-${c.slice(-2)}`,
  thermal: (c) => `IR-${c.slice(-2)}`, gauge: (c) => `CAM-${c.slice(-2)} · gauge`, display: (c) => `CAM-${c.slice(-2)} · display`,
};
const EVIDENCE_WINDOW_MIN = 120;

function evidence(id: string, code: string, mix: [Modality, number][], minutes: number): Evidence[] {
  return mix.map(([modality], i) => ({
    id: `${id}-ev${i}`, modality, source: SOURCE[modality](code), label: code,
    from: ago(minutes + EVIDENCE_WINDOW_MIN), to: modality === "camera" ? null : ago(minutes),
  }));
}

export const ALERTS: Alert[] = SEEDS.map((s, i) => {
  const m = machineByCode(s.code);
  const id = `al-${String(i + 1).padStart(3, "0")}`;
  return {
    id, plantId: m.plantId, machineId: m.id, severity: s.severity, status: s.status, title: s.title, summary: s.summary,
    openedAt: ago(s.minutes), rule: s.rule, modelVersion: s.model,
    contributions: s.mix.map(([modality, share]) => ({ modality, share })),
    evidence: evidence(id, s.code, s.mix, s.minutes),
    feedback: s.status === "rejected" ? "false" : s.status === "resolved" ? "correct" : null, pinned: i === 0,
  };
});
