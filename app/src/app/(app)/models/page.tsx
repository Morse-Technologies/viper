import type { Metadata } from "next";
import { Suspense } from "react";
import { ModelsScreen } from "@/features/models/ModelsScreen";

export const metadata: Metadata = { title: "Models" };

export default function Page() {
  return <Suspense><ModelsScreen /></Suspense>;
}
