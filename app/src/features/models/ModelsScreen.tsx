"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useModels, usePlant } from "@/features/hooks";
import { plural } from "@/lib/format";
import { Card, EmptyState, ErrorState, LoadingRows, PageHeader } from "@/ui/cells";
import { Canvas } from "@/ui/templates/ShellLayout";
import { ModelDetail } from "./ModelDetail";
import { ModelRegistry } from "./ModelRegistry";
import { registryCounts } from "./modelHelpers";

function modelsSubline(active: number, shadow: number, drifting: number) {
  return `${plural(active, "active", "active")} · ${shadow} in shadow · ${plural(drifting, "drifting", "drifting")}`;
}

export function ModelsScreen() {
  const models = useModels();
  const plant = usePlant();
  const params = useSearchParams();
  const router = useRouter();
  const selectedId = params.get("id");
  const rows = models.data ?? [];
  const selected = rows.find((m) => m.id === selectedId) ?? rows[0] ?? null;
  const counts = registryCounts(rows);

  const select = (id: string) => {
    router.replace(`/models?id=${id}`, { scroll: false });
  };

  return (
    <Canvas>
      <PageHeader
        title="Models"
        subline={models.data
          ? modelsSubline(counts.active, counts.shadow, counts.drifting)
          : "Registry, shadow compare, and drift for this plant."}
      />
      {models.isPending ? (
        <div className="mt-6"><LoadingRows rows={6} pitch="h-12" /></div>
      ) : models.isError ? (
        <div className="mt-6"><ErrorState what="models" onRetry={() => models.refetch()} /></div>
      ) : !rows.length ? (
        <EmptyState className="mt-6">No models registered for this plant yet.</EmptyState>
      ) : (
        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
          <Card id="registry-h" title="Registry" flush aside={`${rows.length} models`}>
            <ModelRegistry
              models={rows}
              selectedId={selected?.id ?? null}
              onSelect={select}
            />
          </Card>
          {selected && (
            <ModelDetail model={selected} plantName={plant?.name ?? "—"} />
          )}
        </div>
      )}
    </Canvas>
  );
}
