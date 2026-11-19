"use client";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import type { Alert, AlertStatus, Feedback, Machine } from "@/lib/api/types";
import { useSendFeedback, useSetAlertStatus } from "@/features/hooks";
import { cn } from "@/lib/cn";
import { fmtAgo } from "@/lib/format";
import { feedbackLabel, ruleLabel } from "@/lib/labels";
import { Button, HoldButton } from "@/ui/atoms";
import { AlertStatusPill, KeyValues, ModalityBar, SeverityGlyph } from "@/ui/cells";
import { AlertEvidence } from "./AlertEvidence";

const FEEDBACK: Feedback[] = ["correct", "false", "unsure"];

export function AlertDetail({ alert, machine }: { alert: Alert; machine: Machine }) {
  const setStatus = useSetAlertStatus();
  const sendFeedback = useSendFeedback();
  const [pinned, setPinned] = useState(alert.pinned);

  const closed = alert.status === "resolved" || alert.status === "rejected";
  const applyStatus = (next: AlertStatus, done: string) => {
    const prev = alert.status;
    return setStatus.mutateAsync({ id: alert.id, status: next }).then(() => {
      toast(done, {
        action: {
          label: "Undo",
          onClick: () => { void setStatus.mutateAsync({ id: alert.id, status: prev }); },
        },
      });
    }).catch(() => { toast.error("Could not update the alert"); });
  };

  const onFeedback = (value: Feedback) => {
    void sendFeedback.mutateAsync({ id: alert.id, feedback: value }).then(() => {
      toast(`Marked as ${feedbackLabel[value].toLowerCase()}`);
    }).catch(() => { toast.error("Could not save feedback"); });
  };

  return (
    <article
      key={alert.id}
      className="animate-enter mx-auto flex max-w-[1080px] flex-col gap-5 px-5 py-6 md:px-8"
      aria-labelledby="alert-title"
    >
      <header>
        <p className="flex flex-wrap items-center gap-2 text-small text-muted">
          <SeverityGlyph severity={alert.severity} />
          <span aria-hidden>·</span>
          <span className="font-medium text-text">{machine.code}</span>
          <span aria-hidden>·</span>
          <span suppressHydrationWarning>opened {fmtAgo(alert.openedAt)}</span>
          {alert.status !== "open" && <AlertStatusPill status={alert.status} />}
        </p>
        <h2 id="alert-title" className="mt-3 max-w-[48ch] text-[20px] leading-7 font-medium">
          {alert.title}
        </h2>
      </header>

      <ModalityBar parts={alert.contributions} />

      <section className="flex flex-col gap-2">
        <h3 className="text-body font-medium">What happened</h3>
        <p className="max-w-[68ch] text-body text-muted">{alert.summary}</p>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-body font-medium">Evidence</h3>
        <AlertEvidence alert={alert} machine={machine} />
      </section>

      <section className="flex flex-col gap-2" aria-label="Was it right?">
        <h3 className="text-body font-medium">Was it right?</h3>
        <div className="flex flex-wrap gap-2">
          {FEEDBACK.map((value) => {
            const pressed = alert.feedback === value;
            return (
              <Button
                key={value}
                type="button"
                variant="outline"
                aria-pressed={pressed}
                className={cn(pressed && "bg-active")}
                onClick={() => onFeedback(value)}
                disabled={sendFeedback.isPending}
              >
                {feedbackLabel[value]}
              </Button>
            );
          })}
        </div>
      </section>

      <div role="group" aria-label="Actions" className="flex flex-wrap items-center gap-2 rounded-card bg-raised p-3">
        {!closed && alert.status === "open" && (
          <HoldButton
            variant="primary"
            doneLabel="Acknowledged"
            after
            onConfirm={() => applyStatus("acknowledged", "Acknowledged. It stays on your list until resolved.")}
            disabled={setStatus.isPending}
          >
            Hold to acknowledge
          </HoldButton>
        )}
        {!closed && (
          <>
            <HoldButton
              variant={alert.status === "open" ? "outline" : "primary"}
              doneLabel="Resolved"
              after
              onConfirm={() => applyStatus("resolved", "Resolved.")}
              disabled={setStatus.isPending}
            >
              Resolve
            </HoldButton>
            <HoldButton
              variant="outline"
              doneLabel="False alarm"
              after
              onConfirm={() => applyStatus("rejected", "Marked as a false alarm.")}
              disabled={setStatus.isPending}
            >
              False alarm
            </HoldButton>
          </>
        )}
        <Button
          variant="outline"
          onClick={() => toast("Araxos is not connected with mock data")}
        >
          Open in Araxos
        </Button>
        <Button
          variant="outline"
          aria-pressed={pinned}
          className={cn(pinned && "bg-active")}
          onClick={() => {
            const next = !pinned;
            setPinned(next);
            toast(next ? "Evidence pinned for retention." : "Evidence unpinned.");
          }}
        >
          Pin evidence
        </Button>
      </div>

      <KeyValues rows={[
        { k: "Model", v: alert.modelVersion ?? "—" },
        { k: "Rule", v: ruleLabel[alert.rule] ?? alert.rule },
        {
          k: "Machine",
          v: (
            <Link href={`/machines/${machine.id}`} className="text-text underline-offset-2 hover:underline">
              {machine.code} · {machine.name}
            </Link>
          ),
        },
      ]} />
    </article>
  );
}
