import { describe, expect, it } from "vitest";
import { fmtHz } from "@/lib/format";
import { placeLabels } from "./spectrumLabels";

describe("spectrum marker labels", () => {
  it("never lets two labels in a row overlap", () => {
    const boxes = Array.from({ length: 30 }, (_, i) => ({ x: i * 7, width: 30, priority: i % 4 }));
    const rows = placeLabels(boxes, 0, 400, 3);
    for (let r = 0; r < 3; r++) {
      const xs = boxes.filter((_, i) => rows[i] === r).map((b) => b.x).sort((a, b) => a - b);
      for (let k = 1; k < xs.length; k++) expect(xs[k] - xs[k - 1]).toBeGreaterThanOrEqual(30);
    }
  });

  it("keeps the most important label when space runs out", () => {
    const boxes = [{ x: 100, width: 40, priority: 4 }, { x: 102, width: 40, priority: 0 }, { x: 104, width: 40, priority: 3 }];
    const rows = placeLabels(boxes, 0, 400, 1);
    expect(rows).toEqual([null, 0, null]);
  });

  it("never runs a line through a label placed below it", () => {
    const boxes = [{ x: 100, width: 40, priority: 0 }, { x: 120, width: 40, priority: 1 }];
    const rows = placeLabels(boxes, 0, 400, 3);
    // The second label cannot sit in row 0 beside the first, and its line would cut the first if it sat above it.
    expect(rows[0]).toBe(0);
    expect(rows[1]).toBe(1);
    expect(placeLabels([{ x: 120, width: 40, priority: 0 }, { x: 100, width: 40, priority: 1 }], 0, 400, 3)).toEqual([0, null]);
  });

  it("skips markers outside the zoomed window", () => {
    expect(placeLabels([{ x: -5, width: 20, priority: 0 }, { x: 500, width: 20, priority: 0 }], 0, 400, 2)).toEqual([null, null]);
  });

  it("formats hertz and kilohertz", () => {
    expect(fmtHz(88.3)).toBe("88.3 Hz");
    expect(fmtHz(2500)).toBe("2.5 kHz");
  });
});
