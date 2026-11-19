"use client";
import { useEffect, useRef } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import type { Series } from "@/lib/api/types";
import { reduced } from "@/lib/motion";
import { useTokens, type Tokens } from "@/lib/tokens";
import { gsap } from "gsap";

type Props = {
  series: Series; unit: string; warn?: number | null; alarm?: number | null;
  /** The screen's one teal element: the selected signal draws in accent at 2px, others in ink at 1.5px. */
  selected?: boolean; height?: number; syncKey?: string; label?: string;
};

const AXIS_FONT = "12px var(--font-plex), system-ui, sans-serif";
const AXIS_SIZE = 44;
const DASH = [6, 4];

/** Threshold lines are drawn after the series: warning dashed in warning ink, alarm dashed in negative. */
function thresholdHook(t: Tokens, warn?: number | null, alarm?: number | null) {
  return (u: uPlot) => {
    const ctx = u.ctx;
    for (const [value, color] of [[warn, t["pill-warning-ink"]], [alarm, t.negative]] as const) {
      if (value === null || value === undefined) continue;
      const y = u.valToPos(value, "y", true);
      ctx.save(); ctx.strokeStyle = color; ctx.setLineDash(DASH); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(u.bbox.left, y); ctx.lineTo(u.bbox.left + u.bbox.width, y); ctx.stroke(); ctx.restore();
    }
  };
}

function options({ t, p, width }: { t: Tokens; p: Props; width: number }): uPlot.Options {
  const axis = { stroke: t.muted, font: AXIS_FONT, grid: { stroke: t.grid, width: 1 }, ticks: { show: false }, size: AXIS_SIZE };
  const values = [...p.series.v.filter((v): v is number => v !== null), p.warn ?? 0, p.alarm ?? 0].filter((v) => v !== 0);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  return {
    width, height: p.height ?? 220, legend: { show: false },
    cursor: { sync: p.syncKey ? { key: p.syncKey } : undefined, points: { size: 6 } },
    scales: { x: { time: true }, y: { range: [min - (max - min) * 0.1, max + (max - min) * 0.1] } },
    axes: [axis, { ...axis, values: (_u, v) => v.map((x) => `${+x.toFixed(2)}`) }],
    series: [{}, { label: p.label ?? p.series.signalId, stroke: p.selected ? t.accent : t.bar, width: p.selected ? 2 : 1.5, spanGaps: false }],
    hooks: { draw: [thresholdHook(t, p.warn, p.alarm)] },
  };
}

/** A time series in a raised well (§21.4 SignalChart). Gaps (no data / bad quality) stay as gaps. */
export function SignalChart(p: Props) {
  const box = useRef<HTMLDivElement>(null);
  const t = useTokens();
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const plot = new uPlot(options({ t, p, width: el.clientWidth }), [p.series.t, p.series.v], el);
    const resize = new ResizeObserver(() => plot.setSize({ width: el.clientWidth, height: p.height ?? 220 }));
    resize.observe(el);
    if (!reduced()) gsap.from(el, { clipPath: "inset(0 100% 0 0)", duration: 0.7, ease: "power3.out", clearProps: "clipPath" });
    return () => { resize.disconnect(); plot.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, p.series, p.selected, p.warn, p.alarm, p.height, p.syncKey]);
  return <div ref={box} role="img" aria-label={`${p.label ?? "Signal"} in ${p.unit}`} className="w-full rounded-control bg-raised px-1 pt-2" />;
}
