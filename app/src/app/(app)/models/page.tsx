import type { Metadata } from "next";
import { ClientOnly } from "@/ui/templates/ClientOnly";
import { ModelsScreen } from "@/features/models/ModelsScreen";

export const metadata: Metadata = { title: "Models" };

export default function Page() {
  return <ClientOnly><ModelsScreen /></ClientOnly>;
}
