"use client";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { useGrow } from "@/lib/gsapIn";
import { fmtNum } from "@/lib/format";

const CHART_HEIGHT_PX = 96;
const MIN_SCALE = 0.01;

/** Fourteen drift points as bars; dashed threshold; latest bar is the screen's one teal. */
export function DriftChart({ values, threshold }: { values: number[]; threshold: number }) {
  const list = useRef<HTMLDivElement>(null);
  useGrow(list, { selector: "[data-bary]", axis: "y" });
  const peak = Math.max(...values, threshold, MIN_SCALE);
  const thresholdPct = (threshold / peak) * 100;
  const latest = values.at(-1) ?? 0;

  return (
    <div>
      <div
        ref={list}
        className="relative flex items-end gap-1"
        style={{ height: CHART_HEIGHT_PX }}
        role="img"
        aria-label={`Drift over ${values.length} points; latest ${latest.toFixed(3)}; threshold ${threshold.toFixed(2)}`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-[var(--pill-warning-ink)]"
          style={{ bottom: `${thresholdPct}%` }}
        />
        {values.map((v, i) => (
          <div key={i} className="flex h-full flex-1 items-end">
            <div
              data-bary
              className={cn(
                "w-full origin-bottom rounded-[2px]",
                i === values.length - 1 ? "bg-accent" : "bg-[var(--bar)]",
              )}
              style={{ height: `${(v / peak) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <p className="mt-2 text-small text-muted">
        Latest <span className="num text-text">{latest.toFixed(3)}</span>
        {" · "}threshold <span className="num">{fmtNum(threshold)}</span>
      </p>
    </div>
  );
}
