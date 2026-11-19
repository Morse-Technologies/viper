import type { Metadata } from "next";
import { ClientOnly } from "@/ui/templates/ClientOnly";
import { AcousticsScreen } from "@/features/acoustics/AcousticsScreen";

export const metadata: Metadata = { title: "Vibration & sound" };

export default function Page() {
  return <ClientOnly><AcousticsScreen /></ClientOnly>;
}
