"use client";
import type { Model } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { modalityLabel } from "@/lib/labels";
import { Pill, Sparkline } from "@/ui/atoms";
import { modalityIcon } from "@/ui/cells";
import { isDrifting, lastDrift, versionOf } from "./modelHelpers";

export function ModelRegistry({ models, selectedId, onSelect }: {
  models: Model[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-body">
        <caption className="sr-only">Model registry</caption>
        <thead>
          <tr className="border-b border-border text-left text-small text-muted">
            <th scope="col" className="h-10 pl-5 pr-3 font-normal">Name</th>
            <th scope="col" className="h-10 pr-3 font-normal">Task</th>
            <th scope="col" className="h-10 pr-3 font-normal">Modality</th>
            <th scope="col" className="h-10 pr-3 font-normal">Scope</th>
            <th scope="col" className="h-10 pr-3 font-normal">Active</th>
            <th scope="col" className="h-10 pr-3 font-normal">Shadow</th>
            <th scope="col" className="h-10 pr-3 font-normal">Drift</th>
            <th scope="col" className="h-10 pr-5 font-normal">ONNX</th>
          </tr>
        </thead>
        <tbody>
          {models.map((m) => (
            <ModelRow
              key={m.id}
              model={m}
              selected={m.id === selectedId}
              onSelect={() => onSelect(m.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ModelRow({ model, selected, onSelect }: {
  model: Model; selected: boolean; onSelect: () => void;
}) {
  const Icon = modalityIcon[model.modality];
  const active = versionOf(model, "active");
  const shadow = versionOf(model, "shadow");
  const drift = lastDrift(model);
  const drifting = isDrifting(model);

  return (
    <tr
      className={cn(
        "cursor-pointer border-b border-rule transition-colors duration-[var(--dur-1)]",
        selected ? "bg-active" : "hover:bg-raised/60",
      )}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); }
      }}
      tabIndex={0}
      aria-selected={selected}
    >
      <td className="py-3 pl-5 pr-3 font-medium">{model.name}</td>
      <td className="py-3 pr-3 text-muted">{model.task}</td>
      <td className="py-3 pr-3">
        <span className="inline-flex items-center gap-1.5">
          <Icon className="size-3.5 text-muted" strokeWidth={1.6} aria-hidden />
          {modalityLabel[model.modality]}
        </span>
      </td>
      <td className="max-w-[10rem] truncate py-3 pr-3 text-muted">{model.scope}</td>
      <td className="py-3 pr-3 num">{active?.version ?? "—"}</td>
      <td className="py-3 pr-3 num text-muted">{shadow?.version ?? "—"}</td>
      <td className="py-3 pr-3">
        <span className="inline-flex items-center gap-2">
          <Sparkline values={model.drift} label={`Drift for ${model.name}`} />
          <span className="num">{drift.toFixed(2)}</span>
          {drifting && <Pill tone="warning">Drifting</Pill>}
        </span>
      </td>
      <td className="py-3 pr-5 text-muted">{model.onnx ? "Yes" : "No"}</td>
    </tr>
  );
}
