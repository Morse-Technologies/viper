import type { Metadata } from "next";
import { ClientOnly } from "@/ui/templates/ClientOnly";
import { SourcesScreen } from "@/features/sources/SourcesScreen";

export const metadata: Metadata = { title: "Sources" };

export default function Page() {
  return <ClientOnly><SourcesScreen /></ClientOnly>;
}
