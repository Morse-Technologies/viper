"use client";
import { X } from "lucide-react";
import { useSeries } from "@/features/hooks";
import type { Range, Signal } from "@/lib/api/types";
import { Button, Skeleton } from "@/ui/atoms";
import { SignalChart } from "@/ui/organisms/SignalChart";
import { SYNC_KEY } from "./agg";

export function ExplorerChart({
  signal, code, range, selected, onRemove,
}: {
  signal: Signal; code: string; range: Range; selected: boolean; onRemove: () => void;
}) {
  const q = useSeries(signal.id, range);
  return (
    <article className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="min-w-0 truncate text-body font-medium">
          <span className="text-muted">{code}</span>
          <span className="text-muted"> · </span>
          {signal.name} ({signal.unit})
        </h3>
        <Button size="icon" variant="ghost" onClick={onRemove} aria-label={`Remove ${signal.name}`}>
          <X />
        </Button>
      </div>
      {q.isPending || !q.data ? <Skeleton className="h-[220px] w-full rounded-control" /> : (
        <SignalChart
          series={q.data}
          unit={signal.unit}
          warn={signal.warn}
          alarm={signal.alarm}
          selected={selected}
          syncKey={SYNC_KEY}
          label={signal.name}
        />
      )}
    </article>
  );
}
