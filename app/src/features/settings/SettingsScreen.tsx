"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { PageHeader, Tabs } from "@/ui/cells";
import { Canvas } from "@/ui/templates/ShellLayout";
import { AppearancePanel } from "./AppearancePanel";
import { DriversPanel } from "./DriversPanel";
import { LicencePanel } from "./LicencePanel";
import { SourcesPanel } from "./SourcesPanel";
import { ThresholdsPanel } from "./ThresholdsPanel";
import { UsersPanel } from "./UsersPanel";

const TABS = [
  { value: "sources", label: "Sources" },
  { value: "drivers", label: "Drivers & hardware" },
  { value: "thresholds", label: "Thresholds" },
  { value: "users", label: "Users & roles" },
  { value: "licence", label: "Licence" },
  { value: "appearance", label: "Appearance" },
] as const;

type Tab = (typeof TABS)[number]["value"];
const TAB_VALUES = new Set<string>(TABS.map((t) => t.value));
const DEFAULT_TAB: Tab = "sources";

function parseTab(raw: string | null): Tab {
  return raw && TAB_VALUES.has(raw) ? (raw as Tab) : DEFAULT_TAB;
}

export function SettingsScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const tab = parseTab(params.get("tab"));

  const setTab = useCallback((next: Tab) => {
    const q = new URLSearchParams(params.toString());
    q.set("tab", next);
    router.replace(`?${q.toString()}`, { scroll: false });
  }, [params, router]);

  return (
    <Canvas>
      <PageHeader title="Configuration" subline="Sources, drivers, thresholds, people and the licence for this plant." />
      <Tabs className="mt-6" label="Configuration sections" tabs={[...TABS]} value={tab} onChange={setTab} />
      <div key={tab} className="mt-6 animate-enter">
        {tab === "sources" && <SourcesPanel />}
        {tab === "drivers" && <DriversPanel />}
        {tab === "thresholds" && <ThresholdsPanel />}
        {tab === "users" && <UsersPanel />}
        {tab === "licence" && <LicencePanel />}
        {tab === "appearance" && <AppearancePanel />}
      </div>
    </Canvas>
  );
}
