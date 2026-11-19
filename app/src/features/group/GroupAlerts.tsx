"use client";
import type { Alert, Machine, PlantSummary } from "@/lib/api/types";
import { fmtAgo } from "@/lib/format";
import { alertStatusLabel } from "@/lib/labels";
import { Card, EmptyState, Segmented, SeverityGlyph } from "@/ui/cells";

type Scope = "focused" | "all";

export function GroupAlerts({ alerts, plants, machines, focusedId, scope, onScope }: {
  alerts: Alert[];
  plants: PlantSummary[];
  machines: Machine[];
  focusedId: string | null;
  scope: Scope;
  onScope: (s: Scope) => void;
}) {
  const plantCode = (id: string) => plants.find((p) => p.id === id)?.code ?? "—";
  const machineCode = (id: string) => machines.find((m) => m.id === id)?.code ?? "—";
  const rows = scope === "focused" && focusedId
    ? alerts.filter((a) => a.plantId === focusedId)
    : alerts;
  const sorted = [...rows].sort((a, b) => b.openedAt.localeCompare(a.openedAt));

  return (
    <Card
      id="group-alerts-h"
      title="Alerts across plants"
      aside={`${sorted.length} shown`}
      className="mt-5"
      flush
    >
      <div className="border-b border-rule px-5 py-3">
        <Segmented
          label="Alert scope"
          value={scope}
          onChange={onScope}
          options={[
            { value: "focused", label: "Focused plant" },
            { value: "all", label: "All plants" },
          ]}
        />
      </div>
      {!sorted.length ? (
        <EmptyState className="m-5">No alerts in this scope.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-body">
            <caption className="sr-only">Alerts across plants</caption>
            <thead>
              <tr className="border-b border-border text-left text-small text-muted">
                <th scope="col" className="h-10 px-5 font-normal">Plant</th>
                <th scope="col" className="h-10 pr-3 font-normal">Machine</th>
                <th scope="col" className="h-10 pr-3 font-normal">Severity</th>
                <th scope="col" className="h-10 pr-3 font-normal">Title</th>
                <th scope="col" className="h-10 pr-3 font-normal">Opened</th>
                <th scope="col" className="h-10 pr-5 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((a) => (
                <tr key={a.id} className="border-b border-rule">
                  <td className="px-5 py-3 font-medium num">{plantCode(a.plantId)}</td>
                  <td className="py-3 pr-3 num">{machineCode(a.machineId)}</td>
                  <td className="py-3 pr-3"><SeverityGlyph severity={a.severity} /></td>
                  <td className="max-w-[18rem] truncate py-3 pr-3">{a.title}</td>
                  <td className="py-3 pr-3 text-muted" suppressHydrationWarning>{fmtAgo(a.openedAt)}</td>
                  <td className="py-3 pr-5 text-muted">{alertStatusLabel[a.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
