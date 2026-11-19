"use client";
import { useEffect, useMemo, useState } from "react";
import type { TaxonomyClass } from "@/lib/api/types";
import { Button, HoldButton, Input, Kbd } from "@/ui/atoms";
import { cn } from "@/lib/cn";

const MAX_SHORTCUT = 9;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

export function LabelPicker({
  classes,
  suggestedId,
  disabled,
  onLabel,
  onSkip,
  onUnknown,
}: {
  classes: TaxonomyClass[];
  suggestedId: string | null;
  disabled: boolean;
  onLabel: (classId: string) => void | Promise<unknown>;
  onSkip: () => void;
  onUnknown: () => void | Promise<unknown>;
}) {
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter((c) => c.name.toLowerCase().includes(q));
  }, [classes, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1 || n > MAX_SHORTCUT) return;
      const match = classes.find((c) => c.key === n);
      if (match) setChosen(match.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [classes]);

  const selected = classes.find((c) => c.id === chosen) ?? null;

  return (
    <div className="flex flex-col gap-3">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search classes"
        aria-label="Search taxonomy classes"
      />
      <ul className="flex flex-wrap gap-2">
        {filtered.map((c) => {
          const active = chosen === c.id;
          const suggested = suggestedId === c.id;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setChosen(c.id)}
                aria-pressed={active}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-control border px-2.5 text-body transition-colors",
                  active
                    ? "border-text bg-active text-text"
                    : "border-border bg-surface text-muted hover:bg-raised hover:text-text",
                )}
              >
                {c.key <= MAX_SHORTCUT && <Kbd>{c.key}</Kbd>}
                {c.name}
                {suggested && <span className="text-small text-muted">Suggested</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <HoldButton
          variant="primary"
          doneLabel="Labelled"
          disabled={disabled || !chosen}
          onConfirm={() => { if (chosen) return onLabel(chosen); }}
        >
          Hold to label{selected ? `: ${selected.name}` : ""}
        </HoldButton>
        <Button variant="ghost" onClick={onSkip}>Skip</Button>
        <Button variant="ghost" disabled={disabled} onClick={() => void onUnknown()}>
          I don&apos;t know
        </Button>
      </div>
    </div>
  );
}
