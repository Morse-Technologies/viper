import { describe, expect, it } from "vitest";
import { parseLayout, type Placed } from "./savedLayout";

const fallback: Placed[] = [{ uid: "w1", type: "kpi-alerts", size: "small" }];
const known = new Set(["kpi-alerts", "severity"]);

describe("saved dashboard layout", () => {
  it("falls back when nothing is saved or it cannot be read", () => {
    expect(parseLayout(null, known, fallback)).toBe(fallback);
    expect(parseLayout("{not json", known, fallback)).toBe(fallback);
  });

  it("keeps the saved order and sizes", () => {
    const saved: Placed[] = [{ uid: "a", type: "severity", size: "big" }, { uid: "b", type: "kpi-alerts", size: "small" }];
    expect(parseLayout(JSON.stringify(saved), known, fallback)).toEqual(saved);
  });

  it("drops widget types this version no longer has", () => {
    const saved = [{ uid: "a", type: "retired-widget", size: "small" }, { uid: "b", type: "severity", size: "medium" }];
    expect(parseLayout(JSON.stringify(saved), known, fallback)).toEqual([saved[1]]);
  });
});
