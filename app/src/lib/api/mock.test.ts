import { describe, expect, it } from "vitest";
import { mockApi } from "./mock";

describe("mock world", () => {
  it("has one group with three plants and about forty machines", async () => {
    const plants = await mockApi.plants();
    const machines = await mockApi.machines();
    expect(plants).toHaveLength(3);
    expect(machines.length).toBeGreaterThanOrEqual(38);
    expect(new Set(machines.map((m) => m.code)).size).toBe(machines.length);
  });

  it("points every alert at a machine of its own plant", async () => {
    const [alerts, machines] = await Promise.all([mockApi.alerts(), mockApi.machines()]);
    for (const a of alerts) expect(machines.find((m) => m.id === a.machineId)?.plantId).toBe(a.plantId);
  });

  it("splits every alert's contribution to 100%", async () => {
    for (const a of await mockApi.alerts()) expect(a.contributions.reduce((s, c) => s + c.share, 0)).toBe(100);
  });

  it("counts open alerts in the overview the same as the alert list", async () => {
    const [o, alerts] = await Promise.all([mockApi.overview("pl-north"), mockApi.alerts("pl-north")]);
    const open = alerts.filter((a) => a.status === "open" || a.status === "acknowledged").length;
    expect(o.alertsOpen).toBe(open);
    expect(o.bySeverity.high + o.bySeverity.medium + o.bySeverity.low).toBe(open);
  });

  it("returns the same series on every call", async () => {
    const [signal] = await mockApi.signals("north-ext-01");
    const a = await mockApi.series(signal.id, "24h");
    const b = await mockApi.series(signal.id, "24h");
    expect(a).toEqual(b);
    expect(a.t).toHaveLength(a.v.length);
  });

  it("leaves a gap at the end of a silent machine's series", async () => {
    const [signal] = await mockApi.signals("north-bmb-11");
    const s = await mockApi.series(signal.id, "24h");
    expect(s.v.at(-1)).toBeNull();
  });

  it("attributes BPFO on a machine under watch", async () => {
    const [ch] = await mockApi.channels("north-ext-01");
    const s = await mockApi.spectrum(ch.id);
    expect(s.markers.find((m) => m.attributed)?.label).toBe("BPFO");
  });

  it("keeps an acknowledged status after the write", async () => {
    const a = await mockApi.setAlertStatus("al-001", "acknowledged");
    expect(a.status).toBe("acknowledged");
    expect((await mockApi.alert("al-001"))?.status).toBe("acknowledged");
  });

  it("removes a completed labelling task from the queue", async () => {
    const before = await mockApi.labelTasks("pl-north");
    await mockApi.completeLabelTask(before[0].id, "cls-1");
    expect(await mockApi.labelTasks("pl-north")).toHaveLength(before.length - 1);
  });
});
