import { ALERTS } from "./fixtures/alerts";
import { CAMERAS, DRIVERS, EDGE_DEVICES, LABEL_TASKS, LICENSE, MODELS, SOURCES, TAXONOMY } from "./fixtures/catalog";
import { CHANNELS, SIGNALS, seriesFor, snippetsFor, spectrogramFor, spectrumFor } from "./fixtures/signals";
import { GROUP_NAME, MACHINES, PLANTS, USERS } from "./fixtures/world";
import type { Alert, Id, Overview, PlantSummary, Severity, Threshold, ViperApi } from "./types";

/** A short pause so loading states show the way they will against the real server. */
const LATENCY_MS = 120;
const later = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(structuredClone(value)), LATENCY_MS));

const DEFAULT_PLANT = PLANTS[0].id;
const QUIET_LAG_SECONDS = 3600;
const DEVIATING_LINES = 4;

/** Writes change this in-memory copy only; a reload restores the snapshot. */
const alerts: Alert[] = structuredClone(ALERTS);
const doneTasks = new Set<Id>();

const inPlant = <T extends { plantId: Id }>(rows: T[], plantId?: Id) => (plantId ? rows.filter((r) => r.plantId === plantId) : rows);
const openIn = (plantId?: Id) => inPlant(alerts, plantId).filter((a) => a.status === "open" || a.status === "acknowledged");

function countBySeverity(rows: Alert[]): Record<Severity, number> {
  return { high: rows.filter((a) => a.severity === "high").length, medium: rows.filter((a) => a.severity === "medium").length, low: rows.filter((a) => a.severity === "low").length };
}

/** Lines ranked by how far their machines are from healthy (1 - index/100, averaged). */
function deviating(plantId: Id): Overview["deviating"] {
  const plant = PLANTS.find((p) => p.id === plantId)!;
  return plant.lines.map((line) => {
    const scored = MACHINES.filter((m) => m.plantId === plantId && m.line === line && m.healthIndex !== null);
    const score = scored.reduce((s, m) => s + (1 - m.healthIndex! / 100), 0) / Math.max(1, scored.length);
    return { line, score: +score.toFixed(2) };
  }).sort((a, b) => b.score - a.score).slice(0, DEVIATING_LINES);
}

function overview(plantId: Id): Overview {
  const edge = EDGE_DEVICES.filter((d) => d.plantId === plantId);
  const cams = inPlant(CAMERAS, plantId);
  const tasks = LABEL_TASKS.filter((t) => !doneTasks.has(t.id));
  const models = MODELS.filter((m) => m.plantId === plantId);
  return {
    machinesWatched: inPlant(MACHINES, plantId).length, alertsOpen: openIn(plantId).length,
    quietSources: inPlant(SOURCES, plantId).filter((s) => s.lagSeconds > QUIET_LAG_SECONDS).length,
    activeModels: models.filter((m) => m.versions.some((v) => v.status === "active")).length,
    bySeverity: countBySeverity(openIn(plantId)), deviating: deviating(plantId),
    edge: { live: edge.filter((d) => d.status === "online").length, total: edge.length },
    cameras: { ok: cams.filter((c) => c.status === "ok").length, total: cams.length },
    labelling: { tasks: tasks.length, byUncertainty: tasks.filter((t) => t.reason === "uncertainty").length },
    shadowModels: models.filter((m) => m.versions.some((v) => v.status === "shadow")).length,
    ingestLagSeconds: Math.max(...inPlant(SOURCES, plantId).filter((s) => s.status !== "quiet").map((s) => s.lagSeconds), 0),
  };
}

const plantSummaries = (): PlantSummary[] => PLANTS.map((p) => ({
  ...p, machines: inPlant(MACHINES, p.id).length,
  inAlarm: inPlant(MACHINES, p.id).filter((m) => m.health === "alarm").length, open: countBySeverity(openIn(p.id)),
}));

function thresholds(plantId: Id): Threshold[] {
  const ids = new Set(inPlant(MACHINES, plantId).map((m) => m.id));
  return SIGNALS.filter((s) => ids.has(s.machineId) && s.warn !== null && s.alarm !== null).map((s, i) => ({
    signalId: s.id, machineId: s.machineId, signal: s.name, unit: s.unit, warn: s.warn!, alarm: s.alarm!,
    source: (["pack", "manual", "learned"] as const)[i % 3],
  }));
}

function updateAlert(id: Id, change: Partial<Alert>) {
  const a = alerts.find((x) => x.id === id);
  if (!a) return Promise.reject(new Error("Alert not found"));
  Object.assign(a, change);
  return later(a);
}

const ME = { ...USERS[0], plantId: DEFAULT_PLANT, groupName: GROUP_NAME };

export const mockApi: ViperApi = {
  me: () => later(ME),
  plants: () => later(plantSummaries()),
  overview: (plantId) => later(overview(plantId)),
  machines: (plantId) => later(inPlant(MACHINES, plantId)),
  machine: (id) => later(MACHINES.find((m) => m.id === id) ?? null),
  signals: (machineId) => later(SIGNALS.filter((s) => s.machineId === machineId)),
  allSignals: (plantId) => later(SIGNALS.filter((s) => MACHINES.find((m) => m.id === s.machineId)?.plantId === plantId)),
  series: (signalId, range) => later(seriesFor(SIGNALS.find((s) => s.id === signalId)!, range)),
  alerts: (plantId) => later(inPlant(alerts, plantId)),
  alert: (id) => later(alerts.find((a) => a.id === id) ?? null),
  setAlertStatus: (id, status) => updateAlert(id, { status }),
  sendFeedback: (id, feedback) => updateAlert(id, { feedback }),
  channels: (machineId) => later(CHANNELS.filter((c) => c.machineId === machineId)),
  spectrum: (channelId) => later(spectrumFor(channelId)),
  spectrogram: (channelId) => later(spectrogramFor(channelId)),
  snippets: (channelId) => later(snippetsFor(channelId)),
  cameras: (plantId) => later(inPlant(CAMERAS, plantId)),
  models: (plantId) => later(inPlant(MODELS, plantId)),
  labelTasks: (plantId) => later(LABEL_TASKS.filter((t) => !doneTasks.has(t.id) && MACHINES.find((m) => m.id === t.machineId)?.plantId === plantId)),
  taxonomy: () => later(TAXONOMY),
  completeLabelTask: (id) => { doneTasks.add(id); return later(undefined); },
  sources: (plantId) => later(inPlant(SOURCES, plantId)),
  edgeDevices: (plantId) => later(inPlant(EDGE_DEVICES, plantId)),
  drivers: () => later(DRIVERS),
  thresholds: (plantId) => later(thresholds(plantId)),
  users: () => later(USERS),
  license: () => later(LICENSE),
  login: () => later({ needsTotp: true as const }),
  verifyTotp: () => later(ME),
};
