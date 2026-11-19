import type { Metadata } from "next";
import { ClientOnly } from "@/ui/templates/ClientOnly";
import { VisionScreen } from "@/features/vision/VisionScreen";

export const metadata: Metadata = { title: "Vision" };

export default function Page() {
  return <ClientOnly><VisionScreen /></ClientOnly>;
}
