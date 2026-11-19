# Motion in Viper

Viper moves the way Atlas does: little, fast and always with a reason. Motion explains where something came
from, what changed, or that the app heard you. It never decorates. Every animation is GSAP (or a CSS keyframe
from `globals.css`), shares one clock (Lenis is driven by `gsap.ticker`), and checks `reduced()`.

Source of the principles: Mockplus, *20 Motion Design Principles with Examples* (Oct 2025). The table maps
each principle Viper uses to the concrete pattern, its tokens and where it lives. Principles we deliberately
leave out are listed at the end with the reason.

## Tokens

| Token | Value | Use |
|---|---|---|
| `--ease-out` / GSAP `power3.out` | `cubic-bezier(0.23, 1, 0.32, 1)` | Everything that enters or settles |
| `--ease-in-out` / GSAP `power3.inOut` | `cubic-bezier(0.77, 0, 0.175, 1)` | Things that move from A to B (indicators, Flip, theme reveal) |
| `--ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` | Sheets and the sidebar |
| `--dur-1` | 120ms | Press, hover |
| `--dur-2` | 200ms | Popovers, indicators, fades |
| `--dur-3` | 320ms | Sheets, sidebar width, disclosure |
| GSAP enter | 0.7s, y 14px, stagger 0.06s | Screen parts on mount (`useEnter`) |
| CSS `enter` / `band-in` | 260ms 10px / 280ms 14px | Small reveals, list rows |
| `stagger` utility | 50ms × `--i` | Lists and grids |

## Principles used

| Principle | Pattern in Viper | Where |
|---|---|---|
| Easing and timing | Exponential ease-out for enters, balanced curve for moves, drawer curve for sheets; three durations only | `globals.css` `@theme`, all GSAP calls use `power3.*` |
| Offset and delay (sequential, staggered) | Screen parts rise 14px in order, 60ms apart; list rows and camera cards 50ms apart; audit rows settle 12ms apart when a filter changes; kurtogram levels fill top-down 60ms apart | `useEnter` in `Canvas`; `stagger` utility with `--i`; `AuditTable`, `Kurtogram` |
| Smooth content reveal | Each screen fades and rises in once on mount; route changes fade the old screen (120ms) and rise the new one 6px (220ms) | `Canvas`, View Transitions in `AppShell` |
| Parenting | The 2px tab underline and the segmented pill belong to their row and glide with it to the active item | `Tabs`, `Segmented` (`useGlide`) |
| Transformation (morphing) | Dashboard widgets glide and resize from where they were to where they land when moved, resized, added or removed | `features/dashboard/layout.ts` (GSAP Flip) |
| Value change | KPIs count up to their value; the rail badge pops when a number goes up | `CountUp`, `usePopOnIncrease` |
| Masking | Charts reveal through a clip-path wipe (series left→right, spectrum bottom→top, spectrogram top→bottom); the theme switch reveals the new theme as a circle from the click | `SignalChart`, `Spectrum`, `Spectrogram`, `features/shell/theme.ts` |
| Directional motion | Bands and alert rows enter from their arrow side (14px); sheets slide from their edge; wizard steps slide in 18px from the side they come from (forward from the right, back from the left) | `animate-band-in`, `Sheet`, `CommissionSheet` |
| Overlay and obscuration | Sheets and modals dim the sheet behind with `--scrim`; the Alerts peek floats over the rail with `--shadow-float` (the only shadow) | `Overlay.tsx`, `AppRail` |
| Dolly / scale and zoom | A widget added to the dashboard scales from 0.96 to 1; a removed one shrinks and fades before the grid closes the gap; the spectrum's frequency window glides to a preset or to a dragged selection (0.5s, `power3.inOut`) so the eye keeps the peak it was on | `layout.ts` (`onEnter`, `leaveThen`), `Spectrum` |
| Micro-interaction / responsive feedback | Controls press to 0.98 in 120ms; every write ends in a toast, reversible ones with Undo, or in a done panel when a sheet already shows the result; a passed wizard step pops its teal tick once (`back.out`) | `Button`, `HoldButton`, `sonner`, `Stepper` |
| Anticipation | Destructive or binding actions fill a bar while held; letting go early retracts it | `HoldButton` |
| Progress indicators | Skeletons in `--active`, the "Updating" spinner in the top bar, numbered steps in setup; the wizard's ink line fills down to the current step; the audit chain check and the 1 s test capture run a 2px ink line while they work | `States`, `AppShell`, `Steps`, `Stepper`, `ChainStatus`, `CaptureStep` |
| Hover effects and animated icons | Rail items tint on hover; icons inside controls nudge or turn a little on hover/focus; the primary button leans toward the pointer about 4px | `globals.css` icon motion, `useMagnetic` |
| Data growth | Bars grow from their baseline, one after another | `useGrow` (dashboard lines, modality bar, licence usage) |
| Consistency | One clock, one set of curves and durations, the same pattern for the same meaning on every screen | this file |

## Left out on purpose

| Principle | Why not |
|---|---|
| Parallax | Viper is a dense working tool read for hours; parallax moves data the eye is reading. Lenis smooth scrolling is the only scroll effect. |
| Dimensionality / 3D | Atlas keeps surfaces flat (no shadows on the sheet); depth would break the ink-and-hairline look. |
| Cloning | No element duplicates itself into another place; the shared-element morph of Atlas (document chip → viewer band) has no Viper equivalent yet. |
| Looping animations | Only the spinner loops. Nothing pulses for attention: a plant screen that is always moving trains people to ignore it. |

## Reduced motion

`prefers-reduced-motion: reduce` keeps fades and drops travel, scale, loops and View Transition animation.
In JS every helper returns early when `reduced()` is true (`useEnter`, `useGrow`, `useGlide` places instantly,
`Flip` is skipped, chart wipes are skipped, `HoldButton` steps instead of sweeping, the theme switch applies
instantly). In CSS the `@media (prefers-reduced-motion: reduce)` block in `globals.css` turns `enter`, `band-in`
and `bar-grow` into plain fades.
