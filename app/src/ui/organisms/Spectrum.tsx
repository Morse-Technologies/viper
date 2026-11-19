"use client";
import { gsap } from "gsap";
import { useEffect, useRef } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import type { Spectrum as SpectrumData } from "@/lib/api/types";
import { reduced } from "@/lib/motion";
import { useTokens, type Tokens } from "@/lib/tokens";

const AXIS_FONT = "12px var(--font-plex), system-ui, sans-serif";
const MARK_FONT = "bold 11px var(--font-plex), system-ui, sans-serif";
const LABEL_PAD = 4;

/** Marker lines in muted; the one the attribution points at in accent (the screen's single teal). */
function markersHook(t: Tokens, data: SpectrumData) {
  return (u: uPlot) => {
    const ctx = u.ctx;
    const top = u.bbox.top;
    for (const m of data.markers) {
      const x = u.valToPos(m.hz, "x", true);
      ctx.save();
      ctx.strokeStyle = m.attributed ? t.accent : t.muted;
      ctx.fillStyle = m.attributed ? t.accent : t.muted;
      ctx.lineWidth = m.attributed ? 2 : 1;
      ctx.setLineDash(m.attributed ? [] : [3, 3]);
      ctx.beginPath(); ctx.moveTo(x, top + 14 * devicePixelRatio); ctx.lineTo(x, top + u.bbox.height); ctx.stroke();
      ctx.font = MARK_FONT.replace("11px", `${11 * devicePixelRatio}px`);
      ctx.fillText(m.label, x + LABEL_PAD, top + 10 * devicePixelRatio);
      ctx.restore();
    }
  };
}

/** Amplitude spectrum with fault-frequency markers (1×, 2×, 3×, BPFO, BPFI, BSF, FTF). */
export function Spectrum({ data, height = 220 }: { data: SpectrumData; height?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const t = useTokens();
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const axis = { stroke: t.muted, font: AXIS_FONT, grid: { stroke: t.grid, width: 1 }, ticks: { show: false } };
    const plot = new uPlot({
      width: el.clientWidth, height, legend: { show: false }, cursor: { points: { size: 5 } },
      scales: { x: { time: false } },
      axes: [{ ...axis, values: (_u, v) => v.map((x) => `${x} Hz`) }, { ...axis, size: 44, values: (_u, v) => v.map((x) => x.toFixed(2)) }],
      series: [{}, { label: "mm/s", stroke: t.bar, width: 1.25, fill: `${t.bar}14` }],
      hooks: { draw: [markersHook(t, data)] },
    }, [data.hz, data.amp], el);
    const resize = new ResizeObserver(() => plot.setSize({ width: el.clientWidth, height }));
    resize.observe(el);
    if (!reduced()) gsap.from(el, { clipPath: "inset(100% 0 0 0)", duration: 0.6, ease: "power3.out", clearProps: "clipPath" });
    return () => { resize.disconnect(); plot.destroy(); };
  }, [t, data, height]);
  return <div ref={box} role="img" aria-label="Amplitude spectrum" className="w-full rounded-control bg-raised px-1 pt-2" />;
}
