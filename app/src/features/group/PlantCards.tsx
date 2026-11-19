"use client";
import { useRouter } from "next/navigation";
import { usePlantId } from "@/features/hooks";
import type { PlantSummary } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { fmtAgo } from "@/lib/format";
import { linkLabel, SEVERITY_ORDER } from "@/lib/labels";
import { Button, CountUp, Dot } from "@/ui/atoms";
import { SeverityGlyph } from "@/ui/cells";
import { linkTone, openTotal } from "./groupHelpers";

export function PlantCards({ plants, focusedId, onFocus }: {
  plants: PlantSummary[];
  focusedId: string | null;
  onFocus: (id: string) => void;
}) {
  return (
    <ul className="mt-6 grid gap-4 md:grid-cols-3">
      {plants.map((p) => (
        <li key={p.id}>
          <PlantCard
            plant={p}
            focused={p.id === focusedId}
            onFocus={() => onFocus(p.id)}
          />
        </li>
      ))}
    </ul>
  );
}

function PlantCard({ plant, focused, onFocus }: {
  plant: PlantSummary; focused: boolean; onFocus: () => void;
}) {
  const { setPlantId } = usePlantId();
  const router = useRouter();
  const open = openTotal(plant);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onFocus}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onFocus(); }
      }}
      aria-pressed={focused}
      className={cn(
        "flex w-full flex-col rounded-card border border-border bg-surface p-5 text-left transition-shadow duration-[var(--dur-1)]",
        focused && "ring-2 ring-accent",
      )}
    >
      <span className="text-section font-medium">{plant.name}</span>
      <span className="mt-0.5 text-small text-muted">{plant.city}</span>
      <span className="mt-2 inline-flex items-center gap-1.5 text-small text-muted">
        <Dot tone={linkTone[plant.link]} />
        {linkLabel[plant.link]}
        <span aria-hidden>·</span>
        <span suppressHydrationWarning>last heartbeat {fmtAgo(plant.lastHeartbeatAt)}</span>
      </span>

      <dl className="mt-4 grid grid-cols-3 gap-2">
        <Kpi label="Machines" value={plant.machines} />
        <Kpi label="In alarm" value={plant.inAlarm} />
        <Kpi label="Open alerts" value={open} />
      </dl>

      <ul className="mt-4 flex flex-col gap-1.5">
        {SEVERITY_ORDER.map((s) => (
          <li key={s} className="flex items-center justify-between gap-2 text-body">
            <SeverityGlyph severity={s} />
            <span className="num">{plant.open[s]}</span>
          </li>
        ))}
      </ul>

      <Button
        variant="ghost"
        size="sm"
        className="mt-4 self-start"
        onClick={(e) => {
          e.stopPropagation();
          setPlantId(plant.id);
          router.push("/dashboard");
        }}
      >
        Open plant
      </Button>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-small text-muted">{label}</dt>
      <dd className="mt-0.5 text-kpi font-medium tracking-[-0.01em] num">
        <CountUp value={value} />
      </dd>
    </div>
  );
}
