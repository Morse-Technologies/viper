import { cn } from "@/lib/cn";

const W = 100;
const H = 24;

/** A small trend line in ink (`--bar`), for health over seven days. Nothing drawn without data. */
export function Sparkline({ values, className, label }: { values: number[]; className?: string; label?: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * W},${H - ((v - min) / span) * (H - 2) - 1}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label} className={cn("h-6 w-24", className)}>
      <polyline points={pts} fill="none" stroke="var(--bar)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}
