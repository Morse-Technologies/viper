import { describe, expect, it } from "vitest";
import { kurtogram, testCapture } from "@/lib/api/fixtures/commissioning";
import { STEPS, canAdvance, emptyDraft, faultFrequencies } from "./wizard";

const ready = { ...emptyDraft("north-ext-01", 1480), edgeId: "edge-1", driverId: "drv-1" };

describe("commissioning wizard", () => {
  it("has the eight steps of the spec", () => expect(STEPS).toHaveLength(8));

  it("asks for machine, device and driver before anything else", () => {
    expect(canAdvance(0, emptyDraft(), null)).toBe(false);
    expect(canAdvance(0, ready, null)).toBe(true);
  });

  it("needs a speed when the speed is fixed, and teeth for a gear", () => {
    expect(canAdvance(4, { ...ready, rpm: null }, null)).toBe(false);
    expect(canAdvance(4, { ...ready, rpm: null, speed: "tacho" }, null)).toBe(true);
    expect(canAdvance(3, { ...ready, component: "gear", teeth: null }, null)).toBe(false);
  });

  it("cuts the test capture at the mounting's band and passes on a stud", () => {
    const c = testCapture(ready);
    expect(c.spectrum.hz.at(-1)).toBe(5000);
    expect(c.spectrum.hz[1] - c.spectrum.hz[0]).toBe(1);
    expect(canAdvance(5, ready, c)).toBe(true);
    expect(testCapture({ ...ready, mounting: "magnet" }).spectrum.hz.at(-1)).toBe(2000);
  });

  it("suggests the envelope band around the structural resonance", () => {
    const k = kurtogram(ready);
    expect(k.levels.map((l) => l.length)).toEqual([1, 2, 4, 8, 16, 32]);
    expect(k.best.from).toBeLessThan(2850);
    expect(k.best.to).toBeGreaterThan(2850);
    expect(canAdvance(6, { ...ready, band: { from: k.best.from, to: k.best.to } }, null)).toBe(true);
  });

  it("works out the bearing frequencies from the speed", () => {
    const f = faultFrequencies(1480, { model: "6309", kind: "", bpfo: 3.58, bpfi: 5.42, bsf: 2.36, ftf: 0.4 }, null);
    expect(f.find((x) => x.label === "BPFO")?.hz).toBeCloseTo(88.3, 1);
  });
});
