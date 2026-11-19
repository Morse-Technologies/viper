"use client";
import { useCameras } from "@/features/hooks";
import type { Camera, Roi } from "@/lib/api/types";
import { fmtAgo, fmtNum } from "@/lib/format";
import { EmptyState, LoadingRows } from "@/ui/cells";
import { CameraFrame } from "@/ui/organisms/CameraFrame";

export function VisionTab({ machineId }: { machineId: string }) {
  const cameras = useCameras();
  if (cameras.isPending) return <LoadingRows rows={3} pitch="h-40" />;
  const mine = (cameras.data ?? []).filter((c) => c.machineId === machineId);
  if (!mine.length) return <EmptyState>No camera covers this machine.</EmptyState>;
  return (
    <ul className="flex flex-col gap-6">
      {mine.map((c) => <li key={c.id}><CameraBlock camera={c} /></li>)}
    </ul>
  );
}

function CameraBlock({ camera }: { camera: Camera }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div>
        <p className="mb-2 text-body font-medium">{camera.name}</p>
        <CameraFrame camera={camera} showRois showAnomaly />
      </div>
      <RoiList rois={camera.rois} />
    </div>
  );
}

function RoiList({ rois }: { rois: Roi[] }) {
  if (!rois.length) return <EmptyState>No regions of interest on this camera.</EmptyState>;
  return (
    <ul className="divide-y divide-rule rounded-card border border-border">
      {rois.map((r) => (
        <li key={r.id} className="flex flex-col gap-0.5 px-4 py-3 text-body">
          <span className="font-medium">{r.name}</span>
          <span className="text-muted capitalize">{r.task}</span>
          {r.reading ? (
            <span className="text-muted">
              <span className="num text-text">{fmtNum(r.reading.value)}</span> {r.reading.unit}
              {" · "}{fmtAgo(r.reading.at)}
            </span>
          ) : (
            <span className="text-muted">No reading yet</span>
          )}
        </li>
      ))}
    </ul>
  );
}
