"use client";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import type { Snippet } from "@/lib/api/types";
import { fmtTime } from "@/lib/format";
import { synthSnippet } from "@/lib/synthAudio";
import { useTokens } from "@/lib/tokens";

const WAVE_HEIGHT = 40;

/**
 * One filtered sound snippet: a 32px round button and the waveform in ink with the playhead in accent.
 * Snippets that failed the voice filter are listed without playback (§13.7).
 */
export function AudioSnippet({ snippet, rpm, faulty }: { snippet: Snippet; rpm: number; faulty: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const ws = useRef<WaveSurfer | null>(null);
  const [playing, setPlaying] = useState(false);
  const t = useTokens();
  useEffect(() => {
    if (!box.current || !snippet.passedVoiceFilter) return;
    const url = URL.createObjectURL(synthSnippet({ seconds: snippet.seconds, rpm, faulty, seed: snippet.id }));
    const w = WaveSurfer.create({
      container: box.current, url, height: WAVE_HEIGHT, waveColor: t.bar, progressColor: t.muted, cursorColor: t.accent,
      cursorWidth: 2, barWidth: 2, barGap: 1, barRadius: 2, normalize: true,
    });
    w.on("play", () => setPlaying(true));
    w.on("pause", () => setPlaying(false));
    w.on("finish", () => setPlaying(false));
    ws.current = w;
    return () => { w.destroy(); URL.revokeObjectURL(url); };
  }, [snippet, rpm, faulty, t]);

  if (!snippet.passedVoiceFilter) {
    return <p className="flex h-12 items-center text-body text-muted">Snippet discarded by the voice filter ({fmtTime(snippet.at)})</p>;
  }
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => ws.current?.playPause()} aria-label={playing ? "Pause snippet" : `Play snippet from ${fmtTime(snippet.at)}`}
        className="grid size-8 flex-none place-items-center rounded-full bg-primary text-on-primary transition-transform duration-[var(--dur-1)] active:scale-95">
        {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5 translate-x-px" />}
      </button>
      <div ref={box} className="min-w-0 flex-1" />
      <span className="w-20 text-right text-small text-muted num">{fmtTime(snippet.at)} · {snippet.seconds} s</span>
    </div>
  );
}
