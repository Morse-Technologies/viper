"use client";
import type { Alert } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { fmtAgo } from "@/lib/format";
import { AlertStatusPill, SeverityGlyph } from "@/ui/cells";
import { STAGGER_MS } from "./filter";

export function AlertRow({
  alert, code, selected, index, onSelect,
}: {
  alert: Alert; code: string; selected: boolean; index: number; onSelect: () => void;
}) {
  const unread = alert.status === "open";
  return (
    <li
      data-alert={alert.id}
      className="animate-band-in"
      style={{ animationDelay: `${index * STAGGER_MS}ms` }}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? "true" : undefined}
        className={cn(
          "relative flex w-full flex-col gap-1 px-6 py-3 text-left transition-colors duration-[var(--dur-1)]",
          selected ? "bg-active" : "hover:bg-active/50",
        )}
      >
        <span className="flex items-start justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2">
            <SeverityGlyph severity={alert.severity} label={false} />
            <span className={cn("truncate text-body", unread ? "font-medium" : "")}>
              <span className="text-muted">{code}</span>
              <span className="text-muted"> · </span>
              {alert.title}
            </span>
          </span>
        </span>
        <span className="flex items-center justify-between gap-3 text-small text-muted">
          <span className="flex min-w-0 items-center gap-1.5">
            {alert.status !== "open" && <AlertStatusPill status={alert.status} />}
          </span>
          <span className="flex-none" suppressHydrationWarning>{fmtAgo(alert.openedAt)}</span>
        </span>
      </button>
    </li>
  );
}
