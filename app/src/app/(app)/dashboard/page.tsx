import type { Metadata } from "next";
import { ClientOnly } from "@/ui/templates/ClientOnly";
import { DashboardScreen } from "@/features/dashboard/DashboardScreen";

export const metadata: Metadata = { title: "Dashboard" };

export default function Page() {
  return <ClientOnly><DashboardScreen /></ClientOnly>;
}
