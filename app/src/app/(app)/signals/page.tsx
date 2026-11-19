import type { Metadata } from "next";
import { Suspense } from "react";
import { SignalsScreen } from "@/features/signals/SignalsScreen";

export const metadata: Metadata = { title: "Signals" };

export default function Page() {
  return <Suspense><SignalsScreen /></Suspense>;
}
