import type { Metadata } from "next";
import { ClientOnly } from "@/ui/templates/ClientOnly";
import { SettingsScreen } from "@/features/settings/SettingsScreen";

export const metadata: Metadata = { title: "Configuration" };

export default function Page() {
  return <ClientOnly><SettingsScreen /></ClientOnly>;
}
