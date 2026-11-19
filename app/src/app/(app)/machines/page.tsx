import type { Metadata } from "next";
import { ClientOnly } from "@/ui/templates/ClientOnly";
import { MachinesScreen } from "@/features/machines/MachinesScreen";

export const metadata: Metadata = { title: "Machines" };

export default function Page() {
  return <ClientOnly><MachinesScreen /></ClientOnly>;
}
