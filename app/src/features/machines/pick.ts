import type { Alert, Machine, Model, Threshold } from "@/lib/api/types";

/** Lowest healthIndex wins; machines without an index sort last. */
export function worstMachine(machines: Machine[]): Machine | undefined {
  return [...machines].sort((a, b) => {
    if (a.healthIndex === null && b.healthIndex === null) return 0;
    if (a.healthIndex === null) return 1;
    if (b.healthIndex === null) return -1;
    return a.healthIndex - b.healthIndex;
  })[0];
}

export function matchesMachine(m: Machine, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return `${m.code} ${m.name}`.toLowerCase().includes(needle);
}

export function openAlertCount(alerts: Alert[], machineId: string): number {
  return alerts.filter((a) => a.machineId === machineId && a.status === "open").length;
}

export function evidenceFromAlerts(alerts: Alert[], machineId: string) {
  return alerts.filter((a) => a.machineId === machineId).flatMap((a) => a.evidence);
}

/** Loose match: "All machines" or any word from the kind appears in scope. */
export function modelFitsKind(model: Model, kind: string): boolean {
  const scope = model.scope.toLowerCase();
  if (scope.includes("all machines")) return true;
  return kind.toLowerCase().split(/\s+/).some((w) => w.length > 3 && scope.includes(w));
}

export function activeVersion(model: Model) {
  return model.versions.find((v) => v.status === "active");
}

export function shadowVersion(model: Model) {
  return model.versions.find((v) => v.status === "shadow");
}

export function hasLiveVersion(model: Model): boolean {
  return model.versions.some((v) => v.status === "active" || v.status === "shadow");
}

export function thresholdsForMachine(rows: Threshold[], machineId: string): Threshold[] {
  return rows.filter((t) => t.machineId === machineId);
}

export function degradationSentence(days: [number, number]): string {
  return `Would cross the warning limit in ${days[0]}–${days[1]} days (estimate)`;
}
