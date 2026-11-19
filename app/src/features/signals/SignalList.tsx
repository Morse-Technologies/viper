"use client";
import { Search } from "lucide-react";
import type { Id, Signal } from "@/lib/api/types";
import { Checkbox, Input } from "@/ui/atoms";
import { MAX_SIGNALS } from "./agg";

type Group = { code: string; signals: Signal[] };

export function SignalList({
  query, onQuery, groups, selected, onToggle,
}: {
  query: string;
  onQuery: (q: string) => void;
  groups: Group[];
  selected: Id[];
  onToggle: (id: Id) => void;
}) {
  const atMax = selected.length >= MAX_SIGNALS;
  return (
    <>
      <div className="flex flex-col gap-3 border-b border-border px-4 pt-6 pb-4 md:px-5">
        <h1 className="text-title font-medium tracking-[-0.01em]">Signals</h1>
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search signals"
            aria-label="Search signals"
            className="pl-9"
          />
        </div>
        {atMax && <p className="text-small text-muted">Up to 8 signals</p>}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto md:h-[calc((100dvh-66px)/var(--content-zoom)-120px)]">
        <ul className="pb-4">
          {groups.map((g) => (
            <MachineGroup key={g.code} group={g} selected={selected} atMax={atMax} onToggle={onToggle} />
          ))}
        </ul>
      </div>
    </>
  );
}

function MachineGroup({
  group, selected, atMax, onToggle,
}: {
  group: Group; selected: Id[]; atMax: boolean; onToggle: (id: Id) => void;
}) {
  return (
    <li>
      <section aria-label={group.code}>
        <h2 className="sticky top-0 z-10 border-b border-border bg-active/60 px-4 py-2 text-small font-medium md:px-5">
          {group.code}
        </h2>
        <ul className="divide-y divide-rule">
          {group.signals.map((s) => {
            const on = selected.includes(s.id);
            return (
              <li key={s.id}>
                <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 md:px-5">
                  <Checkbox
                    checked={on}
                    disabled={atMax && !on}
                    onCheckedChange={() => onToggle(s.id)}
                    aria-label={`${s.name} (${s.unit})`}
                  />
                  <span className="min-w-0 truncate text-body">
                    {s.name} <span className="text-muted">({s.unit})</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>
    </li>
  );
}
