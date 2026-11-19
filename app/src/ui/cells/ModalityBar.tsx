"use client";
import { useRef } from "react";
import type { Modality } from "@/lib/api/types";
import { useGrow } from "@/lib/gsapIn";
import { modalityLabel } from "@/lib/labels";
import { modalityIcon } from "./Domain";

/** Grey ink tones only: a fused alert's evidence must never borrow a band or status colour (§21.4). */
const INKS = ["bg-bar", "bg-muted", "bg-faint", "bg-control"];

/** How much each modality contributed to a fused alert: one horizontal bar, then a legend with icons and shares. */
export function ModalityBar({ parts }: { parts: { modality: Modality; share: number }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useGrow(ref, { selector: "[data-barx]", axis: "x" });
  return (
    <div ref={ref} className="flex flex-col gap-2">
      <div className="flex h-2.5 overflow-hidden rounded-full bg-raised" role="img" aria-label={parts.map((p) => `${modalityLabel[p.modality]} ${p.share} %`).join(", ")}>
        {parts.map((p, i) => <span key={p.modality} data-barx className={INKS[i % INKS.length]} style={{ width: `${p.share}%` }} />)}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-small text-muted">
        {parts.map((p, i) => {
          const Icon = modalityIcon[p.modality];
          return (
            <li key={p.modality} className="inline-flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${INKS[i % INKS.length]}`} aria-hidden /><Icon className="size-3.5" strokeWidth={1.6} />
              {modalityLabel[p.modality]} <span className="text-text num">{p.share} %</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
