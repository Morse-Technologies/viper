import type { Metadata } from "next";
import { ClientOnly } from "@/ui/templates/ClientOnly";
import { GroupScreen } from "@/features/group/GroupScreen";

export const metadata: Metadata = { title: "Group" };

export default function Page() {
  return <ClientOnly><GroupScreen /></ClientOnly>;
}
