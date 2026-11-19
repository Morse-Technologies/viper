"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useCompleteLabelTask, useLabelTasks, useMachines, useTaxonomy,
} from "@/features/hooks";
import type { LabelReason, LabelTask, Machine } from "@/lib/api/types";
import { fmtAgo, fmtNum } from "@/lib/format";
import { labelReasonLabel } from "@/lib/labels";
import { cn } from "@/lib/cn";
import {
  EmptyState, ErrorState, LoadingRows, modalityIcon,
} from "@/ui/cells";
import { SplitLayout } from "@/ui/templates/ShellLayout";
import { LabelPicker } from "./LabelPicker";
import { TaskEvidence } from "./TaskEvidence";
import { REASON_ORDER, SHIFT_LABEL_LIMIT } from "./constants";

function sortByReason(tasks: LabelTask[]): LabelTask[] {
  const rank = Object.fromEntries(REASON_ORDER.map((r, i) => [r, i])) as Record<LabelReason, number>;
  return [...tasks].sort((a, b) => rank[a.reason] - rank[b.reason] || a.createdAt.localeCompare(b.createdAt));
}

function TaskRow({
  task, machine, selected, onSelect,
}: {
  task: LabelTask; machine: Machine | undefined; selected: boolean; onSelect: () => void;
}) {
  const Icon = modalityIcon[task.modality];
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? "true" : undefined}
        className={cn(
          "flex w-full flex-col gap-1 px-6 py-3 text-left transition-colors",
          selected ? "bg-active" : "hover:bg-raised",
        )}
      >
        <div className="flex items-center gap-2">
          <Icon className="size-3.5 text-muted" strokeWidth={1.6} aria-hidden />
          <span className="text-body font-medium">{machine?.code ?? "—"}</span>
          <span className="ml-auto text-small text-muted">{fmtAgo(task.createdAt)}</span>
        </div>
        <p className="line-clamp-2 text-small text-muted">{task.why}</p>
      </button>
    </li>
  );
}

function TaskList({
  tasks, machines, selectedId, onSelect,
}: {
  tasks: LabelTask[];
  machines: Map<string, Machine>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      {REASON_ORDER.map((reason) => {
        const rows = tasks.filter((t) => t.reason === reason);
        if (!rows.length) return null;
        return (
          <section key={reason} aria-label={labelReasonLabel[reason]}>
            <h2 className="sticky top-0 z-10 border-b border-border bg-active/60 px-6 py-2 text-small font-medium">
              {labelReasonLabel[reason]}
              <span className="ml-2 font-normal text-muted num">{rows.length}</span>
            </h2>
            <ul className="divide-y divide-rule">
              {rows.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  machine={machines.get(t.machineId)}
                  selected={t.id === selectedId}
                  onSelect={() => onSelect(t.id)}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}

function WorkPanel({
  task, index, total, labelledToday, classes, onLabel, onSkip, onUnknown, busy,
}: {
  task: LabelTask;
  index: number;
  total: number;
  labelledToday: number;
  classes: { id: string; name: string; key: number }[];
  onLabel: (classId: string) => Promise<void>;
  onSkip: () => void;
  onUnknown: () => Promise<void>;
  busy: boolean;
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule px-6 py-4">
        <h1 className="text-title font-medium">
          Task <span className="num">{index + 1}</span> of <span className="num">{total}</span>
        </h1>
        <p className="text-small text-muted">
          Labelled today: <span className="num">{fmtNum(labelledToday)}</span>
          {" · "}limit per shift <span className="num">{fmtNum(SHIFT_LABEL_LIMIT)}</span>
        </p>
      </header>
      <div className="flex flex-col gap-6 px-6 py-5">
        <TaskEvidence task={task} />
        <LabelPicker
          key={task.id}
          classes={classes}
          suggestedId={task.suggested}
          disabled={busy}
          onLabel={onLabel}
          onSkip={onSkip}
          onUnknown={onUnknown}
        />
      </div>
    </div>
  );
}

export function LabellingScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const tasksQ = useLabelTasks();
  const machinesQ = useMachines("plant");
  const taxonomy = useTaxonomy();
  const complete = useCompleteLabelTask();
  const [labelledToday, setLabelledToday] = useState(0);

  const tasks = useMemo(() => sortByReason(tasksQ.data ?? []), [tasksQ.data]);
  const machines = useMemo(
    () => new Map((machinesQ.data ?? []).map((m) => [m.id, m])),
    [machinesQ.data],
  );

  const selectedId = params.get("id");
  const selected = tasks.find((t) => t.id === selectedId) ?? tasks[0] ?? null;
  const selectedIndex = selected ? tasks.findIndex((t) => t.id === selected.id) : -1;

  const select = (id: string) => {
    router.replace(`/labelling?id=${id}`, { scroll: false });
  };

  const advance = (fromId: string) => {
    const i = tasks.findIndex((t) => t.id === fromId);
    const next = tasks[i + 1] ?? tasks.find((t) => t.id !== fromId) ?? null;
    if (next) select(next.id);
    else router.replace("/labelling", { scroll: false });
  };

  const onLabel = async (classId: string) => {
    if (!selected) return;
    const cls = taxonomy.data?.find((c) => c.id === classId);
    await complete.mutateAsync({ id: selected.id, classId });
    setLabelledToday((n) => n + 1);
    toast.success(cls ? `Labelled as ${cls.name}` : "Labelled");
    advance(selected.id);
  };

  const onUnknown = async () => {
    if (!selected) return;
    await complete.mutateAsync({ id: selected.id, classId: null });
    setLabelledToday((n) => n + 1);
    toast("Marked as unknown");
    advance(selected.id);
  };

  const onSkip = () => {
    if (!selected) return;
    advance(selected.id);
  };

  const listPane = (
    <>
      <div className="flex flex-col gap-1 border-b border-border px-6 pt-6 pb-4">
        <h1 className="text-title font-medium">Labelling</h1>
        <p className="text-body text-muted">
          Queue ordered by why the model is unsure.
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto md:h-[calc((100dvh-66px)/var(--content-zoom)-104px)]">
        {tasksQ.isPending ? (
          <div className="px-6"><LoadingRows rows={8} pitch="h-16" /></div>
        ) : tasksQ.isError ? (
          <div className="p-6"><ErrorState what="label tasks" onRetry={() => tasksQ.refetch()} /></div>
        ) : tasks.length === 0 ? (
          <div className="p-6">
            <EmptyState>
              Nothing to label. The models are sure about everything for now.
            </EmptyState>
          </div>
        ) : (
          <TaskList
            tasks={tasks}
            machines={machines}
            selectedId={selected?.id ?? null}
            onSelect={select}
          />
        )}
      </div>
    </>
  );

  const detailPane = selected && taxonomy.data ? (
    <WorkPanel
      task={selected}
      index={selectedIndex}
      total={tasks.length}
      labelledToday={labelledToday}
      classes={taxonomy.data}
      onLabel={onLabel}
      onSkip={onSkip}
      onUnknown={onUnknown}
      busy={complete.isPending}
    />
  ) : tasksQ.isPending || taxonomy.isPending ? (
    <div className="p-6"><LoadingRows rows={4} pitch="h-24" /></div>
  ) : tasks.length === 0 ? (
    <div className="flex h-full items-center justify-center p-6">
      <EmptyState>
        Nothing to label. The models are sure about everything for now.
      </EmptyState>
    </div>
  ) : null;

  return (
    <SplitLayout
      listWidth="md:w-[384px]"
      list={listPane}
      detail={<div className="h-full overflow-hidden md:h-[calc((100dvh-66px)/var(--content-zoom))]">{detailPane}</div>}
    />
  );
}
