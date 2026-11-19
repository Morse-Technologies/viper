"use client";
import { gsap } from "gsap";
import { Check } from "lucide-react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { reduced } from "@/lib/motion";

/**
 * Numbered steps down the side. An ink line fills to the current step; a step that has been passed shows the
 * teal tick Atlas sanctions for first setup, which pops in once. Passed steps can be revisited.
 */
export function Stepper({ steps, current, reached, onPick }: {
  steps: readonly string[]; current: number; reached: number; onPick: (i: number) => void;
}) {
  const fill = useRef<HTMLSpanElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const ticked = useRef(0);

  useLayoutEffect(() => {
    const el = fill.current;
    if (!el) return;
    const to = { scaleY: Math.min(1, current / (steps.length - 1)) };
    if (reduced()) gsap.set(el, to);
    else gsap.to(el, { ...to, duration: 0.5, ease: "power3.out", overwrite: "auto" });
  }, [current, steps.length]);

  useEffect(() => {
    if (reached <= ticked.current) return;
    const fresh = list.current?.querySelector(`[data-tick="${reached - 1}"]`);
    ticked.current = reached;
    if (fresh && !reduced()) gsap.from(fresh, { scale: 0.4, opacity: 0, duration: 0.45, ease: "back.out(2.4)", clearProps: "transform,opacity" });
  }, [reached]);

  return (
    <ol ref={list} className="relative flex flex-col gap-1" aria-label="Progress">
      <span aria-hidden className="absolute top-4 bottom-4 left-[18px] w-px bg-rule" />
      <span ref={fill} aria-hidden className="absolute top-4 bottom-4 left-[18px] w-px origin-top scale-y-0 bg-primary" />
      {steps.map((s, i) => {
        const passed = i < reached && i !== current;
        const open = i <= reached;
        return (
          <li key={s} className="relative">
            <button
              type="button" disabled={!open} onClick={() => onPick(i)}
              aria-current={i === current ? "step" : undefined}
              className={cn("flex w-full items-center gap-3 rounded-control px-1.5 py-1.5 text-left text-body transition-colors duration-[var(--dur-1)]",
                open && i !== current && "hover:bg-raised", i === current ? "text-text font-medium" : open ? "text-text" : "text-muted")}
            >
              <span className={cn("relative grid size-6 flex-none place-items-center rounded-full text-small font-medium num",
                passed ? "bg-accent text-on-accent" : i === current ? "bg-primary text-on-primary" : "border border-control bg-surface text-muted")}>
                {passed ? <Check data-tick={i} className="size-3.5" strokeWidth={2.5} aria-label="Done" /> : i + 1}
              </span>
              <span className="min-w-0">{s}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
