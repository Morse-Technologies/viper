import type { Bearing, CommissionDraft, Id, Mounting, PointComponent, SensorAxis, SpeedSource, TestCapture } from "@/lib/api/types";

/** The eight steps of §22.8, in order. */
export const STEPS = [
  "Channel and device", "Position and axis", "Mounting", "Component and geometry",
  "Speed", "Test capture", "Kurtogram and envelope band", "Start baseline",
] as const;
export type StepIndex = number;

export const POSITIONS = ["Motor NDE", "Motor DE", "Driven DE", "Driven NDE"] as const;
export const INPUTS = ["CH1", "CH2", "CH3", "CH4"] as const;

export const axisLabel: Record<SensorAxis, string> = { axial: "Axial", "radial-h": "Radial H", "radial-v": "Radial V" };
export const mountingInfo: Record<Mounting, { label: string; help: string }> = {
  stud: { label: "Stud", help: "Threaded into a spot face. Trusted to 5 kHz." },
  adhesive: { label: "Adhesive pad", help: "Glued mounting pad. Trusted to 4 kHz." },
  magnet: { label: "Magnet", help: "Flat two-pole magnet on clean steel. Trusted to 2 kHz." },
  probe: { label: "Hand probe", help: "Spot checks only. Trusted to 1 kHz." },
};
export const componentLabel: Record<PointComponent, string> = { bearing: "Rolling bearing", gear: "Gear stage", impeller: "Impeller" };
export const speedLabel: Record<SpeedSource, string> = { fixed: "Fixed speed", tacho: "Tachometer channel", vfd: "From the drive (VFD)" };

export function emptyDraft(machineId: Id = "", rpm: number | null = null): CommissionDraft {
  return {
    machineId, edgeId: "", driverId: "", input: "CH1",
    position: "Motor DE", axis: "axial", photo: null,
    mounting: "stud",
    component: "bearing", bearing: "6309", teeth: null,
    speed: "fixed", rpm,
    band: null, baselineDays: 7,
  };
}

/** Whether the step has what it needs to go on. The capture must pass every check before the band is chosen. */
export function canAdvance(step: StepIndex, d: CommissionDraft, capture: TestCapture | null): boolean {
  switch (step) {
    case 0: return !!d.machineId && !!d.edgeId && !!d.driverId && !!d.input;
    case 1: return !!d.position && !!d.axis;
    case 2: return !!d.mounting;
    case 3: return d.component === "bearing" ? !!d.bearing : d.component === "gear" ? (d.teeth ?? 0) >= 5 : true;
    case 4: return d.speed !== "fixed" || (d.rpm ?? 0) > 0;
    case 5: return !!capture && capture.checks.every((c) => c.ok);
    case 6: return !!d.band;
    default: return true;
  }
}

/** The fault frequencies at this speed, for the speed and component steps. */
export function faultFrequencies(rpm: number, bearing: Bearing | undefined, teeth: number | null, teethLabel = "GMF") {
  const f1 = rpm / 60;
  return [
    { label: "1× (shaft)", hz: f1 },
    ...(bearing ? [
      { label: "BPFO", hz: bearing.bpfo * f1 }, { label: "BPFI", hz: bearing.bpfi * f1 },
      { label: "BSF", hz: bearing.bsf * f1 }, { label: "FTF", hz: bearing.ftf * f1 },
    ] : []),
    ...(teeth ? [{ label: teethLabel, hz: teeth * f1 }] : []),
  ];
}
