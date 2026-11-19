/** A marker label waiting for a place: its line position, its text width and how much it matters (0 first). */
export type LabelBox = { x: number; width: number; priority: number };

const PAD = 4;
/** Wide enough that two neighbouring labels never read as one word ("3×" beside "BPFO"). */
const GAP = 14;

/**
 * Gives each label a row (0 at the top) so none overlap, or null when there is no room at this zoom.
 * Labels sit right of their line and flip to the left at the plot's right edge. The most important go first,
 * so zooming out drops harmonics and families before the shaft speed or the attributed fault.
 */
export function placeLabels(boxes: LabelBox[], left: number, right: number, rows: number): (number | null)[] {
  // Per row: label spans, and the marker lines that run down through it from labels above.
  const labels: [number, number][][] = Array.from({ length: rows }, () => []);
  const lines: number[][] = Array.from({ length: rows }, () => []);
  const order = boxes.map((b, i) => i).sort((a, b) => boxes[a].priority - boxes[b].priority || boxes[a].x - boxes[b].x);
  const out: (number | null)[] = boxes.map(() => null);
  const clear = (span: [number, number], r: number) =>
    labels[r].every(([a, b]) => span[1] <= a || span[0] >= b) && lines[r].every((x) => x <= span[0] || x >= span[1]);
  for (const i of order) {
    const { x, width } = boxes[i];
    if (x < left || x > right) continue;
    const from = labelStart(x, width, right);
    const span: [number, number] = [from - GAP / 2, from + width + GAP / 2];
    // This label's own line must not cut through a label already placed lower down.
    const row = labels.findIndex((_, r) => clear(span, r) && labels.slice(r + 1).every((row) => row.every(([a, b]) => x <= a || x >= b)));
    if (row === -1) continue;
    labels[row].push(span);
    for (let k = row + 1; k < rows; k++) lines[k].push(x);
    out[i] = row;
  }
  return out;
}

/** Where the label's text starts for a line at `x`, matching the flip in `placeLabels`. */
export const labelStart = (x: number, width: number, right: number): number => (x + PAD + width <= right ? x + PAD : x - PAD - width);
