"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Machine } from "@/lib/api/types";
import { fmtNum } from "@/lib/format";
import { Input } from "@/ui/atoms";
import { EmptyState, ErrorState, HealthPill, LoadingRows, ModalityIcons } from "@/ui/cells";
import { matchesMachine } from "./pick";

export function MachineList({
  machines, selectedId, pending, error, onRetry,
}: {
  machines: Machine[] | undefined; selectedId: string | undefined;
  pending: boolean; error: boolean; onRetry: () => void;
}) {
  const [q, setQ] = useState("");
  const list = useMemo(() => (machines ?? []).filter((m) => matchesMachine(m, q)), [machines, q]);
  return (
    <>
      <div className="flex flex-col gap-3 border-b border-border px-4 pt-5 pb-3 md:px-5">
        <h1 className="text-title font-medium">Machines</h1>
        <Input
          type="search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search machine…" aria-label="Search machine"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto md:h-[calc((100dvh-66px)/var(--content-zoom)-104px)]">
        {pending ? <div className="px-4"><LoadingRows rows={8} pitch="h-12" /></div>
          : error ? <div className="p-4"><ErrorState what="machines" onRetry={onRetry} /></div>
          : list.length === 0 ? <div className="p-4"><EmptyState>No machine matches that search.</EmptyState></div>
          : <ul className="divide-y divide-rule">{list.map((m) => (
            <MachineRow key={m.id} machine={m} selected={m.id === selectedId} />
          ))}</ul>}
      </div>
    </>
  );
}

function MachineRow({ machine: m, selected }: { machine: Machine; selected: boolean }) {
  const index = m.healthIndex === null ? "—" : fmtNum(m.healthIndex);
  return (
    <li>
      <Link
        href={`/machines/${m.id}`}
        className={`flex items-center gap-2 px-4 py-2.5 text-body transition-colors duration-[var(--dur-1)] hover:bg-raised md:px-5 ${selected ? "bg-active" : ""}`}
      >
        <span className="w-16 flex-none font-medium">{m.code}</span>
        <HealthPill health={m.health} />
        <span className="w-8 flex-none text-right num">{index}</span>
        <span className="min-w-0 flex-1 truncate text-muted">{m.line}</span>
        <ModalityIcons modalities={m.modalities} className="flex-none" />
      </Link>
    </li>
  );
}
