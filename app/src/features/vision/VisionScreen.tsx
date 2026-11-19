"use client";
import { useMemo, useState } from "react";
import { useCameras, useMachines } from "@/features/hooks";
import { plural } from "@/lib/format";
import type { Camera } from "@/lib/api/types";
import { EmptyState, ErrorState, LoadingRows, PageHeader, Segmented, Sheet } from "@/ui/cells";
import { Canvas } from "@/ui/templates/ShellLayout";
import { CameraCard } from "./CameraCard";
import { CameraDetail } from "./CameraDetail";
import { GaugeReadings } from "./GaugeReadings";
import { needsAttention } from "./constants";

type Filter = "all" | "attention";

function visionSubline(cameras: Camera[]): string {
  const sending = cameras.filter((c) => c.status === "ok").length;
  return `${plural(cameras.length, "camera")} · ${plural(sending, "sending frame", "sending frames")} · people are blurred at the edge before Viper sees a frame.`;
}

function filterCameras(cameras: Camera[], filter: Filter): Camera[] {
  return filter === "all" ? cameras : cameras.filter(needsAttention);
}

export function VisionScreen() {
  const cams = useCameras();
  const machines = useMachines("plant");
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useMemo(() => filterCameras(cams.data ?? [], filter), [cams.data, filter]);
  const byMachine = useMemo(
    () => new Map((machines.data ?? []).map((m) => [m.id, m])),
    [machines.data],
  );
  const selected = cams.data?.find((c) => c.id === openId) ?? null;
  const attentionCount = (cams.data ?? []).filter(needsAttention).length;

  return (
    <Canvas>
      <PageHeader
        title="Vision"
        subline={cams.data ? visionSubline(cams.data) : "Cameras on this plant."}
        actions={
          <Segmented
            label="Show"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All", count: cams.data?.length },
              { value: "attention", label: "Needs attention", count: attentionCount },
            ]}
          />
        }
      />

      {cams.isPending ? (
        <div className="mt-6"><LoadingRows rows={6} pitch="h-40" /></div>
      ) : cams.isError ? (
        <div className="mt-6"><ErrorState what="cameras" onRetry={() => cams.refetch()} /></div>
      ) : list.length === 0 ? (
        <div className="mt-6">
          <EmptyState>
            {filter === "attention"
              ? "Nothing needs attention. Every camera is sending and scores are quiet."
              : "No cameras on this plant."}
          </EmptyState>
        </div>
      ) : (
        <ul className="stagger mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((camera, i) => (
            <CameraCard
              key={camera.id}
              camera={camera}
              machine={byMachine.get(camera.machineId)}
              index={i}
              onOpen={() => setOpenId(camera.id)}
            />
          ))}
        </ul>
      )}

      {cams.data && machines.data && (
        <GaugeReadings cameras={cams.data} machines={machines.data} />
      )}

      <Sheet
        open={!!selected}
        onOpenChange={(o) => !o && setOpenId(null)}
        title={selected?.name ?? "Camera"}
        description={selected ? byMachine.get(selected.machineId)?.code : undefined}
        width="w-[min(520px,100vw)]"
      >
        {selected && (
          <CameraDetail
            key={selected.id}
            camera={selected}
            machine={byMachine.get(selected.machineId)}
          />
        )}
      </Sheet>
    </Canvas>
  );
}
