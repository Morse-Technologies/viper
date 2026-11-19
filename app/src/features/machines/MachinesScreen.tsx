"use client";
import { useMemo } from "react";
import { useMachines } from "@/features/hooks";
import { EmptyState, LoadingRows } from "@/ui/cells";
import { SplitLayout } from "@/ui/templates/ShellLayout";
import { MachineDetail } from "./MachineDetail";
import { MachineList } from "./MachineList";
import { worstMachine } from "./pick";

export function MachinesScreen({ machineId }: { machineId?: string }) {
  const query = useMachines();
  const selected = useMemo(() => {
    const list = query.data ?? [];
    if (machineId) return list.find((m) => m.id === machineId);
    return worstMachine(list);
  }, [query.data, machineId]);
  const selectedId = machineId ?? selected?.id;

  return (
    <SplitLayout
      list={
        <MachineList
          machines={query.data} selectedId={selectedId}
          pending={query.isPending} error={query.isError}
          onRetry={() => { void query.refetch(); }}
        />
      }
      detail={
        <>
          {!machineId && (
            <div className="p-6 md:hidden">
              <EmptyState>Pick a machine from the list to open its detail.</EmptyState>
            </div>
          )}
          <div className={!machineId ? "hidden h-full md:block" : "h-full"}>
            {query.isPending ? <div className="p-6"><LoadingRows rows={6} pitch="h-12" /></div>
              : selected ? <MachineDetail machine={selected} />
              : <div className="p-6"><EmptyState>No machines in this plant yet.</EmptyState></div>}
          </div>
        </>
      }
    />
  );
}
