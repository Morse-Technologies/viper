import type { LinkState, Model, PlantSummary } from "@/lib/api/types";
import type { Tone } from "@/ui/atoms";
import { SEVERITY_ORDER } from "@/lib/labels";

export const linkTone: Record<LinkState, Tone> = {
  online: "positive",
  degraded: "warning",
  offline: "negative",
};

export const openTotal = (p: PlantSummary) =>
  SEVERITY_ORDER.reduce((n, s) => n + p.open[s], 0);

export const groupOpenTotal = (plants: PlantSummary[]) =>
  plants.reduce((n, p) => n + openTotal(p), 0);

export const groupMachineTotal = (plants: PlantSummary[]) =>
  plants.reduce((n, p) => n + p.machines, 0);

/** Default focus: the plant with the most high alerts, then name. */
export function defaultFocusId(plants: PlantSummary[]) {
  if (!plants.length) return null;
  return [...plants].sort((a, b) => b.open.high - a.open.high || a.name.localeCompare(b.name))[0].id;
}

export function degradedPlants(plants: PlantSummary[]) {
  return plants.filter((p) => p.link !== "online");
}

export type ActivePlantModel = { plantCode: string; plantName: string; modelName: string; version: string };

export function activeModelsByPlant(plants: PlantSummary[], models: Model[]): ActivePlantModel[] {
  const out: ActivePlantModel[] = [];
  for (const p of plants) {
    for (const m of models.filter((x) => x.plantId === p.id)) {
      const active = m.versions.find((v) => v.status === "active");
      if (active) out.push({ plantCode: p.code, plantName: p.name, modelName: m.name, version: active.version });
    }
  }
  return out;
}
