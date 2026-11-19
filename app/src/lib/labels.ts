import type {
  AlertStatus, DriverKind, Feedback, Health, LabelReason, LinkState, Modality, ModelStatus, Operating, Role, Severity, SourceKind,
} from "@/lib/api/types";

/** Words people read. No screen shows an internal key where a text exists here. No JSX. */

export const healthLabel: Record<Health, string> = {
  healthy: "Healthy", watch: "Watch", alarm: "Alarm", nodata: "No data", stopped: "Stopped",
};
export const operatingLabel: Record<Operating, string> = { running: "Running", stopped: "Stopped", unknown: "Unknown" };

export const modalityLabel: Record<Modality, string> = {
  series: "Series", vibration: "Vibration", audio: "Sound", camera: "Camera", thermal: "Thermal", gauge: "Gauge", display: "Display",
};

export const severityLabel: Record<Severity, string> = { high: "High", medium: "Medium", low: "Low" };
export const SEVERITY_ORDER: Severity[] = ["high", "medium", "low"];

export const alertStatusLabel: Record<AlertStatus, string> = {
  open: "Open", acknowledged: "Acknowledged", resolved: "Resolved", rejected: "False alarm",
};
export const feedbackLabel: Record<Feedback, string> = { correct: "Correct", false: "False alarm", unsure: "Not sure" };
export const ruleLabel: Record<string, string> = {
  fusion: "Fused evidence", threshold: "Threshold", model: "Model", vision: "Vision", "quiet-source": "Quiet source",
};

export const modelStatusLabel: Record<ModelStatus, string> = { active: "Active", shadow: "Shadow", rejected: "Rejected", retired: "Retired" };

export const labelReasonLabel: Record<LabelReason, string> = { uncertainty: "Uncertainty", disagreement: "Disagreement", novelty: "Novelty" };

export const sourceKindLabel: Record<SourceKind, string> = {
  folder: "Watched folder", opcua: "OPC UA", mqtt: "MQTT", api: "API", camera: "Camera gateway", edge: "Edge devices",
};
export const sourceStatusLabel = { ok: "Receiving", lagging: "Lagging", quiet: "Quiet", quarantined: "Quarantine" } as const;

export const driverKindLabel: Record<DriverKind, string> = {
  "usb-audio": "USB audio", "esp32-mems": "ESP32 MEMS", "daq-iepe": "IEPE via DAQ", modbus: "Modbus", "io-link": "IO-Link",
  "vendor-api": "Vendor API", ultrasound: "Ultrasound", "wav-file": "WAV/FLAC file",
};
export const driverStatusLabel = { ok: "Calibrated", uncalibrated: "Needs calibration", fault: "Fault" } as const;

export const linkLabel: Record<LinkState, string> = { online: "Online", degraded: "Degraded", offline: "Offline" };

export const roleInfo: Record<Role, { label: string; help: string }> = {
  viewer: { label: "Viewer", help: "Sees machines, signals and alerts. Changes nothing." },
  operator: { label: "Operator", help: "Acknowledges alerts, gives feedback and labels evidence." },
  maintainer: { label: "Maintainer", help: "Changes thresholds, channels and sources; promotes and reverts models." },
  admin: { label: "Administrator", help: "Manages people, retention, federation and the licence." },
};
