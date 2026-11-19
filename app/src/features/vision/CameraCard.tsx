"use client";
import type { CSSProperties } from "react";
import type { Camera, Machine } from "@/lib/api/types";
import { fmtNum } from "@/lib/format";
import { Dot } from "@/ui/atoms";
import { CameraFrame } from "@/ui/organisms/CameraFrame";
import { CAMERA_STATUS_LABEL, CAMERA_STATUS_TONE, ROI_TASK_LABEL } from "./constants";

function taskNames(camera: Camera): string {
  return [...new Set(camera.rois.map((r) => ROI_TASK_LABEL[r.task]))].join(" · ");
}

export function CameraCard({
  camera, machine, index, onOpen,
}: {
  camera: Camera; machine: Machine | undefined; index: number; onOpen: () => void;
}) {
  const staggerStyle = { "--i": index } as CSSProperties;
  return (
    <li style={staggerStyle}>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${camera.name}`}
        className="flex w-full flex-col gap-2 rounded-card border border-border bg-surface p-3 text-left transition-colors hover:bg-raised"
      >
        <CameraFrame camera={camera} showRois={false} showAnomaly={false} />
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-body font-medium">{camera.name}</span>
          <span className="text-small text-muted num">{machine?.code ?? "—"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-small text-muted">
          <Dot tone={CAMERA_STATUS_TONE[camera.status]} />
          {CAMERA_STATUS_LABEL[camera.status]}
          <span className="text-faint">·</span>
          <span className="num">{fmtNum(camera.anomalyScore)}</span>
        </div>
        <p className="truncate text-small text-muted">{taskNames(camera) || "No ROI tasks"}</p>
      </button>
    </li>
  );
}
