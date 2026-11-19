"use client";
import { useModels } from "@/features/hooks";
import type { Model } from "@/lib/api/types";
import { fmtNum } from "@/lib/format";
import { EmptyState, LoadingRows } from "@/ui/cells";
import { activeVersion, hasLiveVersion, shadowVersion } from "./pick";

export function ModelsTab() {
  const models = useModels();
  if (models.isPending) return <LoadingRows rows={5} pitch="h-14" />;
  const live = (models.data ?? []).filter(hasLiveVersion);
  if (!live.length) return <EmptyState>No active or shadow models for this plant.</EmptyState>;
  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <table className="w-full min-w-[560px] text-left text-body">
        <thead className="border-b border-rule text-small text-muted">
          <tr>
            <th className="px-4 py-2.5 font-medium">Model</th>
            <th className="px-4 py-2.5 font-medium">Active</th>
            <th className="px-4 py-2.5 font-medium">Shadow</th>
            <th className="px-4 py-2.5 font-medium">Drift</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {live.map((m) => <ModelRow key={m.id} model={m} />)}
        </tbody>
      </table>
    </div>
  );
}

function ModelRow({ model: m }: { model: Model }) {
  const active = activeVersion(m);
  const shadow = shadowVersion(m);
  const last = m.drift[m.drift.length - 1];
  return (
    <tr>
      <td className="px-4 py-3 font-medium">{m.name}</td>
      <td className="px-4 py-3 num">{active?.version ?? "—"}</td>
      <td className="px-4 py-3 num">{shadow?.version ?? "—"}</td>
      <td className="px-4 py-3 text-muted">
        {last === undefined
          ? "—"
          : <><span className="num text-text">{fmtNum(last)}</span> / {fmtNum(m.driftThreshold)}</>}
      </td>
    </tr>
  );
}
