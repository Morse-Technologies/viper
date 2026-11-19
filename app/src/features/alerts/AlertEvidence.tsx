"use client";
import type { Alert, Machine } from "@/lib/api/types";
import { useCameras, useChannels, useSeries, useSignals, useSnippets, useSpectrum } from "@/features/hooks";
import { EvidenceChip } from "@/ui/cells";
import { AudioSnippet } from "@/ui/organisms/AudioSnippet";
import { CameraFrame } from "@/ui/organisms/CameraFrame";
import { SignalChart } from "@/ui/organisms/SignalChart";
import { SpectrumView } from "@/ui/organisms/SpectrumView";
import { CHART_HEIGHT, VISION_MODALITIES, modalitiesOf } from "./filter";

export function AlertEvidence({ alert, machine }: { alert: Alert; machine: Machine }) {
  const mods = modalitiesOf(alert);
  const needsVision = VISION_MODALITIES.some((m) => mods.has(m));
  const channels = useChannels(alert.machineId);
  const vibId = channels.data?.find((c) => c.kind === "vibration")?.id ?? null;
  const audioId = channels.data?.find((c) => c.kind === "audio")?.id ?? null;
  const spectrum = useSpectrum(mods.has("vibration") ? vibId : null);
  const signals = useSignals(mods.has("series") ? alert.machineId : null);
  const first = signals.data?.[0] ?? null;
  const series = useSeries(first?.id ?? null, "24h");
  const cameras = useCameras();
  const camera = cameras.data?.find((c) => c.machineId === alert.machineId);
  const snippets = useSnippets(mods.has("audio") ? audioId : null);
  const faulty = machine.health === "watch" || machine.health === "alarm";

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {alert.evidence.map((e) => (
          <li key={e.id}><EvidenceChip evidence={e} /></li>
        ))}
      </ul>
      {mods.has("vibration") && spectrum.data && (
        <div className="overflow-hidden rounded-card bg-raised p-3">
          <SpectrumView data={spectrum.data} height={CHART_HEIGHT} compact />
        </div>
      )}
      {mods.has("series") && series.data && first && (
        <div className="overflow-hidden rounded-card bg-raised p-3">
          <SignalChart
            series={series.data}
            unit={first.unit}
            warn={first.warn}
            alarm={first.alarm}
            height={CHART_HEIGHT}
            label={first.name}
          />
        </div>
      )}
      {needsVision && camera && (
        <CameraFrame camera={camera} showRois showAnomaly />
      )}
      {mods.has("audio") && (snippets.data ?? []).map((s) => (
        <AudioSnippet
          key={s.id}
          snippet={s}
          rpm={machine.rpm ?? 0}
          faulty={faulty}
        />
      ))}
    </div>
  );
}
