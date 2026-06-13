# Metro Quest: Caracas — Systems Spec (Phase 1, for GATE 1)

**Status:** Draft for GATE 1 review.
**Inputs:** frozen Lore Bible (`docs/canon/lore-bible.md`, GATE 0 closed 2026-06-11)
and FireRed/LeafGreen (Gen 3) research verified against Bulbapedia (Catch rate,
Critical hit, Damage pages), Serebii, and The Cave of Dragonflies Gen III/IV
capture-mechanics documentation.
**Companion deliverable:** `data/moves/moves.json` — the full move list (204 moves).

Decisions marked **⚑** amend shipped canon values (allowed by GATE 0/Q4A but called
out individually). Everything in this document is proposed until GATE 1 closes.

---

## 1. Master parity table

Every FireRed/LeafGreen system enumerated, with the Metro Quest decision.
KEEP = as FireRed. ADAPT = re-themed/re-tuned (full spec in §2+). CUT = not in v1.

### 1.1 Battle core

| FireRed system | Decision | Metro Quest version / rationale |
|---|---|---|
| Turn order: priority brackets, then Speed, ties random | KEEP | §2.1 |
| Damage formula (Gen 3) | KEEP | Already shipped canon. §2.2 |
| Type chart (17 types) | ADAPT | 8 canon types, shipped chart kept verbatim (GATE 0/Q2A). §2.3 |
| STAB ×1.5 | KEEP | Canon. |
| Critical hits: stages 1/16→1/2, ×2, ignore stages | ADAPT | Stages kept (1/16, 1/8, 1/4, 1/3, 1/2); multiplier stays canon **×1.5** (gentler for the audience; deliberate FireRed deviation). Crit ignores attacker's negative / defender's positive stages, per Gen 3. |
| Accuracy/evasion stages, move accuracy | KEEP ⚑ | Stages extended from canon ±4 to Gen 3 **±6** (multipliers `max(2,2+s)/max(2,2−s)`; acc/eva `3/3` base). `accuracy: null` = cannot miss (canon's `acc:1000` idiom, formalized). |
| Physical/special split: Gen 3 by-type | KEEP | Per GATE 0/Q3B. Physical types: **Criollo, Sabroso, Monte, Tepuy**. Special types: **Rumba, Espanto, Catatumbo, Caribe**. Status moves any type. |
| PP per move; Struggle when empty | KEEP | Canon **Forcejeo** (50 pow, 25% recoil). |
| Multi-hit (2–5: 37.5/37.5/12.5/12.5%), charge/semi-invulnerable, recoil, drain, flinch, high-crit, counter moves, traps/binding, hazards (Spikes), protect/endure, recharge | KEEP | Full effect taxonomy in §2.7; every effect used by ≥1 move in `moves.json`. |
| OHKO moves (Fissure et al.) | CUT | Anti-fun at this roster size; nothing in canon needs them. |
| Weather: rain, sun, sandstorm, hail | ADAPT | 5 metro-flavored conditions: **lluvia, sol de esquina, neblina del Ávila, apagón, hora pico**. §2.4 |
| Double battles | ADAPT | Scripted trainer pairs only (no wild doubles); data model supports `"double": true` on trainer battles. |
| Badge stat boosts | CUT | FireRed itself dropped them. |
| Exp gain, EV gain on KO, ×1.5 trainer bonus | KEEP | Trainer bonus is canon. EVs: §2.6. |
| Money on win/loss (lose half on whiteout) | ADAPT | Whiteout: wake at last Módulo, lose **25%** of bolos (gentler), `La Vaca` move / Morocota item double prize money. |
| Switching, run calc (speed-based), trap moves block flee | KEEP | Canon run formula kept; bosses/Tren block flee (canon). |

### 1.2 Status conditions (GATE 0/Q8A)

| Condition | Code | Mechanics |
|---|---|---|
| Envenenado (poison) | `psn` | 1/8 max HP per turn (canon). Toxic variant `psn2` (Veneno de Mapanare): 1/16 ramping +1/16 per turn. |
| Paralizado | `par` | SPE ÷2, 25% full paralysis (canon). |
| Dormido | `slp` | 1–3 turns (canon). |
| **Quemado (burn)** | `que` | NEW. 1/8 max HP per turn; physical damage halved. Sources: hot food, sparks, la Centella. |
| **Empavado (freeze analog)** | `pav` | NEW. Cannot act; 20% self-recovery per turn; cured instantly if hit by a Rumba move (un buen joropo espanta la pava) or by Agua Bendita-tier items. Espanto-types cannot be empavados. |
| **Mareado (confusion, volatile)** | `mareo` | NEW. 1–4 turns; 50% chance to hit self (40 pow typeless physical). Ends on switch. |
| Infatuation, Curse-as-status, Leech Seed, Nightmare etc. | PARTIAL | Curse → move **Velorio**; Leech Seed → **Enredadera Chupasavia**; infatuation CUT. |

One major (psn/par/slp/que/pav) + volatiles may stack, per Gen 3.

### 1.3 Stats, growth, individuality

| FireRed system | Decision | Metro Quest version |
|---|---|---|
| Six stats HP/ATK/DEF/SPA/SPD/SPE | KEEP ⚑ | GATE 0/Q3B amendment. Gen 3 stat formula verbatim (HP: `⌊(2·Base+IV+⌊EV/4⌋)·L/100⌋+L+10`; others `(⌊(2·Base+IV+⌊EV/4⌋)·L/100⌋+5)·nature`). The shipped 29 get SPA/SPD derived in Phase 4 rebalance. |
| IVs 0–31 per stat | KEEP | Rolled on generation; flavor name **"la chispa"**. |
| EVs: 510 total, 252 effective per stat | KEEP | Flavor **"calle"** (street experience). Vitamins +10 up to 100/stat (§2.10). |
| Natures: 25, ±10% | KEEP | Localized table in §2.5. |
| Experience groups: 6 (incl. Erratic, Fluctuating) | ADAPT | 4 groups, all cubic-scaled for engine simplicity: `rapido` 0.8n³ · `parejo` n³ (canon default) · `pausado` 1.15n³ · `lento` 1.3n³. Erratic/Fluctuating CUT (opaque complexity, no canon value). |
| Level cap 100 | KEEP | Curve targets in §3. |

### 1.4 Creatures

| FireRed system | Decision | Metro Quest version |
|---|---|---|
| Abilities (1 per species in FRLG) | ADAPT | 1–2 per species + 1 hidden (rare encounters only), per master plan. Ability list: §2.8. |
| Held items | ADAPT | ~22 themed items (§2.9); wild creatures may hold them (5%/50% tiers). |
| Gender / genderless | KEEP | Ratios in creature data; espantos mostly genderless; no sprite differences v1. |
| Friendship (evolution + Return/Frustration) | ADAPT | **Confianza** 0–255: raised by battles/walking/items, lowered by fainting. Evolves select lines ("solo evoluciona quien se siente en casa"); moves **Cariño** / **Despecho** scale with it. |
| Shiny 1/8192, star sparkle | ADAPT | **Tornasol**, 1/4096 (modern odds — kinder for a 150-dex). Visual rule: palette row swapped toward **franja-naranja glow** (style bible locks exact rows). Dex tracks tornasol fichados. |
| Form variants (Unown/Deoxys) | CUT | `form` field reserved in schema, unused v1. |
| Breeding/eggs/daycare | ADAPT | **La Tía que Cuida** (daycare: leveling for bolos, post-Act 1). Eggs/breeding CUT v1; `egg_group` field reserved. |

### 1.5 Capture

Gen 3 formula verbatim (verified vs Bulbapedia/Cave of Dragonflies):
`a = ⌊(3·HPmax − 2·HPcur) · rate · ficha / (3·HPmax)⌋ · status`; if `a ≥ 255` caught,
else shake value `b = 1048560 / √(√(16711680/a))`, four checks of `rand(0..65535) < b`.
Status bonus: DRM/PAV ×2; PAR/ENV/QUE ×1.5 (canon-consistent).

| Capture item | Bonus | Notes |
|---|---|---|
| Ficha del Metro | ×1 | Canon. 200 Bs. |
| Ficha de Feria | ×1.5 | New. Bulk-bin token from the buhonero. 600 Bs. |
| Ficha Dorada | ×2 | Canon ("la respetan más"). 1.200 Bs. |
| Ficha Rayada | ×3 if target has a status, else ×1 | New. Scratched in the turnstile. 1.000 Bs. |
| Ficha Madrugadora | ×4 in túnel/zona oscura, else ×1 | New. Dusk-ball analog for our underground. 1.000 Bs. |
| Ficha de Oro | guaranteed | Canon: blessed at Sorte, never fails. Unique, story-given by María Lionza. |

Safari Zone → **el Zoológico de Caricuao** (Línea 2 post-Act-1): entry fee, 30 Fichas
de Feria, step limit, bait (fruta) / distract (silbar) instead of battling.

### 1.6 Moves

| FireRed system | Decision | Metro Quest version |
|---|---|---|
| 354 moves | ADAPT | **204 moves** in `data/moves/moves.json` (schema §2.7): all 45 shipped canon moves preserved (ids, names, types, stats) + 159 new. Bilingual names/descriptions. |
| TMs (50, single-use) | ADAPT | **Casetes** TM01–TM40, single-use, sold by buhoneros / boss rewards ("casetes quemados del bulevar"). |
| HMs (8) + field gating | ADAPT | **Oficios** (§2.11): 6 tutor-taught field skills; non-forgettable until el Olvidadizo. |
| Move tutors | ADAPT | Specialist buhoneros, one-time, per region; starter ultimates at Ávila base (Cape Brink pattern). |
| Move reminder (Two Island) | ADAPT | **La Coplera** at Caño Amarillo: re-teaches learnset moves for a Cocada. |
| Move deleter | ADAPT | **El Olvidadizo** (Bellas Artes) — the only way to unlearn an oficio. |
| Sketch/Mimic/Metronome class | CUT | Copy-move engine cost; nothing in canon needs them. |

### 1.7 Progression & trainers

| FireRed system | Decision | Metro Quest version |
|---|---|---|
| 8 badges | ADAPT ⚑ | **8 Fichas Doradas** (GATE 0/Q7A): the 4 canon Jefes + 4 new at Phase-2-designated terminals of Líneas 2/3/4. Badges gate oficio use out of battle + traded-level obedience (kept for future trading). |
| Elite Four + Champion | ADAPT | **El Consejo de la Hora Fantasma** at Zona Rental: 4 ánimas-themed masters back-to-back, then **Cheo** as the final battle (his 4th, the one where he says it). Then the Línea Fantasma opens. |
| Rival battles | KEEP | Cheo ×3 across acts (canon) + Consejo finale + post-game weekly rematch. Counter-picks your starter (canon). |
| Vs Seeker | ADAPT | **El Bíper** (90s pager): ping outdoor/platform trainers for rematches after N steps. |
| Trainer classes | ADAPT | Themed roster for Phase 6: buhoneros, motorizados, estudiantes de la UCV, abuelas, señores del dominó, ajedrecistas del bulevar, operadores del Metro, ánimas, Jefes de Estación. |
| Trainer line-of-sight, `!` engage | KEEP | Canon already does this. |
| Scaling/obedience | KEEP | Obedience tied to Fichas Doradas (matters only for future trading). |

### 1.8 Overworld

| FireRed system | Decision | Metro Quest version |
|---|---|---|
| Tall grass encounters | ADAPT | **Zonas oscuras** (tunnels, canon), **matorrales** (surface monte), **andenes concurridos** (crowd pockets), **pozos y fuentes** (fishing), **senderos del Ávila**. Per-step proc 1/8 dark zone, 1/10 matorral, 1/12 andén; tables per map with rarity tiers (común 60% / frecuente 30% / raro 9% / rarísimo 1%). |
| Maintenance shafts (our Rock-Smash-cave analog) | ADAPT | Rare high-tier tables behind the **Demolición** oficio. |
| Repels (3 tiers) | ADAPT | **Esencia de Azabache** (100 pasos) / **Azabache Doble** (200) / **Contra Firmada** (300) — folk protections as repels. |
| Fishing rods (Old/Good/Super) | ADAPT | **Anzuelo Viejo / Bueno / Súper** — cast into fountains, flooded tunnel pools, Guaire edges (Caribazo lives there, canon), Ávila streams. |
| Surf | ADAPT | Oficio **Nado**: cross flooded tunnel sections and quebradas. |
| Fly | ADAPT | Oficio **Teleférico**: Metrocable hop to any visited station with a cable/surface link (the train already fast-travels underground, canon — Teleférico covers surface/barrio verticals). |
| Cut / Flash / Strength / Rock Smash | ADAPT | Oficios **Machete** (monte overgrowth), **Luz de Cocuyo** (apagón zones), **Empuje** (stalled vagones, crates), **Demolición** (rubble walls). |
| Waterfall/Dive | CUT | No canon waterfall traversal; Salto Ángel appears as a move, not a route. |
| Bike | ADAPT | **La Patineta** (skateboard), gift in Sabana Grande; speed ×2, banned inside station mezzanines (the operator scolds you). |
| Running shoes | KEEP | Canon already runs (zapatos de goma). |
| Itemfinder | ADAPT | **El Detector del Buhonero** — beeps near hidden items. |
| Hidden items | KEEP | Seeded in Phase 2 maps. |
| Day/night | CUT | GATE 0/Q9A: no clock. Underground = eternal hora fantasma; surface = golden hour. Map-based light/weather. |
| Berries | ADAPT | **Frutas** (§2.9): pickable from 8 marked trees/stalls, regrow per N battles; held-item cures. |
| Poison in overworld (Gen 3: faints at 1 HP) | ADAPT | ENV ticks while walking, stops at 1 HP (FireRed behavior kept). |

### 1.9 Items & economy

Currency: **bolos** (canon). Sources: trainer winnings, La Vaca/Morocota, selling
finds, dex milestones. Sinks: fichas, casetes, healing, La Tía daycare, Torre fees.

| Class | Items |
|---|---|
| Healing (canon-rooted) | Maltín Frío 20 HP · Marroncito 50 HP · Golfeado con Queso 'e Mano 120 HP · Cocada full HP · Agua de Coco any status · Sancocho Completo full HP+status · Cariaquito Morado revive 50% · Cariaquito Doble revive full |
| EV vitamins (+10 calle) | Carne Mechada ATK · Tajada DEF · Papelón SPA · Queso Rallado SPD · Café Cerrero SPE · Hervido de Gallina HP |
| Battle X-items | X Arrechera (ATK) · X Concha (DEF) · X Labia (SPA) · X Aguante (SPD) · X Pilas (SPE) · Estampa de Ajedrez (crit, Dire-Hit analog) |
| Mart tiers | Act-gated inventory per region (Phase 2 assigns); buhonero stalls = marts (canon "¡lleve lleve!"). |
| Pickup | Ability **Buhonero**: 10% post-battle item find, table by act. |

### 1.10 Facilities & extras

| FireRed system | Decision | Metro Quest version |
|---|---|---|
| Pokémon Center | KEEP | **Módulos de Atención** + el Doctorcito (canon; free). |
| PC storage (Bill/Lanette) | KEEP | **La Red de Casilleros (LOCKER)** — canon, networked between stations. |
| Name rater | ADAPT | **El Padrino** (Capitolio): re-baptizes your fichados. |
| Fame Checker | ADAPT | **El Chismógrafo**: gossip notebook auto-collecting rumors about Jefes/characters from signs and NPCs. Pure flavor, dirt cheap, very caraqueño. |
| Teachy TV / Help (L/R) | CUT | Tutorials live in Abuela dialogue + first-battle prompts; web UI has its own help. |
| Game Corner | CUT v1 | Slot machines read wrong here; stub: the **ajedrez del bulevar** minigame reserved for post-v1. |
| Trainer Tower | ADAPT | **La Torre** (post-game battle facility, La Previsora-style clock tower): streak battles, prize fichas/casetes. |
| Berry Crush, Union Room, Mystery Gift, e-Reader | CUT | Link-cable era features with no v1 multiplayer. |
| Trading / link battles | CUT v1 | GATE 0/Q13: data model stubs kept — `ot`, `personality_seed`, obedience rules — so save format never breaks if added. |

### 1.11 Dex, save, post-game

| System | Decision | Metro Quest version |
|---|---|---|
| Pokédex seen/caught | KEEP | **El Cuaderno de Espantos**: visto/fichado, ES+EN entries, habitat + cry playback. Rewards: 50 fichados → 5 Fichas Madrugadoras; 100 → **Tornasol Bendito** (tornasol odds 1/1365); 150 → Diploma del Cronista + key art unlock. |
| Save anywhere, single slot | KEEP | Canon browser autosave + manual save. Anti-softlock: cannot save inside no-exit boss rooms; Consejo lobby always exits; money can never gate the critical path; every oficio-gate has a reachable tutor before it. |
| Sevii Islands post-game | ADAPT | GATE 0/Q6A: **Metrocable barrios** (San Agustín, Mariche), **El Ávila summit** (Catatumbo legendary, canon post-final), **Los Teques line**, La Torre, roaming espanto (**El Carretón**, DESIGN.md's wishlist), Cheo weekly rematches, Bíper rematches scale up. |
| Legendary encounters | ADAPT | El Silbón (rare static, Act 3 tunnel — canon "raro"), Catatumbo (Ávila summit post-game), Tren Fantasma (story finale; resolution per canon: no villain), El Carretón (roaming, post-game), Bachacón (static, deepest shaft). María Lionza is NPC-only forever (canon law). |

---

## 2. Full system specs (KEEP/ADAPT detail)

### 2.1 Turn order
Priority bracket first (range −5..+4; see moves.json), then effective SPE
(PAR ÷2, stages applied), ties uniform random. Switching resolves before moves.

### 2.2 Damage
`dmg = ⌊⌊(2L/5 + 2) · power · A/D⌋/50⌋ · STAB · type · crit · weather · other + 2`,
then ×rand(0.85–1.00). A/D = ATK/DEF for physical types, SPA/SPD for special types
(§1.1). Burn halves physical A. Screens (Reflejo/Pantalla future-listed) halve.

### 2.3 Type chart
Shipped 8×8 chart kept verbatim (lore bible §5). No immunities in the chart; the
ability **Espíritu Errante** grants the only immunity (Criollo→holder, Gen-1 nod).

### 2.4 Weather & field (5 turns unless map-native)
| Condition | Effects | Set by |
|---|---|---|
| **Lluvia (palo de agua)** | Caribe ×1.5, Sabroso ×0.5; Trueno del Lago can't miss | move ¿Será que Llueve?, ability Llamador de Aguas, map |
| **Sol de esquina** | Sabroso ×1.5, Caribe ×0.5; Solana heals 2/3 | move Sol de Esquina, map (surface) |
| **Neblina del Ávila** | all accuracy ×0.9; Espanto immune to the acc penalty | move Neblina del Ávila, ability Niebla Densa, Ávila maps |
| **Apagón** | physical acc ×0.9; Espanto ×1.2; any damaging Catatumbo move ends it ("volvió la luz") | move Apagón General, ability Hora Cero, tunnel events |
| **Hora pico** | 1/16 chip to all but Criollo & Tepuy; Entre el Gentío evasion bonus | move Hora Pico, platform maps at story beats |

### 2.5 Natures (25)
Neutrals: **Chévere, Pana, Vale, Chamo, Burda**.
| +\− | −ATK | −DEF | −SPA | −SPD | −SPE |
|---|---|---|---|---|---|
| **+ATK** | — | Guapo | Arrecho | Peleón | Cabezón |
| **+DEF** | Conchudo | — | Aguantador | Terco | Pachorrudo |
| **+SPA** | Cuentero | Soñador | — | Brujito | Poeta |
| **+SPD** | Sereno | Confiao | Calladito | — | Flojo |
| **+SPE** | Ligero | Resbalao | Callejero | Acelerao | — |

### 2.6 EVs/IVs
Per Gen 3 (§1.3). EV yields defined per creature in Phase 4 (1–3 points, stage-scaled).

### 2.7 moves.json schema
```json
{ "id": "joropo", "name_es": "Joropo Recio", "name_en": "Hard-Driving Joropo",
  "type": "Rumba", "category": "special|physical|status",
  "power": 85, "accuracy": 90, "pp": 10, "priority": 0, "contact": false,
  "effects": [ {"kind": "..."} ], "desc_es": "…", "desc_en": "…" }
```
`accuracy: null` = never misses. Effect kinds (each used by ≥1 move):
`status` (status, chance) · `stage` (stat, delta, target, chance) · `heal` (fraction)
· `drain` · `recoil` · `multi` (min,max) · `flinch` (chance) · `crit` (+stages)
· `weather` · `trap` (1/16 chip, 2–5 turns, no flee/switch) · `hazard` (cardonal:
1/8 on entry, grounded) · `charge` (semiInvulnerable?) · `protect` · `endure`
· `counter` (category) · `recharge` · `switch` (who: self = U-turn-like, foe =
Roar-like at −6 priority) · `noescape` (Mean-Look-like) · `money` (×2) · `curse`
(Velorio) · `leech` (Enredadera) · `cantmiss-under` (weather synergy). Status
infliction supports `"target":"self"` (La Hora Loca) and the `psn2` toxic variant.
Category of damaging moves is always the type's category; the field is explicit for
validation. **All 45 canon move ids/stats preserved unchanged** (priority/contact
flags newly assigned).

### 2.8 Abilities (38)
Format: *Name — effect (FireRed analog)*.
Raíz Firme — Tepuy ×1.5 at ≤⅓ HP (Overgrow; Frontinito line) · Coro Alzao — Rumba
×1.5 low HP (starter Turpialín) · Plena Carga — Catatumbo ×1.5 low HP (starter
Cocuyín) · Mala Cara — foe ATK−1 on entry (Intimidate) · Estática — 30% PAR on
contact · Brasa Viva — 30% QUE on contact · Colmillo Untado — 30% ENV on contact ·
Piel de Lija — contact attacker loses 1/16 (Rough Skin) · Concha Dura — survives
OHKO from full HP (Sturdy) · Echao Pa'lante — ATK ×1.5 when statused (Guts) · Bien
Comido — takes ×0.5 from Sabroso & Caribe (Thick Fat) · Solanero — SPE ×2 in sol ·
Aguaje — SPE ×2 in lluvia · Bebe Lluvia — +1/16 HP per turn in lluvia · Buhonero —
10% item after battle (Pickup) · Espantadizo — always flees wild battles · Ojo Pelao
— accuracy can't drop · Brazo Firme — ATK can't drop · Cabeza Fría — can't flinch ·
Trasnochao — no DRM · Estómago de Acero — no ENV · Destrabao — no PAR · Piel Mojada
— no QUE · A Su Ritmo — no mareo · Espíritu Alegre — no PAV · Muda de Piel — 33%
self-cure per turn · Sereno del Ávila — cures status on switch-out · Presencia
Pesada — foes spend 2 PP (Pressure) · Faroles — accuracy ×1.3 (Compound Eyes) ·
Entre el Gentío — evasion ×1.2 in hora pico (Sand Veil) · Pararrayos — absorbs
Catatumbo, SPA+1 · Esponja — absorbs Caribe, heals 25% · Oído Sordo — immune to
Rumba (Soundproof) · Flojera — acts every other turn (Truant; **Pereza**, with
inflated stats) · Pilas Puestas — SPE+1 each turn (Speed Boost, one line only) ·
Verdor — Monte ×1.5 low HP · Nado Aéreo — immune to Tepuy moves (Levitate;
**Tonina**) · Espíritu Errante — immune to Criollo moves (pure-Espanto rares; Tren
Fantasma) · plus weather-on-entry trio for legendaries: Niebla Densa (neblina),
Llamador de Aguas (lluvia), Hora Cero (apagón).

### 2.9 Held items (22) & frutas
Tajada de Plátano 1/16 heal per turn (Leftovers) · Garra de Cunaguaro 20% move first
(Quick Claw) · Moneda de Locha 10% flinch (King's Rock) · Huevo de Guacharaca XP×1.5
(Lucky Egg) · Morocota prize money ×2 (Amulet Coin) · Campana del Vagón heal 1/8 of
damage dealt (Shell Bell) · Azabache de Pulsera 10% survive at 1 HP (Focus Band) ·
Polvo de Mariposa evasion ×1.1 (BrightPowder) · 8 type boosters ×1.1: Franela del
Barrio (Criollo), Ají Dulce (Sabroso), Cuatro Afinado (Rumba), Cinta Morada
(Espanto), Bombillo Ahorrador (Catatumbo), Agua del Anauco (Caribe), Machete Viejo
(Monte), Piedra del Abuelo (Tepuy) · Frutas (held, self-cure): Mamón→PAR,
Semeruco→QUE, Guanábana→DRM, Tamarindo→ENV, Parchita→PAV, Lechosa Picada→mareo,
Merey→+10 HP.

### 2.10 Marts & money
Inventory tiers unlock per act; exact per-station stock assigned in Phase 2
world bible. Price anchors: Maltín 300 Bs · Ficha del Metro 200 · Casete 2.000–5.500
· vitamina 9.800. Trainer payouts scale `base × ace level`.

### 2.11 Oficios (field-skill gating)
| Oficio | Gates | Taught (region locked at Phase 2) | Battle move? |
|---|---|---|---|
| Luz de Cocuyo | apagón zones | Act 1 early | yes (status, acc+1) |
| Machete | monte overgrowth (El Calvario, Ávila) | Act 1 | yes (55 pow Monte) |
| Empuje | stalled vagones, crates | Act 1–2, after Ficha 2 | yes (60 pow Criollo) |
| Demolición | rubble walls, shafts | Act 2, after Ficha 4 | yes (65 pow Tepuy) |
| Nado | flooded tunnels, quebradas | Act 2–3, after Ficha 5 | yes (75 pow Caribe) |
| Teleférico | Metrocable verticals + surface fly | Act 3 / post-game | no |
Oficios are moves with `"oficio": true`; unforgettable except via el Olvidadizo;
out-of-battle use gated by Fichas Doradas (anti-sequence-break).

---

## 3. Difficulty & balance targets

| Beat | Player level target | Notes |
|---|---|---|
| Casa de la Abuela → Capitolio | 5–14 | Jefe 1 Doña Bárbara, ace L14 |
| → Plaza Venezuela | 17–19 | Jefe 2 Rumbero Mayor, ace L19 |
| → Chacaíto | 22–24 | Jefe 3 Valentina, ace L24 |
| → Petare | 27–30 | Jefe 4 Doña Petra, ace L30 (end Act 1) |
| Act 2 (Líneas 2–3, surface, Zoológico) | 31–38 | Jefes 5–6, aces L34/L38 |
| Act 3 (Línea 4, deep tunnels) | 39–46 | Jefes 7–8, aces L42/L46 |
| Consejo de la Hora Fantasma | 50–54 | four ánimas |
| Cheo (final) | 56 | counter-picks starter, full 6 |
| Tren Fantasma | 60 | story resolution per canon (no villain) |
| Post-game | 62–70 | Catatumbo L70; La Torre scales 60+ |

**Boss design rules:** Jefes never use legendaries; ace is a stage-3 with a
signature casete move; held items from Act 2 onward; full team of 6 from Jefe 7;
Consejo uses natures/EVs tuned, player-fair (no tornasol, no hidden abilities).

## 4. GATE 1 checklist (your confirmations)

1. Crit multiplier stays canon ×1.5 (vs FireRed ×2) — confirm.
2. Stat stages widen to ±6 ⚑ — confirm.
3. Six-stat rebalance of the 29 (already approved Q3B/Q4A) executes in Phase 4 — acknowledge.
4. Tornasol odds 1/4096 (vs FireRed 1/8192) — confirm.
5. Whiteout penalty 25% of bolos (vs FireRed 50%) — confirm.
6. Exp groups reduced to 4 cubic-scaled — confirm.
7. OHKO moves, Game Corner, Teachy TV/Help, berries-as-Berry-Crush, link features CUT — confirm.
8. The 204-move list (`data/moves/moves.json`) — review names especially; they are
   the most culturally exposed surface in this phase.

**Sources:** [Bulbapedia: Catch rate](https://bulbapedia.bulbagarden.net/wiki/Catch_rate) ·
[Bulbapedia: Critical hit](https://bulbapedia.bulbagarden.net/wiki/Critical_hit) ·
[Bulbapedia: Damage](https://bulbapedia.bulbagarden.net/wiki/Damage) ·
[Bulbapedia: FireRed & LeafGreen](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_FireRed_and_LeafGreen_Versions) ·
[Cave of Dragonflies: Gen III/IV capture](https://www.dragonflycave.com/mechanics/gen-iii-iv-capturing/) ·
[Serebii: FRLG Fame Checker](https://www.serebii.net/fireredleafgreen/famechecker.shtml) ·
[Game8: Vs Seeker](https://game8.co/games/Pokemon-FireRed-LeafGreen/archives/584394) ·
[Game8: Teachy TV](https://game8.co/games/Pokemon-FireRed-LeafGreen/archives/584687)
