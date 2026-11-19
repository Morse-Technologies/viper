"use client";
import { Tag } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useMachines, usePlantSignals, useSeries } from "@/features/hooks";
import type { Id, Range, Signal } from "@/lib/api/types";
import { plural } from "@/lib/format";
import { Button } from "@/ui/atoms";
import { EmptyState, ErrorState, LoadingRows, PageHeader, Segmented } from "@/ui/cells";
import { SplitLayout } from "@/ui/templates/ShellLayout";
import { AGG_LABEL, DEFAULT_RANGE, isRange, MAX_SIGNALS, parseSignalIds, RANGE_OPTIONS } from "./agg";
import { defaultSignalIds, filterGroups, groupByMachine } from "./defaults";
import { ExplorerChart } from "./ExplorerChart";
import { LabelSheet } from "./LabelPicker";
import { SignalList } from "./SignalList";

function writeSignalsUrl(router: ReturnType<typeof useRouter>, selected: Id[], range: Range) {
  const p = new URLSearchParams();
  p.set("s", selected.join(","));
  p.set("r", range);
  router.replace(`/signals?${p}`, { scroll: false });
}

/** Explorer: pick up to 8 plant signals, shared cursor, label a span. */
export function SignalsScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const signals = usePlantSignals();
  const machines = useMachines("plant");
  const [query, setQuery] = useState("");
  const [labelling, setLabelling] = useState(false);

  const rangeParam = params.get("r");
  const range: Range = isRange(rangeParam) ? rangeParam : DEFAULT_RANGE;
  const fromUrl = parseSignalIds(params.get("s"));

  useEffect(() => {
    if (!signals.data || !machines.data) return;
    if (fromUrl !== null && isRange(rangeParam)) return;
    const ids = fromUrl ?? defaultSignalIds(signals.data, machines.data);
    writeSignalsUrl(router, ids, range);
  }, [signals.data, machines.data, fromUrl, range, rangeParam, router]);

  const selected = fromUrl ?? [];
  const byId = useMemo(() => new Map((signals.data ?? []).map((s) => [s.id, s])), [signals.data]);
  const codeOf = useMemo(() => new Map((machines.data ?? []).map((m) => [m.id, m.code])), [machines.data]);
  const groups = useMemo(() => {
    if (!signals.data || !machines.data) return [];
    return filterGroups(groupByMachine(signals.data, machines.data), query);
  }, [signals.data, machines.data, query]);

  const first = useSeries(selected[0] ?? null, range);
  const agg = first.data ? AGG_LABEL[first.data.agg] : "…";

  const toggle = (id: Id) => {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : selected.length < MAX_SIGNALS ? [...selected, id] : selected;
    writeSignalsUrl(router, next, range);
  };

  const setRange = (r: Range) => writeSignalsUrl(router, selected, r);
  const remove = (id: Id) => writeSignalsUrl(router, selected.filter((x) => x !== id), range);

  const pending = signals.isPending || machines.isPending;
  const failed = signals.isError || machines.isError;

  return (
    <>
      <SplitLayout
        listWidth="md:w-[300px]"
        list={
          pending ? <div className="px-5 pt-6"><LoadingRows rows={8} pitch="h-10" /></div>
            : failed ? <div className="p-5"><ErrorState what="signals" onRetry={() => { void signals.refetch(); void machines.refetch(); }} /></div>
            : <SignalList query={query} onQuery={setQuery} groups={groups} selected={selected} onToggle={toggle} />
        }
        detail={
          <div className="h-full overflow-y-auto md:h-[calc((100dvh-66px)/var(--content-zoom))]">
            <div className="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-8 md:py-7">
              <PageHeader
                title="Signals"
                subline={`${plural(selected.length, "signal")} · aggregation ${agg}`}
                actions={
                  <>
                    <Segmented label="Range" value={range} onChange={setRange} options={RANGE_OPTIONS} />
                    <Button variant="outline" onClick={() => toast("Export is audited. Not available with mock data.")}>
                      Export CSV
                    </Button>
                    <Button variant="outline" onClick={() => setLabelling(true)} disabled={selected.length === 0}>
                      <Tag />Label span
                    </Button>
                  </>
                }
              />
              <ChartStack selected={selected} byId={byId} codeOf={codeOf} range={range} onRemove={remove} />
            </div>
          </div>
        }
      />
      <LabelSheet open={labelling} onOpenChange={setLabelling} />
    </>
  );
}

function ChartStack({
  selected, byId, codeOf, range, onRemove,
}: {
  selected: Id[];
  byId: Map<Id, Signal>;
  codeOf: Map<Id, string>;
  range: Range;
  onRemove: (id: Id) => void;
}) {
  if (selected.length === 0) {
    return <div className="mt-8"><EmptyState>Pick signals on the left. Up to eight stack here with a shared cursor.</EmptyState></div>;
  }
  return (
    <div className="mt-6 flex flex-col gap-6">
      {selected.map((id, i) => {
        const signal = byId.get(id);
        if (!signal) return null;
        return (
          <ExplorerChart
            key={id}
            signal={signal}
            code={codeOf.get(signal.machineId) ?? "—"}
            range={range}
            selected={i === 0}
            onRemove={() => onRemove(id)}
          />
        );
      })}
    </div>
  );
}
