"use client";
import { RotateCcw } from "lucide-react";
import { useState } from "react";
import type { Spectrum as SpectrumData } from "@/lib/api/types";
import { fmtHz } from "@/lib/format";
import { Button } from "@/ui/atoms";
import { Segmented } from "@/ui/cells";
import { Spectrum, type HzRange } from "./Spectrum";

export type SpectrumPreset = "200" | "500" | "1000" | "full";
const PRESETS: { value: SpectrumPreset; label: string }[] = [
  { value: "200", label: "200 Hz" }, { value: "500", label: "500 Hz" }, { value: "1000", label: "1 kHz" }, { value: "full", label: "Full" },
];

const topOf = (data: SpectrumData) => data.hz.at(-1) ?? 0;
export const presetRange = (p: SpectrumPreset, top: number): HzRange => [0, p === "full" ? top : Math.min(top, Number(p))];
const presetOf = (r: HzRange, top: number) => PRESETS.find((p) => {
  const [a, b] = presetRange(p.value, top);
  return Math.abs(r[0] - a) < 0.5 && Math.abs(r[1] - b) < 0.5;
})?.value ?? "";

/** The spectrum with its window: preset ranges, drag-to-zoom on the chart, and a reset to the whole band. */
export function SpectrumView({ data, height, initial = "500", compact }: {
  data: SpectrumData; height?: number; initial?: SpectrumPreset; compact?: boolean;
}) {
  const top = topOf(data);
  const [range, setRange] = useState<HzRange>(() => presetRange(initial, top));
  const preset = presetOf(range, top);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented<SpectrumPreset | "">
          label="Frequency range" options={PRESETS} value={preset}
          onChange={(v) => { if (v) setRange(presetRange(v, top)); }}
        />
        <span className="text-small text-muted num" aria-live="polite">{fmtHz(range[0])} – {fmtHz(range[1])}</span>
        {preset !== initial && (
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setRange(presetRange(initial, top))}><RotateCcw />Reset</Button>
        )}
      </div>
      <Spectrum data={data} height={height} range={range} onRangeChange={setRange} />
      {!compact && <p className="text-small text-muted">Drag across the chart to zoom in; double-click for the whole band.</p>}
    </div>
  );
}
