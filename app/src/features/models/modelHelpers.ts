import type { Model, ModelStatus, ModelVersion } from "@/lib/api/types";
import type { Tone } from "@/ui/atoms";

export const modelStatusTone: Record<ModelStatus, Tone> = {
  active: "positive",
  shadow: "neutral",
  rejected: "negative",
  retired: "neutral",
};

export const versionOf = (model: Model, status: ModelStatus) =>
  model.versions.find((v) => v.status === status) ?? null;

export const lastDrift = (model: Model) => model.drift.at(-1) ?? 0;

export const isDrifting = (model: Model) => lastDrift(model) > model.driftThreshold;

export const fmtInterval = ([lo, hi]: [number, number]) => `${lo.toFixed(2)}–${hi.toFixed(2)}`;

export function registryCounts(models: Model[]) {
  const active = models.filter((m) => versionOf(m, "active")).length;
  const shadow = models.filter((m) => versionOf(m, "shadow")).length;
  const drifting = models.filter(isDrifting).length;
  return { active, shadow, drifting };
}

export function shadowVerdict(active: ModelVersion, candidate: ModelVersion) {
  const fewer = active.alertsWouldOpen - candidate.alertsWouldOpen;
  const sharper = candidate.precision[0] > active.precision[0];
  if (fewer > 0 && sharper) return `The candidate opens ${fewer} fewer alerts with higher precision.`;
  if (fewer > 0) return `The candidate opens ${fewer} fewer alerts on the same windows.`;
  if (fewer < 0) return `The candidate opens ${Math.abs(fewer)} more alerts than the active version.`;
  if (sharper) return "Same alert count, with higher precision on the candidate.";
  return "Compare the figures before you promote.";
}
