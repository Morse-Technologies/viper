"use client";
import { gsap } from "gsap";
import { Check, Radio, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useEdgeDevices, useDrivers, useMachines } from "@/features/hooks";
import type { Kurtogram as KurtogramData, TestCapture } from "@/lib/api/types";
import { fmtHz } from "@/lib/format";
import { reduced } from "@/lib/motion";
import { Button, Skeleton } from "@/ui/atoms";
import { KeyValues, Segmented } from "@/ui/cells";
import { Kurtogram } from "@/ui/organisms/Kurtogram";
import { SpectrumView } from "@/ui/organisms/SpectrumView";
import { axisLabel, componentLabel, mountingInfo, speedLabel } from "./wizard";
import type { StepProps } from "./SetupSteps";

const CAPTURE_S = 1.3;

/** Records one second; an ink line runs while it does. Every check must pass before the band can be chosen. */
export function CaptureStep({ capture, capturing, onCapture }: { capture: TestCapture | null; capturing: boolean; onCapture: () => void }) {
  const bar = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = bar.current;
    if (!el || !capturing) return;
    if (reduced()) { gsap.set(el, { scaleX: 1 }); return; }
    const tween = gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: CAPTURE_S, ease: "none" });
    return () => { tween.kill(); };
  }, [capturing]);
  const failing = capture?.checks.filter((c) => !c.ok) ?? [];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={onCapture} disabled={capturing}><Radio />{capture ? "Capture again" : "Capture 1 s"}</Button>
        <span className="text-small text-muted" role="status" aria-live="polite">
          {capturing ? "Recording one second…" : capture ? "Captured just now." : "Nothing captured yet."}
        </span>
      </div>
      {capturing && (
        <div className="flex flex-col gap-2">
          <span className="relative block h-0.5 overflow-hidden rounded-full bg-rule"><span ref={bar} className="absolute inset-0 origin-left scale-x-0 bg-primary" /></span>
          <Skeleton className="h-[200px] w-full rounded-control" />
        </div>
      )}
      {!capturing && capture && (
        <>
          <SpectrumView data={capture.spectrum} height={200} initial="1000" compact />
          <ul className="divide-y divide-rule rounded-card border border-border">
            {capture.checks.map((c) => (
              <li key={c.key} className="flex items-center gap-3 px-4 py-2.5 text-body">
                {c.ok ? <Check className="size-4 text-text" strokeWidth={2.2} aria-label="Passed" /> : <X className="size-4 text-negative" strokeWidth={2.2} aria-label="Failed" />}
                <span className="flex-1">{c.label}</span>
                <span className={c.ok ? "text-muted num" : "text-negative"}>{c.value}</span>
              </li>
            ))}
          </ul>
          {failing.length > 0 && <p className="text-body text-negative">Fix this and capture again before going on.</p>}
        </>
      )}
    </div>
  );
}

export function BandStep({ draft, set, kurt }: StepProps & { kurt: KurtogramData | undefined }) {
  if (!kurt) return <Skeleton className="h-[200px] w-full rounded-control" />;
  const width = (level: number) => kurt.maxHz / 2 ** level;
  const selected = draft.band
    ? kurt.levels.flatMap((row, level) => row.map((_, index) => ({ level, index })))
      .find(({ level, index }) => Math.round(index * width(level)) === draft.band!.from && Math.round((index + 1) * width(level)) === draft.band!.to) ?? null
    : null;
  const k = selected ? kurt.levels[selected.level][selected.index] : null;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-body">
        Viper suggests <span className="num font-medium">{fmtHz(kurt.best.from)} – {fmtHz(kurt.best.to)}</span>, the most impulsive band
        (kurtosis <span className="num">{kurt.best.kurtosis}</span>). The envelope demodulates this band to find the bearing tones. Pick another cell to change it.
      </p>
      <Kurtogram data={kurt} selected={selected} onSelect={(level, index) => set({ band: { from: Math.round(index * width(level)), to: Math.round((index + 1) * width(level)) } })} />
      {draft.band && (
        <KeyValues rows={[
          { k: "Envelope band", v: <span className="num">{fmtHz(draft.band.from)} – {fmtHz(draft.band.to)}</span> },
          { k: "Kurtosis", v: <span className="num">{k ?? "n/a"}</span> },
        ]} />
      )}
    </div>
  );
}

export function BaselineStep({ draft, set }: StepProps) {
  const machines = useMachines();
  const edges = useEdgeDevices();
  const drivers = useDrivers();
  const m = machines.data?.find((x) => x.id === draft.machineId);
  const edge = edges.data?.find((x) => x.id === draft.edgeId);
  const driver = drivers.data?.find((x) => x.id === draft.driverId);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-body font-medium">Baseline length</span>
        <Segmented<"7" | "14" | "30"> label="Baseline length" options={[{ value: "7", label: "7 days" }, { value: "14", label: "14 days" }, { value: "30", label: "30 days" }]}
          value={String(draft.baselineDays) as "7" | "14" | "30"} onChange={(v) => set({ baselineDays: Number(v) as 7 | 14 | 30 })} />
        <p className="text-small text-muted">Viper learns this point&apos;s normal while the machine runs as usual. Thresholds work from today; model alerts start when the baseline ends.</p>
      </div>
      <KeyValues rows={[
        { k: "Machine", v: m ? `${m.code} · ${m.name}` : "n/a" },
        { k: "Device and input", v: `${edge?.name ?? "n/a"} · ${draft.input}` },
        { k: "Driver", v: driver?.name ?? "n/a" },
        { k: "Position", v: `${draft.position}, ${axisLabel[draft.axis].toLowerCase()}` },
        { k: "Mounting", v: mountingInfo[draft.mounting].label },
        { k: "Component", v: draft.component === "bearing" ? `${componentLabel.bearing} ${draft.bearing}` : `${componentLabel[draft.component]}${draft.teeth ? ` (${draft.teeth})` : ""}` },
        { k: "Speed", v: draft.speed === "fixed" ? <span className="num">{draft.rpm} rpm</span> : speedLabel[draft.speed] },
        { k: "Envelope band", v: draft.band ? <span className="num">{fmtHz(draft.band.from)} – {fmtHz(draft.band.to)}</span> : "n/a" },
      ]} />
    </div>
  );
}
