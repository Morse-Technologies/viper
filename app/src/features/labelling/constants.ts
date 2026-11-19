import type { LabelReason } from "@/lib/api/types";

export const SHIFT_LABEL_LIMIT = 120;

export const REASON_ORDER: readonly LabelReason[] = [
  "uncertainty",
  "disagreement",
  "novelty",
];

export const SERIES_RANGE = "24h" as const;
