import type { AuditEvent, AuditObjectKind } from "@/lib/api/types";

export type AuditRange = "24h" | "7d" | "30d";
export type AuditFilter = { actor: string; kind: AuditObjectKind | ""; text: string; range: AuditRange };

export const SYSTEM_ACTOR = "system";
const RANGE_MS: Record<AuditRange, number> = { "24h": 86_400_000, "7d": 604_800_000, "30d": 2_592_000_000 };

/** Actor, object kind, free text over object and detail, and a time window ending at `now`. */
export function filterAudit(rows: AuditEvent[], f: AuditFilter, now: number): AuditEvent[] {
  const since = now - RANGE_MS[f.range];
  const text = f.text.trim().toLowerCase();
  return rows.filter((e) =>
    Date.parse(e.at) >= since
    && (!f.actor || (f.actor === SYSTEM_ACTOR ? e.actorId === null : e.actorId === f.actor))
    && (!f.kind || e.objectKind === f.kind)
    && (!text || `${e.object} ${e.detail}`.toLowerCase().includes(text)));
}
