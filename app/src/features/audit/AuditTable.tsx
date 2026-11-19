"use client";
import { gsap } from "gsap";
import { Clock3, Lock } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import type { AuditEvent } from "@/lib/api/types";
import { fmtDayMonth, fmtTime } from "@/lib/format";
import { auditActionLabel } from "@/lib/labels";
import { reduced } from "@/lib/motion";
import { Avatar } from "@/ui/atoms";

const MAX_STAGGER_ROWS = 24;

/** Newest first. A row opens the entry; the seal column says whether tonight's anchor still has to cover it. */
export function AuditTable({ rows, filterKey, onOpen }: { rows: AuditEvent[]; filterKey: string; onOpen: (e: AuditEvent) => void }) {
  const body = useRef<HTMLTableSectionElement>(null);

  // A new filter settles the rows in from just above, quickly; reading must never wait on it.
  useLayoutEffect(() => {
    const el = body.current;
    if (!el || reduced()) return;
    const ctx = gsap.context(() => {
      gsap.from(Array.from(el.children).slice(0, MAX_STAGGER_ROWS), { y: -4, opacity: 0, duration: 0.3, ease: "power2.out", stagger: 0.012, clearProps: "transform,opacity" });
    }, el);
    return () => ctx.revert();
  }, [filterKey]);

  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <table className="w-full min-w-[920px] text-left text-body">
        <thead className="border-b border-rule text-small text-muted">
          <tr>
            <th className="w-28 px-4 py-2.5 font-medium">When</th>
            <th className="px-4 py-2.5 font-medium">Who</th>
            <th className="px-4 py-2.5 font-medium">Action</th>
            <th className="px-4 py-2.5 font-medium">Object</th>
            <th className="px-4 py-2.5 font-medium">Detail</th>
            <th className="w-36 px-4 py-2.5 font-medium">Entry</th>
          </tr>
        </thead>
        <tbody ref={body} className="divide-y divide-rule">
          {rows.map((e) => (
            <tr
              key={e.id} tabIndex={0} onClick={() => onOpen(e)}
              onKeyDown={(k) => { if (k.key === "Enter" || k.key === " ") { k.preventDefault(); onOpen(e); } }}
              className="cursor-pointer transition-colors duration-[var(--dur-1)] hover:bg-raised focus-visible:bg-raised focus-visible:outline-none"
            >
              <td className="px-4 py-2.5 whitespace-nowrap num">
                {fmtDayMonth(e.at)} <span className="text-muted">{fmtTime(e.at)}</span>
              </td>
              <td className="px-4 py-2.5">
                <span className="inline-flex items-center gap-2 whitespace-nowrap">
                  {e.actorId ? <Avatar name={e.actor} size={20} /> : <span aria-hidden className="grid size-5 place-items-center rounded-full border border-control text-[10px] text-muted">V</span>}
                  {e.actor}
                </span>
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap">{auditActionLabel[e.action]}</td>
              <td className="max-w-[240px] truncate px-4 py-2.5">{e.object}</td>
              <td className="max-w-[300px] truncate px-4 py-2.5 text-muted">{e.detail}</td>
              <td className="px-4 py-2.5 whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5 text-small text-muted" title={e.anchored ? "Sealed by an anchor" : "Waiting for the next anchor"}>
                  {e.anchored ? <Lock className="size-3.5" aria-label="Sealed" /> : <Clock3 className="size-3.5" aria-label="Waiting for anchor" />}
                  <span className="num">#{e.seq}</span>
                  <code className="font-mono">{e.hash.slice(0, 8)}</code>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
