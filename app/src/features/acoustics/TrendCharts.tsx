"use client";
import { useSeries, useSignals } from "@/features/hooks";
import type { Id, Range, Signal } from "@/lib/api/types";
import { Skeleton } from "@/ui/atoms";
import { Card } from "@/ui/cells";
import { SignalChart } from "@/ui/organisms/SignalChart";

const VIB_NAME = "vib_rms_velocity";
const TEMP_NAME = "bearing_temp";

function TrendChart({ signal, range, selected }: { signal: Signal; range: Range; selected: boolean }) {
  const q = useSeries(signal.id, range);
  if (q.isPending || !q.data) return <Skeleton className="h-[220px] w-full rounded-control" />;
  return (
    <SignalChart
      series={q.data}
      unit={signal.unit}
      warn={signal.warn}
      alarm={signal.alarm}
      selected={selected}
      label={signal.name}
    />
  );
}

export function TrendCharts({ machineId, range }: { machineId: Id; range: Range }) {
  const signals = useSignals(machineId);
  const list = signals.data ?? [];
  const vib = list.find((s) => s.name === VIB_NAME);
  const temp = list.find((s) => s.name === TEMP_NAME);
  return (
    <Card id="trends-h" title="Trends" className="mt-6">
      {signals.isPending ? <Skeleton className="mb-4 h-[220px] w-full rounded-control" /> : (
        <div className="grid gap-5 pb-4 lg:grid-cols-2">
          <div className="flex flex-col gap-2">
            <h3 className="text-body font-medium">{vib ? `${vib.name} (${vib.unit})` : "RMS velocity"}</h3>
            {vib ? <TrendChart signal={vib} range={range} selected /> : <p className="text-body text-muted">No vibration RMS on this machine.</p>}
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-body font-medium">{temp ? `${temp.name} (${temp.unit})` : "Bearing temperature"}</h3>
            {temp ? <TrendChart signal={temp} range={range} selected={false} /> : <p className="text-body text-muted">No bearing temperature on this machine.</p>}
          </div>
        </div>
      )}
    </Card>
  );
}
