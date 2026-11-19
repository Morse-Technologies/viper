import type { Metadata } from "next";
import { Suspense } from "react";
import { LabellingScreen } from "@/features/labelling/LabellingScreen";

export const metadata: Metadata = { title: "Labelling" };

export default function Page() {
  return <Suspense><LabellingScreen /></Suspense>;
}
