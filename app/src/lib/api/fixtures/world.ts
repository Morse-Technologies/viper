import { MOCK_NOW } from "@/lib/clock";
import type { Health, Machine, Modality, Operating, Plant, User } from "../types";

/** All names are fictitious. One group, three plants, forty machines. */
export const GROUP_NAME = "Ferrovela Group";

const MIN = 60_000;
export const ago = (minutes: number) => new Date(MOCK_NOW - minutes * MIN).toISOString();

export const PLANTS: Plant[] = [
  { id: "pl-north", code: "PN", name: "North Plant", city: "Valdemora", timezone: "Europe/Madrid", link: "online", lastHeartbeatAt: ago(0.5), lines: ["L1", "L2", "L3", "L4"] },
  { id: "pl-south", code: "PS", name: "South Plant", city: "Arenzal", timezone: "Europe/Madrid", link: "online", lastHeartbeatAt: ago(1), lines: ["L1", "L2", "L3"] },
  { id: "pl-coast", code: "PC", name: "Coast Plant", city: "Marisca", timezone: "Europe/Madrid", link: "degraded", lastHeartbeatAt: ago(14), lines: ["L1", "L2"] },
];

const KINDS: Record<string, { kind: string; pack: string; modalities: Modality[]; rpm: number | null }> = {
  EXT: { kind: "Extruder", pack: "extruder-single-screw", modalities: ["series", "vibration", "camera"], rpm: 1480 },
  PRS: { kind: "Hydraulic press", pack: "press-hydraulic", modalities: ["series", "gauge", "camera"], rpm: null },
  BMB: { kind: "Centrifugal pump", pack: "pump-centrifugal", modalities: ["series", "vibration", "audio"], rpm: 2950 },
  CMP: { kind: "Screw compressor", pack: "compressor-screw", modalities: ["series", "vibration", "audio", "thermal"], rpm: 3000 },
  MOT: { kind: "Induction motor", pack: "motor-induction", modalities: ["series", "vibration"], rpm: 1490 },
  FAN: { kind: "Extraction fan", pack: "fan-axial", modalities: ["series", "vibration", "audio"], rpm: 980 },
  GRB: { kind: "Gearbox", pack: "gearbox-helical", modalities: ["series", "vibration"], rpm: 1470 },
  CNV: { kind: "Belt conveyor", pack: "conveyor-belt", modalities: ["series", "camera"], rpm: 740 },
  MIX: { kind: "Mixer", pack: "mixer-paddle", modalities: ["series", "vibration", "display"], rpm: 120 },
  CHL: { kind: "Chiller", pack: "chiller-water", modalities: ["series", "thermal", "display"], rpm: null },
};

/** code, line, health, index (null = no data), descriptive name. */
type Row = [string, string, Health, number | null, string];

const ROWS: Record<string, Row[]> = {
  "pl-north": [
    ["EXT-01", "L2", "watch", 64, "Extruder line 2"], ["EXT-02", "L2", "healthy", 91, "Extruder line 2 B"],
    ["PRS-04", "L1", "alarm", 22, "Press line 1"], ["BMB-11", "L3", "nodata", null, "Cooling pump 11"],
    ["BMB-12", "L3", "healthy", 88, "Cooling pump 12"], ["CMP-01", "L4", "watch", 58, "Air compressor 1"],
    ["CMP-02", "L4", "healthy", 86, "Air compressor 2"], ["MOT-07", "L1", "healthy", 94, "Main drive motor 7"],
    ["MOT-08", "L2", "healthy", 89, "Main drive motor 8"], ["FAN-03", "L4", "watch", 61, "Fume extraction fan 3"],
    ["GRB-02", "L2", "alarm", 31, "Gearbox line 2"], ["CNV-05", "L1", "healthy", 96, "Outfeed conveyor 5"],
    ["CNV-06", "L3", "stopped", 80, "Infeed conveyor 6"], ["MIX-01", "L3", "healthy", 83, "Compound mixer 1"],
    ["CHL-01", "L4", "healthy", 90, "Process chiller 1"], ["PRS-05", "L1", "healthy", 78, "Press line 1 B"],
    ["EXT-03", "L4", "healthy", 87, "Extruder line 4"], ["MOT-09", "L4", "watch", 67, "Pump motor 9"],
  ],
  "pl-south": [
    ["EXT-11", "L1", "healthy", 92, "Extruder line 1"], ["EXT-12", "L1", "watch", 66, "Extruder line 1 B"],
    ["PRS-21", "L2", "healthy", 85, "Stamping press 21"], ["PRS-22", "L2", "alarm", 27, "Stamping press 22"],
    ["BMB-31", "L3", "healthy", 90, "Process pump 31"], ["BMB-32", "L3", "healthy", 87, "Process pump 32"],
    ["CMP-11", "L3", "healthy", 82, "Air compressor 11"], ["MOT-21", "L2", "healthy", 93, "Drive motor 21"],
    ["FAN-11", "L1", "healthy", 88, "Oven fan 11"], ["GRB-11", "L2", "watch", 59, "Gearbox 11"],
    ["CNV-21", "L1", "healthy", 95, "Transfer conveyor 21"], ["MIX-11", "L3", "nodata", null, "Batch mixer 11"],
    ["CHL-11", "L3", "healthy", 89, "Chiller 11"], ["MOT-22", "L1", "stopped", 84, "Drive motor 22"],
  ],
  "pl-coast": [
    ["BMB-41", "L1", "watch", 63, "Seawater pump 41"], ["BMB-42", "L1", "healthy", 86, "Seawater pump 42"],
    ["CMP-41", "L2", "healthy", 84, "Air compressor 41"], ["FAN-41", "L2", "alarm", 34, "Cooling tower fan 41"],
    ["MOT-41", "L1", "healthy", 91, "Drive motor 41"], ["CNV-41", "L2", "healthy", 93, "Packing conveyor 41"],
    ["CHL-41", "L2", "healthy", 88, "Chiller 41"], ["GRB-41", "L1", "healthy", 81, "Gearbox 41"],
  ],
};

const TREND_DAYS = 7;
const WATCH_DRIFT = 4;

function trend(index: number | null, health: Health): number[] {
  if (index === null) return [];
  const slope = health === "healthy" ? 0.4 : health === "watch" ? WATCH_DRIFT : WATCH_DRIFT * 2;
  const wobble = [0, 2, -1, 1, -2, 1, 0]; // day-to-day noise so the line reads as measured, not drawn
  return Array.from({ length: TREND_DAYS }, (_, i) => Math.min(100, Math.round(index + slope * (TREND_DAYS - 1 - i) + wobble[i])));
}

const operating = (h: Health): Operating => (h === "stopped" ? "stopped" : h === "nodata" ? "unknown" : "running");

function toMachine(plantId: string, [code, line, health, index, name]: Row, i: number): Machine {
  const k = KINDS[code.slice(0, 3)];
  return {
    id: `${plantId.slice(3)}-${code.toLowerCase()}`, plantId, code, name, line, kind: k.kind,
    health, healthIndex: index, healthTrend: trend(index, health), operating: operating(health),
    modalities: k.modalities, rpm: k.rpm, pack: k.pack, packVersion: `1.${i % 4}.0`,
    lastAlertAt: health === "alarm" ? ago(134 + i) : health === "watch" ? ago(60 * (6 + i)) : null,
    degradation: health === "watch" ? { warnInDays: [18 + i, 40 + i] } : null,
  };
}

export const MACHINES: Machine[] = PLANTS.flatMap((p) => ROWS[p.id].map((r, i) => toMachine(p.id, r, i)));

export const machineByCode = (code: string) => MACHINES.find((m) => m.code === code)!;

export const USERS: User[] = [
  { id: "u-1", name: "Lucía Barreiro", email: "lucia.barreiro@ferrovela.example", role: "admin", hue: 168, totp: true, lastSeenAt: ago(2) },
  { id: "u-2", name: "Andrés Couto", email: "andres.couto@ferrovela.example", role: "maintainer", hue: 32, totp: true, lastSeenAt: ago(25) },
  { id: "u-3", name: "Marta Insua", email: "marta.insua@ferrovela.example", role: "maintainer", hue: 210, totp: true, lastSeenAt: ago(190) },
  { id: "u-4", name: "Iago Rial", email: "iago.rial@ferrovela.example", role: "operator", hue: 280, totp: true, lastSeenAt: ago(8) },
  { id: "u-5", name: "Noa Seoane", email: "noa.seoane@ferrovela.example", role: "operator", hue: 120, totp: false, lastSeenAt: null },
  { id: "u-6", name: "Brais Lamas", email: "brais.lamas@ferrovela.example", role: "viewer", hue: 350, totp: true, lastSeenAt: ago(2880) },
];
