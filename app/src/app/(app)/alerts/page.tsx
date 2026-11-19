import type { Metadata } from "next";
import { Suspense } from "react";
import { AlertsScreen } from "@/features/alerts/AlertsScreen";

export const metadata: Metadata = { title: "Alerts" };

export default function Page() {
  return <Suspense><AlertsScreen /></Suspense>;
}
