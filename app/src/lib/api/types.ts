/**
 * The Viper API contract as the UI sees it (`/api/v1/...`). The mock layer implements it today; the HTTP
 * client will implement the same interface once the server exists, so screens never change.
 */

export type Id = string;
export type Iso = string;

export type Health = "healthy" | "watch" | "alarm" | "nodata" | "stopped";
export type Operating = "running" | "stopped" | "unknown";
export type Modality = "series" | "vibration" | "audio" | "camera" | "thermal" | "gauge" | "display";
export type Severity = "high" | "medium" | "low";
export type AlertStatus = "open" | "acknowledged" | "resolved" | "rejected";
export type Feedback = "correct" | "false" | "unsure";
export type Role = "viewer" | "operator" | "maintainer" | "admin";
export type LinkState = "online" | "degraded" | "offline";

export type Plant = {
  id: Id; code: string; name: string; city: string; timezone: string;
  link: LinkState; lastHeartbeatAt: Iso; lines: string[];
};

export type Machine = {
  id: Id; plantId: Id; code: string; name: string; line: string; kind: string;
  health: Health; healthIndex: number | null; healthTrend: number[];
  operating: Operating; modalities: Modality[]; lastAlertAt: Iso | null;
  rpm: number | null; pack: string; packVersion: string;
  degradation: { warnInDays: [number, number] } | null;
};

export type Signal = {
  id: Id; machineId: Id; name: string; unit: string; modality: Modality;
  warn: number | null; alarm: number | null; base: number;
};

/** One series over a window: aligned epoch seconds and values (null = no data or quality=bad). */
export type Series = { signalId: Id; agg: "raw" | "1m" | "5m" | "1h"; t: number[]; v: (number | null)[] };

export type Range = "1h" | "24h" | "7d" | "30d";

export type Evidence = { id: Id; modality: Modality; source: string; label: string; from: Iso; to: Iso | null };

export type Alert = {
  id: Id; plantId: Id; machineId: Id; severity: Severity; status: AlertStatus;
  title: string; summary: string; openedAt: Iso; rule: string; modelVersion: string | null;
  contributions: { modality: Modality; share: number }[];
  evidence: Evidence[]; feedback: Feedback | null; pinned: boolean;
};

export type Channel = { id: Id; machineId: Id; name: string; kind: "vibration" | "audio"; sampleRateHz: number; driverId: Id };

export type SpectrumMarker = { label: string; hz: number; attributed: boolean };
export type Spectrum = { channelId: Id; hz: number[]; amp: number[]; markers: SpectrumMarker[]; rpm: number };
/** Rows are time slices (oldest first), columns frequency bins, values 0..1. */
export type Spectrogram = { channelId: Id; rows: number[][]; maxHz: number; days: number };
export type Snippet = { id: Id; channelId: Id; at: Iso; seconds: number; passedVoiceFilter: boolean };

export type Roi = {
  id: Id; name: string; task: "gauge" | "display" | "anomaly" | "presence";
  /** Polygon in 0..1 frame coordinates. */
  points: [number, number][];
  reading: { value: number; unit: string; at: Iso } | null;
};

export type Camera = {
  id: Id; plantId: Id; machineId: Id; name: string; status: "ok" | "stale" | "offline";
  gateway: string; detector: string; personBlurred: boolean; lastFrameAt: Iso;
  referenceApproved: boolean; rois: Roi[]; anomalyScore: number;
};

export type ModelStatus = "active" | "shadow" | "rejected" | "retired";
export type ModelVersion = {
  version: string; status: ModelStatus; trainedAt: Iso; precision: [number, number]; recall: [number, number];
  alertsWouldOpen: number; agreement: number;
};
export type Model = {
  id: Id; name: string; task: string; modality: Modality; scope: string; plantId: Id;
  versions: ModelVersion[]; drift: number[]; driftThreshold: number; onnx: boolean;
};

export type LabelReason = "uncertainty" | "disagreement" | "novelty";
export type LabelTask = {
  id: Id; machineId: Id; modality: Modality; reason: LabelReason; why: string; createdAt: Iso;
  evidence: Evidence; suggested: string | null;
};
export type TaxonomyClass = { id: Id; name: string; key: number };

export type SourceKind = "folder" | "opcua" | "mqtt" | "api" | "camera" | "edge";
export type Source = {
  id: Id; plantId: Id; kind: SourceKind; name: string; status: "ok" | "lagging" | "quiet" | "quarantined";
  lagSeconds: number; machineIds: Id[]; quarantined: number;
};

export type DriverKind = "usb-audio" | "esp32-mems" | "daq-iepe" | "modbus" | "io-link" | "vendor-api" | "ultrasound" | "wav-file";
export type EdgeDevice = {
  id: Id; plantId: Id; name: string; firmware: string; agent: string; status: LinkState;
  lastHeartbeatAt: Iso; queueMb: number; drivers: Id[];
};
export type Driver = {
  id: Id; name: string; kind: DriverKind; hardware: string; version: string;
  channels: number; calibratedAt: Iso | null; status: "ok" | "uncalibrated" | "fault";
};

export type Threshold = { signalId: Id; machineId: Id; signal: string; unit: string; warn: number; alarm: number; source: "pack" | "manual" | "learned" };

export type User = { id: Id; name: string; email: string; role: Role; hue: number; totp: boolean; lastSeenAt: Iso | null };
export type Me = User & { plantId: Id; groupName: string };

export type License = {
  edition: "core" | "pro" | "enterprise"; holder: string; expiresAt: Iso;
  machinesLicensed: number; machinesUsed: number; features: { key: string; enabled: boolean }[];
};

export type Overview = {
  machinesWatched: number; alertsOpen: number; quietSources: number; activeModels: number;
  bySeverity: Record<Severity, number>; deviating: { line: string; score: number }[];
  edge: { live: number; total: number }; cameras: { ok: number; total: number };
  labelling: { tasks: number; byUncertainty: number }; shadowModels: number; ingestLagSeconds: number;
};

export type PlantSummary = Plant & { machines: number; inAlarm: number; open: Record<Severity, number> };

export type ViperApi = {
  me(): Promise<Me>;
  plants(): Promise<PlantSummary[]>;
  overview(plantId: Id): Promise<Overview>;
  machines(plantId?: Id): Promise<Machine[]>;
  machine(id: Id): Promise<Machine | null>;
  signals(machineId: Id): Promise<Signal[]>;
  allSignals(plantId: Id): Promise<Signal[]>;
  series(signalId: Id, range: Range): Promise<Series>;
  alerts(plantId?: Id): Promise<Alert[]>;
  alert(id: Id): Promise<Alert | null>;
  setAlertStatus(id: Id, status: AlertStatus): Promise<Alert>;
  sendFeedback(id: Id, feedback: Feedback): Promise<Alert>;
  channels(machineId: Id): Promise<Channel[]>;
  spectrum(channelId: Id): Promise<Spectrum>;
  spectrogram(channelId: Id): Promise<Spectrogram>;
  snippets(channelId: Id): Promise<Snippet[]>;
  cameras(plantId: Id): Promise<Camera[]>;
  models(plantId?: Id): Promise<Model[]>;
  labelTasks(plantId: Id): Promise<LabelTask[]>;
  taxonomy(): Promise<TaxonomyClass[]>;
  completeLabelTask(id: Id, classId: Id | null): Promise<void>;
  sources(plantId: Id): Promise<Source[]>;
  edgeDevices(plantId: Id): Promise<EdgeDevice[]>;
  drivers(): Promise<Driver[]>;
  thresholds(plantId: Id): Promise<Threshold[]>;
  users(): Promise<User[]>;
  license(): Promise<License>;
  login(email: string, password: string): Promise<{ needsTotp: true }>;
  verifyTotp(code: string): Promise<Me>;
};
