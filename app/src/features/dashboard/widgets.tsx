"use client";
// Every dashboard block is a widget: one definition, one body that adapts to small / medium / big (§22.2).
import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { useAlerts, useCameras, useEdgeDevices, useLabelTasks, useMachines, useModels, useOverview } from "@/features/hooks";
import type { Severity } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { fmtAgo, fmtNum } from "@/lib/format";
import { useGrow } from "@/lib/gsapIn";
import { SEVERITY_ORDER, labelReasonLabel } from "@/lib/labels";
import { CountUp, Dot, Skeleton } from "@/ui/atoms";
import { HealthPill, SeverityGlyph } from "@/ui/cells";
import type { WidgetSize } from "@/ui/organisms/Widgets";

export type WidgetDef = {
  type: string; title: string; description: string; sizes: WidgetSize[]; defaultSize: WidgetSize;
  aside?: ReactNode; Body: (p: { size: WidgetSize }) => ReactNode;
};

const ViewAll = ({ href, children = "View all" }: { href: string; children?: ReactNode }) => (
  <Link href={href} className="text-text underline-offset-4 hover:underline">{children}</Link>
);
const Figure = ({ value, note }: { value: ReactNode; note?: ReactNode }) => (
  <div>
    <p className="text-kpi font-medium tracking-[-0.01em] num"><CountUp value={value} /></p>
    {note && <p className="mt-0.5 truncate text-small text-muted">{note}</p>}
  </div>
);
const Loading = ({ size }: { size: WidgetSize }) =>
  size === "small" ? <Skeleton className="h-9 w-20" /> : <div className="flex flex-col gap-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-4 w-full" />)}</div>;
const rowsFor = (size: WidgetSize) => (size === "big" ? 7 : size === "medium" ? 5 : 1);
const SECONDS_PER_MIN = 60;

/* KPIs ------------------------------------------------------------------------------------------- */
function MachinesWatched() {
  const { data: o } = useOverview();
  return o ? <Figure value={fmtNum(o.machinesWatched)} note="In this plant" /> : <Loading size="small" />;
}
function AlertsOpen() {
  const { data: o } = useOverview();
  return o ? <Figure value={fmtNum(o.alertsOpen)} note={`${o.bySeverity.high} high`} /> : <Loading size="small" />;
}
function QuietSources() {
  const { data: o } = useOverview();
  return o ? <Figure value={fmtNum(o.quietSources)} note="No data for over an hour" /> : <Loading size="small" />;
}
function ActiveModels() {
  const { data: o } = useOverview();
  return o ? <Figure value={fmtNum(o.activeModels)} note={`${o.shadowModels} in shadow`} /> : <Loading size="small" />;
}
function IngestLag() {
  const { data: o } = useOverview();
  return o ? <Figure value={`${Math.round(o.ingestLagSeconds / SECONDS_PER_MIN)} min`} note="Worst cursor lag of the receiving sources" /> : <Loading size="small" />;
}

/* Alerts by severity --------------------------------------------------------------------------------- */
function AlertsBySeverity({ size }: { size: WidgetSize }) {
  const { data: o } = useOverview();
  const { data: alerts } = useAlerts();
  const { data: machines } = useMachines();
  if (!o || !alerts) return <Loading size={size} />;
  const first = (s: Severity) => alerts.find((a) => a.severity === s && a.status === "open");
  const code = (id?: string) => machines?.find((m) => m.id === id)?.code;
  return (
    <ul className="flex flex-col divide-y divide-rule">
      {SEVERITY_ORDER.map((s) => (
        <li key={s} className="flex h-11 items-center gap-3">
          <span className="w-24"><SeverityGlyph severity={s} /></span>
          <span className="w-8 text-section font-medium num">{o.bySeverity[s]}</span>
          {size !== "small" && first(s) && (
            <Link href={`/alerts?id=${first(s)!.id}`} className="min-w-0 flex-1 truncate text-body text-muted hover:text-text">{code(first(s)!.machineId)} · {first(s)!.title}</Link>
          )}
        </li>
      ))}
    </ul>
  );
}

/* Deviating lines: bars in ink, the worst in the screen's one teal ---------------------------------------- */
function DeviatingLines({ size }: { size: WidgetSize }) {
  const { data: o } = useOverview();
  const list = useRef<HTMLUListElement>(null);
  useGrow(list, { selector: "[data-barx]", axis: "x" });
  if (!o) return <Loading size={size} />;
  return (
    <ul ref={list} className="flex flex-col gap-3">
      {o.deviating.slice(0, rowsFor(size)).map((d, i) => (
        <li key={d.line} className="grid grid-cols-[40px_1fr_44px] items-center gap-3 text-body">
          <span className="text-muted">{d.line}</span>
          <span className="h-2.5 rounded-full bg-raised">
            <span data-barx className={cn("block h-full rounded-full", i === 0 ? "bg-accent" : "bg-bar")} style={{ width: `${Math.max(4, d.score * 100)}%` }} />
          </span>
          <span className="text-right num">{d.score.toFixed(2)}</span>
        </li>
      ))}
    </ul>
  );
}

/* Machines at risk ----------------------------------------------------------------------------------- */
function MachinesAtRisk({ size }: { size: WidgetSize }) {
  const { data: machines } = useMachines();
  if (!machines) return <Loading size={size} />;
  const worst = machines.filter((m) => m.healthIndex !== null).sort((a, b) => a.healthIndex! - b.healthIndex!).slice(0, rowsFor(size));
  return (
    <ul className="flex flex-col divide-y divide-rule">
      {worst.map((m) => (
        <li key={m.id}>
          <Link href={`/machines/${m.id}`} className="flex h-10 items-center gap-3 text-body hover:text-muted">
            <span className="w-16 font-medium">{m.code}</span>
            <span className="min-w-0 flex-1 truncate text-muted">{m.name}</span>
            <HealthPill health={m.health} />
            <span className="w-8 text-right num">{m.healthIndex}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* Edge, cameras, labelling, models ------------------------------------------------------------------- */
function EdgeStatus({ size }: { size: WidgetSize }) {
  const { data: o } = useOverview();
  const { data: devices } = useEdgeDevices();
  if (!o || !devices) return <Loading size={size} />;
  const down = devices.filter((d) => d.status !== "online");
  return (
    <div className="flex h-full flex-col gap-3">
      <Figure value={`${o.edge.live}/${o.edge.total}`} note="Edge devices live" />
      {size !== "small" && down.map((d) => (
        <p key={d.id} className="flex items-center gap-2 text-body"><Dot tone="negative" />{d.name}<span className="text-muted">last seen {fmtAgo(d.lastHeartbeatAt)} · {d.queueMb} MB queued</span></p>
      ))}
    </div>
  );
}
function CameraStatus({ size }: { size: WidgetSize }) {
  const { data: o } = useOverview();
  const { data: cams } = useCameras();
  if (!o || !cams) return <Loading size={size} />;
  return (
    <div className="flex h-full flex-col gap-3">
      <Figure value={`${o.cameras.ok}/${o.cameras.total}`} note="Cameras sending frames" />
      {size !== "small" && cams.filter((c) => c.status !== "ok").map((c) => (
        <p key={c.id} className="flex items-center gap-2 text-body"><Dot tone={c.status === "offline" ? "negative" : "warning"} />{c.name}<span className="text-muted">last frame {fmtAgo(c.lastFrameAt)}</span></p>
      ))}
    </div>
  );
}
function Labelling({ size }: { size: WidgetSize }) {
  const { data: o } = useOverview();
  const { data: tasks } = useLabelTasks();
  if (!o || !tasks) return <Loading size={size} />;
  return (
    <div className="flex h-full flex-col gap-3">
      <Figure value={fmtNum(o.labelling.tasks)} note={`${o.labelling.byUncertainty} by uncertainty`} />
      {size !== "small" && tasks.slice(0, rowsFor(size) - 2).map((t) => (
        <p key={t.id} className="truncate text-body"><span className="text-muted">{labelReasonLabel[t.reason]} · </span>{t.why}</p>
      ))}
    </div>
  );
}
function ShadowModels({ size }: { size: WidgetSize }) {
  const { data: models } = useModels();
  if (!models) return <Loading size={size} />;
  const shadow = models.filter((m) => m.versions.some((v) => v.status === "shadow"));
  return (
    <div className="flex h-full flex-col gap-3">
      <Figure value={fmtNum(shadow.length)} note="Candidates running in shadow" />
      {size !== "small" && shadow.map((m) => {
        const v = m.versions.find((x) => x.status === "shadow")!;
        return <p key={m.id} className="flex justify-between text-body"><span>{m.name} {v.version}</span><span className="text-muted num">{Math.round(v.agreement * 100)} % agreement</span></p>;
      })}
    </div>
  );
}
function RecentDrift({ size }: { size: WidgetSize }) {
  const { data: models } = useModels();
  if (!models) return <Loading size={size} />;
  return (
    <ul className="flex flex-col divide-y divide-rule">
      {models.slice(0, rowsFor(size)).map((m) => {
        const last = m.drift.at(-1) ?? 0;
        return (
          <li key={m.id} className="flex h-10 items-center gap-3 text-body">
            <span className="min-w-0 flex-1 truncate">{m.name}</span>
            <span className={cn("num", last > m.driftThreshold ? "text-[var(--pill-warning-ink)]" : "text-muted")}>PSI {last.toFixed(2)}</span>
          </li>
        );
      })}
    </ul>
  );
}

export const WIDGETS: WidgetDef[] = [
  { type: "kpi-machines", title: "Machines watched", description: "How many machines this plant watches.", sizes: ["small"], defaultSize: "small", Body: MachinesWatched },
  { type: "kpi-alerts", title: "Open alerts", description: "Open and acknowledged alerts.", sizes: ["small"], defaultSize: "small", Body: AlertsOpen },
  { type: "kpi-quiet", title: "Quiet sources", description: "Sources with no data for over an hour.", sizes: ["small"], defaultSize: "small", Body: QuietSources },
  { type: "kpi-models", title: "Active models", description: "Models deciding alerts today.", sizes: ["small"], defaultSize: "small", Body: ActiveModels },
  { type: "kpi-lag", title: "Ingest lag", description: "The worst cursor lag of the sources that are receiving.", sizes: ["small"], defaultSize: "small", Body: IngestLag },
  { type: "severity", title: "Alerts by severity", description: "Open alerts per severity, with the first of each.", sizes: ["small", "medium", "big"], defaultSize: "medium", aside: <ViewAll href="/alerts" />, Body: AlertsBySeverity },
  { type: "deviating", title: "Lines deviating most (24 h)", description: "Lines ranked by how far their machines are from healthy.", sizes: ["medium", "big"], defaultSize: "big", Body: DeviatingLines },
  { type: "at-risk", title: "Machines at risk", description: "The lowest health indexes in the plant.", sizes: ["medium", "big"], defaultSize: "medium", aside: <ViewAll href="/machines" />, Body: MachinesAtRisk },
  { type: "edge", title: "Edge", description: "Edge devices live, and the ones that are not.", sizes: ["small", "medium"], defaultSize: "medium", Body: EdgeStatus },
  { type: "cameras", title: "Cameras", description: "Cameras sending frames, and the ones that stopped.", sizes: ["small", "medium"], defaultSize: "medium", aside: <ViewAll href="/vision" />, Body: CameraStatus },
  { type: "labelling", title: "Labelling pending", description: "Tasks waiting for a person, and why.", sizes: ["small", "medium", "big"], defaultSize: "medium", aside: <ViewAll href="/labelling" />, Body: Labelling },
  { type: "shadow", title: "Models in shadow", description: "Candidate versions and how often they agree with the active one.", sizes: ["small", "medium"], defaultSize: "medium", aside: <ViewAll href="/models" />, Body: ShadowModels },
  { type: "drift", title: "Recent drift", description: "Population stability of each model's inputs.", sizes: ["medium", "big"], defaultSize: "medium", Body: RecentDrift },
];

export const widgetByType = (type: string) => WIDGETS.find((w) => w.type === type);
