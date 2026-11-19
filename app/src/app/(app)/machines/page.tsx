import type { Metadata } from "next";
import { Suspense } from "react";
import { MachinesScreen } from "@/features/machines/MachinesScreen";

export const metadata: Metadata = { title: "Machines" };

export default function Page() {
  return <Suspense><MachinesScreen /></Suspense>;
}
