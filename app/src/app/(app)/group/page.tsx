import type { Metadata } from "next";
import { Suspense } from "react";
import { GroupScreen } from "@/features/group/GroupScreen";

export const metadata: Metadata = { title: "Group" };

export default function Page() {
  return <Suspense><GroupScreen /></Suspense>;
}
