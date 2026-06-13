# Metro Quest: Caracas — Style Bible (Phase 3, for GATE 3)

**Status:** Draft for GATE 3. On approval, style is FROZEN: every asset after this
gate is generated from the Prompt Library, post-processed by
`scripts/postprocess.py`, and quantized to the master palette. No freehand prompts.

## 1. Format spec (FireRed parity, exact)

| Asset class | Size | Constraints |
|---|---|---|
| Battle sprite (front & back) | 64×64 | ≤15 colors + transparency, 1px dark outline |
| Overworld creature/NPC | 16×16 or 16×32 | 4 directions × 3 walk frames; player 16×32 |
| Tiles | 16×16 | per-tileset palette ⊂ master palette |
| Battle background | 240×160 | full master palette allowed |
| Menu icon | 32×32 | ≤15 colors + transparency |
| Key art | 16:9, 1k+ | only non-pixel class; still master-palette graded |

**Animation (FireRed restraint — do not over-animate):** idle 2–4 frames (breathe:
1px chest/ear bob), entrance (slide+pop, engine-side), hit flinch (2-frame offset
flash, engine-side), faint (drop+fade, engine-side). Only idle frames are drawn;
the rest are engine transforms. Walk cycles: 3 frames (step-A, stand, step-B).

## 2. Master palette (64 colors, locked)

Single source of truth: `data/palette/master-palette.json`. Eight semantic rows,
dark→light. It must read as Caracas:

| Row | Name | Reads as |
|---|---|---|
| 0 | `outline_earth` | outlines, fur, soil, café |
| 1 | `concreto_brutalista` | stations, towers, platforms, rails |
| 2 | `naranja_metro` | THE brand orange: franja naranja, fichas, turnstiles — and tornasol (shiny) ramps |
| 3 | `verde_avila` | el Ávila, parks, Monte creatures |
| 4 | `selva_calida` | warm jungle lights + two earth browns |
| 5 | `hora_dorada` | golden-hour haze, Sabroso, surface light |
| 6 | `neon_espiritu` | spirit glow, evening neon, la Línea Fantasma |
| 7 | `caribe_vitales` | water blues + the only reds/pinks (Rumba, HP bars) |

Per-sprite budget: pick ≤3 ramps (+row 0 for outline) → ≤15 colors enforced by the
pipeline. Tilesets pick ≤4 ramps.

## 3. Line, shading, perspective

- **Outline:** 1px, always from row 0 (`#0d0a08`–`#2e2620`); colored interior
  outlines allowed one step darker than the fill (sel-out style). No anti-aliasing
  against transparency.
- **Shading:** flat 2-step cel (base + one shadow + optional one highlight) using
  adjacent ramp steps. Light source: top-left in battle, noon-ish for overworld.
  No gradients, no dithering except 2×2 checker allowed on backgrounds only.
- **Perspective:** overworld 3/4 top-down (FireRed camera, ~63° implied); battle
  sprites 3/4 front facing slightly left, back sprites over-the-shoulder, ground
  contact implied by a 2px elliptical shadow.
- **Silhouette first:** every creature must read in solid black at 64×64 and at
  16×16. Evolution = silhouette growth, never just bigger.

## 4. Magical-realism visual language (how spirits read)

The world rule "nadie levanta una ceja" is visual too — espantos stand in the same
light as everyone else, but:

1. **Flesh-and-blood (fauna, people):** shade with row 0 earth tones; grounded 2px
   contact shadow; full opacity.
2. **Espantos (folklore):** shading row is **row 6 (neon_espiritu)** instead of
   their hue's darker step — the shadow side of a spirit glows faint violet. No
   contact shadow (they don't quite touch the floor: 1px gap). Edges stay hard —
   no ghost transparency; they are *present*, just lit from somewhere else.
3. **Urban-magical hybrids:** flesh shading + exactly one row-6 accent feature
   (eyes, antenna sparks, a window) — the city's electricity lives in them.
4. **The sacred (María Lionza, el Doctorcito):** NPC-only; rendered like people,
   plus a row-5 golden rim-light. Never row-6 spirit shading — faith is not
   a ghost.
5. **Tornasol (shiny):** the creature's dominant ramp is swapped to **row 2
   naranja_metro** by the deterministic pipeline (`--shiny`). One rule, zero
   hand-tuning, reads instantly as "metro-blessed".

## 5. Region tints (tilesets)

Each region keys to rows: Línea 1 = 1+2 (concrete+orange) · Línea 2 = 1+3+4 (west
monte through concrete) · Línea 3 = 1+5 (southern golden dust) · Línea 4 = 1+6
(velvet dark, theater neon) · Línea Fantasma = 6+1 (violet over dead concrete) ·
superficie = 5+3 (golden hour against Ávila green) · Ávila = 3+1 fog steps ·
Metrocables = 2+5 (cabins in evening light) · Los Teques = 3+6 (Andean fog dusk).

## 6. Production rule

Asset flow (no exceptions after GATE 3): template from `prompts/` (variables only)
→ Higgsfield Flux 2.0 (1 credit/image, preflight per batch) → `scripts/postprocess.py`
(background removal → crop → NEAREST downscale → master-palette quantize → ≤15
color merge → outline enforcement → contact-shadow/spirit-gap pass) → contact
sheet vs the chigüire anchor → commit raw + processed + `meta.json`.
Any asset class without a template gets its template added to the library FIRST,
reviewed at a gate, then used.
