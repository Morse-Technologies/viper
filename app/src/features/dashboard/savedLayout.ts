import type { WidgetSize } from "@/ui/organisms/Widgets";

export type Placed = { uid: string; type: string; size: WidgetSize };

/**
 * Reads a layout saved in the browser. A widget type this version no longer has (one that was retired since the
 * layout was saved) is dropped, so an old layout never breaks the dashboard. Anything unreadable gives `fallback`.
 */
export function parseLayout(raw: string | null, known: ReadonlySet<string>, fallback: Placed[]): Placed[] {
  if (!raw) return fallback;
  try {
    const saved = JSON.parse(raw) as Placed[];
    return Array.isArray(saved) ? saved.filter((w) => known.has(w.type)) : fallback;
  } catch {
    return fallback;
  }
}
