import type { Channel, Id, Machine, Range } from "@/lib/api/types";

export const ACOUSTIC_RANGES: { value: Range; label: string }[] = [
  { value: "24h", label: "24 h" },
  { value: "7d", label: "7 d" },
  { value: "30d", label: "30 d" },
];

export const DEFAULT_ACOUSTIC_RANGE: Range = "7d";

export const isAcousticRange = (v: string | null): v is Range =>
  v === "24h" || v === "7d" || v === "30d";

const hasAcoustic = (m: Machine) =>
  m.modalities.includes("vibration") || m.modalities.includes("audio");

const isWatchOrAlarm = (h: Machine["health"]) => h === "watch" || h === "alarm";

export function acousticMachines(machines: Machine[]): Machine[] {
  return machines.filter(hasAcoustic);
}

export function defaultMachineId(machines: Machine[]): Id | null {
  const list = acousticMachines(machines);
  const pick = list.find((m) => isWatchOrAlarm(m.health)) ?? list[0];
  return pick?.id ?? null;
}

export function defaultChannelId(channels: Channel[]): Id | null {
  return channels[0]?.id ?? null;
}

export function audioChannel(channels: Channel[]): Channel | undefined {
  return channels.find((c) => c.kind === "audio");
}

