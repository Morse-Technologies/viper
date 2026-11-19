"use client";
import type { Model } from "@/lib/api/types";
import { fmtDate } from "@/lib/format";
import { modalityLabel, modelStatusLabel } from "@/lib/labels";
import { Pill } from "@/ui/atoms";
import { Card, KeyValues, modalityIcon } from "@/ui/cells";
import { DriftChart } from "./DriftChart";
import { ShadowCompare } from "./ShadowCompare";
import { fmtInterval, modelStatusTone, versionOf } from "./modelHelpers";

function ModelCard({ model, plantName }: { model: Model; plantName: string }) {
  const active = versionOf(model, "active");
  const Icon = modalityIcon[model.modality];
  return (
    <Card id="model-card-h" title={model.name} aside={active?.version} detail>
      <KeyValues rows={[
        { k: "Task", v: model.task },
        { k: "Modality", v: <span className="inline-flex items-center gap-1.5"><Icon className="size-3.5 text-muted" strokeWidth={1.6} />{modalityLabel[model.modality]}</span> },
        { k: "Scope", v: model.scope },
        { k: "Plant", v: plantName },
        { k: "Trained", v: active ? fmtDate(active.trainedAt) : "—" },
        { k: "ONNX", v: model.onnx ? "Yes" : "No" },
      ]} />
      <ul className="mt-4 divide-y divide-rule" aria-label="Version history">
        {model.versions.map((v) => (
          <li key={v.version} className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-body">
            <span className="inline-flex items-center gap-2">
              <span className="font-medium num">{v.version}</span>
              <Pill tone={modelStatusTone[v.status]}>{modelStatusLabel[v.status]}</Pill>
            </span>
            <span className="text-small text-muted">
              P <span className="num text-text">{fmtInterval(v.precision)}</span>
              {" · "}R <span className="num text-text">{fmtInterval(v.recall)}</span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function ModelDetail({ model, plantName }: { model: Model; plantName: string }) {
  const active = versionOf(model, "active");
  const shadow = versionOf(model, "shadow");
  return (
    <div className="flex flex-col gap-5">
      <ModelCard model={model} plantName={plantName} />
      {active && shadow && <ShadowCompare model={model} active={active} shadow={shadow} />}
      <Card id="drift-h" title="Drift" aside="Last 14 checks" detail>
        <DriftChart values={model.drift} threshold={model.driftThreshold} />
      </Card>
    </div>
  );
}
