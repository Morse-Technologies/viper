"use client";
import { useSyncExternalStore } from "react";

/** Canvas-drawn charts can't use CSS classes, so they read the live token values and redraw when the theme changes. */
const NAMES = ["text", "muted", "faint", "bar", "bar-miss", "accent", "accent-soft", "grid", "raised", "surface", "negative", "pill-warning-ink", "control"] as const;
export type TokenName = (typeof NAMES)[number];
export type Tokens = Record<TokenName, string>;

const FALLBACK = Object.fromEntries(NAMES.map((n) => [n, "#888"])) as Tokens;
let cacheKey = "";
let cache: Tokens = FALLBACK;

/** CSS minifiers shorten colours (#ffffff → #fff); canvas code wants the six-digit form. */
const longHex = (v: string) => (/^#[0-9a-f]{3}$/i.test(v) ? `#${[...v.slice(1)].map((c) => c + c).join("")}` : v);

function read(): Tokens {
  const style = getComputedStyle(document.documentElement);
  const key = NAMES.map((n) => style.getPropertyValue(`--${n}`).trim()).join("|");
  if (key !== cacheKey) {
    cacheKey = key;
    cache = Object.fromEntries(NAMES.map((n) => [n, longHex(style.getPropertyValue(`--${n}`).trim())])) as Tokens;
  }
  return cache;
}
const subscribe = (cb: () => void) => {
  const mq = matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener("viper-theme", cb);
  mq.addEventListener("change", cb);
  return () => { window.removeEventListener("viper-theme", cb); mq.removeEventListener("change", cb); };
};

export const useTokens = () => useSyncExternalStore(subscribe, read, () => FALLBACK);
