import { MOCK_NOW } from "@/lib/clock";
import { hash, seeded } from "../random";
import type { AuditAction, AuditChain, AuditEvent, AuditObjectKind, Id } from "../types";
import { ALERTS } from "./alerts";
import { CAMERAS, MODELS, SOURCES } from "./catalog";
import { MACHINES, PLANTS, USERS } from "./world";

const MIN = 60_000;
const ENTRIES = 96;
const SPAN_DAYS = 14;
/** The daily anchor seals the chain at 22:00 Madrid (21:00 UTC); later entries wait for the next one. */
export const ANCHOR_AT = "2026-11-18T21:00:00.000Z";

/** A 16-hex digest built from two FNV passes; enough to look and behave like a chain in the mock. */
export const digest = (s: string) => hash(s).toString(16).padStart(8, "0") + hash(`${s}#`).toString(16).padStart(8, "0");

type Template = { action: AuditAction; kind: AuditObjectKind; weight: number; who: "any" | "maintainer" | "admin" | "system"; make: (r: () => number) => { object: string; detail: string } };

const pick = <T,>(r: () => number, rows: T[]) => rows[Math.floor(r() * rows.length)];
const north = MACHINES.filter((m) => m.plantId === "pl-north");

const TEMPLATES: Template[] = [
  { action: "auth.login", kind: "session", weight: 6, who: "any", make: () => ({ object: "Session", detail: "Signed in with password and TOTP" }) },
  { action: "alert.acknowledge", kind: "alert", weight: 5, who: "any", make: (r) => { const a = pick(r, ALERTS); return { object: a.title, detail: "Acknowledged" }; } },
  { action: "alert.resolve", kind: "alert", weight: 3, who: "maintainer", make: (r) => { const a = pick(r, ALERTS); return { object: a.title, detail: "Resolved: bearing replaced" }; } },
  { action: "alert.feedback", kind: "alert", weight: 4, who: "any", make: (r) => { const a = pick(r, ALERTS); return { object: a.title, detail: pick(r, ["Feedback: correct", "Feedback: false alarm", "Feedback: not sure"]) }; } },
  { action: "threshold.change", kind: "threshold", weight: 3, who: "maintainer", make: (r) => { const m = pick(r, north); const w = (4 + r() * 2).toFixed(1); return { object: `${m.code} · vib_rms_velocity`, detail: `Warning 4.5 → ${w} mm/s` }; } },
  { action: "model.promote", kind: "model", weight: 1, who: "maintainer", make: (r) => { const m = pick(r, MODELS); return { object: m.name, detail: "Shadow version promoted to active (TOTP re-checked)" }; } },
  { action: "model.rollback", kind: "model", weight: 0.5, who: "maintainer", make: (r) => { const m = pick(r, MODELS); return { object: m.name, detail: "Rolled back to the previous active version" }; } },
  { action: "source.add", kind: "source", weight: 1, who: "admin", make: (r) => { const m = pick(r, north); return { object: `${m.code} · MQTT energy meter`, detail: "Source added and bound to the machine" }; } },
  { action: "source.quarantine", kind: "source", weight: 1.5, who: "system", make: (r) => { const s = pick(r, SOURCES); return { object: s.name, detail: `${1 + Math.floor(r() * 9)} rows quarantined: unit mismatch` }; } },
  { action: "user.invite", kind: "user", weight: 0.5, who: "admin", make: (r) => ({ object: pick(r, USERS).email, detail: "Invited as operator" }) },
  { action: "user.role", kind: "user", weight: 0.5, who: "admin", make: (r) => ({ object: pick(r, USERS).name, detail: "Role operator → maintainer" }) },
  { action: "media.live", kind: "camera", weight: 2, who: "maintainer", make: (r) => { const c = pick(r, CAMERAS); return { object: c.name, detail: `Watched the blurred live view for ${2 + Math.floor(r() * 9)} min` }; } },
  { action: "roi.approve", kind: "camera", weight: 0.7, who: "maintainer", make: (r) => { const c = pick(r, CAMERAS); return { object: `${c.name} · ROI`, detail: "Reference frame approved" }; } },
  { action: "baseline.start", kind: "machine", weight: 0.8, who: "maintainer", make: (r) => { const m = pick(r, north); return { object: `${m.code} · DE-axial`, detail: "Commissioned; 7-day baseline started" }; } },
  { action: "auth.totp_reset", kind: "user", weight: 0.3, who: "system", make: (r) => ({ object: pick(r, USERS).name, detail: "TOTP reset from the CLI (viper user reset-totp)" }) },
  { action: "audit.export", kind: "audit", weight: 0.4, who: "admin", make: () => ({ object: "Audit log", detail: "Signed export of 30 days" }) },
];

const TOTAL_WEIGHT = TEMPLATES.reduce((s, t) => s + t.weight, 0);
function weighted(r: () => number): Template {
  let x = r() * TOTAL_WEIGHT;
  for (const t of TEMPLATES) { x -= t.weight; if (x <= 0) return t; }
  return TEMPLATES[0];
}

function actorFor(who: Template["who"], r: () => number) {
  if (who === "system") return null;
  const pool = USERS.filter((u) => u.totp && (who === "any" ? u.role !== "viewer" : who === "admin" ? u.role === "admin" : u.role === "maintainer" || u.role === "admin"));
  return pick(r, pool);
}

/** Ninety-six entries over two weeks for North Plant, oldest first, each chained to the one before. */
function build(plantId: Id): AuditEvent[] {
  const r = seeded(hash(`audit-${plantId}`));
  const start = MOCK_NOW - SPAN_DAYS * 1440 * MIN;
  const times = Array.from({ length: ENTRIES }, () => start + r() * (MOCK_NOW - start - 5 * MIN)).sort((a, b) => a - b);
  let prev = digest(`genesis-${plantId}`);
  return times.map((t, i) => {
    const tpl = weighted(r);
    const who = actorFor(tpl.who, r);
    const { object, detail } = tpl.make(r);
    const at = new Date(Math.round(t / MIN) * MIN).toISOString();
    const body = { seq: i + 1, at, actor: who?.id ?? "system", action: tpl.action, object, detail };
    const h = digest(prev + JSON.stringify(body));
    const e: AuditEvent = {
      id: `aud-${plantId}-${i + 1}`, seq: i + 1, plantId, at, actorId: who?.id ?? null, actor: who?.name ?? "Viper (system)",
      action: tpl.action, objectKind: tpl.kind, object, detail,
      ip: who ? `10.20.${(hash(who.id) % 40) + 1}.${(hash(who.id + "ip") % 200) + 20}` : "127.0.0.1",
      prevHash: prev, hash: h, anchored: at <= ANCHOR_AT,
    };
    prev = h;
    return e;
  });
}

export const AUDIT: AuditEvent[] = PLANTS.flatMap((p) => build(p.id));

/** Walks the chain: every entry must point at the previous digest. */
export function verifyChain(rows: AuditEvent[]): AuditChain {
  const sorted = [...rows].sort((a, b) => a.seq - b.seq);
  let brokenAt: number | null = null;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].prevHash !== sorted[i - 1].hash) { brokenAt = sorted[i].seq; break; }
  }
  const sealed = sorted.filter((e) => e.anchored);
  return {
    ok: brokenAt === null, checked: sorted.length, anchorAt: ANCHOR_AT,
    anchorHash: sealed.at(-1)?.hash ?? "", pending: sorted.length - sealed.length, brokenAt,
  };
}
