# Viper

Condition monitoring for industrial plants by Morse Technologies: signals, vibration and sound, and vision on
one screen, running on the plant's own server.

This repository holds the **web frontend** (`app/`). It currently runs on a typed mock layer with a fictitious
group (three plants, forty machines); there is no backend yet.

## Run it

```bash
cd app
pnpm install
pnpm dev            # http://localhost:3000 (any email, any password, any 6-digit code)
```

| Command | What it does |
|---|---|
| `pnpm build` | Production build (`output: standalone`) |
| `pnpm lint` | ESLint (Next core web vitals + TypeScript) |
| `pnpm typecheck` | Route types, then `tsc --noEmit` (strict) |
| `pnpm test` | Vitest: mock layer and UI logic |
| `pnpm e2e` | Playwright smoke tests (starts its own dev server on port 3210; stop `pnpm dev` first, Next allows one dev server per folder) |
| `node scripts/screenshots.mjs http://localhost:3000` | Light and dark screenshots into `app/screenshots/` (gitignored) |

## Stack

Next 16.4.5 (App Router, Turbopack), React 19.3, TypeScript strict, Tailwind 4, Base UI, TanStack Query and
Table, GSAP + Lenis for motion, dnd-kit for the dashboard, uPlot for series and spectra, wavesurfer.js for audio,
sonner for toasts, lucide icons. pnpm 11.22.

## Design

Viper uses Atlas's design system, "Pipe Marking Bands", without changing a token: ink chrome on a blue-grey
ground, one white working sheet, teal only on the screen's main data element and focus, and band colours only
for Atlas documents. The one addition is `--brand` (maroon `#660000`, `#c46a6a` in dark), used only for the
inner V of the Viper mark. Light and dark run at parity. Motion is subtle and GSAP-driven; see
[`app/MOTION.md`](app/MOTION.md).

## Screens

Dashboard, Machines (list and detail), Alerts, Signals, Vibration & sound (spectrum with preset ranges,
drag-to-zoom and reset), Vision, Labelling, Models, Sources (data sources and edge devices, plus the
commissioning wizard for a measurement point: `/sources?commission=<machine id>`), Audit (filters, chain
verification, signed export), Group hub and Configuration. Sign-in with TOTP at `/login`, first setup at
`/setup`. `G` then a letter jumps between screens; `⌘K` opens the palette.

## Layout

```
app/src/
  app/            routes: (auth) login and setup, (app) every screen inside the shell
  features/       one folder per screen, plus hooks.ts (the only way screens read data)
  lib/api/        types.ts (the /api/v1 contract), mock.ts and fixtures/ (the fictitious world)
  ui/             atoms, cells, organisms, templates (Atlas's kit plus Viper's charts)
  styles/         tokens.css (Atlas tokens, unchanged, plus --brand for the mark)
```

To move to the real server, implement `ViperApi` over HTTP and export it from `src/lib/api/index.ts`.

## Licence

Proprietary, all rights reserved, Morse Technologies (see [`LICENSE`](LICENSE)). Under the open-core plan the
Viper UI belongs to the Pro product. Note that GSAP is free to use but its licence is not OSI-approved, which
is fine for this closed frontend and would need review before any part of it is open-sourced.
