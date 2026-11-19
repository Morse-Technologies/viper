import type { Metadata } from "next";
import { ClientOnly } from "@/ui/templates/ClientOnly";
import { LabellingScreen } from "@/features/labelling/LabellingScreen";

export const metadata: Metadata = { title: "Labelling" };

export default function Page() {
  return <ClientOnly><LabellingScreen /></ClientOnly>;
}
