import { describe, expect, it } from "vitest";
import { FOOTER, JUMPS, TITLES, navGroups } from "./nav";

describe("navigation", () => {
  const items = [...navGroups({ alerts: 3, labelling: 0 }).flat(), ...FOOTER];

  it("gives every screen a breadcrumb title and a G-letter jump", () => {
    const jumps = new Set(Object.values(JUMPS));
    for (const it of items) {
      expect(TITLES[it.href.slice(1)]).toBeTruthy();
      expect(jumps.has(it.href)).toBe(true);
    }
  });

  it("shows a count only when there is something to count", () => {
    expect(items.find((i) => i.href === "/alerts")?.count).toBe(3);
    expect(items.find((i) => i.href === "/labelling")?.count).toBeUndefined();
  });
});
