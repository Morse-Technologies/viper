"use client";
import { useCallback, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { reduced } from "@/lib/motion";

export type Theme = "light" | "dark";
const KEY = "viper-theme";
const EVENT = "viper-theme";
const REVEAL_MS = 560;

const readTheme = (): Theme => {
  const attr = document.documentElement.dataset.theme;
  return attr === "dark" || (!attr && matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
};
const subscribe = (cb: () => void) => {
  const mq = matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener(EVENT, cb);
  mq.addEventListener("change", cb);
  return () => { window.removeEventListener(EVENT, cb); mq.removeEventListener("change", cb); };
};

function apply(next: Theme) {
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem(KEY, next); } catch {}
  window.dispatchEvent(new Event(EVENT));
}

/** Light, dark, or the system's until the person picks one. The new theme is revealed as a circle growing from the click. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as Theme);
  const toggle = useCallback((e?: { clientX: number; clientY: number }) => {
    const next: Theme = readTheme() === "dark" ? "light" : "dark";
    if (!document.startViewTransition || reduced()) return apply(next);
    const x = e?.clientX ?? innerWidth / 2;
    const y = e?.clientY ?? innerHeight / 2;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = document.startViewTransition(() => flushSync(() => apply(next)));
    vt.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: REVEAL_MS, easing: "cubic-bezier(0.77, 0, 0.175, 1)", pseudoElement: "::view-transition-new(root)" },
      );
    });
  }, []);
  return { theme, toggle };
}

/** Back to following the operating system. */
export function followSystem() {
  delete document.documentElement.dataset.theme;
  try { localStorage.removeItem(KEY); } catch {}
  window.dispatchEvent(new Event(EVENT));
}
