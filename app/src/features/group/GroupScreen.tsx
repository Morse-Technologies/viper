"use client";
import { useMemo, useState } from "react";
import { useAllModels, useAlerts, useMachines, useMe, usePlants } from "@/features/hooks";
import { fmtAgo, fmtNum, plural } from "@/lib/format";
import { Card, EmptyState, ErrorState, LoadingRows, PageHeader } from "@/ui/cells";
import { Canvas } from "@/ui/templates/ShellLayout";
import { GroupAlerts } from "./GroupAlerts";
import { PlantCards } from "./PlantCards";
import {
  activeModelsByPlant,
  defaultFocusId,
  degradedPlants,
  groupMachineTotal,
  groupOpenTotal,
} from "./groupHelpers";

function DegradedBanner({ plants }: { plants: ReturnType<typeof degradedPlants> }) {
  if (!plants.length) return null;
  const p = plants[0];
  return (
    <div
      role="status"
      className="mt-5 rounded-card border border-[var(--pill-warning-line)] bg-[var(--pill-warning-bg)] px-4 py-3 text-body text-[var(--pill-warning-ink)]"
    >
      {p.name} last synced {fmtAgo(p.lastHeartbeatAt)}. Its numbers may be behind.
    </div>
  );
}

function ActiveModelsList({ rows }: { rows: ReturnType<typeof activeModelsByPlant> }) {
  if (!rows.length) return <EmptyState>No active model versions across the group.</EmptyState>;
  return (
    <ul className="divide-y divide-rule">
      {rows.map((r) => (
        <li key={`${r.plantCode}-${r.modelName}`} className="flex items-baseline justify-between gap-3 py-2.5 text-body">
          <span>
            <span className="font-medium num">{r.plantCode}</span>
            <span className="text-muted"> · {r.modelName}</span>
          </span>
          <span className="num text-muted">{r.version}</span>
        </li>
      ))}
    </ul>
  );
}

export function GroupScreen() {
  const me = useMe();
  const plantsQ = usePlants();
  const alertsQ = useAlerts("group");
  const machinesQ = useMachines("group");
  const modelsQ = useAllModels();
  const [focusId, setFocusId] = useState<string | null>(null);
  const [scope, setScope] = useState<"focused" | "all">("focused");

  const plants = plantsQ.data;
  const focused = focusId ?? defaultFocusId(plants ?? []);
  const openN = groupOpenTotal(plants ?? []);
  const machineN = groupMachineTotal(plants ?? []);
  const activeRows = useMemo(
    () => activeModelsByPlant(plants ?? [], modelsQ.data ?? []),
    [plants, modelsQ.data],
  );

  const subline = me.data && plants
    ? `${me.data.groupName} · ${fmtNum(plants.length)} plants · ${fmtNum(machineN)} machines · ${plural(openN, "open alert")}`
    : "Multi-plant hub.";

  const pending = plantsQ.isPending || me.isPending;
  const error = plantsQ.isError;

  return (
    <Canvas>
      <PageHeader title="Group" subline={subline} />
      {pending ? (
        <div className="mt-6"><LoadingRows rows={4} pitch="h-28" /></div>
      ) : error || !plants ? (
        <div className="mt-6"><ErrorState what="plants" onRetry={() => plantsQ.refetch()} /></div>
      ) : (
        <>
          <DegradedBanner plants={degradedPlants(plants)} />
          <PlantCards plants={plants} focusedId={focused} onFocus={setFocusId} />
          <GroupAlerts
            alerts={alertsQ.data ?? []}
            plants={plants}
            machines={machinesQ.data ?? []}
            focusedId={focused}
            scope={scope}
            onScope={setScope}
          />
          <Card id="group-models-h" title="Active model versions" className="mt-5" aside="Per plant">
            {modelsQ.isPending ? <LoadingRows rows={4} pitch="h-10" /> : (
              <ActiveModelsList rows={activeRows} />
            )}
          </Card>
        </>
      )}
    </Canvas>
  );
}
