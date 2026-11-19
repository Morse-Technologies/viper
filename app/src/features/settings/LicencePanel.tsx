"use client";
import { Check, Lock } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { useLicense } from "@/features/hooks";
import { useGrow } from "@/lib/gsapIn";
import { daysUntil, fmtDate, fmtNum } from "@/lib/format";
import { Button, Pill } from "@/ui/atoms";
import { ErrorState, KeyValues, LoadingRows } from "@/ui/cells";

const EDITION_LABEL = { core: "Viper Core", pro: "Viper Pro", enterprise: "Viper Enterprise" } as const;

export function LicencePanel() {
  const { data, isPending, isError, refetch } = useLicense();
  if (isPending) return <LoadingRows rows={5} pitch="h-10" />;
  if (isError || !data) return <ErrorState what="licence" onRetry={() => refetch()} />;

  const days = daysUntil(data.expiresAt);
  const usedPct = Math.min(100, (data.machinesUsed / Math.max(data.machinesLicensed, 1)) * 100);

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <KeyValues rows={[
        { k: "Edition", v: <Pill tone="neutral">{EDITION_LABEL[data.edition]}</Pill> },
        { k: "Holder", v: data.holder },
        { k: "Expires", v: <>{fmtDate(data.expiresAt)} · <span className="num">{days}</span> days left</> },
      ]} />
      <MachinesBar used={data.machinesUsed} licensed={data.machinesLicensed} pct={usedPct} />
      <ul className="flex flex-col gap-2">
        {data.features.map((f) => (
          <li key={f.key} className="flex items-center gap-2 text-body">
            {f.enabled
              ? <Check className="size-4 text-positive" strokeWidth={2} aria-hidden />
              : <Lock className="size-4 text-muted" strokeWidth={1.8} aria-hidden />}
            <span className={f.enabled ? "text-text" : "text-muted"}>{f.key}</span>
          </li>
        ))}
      </ul>
      <Button variant="outline" className="self-start" onClick={() => toast.success("Licence file install opened (mock)")}>
        Install licence file
      </Button>
    </div>
  );
}

function MachinesBar({ used, licensed, pct }: { used: number; licensed: number; pct: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useGrow(ref, { selector: "[data-barx]", axis: "x" });
  return (
    <div ref={ref}>
      <div className="flex items-baseline justify-between gap-3 text-body">
        <span>Machines</span>
        <span className="text-muted num">{fmtNum(used)} / {fmtNum(licensed)}</span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-raised">
        <div data-barx className="h-full origin-left rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
