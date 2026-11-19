const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

/** Cursor lag for sources: "42 s", "10 min", "2 h 10 min". */
export function fmtLag(seconds: number): string {
  if (seconds < SECONDS_PER_MINUTE) return `${seconds} s`;
  const hours = Math.floor(seconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}
