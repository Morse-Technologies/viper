import type { Metadata } from "next";
import { ClientOnly } from "@/ui/templates/ClientOnly";
import { MachinesScreen } from "@/features/machines/MachinesScreen";

export const metadata: Metadata = { title: "Machine" };

export default async function Page({ params }: PageProps<"/machines/[id]">) {
  const { id } = await params;
  return <ClientOnly><MachinesScreen machineId={id} /></ClientOnly>;
}
