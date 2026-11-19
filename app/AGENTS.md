<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project code rules

- Functions at most 20 lines, at most 3 parameters (more: pass an object), names that say what they do.
- No magic numbers, no clever logic. Smallest change that solves the task.
- Design system: Atlas's "Pipe Marking Bands" tokens unchanged (`src/styles/tokens.css`, `src/app/globals.css`). Ink chrome, one teal element per screen, band colours only for Atlas documents.
- Motion: GSAP only, at Atlas's subtle level; every JS animation checks `reduced()`. See `MOTION.md`.
- `src/lib/api/types.ts` (`ViperApi`) is the API contract; screens only use `src/features/hooks.ts`. Mock data lives in `src/lib/api/fixtures`.
- Domain words live in `src/lib/labels.ts`. All plant, machine and person names are fictitious.
