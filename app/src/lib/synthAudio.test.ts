import { describe, expect, it } from "vitest";
import { synthSnippet } from "./synthAudio";

const HEADER_BYTES = 44;
const SAMPLE_RATE = 16_000;

describe("mock machine sound", () => {
  it("is a one-second 16-bit mono WAV", async () => {
    const blob = synthSnippet({ seconds: 1, rpm: 1480, faulty: false, seed: "s1" });
    const view = new DataView(await blob.arrayBuffer());
    expect(blob.type).toBe("audio/wav");
    expect(String.fromCharCode(...new Uint8Array(await blob.slice(0, 4).arrayBuffer()))).toBe("RIFF");
    expect(view.getUint32(24, true)).toBe(SAMPLE_RATE);
    expect(view.getUint16(34, true)).toBe(16);
    expect(blob.size).toBe(HEADER_BYTES + SAMPLE_RATE * 2);
  });

  it("sounds the same every time for the same snippet", async () => {
    const a = await synthSnippet({ seconds: 0.2, rpm: 1480, faulty: true, seed: "x" }).arrayBuffer();
    const b = await synthSnippet({ seconds: 0.2, rpm: 1480, faulty: true, seed: "x" }).arrayBuffer();
    expect(new Uint8Array(a)).toEqual(new Uint8Array(b));
  });
});
