"use client";
import { gsap } from "gsap";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useEffect, useRef } from "react";
import type { AuditChain } from "@/lib/api/types";
import { fmtDayMonth, fmtNum, fmtTime } from "@/lib/format";
import { reduced } from "@/lib/motion";
import { Button } from "@/ui/atoms";

/** The chain check: a thin ink line runs while it walks the entries, then one sentence says how far it holds. */
export function ChainStatus({ chain, checking, total, onVerify }: {
  chain: AuditChain | undefined; checking: boolean; total: number; onVerify: () => void;
}) {
  const bar = useRef<HTMLSpanElement>(null);
  const line = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    if (reduced()) { gsap.set(el, { scaleX: checking ? 1 : 0 }); return; }
    const tween = checking
      ? gsap.fromTo(el, { scaleX: 0, opacity: 1 }, { scaleX: 0.92, duration: 0.9, ease: "power2.out" })
      : gsap.to(el, { scaleX: 1, duration: 0.2, ease: "power2.out", onComplete: () => { gsap.to(el, { opacity: 0, duration: 0.3 }); } });
    return () => { tween.kill(); };
  }, [checking]);

  useEffect(() => {
    if (!chain || checking || !line.current || reduced()) return;
    gsap.from(line.current, { y: 6, opacity: 0, duration: 0.45, ease: "power3.out", clearProps: "transform,opacity" });
  }, [chain, checking]);

  const ok = chain?.ok ?? true;
  const Icon = ok ? ShieldCheck : ShieldAlert;
  return (
    <section aria-label="Chain verification" className="relative overflow-hidden rounded-card border border-border bg-surface">
      <span ref={bar} aria-hidden className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-primary" />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
        <Icon className={ok ? "size-5 text-accent" : "size-5 text-negative"} strokeWidth={1.8} aria-hidden />
        <p ref={line} role="status" aria-live="polite" className="min-w-0 flex-1 text-body">
          {checking || !chain ? <span className="text-muted">Checking <span className="num">{fmtNum(total)}</span> entries against the last anchor…</span>
            : chain.ok ? (
              <>
                Chain verified up to the anchor of {fmtDayMonth(chain.anchorAt)}, {fmtTime(chain.anchorAt)}.{" "}
                <span className="text-muted">
                  <span className="num">{fmtNum(chain.checked - chain.pending)}</span> entries sealed,{" "}
                  <span className="num">{fmtNum(chain.pending)}</span> waiting for tonight&apos;s anchor. Anchor <code className="font-mono text-small">{chain.anchorHash.slice(0, 12)}</code>
                </span>
              </>
            ) : <>The chain breaks at entry <span className="num">#{chain.brokenAt}</span>. Nothing after it can be trusted until an admin checks the server.</>}
        </p>
        <Button variant="outline" onClick={onVerify} disabled={checking}>Verify again</Button>
      </div>
    </section>
  );
}
