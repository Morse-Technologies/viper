"use client";
import { useSpectrum, useSpectrogram } from "@/features/hooks";
import type { Id } from "@/lib/api/types";
import { Skeleton } from "@/ui/atoms";
import { Card, KeyValues } from "@/ui/cells";
import { SpectrumView } from "@/ui/organisms/SpectrumView";
import { Spectrogram } from "@/ui/organisms/Spectrogram";
export function SpectrumPanel({ channelId }: { channelId: Id | null }) {
  const spectrum = useSpectrum(channelId);
  const spectrogram = useSpectrogram(channelId);
  const hit = spectrum.data?.markers.find((m) => m.attributed);
  const envelope = spectrum.data
    ? (hit ? <span className="num">{hit.label} {hit.hz} Hz</span> : "No fault frequency stands out")
    : "…";
  return (
    <>
      <div className="mt-5 grid items-start gap-5 lg:grid-cols-2">
        <Card id="spectrum-h" title="Spectrum (last minute)">
          {!channelId ? <p className="pb-3 text-body text-muted">Pick a channel.</p>
            : spectrum.isPending || !spectrum.data ? <Skeleton className="mb-3 h-[220px] w-full rounded-control" />
              : <div className="pb-3"><SpectrumView data={spectrum.data} /></div>}
        </Card>
        <Card id="spectrogram-h" title="Spectrogram (7 d)">
          {!channelId ? <p className="pb-3 text-body text-muted">Pick a channel.</p>
            : spectrogram.isPending || !spectrogram.data ? <Skeleton className="mb-3 h-[220px] w-full rounded-control" />
              : <div className="pb-3"><Spectrogram data={spectrogram.data} /></div>}
        </Card>
      </div>
      <Card id="envelope-h" title="Envelope" className="mt-5">
        <div className="pb-2">
          <KeyValues rows={[{ k: "Attributed marker", v: envelope }]} />
        </div>
      </Card>
    </>
  );
}
