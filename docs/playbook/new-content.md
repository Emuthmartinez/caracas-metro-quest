# Metro Quest — New Content Playbook

The recipe for adding content after launch. A future agent with zero context
should manage creature #151 in one session using only this playbook, the prompt
library (`docs/art/prompt-library.md` + `prompts/`), and the lore bible
(`docs/canon/lore-bible.md`). Maintained from Phase 3 onward; sections for
content types whose phases haven't run yet are marked PENDING.

## Ground rules (always)

1. Read `docs/canon/lore-bible.md` first. Canon is law; conflicts are flagged to
   the owner, never silently resolved. Sacred figures (lore bible §2.5/Q10A rule)
   are NPC-only.
2. All content is data: JSON under `data/`, schemas in their `.schema.json` or
   `docs/engineering/data-contracts.md` (Phase 9). Nothing hardcoded in engine.
3. All art goes: locked template → Higgsfield `flux_2` → `scripts/postprocess.py`
   → contact sheet vs the chigüire anchor (`assets/creatures/chigui/front.png`,
   job `41bf424d-5b84-45a7-89e1-6d334091a6d7`). Preflight credits per batch
   (`get_cost:true`); 3 failed regens → flag for manual review.
4. Spanish first, English second, caraqueño voice, no partisan politics.
5. Run the validators before any commit: `node tests/smoke.js`,
   `python3 scripts/gen_maps.py` (if maps touched), and
   `scripts/validate-content.py` (Phase 9, PENDING).

## Add a creature

1. **Design row:** append to `data/creatures/creatures.json` (schema in master
   plan / Phase 4, PENDING until GATE 4): bilingual names, inspiration, category
   (fauna/folklore/urban-magical), region+habitats from `docs/design/world-bible.md`,
   types from the 8 canon types, stats within the stage budget (300–340 / 400–440 /
   500–540, legendaries 570–600), learnset using ONLY ids from
   `data/moves/moves.json`, abilities from systems-spec §2.8, catch rate, dex
   entries ES+EN, `design_brief`, `silhouette_progression`.
2. **Folklore check:** if category=folklore, confirm the being is treated as
   living heritage (lore bible §3) and is not in the sacred list.
3. **Encounters:** add the creature to `enc.<map_id>` tables for its habitats
   (Phase 4 file, PENDING).
4. **Art:** fill `prompts/creature-concept.prompt` vars (palette rows per its
   types; Espanto → row 6 shadow rule). Generate front → postprocess
   `--kind battle` → eyeball vs anchor. Then `creature-back.prompt` with the
   front job as reference media. Derive icon (`--kind icon`), overworld base
   (`--kind overworld`), tornasol (`--shiny`). Evolved stages use
   `creature-evolution.prompt` with the prior stage's front job as reference.
   Commit raw + processed under `assets/creatures/<id>/` + `meta.json`
   (job_ids, seeds, palette stats).
5. **Cry:** add to `MQ.CRIES` per `DESIGN.md` (audio spec Phase 8 may supersede).
6. Validate, commit, open PR.

## Add a move

Append to `data/moves/moves.json` per systems-spec §2.7 (id, bilingual names,
type, category fixed by type for damaging moves, power/accuracy/pp/priority/
contact, `effects[]` from the locked taxonomy, ES+EN descriptions ≤90 chars).
Keep type counts balanced (each type 25–26 at v1). Reference it from at least
one learnset or casete. Validate.

## Add a map

Edit the line/surface definitions in `scripts/gen_maps.py` (NEVER the JSON);
run it (reachability is checked automatically); name encounter table
`enc.<map_id>` and music `mus.<region>.<context>` per `data/maps/maps.schema.json`
conventions. Region tileset must exist or be generated via `tileset.prompt`
(environment concept first, then tilesheet with the concept as reference).
Update `docs/design/world-bible.md` with the map's identity paragraph.

## Add an NPC

PENDING until Phase 7 (dialogue schema). Art today: `npc-character.prompt` →
postprocess battle+overworld kinds → `assets/npcs/<id>/`.

## Asset file structure (locked)

```
assets/creatures/<id>/
  raw/front.src.png back.src.png        # generator output, untouched
  front.png back.png                    # 64x64 battle, ≤15 colors
  front-tornasol.png                    # deterministic shiny
  icon.png                              # 32x32
  overworld.png                         # 16x16 (or 16x32 --h32) base
  contact-sheet.png                     # review artifact
  meta.json                             # job_ids, seed, colors, anchors
```
