"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useChannels, useSources, useThresholds } from "@/features/hooks";
import type { Channel, Machine, Source, Threshold } from "@/lib/api/types";
import { fmtNum } from "@/lib/format";
import { sourceKindLabel } from "@/lib/labels";
import { Button, Input } from "@/ui/atoms";
import { Card, EmptyState, KeyValues, LoadingRows } from "@/ui/cells";
import { thresholdsForMachine } from "./pick";

type Draft = Record<string, { warn: number; alarm: number }>;

function draftFromRows(rows: Threshold[]): Draft {
  return Object.fromEntries(rows.map((r) => [r.signalId, { warn: r.warn, alarm: r.alarm }]));
}

export function ConfigTab({ machine }: { machine: Machine }) {
  const thresholds = useThresholds();
  const sources = useSources();
  const channels = useChannels(machine.id);
  const rows = thresholdsForMachine(thresholds.data ?? [], machine.id);
  const linked = (sources.data ?? []).filter((s) => s.machineIds.includes(machine.id));

  return (
    <div className="flex flex-col gap-5">
      {thresholds.isPending ? <LoadingRows rows={4} pitch="h-12" />
        : rows.length === 0 ? <EmptyState>No thresholds for this machine.</EmptyState>
        : <ThresholdEditor key={rows.map((r) => r.signalId).join("|")} rows={rows} />}
      <Card id="links-h" title="Linked sources" detail>
        {sources.isPending ? <LoadingRows rows={2} pitch="h-10" />
          : linked.length === 0 ? <EmptyState>No source points at this machine.</EmptyState>
          : <SourceList sources={linked} />}
      </Card>
      <Card id="pack-h" title="Pack and channels" detail>
        <KeyValues rows={[
          { k: "Pack", v: `${machine.pack}@${machine.packVersion}` },
          { k: "Kind", v: machine.kind },
        ]} />
        {channels.isPending ? <LoadingRows rows={2} pitch="h-10" />
          : <ChannelRates channels={channels.data ?? []} />}
      </Card>
      <p className="text-small text-muted">Changes are audited.</p>
    </div>
  );
}

function SourceList({ sources }: { sources: Source[] }) {
  return (
    <ul className="divide-y divide-rule">
      {sources.map((s) => (
        <li key={s.id} className="flex items-baseline justify-between gap-3 py-2 text-body">
          <span className="font-medium">{s.name}</span>
          <span className="text-muted">{sourceKindLabel[s.kind]}</span>
        </li>
      ))}
    </ul>
  );
}

function ChannelRates({ channels }: { channels: Channel[] }) {
  if (!channels.length) return <p className="mt-2 text-body text-muted">No channels.</p>;
  return (
    <ul className="mt-2 divide-y divide-rule">
      {channels.map((c) => (
        <li key={c.id} className="flex items-baseline justify-between gap-3 py-2 text-body">
          <span>{c.name}</span>
          <span className="text-muted num">{fmtNum(c.sampleRateHz)} Hz</span>
        </li>
      ))}
    </ul>
  );
}

function ThresholdEditor({ rows }: { rows: Threshold[] }) {
  const [draft, setDraft] = useState(() => draftFromRows(rows));
  const [saved, setSaved] = useState(() => draftFromRows(rows));

  const save = () => {
    const previous = saved;
    setSaved(draft);
    toast.success("Thresholds saved", {
      action: { label: "Undo", onClick: () => { setDraft(previous); setSaved(previous); } },
    });
  };

  return (
    <Card id="thresh-h" title="Thresholds" flush detail
      aside="Warn and alarm limits">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-body">
          <thead className="border-b border-rule text-small text-muted">
            <tr>
              <th className="px-4 py-2.5 font-medium">Signal</th>
              <th className="px-4 py-2.5 font-medium">Warn</th>
              <th className="px-4 py-2.5 font-medium">Alarm</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {rows.map((r) => (
              <ThresholdRow
                key={r.signalId} row={r} value={draft[r.signalId] ?? { warn: r.warn, alarm: r.alarm }}
                onChange={(next) => setDraft((d) => ({ ...d, [r.signalId]: next }))}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end border-t border-rule px-4 py-3">
        <Button variant="primary" onClick={save}>Save</Button>
      </div>
    </Card>
  );
}

function ThresholdRow({
  row, value, onChange,
}: {
  row: Threshold; value: { warn: number; alarm: number };
  onChange: (v: { warn: number; alarm: number }) => void;
}) {
  return (
    <tr>
      <td className="px-4 py-2.5">
        <span className="font-medium">{row.signal}</span>
        <span className="ml-1 text-muted">({row.unit})</span>
      </td>
      <td className="px-4 py-2.5">
        <Input
          type="number" className="w-24 num" aria-label={`Warn for ${row.signal}`}
          value={value.warn}
          onChange={(e) => onChange({ ...value, warn: Number(e.target.value) })}
        />
      </td>
      <td className="px-4 py-2.5">
        <Input
          type="number" className="w-24 num" aria-label={`Alarm for ${row.signal}`}
          value={value.alarm}
          onChange={(e) => onChange({ ...value, alarm: Number(e.target.value) })}
        />
      </td>
    </tr>
  );
}
