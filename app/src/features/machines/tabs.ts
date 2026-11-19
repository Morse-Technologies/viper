/** Sliding-underline tabs on the machine detail (§22.3). */
export const MACHINE_TABS = [
  { value: "summary", label: "Summary" },
  { value: "signals", label: "Signals" },
  { value: "acoustics", label: "Vibration & sound" },
  { value: "vision", label: "Vision" },
  { value: "alerts", label: "Alerts" },
  { value: "models", label: "Models" },
  { value: "config", label: "Configuration" },
] as const;

export type MachineTab = (typeof MACHINE_TABS)[number]["value"];

export const DEFAULT_TAB: MachineTab = "summary";

export const RANGE_OPTIONS = [
  { value: "1h", label: "1 h" },
  { value: "24h", label: "24 h" },
  { value: "7d", label: "7 d" },
  { value: "30d", label: "30 d" },
] as const;

export const CHART_HEIGHT = 220;
export const TREND_LABEL = "7 d";
