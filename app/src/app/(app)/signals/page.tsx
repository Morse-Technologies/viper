import type { Metadata } from "next";
import { ClientOnly } from "@/ui/templates/ClientOnly";
import { SignalsScreen } from "@/features/signals/SignalsScreen";

export const metadata: Metadata = { title: "Signals" };

export default function Page() {
  return <ClientOnly><SignalsScreen /></ClientOnly>;
}
