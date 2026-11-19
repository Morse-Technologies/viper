import type { Metadata } from "next";
import { Suspense } from "react";
import { MachinesScreen } from "@/features/machines/MachinesScreen";

export const metadata: Metadata = { title: "Machine" };

export default async function Page({ params }: PageProps<"/machines/[id]">) {
  const { id } = await params;
  return <Suspense><MachinesScreen machineId={id} /></Suspense>;
}
