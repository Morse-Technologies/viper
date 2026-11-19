import type { Metadata } from "next";
import { Suspense } from "react";
import { AcousticsScreen } from "@/features/acoustics/AcousticsScreen";

export const metadata: Metadata = { title: "Vibration & sound" };

export default function Page() {
  return <Suspense><AcousticsScreen /></Suspense>;
}
