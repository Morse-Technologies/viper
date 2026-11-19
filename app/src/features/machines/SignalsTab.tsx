"use client";
import { useState } from "react";
import { useSeries, useSignals } from "@/features/hooks";
import type { Range, Signal } from "@/lib/api/types";
import { EmptyState, LoadingRows, Segmented } from "@/ui/cells";
import { SignalChart } from "@/ui/organisms/SignalChart";
import { CHART_HEIGHT, RANGE_OPTIONS } from "./tabs";

export function SignalsTab({ machineId }: { machineId: string }) {
  const signals = useSignals(machineId);
  const [range, setRange] = useState<Range>("24h");
  if (signals.isPending) return <LoadingRows rows={4} pitch="h-40" />;
  if (!signals.data?.length) return <EmptyState>This machine has no signals yet.</EmptyState>;
  const syncKey = `machine-${machineId}-signals`;
  return (
    <div className="flex flex-col gap-4">
      <Segmented
        label="Range" value={range} onChange={setRange}
        options={RANGE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
      />
      <ul className="flex flex-col gap-5">
        {signals.data.map((s, i) => (
          <li key={s.id}>
            <SignalBlock signal={s} range={range} syncKey={syncKey} selected={i === 0} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function SignalBlock({
  signal, range, syncKey, selected,
}: {
  signal: Signal; range: Range; syncKey: string; selected: boolean;
}) {
  const series = useSeries(signal.id, range);
  return (
    <div>
      <p className="mb-2 text-body font-medium">{signal.name} ({signal.unit})</p>
      {series.data ? (
        <SignalChart
          series={series.data} unit={signal.unit} warn={signal.warn} alarm={signal.alarm}
          selected={selected} height={CHART_HEIGHT} syncKey={syncKey} label={signal.name}
        />
      ) : <LoadingRows rows={1} pitch="h-40" />}
    </div>
  );
}
