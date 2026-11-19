import { mockApi } from "./mock";
import type { ViperApi } from "./types";

export * from "./types";

/** The only API the screens use. Swap `mockApi` for the HTTP client (same `ViperApi` shape) when the server lands. */
export const api: ViperApi = mockApi;
