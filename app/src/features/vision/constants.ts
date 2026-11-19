import type { Camera } from "@/lib/api/types";
import type { Tone } from "@/ui/atoms";

export const ANOMALY_ATTENTION = 0.15;

export const CAMERA_STATUS_LABEL: Record<Camera["status"], string> = {
  ok: "Sending",
  stale: "Stale",
  offline: "Offline",
};

export const CAMERA_STATUS_TONE: Record<Camera["status"], Tone> = {
  ok: "positive",
  stale: "warning",
  offline: "negative",
};

export const ROI_TASK_LABEL: Record<Camera["rois"][number]["task"], string> = {
  gauge: "Gauge",
  display: "Display",
  anomaly: "Anomaly",
  presence: "Presence",
};

export function needsAttention(c: Camera): boolean {
  return c.status !== "ok" || c.anomalyScore >= ANOMALY_ATTENTION;
}
