"use client";
import { useState } from "react";
import { useChannels, useMachine, useSnippets, useSpectrum, useSpectrogram } from "@/features/hooks";
import type { Channel, Health } from "@/lib/api/types";
import { EmptyState, Field, LoadingRows } from "@/ui/cells";
import { Select } from "@/ui/atoms";
import { AudioSnippet } from "@/ui/organisms/AudioSnippet";
import { Spectrum } from "@/ui/organisms/Spectrum";
import { Spectrogram } from "@/ui/organisms/Spectrogram";
import { CHART_HEIGHT } from "./tabs";

const DEFAULT_RPM = 1500;

export function AcousticsTab({ machineId }: { machineId: string }) {
  const channels = useChannels(machineId);
  const machine = useMachine(machineId);
  const [channelId, setChannelId] = useState<string | null>(null);

  if (channels.isPending) return <LoadingRows rows={3} pitch="h-40" />;
  if (!channels.data?.length) {
    return <EmptyState>This machine has no vibration or sound channels.</EmptyState>;
  }
  const selected = channels.data.find((c) => c.id === channelId) ?? channels.data[0];
  return (
    <div className="flex flex-col gap-4">
      <Field label="Channel">{({ id }) => (
        <Select id={id} value={selected.id} onChange={(e) => setChannelId(e.target.value)} aria-label="Channel">
          {channels.data.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      )}</Field>
      <ChannelPanels
        channel={selected}
        rpm={machine.data?.rpm ?? DEFAULT_RPM}
        faulty={isFaulty(machine.data?.health)}
      />
    </div>
  );
}

function isFaulty(health: Health | undefined): boolean {
  return health === "watch" || health === "alarm";
}

function ChannelPanels({
  channel, rpm, faulty,
}: {
  channel: Channel; rpm: number; faulty: boolean;
}) {
  const spectrum = useSpectrum(channel.id);
  const spectrogram = useSpectrogram(channel.id);
  const snippets = useSnippets(channel.kind === "audio" ? channel.id : null);
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-body font-medium">Spectrum</p>
          {spectrum.data
            ? <Spectrum data={spectrum.data} height={CHART_HEIGHT} />
            : <LoadingRows rows={1} pitch="h-40" />}
        </div>
        <div>
          <p className="mb-2 text-body font-medium">Spectrogram</p>
          {spectrogram.data
            ? <Spectrogram data={spectrogram.data} height={CHART_HEIGHT} />
            : <LoadingRows rows={1} pitch="h-40" />}
        </div>
      </div>
      {channel.kind === "audio" && (
        <section aria-labelledby="snippets-h">
          <h2 id="snippets-h" className="mb-2 text-section font-medium">Snippets</h2>
          {snippets.isPending ? <LoadingRows rows={3} pitch="h-12" />
            : <ul className="flex flex-col gap-2">
              {(snippets.data ?? []).map((s) => (
                <li key={s.id}><AudioSnippet snippet={s} rpm={rpm} faulty={faulty} /></li>
              ))}
            </ul>}
        </section>
      )}
    </>
  );
}
