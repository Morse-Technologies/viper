"use client";
import { useMemo } from "react";
import {
  useAlerts, useModels, useSeries, useSignals,
} from "@/features/hooks";
import type { Machine, Model } from "@/lib/api/types";
import { fmtNum, plural } from "@/lib/format";
import { modalityLabel, operatingLabel } from "@/lib/labels";
import { CountUp, Sparkline } from "@/ui/atoms";
import { Card, EvidenceChip, HealthPill, KeyValues, ModalityIcons } from "@/ui/cells";
import { SignalChart } from "@/ui/organisms/SignalChart";
import {
  activeVersion, degradationSentence, evidenceFromAlerts, modelFitsKind, openAlertCount,
} from "./pick";
import { CHART_HEIGHT, TREND_LABEL } from "./tabs";

export function SummaryTab({ machine }: { machine: Machine }) {
  const signals = useSignals(machine.id);
  const alerts = useAlerts();
  const models = useModels();
  const first = signals.data?.[0] ?? null;
  const series = useSeries(first?.id ?? null, "24h");
  const open = openAlertCount(alerts.data ?? [], machine.id);
  const evidence = useMemo(
    () => evidenceFromAlerts(alerts.data ?? [], machine.id).slice(0, 8),
    [alerts.data, machine.id],
  );
  const active = (models.data ?? [])
    .filter((m) => modelFitsKind(m, machine.kind) && activeVersion(m))
    .map((m) => formatActiveModel(m));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
        <HealthCard machine={machine} open={open} models={active} />
        {first && series.data ? (
          <div>
            <p className="mb-2 text-body font-medium">{first.name} ({first.unit}) · last 24 h</p>
            <SignalChart
              series={series.data} unit={first.unit} warn={first.warn} alarm={first.alarm}
              selected height={CHART_HEIGHT} label={first.name}
            />
          </div>
        ) : null}
      </div>
      {evidence.length > 0 && (
        <section aria-labelledby="evidence-h">
          <h2 id="evidence-h" className="mb-2 text-section font-medium">Recent evidence</h2>
          <ul className="flex flex-wrap gap-2">
            {evidence.map((e) => <li key={e.id}><EvidenceChip evidence={e} /></li>)}
          </ul>
        </section>
      )}
    </div>
  );
}

function formatActiveModel(m: Model): string {
  const v = activeVersion(m);
  return v ? `${m.name} ${v.version}` : m.name;
}

function HealthCard({
  machine: m, open, models,
}: {
  machine: Machine; open: number; models: string[];
}) {
  const index = m.healthIndex;
  return (
    <Card id="health-h" title="Health index" detail>
      {index === null
        ? <p className="text-kpi font-medium text-muted">Not enough data</p>
        : <p className="text-kpi font-medium num"><CountUp value={index} /></p>}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <HealthPill health={m.health} />
        {m.healthTrend.length > 0 && (
          <Sparkline values={m.healthTrend} label={TREND_LABEL} className="h-6 w-24" />
        )}
        {m.healthTrend.length > 0 && <span className="text-small text-muted">{TREND_LABEL}</span>}
      </div>
      <div className="mt-3">
        <KeyValues rows={[
          { k: "Operating", v: operatingLabel[m.operating] },
          { k: "Open alerts", v: <span className="num">{plural(open, "alert")}</span> },
          { k: "Modalities", v: (
            <span className="inline-flex items-center gap-2">
              <ModalityIcons modalities={m.modalities} />
              <span className="text-muted">{m.modalities.map((x) => modalityLabel[x]).join(", ")}</span>
            </span>
          ) },
          { k: "Active models", v: models.length ? models.join(", ") : "None" },
        ]} />
      </div>
      {m.degradation && (
        <p className="mt-3 text-body text-muted">{degradationSentence(m.degradation.warnInDays)}</p>
      )}
      {index !== null && <p className="sr-only">Health index {fmtNum(index)}</p>}
    </Card>
  );
}
