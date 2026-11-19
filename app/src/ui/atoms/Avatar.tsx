import { cn } from "@/lib/cn";

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");

/** A person's initials on a neutral disc: identity, never a colour that could read as data. `hue` is accepted and ignored. */
export function Avatar({ name, size = 24, className }: { name: string; hue?: number; size?: 20 | 24 | 32; className?: string }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className={cn(
        "inline-flex flex-none items-center justify-center rounded-full font-medium",
        "bg-active text-text",
        size === 32 ? "text-body" : "text-[11px]",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

/** The Viper mark, the exact geometry of the website's viper-icon.svg: outer V in ink (follows the theme), inner V in the brand maroon. */
export const MARK_PATHS = ["M1976.82 754.94 L1089.265 754.94 M1261.845 1277.864 L935.777 288.168 L215.797 288.168 L1150.98 2808.033 L1871.159 2808.033 L2808.023 288.168 L2087.8 288.168 L1797.196 1277.864 M1261.845 1277.864 L1797.196 1277.864 M1797.196 1277.864 L1525.998 2078.044 L1261.845 1277.864", "M1795.85 883.648 L1264.579 883.648 M1367.882 1224.491 L1172.705 645.114 L741.741 576.114 L1301.521 2221.859 L1732.604 2221.859 L2293.39 576.114 L1862.281 645.114 L1688.331 1224.491 M1367.882 1224.491 L1688.331 1224.491 M1688.331 1224.491 L1525.999 1746.051 L1367.882 1224.491"];

export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 3024 3000" aria-hidden className={cn("size-7", className)}>
      <path fill="currentColor" d={MARK_PATHS[0]} />
      <path className="fill-[#660000] dark:fill-[#c46a6a]" d={MARK_PATHS[1]} />
    </svg>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn("block rounded-[4px] bg-active", className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={cn("size-4 animate-spin text-muted [animation-duration:900ms]", className)}>
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth="2" />
      <path d="M14 8a6 6 0 0 0-6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
