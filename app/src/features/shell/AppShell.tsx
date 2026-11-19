"use client";
import { useIsFetching } from "@tanstack/react-query";
import { Check, ChevronDown, Factory, LogOut, Moon, PanelLeft, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ViewTransition, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useAlerts, useLabelTasks, useMachines, useMe, usePlant, usePlantId, usePlants } from "@/features/hooks";
import type { Alert, Machine } from "@/lib/api";
import { SEVERITY_ORDER } from "@/lib/labels";
import { useMod } from "@/lib/platform";
import { Kbd, Pill, Spinner } from "@/ui/atoms";
import { Menu, SeverityGlyph, Sheet } from "@/ui/cells";
import { AppSidebar, BottomBar, type NavItem } from "@/ui/organisms/AppRail";
import { CommandPalette, type PaletteItem } from "@/ui/organisms/CommandPalette";
import { ShellLayout, TopBar } from "@/ui/templates/ShellLayout";
import { FOOTER, HINTS, JUMPS, TITLES, navGroups } from "./nav";
import { useTheme } from "./theme";

const BOTTOM_BAR_ITEMS = 4;
const G_CHORD_MS = 900;
const PEEK_ITEMS = 4;
const PALETTE_MAX_MACHINES = 6;

const isOpen = (a: Alert) => a.status === "open" || a.status === "acknowledged";
const bySeverity = (a: Alert, b: Alert) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity);

/** Hovering Alerts on the collapsed rail shows the worst open alerts (300px peek, as in Atlas). */
function AlertsPeek({ alerts, machines }: { alerts: Alert[]; machines: Machine[] }) {
  const open = alerts.filter(isOpen).sort(bySeverity);
  return (
    <div>
      <div className="flex items-baseline justify-between px-1 pb-2">
        <span className="text-body font-medium">Open alerts</span>
        <Link href="/alerts" className="text-small text-muted hover:text-text">View all {open.length}</Link>
      </div>
      <ul className="flex flex-col">
        {open.slice(0, PEEK_ITEMS).map((a) => (
          <li key={a.id}>
            <Link href={`/alerts?id=${a.id}`} className="flex items-start gap-2 rounded-control px-1.5 py-2 hover:bg-raised">
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-body">{a.title}</span>
                <span className="text-small text-muted">{machines.find((m) => m.id === a.machineId)?.code}</span>
              </span>
              <SeverityGlyph severity={a.severity} label={false} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Sidebar state, remembered per browser. */
const NAV_KEY = "viper-nav";
const readNav = () => { try { return localStorage.getItem(NAV_KEY) === "expanded"; } catch { return false; } };
const subscribeNav = (cb: () => void) => { window.addEventListener(NAV_KEY, cb); return () => window.removeEventListener(NAV_KEY, cb); };
function useSidebar() {
  const expanded = useSyncExternalStore(subscribeNav, readNav, () => false);
  const toggle = useCallback(() => {
    try { localStorage.setItem(NAV_KEY, readNav() ? "collapsed" : "expanded"); } catch {}
    window.dispatchEvent(new Event(NAV_KEY));
  }, []);
  return { expanded, toggle };
}

/** ⌘K palette, ⌘\\ sidebar, and "G then a letter" jumps (ignored while typing). */
function useShellShortcuts({ onPalette, onToggleNav }: { onPalette: () => void; onToggleNav: () => void }) {
  const router = useRouter();
  const pendingG = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); onPalette(); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") { e.preventDefault(); onToggleNav(); return; }
      const t = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || t.closest("input, textarea, select, [contenteditable=true]")) return;
      if (pendingG.current) {
        clearTimeout(pendingG.current); pendingG.current = null;
        const to = JUMPS[e.key.toLowerCase()];
        if (to) { e.preventDefault(); router.push(to); }
        return;
      }
      if (e.key.toLowerCase() === "g") pendingG.current = setTimeout(() => { pendingG.current = null; }, G_CHORD_MS);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onPalette, onToggleNav, router]);
}

type PaletteSource = { query: string; screens: NavItem[]; machines: Machine[]; nav: ReturnType<typeof useSidebar>; theme: ReturnType<typeof useTheme> };

const keys = (k: string[]) => <span className="flex gap-0.5">{k.map((x) => <Kbd key={x}>{x}</Kbd>)}</span>;

/** Palette rows: matching machines first, then screens, then actions. */
function usePaletteItems({ query, screens, machines, nav, theme }: PaletteSource): PaletteItem[] {
  const router = useRouter();
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (label: string) => !q || label.toLowerCase().includes(q);
    const found = (q ? machines : []).filter((m) => matches(`${m.code} ${m.name}`)).slice(0, PALETTE_MAX_MACHINES).map<PaletteItem>((m) => ({
      id: `m-${m.id}`, group: "Machines", label: `${m.code}, ${m.name}`, hint: m.line, icon: <Factory />, onSelect: () => router.push(`/machines/${m.id}`),
    }));
    const goTo = screens.filter((n) => matches(n.label)).map<PaletteItem>((n) => ({
      id: `go-${n.href}`, group: "Go to", label: n.label, icon: <n.icon />, onSelect: () => router.push(n.href),
      hint: HINTS[n.href] ? keys(HINTS[n.href]) : undefined,
    }));
    const actions: PaletteItem[] = [
      { id: "act-nav", group: "Actions", label: nav.expanded ? "Collapse sidebar" : "Expand sidebar", icon: <PanelLeft />, onSelect: nav.toggle, hint: keys(["⌘", "\\"]) },
      { id: "act-theme", group: "Actions", label: theme.theme === "dark" ? "Switch to light theme" : "Switch to dark theme", icon: theme.theme === "dark" ? <Sun /> : <Moon />, onSelect: () => theme.toggle() },
    ].filter((a) => matches(a.label));
    return [...found, ...goTo, ...actions];
  }, [query, machines, screens, nav.expanded, nav.toggle, theme, router]);
}

/** The scope breadcrumb: the plant (switchable) or the group, then the screen. */
function Scope({ pathname }: { pathname: string }) {
  const plant = usePlant();
  const { data: plants } = usePlants();
  const { data: me } = useMe();
  const { setPlantId } = usePlantId();
  const [first, second] = pathname.split("/").slice(1);
  const { data: machines } = useMachines("group");
  const machine = first === "machines" && second ? machines?.find((m) => m.id === second) : undefined;
  const isGroup = first === "group";
  return (
    <>
      {isGroup ? <span className="truncate text-text">{me?.groupName}</span> : (
        <Menu
          align="start"
          trigger={<button type="button" className="inline-flex items-center gap-1 truncate rounded-control text-text hover:text-muted" aria-label="Change plant">{plant?.name ?? "…"}<ChevronDown className="size-3.5" /></button>}
          items={(plants ?? []).map((p) => ({ label: p.name, icon: p.id === plant?.id ? <Check /> : <Factory />, onClick: () => setPlantId(p.id) }))}
        />
      )}
      <span aria-hidden>/</span>
      {machine ? <><Link href="/machines" className="truncate hover:text-text">{TITLES.machines}</Link><span aria-hidden>/</span><span className="truncate">{machine.code}</span></> : <span className="truncate">{TITLES[first ?? ""] ?? ""}</span>}
      <Pill className="ml-auto sm:ml-2">Mock data</Pill>
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const mod = useMod();
  const pathname = usePathname();
  const router = useRouter();
  const { data: me } = useMe();
  const { data: alerts } = useAlerts();
  const { data: machines } = useMachines();
  const { data: tasks } = useLabelTasks();
  const themeState = useTheme();
  const nav = useSidebar();
  const [palette, setPalette] = useState(false);
  const [more, setMore] = useState(false);
  const [query, setQuery] = useState("");
  const fetching = useIsFetching();
  const togglePalette = useCallback(() => setPalette((o) => !o), []);
  useShellShortcuts({ onPalette: togglePalette, onToggleNav: nav.toggle });

  const openCount = alerts?.filter(isOpen).length ?? 0;
  const groups = useMemo(() => navGroups({ alerts: openCount, labelling: tasks?.length ?? 0 }), [openCount, tasks?.length]);
  const all = useMemo(() => [...groups.flat(), ...FOOTER], [groups]);
  const paletteItems = usePaletteItems({ query, screens: all, machines: machines ?? [], nav, theme: themeState });
  const accountItems = [{ label: "Sign out", icon: <LogOut />, onClick: () => router.push("/login") }];

  return (
    <ShellLayout
      rail={
        <AppSidebar
          groups={groups} footer={FOOTER} pathname={pathname} user={me ?? undefined}
          expanded={nav.expanded} onToggleExpanded={nav.toggle}
          peek={{ href: "/alerts", content: <AlertsPeek alerts={alerts ?? []} machines={machines ?? []} /> }}
          theme={themeState.theme} onToggleTheme={(e) => themeState.toggle(e)} accountItems={accountItems}
        />
      }
      topbar={
        <TopBar scope={<Scope pathname={pathname} />}>
          <span role="status" aria-live="polite" className={`inline-flex items-center gap-1.5 text-small text-muted transition-opacity duration-[var(--dur-2)] ${fetching ? "opacity-100" : "opacity-0"}`}>
            <Spinner className="size-3" />{fetching ? "Updating" : ""}
          </span>
          <button
            type="button" onClick={() => setPalette(true)}
            className="hidden h-8 w-72 items-center justify-between rounded-control border border-control bg-surface px-3 text-body text-faint transition-colors duration-[var(--dur-1)] hover:border-muted lg:flex"
          >
            Search machines or screens
            <span className="text-small">{mod === "⌘" ? "⌘K" : "Ctrl K"}</span>
          </button>
        </TopBar>
      }
      bottomBar={<BottomBar items={all.slice(0, BOTTOM_BAR_ITEMS)} pathname={pathname} onMore={() => setMore(true)} />}
    >
      <ViewTransition key={pathname.split("/")[1]} enter="page-enter" exit="page-exit" default="none">
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </ViewTransition>
      <CommandPalette
        open={palette} onOpenChange={(o) => { setPalette(o); if (!o) setQuery(""); }}
        query={query} onQueryChange={setQuery} items={paletteItems}
      />
      <Sheet open={more} onOpenChange={setMore} title="Viper" description={me?.groupName}>
        <nav aria-label="All screens" className="flex flex-col p-2">
          {all.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setMore(false)} className="flex h-11 items-center gap-3 rounded-control px-3 text-body hover:bg-raised">
              <n.icon className="size-[18px] text-muted" strokeWidth={1.6} />{n.label}
            </Link>
          ))}
          <button type="button" onClick={(e) => themeState.toggle(e)} className="flex h-11 items-center gap-3 rounded-control px-3 text-left text-body hover:bg-raised">
            {themeState.theme === "dark" ? "Light theme" : "Dark theme"}
          </button>
        </nav>
      </Sheet>
    </ShellLayout>
  );
}
