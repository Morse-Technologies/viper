import type { Metadata } from "next";
import { ClientOnly } from "@/ui/templates/ClientOnly";
import { AlertsScreen } from "@/features/alerts/AlertsScreen";

export const metadata: Metadata = { title: "Alerts" };

export default function Page() {
  return <ClientOnly><AlertsScreen /></ClientOnly>;
}
