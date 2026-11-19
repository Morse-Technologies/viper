import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsScreen } from "@/features/settings/SettingsScreen";

export const metadata: Metadata = { title: "Configuration" };

export default function Page() {
  return <Suspense><SettingsScreen /></Suspense>;
}
