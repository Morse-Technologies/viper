"use client";
import { toast } from "sonner";
import type { Model, ModelVersion } from "@/lib/api/types";
import { fmtNum } from "@/lib/format";
import { HoldButton } from "@/ui/atoms";
import { Card, KeyValues } from "@/ui/cells";
import { fmtInterval, shadowVerdict } from "./modelHelpers";

function column(title: string, v: ModelVersion) {
  return (
    <div>
      <p className="text-body font-medium">{title}</p>
      <KeyValues rows={[
        { k: "Alerts on same windows", v: <span className="num">{fmtNum(v.alertsWouldOpen)}</span> },
        { k: "Agreement with labels", v: <span className="num">{Math.round(v.agreement * 100)}%</span> },
        { k: "Precision", v: <span className="num">{fmtInterval(v.precision)}</span> },
        { k: "Recall", v: <span className="num">{fmtInterval(v.recall)}</span> },
      ]} />
    </div>
  );
}

function promoteToast(name: string, version: string) {
  toast.success(`Promoted ${name} ${version} to active`, {
    action: { label: "Undo", onClick: () => toast("Promotion undone. Active version unchanged.") },
  });
}

function revertToast(name: string, version: string) {
  toast.success(`Reverted ${name}; ${version} stays in shadow`, {
    action: { label: "Undo", onClick: () => toast("Revert undone.") },
  });
}

export function ShadowCompare({ model, active, shadow }: {
  model: Model; active: ModelVersion; shadow: ModelVersion;
}) {
  return (
    <Card id="shadow-h" title="Shadow comparison" aside={`${active.version} vs ${shadow.version}`}>
      <div className="grid gap-6 sm:grid-cols-2">
        {column("Active", active)}
        {column("Candidate", shadow)}
      </div>
      <p className="mt-4 text-body">{shadowVerdict(active, shadow)}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <HoldButton
          variant="primary"
          doneLabel="Promoted"
          onConfirm={() => promoteToast(model.name, shadow.version)}
        >
          Hold to promote
        </HoldButton>
        <HoldButton
          variant="outline"
          doneLabel="Reverted"
          onConfirm={() => revertToast(model.name, shadow.version)}
        >
          Hold to revert
        </HoldButton>
      </div>
      <p className="mt-2 text-small text-muted">Needs a recent TOTP code. Maintainer action.</p>
    </Card>
  );
}
