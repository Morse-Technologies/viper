import type { Id, Machine, Signal } from "@/lib/api/types";

const isWatchOrAlarm = (h: Machine["health"]) => h === "watch" || h === "alarm";

/** First machine on watch/alarm, then its first two signals. */
export function defaultSignalIds(signals: Signal[], machines: Machine[]): Id[] {
  const target = machines.find((m) => isWatchOrAlarm(m.health)) ?? machines[0];
  if (!target) return [];
  return signals.filter((s) => s.machineId === target.id).slice(0, 2).map((s) => s.id);
}

export function groupByMachine(signals: Signal[], machines: Machine[]) {
  const byId = new Map(machines.map((m) => [m.id, m]));
  const groups = new Map<Id, { code: string; signals: Signal[] }>();
  for (const s of signals) {
    const m = byId.get(s.machineId);
    if (!m) continue;
    const g = groups.get(m.id) ?? { code: m.code, signals: [] };
    g.signals.push(s);
    groups.set(m.id, g);
  }
  return [...groups.values()];
}

export function filterGroups(
  groups: { code: string; signals: Signal[] }[],
  query: string,
) {
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  return groups
    .map((g) => ({
      ...g,
      signals: g.signals.filter(
        (s) => s.name.toLowerCase().includes(q) || g.code.toLowerCase().includes(q),
      ),
    }))
    .filter((g) => g.signals.length > 0);
}
