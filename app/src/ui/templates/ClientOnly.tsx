"use client";
import { useSyncExternalStore, type ReactNode } from "react";

const noop = () => () => {};

/**
 * Renders its children only in the browser. Screens read URL state and cached query data that the server never
 * has; rendering them only after hydration avoids a mismatch when the shell's queries land before a screen hydrates.
 * ponytail: no server HTML for screen bodies; prefetch with HydrationBoundary once there is a real API.
 */
export function ClientOnly({ children }: { children: ReactNode }) {
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  return hydrated ? children : null;
}
