# Metro Quest — Prompt Library (Phase 3, for GATE 3)

**The consistency engine.** One locked, parameterized template per asset class in
`prompts/`. After GATE 3, generation prompts are NEVER written freehand: adding
content means filling a template's named variables. An asset class without a
template gets its template added here FIRST, gate-reviewed, then used.

**Generation defaults:** Higgsfield model `flux_2` (variant `pro`, resolution
`1k`; `2k` for key-art only) — **1 credit per image** (preflighted 2026-06-11).
Preflight every batch with `get_cost:true`; report running totals at each batch
gate; warn before any batch that would push phase spend past plan; 3 failed
regenerations of the same asset → stop and flag for manual review.

| Template | Variables | Reference media | Post-process kind |
|---|---|---|---|
| `creature-concept.prompt` | {name} {design_brief} {palette_rows} | — (stage 1 = anchor) | `battle` (64×64) |
| `creature-back.prompt` | {name} {design_brief} | front concept job_id | `battle` |
| `creature-evolution.prompt` | {name} {prior_stage_name} {design_brief} {palette_rows} | prior stage front job_id | `battle` |
| `npc-character.prompt` | {name} {role} {design_brief} | — | `battle` + `overworld` |
| `station-environment.prompt` | {station} {identity} {landmarks} | — | reference only |
| `tunnel-route.prompt` | {route} {mood} {features} | — | reference only |
| `surface-zone.prompt` | {zone} {identity} | — | reference only |
| `battle-background.prompt` | {habitat} {palette_rows} | — | `background` (240×160) |
| `tileset.prompt` | {region} {materials} {props} | environment concept job_id | `tilesheet` (16px grid) |
| `ui-elements.prompt` | {component} {state} | — | `icon` (32×32) |
| `key-art.prompt` | {scene_brief} {featured_creatures} | — | palette grade only |

**Derived assets (no generation, deterministic from the processed battle front):**
icon 32×32 (`--kind icon`), overworld base 16×16/16×32 (`--kind overworld`),
tornasol variant (`--shiny`, swaps dominant ramp → naranja_metro row). Walk-cycle
frames are pixel-edited from the overworld base in Phase 5 (engine-side specs in
style bible §1).

**Reference elements:** each evolution line's stage-1 processed front is the
line's master anchor. Its Higgsfield `job_id` is recorded in the creature's
`meta.json` and passed as reference media to `creature-back` / `creature-evolution`
runs. The chigüire line's stage-1 (`assets/creatures/chigui/meta.json`) is the
GLOBAL style anchor: every Phase 5 batch contact-sheets against it.

**{palette_rows} vocabulary:** name the rows from `data/palette/master-palette.json`
with their hex lists, e.g. for a Caribe creature:
`caribe blues (#0f2a52 #1c4d8c #2f6fb8 #4a90d9 #84bce8), earth browns (#2e2620 #4a4038 #6b5d4f), outline (#0d0a08)`.
Espanto creatures must include row 6 as the stated shadow ramp (style bible §4).
