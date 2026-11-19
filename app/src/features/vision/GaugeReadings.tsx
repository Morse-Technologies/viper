"use client";
import type { Camera, Machine } from "@/lib/api/types";
import { fmtAgo, fmtNum } from "@/lib/format";
import { Card } from "@/ui/cells";
import { ROI_TASK_LABEL } from "./constants";

type GaugeRow = {
  id: string;
  cameraName: string;
  machineCode: string;
  roiName: string;
  task: string;
  value: string;
};

function collectGaugeRows(cameras: Camera[], byId: Map<string, Machine>): GaugeRow[] {
  const rows: GaugeRow[] = [];
  for (const cam of cameras) {
    for (const roi of cam.rois) {
      if (roi.task !== "gauge" && roi.task !== "display") continue;
      const reading = roi.reading
        ? `${fmtNum(roi.reading.value)} ${roi.reading.unit} · ${fmtAgo(roi.reading.at)}`
        : "—";
      rows.push({
        id: roi.id,
        cameraName: cam.name,
        machineCode: byId.get(cam.machineId)?.code ?? "—",
        roiName: roi.name,
        task: ROI_TASK_LABEL[roi.task],
        value: reading,
      });
    }
  }
  return rows;
}

export function GaugeReadings({ cameras, machines }: { cameras: Camera[]; machines: Machine[] }) {
  const byId = new Map(machines.map((m) => [m.id, m]));
  const rows = collectGaugeRows(cameras, byId);
  return (
    <Card id="gauge-readings" title="Gauge readings" aside={`${rows.length} ROI`} className="mt-6">
      {rows.length === 0 ? (
        <p className="py-3 text-body text-muted">No gauge or display ROIs on these cameras.</p>
      ) : (
        <ul className="divide-y divide-rule">
          {rows.map((r) => (
            <li key={r.id} className="flex items-baseline justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-body font-medium">{r.roiName}</p>
                <p className="text-small text-muted">{r.machineCode} · {r.cameraName} · {r.task}</p>
              </div>
              <span className="shrink-0 text-body num">{r.value}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
