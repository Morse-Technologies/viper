"use client";
import { Check, LayoutGrid, Plus, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useOverview, usePlant } from "@/features/hooks";
import { Button, Skeleton } from "@/ui/atoms";
import { EmptyState, ErrorState, Modal, PageHeader } from "@/ui/cells";
import { SIZE_LABEL, WidgetCard, WidgetFrame, WidgetGrid, type WidgetSize } from "@/ui/organisms/Widgets";
import { Canvas } from "@/ui/templates/ShellLayout";
import { useDashboardLayout } from "./layout";
import { WIDGETS, widgetByType, type WidgetDef } from "./widgets";

/** The plant dashboard: widgets the person can drag, resize (S/M/B), remove and add; saved on this browser. */
export function DashboardScreen() {
  const ov = useOverview();
  const plant = usePlant();
  const { layout, resize, remove, add, move, reorder, reset } = useDashboardLayout();
  const [editing, setEditing] = useState(false);
  const [gallery, setGallery] = useState(false);

  if (ov.isError) return <Canvas><ErrorState what="the dashboard" onRetry={() => ov.refetch()} /></Canvas>;
  const o = ov.data;
  const visible = layout.filter((w) => !!widgetByType(w.type));
  const onBoard = new Set(layout.map((w) => w.type));
  const finding = o && plant ? `${plant.name}: ${o.alertsOpen} open alerts, ${o.bySeverity.high} high. ${o.deviating[0]?.line ?? ""} deviates most today.` : null;

  return (
    <Canvas>
      <PageHeader
        title="Dashboard"
        subline={finding ?? <Skeleton className="mt-1 h-4 w-96 max-w-full" />}
        actions={editing ? (
          <>
            <Button variant="ghost" onClick={() => { reset(); toast("Dashboard reset to the default layout"); }}><RotateCcw />Reset layout</Button>
            <Button variant="outline" onClick={() => setGallery(true)}><Plus />Add widget</Button>
            <Button variant="primary" onClick={() => setEditing(false)}><Check />Done</Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => setGallery(true)}><Plus />Add widget</Button>
            <Button variant="outline" onClick={() => setEditing(true)}><LayoutGrid />Customize</Button>
          </>
        )}
      />
      {editing && (
        <p role="status" className="mt-4 animate-enter text-body text-muted">
          Drag a widget by its grip to move it, pick a size, or remove it. Changes save on this browser.
        </p>
      )}
      <div className="mt-6">
        {visible.length === 0 ? (
          <EmptyState action={<Button size="sm" variant="primary" onClick={() => setGallery(true)}><Plus />Add widget</Button>}>
            Your dashboard is empty. Add the widgets you want to see first thing.
          </EmptyState>
        ) : (
          <WidgetGrid ids={visible.map((w) => w.uid)} onReorder={reorder}>
            {visible.map((w, i) => {
              const def = widgetByType(w.type)!;
              const size: WidgetSize = def.sizes.includes(w.size) ? w.size : def.defaultSize;
              return (
                <WidgetFrame
                  key={w.uid} uid={w.uid} title={def.title} aside={def.aside} size={size} sizes={def.sizes} editing={editing}
                  onResize={(s) => resize(w.uid, s)} onMove={(by) => move(w.uid, by)}
                  onRemove={() => { remove(w.uid); toast(`Removed ${def.title}`, { action: { label: "Undo", onClick: () => add(w.type, w.size) } }); }}
                  canMoveEarlier={i > 0} canMoveLater={i < visible.length - 1}
                >
                  <def.Body size={size} />
                </WidgetFrame>
              );
            })}
          </WidgetGrid>
        )}
      </div>
      <Modal open={gallery} onOpenChange={setGallery} title="Add a widget" className="w-[min(980px,calc(100vw-32px))] top-[6vh]">
        <p className="px-5 pt-1 text-body text-muted">Each preview shows this plant&apos;s data at the size you pick.</p>
        <ul className="grid max-h-[72vh] grid-cols-1 gap-3 overflow-y-auto overscroll-contain p-5 sm:grid-cols-2 lg:grid-cols-3">
          {WIDGETS.map((def) => (
            <GalleryItem key={def.type} def={def} added={onBoard.has(def.type)}
              onAdd={(s) => { add(def.type, s); toast.success(`${def.title} added`, { description: `${SIZE_LABEL[s]} size, at the end of your dashboard.` }); }} />
          ))}
        </ul>
      </Modal>
    </Canvas>
  );
}

function GalleryItem({ def, added, onAdd }: { def: WidgetDef; added: boolean; onAdd: (s: WidgetSize) => void }) {
  const [size, setSize] = useState<WidgetSize>(def.defaultSize);
  return (
    <WidgetCard
      title={def.title} description={def.description} sizes={def.sizes} size={size} onSize={setSize} added={added} onAdd={() => onAdd(size)}
      preview={
        <div className="flex size-full flex-col overflow-hidden rounded-card border border-border bg-surface">
          <div className="flex-none px-4 pt-3"><span className={size === "small" ? "text-small text-muted" : "text-section font-medium"}>{def.title}</span></div>
          <div className="min-h-0 flex-1 px-4 pt-2 pb-4"><def.Body size={size} /></div>
        </div>
      }
    />
  );
}
