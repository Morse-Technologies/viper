"use client";
// The dashboard's widget layout, kept per browser. shortcut: localStorage only; move to a per-user setting on the backend.
import { useCallback, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { gsap } from "gsap";
import { Flip } from "@/lib/gsapIn";
import { reduced } from "@/lib/motion";

import type { WidgetSize } from "@/ui/organisms/Widgets";
import { parseLayout, type Placed } from "./savedLayout";
import { WIDGETS } from "./widgets";

const KNOWN_TYPES: ReadonlySet<string> = new Set(WIDGETS.map((w) => w.type));

const KEY = "viper-dashboard";
const EVENT = "viper-dashboard";

export const DEFAULT_LAYOUT: Placed[] = [
  { uid: "w1", type: "kpi-machines", size: "small" },
  { uid: "w2", type: "kpi-alerts", size: "small" },
  { uid: "w3", type: "kpi-quiet", size: "small" },
  { uid: "w4", type: "kpi-models", size: "small" },
  { uid: "w5", type: "severity", size: "medium" },
  { uid: "w6", type: "deviating", size: "big" },
  { uid: "w7", type: "edge", size: "medium" },
  { uid: "w8", type: "cameras", size: "medium" },
  { uid: "w9", type: "labelling", size: "medium" },
];

let cacheRaw: string | null | undefined;
let cache: Placed[] = DEFAULT_LAYOUT;
const read = (): Placed[] => {
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY); } catch {}
  if (raw === cacheRaw) return cache; // stable snapshot for useSyncExternalStore
  cacheRaw = raw;
  cache = parseLayout(raw, KNOWN_TYPES, DEFAULT_LAYOUT);
  return cache;
};
const subscribe = (cb: () => void) => { window.addEventListener(EVENT, cb); window.addEventListener("storage", cb); return () => { window.removeEventListener(EVENT, cb); window.removeEventListener("storage", cb); }; };

/** Layout changes animate with GSAP Flip: every widget glides and resizes from where it was to where it lands. */
function commit(next: Placed[]) {
  const apply = () => {
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    window.dispatchEvent(new Event(EVENT));
  };
  if (reduced()) return apply();
  const state = Flip.getState("[data-widget]");
  flushSync(apply);
  Flip.from(state, {
    targets: "[data-widget]", duration: 0.55, ease: "power3.inOut", nested: true, prune: true,
    onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.45, ease: "power3.out" }),
  });
}

/** Widgets leave first (fade and shrink), then the grid closes the gap. */
function leaveThen(uid: string, then: () => void) {
  const el = document.querySelector<HTMLElement>(`[data-widget="${uid}"]`);
  if (!el || reduced()) return then();
  gsap.to(el, { opacity: 0, scale: 0.96, duration: 0.22, ease: "power2.in", onComplete: then });
}

export function useDashboardLayout() {
  const layout = useSyncExternalStore(subscribe, read, () => DEFAULT_LAYOUT);
  const resize = useCallback((uid: string, size: WidgetSize) => commit(read().map((w) => (w.uid === uid ? { ...w, size } : w))), []);
  const remove = useCallback((uid: string) => leaveThen(uid, () => commit(read().filter((w) => w.uid !== uid))), []);
  const add = useCallback((type: string, size: WidgetSize) => commit([...read(), { uid: `w${Date.now().toString(36)}`, type, size }]), []);
  const move = useCallback((uid: string, by: -1 | 1) => {
    const list = [...read()];
    const i = list.findIndex((w) => w.uid === uid);
    const j = i + by;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    commit(list);
  }, []);
  // Dropped by hand: the grid glides from where the widget was let go to its new slot.
  const reorder = useCallback((uid: string, overUid: string) => {
    const list = [...read()];
    const from = list.findIndex((w) => w.uid === uid);
    const to = list.findIndex((w) => w.uid === overUid);
    if (from < 0 || to < 0 || from === to) return;
    list.splice(to, 0, list.splice(from, 1)[0]);
    commit(list);
  }, []);
  const reset = useCallback(() => commit(DEFAULT_LAYOUT), []);
  return { layout, resize, remove, add, move, reorder, reset };
}
