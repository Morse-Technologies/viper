import type { Range, Series } from "@/lib/api/types";

export const MAX_SIGNALS = 8;
export const SYNC_KEY = "explorer";
export const DEFAULT_RANGE: Range = "24h";
export const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: "1h", label: "1 h" },
  { value: "24h", label: "24 h" },
  { value: "7d", label: "7 d" },
  { value: "30d", label: "30 d" },
];

export const AGG_LABEL: Record<Series["agg"], string> = {
  raw: "raw",
  "1m": "1 min",
  "5m": "5 min",
  "1h": "1 h",
};

export const isRange = (v: string | null): v is Range =>
  v === "1h" || v === "24h" || v === "7d" || v === "30d";

/** Absent param → null (apply defaults). Present empty → []. */
export function parseSignalIds(raw: string | null): string[] | null {
  if (raw === null) return null;
  if (raw === "") return [];
  return raw.split(",").filter(Boolean).slice(0, MAX_SIGNALS);
}
