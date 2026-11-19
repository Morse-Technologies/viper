import type { Alert, AlertStatus, Modality } from "@/lib/api/types";

export type AlertFilter = "open" | "closed" | "all";

const OPEN: AlertStatus[] = ["open", "acknowledged"];
const CLOSED: AlertStatus[] = ["resolved", "rejected"];

export function matchesFilter(alert: Alert, filter: AlertFilter): boolean {
  if (filter === "all") return true;
  if (filter === "open") return OPEN.includes(alert.status);
  return CLOSED.includes(alert.status);
}

export function modalitiesOf(alert: Alert): Set<Modality> {
  return new Set([
    ...alert.contributions.map((c) => c.modality),
    ...alert.evidence.map((e) => e.modality),
  ]);
}

export const VISION_MODALITIES: Modality[] = ["camera", "gauge", "display"];
export const STAGGER_MS = 50;
export const CHART_HEIGHT = 220;
