"use client";
import { useRef, type KeyboardEvent } from "react";
import { useGlide } from "@/lib/gsapIn";
import { cn } from "@/lib/cn";

/** Tabs with a 2px ink underline that slides to the active tab (parenting: the line belongs to the row). */
export function Tabs<T extends string>({ tabs, value, onChange, label, className }: {
  tabs: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string; className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const line = useRef<HTMLSpanElement>(null);
  const index = tabs.findIndex((t) => t.value === value);
  useGlide(line, () => {
    const el = refs.current[index];
    return el ? { x: el.offsetLeft, width: el.offsetWidth } : null;
  }, [index, tabs.length]);
  const onKey = (e: KeyboardEvent) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    const next = (index + step + tabs.length) % tabs.length;
    onChange(tabs[next].value);
    refs.current[next]?.focus();
  };
  return (
    <div role="tablist" aria-label={label} onKeyDown={onKey} className={cn("relative flex gap-5 overflow-x-auto border-b border-rule", className)}>
      {tabs.map((t, i) => (
        <button
          key={t.value} ref={(el) => { refs.current[i] = el; }} type="button" role="tab" id={`tab-${t.value}`}
          aria-selected={i === index} tabIndex={i === index ? 0 : -1} onClick={() => onChange(t.value)}
          className={cn("h-10 flex-none text-body whitespace-nowrap transition-colors duration-[var(--dur-1)]", i === index ? "text-text" : "text-muted hover:text-text")}
        >
          {t.label}
        </button>
      ))}
      <span ref={line} aria-hidden className="pointer-events-none absolute bottom-0 left-0 h-0.5 rounded-full bg-text opacity-0" />
    </div>
  );
}
