"use client";
import { gsap } from "gsap";
import { useEffect, useRef } from "react";
import type { Spectrogram as SpectrogramData } from "@/lib/api/types";
import { fmtHz } from "@/lib/format";
import { reduced } from "@/lib/motion";
import { useTokens } from "@/lib/tokens";

const STOPS = 3;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** One-hue ramp (surface → accent-soft → accent → text) so the heat never borrows a band or status colour. */
function ramp(colors: string[]) {
  const rgb = colors.map(hexToRgb);
  return (v: number) => {
    const x = Math.min(0.999, Math.max(0, v)) * STOPS;
    const i = Math.floor(x);
    const f = x - i;
    return rgb[i].map((c, k) => Math.round(c + (rgb[i + 1][k] - c) * f)) as [number, number, number];
  };
}

/** Days on the vertical axis (oldest at the top), frequency across; drawn into a canvas, revealed top-down. */
export function Spectrogram({ data, height = 220 }: { data: SpectrogramData; height?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const t = useTokens();
  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const color = ramp([t.surface, t["accent-soft"], t.accent, t.text]);
    const rows = data.rows.length, cols = data.rows[0].length;
    const img = ctx.createImageData(cols, rows);
    data.rows.forEach((row, r) => row.forEach((v, k) => {
      const [red, green, blue] = color(v);
      img.data.set([red, green, blue, 255], (r * cols + k) * 4);
    }));
    c.width = cols; c.height = rows;
    ctx.putImageData(img, 0, 0);
    if (!reduced()) gsap.from(c, { clipPath: "inset(0 0 100% 0)", duration: 0.8, ease: "power3.out", clearProps: "clipPath" });
  }, [t, data]);
  return (
    <figure className="flex flex-col gap-2">
      <canvas ref={canvas} role="img" aria-label={`Spectrogram, last ${data.days} days, 0 to ${fmtHz(data.maxHz)}`} className="w-full rounded-control bg-raised [image-rendering:pixelated]" style={{ height }} />
      <figcaption className="flex items-center justify-between text-small text-muted num">
        <span>0 Hz</span>
        <span className="h-2.5 w-32 rounded-full" style={{ background: `linear-gradient(90deg, ${t.surface}, ${t["accent-soft"]}, ${t.accent}, ${t.text})` }} aria-hidden />
        <span>{fmtHz(data.maxHz)}</span>
      </figcaption>
    </figure>
  );
}
