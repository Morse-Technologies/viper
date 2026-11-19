import {
  Activity, AudioWaveform, Camera, Gauge, ScanText, Thermometer, Vibrate, type LucideIcon,
} from "lucide-react";
import type { AlertStatus, Evidence, Health, Modality, Severity } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { fmtTime } from "@/lib/format";
import { alertStatusLabel, healthLabel, modalityLabel, severityLabel } from "@/lib/labels";
import { Band, Pill, type Tone } from "@/ui/atoms";

/** One icon per modality, the same on every screen (§21.5). */
export const modalityIcon: Record<Modality, LucideIcon> = {
  series: Activity, vibration: Vibrate, audio: AudioWaveform, camera: Camera, thermal: Thermometer, gauge: Gauge, display: ScanText,
};

export function ModalityIcons({ modalities, className }: { modalities: Modality[]; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-muted", className)}>
      {modalities.map((m) => {
        const Icon = modalityIcon[m];
        return <Icon key={m} aria-label={modalityLabel[m]} className="size-3.5" strokeWidth={1.6} />;
      })}
    </span>
  );
}

const healthTone: Record<Health, Tone> = { healthy: "positive", watch: "warning", alarm: "negative", nodata: "neutral", stopped: "neutral" };
export const HealthPill = ({ health }: { health: Health }) => <Pill tone={healthTone[health]}>{healthLabel[health]}</Pill>;
export const healthToneOf = (h: Health) => healthTone[h];

const sev: Record<Severity, { bars: number; ink: string }> = {
  high: { bars: 3, ink: "text-[var(--pill-negative-ink)] dark:text-negative" },
  medium: { bars: 2, ink: "text-[var(--pill-warning-ink)]" },
  low: { bars: 1, ink: "text-muted" },
};
const BAR_HEIGHTS = [4, 7, 10];
const BAR_PITCH = 4.4;

/** Severity as a signal glyph: three rising bars filled by how serious, never a pill or a side stripe. */
export function SeverityGlyph({ severity, label = true }: { severity: Severity; label?: boolean }) {
  const x = sev[severity];
  return (
    <span className={cn("inline-flex flex-none items-center gap-1.5 text-small font-medium whitespace-nowrap", x.ink)}>
      <svg viewBox="0 0 12 12" aria-hidden className="size-3.5">
        {BAR_HEIGHTS.map((h, i) => <rect key={h} x={i * BAR_PITCH} y={12 - h} width="2.6" height={h} rx="0.8" fill="currentColor" opacity={i < x.bars ? 1 : 0.22} />)}
      </svg>
      {label ? severityLabel[severity] : <span className="sr-only">{severityLabel[severity]}</span>}
    </span>
  );
}

const statusTone: Record<AlertStatus, Tone> = { open: "neutral", acknowledged: "accent", resolved: "positive", rejected: "neutral" };
export const AlertStatusPill = ({ status }: { status: AlertStatus }) => <Pill tone={statusTone[status]}>{alertStatusLabel[status]}</Pill>;

/** Viper's own evidence: a muted band with the modality icon (`series · EXT-01 · motor_current · 14:02–16:02`). */
export function EvidenceChip({ evidence, onClick, active }: { evidence: Evidence; onClick?: () => void; active?: boolean }) {
  const Icon = modalityIcon[evidence.modality];
  const when = evidence.to ? `${fmtTime(evidence.from)}–${fmtTime(evidence.to)}` : fmtTime(evidence.from);
  const body = (
    <Band kind="muted" size="md" active={active}>
      <span className="inline-flex items-center gap-1.5"><Icon className="size-3.5" strokeWidth={1.8} />{modalityLabel[evidence.modality].toLowerCase()} · {evidence.label} · {evidence.source} · {when}</span>
    </Band>
  );
  return onClick ? <button type="button" onClick={onClick} className="max-w-full rounded-[4px] text-left">{body}</button> : body;
}

/* Step indicator for setup and the commissioning wizard. */
export function Steps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Progress">
      {steps.map((s, i) => (
        <li key={s} aria-current={i === current ? "step" : undefined} className={cn("flex items-center gap-2 text-body", i <= current ? "text-text" : "text-muted")}>
          <span className={cn("grid size-6 place-items-center rounded-full text-small font-medium num transition-colors duration-[var(--dur-2)]",
            i < current ? "bg-accent text-on-accent" : i === current ? "bg-primary text-on-primary" : "bg-active text-muted")}>
            {i + 1}
          </span>
          {s}
        </li>
      ))}
    </ol>
  );
}
