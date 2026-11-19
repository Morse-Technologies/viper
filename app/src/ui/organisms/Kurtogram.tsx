"use client";
import { gsap } from "gsap";
import { useLayoutEffect, useRef } from "react";
import type { Kurtogram as KurtogramData } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { fmtHz } from "@/lib/format";
import { reduced } from "@/lib/motion";

const FLOOR = 3; // a Gaussian signal has kurtosis 3: nothing impulsive below it

/**
 * Spectral kurtosis by level, in ink: the darker the cell, the more impulsive that band. The chosen band
 * carries an ink ring; rows fill in from the widest band down.
 */
export function Kurtogram({ data, selected, onSelect }: {
  data: KurtogramData; selected: { level: number; index: number } | null; onSelect: (level: number, index: number) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const top = Math.max(...data.levels.flat());
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || reduced()) return;
    const ctx = gsap.context(() => {
      gsap.from(el.querySelectorAll("[data-row]"), { opacity: 0, y: -4, duration: 0.35, ease: "power2.out", stagger: 0.06, clearProps: "transform,opacity" });
    }, el);
    return () => ctx.revert();
  }, [data]);
  return (
    <figure className="flex flex-col gap-2">
      <div ref={root} className="flex flex-col gap-0.5" role="group" aria-label="Kurtogram: choose the envelope band">
        {data.levels.map((row, level) => (
          <div key={level} data-row className="flex items-stretch gap-2">
            <span className="w-14 flex-none text-small text-muted num">Level {level}</span>
            <div className="flex h-6 flex-1 gap-px">
              {row.map((k, index) => {
                const width = data.maxHz / row.length;
                const on = selected?.level === level && selected.index === index;
                const share = Math.max(0, Math.min(1, (k - FLOOR) / (top - FLOOR)));
                return (
                  <button
                    key={index} type="button" onClick={() => onSelect(level, index)}
                    aria-pressed={on}
                    aria-label={`${fmtHz(index * width)} to ${fmtHz((index + 1) * width)}, kurtosis ${k}`}
                    title={`${fmtHz(index * width)} – ${fmtHz((index + 1) * width)} · kurtosis ${k}`}
                    style={{ background: `color-mix(in srgb, var(--text) ${Math.round(6 + share * 82)}%, var(--raised))` }}
                    className={cn("min-w-0 flex-1 rounded-[2px] transition-shadow duration-[var(--dur-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-control",
                      on && "relative z-10 ring-2 ring-primary ring-offset-2 ring-offset-surface")}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <figcaption className="ml-16 flex justify-between text-small text-muted num">
        <span>0 Hz</span><span>{fmtHz(data.maxHz / 2)}</span><span>{fmtHz(data.maxHz)}</span>
      </figcaption>
    </figure>
  );
}
