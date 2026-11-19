import type { Metadata } from "next";
import { ClientOnly } from "@/ui/templates/ClientOnly";
import { AuditScreen } from "@/features/audit/AuditScreen";

export const metadata: Metadata = { title: "Audit" };

export default function Page() {
  return <ClientOnly><AuditScreen /></ClientOnly>;
}
