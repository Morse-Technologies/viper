"use client";
import { CountUp } from "@/ui/atoms/CountUp";
import Link from "next/link";
import { useRef } from "react";
import { useGrow } from "@/lib/gsapIn";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { fmtNum } from "@/lib/format";

/** KPIs as type in one container split by hairlines; no tiles, no icons, no sparklines. */
export function KpiStrip({ items, className }: {
  items: { label: string; value: ReactNode; note?: ReactNode; href?: string }[];
  className?: string;
}) {
  return (
    <dl className={cn("grid divide-rule rounded-card border border-border bg-surface sm:divide-x", className)}
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(160px, 1fr))` }}>
      {items.map((k) => {
        const body = (
          <>
            <dt className="text-small text-muted">{k.label}</dt>
            <dd className="mt-1 text-kpi font-medium tracking-[-0.01em] num"><CountUp value={k.value} /></dd>
            {k.note && <dd className="mt-0.5 text-small text-muted">{k.note}</dd>}
          </>
        );
        return (
          <div key={k.label} className="border-rule px-5 py-4 max-sm:border-b">
            {k.href ? (
              <Link href={k.href} className="block rounded-control outline-offset-4 transition-opacity hover:opacity-80">{body}</Link>
            ) : body}
          </div>
        );
      })}
    </dl>
  );
}

/** A one-figure ranking: thin grey bars, the top item in ink. */
export function BarList({ rows, unit }: { rows: { label: ReactNode; value: number; href?: string }[]; unit?: string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  const list = useRef<HTMLUListElement>(null);
  useGrow(list, { selector: "[data-barx]", axis: "x" });
  return (
    <ul ref={list} className="flex flex-col gap-3">
      {rows.map((r, i) => (
        <li key={i}>
          <div className="flex items-baseline justify-between gap-4 text-body">
            <span className="truncate">{r.label}</span>
            <span className="text-muted num">{fmtNum(r.value)}{unit && <span className="sr-only"> {unit}</span>}</span>
          </div>
          <div className="mt-1.5 h-[3px] rounded-full bg-rule">
            <div
              data-barx className={cn("h-full origin-left rounded-full", i === 0 ? "bg-[var(--bar)]" : "bg-faint/60")}
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Key-value rows for object details. */
export function KeyValues({ rows }: { rows: { k: ReactNode; v: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-rule">
      {rows.map((r, i) => (
        <div key={i} className="flex min-h-8 items-baseline justify-between gap-4 py-1.5 text-body">
          <dt className="text-muted">{r.k}</dt>
          <dd className="min-w-0 text-right">{r.v}</dd>
        </div>
      ))}
    </dl>
  );
}
