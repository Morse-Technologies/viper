"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Alert } from "@/lib/api/types";
import { useAlerts, useMachine, useMachines } from "@/features/hooks";
import { SEVERITY_ORDER, severityLabel } from "@/lib/labels";
import { EmptyState, ErrorState, LoadingRows, Segmented, SeverityGlyph } from "@/ui/cells";
import { SplitLayout } from "@/ui/templates/ShellLayout";
import { AlertDetail } from "./AlertDetail";
import { AlertRow } from "./AlertRow";
import { matchesFilter, type AlertFilter } from "./filter";

const EMPTY: Record<AlertFilter, string> = {
  open: "Nothing open. You're clear for now.",
  closed: "No closed alerts in this plant.",
  all: "No alerts yet for this plant.",
};

const LIST_HEIGHT = "md:h-[calc((100dvh-66px)/var(--content-zoom)-104px)]";
const DETAIL_HEIGHT = "md:h-[calc((100dvh-66px)/var(--content-zoom))]";

export function AlertsScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const { data, isPending, isError, refetch } = useAlerts();
  const machines = useMachines();
  const [filter, setFilter] = useState<AlertFilter>("open");
  const selectedId = params.get("id");

  const codeById = useMemo(
    () => new Map((machines.data ?? []).map((m) => [m.id, m.code])),
    [machines.data],
  );

  const list = useMemo(
    () => (data ?? []).filter((a) => matchesFilter(a, filter)),
    [data, filter],
  );

  const counts = useMemo(() => ({
    open: (data ?? []).filter((a) => matchesFilter(a, "open")).length,
    closed: (data ?? []).filter((a) => matchesFilter(a, "closed")).length,
    all: data?.length ?? 0,
  }), [data]);

  const selected = pickSelected(data, selectedId, list);

  useEffect(() => {
    if (!selected || selected.id === selectedId) return;
    router.replace(`/alerts?id=${selected.id}`, { scroll: false });
  }, [selected, selectedId, router]);

  const select = (id: string) => {
    router.replace(`/alerts?id=${id}`, { scroll: false });
  };

  const detail = selected ? <AlertDetailPane alert={selected} /> : null;

  return (
    <SplitLayout
      list={
        <>
          <div className="flex flex-col gap-3 border-b border-border px-6 pt-6 pb-4">
            <h1 className="text-title font-medium">Alerts</h1>
            <Segmented
              label="Show"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "open", label: "Open", count: counts.open },
                { value: "closed", label: "Closed", count: counts.closed },
                { value: "all", label: "All", count: counts.all },
              ]}
            />
          </div>
          <div className={`min-h-0 flex-1 overflow-y-auto ${LIST_HEIGHT}`}>
            {isPending ? (
              <div className="px-6"><LoadingRows rows={6} pitch="h-16" /></div>
            ) : isError ? (
              <div className="p-6"><ErrorState what="alerts" onRetry={() => refetch()} /></div>
            ) : list.length === 0 ? (
              <div className="p-6"><EmptyState>{EMPTY[filter]}</EmptyState></div>
            ) : (
              SEVERITY_ORDER.map((sev) => {
                const rows = list.filter((a) => a.severity === sev);
                if (!rows.length) return null;
                return (
                  <section key={sev} aria-label={`${severityLabel[sev]} severity`}>
                    <h2 className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-active/60 px-6 py-2">
                      <SeverityGlyph severity={sev} />
                      <span className="text-small font-normal text-muted num">{rows.length}</span>
                    </h2>
                    <ul className="divide-y divide-rule">
                      {rows.map((a, i) => (
                        <AlertRow
                          key={a.id}
                          alert={a}
                          code={codeById.get(a.machineId) ?? "—"}
                          selected={a.id === selected?.id}
                          index={i}
                          onSelect={() => select(a.id)}
                        />
                      ))}
                    </ul>
                  </section>
                );
              })
            )}
          </div>
        </>
      }
      detail={
        <div className={`overflow-y-auto ${DETAIL_HEIGHT}`}>
          {isPending ? null : isError ? null : detail}
        </div>
      }
    />
  );
}

function pickSelected(data: Alert[] | undefined, id: string | null, list: Alert[]): Alert | undefined {
  if (!data?.length) return undefined;
  const fromUrl = id ? data.find((a) => a.id === id) : undefined;
  if (fromUrl) return fromUrl;
  return data.find((a) => a.status === "open") ?? list[0] ?? data[0];
}

function AlertDetailPane({ alert }: { alert: Alert }) {
  const machine = useMachine(alert.machineId);
  if (machine.isPending) {
    return <div className="px-8 py-6"><LoadingRows rows={4} pitch="h-14" /></div>;
  }
  if (machine.isError || !machine.data) {
    return <div className="p-8"><ErrorState what="machine" onRetry={() => machine.refetch()} /></div>;
  }
  return <AlertDetail key={alert.id} alert={alert} machine={machine.data} />;
}
