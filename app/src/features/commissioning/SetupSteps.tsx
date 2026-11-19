"use client";
import { Camera, ImagePlus } from "lucide-react";
import { useBearings, useDrivers, useEdgeDevices, useMachines } from "@/features/hooks";
import { MOUNTING_MAX_HZ } from "@/lib/api/fixtures/commissioning";
import type { CommissionDraft, Mounting, PointComponent, SensorAxis, SpeedSource } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { fmtHz } from "@/lib/format";
import { Button, Input, Select } from "@/ui/atoms";
import { Field, KeyValues, Segmented } from "@/ui/cells";
import {
  INPUTS, POSITIONS, axisLabel, componentLabel, faultFrequencies, mountingInfo, speedLabel,
} from "./wizard";

export type StepProps = { draft: CommissionDraft; set: (change: Partial<CommissionDraft>) => void };

/** Drivers that read vibration; a driver that needs calibration or has a fault cannot be chosen yet. */
const VIBRATION_KINDS = new Set(["daq-iepe", "io-link", "modbus"]);
const PHOTO_NAME = "IMG_20261119_1702.jpg";

export function ChannelStep({ draft, set }: StepProps) {
  const machines = useMachines();
  const edges = useEdgeDevices();
  const drivers = useDrivers();
  return (
    <div className="flex flex-col gap-5">
      <Field label="Machine" help="A point always belongs to a machine that already exists (ADR-V20).">
        {({ id }) => (
          <Select id={id} value={draft.machineId} onChange={(e) => {
            const m = machines.data?.find((x) => x.id === e.target.value);
            set({ machineId: e.target.value, rpm: m?.rpm ?? null });
          }}>
            <option value="">Choose a machine…</option>
            {(machines.data ?? []).map((m) => <option key={m.id} value={m.id}>{m.code} · {m.name}</option>)}
          </Select>
        )}
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Edge device">
          {({ id }) => (
            <Select id={id} value={draft.edgeId} onChange={(e) => set({ edgeId: e.target.value })}>
              <option value="">Choose a device…</option>
              {(edges.data ?? []).map((d) => (
                <option key={d.id} value={d.id} disabled={d.status === "offline"}>{d.name}{d.status === "offline" ? " (offline)" : ""}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Driver">
          {({ id }) => (
            <Select id={id} value={draft.driverId} onChange={(e) => set({ driverId: e.target.value })}>
              <option value="">Choose a driver…</option>
              {(drivers.data ?? []).filter((d) => VIBRATION_KINDS.has(d.kind)).map((d) => (
                <option key={d.id} value={d.id} disabled={d.status !== "ok"}>{d.name}</option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-body font-medium">Input</span>
        <Segmented label="Input" options={INPUTS.map((c) => ({ value: c, label: c }))} value={draft.input} onChange={(input) => set({ input })} />
      </div>
    </div>
  );
}

/** A drawn motor and driven machine with the four classic measurement positions. */
function MachineSketch({ value, onPick }: { value: string; onPick: (p: string) => void }) {
  const xs = [70, 190, 280, 400];
  const spots = POSITIONS.map((name, i) => [name, xs[i], 70] as const);
  return (
    <svg viewBox="0 0 470 150" className="w-full max-w-[520px]" role="group" aria-label="Measurement position">
      <rect x="40" y="52" width="170" height="64" rx="8" fill="var(--active)" stroke="var(--control)" />
      <rect x="210" y="78" width="50" height="12" fill="var(--control)" />
      <rect x="260" y="44" width="170" height="80" rx="8" fill="var(--active)" stroke="var(--control)" />
      <rect x="20" y="116" width="430" height="10" rx="2" fill="var(--rule)" />
      <text x="125" y="104" textAnchor="middle" className="fill-[var(--muted)] text-[11px]">Motor</text>
      <text x="345" y="112" textAnchor="middle" className="fill-[var(--muted)] text-[11px]">Driven machine</text>
      {spots.map(([name, x, y]) => {
        const on = value === name;
        return (
          <g key={name} role="radio" aria-checked={on} aria-label={name} tabIndex={0} className="cursor-pointer outline-none"
            onClick={() => onPick(name)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(name); } }}>
            <circle cx={x} cy={y - 30} r="11" fill={on ? "var(--primary)" : "var(--surface)"} stroke={on ? "var(--primary)" : "var(--control)"} strokeWidth="1.5" />
            <line x1={x} y1={y - 19} x2={x} y2={y - 6} stroke={on ? "var(--primary)" : "var(--control)"} strokeWidth="1.5" />
            <text x={x} y={y - 46} textAnchor="middle" className={on ? "fill-[var(--text)] text-[11px] font-medium" : "fill-[var(--muted)] text-[11px]"}>{name}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function PositionStep({ draft, set }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <MachineSketch value={draft.position} onPick={(position) => set({ position })} />
      <div className="flex flex-col gap-2">
        <span className="text-body font-medium">Axis</span>
        <Segmented<SensorAxis> label="Axis" options={(Object.keys(axisLabel) as SensorAxis[]).map((a) => ({ value: a, label: axisLabel[a] }))} value={draft.axis} onChange={(axis) => set({ axis })} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-body font-medium">Photo</span>
        {draft.photo ? (
          <div className="flex items-center gap-3 rounded-card border border-border bg-raised px-3 py-2.5">
            <span className="grid size-12 place-items-center rounded-control bg-active text-muted"><Camera className="size-5" strokeWidth={1.6} /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body">{draft.photo}</p>
              <p className="text-small text-muted">{draft.position}, {axisLabel[draft.axis].toLowerCase()}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => set({ photo: null })}>Remove</Button>
          </div>
        ) : (
          <div>
            <Button variant="outline" onClick={() => set({ photo: PHOTO_NAME })}><ImagePlus />Add a photo</Button>
            <p className="mt-2 text-small text-muted">A photo of the sensor in place helps the next person find it. Optional.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function MountingStep({ draft, set }: StepProps) {
  const kinds = Object.keys(mountingInfo) as Mounting[];
  return (
    <div className="flex flex-col gap-4">
      <div role="radiogroup" aria-label="Mounting" className="grid gap-2 sm:grid-cols-2">
        {kinds.map((k) => {
          const on = draft.mounting === k;
          return (
            <button key={k} type="button" role="radio" aria-checked={on} onClick={() => set({ mounting: k })}
              className={cn("rounded-card border px-4 py-3 text-left transition-colors duration-[var(--dur-1)]",
                on ? "border-primary bg-surface shadow-[inset_0_0_0_1px_var(--primary)]" : "border-border bg-raised hover:border-control")}>
              <span className="block text-body font-medium">{mountingInfo[k].label}</span>
              <span className="mt-0.5 block text-small text-muted">{mountingInfo[k].help}</span>
            </button>
          );
        })}
      </div>
      <p className="text-small text-muted">The test capture and the kurtogram stop at <span className="num">{fmtHz(MOUNTING_MAX_HZ[draft.mounting])}</span> for this mounting.</p>
    </div>
  );
}

export function ComponentStep({ draft, set }: StepProps) {
  const bearings = useBearings();
  const bearing = bearings.data?.find((b) => b.model === draft.bearing);
  return (
    <div className="flex flex-col gap-5">
      <Segmented<PointComponent> label="Component" options={(Object.keys(componentLabel) as PointComponent[]).map((c) => ({ value: c, label: componentLabel[c] }))}
        value={draft.component} onChange={(component) => set({ component, teeth: component === "bearing" ? null : draft.teeth })} />
      {draft.component === "bearing" ? (
        <>
          <Field label="Bearing">
            {({ id }) => (
              <Select id={id} value={draft.bearing} onChange={(e) => set({ bearing: e.target.value })}>
                {(bearings.data ?? []).map((b) => <option key={b.model} value={b.model}>{b.model} · {b.kind}</option>)}
              </Select>
            )}
          </Field>
          {bearing && (
            <KeyValues rows={[
              { k: "Outer race (BPFO)", v: <span className="num">{bearing.bpfo}×</span> },
              { k: "Inner race (BPFI)", v: <span className="num">{bearing.bpfi}×</span> },
              { k: "Rolling element (BSF)", v: <span className="num">{bearing.bsf}×</span> },
              { k: "Cage (FTF)", v: <span className="num">{bearing.ftf}×</span> },
            ]} />
          )}
        </>
      ) : (
        <Field label={draft.component === "gear" ? "Teeth on this shaft's gear" : "Impeller vanes"} help={draft.component === "gear" ? "Sets the gear mesh frequency (teeth × shaft speed)." : "Sets the blade pass frequency. Optional."}>
          {({ id, describedBy }) => (
            <Input id={id} aria-describedby={describedBy} type="number" min={1} inputMode="numeric" className="w-32"
              value={draft.teeth ?? ""} onChange={(e) => set({ teeth: e.target.value ? Number(e.target.value) : null })} />
          )}
        </Field>
      )}
    </div>
  );
}

export function SpeedStep({ draft, set }: StepProps) {
  const bearings = useBearings();
  const bearing = draft.component === "bearing" ? bearings.data?.find((b) => b.model === draft.bearing) : undefined;
  const rpm = draft.rpm ?? 0;
  return (
    <div className="flex flex-col gap-5">
      <Segmented<SpeedSource> label="Speed source" options={(Object.keys(speedLabel) as SpeedSource[]).map((s) => ({ value: s, label: speedLabel[s] }))}
        value={draft.speed} onChange={(speed) => set({ speed })} />
      {draft.speed === "fixed" ? (
        <Field label="Speed (rpm)" help="The nameplate or measured running speed.">
          {({ id, describedBy }) => (
            <Input id={id} aria-describedby={describedBy} type="number" min={1} inputMode="numeric" className="w-32"
              value={draft.rpm ?? ""} onChange={(e) => set({ rpm: e.target.value ? Number(e.target.value) : null })} />
          )}
        </Field>
      ) : (
        <p className="text-body text-muted">
          {draft.speed === "tacho" ? "Viper reads the speed from TACHO-1 on the same edge device and follows it as it changes." : "Viper reads motor_speed from the drive over OPC UA and follows it as it changes."}
          {" "}The frequencies below use the last reading.
        </p>
      )}
      {rpm > 0 && (
        <div>
          <p className="mb-1 text-body font-medium">At <span className="num">{rpm.toLocaleString("en-GB")}</span> rpm</p>
          <KeyValues rows={faultFrequencies(rpm, bearing, draft.component === "bearing" ? null : draft.teeth, draft.component === "impeller" ? "BPF" : "GMF").map((f) => ({ k: f.label, v: <span className="num">{fmtHz(+f.hz.toFixed(1))}</span> }))} />
        </div>
      )}
    </div>
  );
}
