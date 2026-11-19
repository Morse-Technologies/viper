"use client";
import { gsap } from "gsap";
import { useEffect, useRef } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import type { Spectrum as SpectrumData } from "@/lib/api/types";
import { fmtHz } from "@/lib/format";
import { reduced } from "@/lib/motion";
import { useTokens, type Tokens } from "@/lib/tokens";
import { labelStart, placeLabels } from "./spectrumLabels";

export type HzRange = [number, number];

const MARK_PX = 11;
const ROW_PX = 13;
const LABEL_ROWS = 3;
/** Headroom above the tallest peak so the label rows never sit on a peak. */
const HEADROOM = 1.45;
const ZOOM_S = 0.5;
const MIN_DRAG_PX = 6;

/**
 * Marker lines and their labels. Only markers inside the zoomed window are drawn; labels take one of three
 * rows by priority, and a marker without room keeps a faint line and no label. The attributed one is the
 * screen's single teal.
 */
function markersHook(t: Tokens, data: SpectrumData, family: string) {
  return (u: uPlot) => {
    const ctx = u.ctx;
    const dpr = devicePixelRatio;
    // Place labels in CSS pixels so the padding and gaps read the same on every screen density.
    const left = u.bbox.left / dpr, top = u.bbox.top / dpr, right = left + u.bbox.width / dpr, bottom = top + u.bbox.height / dpr;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.font = `bold ${MARK_PX}px ${family}`;
    // uPlot leaves its axis alignment on the context; labels are placed by their left edge.
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    const xs = data.markers.map((m) => u.valToPos(m.hz, "x", true) / dpr);
    const widths = data.markers.map((m) => ctx.measureText(m.label).width);
    const rows = placeLabels(data.markers.map((m, i) => ({ x: xs[i], width: widths[i], priority: m.priority })), left, right, LABEL_ROWS);
    data.markers.forEach((m, i) => {
      const x = xs[i];
      if (x < left || x > right) return;
      const row = rows[i];
      const color = m.attributed ? t.accent : t.muted;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.globalAlpha = row === null ? 0.35 : 1;
      ctx.lineWidth = m.attributed ? 2 : 1;
      ctx.setLineDash(m.attributed ? [] : [3, 3]);
      // Lines without a label start under the label rows so they never strike through a word.
      const lineTop = top + ((row ?? LABEL_ROWS - 1) + 1) * ROW_PX + 2;
      ctx.beginPath(); ctx.moveTo(x, lineTop); ctx.lineTo(x, bottom); ctx.stroke();
      if (row !== null) ctx.fillText(m.label, labelStart(x, widths[i], right), top + (row + 1) * ROW_PX - 2);
    });
    ctx.restore();
  };
}

const same = (a: HzRange, b: HzRange) => Math.abs(a[0] - b[0]) < 0.01 && Math.abs(a[1] - b[1]) < 0.01;

/**
 * Amplitude spectrum with fault-frequency markers. Drag across it to zoom; double-click to see the whole band.
 * `range` is the window, owned by the parent, and the chart glides to it; `onRangeChange` asks for a new one
 * after a drag or a double-click.
 */
export function Spectrum({ data, height = 220, range, onRangeChange }: {
  data: SpectrumData; height?: number; range?: HzRange | null; onRangeChange?: (r: HzRange) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);
  const rangeRef = useRef(range);
  const report = useRef(onRangeChange);
  useEffect(() => { rangeRef.current = range; report.current = onRangeChange; });
  const t = useTokens();

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    // Canvas fonts cannot read CSS variables; take the resolved family from the page.
    const family = getComputedStyle(el).fontFamily || "system-ui, sans-serif";
    const axis = { stroke: t.muted, font: `12px ${family}`, grid: { stroke: t.grid, width: 1 }, ticks: { show: false } };
    const plot = new uPlot({
      width: el.clientWidth, height, legend: { show: false },
      // The drag only selects; the parent owns the window and glides to it, so presets and drags share one path.
      cursor: { points: { size: 5 }, drag: { x: true, y: false, setScale: false } },
      scales: { x: { time: false, range: (_u, min, max) => [min, max] }, y: { range: (_u, _min, max) => [0, max * HEADROOM] } },
      axes: [{ ...axis, values: (_u, v) => v.map(fmtHz) }, { ...axis, size: 44, values: (_u, v) => v.map((x) => x.toFixed(2)) }],
      series: [{}, { label: "mm/s", stroke: t.bar, width: 1.25, fill: `${t.bar}14` }],
      hooks: {
        draw: [markersHook(t, data, family)],
        setSelect: [(u) => {
          const { left, width } = u.select;
          if (width < MIN_DRAG_PX) return;
          report.current?.([Math.max(0, u.posToVal(left, "x")), u.posToVal(left + width, "x")]);
          u.setSelect({ left: 0, top: 0, width: 0, height: 0 }, false);
        }],
      },
    }, [data.hz, data.amp], el);
    plotRef.current = plot;
    const start = rangeRef.current;
    if (start) plot.setScale("x", { min: start[0], max: start[1] });
    const full = () => report.current?.([data.hz[0], data.hz.at(-1)!]);
    plot.over.addEventListener("dblclick", full);
    const resize = new ResizeObserver(() => plot.setSize({ width: el.clientWidth, height }));
    resize.observe(el);
    if (!reduced()) gsap.from(el, { clipPath: "inset(100% 0 0 0)", duration: 0.6, ease: "power3.out", clearProps: "clipPath" });
    return () => { plot.over.removeEventListener("dblclick", full); resize.disconnect(); plot.destroy(); plotRef.current = null; };
  }, [t, data, height]);

  // Presets glide the window rather than jump, so the eye keeps the peak it was looking at.
  useEffect(() => {
    const plot = plotRef.current;
    if (!plot || !range) return;
    const { min, max } = plot.scales.x;
    if (min == null || max == null || same([min, max], range)) return;
    const apply = (a: number, b: number) => plot.setScale("x", { min: a, max: b });
    if (reduced()) { apply(range[0], range[1]); return; }
    const win = { a: min, b: max };
    const tween = gsap.to(win, { a: range[0], b: range[1], duration: ZOOM_S, ease: "power3.inOut", onUpdate: () => apply(win.a, win.b) });
    return () => { tween.kill(); };
  }, [range]);

  return <div ref={box} role="img" aria-label="Amplitude spectrum" className="w-full rounded-control bg-raised px-1 pt-2" />;
}
