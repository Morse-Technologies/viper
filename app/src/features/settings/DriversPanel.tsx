"use client";
import { toast } from "sonner";
import { useDrivers } from "@/features/hooks";
import type { Driver } from "@/lib/api/types";
import { fmtDate, fmtNum } from "@/lib/format";
import { driverKindLabel, driverStatusLabel } from "@/lib/labels";
import { Button, Pill, type Tone } from "@/ui/atoms";
import { ErrorState, LoadingRows } from "@/ui/cells";

const STATUS_TONE: Record<Driver["status"], Tone> = {
  ok: "positive", uncalibrated: "warning", fault: "negative",
};

export function DriversPanel() {
  const { data, isPending, isError, refetch } = useDrivers();
  return (
    <div className="flex flex-col gap-4">
      <p className="text-body text-muted">
        One driver layer for every sound and vibration input: the edge agent normalises each into the same frame.
      </p>
      {isPending ? <LoadingRows rows={6} pitch="h-12" />
        : isError ? <ErrorState what="drivers" onRetry={() => refetch()} />
          : <DriversTable rows={data ?? []} />}
    </div>
  );
}

function DriversTable({ rows }: { rows: Driver[] }) {
  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <table className="w-full min-w-[720px] text-left text-body">
        <thead className="border-b border-rule text-small text-muted">
          <tr>
            <th className="px-4 py-2.5 font-medium">Name</th>
            <th className="px-4 py-2.5 font-medium">Kind</th>
            <th className="px-4 py-2.5 font-medium">Hardware</th>
            <th className="px-4 py-2.5 font-medium">Version</th>
            <th className="px-4 py-2.5 font-medium">Channels</th>
            <th className="px-4 py-2.5 font-medium">Calibration</th>
            <th className="px-4 py-2.5 font-medium"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {rows.map((d) => (
            <tr key={d.id}>
              <td className="px-4 py-3 font-medium">{d.name}</td>
              <td className="px-4 py-3">{driverKindLabel[d.kind]}</td>
              <td className="px-4 py-3 text-muted">{d.hardware}</td>
              <td className="px-4 py-3 num">{d.version}</td>
              <td className="px-4 py-3 num">{fmtNum(d.channels)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-col items-start gap-1">
                  <Pill tone={STATUS_TONE[d.status]}>{driverStatusLabel[d.status]}</Pill>
                  {d.calibratedAt && <span className="text-small text-muted">{fmtDate(d.calibratedAt)}</span>}
                </div>
              </td>
              <td className="px-4 py-3">
                <Button
                  variant="outline" size="sm"
                  onClick={() => toast.success(`Test capture started on ${d.name} (mock)`)}
                >
                  Run test capture
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
