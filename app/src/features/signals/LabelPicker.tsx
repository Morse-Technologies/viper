"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useTaxonomy } from "@/features/hooks";
import { HoldButton } from "@/ui/atoms";
import { LoadingRows, Sheet } from "@/ui/cells";
import { cn } from "@/lib/cn";
import type { Id } from "@/lib/api/types";

/** Taxonomy classes as radio-like buttons (keys 1–9), then hold to label the span. */
export function LabelSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const tax = useTaxonomy();
  const [classId, setClassId] = useState<Id | null>(null);
  const confirm = () => {
    toast.success("Span labelled");
    onOpenChange(false);
    setClassId(null);
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Label span" description="Pick a class, then hold to apply it to the selected window.">
      <div className="flex flex-col gap-4 p-5">
        {tax.isPending ? <LoadingRows rows={5} pitch="h-10" /> : (
          <ul className="flex flex-col gap-1" role="radiogroup" aria-label="Taxonomy class">
            {(tax.data ?? []).map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={classId === c.id}
                  onClick={() => setClassId(c.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left text-body transition-colors duration-[var(--dur-1)]",
                    classId === c.id ? "bg-active text-text" : "text-text hover:bg-raised",
                  )}
                >
                  <span className="grid size-6 place-items-center rounded-control border border-control text-small text-muted num">{c.key}</span>
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        <HoldButton
          variant="primary"
          className="self-start"
          disabled={!classId}
          doneLabel="Labelled"
          onConfirm={confirm}
          aria-label="Hold to label span"
        >
          Hold to label
        </HoldButton>
      </div>
    </Sheet>
  );
}
