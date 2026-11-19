"use client";
import { gsap } from "gsap";
import { Check } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useKurtogram, useMachines, useStartBaseline, useTestCapture } from "@/features/hooks";
import type { Baseline, CommissionDraft } from "@/lib/api/types";
import { fmtDate } from "@/lib/format";
import { reduced } from "@/lib/motion";
import { Button } from "@/ui/atoms";
import { Sheet } from "@/ui/cells";
import { BandStep, BaselineStep, CaptureStep } from "./CheckSteps";
import { ChannelStep, ComponentStep, MountingStep, PositionStep, SpeedStep } from "./SetupSteps";
import { Stepper } from "./Stepper";
import { STEPS, canAdvance, emptyDraft } from "./wizard";

const LAST = STEPS.length - 1;
const CAPTURE_STEP = 5;
const BAND_STEP = 6;
/** Fields that change what the capture and the kurtogram would show; touching one throws both away. */
const SIGNAL_FIELDS: (keyof CommissionDraft)[] = ["machineId", "edgeId", "driverId", "input", "mounting", "rpm", "speed"];

/**
 * Commissioning one measurement point (§22.8): a wide side sheet, numbered steps on the left, one step at a
 * time on the right. Steps slide in from the side they come from; passed steps get the teal tick.
 */
export function CommissionSheet({ open, onOpenChange, machineId }: { open: boolean; onOpenChange: (o: boolean) => void; machineId?: string }) {
  const machines = useMachines();
  const capture = useTestCapture();
  const kurt = useKurtogram();
  const start = useStartBaseline();
  const [draft, setDraft] = useState<CommissionDraft>(() => emptyDraft());
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [done, setDone] = useState<Baseline | null>(null);
  const dir = useRef(1);
  const body = useRef<HTMLDivElement>(null);
  const machine = machines.data?.find((m) => m.id === draft.machineId);

  // Each opening starts a fresh point, on the machine it was opened from.
  const [lastOpen, setLastOpen] = useState(false);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      const m = machines.data?.find((x) => x.id === machineId);
      setDraft(emptyDraft(machineId ?? "", m?.rpm ?? null));
      setStep(0); setReached(0); setDone(null);
    }
  }
  // Opened on a machine before the machine list arrived: take its nameplate speed once it does.
  const [filledFor, setFilledFor] = useState("");
  if (machine && filledFor !== machine.id) {
    setFilledFor(machine.id);
    if (draft.rpm === null && machine.rpm) setDraft((d) => ({ ...d, rpm: machine.rpm }));
  }
  const { reset: resetCapture } = capture;
  const { reset: resetKurt } = kurt;
  useEffect(() => { if (open) { resetCapture(); resetKurt(); } }, [open, resetCapture, resetKurt]);

  const set = (change: Partial<CommissionDraft>) => {
    setDraft((d) => ({ ...d, ...change }));
    if (SIGNAL_FIELDS.some((k) => k in change)) {
      capture.reset(); kurt.reset();
      setDraft((d) => ({ ...d, band: null }));
      setReached((r) => Math.min(r, CAPTURE_STEP));
    }
  };

  const go = (to: number) => {
    dir.current = to >= step ? 1 : -1;
    setStep(to);
    setReached((r) => Math.max(r, to));
    if (to === BAND_STEP && !kurt.data && !kurt.isPending) {
      kurt.mutate(draft, { onSuccess: (k) => setDraft((d) => (d.band ? d : { ...d, band: { from: k.best.from, to: k.best.to } })) });
    }
  };

  useLayoutEffect(() => {
    const el = body.current;
    if (!el || reduced()) return;
    const tween = gsap.from(el, { x: 18 * dir.current, opacity: 0, duration: 0.4, ease: "power3.out", clearProps: "transform,opacity" });
    return () => { tween.revert(); };
  }, [step, done]);

  const ok = canAdvance(step, draft, capture.data ?? null);
  const finish = () => start.mutate(draft, {
    onSuccess: (b) => {
      setReached(STEPS.length);
      setDone(b); // the done panel says it; a toast would only cover the Close button
    },
  });

  const bodies = [
    <ChannelStep key="0" draft={draft} set={set} />,
    <PositionStep key="1" draft={draft} set={set} />,
    <MountingStep key="2" draft={draft} set={set} />,
    <ComponentStep key="3" draft={draft} set={set} />,
    <SpeedStep key="4" draft={draft} set={set} />,
    <CaptureStep key="5" capture={capture.data ?? null} capturing={capture.isPending} onCapture={() => capture.mutate(draft)} />,
    <BandStep key="6" draft={draft} set={set} kurt={kurt.data} />,
    <BaselineStep key="7" draft={draft} set={set} />,
  ];

  return (
    <Sheet
      open={open} onOpenChange={onOpenChange} width="w-[min(960px,100vw)]"
      title="Commission a measurement point"
      description={machine ? `${machine.code} · ${machine.name}` : "One sensor, from the cable to its baseline."}
    >
      <div className="flex min-h-full flex-col">
        <div className="grid flex-1 gap-6 px-5 py-5 md:grid-cols-[240px_1fr]">
          <nav aria-label="Steps" className="md:border-r md:border-rule md:pr-4">
            <Stepper steps={STEPS} current={done ? STEPS.length : step} reached={reached} onPick={(i) => { if (!done) go(i); }} />
          </nav>
          <section aria-labelledby="step-h" className="min-w-0">
            <div ref={body}>
              {done ? <Done baseline={done} code={machine?.code} /> : (
                <>
                  <p className="text-small text-muted num">Step {step + 1} of {STEPS.length}</p>
                  <h3 id="step-h" className="mt-0.5 mb-4 text-section font-medium">{STEPS[step]}</h3>
                  {bodies[step]}
                </>
              )}
            </div>
          </section>
        </div>
        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-rule bg-surface px-5 py-3.5">
          {done ? <Button variant="primary" onClick={() => onOpenChange(false)}>Close</Button> : (
            <>
              {step > 0 && <Button variant="ghost" onClick={() => go(step - 1)}>Back</Button>}
              {step < LAST
                ? <Button variant="primary" disabled={!ok} onClick={() => go(step + 1)}>Next</Button>
                : <Button variant="primary" disabled={start.isPending} onClick={finish}>Start baseline</Button>}
            </>
          )}
        </div>
      </div>
    </Sheet>
  );
}

function Done({ baseline, code }: { baseline: Baseline; code?: string }) {
  const tick = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    if (!tick.current || reduced()) return;
    const tween = gsap.from(tick.current, { scale: 0.5, opacity: 0, duration: 0.5, ease: "back.out(2.2)", clearProps: "transform,opacity" });
    return () => { tween.revert(); };
  }, []);
  return (
    <div className="flex flex-col items-start gap-3 py-6">
      <span ref={tick} className="grid size-10 place-items-center rounded-full bg-accent text-on-accent"><Check className="size-5" strokeWidth={2.5} /></span>
      <h3 id="step-h" className="text-section font-medium">The baseline is running</h3>
      <p className="max-w-prose text-body text-muted">
        {code ?? "The point"} is learning its normal until <span className="num text-text">{fmtDate(baseline.endsAt)}</span>. Thresholds already apply.
        You will find the point under the machine&apos;s Vibration tab, and this setup in the audit log.
      </p>
    </div>
  );
}
