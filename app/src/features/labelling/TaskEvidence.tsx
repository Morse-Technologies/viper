"use client";
import {
  useCameras, useChannels, useMachine, useSignals, useSeries, useSnippets, useSpectrum,
} from "@/features/hooks";
import type { LabelTask, Modality } from "@/lib/api/types";
import { Skeleton } from "@/ui/atoms";
import { EvidenceChip } from "@/ui/cells";
import { AudioSnippet } from "@/ui/organisms/AudioSnippet";
import { CameraFrame } from "@/ui/organisms/CameraFrame";
import { SignalChart } from "@/ui/organisms/SignalChart";
import { SpectrumView } from "@/ui/organisms/SpectrumView";
import { SERIES_RANGE } from "./constants";

function isVibOrAudio(m: Modality): m is "vibration" | "audio" {
  return m === "vibration" || m === "audio";
}

function isVision(m: Modality): boolean {
  return m === "camera" || m === "gauge" || m === "display" || m === "thermal";
}

function VibAudioView({ machineId, modality }: { machineId: string; modality: "vibration" | "audio" }) {
  const channels = useChannels(machineId);
  const channel = channels.data?.find((c) => c.kind === modality) ?? channels.data?.[0] ?? null;
  const spectrum = useSpectrum(modality === "vibration" ? channel?.id ?? null : null);
  const snippets = useSnippets(modality === "audio" ? channel?.id ?? null : null);
  const machine = useMachine(machineId);
  const rpm = machine.data?.rpm ?? 1500;

  if (channels.isPending) return <Skeleton className="h-40 w-full" />;
  if (modality === "vibration") {
    if (!spectrum.data) return <p className="text-body text-muted">No spectrum for this channel.</p>;
    return <SpectrumView data={spectrum.data} compact />;
  }
  const snippet = snippets.data?.[0];
  if (!snippet) return <p className="text-body text-muted">No audio snippet for this channel.</p>;
  return <AudioSnippet snippet={snippet} rpm={rpm} faulty={false} />;
}

function SeriesView({ machineId }: { machineId: string }) {
  const signals = useSignals(machineId);
  const first = signals.data?.[0] ?? null;
  const series = useSeries(first?.id ?? null, SERIES_RANGE);
  if (signals.isPending || series.isPending) return <Skeleton className="h-40 w-full" />;
  if (!series.data || !first) return <p className="text-body text-muted">No series for this machine.</p>;
  return (
    <SignalChart
      series={series.data}
      unit={first.unit}
      warn={first.warn}
      alarm={first.alarm}
      selected
      label={first.name}
    />
  );
}

function VisionView({ machineId }: { machineId: string }) {
  const cameras = useCameras();
  const camera = cameras.data?.find((c) => c.machineId === machineId) ?? null;
  if (cameras.isPending) return <Skeleton className="h-40 w-full" />;
  if (!camera) return <p className="text-body text-muted">No camera on this machine.</p>;
  return <CameraFrame camera={camera} showRois showAnomaly className="max-w-[720px]" />;
}

function EvidenceBody({ task }: { task: LabelTask }) {
  const { modality, machineId } = task;
  if (isVibOrAudio(modality)) return <VibAudioView machineId={machineId} modality={modality} />;
  if (modality === "series") return <SeriesView machineId={machineId} />;
  if (isVision(modality)) return <VisionView machineId={machineId} />;
  return <p className="text-body text-muted">No viewer for this modality yet.</p>;
}

export function TaskEvidence({ task }: { task: LabelTask }) {
  return (
    <div className="flex flex-col gap-3">
      <EvidenceChip evidence={task.evidence} />
      <EvidenceBody task={task} />
    </div>
  );
}
