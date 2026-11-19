/** Fake QR as a seeded square grid — enough for the mock setup, not a real otpauth payload. */
const GRID = 21;
const CELL = 4;
const SIZE = GRID * CELL;

function cellOn(seed: string, row: number, col: number): boolean {
  const n = (seed.charCodeAt((row * GRID + col) % seed.length) + row * 17 + col * 31) % 7;
  return n < 3 || finder(row, col);
}

function finder(row: number, col: number): boolean {
  const inCorner = (r: number, c: number) => r >= 0 && r < 7 && c >= 0 && c < 7;
  const corners = [[0, 0], [0, GRID - 7], [GRID - 7, 0]] as const;
  return corners.some(([oy, ox]) => {
    const r = row - oy; const c = col - ox;
    if (!inCorner(r, c)) return false;
    const edge = r === 0 || r === 6 || c === 0 || c === 6;
    const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
    return edge || core;
  });
}

export function TotpQr({ seed }: { seed: string }) {
  const cells: { x: number; y: number }[] = [];
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      if (cellOn(seed, row, col)) cells.push({ x: col * CELL, y: row * CELL });
    }
  }
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={144} height={144} aria-hidden className="rounded-control border border-border bg-surface p-2 text-text">
      {cells.map((c) => (
        <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width={CELL - 0.4} height={CELL - 0.4} fill="currentColor" />
      ))}
    </svg>
  );
}
