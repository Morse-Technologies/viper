"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Copy } from "lucide-react";
import { useState, type ReactNode } from "react";
import { isEmail } from "@/lib/format";
import { Button, Input, Select, Spinner, Textarea } from "@/ui/atoms";
import { Field, Steps } from "@/ui/cells";
import { AuthLayout } from "@/ui/templates/AuthLayout";
import { CODE_LENGTH, CodeInput } from "./CodeInput";
import { TotpQr } from "./TotpQr";

const STEPS = ["Administrator", "Two-step sign-in", "Plant", "Licence", "Done"];
const MIN_PASSWORD_LEN = 12;
const TOTP_SECRET = "JBSW Y3DP EHPK 3PXP";
const DEFAULT_PLANT_NAME = "North Plant";
const DEFAULT_TZ = "Europe/Madrid";
const TIMEZONES = ["Europe/Madrid", "Europe/London", "America/New_York", "Asia/Tokyo"] as const;

type Form = {
  name: string; email: string; password: string;
  plantName: string; timezone: string; licence: string;
};

const EMPTY: Form = {
  name: "", email: "", password: "",
  plantName: DEFAULT_PLANT_NAME, timezone: DEFAULT_TZ, licence: "",
};

const Aside = (
  <p>Viper watches machines on this plant&apos;s own server. You set the first administrator here once.</p>
);

export function SetupScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const patch = (p: Partial<Form>) => setForm((f) => ({ ...f, ...p }));

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const openViper = () => { setBusy(true); router.replace("/dashboard"); };

  return (
    <AuthLayout aside={Aside}>
      <Steps steps={STEPS} current={step} />
      <div key={step} className="mt-8 animate-enter">
        {step === 0 && <AdminStep form={form} patch={patch} />}
        {step === 1 && <TotpStep onVerified={next} />}
        {step === 2 && <PlantStep form={form} patch={patch} />}
        {step === 3 && <LicenceStep form={form} patch={patch} />}
        {step === 4 && <DoneStep />}
      </div>
      <Footer
        step={step} form={form} busy={busy}
        onBack={() => setStep((s) => Math.max(s - 1, 0))}
        onNext={next}
        onSkipLicence={() => setStep(4)}
        onOpen={openViper}
      />
    </AuthLayout>
  );
}

function Footer({
  step, form, busy, onBack, onNext, onSkipLicence, onOpen,
}: {
  step: number; form: Form; busy: boolean;
  onBack: () => void; onNext: () => void; onSkipLicence: () => void; onOpen: () => void;
}) {
  const adminOk = !!form.name.trim() && isEmail(form.email) && form.password.length >= MIN_PASSWORD_LEN;
  const plantOk = !!form.plantName.trim() && !!form.timezone;
  return (
    <div className="mt-8 flex items-center justify-between gap-3">
      {step === 0
        ? <Link href="/login" className="text-body text-muted hover:text-text">I already have an account</Link>
        : step < 4
          ? <Button variant="ghost" onClick={onBack}>Back</Button>
          : <span />}
      {step === 0 && (
        <Button variant="primary" size="lg" disabled={!adminOk} onClick={onNext}>Continue<ArrowRight /></Button>
      )}
      {step === 2 && (
        <Button variant="primary" size="lg" disabled={!plantOk} onClick={onNext}>Continue<ArrowRight /></Button>
      )}
      {step === 3 && (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="lg" onClick={onSkipLicence}>Continue without a licence (Core)</Button>
          <Button variant="primary" size="lg" disabled={!form.licence.trim()} onClick={onNext}>Continue<ArrowRight /></Button>
        </div>
      )}
      {step === 4 && (
        <Button variant="primary" size="lg" disabled={busy} onClick={onOpen}>
          {busy ? <Spinner className="text-on-primary" /> : null}Open Viper
        </Button>
      )}
    </div>
  );
}

function Title({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <h1 className="text-title font-medium">{title}</h1>
      <p className="mt-1 text-body text-muted">{children}</p>
    </>
  );
}

function AdminStep({ form, patch }: { form: Form; patch: (p: Partial<Form>) => void }) {
  const short = form.password.length > 0 && form.password.length < MIN_PASSWORD_LEN;
  return (
    <>
      <Title title="Create the administrator">This account manages people, sources and the licence.</Title>
      <div className="mt-6 flex flex-col gap-4">
        <Field label="Full name">
          {({ id }) => <Input id={id} value={form.name} onChange={(e) => patch({ name: e.target.value })} autoComplete="name" />}
        </Field>
        <Field label="Work email">
          {({ id }) => (
            <Input id={id} type="email" value={form.email} onChange={(e) => patch({ email: e.target.value })} autoComplete="email" />
          )}
        </Field>
        <Field label="Password" help={`At least ${MIN_PASSWORD_LEN} characters.`} error={short ? `${MIN_PASSWORD_LEN - form.password.length} more characters.` : undefined}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id} type="password" value={form.password} onChange={(e) => patch({ password: e.target.value })}
              autoComplete="new-password" aria-describedby={describedBy} aria-invalid={invalid}
            />
          )}
        </Field>
      </div>
    </>
  );
}

function TotpStep({ onVerified }: { onVerified: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const verify = () => {
    setBusy(true);
    onVerified();
  };
  return (
    <>
      <Title title="Add two-step sign-in">
        Scan the pattern or type the secret into an authenticator app, then enter the 6-digit code.
      </Title>
      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-start gap-4">
          <TotpQr seed={TOTP_SECRET} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3 rounded-card bg-raised px-4 py-3">
              <span className="text-body font-medium tracking-wider break-all">{TOTP_SECRET}</span>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(TOTP_SECRET.replace(/\s/g, ""))}
                aria-label="Copy the key"
                className="hit-slop grid size-8 flex-none place-items-center rounded-full text-muted hover:bg-surface hover:text-text"
              >
                <Copy className="size-4" />
              </button>
            </div>
            <p className="mt-2 text-small text-muted">Keep the key safe. An administrator resets it with `viper user reset-totp`.</p>
          </div>
        </div>
        <label htmlFor="otp" className="text-body font-medium">Verification code</label>
        <CodeInput value={code} onChange={setCode} onComplete={() => verify()} />
        <p id="otp-help" className="text-small text-muted">{busy ? "Checking…" : "The code changes every 30 seconds."}</p>
        <Button
          variant="primary" size="lg" disabled={busy || code.length < CODE_LENGTH}
          onClick={verify}
        >
          {busy ? <Spinner className="text-on-primary" /> : null}Continue
        </Button>
      </div>
    </>
  );
}

function PlantStep({ form, patch }: { form: Form; patch: (p: Partial<Form>) => void }) {
  return (
    <>
      <Title title="Name the plant">This is the scope people see in the shell. You can add more plants later on Pro.</Title>
      <div className="mt-6 flex flex-col gap-4">
        <Field label="Plant name">
          {({ id }) => <Input id={id} value={form.plantName} onChange={(e) => patch({ plantName: e.target.value })} />}
        </Field>
        <Field label="Time zone">
          {({ id }) => (
            <Select id={id} value={form.timezone} onChange={(e) => patch({ timezone: e.target.value })} className="h-10">
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </Select>
          )}
        </Field>
      </div>
    </>
  );
}

function LicenceStep({ form, patch }: { form: Form; patch: (p: Partial<Form>) => void }) {
  return (
    <>
      <Title title="Install a licence">Paste a signed licence file, or continue on Core without one.</Title>
      <div className="mt-6">
        <Field label="Licence">
          {({ id }) => (
            <Textarea
              id={id} value={form.licence} onChange={(e) => patch({ licence: e.target.value })}
              placeholder="Paste the licence text here"
              rows={6}
            />
          )}
        </Field>
      </div>
    </>
  );
}

function DoneStep() {
  return (
    <Title title="Viper is ready">
      The administrator can sign in, add sources and invite the rest of the workshop.
    </Title>
  );
}
