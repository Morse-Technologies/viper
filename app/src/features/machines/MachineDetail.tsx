"use client";
import { useRouter, useSearchParams } from "next/navigation";
import type { Machine } from "@/lib/api/types";
import { HealthPill, PageHeader, Tabs } from "@/ui/cells";
import { AcousticsTab } from "./AcousticsTab";
import { AlertsTab } from "./AlertsTab";
import { ConfigTab } from "./ConfigTab";
import { ModelsTab } from "./ModelsTab";
import { SignalsTab } from "./SignalsTab";
import { SummaryTab } from "./SummaryTab";
import { VisionTab } from "./VisionTab";
import { DEFAULT_TAB, MACHINE_TABS, type MachineTab } from "./tabs";

function parseTab(raw: string | null): MachineTab {
  const hit = MACHINE_TABS.find((t) => t.value === raw);
  return hit?.value ?? DEFAULT_TAB;
}

export function MachineDetail({ machine }: { machine: Machine }) {
  const router = useRouter();
  const params = useSearchParams();
  const tab = parseTab(params.get("tab"));
  const setTab = (next: MachineTab) => {
    const q = new URLSearchParams(params.toString());
    if (next === DEFAULT_TAB) q.delete("tab");
    else q.set("tab", next);
    const suffix = q.toString();
    router.replace(`/machines/${machine.id}${suffix ? `?${suffix}` : ""}`, { scroll: false });
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto md:h-[calc((100dvh-66px)/var(--content-zoom))]">
      <div className="border-b border-border px-4 pt-5 pb-0 md:px-6">
        <PageHeader
          title={`${machine.code} · ${machine.name}`}
          subline={`${machine.kind} · ${machine.line} · ${machine.pack}@${machine.packVersion}`}
          actions={<HealthPill health={machine.health} />}
        />
        <Tabs
          className="mt-4" label="Machine sections" tabs={[...MACHINE_TABS]}
          value={tab} onChange={setTab}
        />
      </div>
      <div key={tab} className="animate-enter flex-1 px-4 py-5 md:px-6">
        <TabBody tab={tab} machine={machine} />
      </div>
    </div>
  );
}

function TabBody({ tab, machine }: { tab: MachineTab; machine: Machine }) {
  switch (tab) {
    case "summary": return <SummaryTab machine={machine} />;
    case "signals": return <SignalsTab machineId={machine.id} />;
    case "acoustics": return <AcousticsTab machineId={machine.id} />;
    case "vision": return <VisionTab machineId={machine.id} />;
    case "alerts": return <AlertsTab machineId={machine.id} />;
    case "models": return <ModelsTab />;
    case "config": return <ConfigTab machine={machine} />;
  }
}
