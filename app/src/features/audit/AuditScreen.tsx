"use client";
import { Download, Lock } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAudit, useExportAudit, useLicense, useUsers, useVerifyAudit } from "@/features/hooks";
import type { AuditEvent, AuditObjectKind } from "@/lib/api/types";
import { MOCK_NOW } from "@/lib/clock";
import { fmtDate, fmtNum, fmtTime, plural } from "@/lib/format";
import { useEnter } from "@/lib/gsapIn";
import { auditActionLabel, auditObjectLabel } from "@/lib/labels";
import { Button, Input, Pill, Select } from "@/ui/atoms";
import { EmptyState, ErrorState, KeyValues, LoadingRows, LoadMore, PageHeader, Segmented, Sheet } from "@/ui/cells";
import { Canvas } from "@/ui/templates/ShellLayout";
import { AuditTable } from "./AuditTable";
import { ChainStatus } from "./ChainStatus";
import { SYSTEM_ACTOR, filterAudit, type AuditFilter, type AuditRange } from "./filter";

const PAGE = 40;
const RANGES: { value: AuditRange; label: string }[] = [{ value: "24h", label: "24 h" }, { value: "7d", label: "7 d" }, { value: "30d", label: "30 d" }];
const KINDS = Object.keys(auditObjectLabel) as AuditObjectKind[];
const SIGNED_EXPORT = "Signed audit export";

export function AuditScreen() {
  const audit = useAudit();
  const users = useUsers();
  const license = useLicense();
  const verify = useVerifyAudit();
  const exporter = useExportAudit();
  const [filter, setFilter] = useState<AuditFilter>({ actor: "", kind: "", text: "", range: "7d" });
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState<AuditEvent | null>(null);
  const root = useRef<HTMLDivElement>(null);
  useEnter(root);

  // The server keeps the last check; the mock runs it once when the screen opens.
  const { mutate: runVerify } = verify;
  useEffect(() => { runVerify(); }, [runVerify]);

  const rows = useMemo(() => filterAudit(audit.data ?? [], filter, MOCK_NOW), [audit.data, filter]);
  const set = (change: Partial<AuditFilter>) => { setFilter((f) => ({ ...f, ...change })); setShown(PAGE); };
  const canExport = license.data?.features.find((f) => f.key === SIGNED_EXPORT)?.enabled ?? false;

  const exportRows = () => exporter.mutate(rows.map((r) => r.id), {
    onSuccess: (x) => {
      const url = URL.createObjectURL(new Blob([x.body], { type: "application/json" }));
      const a = Object.assign(document.createElement("a"), { href: url, download: x.fileName });
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${plural(x.entries, "entry", "entries")}`, { description: `Signed ${x.signature.slice(0, 24)}… by ${x.signedBy}` });
    },
  });

  return (
    <Canvas>
      <div ref={root} className="flex flex-col gap-5">
        <PageHeader
          title="Audit"
          subline="Every change, sign-in and live view on this plant, in an append-only chain sealed every night."
          actions={(
            <Button variant="outline" onClick={exportRows} disabled={!canExport || !rows.length || exporter.isPending}>
              {canExport ? <Download /> : <Lock />}Signed export{!canExport && <Pill className="ml-1">Pro</Pill>}
            </Button>
          )}
        />
        <ChainStatus chain={verify.data} checking={verify.isPending || verify.isIdle} total={audit.data?.length ?? 0} onVerify={() => verify.mutate()} />
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-48">
            <Select aria-label="Who" value={filter.actor} onChange={(e) => set({ actor: e.target.value })}>
              <option value="">Everyone</option>
              {(users.data ?? []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              <option value={SYSTEM_ACTOR}>Viper (system)</option>
            </Select>
          </span>
          <span className="w-48">
            <Select aria-label="Object" value={filter.kind} onChange={(e) => set({ kind: e.target.value as AuditObjectKind | "" })}>
              <option value="">All objects</option>
              {KINDS.map((k) => <option key={k} value={k}>{auditObjectLabel[k]}</option>)}
            </Select>
          </span>
          <span className="w-64">
            <Input aria-label="Search object or detail" placeholder="Search object or detail" value={filter.text} onChange={(e) => set({ text: e.target.value })} />
          </span>
          <Segmented label="Range" options={RANGES} value={filter.range} onChange={(range) => set({ range })} className="ml-auto" />
        </div>
        {audit.isPending ? <LoadingRows rows={8} pitch="h-11" />
          : audit.isError ? <ErrorState what="the audit log" onRetry={() => audit.refetch()} />
            : !rows.length ? <EmptyState>No entries match these filters.</EmptyState>
              : (
                <div>
                  <AuditTable rows={rows.slice(0, shown)} filterKey={JSON.stringify(filter)} onOpen={setOpen} />
                  <LoadMore loaded={Math.min(shown, rows.length)} hasMore={shown < rows.length} loading={false} onLoadMore={() => setShown((n) => n + PAGE)} />
                </div>
              )}
      </div>
      <EntrySheet entry={open} onClose={() => setOpen(null)} />
    </Canvas>
  );
}

function EntrySheet({ entry, onClose }: { entry: AuditEvent | null; onClose: () => void }) {
  const [last, setLast] = useState(entry);
  if (entry && entry !== last) setLast(entry);
  const e = entry ?? last;
  return (
    <Sheet open={!!entry} onOpenChange={(o) => { if (!o) onClose(); }} title={e ? auditActionLabel[e.action] : ""} description={e ? `Entry #${fmtNum(e.seq)}` : undefined}>
      {e && (
        <div className="px-5 py-4">
          <KeyValues rows={[
            { k: "When", v: <span className="num">{fmtDate(e.at)}, {fmtTime(e.at)}</span> },
            { k: "Who", v: e.actor },
            { k: "From", v: <span className="num">{e.ip}</span> },
            { k: "Object", v: `${auditObjectLabel[e.objectKind]} · ${e.object}` },
            { k: "Detail", v: e.detail },
            { k: "Seal", v: e.anchored ? "Sealed by an anchor" : "Waiting for tonight's anchor" },
          ]} />
          <h3 className="mt-6 text-body font-medium">Chain</h3>
          <p className="mt-1 text-small text-muted">This entry&apos;s digest covers its body and the digest before it, so changing any earlier entry breaks every later one.</p>
          <dl className="mt-3 flex flex-col gap-2 text-small">
            <div><dt className="text-muted">Previous</dt><dd><code className="font-mono break-all">{e.prevHash}</code></dd></div>
            <div><dt className="text-muted">This entry</dt><dd><code className="font-mono break-all">{e.hash}</code></dd></div>
          </dl>
        </div>
      )}
    </Sheet>
  );
}
