import { describe, expect, it } from "vitest";
import { AUDIT, verifyChain } from "@/lib/api/fixtures/audit";
import { MOCK_NOW } from "@/lib/clock";
import { SYSTEM_ACTOR, filterAudit } from "./filter";

const north = AUDIT.filter((e) => e.plantId === "pl-north");
const all = { actor: "", kind: "", text: "", range: "30d" } as const;

describe("audit", () => {
  it("chains every entry to the one before and seals the old ones", () => {
    const chain = verifyChain(north);
    expect(chain.ok).toBe(true);
    expect(chain.checked).toBe(north.length);
    expect(chain.pending).toBeGreaterThan(0);
    expect(chain.pending).toBeLessThan(north.length);
  });

  it("finds a tampered entry", () => {
    const tampered = north.map((e, i) => (i === 10 ? { ...e, prevHash: "0".repeat(16) } : e));
    expect(verifyChain(tampered)).toMatchObject({ ok: false, brokenAt: north[10].seq });
  });

  it("filters by window, actor and text", () => {
    expect(filterAudit(north, all, MOCK_NOW)).toHaveLength(north.length);
    const day = filterAudit(north, { ...all, range: "24h" }, MOCK_NOW);
    expect(day.length).toBeLessThan(north.length);
    expect(filterAudit(north, { ...all, actor: SYSTEM_ACTOR }, MOCK_NOW).every((e) => e.actorId === null)).toBe(true);
    expect(filterAudit(north, { ...all, text: "zzz-no-match" }, MOCK_NOW)).toEqual([]);
  });
});
