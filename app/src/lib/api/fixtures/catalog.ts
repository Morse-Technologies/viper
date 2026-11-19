import type { Camera, Driver, EdgeDevice, LabelTask, License, Model, Source, TaxonomyClass } from "../types";
import { ALERTS } from "./alerts";
import { MACHINES, ago, machineByCode } from "./world";

const DRIFT_POINTS = 14;
const drift = (end: number, step: number) => Array.from({ length: DRIFT_POINTS }, (_, i) => +(end - step * (DRIFT_POINTS - 1 - i)).toFixed(3));

export const MODELS: Model[] = [
  { id: "mdl-bearing", name: "Bearing envelope", task: "Anomaly", modality: "vibration", scope: "Pumps, motors, extruders", plantId: "pl-north", onnx: true, driftThreshold: 0.25, drift: drift(0.14, 0.004),
    versions: [
      { version: "v5", status: "shadow", trainedAt: ago(4320), precision: [0.88, 0.93], recall: [0.81, 0.88], alertsWouldOpen: 9, agreement: 0.91 },
      { version: "v4", status: "active", trainedAt: ago(43200), precision: [0.84, 0.9], recall: [0.78, 0.86], alertsWouldOpen: 12, agreement: 0.87 },
      { version: "v3", status: "retired", trainedAt: ago(129600), precision: [0.79, 0.86], recall: [0.7, 0.8], alertsWouldOpen: 17, agreement: 0.8 },
    ] },
  { id: "mdl-iforest", name: "Tabular Isolation Forest", task: "Anomaly", modality: "series", scope: "All machines", plantId: "pl-north", onnx: true, driftThreshold: 0.25, drift: drift(0.29, 0.012),
    versions: [
      { version: "v7", status: "active", trainedAt: ago(20160), precision: [0.72, 0.8], recall: [0.66, 0.75], alertsWouldOpen: 21, agreement: 0.78 },
      { version: "v6", status: "retired", trainedAt: ago(64800), precision: [0.68, 0.77], recall: [0.6, 0.71], alertsWouldOpen: 26, agreement: 0.74 },
    ] },
  { id: "mdl-acoustic", name: "Acoustic autoencoder", task: "Anomaly", modality: "audio", scope: "Fans, pumps, compressors", plantId: "pl-north", onnx: true, driftThreshold: 0.3, drift: drift(0.11, 0.002),
    versions: [{ version: "v3", status: "active", trainedAt: ago(30240), precision: [0.7, 0.81], recall: [0.62, 0.74], alertsWouldOpen: 7, agreement: 0.82 }] },
  { id: "mdl-gear", name: "Gear mesh sidebands", task: "Fault class", modality: "vibration", scope: "Gearboxes", plantId: "pl-north", onnx: true, driftThreshold: 0.25, drift: drift(0.09, 0.001),
    versions: [{ version: "v2", status: "active", trainedAt: ago(50400), precision: [0.86, 0.94], recall: [0.74, 0.85], alertsWouldOpen: 4, agreement: 0.9 }] },
  { id: "mdl-frame", name: "Frame anomaly", task: "Anomaly map", modality: "camera", scope: "Extruders, conveyors", plantId: "pl-north", onnx: true, driftThreshold: 0.2, drift: drift(0.18, 0.006),
    versions: [
      { version: "v3", status: "rejected", trainedAt: ago(8640), precision: [0.61, 0.72], recall: [0.7, 0.8], alertsWouldOpen: 31, agreement: 0.63 },
      { version: "v2", status: "active", trainedAt: ago(72000), precision: [0.77, 0.86], recall: [0.65, 0.76], alertsWouldOpen: 6, agreement: 0.84 },
    ] },
  { id: "mdl-gauge", name: "Gauge reader", task: "Reading", modality: "gauge", scope: "Analogue gauges", plantId: "pl-north", onnx: true, driftThreshold: 0.2, drift: drift(0.05, 0.001),
    versions: [{ version: "v1", status: "active", trainedAt: ago(86400), precision: [0.95, 0.98], recall: [0.94, 0.98], alertsWouldOpen: 0, agreement: 0.97 }] },
  { id: "mdl-rul", name: "Remaining useful life", task: "Trend with interval", modality: "series", scope: "Bearings with run-to-failure history", plantId: "pl-south", onnx: false, driftThreshold: 0.3, drift: drift(0.21, 0.008),
    versions: [{ version: "v1", status: "shadow", trainedAt: ago(2880), precision: [0.6, 0.74], recall: [0.55, 0.7], alertsWouldOpen: 3, agreement: 0.71 }] },
  { id: "mdl-cavitation", name: "Pump cavitation", task: "Fault class", modality: "audio", scope: "Seawater pumps", plantId: "pl-coast", onnx: true, driftThreshold: 0.25, drift: drift(0.12, 0.003),
    versions: [{ version: "v2", status: "active", trainedAt: ago(40320), precision: [0.8, 0.9], recall: [0.72, 0.83], alertsWouldOpen: 2, agreement: 0.86 }] },
];

const box = (x: number, y: number, w: number, h: number): [number, number][] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

export const CAMERAS: Camera[] = [
  ["CAM-01", "EXT-01", "ok", 0.42], ["CAM-02", "EXT-02", "ok", 0.08], ["CAM-03", "PRS-04", "ok", 0.12], ["CAM-04", "PRS-05", "ok", 0.05],
  ["CAM-05", "CNV-05", "ok", 0.03], ["CAM-06", "CNV-06", "stale", 0.04], ["CAM-07", "EXT-03", "ok", 0.06], ["CAM-08", "MIX-01", "offline", 0],
  ["CAM-21", "PRS-21", "ok", 0.07], ["CAM-22", "PRS-22", "ok", 0.21], ["CAM-41", "CNV-41", "ok", 0.04],
].map(([name, code, status, score], i) => {
  const m = machineByCode(code as string);
  const isPress = (code as string).startsWith("PRS");
  return {
    id: `cam-${(name as string).slice(4)}`, plantId: m.plantId, machineId: m.id, name: name as string,
    status: status as Camera["status"], gateway: m.plantId === "pl-north" ? "GW-02" : "GW-11", detector: "person-detector v3",
    personBlurred: i % 3 === 0, lastFrameAt: ago(status === "ok" ? 1 : status === "stale" ? 46 : 600),
    referenceApproved: status !== "offline", anomalyScore: score as number,
    rois: isPress
      ? [{ id: `roi-${i}-g`, name: "Main cylinder gauge", task: "gauge", points: box(0.62, 0.18, 0.2, 0.26), reading: { value: 208 + i, unit: "bar", at: ago(1) } },
         { id: `roi-${i}-a`, name: "Die area", task: "anomaly", points: box(0.18, 0.46, 0.34, 0.3), reading: null }]
      : [{ id: `roi-${i}-a`, name: "Die exit", task: "anomaly", points: box(0.3, 0.38, 0.36, 0.3), reading: null },
         { id: `roi-${i}-d`, name: "Panel display", task: "display", points: box(0.72, 0.12, 0.16, 0.12), reading: { value: 182 + i, unit: "°C", at: ago(1) } }],
  };
});

export const TAXONOMY: TaxonomyClass[] = [
  "Normal", "Bearing outer race", "Bearing inner race", "Unbalance", "Misalignment", "Looseness", "Cavitation", "Lubrication", "Sensor fault",
].map((name, i) => ({ id: `cls-${i + 1}`, name, key: i + 1 }));

const WHY = {
  uncertainty: "The model scored 0.51, right on its decision limit.",
  disagreement: "Active and shadow versions disagree on this window.",
  novelty: "This pattern is far from anything labelled before.",
} as const;

export const LABEL_TASKS: LabelTask[] = ALERTS.filter((a) => a.status === "open").slice(0, 10).map((a, i) => {
  const reason = (["uncertainty", "disagreement", "novelty"] as const)[i % 3];
  return {
    id: `lt-${i + 1}`, machineId: a.machineId, modality: a.evidence[0].modality, reason, why: WHY[reason],
    createdAt: ago(30 + i * 47), evidence: a.evidence[0], suggested: i % 2 ? "cls-2" : null,
  };
});

export const SOURCES: Source[] = [
  { id: "src-1", plantId: "pl-north", kind: "folder", name: "\\\\files\\scada\\export (CSV)", status: "ok", lagSeconds: 42, machineIds: MACHINES.filter((m) => m.plantId === "pl-north").slice(0, 8).map((m) => m.id), quarantined: 0 },
  { id: "src-2", plantId: "pl-north", kind: "opcua", name: "opc.tcp://plc-l1:4840", status: "ok", lagSeconds: 3, machineIds: [machineByCode("PRS-04").id, machineByCode("PRS-05").id], quarantined: 0 },
  { id: "src-3", plantId: "pl-north", kind: "opcua", name: "opc.tcp://plc-l3:4840", status: "quiet", lagSeconds: 7800, machineIds: [machineByCode("BMB-11").id], quarantined: 0 },
  { id: "src-4", plantId: "pl-north", kind: "mqtt", name: "mqtt://broker.north/energy/#", status: "lagging", lagSeconds: 640, machineIds: [machineByCode("CMP-01").id, machineByCode("CMP-02").id], quarantined: 3 },
  { id: "src-5", plantId: "pl-north", kind: "camera", name: "Camera gateway GW-02", status: "ok", lagSeconds: 2, machineIds: [], quarantined: 0 },
  { id: "src-6", plantId: "pl-north", kind: "edge", name: "viper-edge fleet", status: "ok", lagSeconds: 5, machineIds: [], quarantined: 0 },
  { id: "src-7", plantId: "pl-north", kind: "api", name: "MES upload API", status: "quarantined", lagSeconds: 0, machineIds: [], quarantined: 12 },
];

export const DRIVERS: Driver[] = [
  { id: "drv-1", name: "IEPE accelerometer via DAQ", kind: "daq-iepe", hardware: "MCC 172 (2 ch, 51.2 kS/s)", version: "0.5.2", channels: 2, calibratedAt: ago(20160), status: "ok" },
  { id: "drv-2", name: "IO-Link vibration sensor", kind: "io-link", hardware: "ifm VVB001", version: "0.5.0", channels: 1, calibratedAt: ago(30240), status: "ok" },
  { id: "drv-3", name: "Modbus vibration transmitter", kind: "modbus", hardware: "Banner QM30VT2", version: "0.4.9", channels: 1, calibratedAt: ago(40320), status: "ok" },
  { id: "drv-4", name: "USB measurement microphone", kind: "usb-audio", hardware: "miniDSP UMIK-1", version: "0.5.1", channels: 1, calibratedAt: ago(10080), status: "ok" },
  { id: "drv-5", name: "MEMS microphone on ESP32", kind: "esp32-mems", hardware: "ESP32-S3 + ICS-43434", version: "0.3.4", channels: 1, calibratedAt: null, status: "uncalibrated" },
  { id: "drv-6", name: "Ultrasound probe", kind: "ultrasound", hardware: "Generic 40 kHz probe", version: "0.2.0", channels: 1, calibratedAt: null, status: "fault" },
  { id: "drv-7", name: "WAV/FLAC file replay", kind: "wav-file", hardware: "Folder replay", version: "0.5.2", channels: 2, calibratedAt: null, status: "ok" },
];

export const EDGE_DEVICES: EdgeDevice[] = Array.from({ length: 12 }, (_, i) => ({
  id: `edge-${i + 1}`, plantId: "pl-north", name: `EDGE-${String(i + 1).padStart(2, "0")}`,
  firmware: i === 4 ? "2.3.1" : "2.4.0", agent: "viper-edge 0.5.2", status: i === 7 ? "offline" : "online",
  lastHeartbeatAt: ago(i === 7 ? 95 : 0.2 * (i + 1)), queueMb: i === 7 ? 412 : +(1.5 * (i % 4)).toFixed(1),
  drivers: [DRIVERS[i % 4].id, DRIVERS[(i + 3) % DRIVERS.length].id],
}));

export const LICENSE: License = {
  edition: "pro", holder: "Ferrovela Group", expiresAt: "2027-10-31T23:00:00Z", machinesLicensed: 60, machinesUsed: MACHINES.length,
  features: [
    { key: "Alerts and fusion", enabled: true }, { key: "Vision and cameras", enabled: true }, { key: "Acoustics and vibration", enabled: true },
    { key: "Models and shadow", enabled: true }, { key: "Group hub", enabled: true }, { key: "Signed audit export", enabled: true }, { key: "MCP server", enabled: false },
  ],
};
