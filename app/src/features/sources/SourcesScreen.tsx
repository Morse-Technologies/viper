"use client";
import {
  Activity, Camera, FolderInput, Globe, Plus, Radio, RadioTower, Server,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CommissionSheet } from "@/features/commissioning/CommissionSheet";
import { toast } from "sonner";
import { useEdgeDevices, useMachines, useSources } from "@/features/hooks";
import type { EdgeDevice, Source, SourceKind } from "@/lib/api/types";
import { fmtAgo, fmtNum } from "@/lib/format";
import { linkLabel, sourceKindLabel, sourceStatusLabel } from "@/lib/labels";
import { Button, Dot, Input, Select, type Tone } from "@/ui/atoms";
import { Card, ErrorState, Field, LoadingRows, PageHeader, Sheet } from "@/ui/cells";
import { Canvas } from "@/ui/templates/ShellLayout";
import { fmtLag } from "./fmtLag";

const KIND_ICON: Record<SourceKind, typeof FolderInput> = {
  folder: FolderInput, opcua: RadioTower, mqtt: Radio, api: Globe, camera: Camera, edge: Server,
};

const STATUS_TONE: Record<Source["status"], Tone> = {
  ok: "positive", lagging: "warning", quiet: "negative", quarantined: "warning",
};

const LINK_TONE = { online: "positive", degraded: "warning", offline: "negative" } as const satisfies Record<string, Tone>;

export function SourcesScreen() {
  const sources = useSources();
  const edges = useEdgeDevices();
  const [adding, setAdding] = useState(false);
  const params = useSearchParams();
  const router = useRouter();
  // `?commission` opens the wizard (from a link or the palette); `?commission=<machine id>` starts on that machine.
  const commission = params.get("commission");
  const setCommission = (o: boolean) => router.replace(o ? "/sources?commission=1" : "/sources", { scroll: false });

  return (
    <Canvas>
      <PageHeader
        title="Sources"
        subline={sourcesSubline(sources.data, edges.data)}
        actions={(
          <>
            <Button variant="outline" onClick={() => setCommission(true)}><Activity />Commission a point</Button>
            <Button variant="primary" onClick={() => setAdding(true)}><Plus />Add source</Button>
          </>
        )}
      />
      <div className="mt-6 flex flex-col gap-6">
      {sources.isPending ? <LoadingRows rows={5} pitch="h-12" />
        : sources.isError ? <ErrorState what="sources" onRetry={() => sources.refetch()} />
          : <SourcesTable rows={sources.data ?? []} />}
      <Card id="edge-h" title="Edge devices" aside={edges.data ? `${edges.data.length} devices` : undefined}>
        {edges.isPending ? <LoadingRows rows={4} pitch="h-16" />
          : edges.isError ? <ErrorState what="edge devices" onRetry={() => edges.refetch()} />
            : <EdgeGrid />}
      </Card>
      </div>
      <AddSourceSheet open={adding} onOpenChange={setAdding} />
      <CommissionSheet open={commission !== null} onOpenChange={setCommission} machineId={commission && commission !== "1" ? commission : undefined} />
    </Canvas>
  );
}

/** One sentence carrying the finding: what is silent, what is offline. */
function sourcesSubline(sources?: Source[], edges?: EdgeDevice[]): string {
  if (!sources || !edges) return "Data sources and edge devices for this plant.";
  const quiet = sources.filter((s) => s.status === "quiet").length;
  const live = edges.filter((d) => d.status === "online").length;
  const head = quiet ? `${quiet} of ${sources.length} sources quiet` : `All ${sources.length} sources receiving`;
  return `${head}; ${live} of ${edges.length} edge devices online.`;
}

function SourcesTable({ rows }: { rows: Source[] }) {
  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <table className="w-full min-w-[640px] text-left text-body">
        <thead className="border-b border-rule text-small text-muted">
          <tr>
            <th className="px-4 py-2.5 font-medium">Kind</th>
            <th className="px-4 py-2.5 font-medium">Name</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="px-4 py-2.5 font-medium">Cursor lag</th>
            <th className="px-4 py-2.5 font-medium">Machines</th>
            <th className="px-4 py-2.5 font-medium">Quarantine</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {rows.map((s) => {
            const Icon = KIND_ICON[s.kind];
            return (
              <tr key={s.id}>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <Icon className="size-4 text-muted" strokeWidth={1.8} />
                    {sourceKindLabel[s.kind]}
                  </span>
                </td>
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5">
                    <Dot tone={STATUS_TONE[s.status]} />
                    {sourceStatusLabel[s.status]}
                  </span>
                </td>
                <td className="px-4 py-3 num">{fmtLag(s.lagSeconds)}</td>
                <td className="px-4 py-3 num">{fmtNum(s.machineIds.length)}</td>
                <td className="px-4 py-3 num">{fmtNum(s.quarantined)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EdgeGrid() {
  const { data } = useEdgeDevices();
  if (!data?.length) return null;
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((d) => (
        <li key={d.id} className="rounded-card border border-border bg-raised px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{d.name}</span>
            <span className="inline-flex items-center gap-1.5 text-small text-muted">
              <Dot tone={LINK_TONE[d.status]} />{linkLabel[d.status]}
            </span>
          </div>
          <p className="mt-1 text-small text-muted">Last heartbeat {fmtAgo(d.lastHeartbeatAt)}</p>
          <p className="mt-0.5 text-small text-muted">{d.firmware} · {d.agent}</p>
          <p className="mt-1 text-small">Queue <span className="num">{fmtNum(d.queueMb)}</span> MB</p>
        </li>
      ))}
    </ul>
  );
}

function AddSourceSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data: machines } = useMachines();
  const [machineId, setMachineId] = useState("");
  const [kind, setKind] = useState<SourceKind>("folder");
  const [address, setAddress] = useState("");
  const kinds = Object.keys(sourceKindLabel) as SourceKind[];
  const canFinish = !!machineId && !!address.trim();

  const finish = () => {
    toast.success("Source added (mock)");
    onOpenChange(false);
    setMachineId("");
    setKind("folder");
    setAddress("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Add source" description="A source must attach to a machine that already exists.">
      <div className="flex flex-col gap-4 px-5 py-4">
        <Field label="Machine" help="Choose the machine first. ADR-V20: no orphan sources.">
          {({ id }) => (
            <Select id={id} value={machineId} onChange={(e) => setMachineId(e.target.value)} className="h-10">
              <option value="">Select a machine…</option>
              {(machines ?? []).map((m) => (
                <option key={m.id} value={m.id}>{m.code} · {m.name}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Kind">
          {({ id }) => (
            <Select id={id} value={kind} onChange={(e) => setKind(e.target.value as SourceKind)} className="h-10" disabled={!machineId}>
              {kinds.map((k) => <option key={k} value={k}>{sourceKindLabel[k]}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Address">
          {({ id }) => (
            <Input
              id={id} value={address} onChange={(e) => setAddress(e.target.value)}
              placeholder="Path, URL or endpoint" disabled={!machineId}
            />
          )}
        </Field>
      </div>
      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-rule bg-surface px-5 py-4">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button variant="primary" disabled={!canFinish} onClick={finish}>Add source</Button>
      </div>
    </Sheet>
  );
}
