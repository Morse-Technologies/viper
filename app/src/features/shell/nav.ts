import {
  AudioLines, Bell, Camera, Cpu, LayoutDashboard, LineChart, Network, Settings, Tag, Factory,
} from "lucide-react";
import type { NavItem } from "@/ui/organisms/AppRail";

/** Screen titles for the scope breadcrumb, by first path segment. */
export const TITLES: Record<string, string> = {
  dashboard: "Dashboard", machines: "Machines", alerts: "Alerts", signals: "Signals", acoustics: "Vibration & sound",
  vision: "Vision", labelling: "Labelling", models: "Models", group: "Group", settings: "Configuration",
};

/** "G" then a letter jumps to a screen (§21.6). */
export const JUMPS: Record<string, string> = {
  t: "/dashboard", m: "/machines", a: "/alerts", s: "/signals", u: "/acoustics", v: "/vision",
  e: "/labelling", o: "/models", h: "/group", c: "/settings",
};
export const HINTS: Record<string, string[]> = Object.fromEntries(Object.entries(JUMPS).map(([k, v]) => [v, ["G", k.toUpperCase()]]));

export function navGroups(counts: { alerts: number; labelling: number }): NavItem[][] {
  return [
    [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/machines", label: "Machines", icon: Factory },
      { href: "/alerts", label: "Alerts", icon: Bell, count: counts.alerts || undefined },
    ],
    [
      { href: "/signals", label: "Signals", icon: LineChart },
      { href: "/acoustics", label: "Vibration & sound", icon: AudioLines },
      { href: "/vision", label: "Vision", icon: Camera },
    ],
    [
      { href: "/labelling", label: "Labelling", icon: Tag, count: counts.labelling || undefined },
      { href: "/models", label: "Models", icon: Cpu },
      { href: "/group", label: "Group", icon: Network },
    ],
  ];
}

export const FOOTER: NavItem[] = [{ href: "/settings", label: "Configuration", icon: Settings }];
