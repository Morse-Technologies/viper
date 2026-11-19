"use client";
import { Canvas } from "@/ui/templates/ShellLayout";
import { PageHeader } from "@/ui/cells";

export function MachinesScreen({ machineId }: { machineId?: string }) {
  return <Canvas><PageHeader title={machineId ?? "Machines"} /></Canvas>;
}
