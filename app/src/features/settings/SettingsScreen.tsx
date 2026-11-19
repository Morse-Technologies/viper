"use client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect } from "react";
import { PageHeader, Tabs } from "@/ui/cells";
import { Canvas } from "@/ui/templates/ShellLayout";
import { AppearancePanel } from "./AppearancePanel";
import { DriversPanel } from "./DriversPanel";
import { LicencePanel } from "./LicencePanel";
import { ThresholdsPanel } from "./ThresholdsPanel";
import { UsersPanel } from "./UsersPanel";

const TABS = [
  { value: "drivers", label: "Drivers & hardware" },
  { value: "thresholds", label: "Thresholds" },
  { value: "users", label: "Users & roles" },
  { value: "licence", label: "Licence" },
  { value: "appearance", label: "Appearance" },
] as const;

type Tab = (typeof TABS)[number]["value"];
const TAB_VALUES = new Set<string>(TABS.map((t) => t.value));
const DEFAULT_TAB: Tab = "drivers";

function parseTab(raw: string | null): Tab {
  return raw && TAB_VALUES.has(raw) ? (raw as Tab) : DEFAULT_TAB;
}

export function SettingsScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const tab = parseTab(params.get("tab"));
  const legacySources = params.get("tab") === "sources";

  // Sources moved to its own screen (§21.6); old links still land there.
  useEffect(() => { if (legacySources) router.replace("/sources"); }, [legacySources, router]);

  const setTab = useCallback((next: Tab) => {
    const q = new URLSearchParams(params.toString());
    q.set("tab", next);
    router.replace(`?${q.toString()}`, { scroll: false });
  }, [params, router]);

  return (
    <Canvas>
      <PageHeader
        title="Configuration"
        subline={<>Drivers, thresholds, people and the licence for this plant. Data sources and edge devices are in <Link href="/sources" className="text-text underline decoration-control underline-offset-2 hover:decoration-text">Sources</Link>.</>}
      />
      <Tabs className="mt-6" label="Configuration sections" tabs={[...TABS]} value={tab} onChange={setTab} />
      <div key={tab} className="mt-6 animate-enter">
        {tab === "drivers" && <DriversPanel />}
        {tab === "thresholds" && <ThresholdsPanel />}
        {tab === "users" && <UsersPanel />}
        {tab === "licence" && <LicencePanel />}
        {tab === "appearance" && <AppearancePanel />}
      </div>
    </Canvas>
  );
}
