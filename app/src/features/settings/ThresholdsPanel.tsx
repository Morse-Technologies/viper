"use client";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import { useMachines, useThresholds } from "@/features/hooks";
import type { Threshold } from "@/lib/api/types";
import { Button, Input, Pill } from "@/ui/atoms";
import { ErrorState, LoadingRows } from "@/ui/cells";

const SOURCE_LABEL = { pack: "Pack", manual: "Manual", learned: "Learned" } as const;
type Draft = { warn: string; alarm: string };

export function ThresholdsPanel() {
  const { data, isPending, isError, refetch } = useThresholds();
  const { data: machines } = useMachines();
  const [filter, setFilter] = useState("");
  const [saved, setSaved] = useState<Record<string, { warn: number; alarm: number }>>({});
  const [edits, setEdits] = useState<Record<string, Draft>>({});

  const codeOf = useMemo(
    () => Object.fromEntries((machines ?? []).map((m) => [m.id, m.code])),
    [machines],
  );

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const list = data ?? [];
    if (!q) return list;
    return list.filter((t) => {
      const code = codeOf[t.machineId] ?? "";
      return t.signal.toLowerCase().includes(q) || code.toLowerCase().includes(q) || t.unit.toLowerCase().includes(q);
    });
  }, [data, filter, codeOf]);

  return (
    <div className="flex flex-col gap-4">
      <Input
        value={filter} onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter by machine, signal or unit…" aria-label="Filter thresholds"
      />
      {isPending ? <LoadingRows rows={6} pitch="h-12" />
        : isError ? <ErrorState what="thresholds" onRetry={() => refetch()} />
          : (
            <ThresholdsTable
              rows={rows} codeOf={codeOf} saved={saved} edits={edits}
              onEdit={setEdits} onSaved={setSaved}
            />
          )}
    </div>
  );
}

function ThresholdsTable({
  rows, codeOf, saved, edits, onEdit, onSaved,
}: {
  rows: Threshold[];
  codeOf: Record<string, string>;
  saved: Record<string, { warn: number; alarm: number }>;
  edits: Record<string, Draft>;
  onEdit: Dispatch<SetStateAction<Record<string, Draft>>>;
  onSaved: Dispatch<SetStateAction<Record<string, { warn: number; alarm: number }>>>;
}) {
  const current = (t: Threshold) => saved[t.signalId] ?? { warn: t.warn, alarm: t.alarm };
  const draft = (t: Threshold): Draft => {
    const c = current(t);
    return edits[t.signalId] ?? { warn: String(c.warn), alarm: String(c.alarm) };
  };
  const dirty = (t: Threshold) => {
    const c = current(t);
    const d = draft(t);
    return d.warn !== String(c.warn) || d.alarm !== String(c.alarm);
  };

  const save = (t: Threshold) => {
    const d = draft(t);
    const prev = current(t);
    const nextWarn = Number(d.warn);
    const nextAlarm = Number(d.alarm);
    if (!Number.isFinite(nextWarn) || !Number.isFinite(nextAlarm)) {
      toast.error("Warn and alarm must be numbers.");
      return;
    }
    onSaved((s) => ({ ...s, [t.signalId]: { warn: nextWarn, alarm: nextAlarm } }));
    onEdit((e) => { const n = { ...e }; delete n[t.signalId]; return n; });
    toast.success(`Thresholds saved for ${t.signal}`, {
      action: {
        label: "Undo",
        onClick: () => {
          onSaved((s) => ({ ...s, [t.signalId]: prev }));
          toast.message("Thresholds restored");
        },
      },
    });
  };

  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <table className="w-full min-w-[720px] text-left text-body">
        <thead className="border-b border-rule text-small text-muted">
          <tr>
            <th className="px-4 py-2.5 font-medium">Machine</th>
            <th className="px-4 py-2.5 font-medium">Signal</th>
            <th className="px-4 py-2.5 font-medium">Unit</th>
            <th className="px-4 py-2.5 font-medium">Warn</th>
            <th className="px-4 py-2.5 font-medium">Alarm</th>
            <th className="px-4 py-2.5 font-medium">Source</th>
            <th className="px-4 py-2.5 font-medium"><span className="sr-only">Save</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {rows.map((t) => {
            const d = draft(t);
            return (
              <tr key={t.signalId}>
                <td className="px-4 py-3 font-medium">{codeOf[t.machineId] ?? "—"}</td>
                <td className="px-4 py-3">{t.signal}</td>
                <td className="px-4 py-3 text-muted">{t.unit}</td>
                <td className="px-4 py-3">
                  <Input
                    className="h-8 w-24 num" value={d.warn} inputMode="decimal"
                    aria-label={`Warn for ${t.signal}`}
                    onChange={(e) => onEdit((ed) => ({ ...ed, [t.signalId]: { ...d, warn: e.target.value } }))}
                  />
                </td>
                <td className="px-4 py-3">
                  <Input
                    className="h-8 w-24 num" value={d.alarm} inputMode="decimal"
                    aria-label={`Alarm for ${t.signal}`}
                    onChange={(e) => onEdit((ed) => ({ ...ed, [t.signalId]: { ...d, alarm: e.target.value } }))}
                  />
                </td>
                <td className="px-4 py-3"><Pill tone="neutral">{SOURCE_LABEL[t.source]}</Pill></td>
                <td className="px-4 py-3">
                  <Button variant="outline" size="sm" disabled={!dirty(t)} onClick={() => save(t)}>Save</Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && <p className="px-4 py-6 text-body text-muted">No thresholds match.</p>}
    </div>
  );
}
