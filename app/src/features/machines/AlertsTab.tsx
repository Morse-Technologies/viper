"use client";
import Link from "next/link";
import { useAlerts } from "@/features/hooks";
import type { Alert } from "@/lib/api/types";
import { fmtAgo } from "@/lib/format";
import { feedbackLabel } from "@/lib/labels";
import { AlertStatusPill, EmptyState, LoadingRows, SeverityGlyph } from "@/ui/cells";

export function AlertsTab({ machineId }: { machineId: string }) {
  const alerts = useAlerts();
  if (alerts.isPending) return <LoadingRows rows={6} pitch="h-14" />;
  const mine = (alerts.data ?? [])
    .filter((a) => a.machineId === machineId)
    .sort((a, b) => b.openedAt.localeCompare(a.openedAt));
  if (!mine.length) return <EmptyState>No alerts for this machine.</EmptyState>;
  return (
    <ul className="divide-y divide-rule rounded-card border border-border">
      {mine.map((a) => <li key={a.id}><AlertRow alert={a} /></li>)}
    </ul>
  );
}

function AlertRow({ alert: a }: { alert: Alert }) {
  return (
    <Link
      href={`/alerts?id=${a.id}`}
      className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-body transition-colors duration-[var(--dur-1)] hover:bg-raised"
    >
      <SeverityGlyph severity={a.severity} />
      <span className="min-w-0 flex-1 font-medium">{a.title}</span>
      <AlertStatusPill status={a.status} />
      <span className="text-muted">{fmtAgo(a.openedAt)}</span>
      <span className="text-muted">{a.feedback ? feedbackLabel[a.feedback] : "No feedback"}</span>
    </Link>
  );
}
