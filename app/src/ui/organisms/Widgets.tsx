"use client";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, Check, Ellipsis, GripVertical, Plus, Trash2 } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/atoms";
import { Menu } from "@/ui/cells";

export type WidgetSize = "small" | "medium" | "big";
export const SIZE_LABEL: Record<WidgetSize, string> = { small: "Small", medium: "Medium", big: "Big" };

/** Grid footprint per size: 12 columns on desktop, 6 on tablet, one on phones; rows of 112px. */
const SPAN: Record<WidgetSize, string> = {
  small: "md:col-span-3 md:row-span-1",
  medium: "col-span-2 md:col-span-6 lg:col-span-4 md:row-span-3",
  big: "col-span-2 md:col-span-6 lg:col-span-8 md:row-span-3",
};
/** Natural size of each footprint at 1440, used to render previews at true proportions. */
const PREVIEW_BOX: Record<WidgetSize, { w: number; h: number }> = {
  small: { w: 300, h: 112 },
  medium: { w: 410, h: 368 },
  big: { w: 840, h: 368 },
};

/** Sizes differ, so neighbours stay put while one is carried; the target is ringed and the grid glides on drop. */
const noShift = () => null;

/** The grid. Widgets can be dragged by their grip (or with the keyboard: Space, arrows, Space) to any spot. */
export function WidgetGrid({ ids, onReorder, children }: { ids: string[]; onReorder: (uid: string, overUid: string) => void; children: ReactNode }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = ({ active, over }: DragEndEvent) => { if (over && active.id !== over.id) onReorder(String(active.id), String(over.id)); };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={noShift}>
        <div className="grid grid-cols-2 gap-4 md:auto-rows-[112px] md:grid-flow-row-dense md:grid-cols-6 lg:grid-cols-12">{children}</div>
      </SortableContext>
    </DndContext>
  );
}

/** One widget on the dashboard. In edit mode its header carries the size switch and a menu. */
export function WidgetFrame({
  uid, title, aside, size, sizes, editing, onResize, onRemove, onMove, canMoveEarlier, canMoveLater, children, flush,
}: {
  uid: string; title: string; aside?: ReactNode; size: WidgetSize; sizes: WidgetSize[]; editing: boolean;
  onResize: (s: WidgetSize) => void; onRemove: () => void; onMove: (by: -1 | 1) => void;
  canMoveEarlier: boolean; canMoveLater: boolean; children: ReactNode; flush?: boolean;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging, isOver } = useSortable({ id: uid, disabled: !editing });
  return (
    <section
      ref={setNodeRef}
      aria-label={title}
      data-widget={uid} data-flip-id={uid}
      style={{ transform: CSS.Translate.toString(transform) } as CSSProperties}
      className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-card border bg-surface transition-[border-color] duration-[var(--dur-2)] ease-out",
        editing ? "border-control" : "border-border",
        isOver && !isDragging && "border-accent ring-2 ring-accent/30",
        isDragging && "relative z-10 border-accent shadow-[0_8px_24px_rgb(14_18_16/0.14)]",
        SPAN[size],
      )}
    >
      <header className={cn("flex min-h-11 flex-none items-center justify-between gap-3 px-4 pt-3", size === "small" && !editing && "min-h-0 pt-3")}>
        {editing && (
          <button ref={setActivatorNodeRef} type="button" {...attributes} {...listeners} aria-label={`Move ${title}. Press space, then the arrow keys, then space.`}
            className="hit-slop -ml-1.5 grid size-7 flex-none cursor-grab touch-none place-items-center rounded-full text-muted hover:bg-raised hover:text-text active:cursor-grabbing">
            <GripVertical className="size-4" />
          </button>
        )}
        <h2 className={cn("min-w-0 flex-1 truncate", size === "small" ? "text-small text-muted" : "text-section font-medium")}>{title}</h2>
        {editing ? (
          <div className="flex flex-none items-center gap-1 animate-[token-in_160ms_var(--ease-out)_both]">
            {sizes.length > 1 && (
              <div role="radiogroup" aria-label={`Size of ${title}`} className="flex rounded-full bg-active p-0.5">
                {sizes.map((s) => (
                  <button key={s} type="button" role="radio" aria-checked={s === size} aria-label={SIZE_LABEL[s]} onClick={() => onResize(s)}
                    className={cn("hit-slop h-6 min-w-6 rounded-full px-1.5 text-[11px] font-bold transition-[background-color,color] duration-[var(--dur-1)]",
                      s === size ? "bg-surface text-text shadow-[0_1px_2px_rgb(0_0_0/0.08)]" : "text-muted hover:text-text")}>
                    {SIZE_LABEL[s][0]}
                  </button>
                ))}
              </div>
            )}
            <Menu
              trigger={<button type="button" aria-label={`More for ${title}`} className="hit-slop grid size-7 place-items-center rounded-full text-muted hover:bg-raised hover:text-text"><Ellipsis className="size-4" /></button>}
              items={[
                ...(canMoveEarlier ? [{ label: "Move earlier", icon: <ArrowUp />, onClick: () => onMove(-1) }] : []),
                ...(canMoveLater ? [{ label: "Move later", icon: <ArrowDown />, onClick: () => onMove(1) }] : []),
                "separator" as const,
                { label: "Remove from dashboard", icon: <Trash2 />, onClick: onRemove, tone: "danger" as const },
              ]}
            />
          </div>
        ) : aside ? <div className="flex-none text-small text-muted">{aside}</div> : null}
      </header>
      <div className={cn("min-h-0 flex-1", flush ? "" : "px-4 pb-4", size === "small" ? "pt-1" : "pt-3")}>{children}</div>
    </section>
  );
}

/** A card in the "Add a widget" gallery: a live miniature, what it shows, its sizes, and Add. */
export function WidgetCard({
  title, description, sizes, size, onSize, added, onAdd, preview,
}: {
  title: string; description: string; sizes: WidgetSize[]; size: WidgetSize; onSize: (s: WidgetSize) => void;
  added: boolean; onAdd: () => void; preview: ReactNode;
}) {
  const box = PREVIEW_BOX[size];
  const scale = Math.min(276 / box.w, 150 / box.h);
  return (
    <li className="flex flex-col rounded-card border border-border bg-surface p-3 transition-[border-color] duration-[var(--dur-1)] hover:border-control">
      <div aria-hidden className="relative grid h-[164px] place-items-center overflow-hidden rounded-[6px] bg-ground">
        <div key={size} inert className="pointer-events-none animate-[token-in_200ms_var(--ease-out)_both] select-none" style={{ width: box.w * scale, height: box.h * scale }}>
          <div className="origin-top-left" style={{ width: box.w, height: box.h, transform: `scale(${scale})` }}>{preview}</div>
        </div>
      </div>
      <div className="mt-3 flex-1">
        <h3 className="text-body font-medium">{title}</h3>
        <p className="mt-0.5 text-small text-muted">{description}</p>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div role="radiogroup" aria-label={`Size for ${title}`} className="flex rounded-full bg-active p-0.5">
          {sizes.map((s) => (
            <button key={s} type="button" role="radio" aria-checked={s === size} onClick={() => onSize(s)}
              className={cn("hit-slop h-7 rounded-full px-2.5 text-small transition-[background-color,color] duration-[var(--dur-1)]",
                s === size ? "bg-surface text-text shadow-[0_1px_2px_rgb(0_0_0/0.08)]" : "text-muted hover:text-text")}>
              {SIZE_LABEL[s]}
            </button>
          ))}
        </div>
        {added ? (
          <span className="inline-flex items-center gap-1 text-small whitespace-nowrap text-muted"><Check className="size-3.5" />Added</span>
        ) : (
          <Button size="sm" variant="primary" onClick={onAdd}><Plus />Add</Button>
        )}
      </div>
    </li>
  );
}
