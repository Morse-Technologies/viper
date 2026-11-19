"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button, Input, Spinner } from "@/ui/atoms";
import { Field, SeverityGlyph } from "@/ui/cells";
import { AuthLayout } from "@/ui/templates/AuthLayout";
import { CODE_LENGTH, CodeInput } from "./CodeInput";

const Aside = (
  <div className="flex flex-col gap-2">
    <p className="text-small text-muted">Open alert</p>
    <p className="font-medium">EXT-01 · Watch · Possible outer race defect</p>
    <SeverityGlyph severity="medium" />
  </div>
);

export function LoginScreen() {
  const router = useRouter();
  const [step, setStep] = useState<"password" | "code">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.login(email.trim(), password);
      setStep("code");
    } catch {
      setError("Could not reach Viper. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (value: string) => {
    setBusy(true);
    setError(null);
    try {
      await api.verifyTotp(value);
      router.replace("/dashboard");
    } catch {
      setBusy(false);
      setCode("");
      setError("That code isn't right. Check the latest one and try again.");
    }
  };

  return (
    <AuthLayout aside={Aside}>
      <div key={step} className="animate-enter">
        {step === "password" ? (
          <PasswordStep
            email={email} password={password} busy={busy} error={error}
            onEmail={setEmail} onPassword={setPassword} onSubmit={submitPassword}
          />
        ) : (
          <CodeStep
            email={email} code={code} busy={busy} error={error}
            onCode={setCode} onSubmit={submitCode}
            onBack={() => { setStep("password"); setCode(""); setError(null); }}
          />
        )}
      </div>
      <p className="mt-8 text-body text-muted">
        First install? <Link href="/setup" className="text-text underline">Set up Viper</Link>
      </p>
    </AuthLayout>
  );
}

type PasswordProps = {
  email: string; password: string; busy: boolean; error: string | null;
  onEmail: (v: string) => void; onPassword: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};

function PasswordStep({ email, password, busy, error, onEmail, onPassword, onSubmit }: PasswordProps) {
  return (
    <>
      <h1 className="text-title font-medium">Sign in to Viper</h1>
      <p className="mt-1 text-body text-muted">Signals, sound and images stay on your plant&apos;s server.</p>
      <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-4" noValidate>
        <Field label="Email">
          {({ id }) => (
            <Input id={id} type="email" autoComplete="username" autoFocus value={email} onChange={(e) => onEmail(e.target.value)} />
          )}
        </Field>
        <Field label="Password" error={error ?? undefined}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id} type="password" autoComplete="current-password" value={password}
              onChange={(e) => onPassword(e.target.value)} aria-describedby={describedBy} aria-invalid={invalid}
            />
          )}
        </Field>
        <Button type="submit" variant="primary" size="lg" className="mt-2" disabled={busy}>
          {busy ? <Spinner className="text-on-primary" /> : <LogIn />}Continue
        </Button>
      </form>
    </>
  );
}

type CodeProps = {
  email: string; code: string; busy: boolean; error: string | null;
  onCode: (v: string) => void; onSubmit: (v: string) => void; onBack: () => void;
};

function CodeStep({ email, code, busy, error, onCode, onSubmit, onBack }: CodeProps) {
  return (
    <>
      <h1 className="text-title font-medium">Enter the 6-digit code from your authenticator app</h1>
      <p className="mt-1 text-body text-muted">Open the authenticator for {email.trim().toLowerCase()}.</p>
      <form
        onSubmit={(e) => { e.preventDefault(); if (code.length === CODE_LENGTH) onSubmit(code); }}
        className="mt-7 flex flex-col gap-3"
      >
        <label htmlFor="otp" className="text-body font-medium">Verification code</label>
        <CodeInput value={code} onChange={onCode} onComplete={onSubmit} />
        <p id="otp-help" className={error ? "text-small text-negative" : "text-small text-muted"}>
          {error ?? "Lost your authenticator? An administrator resets it with `viper user reset-totp`."}
        </p>
        <Button type="submit" variant="primary" size="lg" className="mt-2" disabled={busy || code.length < CODE_LENGTH}>
          {busy ? <Spinner className="text-on-primary" /> : <LogIn />}Sign in
        </Button>
        <button type="button" onClick={onBack} className="self-start text-body text-muted underline hover:text-text">
          Use a different account
        </button>
      </form>
    </>
  );
}
