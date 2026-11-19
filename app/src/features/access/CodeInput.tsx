"use client";
import { OTPField } from "@base-ui/react/otp-field";

export const CODE_LENGTH = 6;

/** Six 44×48 slots for a one-time code. Paste fills all; complete fires on the last digit. */
export function CodeInput({
  value, onChange, onComplete,
}: {
  value: string; onChange: (v: string) => void; onComplete: (v: string) => void;
}) {
  return (
    <OTPField.Root
      id="otp"
      length={CODE_LENGTH}
      value={value}
      onValueChange={onChange}
      onValueComplete={onComplete}
      autoComplete="one-time-code"
      inputMode="numeric"
      aria-describedby="otp-help"
      className="flex gap-2"
    >
      {Array.from({ length: CODE_LENGTH }, (_, i) => (
        <OTPField.Input
          key={i}
          autoFocus={i === 0}
          aria-label={i === 0 ? undefined : `Digit ${i + 1} of ${CODE_LENGTH}`}
          className="h-12 w-11 rounded-control border border-control bg-surface text-center text-section font-medium text-text caret-accent num transition-[border-color,box-shadow,transform] duration-[var(--dur-1)] ease-out focus:border-accent focus:ring-2 focus:ring-accent/25 focus:outline-none data-[filled]:scale-[1.03]"
        />
      ))}
    </OTPField.Root>
  );
}
