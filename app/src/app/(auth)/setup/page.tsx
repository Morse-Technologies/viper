import type { Metadata } from "next";
import { Suspense } from "react";
import { SetupScreen } from "@/features/access/SetupScreen";

export const metadata: Metadata = { title: "Set up Viper" };

export default function Page() {
  return <Suspense><SetupScreen /></Suspense>;
}
