"use client";
import { EyeOff } from "lucide-react";
import { useId } from "react";
import type { Camera } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { fmtTime } from "@/lib/format";

const W = 320;
const H = 200;
const ANOMALY_MIN = 0.15;

const toPoints = (pts: [number, number][]) => pts.map(([x, y]) => `${x * W},${y * H}`).join(" ");

/** A drawn stand-in for a camera frame: the machine in greys, never a real image and never a person. */
function Scene() {
  return (
    <g fill="var(--control)">
      <rect x="0" y={H * 0.78} width={W} height={H * 0.22} fill="var(--active)" />
      <rect x={W * 0.12} y={H * 0.36} width={W * 0.56} height={H * 0.42} rx="6" />
      <rect x={W * 0.6} y={H * 0.1} width={W * 0.26} height={H * 0.68} rx="6" fill="var(--bar-miss)" opacity="0.6" />
      <circle cx={W * 0.72} cy={H * 0.31} r={H * 0.09} fill="var(--surface)" stroke="var(--muted)" strokeWidth="2" />
      <line x1={W * 0.72} y1={H * 0.31} x2={W * 0.77} y2={H * 0.25} stroke="var(--text)" strokeWidth="2" />
      <rect x={W * 0.75} y={H * 0.14} width={W * 0.1} height={H * 0.08} rx="2" fill="var(--text)" opacity="0.75" />
    </g>
  );
}

/** Where a person was detected: blurred at the edge before Viper ever sees it; shown as a soft patch, no box. */
function BlurPatch() {
  return <rect x={W * 0.02} y={H * 0.3} width={W * 0.12} height={H * 0.5} rx="10" fill="var(--faint)" opacity="0.35" filter="url(#blur)" />;
}

/**
 * Camera evidence (§21.4 EvidenceViewer): frame in a raised well, ROIs dashed in ink, the anomaly map in accent at 45 %,
 * and the attestation stamp underneath.
 */
export function CameraFrame({ camera, showRois = true, showAnomaly = true, className }: { camera: Camera; showRois?: boolean; showAnomaly?: boolean; className?: string }) {
  const id = useId();
  const anomalous = showAnomaly && camera.anomalyScore >= ANOMALY_MIN;
  const roi = camera.rois.find((r) => r.task === "anomaly");
  const [cx, cy] = roi ? [(roi.points[0][0] + roi.points[2][0]) / 2, (roi.points[0][1] + roi.points[2][1]) / 2] : [0.5, 0.5];
  return (
    <figure className={cn("flex flex-col gap-2", className)}>
      <div className="relative overflow-hidden rounded-control bg-raised">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${camera.name}, last frame`} className={cn("block w-full", camera.status === "offline" && "opacity-40")}>
          <defs>
            <filter id="blur"><feGaussianBlur stdDeviation="6" /></filter>
            <radialGradient id={`${id}-heat`}><stop offset="0" stopColor="var(--accent)" stopOpacity="0.45" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></radialGradient>
          </defs>
          <Scene />
          {camera.personBlurred && <BlurPatch />}
          {anomalous && <ellipse cx={cx * W} cy={cy * H} rx={W * 0.16} ry={H * 0.16} fill={`url(#${id}-heat)`} />}
          {showRois && camera.rois.map((r) => (
            <polygon key={r.id} points={toPoints(r.points)} fill="none" stroke="var(--text)" strokeWidth="1" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
        {camera.personBlurred && (
          <span className="absolute top-2 left-2 inline-flex h-5 items-center gap-1 rounded-full bg-surface/90 px-2 text-small text-muted">
            <EyeOff className="size-3" />Person blurred
          </span>
        )}
      </div>
      <figcaption className="text-small text-muted num">
        {camera.personBlurred ? "Blurred" : "No person detected"} · {camera.detector} · {fmtTime(camera.lastFrameAt)} · gateway {camera.gateway}
      </figcaption>
    </figure>
  );
}
