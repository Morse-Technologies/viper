import type { Metadata } from "next";
import { Suspense } from "react";
import { VisionScreen } from "@/features/vision/VisionScreen";

export const metadata: Metadata = { title: "Vision" };

export default function Page() {
  return <Suspense><VisionScreen /></Suspense>;
}
