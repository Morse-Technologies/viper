"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useChannels, useMachines } from "@/features/hooks";
import type { Id, Range } from "@/lib/api/types";
import { fmtNum } from "@/lib/format";
import { Select } from "@/ui/atoms";
import { EmptyState, ErrorState, LoadingRows, PageHeader, Segmented } from "@/ui/cells";
import { Canvas } from "@/ui/templates/ShellLayout";
import {
  ACOUSTIC_RANGES, acousticMachines, DEFAULT_ACOUSTIC_RANGE, defaultChannelId,
  defaultMachineId, isAcousticRange,
} from "./pick";
import { SnippetsPanel } from "./SnippetsPanel";
import { SpectrumPanel } from "./SpectrumPanel";
import { TrendCharts } from "./TrendCharts";

function writeUrl(router: ReturnType<typeof useRouter>, machineId: Id, channelId: Id | null, range: Range) {
  const p = new URLSearchParams();
  p.set("m", machineId);
  if (channelId) p.set("c", channelId);
  p.set("r", range);
  router.replace(`/acoustics?${p}`, { scroll: false });
}

function resolveMachineId(urlMachine: string | null, acoustic: ReturnType<typeof acousticMachines>): Id | null {
  if (urlMachine && acoustic.some((m) => m.id === urlMachine)) return urlMachine;
  return defaultMachineId(acoustic);
}

/** Vibration & sound for one machine: trends, spectrum, spectrogram, envelope, snippets. */
export function AcousticsScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const machinesQ = useMachines("plant");
  const acoustic = useMemo(() => acousticMachines(machinesQ.data ?? []), [machinesQ.data]);

  const rangeParam = params.get("r");
  const range: Range = isAcousticRange(rangeParam) ? rangeParam : DEFAULT_ACOUSTIC_RANGE;
  const urlMachine = params.get("m");
  const urlChannel = params.get("c");
  const machineId = resolveMachineId(urlMachine, acoustic);

  const channelsQ = useChannels(machineId);
  const channelId = useMemo(() => {
    const list = channelsQ.data ?? [];
    if (urlChannel && list.some((c) => c.id === urlChannel)) return urlChannel;
    return defaultChannelId(list);
  }, [channelsQ.data, urlChannel]);

  useEffect(() => {
    if (!machineId || channelsQ.isPending) return;
    if (urlMachine === machineId && urlChannel === channelId && isAcousticRange(rangeParam)) return;
    writeUrl(router, machineId, channelId, range);
  }, [machineId, channelId, range, urlMachine, urlChannel, rangeParam, channelsQ.isPending, router]);

  if (machinesQ.isError) {
    return <Canvas><ErrorState what="machines" onRetry={() => machinesQ.refetch()} /></Canvas>;
  }
  if (machinesQ.isPending) {
    return <Canvas><LoadingRows rows={6} pitch="h-14" /></Canvas>;
  }
  if (!machineId) {
    return <Canvas><PageHeader title="Vibration & sound" /><EmptyState className="mt-8">No machine in this plant carries vibration or sound.</EmptyState></Canvas>;
  }

  const machine = acoustic.find((m) => m.id === machineId);
  if (!machine) {
    return <Canvas><ErrorState what="this machine" onRetry={() => machinesQ.refetch()} /></Canvas>;
  }

  return (
    <Canvas>
      <PageHeader
        title={`${machine.code} / Vibration & sound`}
        subline="Trends for this machine, then the spectrum of the selected channel."
        actions={
          <Toolbar
            acoustic={acoustic}
            machineId={machineId}
            channelId={channelId}
            channels={channelsQ.data ?? []}
            range={range}
            rpm={machine.rpm}
            onMachine={(id) => writeUrl(router, id, null, range)}
            onChannel={(id) => writeUrl(router, machineId, id, range)}
            onRange={(r) => writeUrl(router, machineId, channelId, r)}
          />
        }
      />
      <TrendCharts machineId={machineId} range={range} />
      <SpectrumPanel channelId={channelId} />
      <SnippetsPanel machine={machine} />
    </Canvas>
  );
}

function Toolbar({
  acoustic, machineId, channelId, channels, range, rpm, onMachine, onChannel, onRange,
}: {
  acoustic: ReturnType<typeof acousticMachines>;
  machineId: Id;
  channelId: Id | null;
  channels: { id: Id; name: string }[];
  range: Range;
  rpm: number | null;
  onMachine: (id: Id) => void;
  onChannel: (id: Id) => void;
  onRange: (r: Range) => void;
}) {
  return (
    <>
      <span className="w-40">
        <Select aria-label="Machine" value={machineId} onChange={(e) => onMachine(e.target.value)} className="bg-surface">
          {acoustic.map((m) => <option key={m.id} value={m.id}>{m.code}</option>)}
        </Select>
      </span>
      <span className="w-40"><Select
        aria-label="Channel"
        value={channelId ?? ""}
        onChange={(e) => onChannel(e.target.value)}
        className="bg-surface"
        disabled={channels.length === 0}
      >
        {channels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select></span>
      <Segmented label="Range" value={range} onChange={onRange} options={ACOUSTIC_RANGES} />
      {rpm !== null && (
        <span className="text-body text-muted">
          rpm <span className="text-text num">{fmtNum(rpm)}</span>
        </span>
      )}
    </>
  );
}
