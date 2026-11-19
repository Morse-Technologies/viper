// Saves light and dark screenshots of each screen to ./screenshots (gitignored). Needs `pnpm dev` running.
// Usage: node scripts/screenshots.mjs [baseUrl] [route ...]
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3000";
const ROUTES = process.argv.slice(3).length ? process.argv.slice(3) : [
  "/login", "/setup", "/dashboard", "/machines", "/machines/north-ext-01", "/alerts", "/signals", "/acoustics",
  "/vision", "/models", "/labelling", "/sources", "/sources?commission=north-ext-01", "/audit", "/group", "/settings",
];
const SETTLE_MS = 1500;

mkdirSync("screenshots", { recursive: true });
const browser = await chromium.launch();
for (const theme of ["light", "dark"]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: theme });
  for (const route of ROUTES) {
    await page.goto(base + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(SETTLE_MS);
    const name = route.replace(/^\//, "").replace(/[/?=]/g, "_") || "home";
    await page.screenshot({ path: `screenshots/${name}-${theme}.png` });
  }
  await page.close();
}
await browser.close();
