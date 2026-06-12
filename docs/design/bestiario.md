# Metro Quest: Caracas — El Bestiario (Phase 4, for GATE 4)

**Status:** Draft for GATE 4 review. No creature art is generated until this closes
(Phase 5 spends credits against exactly this data).
**Inputs:** frozen Lore Bible (GATE 0), systems spec + 204 moves (GATE 1),
world bible + 88 maps (GATE 2), style bible + prompt library (GATE 3).
**Deliverables on the branch:**

| File | What |
|---|---|
| `data/creatures/creatures.json` + `.schema.json` | The 150 species, complete design rows |
| `data/abilities/abilities.json` | The locked §2.8 ability list (41) as data |
| `data/encounters/encounters.json` + `.schema.json` | 55 wild tables + statics, gifts, roaming, fishing |
| `scripts/validate_bestiario.py` | Full contract check incl. the canon-29 freeze (run before every content commit) |

---

## 1. Shape of the roster

**150 species, 62 evolution lines** (24 three-stage, 32 two-stage across the dex,
plus singles), all 8 types, every species obtainable (wild, fishing, static, gift,
roaming, or evolution — machine-verified). **El Tren Fantasma is dex #150**: filling
the Cuaderno ends on him, como debe ser.

- **Canon 29 (GATE 0/Q4A):** names, types, evolution relationships, lore hooks,
  shipped dex entries, shipped learnset rows and shipped evo levels preserved
  verbatim — the validator hard-fails on any drift. Six-stat rebalance applied per
  Q3B (table in §3). Learnsets only ever *append* (e.g. La Sayona finally learns
  **La Pregunta de la Sayona** at 40; Morrocoy gets his **Sentón** at 36).
- **Q1A honored:** starters keep their canon trio and each line gains a stage 3 —
  **Waraira** (the mountain that walks), **Florentín** (out-sang the Devil),
  **Centellón** (a storm that fits in a corridor). Chigüi and Guacamayo become full
  three-stage lines (**Chigüiral**, **Guacamayín/Guacamayón**).
- **Q4A "singles may gain stages":** pre-evos for Cunaguaro (**Cunaguarín**),
  Tonina (**Toninita**, evolves by confianza — la encantada solo se queda con quien
  confía), Mapanare (**Mapanarita**), Araguako (**Araguatico**); new evolutions for
  Cachicamo (**Gliptón**, the prehistoric grandfather), Duendecito (**Sombrerúo**)
  and Pavoso (**Pavorreal**, a tail-fan of broken mirrors). Everything else canon
  stays exactly as shipped.
- **Sacred rule (Q10A):** zero creatures from living devotion. María Lionza, el
  Doctorcito, el Ánima Sola remain NPC-only. Folkloric espantos (Coco, Dientona,
  Hachador, Mula Maniá, Sereno, Luz Caraballo) are fichables, treated as shared
  childhood canon — sustos, never gore.

### Blocks (dex order tells the story of the city)

| Dex | Block |
|---|---|
| 1–9 | The three starter lines, full |
| 10–30 | Línea 1: the everyday city (pigeons, rats, street dogs, the canon Act-1 cast) |
| 31–57 | El Calvario & parques: el monte urbano (vines, orchids, monkeys, vultures) |
| 58–78 | **La cocina** (Sabroso block): arepas, cachapas, tequeños, hallacas, café, el Pabellón |
| 79–88 | **La música** (Rumba block): living instruments, tambores, la paraulata |
| 89–102 | **Los espantos del pueblo**: sustos, velas, el Sereno, el Coco (#100), la Dientona |
| 103–111 | **Las aguas**: toninas, babas, el manatí del Parque del Este, el Güío |
| 112–124 | **La ciudad eléctrica y los objetos que esperan**: bombillos, plantas, la Maletica, el Telefonito |
| 125–127 | Canon espantos mayores (Vagónima, Llorona, Sayona) |
| 128–145 | El oeste profundo y el páramo: zoo fauna, el tigre, tepuyes, frailejones, el cóndor |
| 146–150 | **Legendarios** (§4) |

## 2. Design rules applied (all from the locked specs)

- **Budgets** (playbook/master plan): s1 300–340 · s2 400–440 · s3 500–540 ·
  legendaries 570–600. `budget` is a *power tier*: 2-stage finals usually sit in s2,
  but earned exceptions sit in s3 (Caribazo — the Gyarados of the Guaire; Bachacón;
  Tigrón; Pereza, whose inflated stats are taxed by **Flojera**/Truant per §2.8).
- **EV yields** (§2.6): stage-scaled 1/2/3 points in each species' flagship stat(s).
- **Abilities** (§2.8 only, now data): every species 1–2 + hidden where it earns one.
  Spec-mandated picks honored: starters' Raíz Firme/Coro Alzao/Plena Carga, Pereza's
  Flojera, Tonina's Nado Aéreo, Pilas Puestas on exactly one line (Pilica), Espíritu
  Errante on the pure-Espanto rares + Tren Fantasma, and the weather trio on
  legendaries (§4).
- **Catch rates:** canon values untouched; new species banded by tier (commons
  190–255 → legendaries 5–15). **Exp groups:** the 4 cubic groups of §1.3.
- **Genders:** fauna 50/50 (starters 87.5/12.5), espantos/objects genderless, named
  folklore figures keep their gender (La Sayona, El Silbón…).
- **Held items:** deferred to the items-data phase (systems-spec §2.9 list exists;
  wild hold assignments are an encounter-layer patch once item ids are data).
- **Phase 5 hooks:** every species carries `design_brief` +
  `silhouette_progression` written to feed `prompts/creature-concept.prompt`
  variables directly.

## 3. The canon 29: six-stat rebalance (Q3B/Q4A, executed)

Old speed ratios preserved; ATK/SPA split follows each species' type category
(§1.1 physical/special by type) and its canon character.

| Criatura | 4-stat (HP/ATQ/DEF/VEL) | 6-stat (HP/ATK/DEF/SPA/SPD/SPE) | BST |
|---|---|---|---|
| Frontinito | 54/60/58/50 | 58/64/62/40/56/40 | 320 |
| Ucumarí | 78/84/82/58 | 82/90/86/48/72/52 | 430 |
| Turpialín | 50/58/50/68 | 52/48/46/64/46/64 | 320 |
| Cantaclaro | 70/82/64/90 | 70/62/60/90/62/86 | 430 |
| Cocuyín | 48/60/48/72 | 45/42/42/68/49/74 | 320 |
| La Centella | 66/88/60/96 | 60/52/52/95/65/106 | 430 |
| Rabipelado | 55/62/45/65 | 85/75/55/55/60/90 | 420 |
| Chigüi | 56/46/52/40 | 70/52/58/46/58/36 | 320 |
| Chigüirón | 82/70/72/44 | 90/72/80/55/83/50 | 430 |
| Caribito | 38/52/38/62 | 38/30/35/62/40/95 | 300 |
| Caribazo | 62/92/56/86 | 75/70/65/115/80/120 | 525 |
| Bachaquito | 40/56/46/56 | 40/70/50/30/45/70 | 305 |
| Bachacón | 66/82/72/58 | 80/125/105/45/75/90 | 520 |
| Cunaguaro | 55/78/48/85 | 65/95/55/50/60/115 | 440 |
| Pereza | 85/55/70/22 | 120/110/95/60/95/30 | 510 |
| Guacamayo | 60/66/50/76 | 70/60/50/85/60/100 | 425 |
| Araguako | 70/72/56/50 | 85/90/65/70/70/55 | 435 |
| Mapanare | 50/86/46/76 | 60/105/55/60/55/100 | 435 |
| Cachicamo | 56/60/82/34 | 60/60/85/30/60/40 | 335 |
| Morrocoy | 86/56/96/20 | 95/60/110/45/100/30 | 440 |
| Duendecito | 48/56/56/50 | 50/50/55/60/55/45 | 315 |
| Pavoso | 66/42/62/44 | 75/35/70/55/70/25 | 330 |
| Tonina | 72/70/58/72 | 85/60/60/90/70/70 | 435 |
| Vagónima | 66/78/66/78 | 90/75/85/100/85/85 | 520 |
| La Llorona | 76/80/60/64 | 95/70/75/110/90/80 | 520 |
| La Sayona | 70/96/60/82 | 80/90/65/120/75/100 | 530 |
| El Silbón | 80/105/70/95 | 85/90/70/130/85/120 | 580 |
| Catatumbo | 86/110/76/100 | 90/95/80/135/90/110 | 600 |
| Tren Fantasma | 100/88/82/78 | 115/85/105/110/100/85 | 600 |

## 4. Legendarios (5 + the boss)

| Criatura | Tipos | BST | Ability | Where |
|---|---|---|---|---|
| **El Silbón** (canon) | Espanto/Rumba | 580 | Presencia Pesada | Static L48, túnel Capuchinos↔Teatros (Act 3, "raro" per canon) |
| **Catatumbo** (canon) | Catatumbo/Caribe | 600 | **Llamador de Aguas** (lluvia ⇒ his Trueno del Lago never misses) | Ávila summit L70, post-game |
| **La Loca Luz Caraballo** (new) | Espanto/Tepuy | 580 | **Niebla Densa** | Static L68 in the Los Teques fog — de Chachopo a Apartaderos (Andrés Eloy Blanco) |
| **El Carretón** (new; DESIGN.md wishlist) | Espanto/Criollo | 580 | **Hora Cero** (rolls in with the blackout) | Roams Los Teques, post-game |
| **Tren Fantasma** (canon, #150) | Espanto/Catatumbo | 600 | Espíritu Errante | Story finale; fichable only on the post-game second ride |

The §2.8 weather-trio abilities land on Catatumbo / Luz Caraballo / Carretón. El
Ánima Sola was considered and **excluded** (venerated — Q10A). Bachacón keeps his
canon "legendary" flavor as a Demolición-gated static (L36) without legendary stats.

## 5. Encounters (55 tables, machine-checked against maps.json)

- Level bands follow §3 difficulty targets: L1 tunnels ramp 3→22 west-to-east, L2
  29–38 (apagón segments), L3 33–42, L4 42–50, Línea Fantasma 50–58, Ávila up to
  68, Metrocables 60–66, Los Teques 62–70.
- Rarity buckets 60/30/9/1 per §1.8; fishing tables (viejo/bueno/súper) on 4 waters
  (Caobos pond, Parque del Este, the Guaire at La Yaguara, the flooded Nado gate).
- **Ghost-station tableaux carry the theme:** the quinceañera hall spawns Veloriones
  and a rare Sayona; the kitchen spawns Hallaquines; the airport gate is Maletica
  country. The L5 commons *are* the left-behind objects.
- Every region's identity from the world bible is expressed in its table (La Bandera
  = densest andén crowd table; Zoológico safari per §1.5; San Agustín = pure Rumba
  in the sky; Mariche = the old monte, rare Tigrón).
- Flavor easter egg: **El Manguito** cable station spawns Mangazos. The station
  asked for it.

## 6. Distribution

Type spread (primary+secondary): Monte 55 · Espanto 39 · Rumba 29 · Criollo 27 ·
Tepuy 27 · Caribe 23 · Catatumbo 21 · Sabroso 19. Monte runs hot the way Water does
in a real dex — it is the connective tissue of half the duals; mono-Sabroso stays
scarce on purpose (cooking is condiment, not soup). Categories: fauna 84,
urban-magical 38, folklore 28. Budgets: 56 s1 / 67 s2 / 22 s3 / 5 leg.

## 7. GATE 4 checklist (your confirmations)

1. The 12 added stages on canon lines (§1: Waraira, Florentín, Centellón, Chigüiral,
   Guacamayín/ón, Cunaguarín, Toninita, Mapanarita, Araguatico, Gliptón, Sombrerúo,
   Pavorreal) — these touch beloved canon; names especially.
2. The two new legendaries: **La Loca Luz Caraballo** (a literary-folklore figure —
   confirm she reads as folklore, not devotion) and **El Carretón**.
3. The canon-29 rebalance table (§3) and Caribazo/Bachacón/Pereza/Tigrón sitting in
   the s3 band.
4. The Sabroso block concept (food creatures as urban-magical) and El Pabellón as a
   rare 530-BST single.
5. Tren Fantasma fichable only in the post-game second ride (story resolution stays
   no-villain; the ficha is him *choosing* to ride with you).
6. Encounter statics table (§5) + Toninita/Cachorro/Cuchicuchi evolving by confianza.
7. Skim the full roster below — names are the most culturally exposed surface of
   this phase.

---

## Appendix A — Full roster

Cat.: F fauna · K folklore · U urban-magical. Etapa = budget band.

| # | Criatura | Tipos | Cat. | Etapa | BST | Región | Línea evolutiva |
|---|---|---|---|---|---|---|---|
| 1 | **Frontinito** | Tepuy | F | s1 | 320 | linea1 | → ucumari |
| 2 | **Ucumarí** | Tepuy/Monte | F | s2 | 430 | avila | → waraira |
| 3 | **Waraira** | Tepuy/Monte | F | s3 | 530 | avila | — |
| 4 | **Turpialín** | Rumba/Monte | F | s1 | 320 | linea1 | → cantaclaro |
| 5 | **Cantaclaro** | Rumba/Monte | F | s2 | 430 | linea1 | → florentin |
| 6 | **Florentín** | Rumba/Monte | F | s3 | 530 | linea1 | — |
| 7 | **Cocuyín** | Catatumbo | F | s1 | 320 | linea1 | → centella |
| 8 | **La Centella** | Catatumbo/Espanto | K | s2 | 430 | linea1 | → centellon |
| 9 | **Centellón** | Catatumbo/Espanto | K | s3 | 530 | linea1 | — |
| 10 | **Palomita** | Criollo | F | s1 | 310 | linea1 | → palomota |
| 11 | **Palomota** | Criollo/Rumba | F | s2 | 425 | linea1 | — |
| 12 | **Ratica** | Criollo | F | s1 | 300 | linea1 | → ratonante |
| 13 | **Ratonante** | Criollo/Espanto | U | s2 | 420 | linea1 | — |
| 14 | **Rabipelado** | Criollo/Espanto | F | s2 | 420 | linea1 | — |
| 15 | **Cachorro 'e Calle** | Criollo | F | s1 | 310 | linea1 | → guachiman |
| 16 | **Guachimán** | Criollo | F | s2 | 425 | linea1 | — |
| 17 | **Periquito** | Criollo/Rumba | F | s1 | 300 | linea1 | → lorochismoso |
| 18 | **Loro Chismoso** | Criollo/Rumba | F | s2 | 415 | linea1 | — |
| 19 | **Chigüi** | Caribe | F | s1 | 320 | linea1 | → chiguiron |
| 20 | **Chigüirón** | Caribe/Tepuy | F | s2 | 430 | linea1 | → chiguiral |
| 21 | **Chigüiral** | Caribe/Tepuy | F | s3 | 530 | linea1 | — |
| 22 | **Caribito** | Caribe | F | s1 | 300 | linea1 | → caribazo |
| 23 | **Caribazo** | Caribe | F | s3 | 525 | linea1 | — |
| 24 | **Guabina** | Caribe | F | s1 | 305 | linea1 | → guabinota |
| 25 | **Guabinota** | Caribe | F | s2 | 420 | linea1 | — |
| 26 | **Bachaquito** | Monte | F | s1 | 305 | linea1 | → bachacon |
| 27 | **Bachacón** | Monte/Tepuy | F | s3 | 520 | linea2 | — |
| 28 | **Cunaguarín** | Monte | F | s1 | 310 | linea1 | → cunaguaro |
| 29 | **Cunaguaro** | Monte | F | s2 | 440 | linea1 | — |
| 30 | **Pereza** | Monte/Criollo | F | s3 | 510 | superficie | — |
| 31 | **Iguanín** | Monte | F | s1 | 305 | superficie | → iguanota |
| 32 | **Iguanota** | Monte | F | s2 | 415 | superficie | — |
| 33 | **Bejuquito** | Monte | F | s1 | 310 | linea1 | → matapalo |
| 34 | **Matapalo** | Monte/Espanto | K | s3 | 520 | linea1 | — |
| 35 | **Mayita** | Monte | F | s1 | 300 | linea1 | → flordemayo |
| 36 | **Flor de Mayo** | Monte | F | s2 | 430 | linea1 | — |
| 37 | **Araguanecito** | Monte | F | s1 | 310 | linea1 | → araguanote |
| 38 | **Araguanote** | Monte/Tepuy | F | s2 | 435 | linea1 | — |
| 39 | **Guacamayín** | Rumba/Monte | F | s1 | 315 | superficie | → guacamayo |
| 40 | **Guacamayo** | Rumba/Monte | F | s2 | 425 | superficie | → guacamayon |
| 41 | **Guacamayón** | Rumba/Monte | F | s3 | 525 | superficie | — |
| 42 | **Araguatico** | Monte/Rumba | F | s1 | 315 | linea1 | → araguako |
| 43 | **Araguako** | Monte/Rumba | F | s2 | 435 | linea1 | — |
| 44 | **Cuchicuchi** | Monte/Criollo | F | s1 | 310 | linea2 | → cuchicuchon |
| 45 | **Cuchicuchón** | Monte/Criollo | F | s2 | 420 | linea2 | — |
| 46 | **Tucusito** | Monte/Catatumbo | F | s1 | 305 | superficie | → tucuson |
| 47 | **Tucusón** | Monte/Catatumbo | F | s2 | 425 | superficie | — |
| 48 | **Cardenalito** | Rumba/Catatumbo | F | s2 | 430 | superficie | — |
| 49 | **Zamurito** | Criollo/Espanto | F | s1 | 310 | linea1 | → zamuron |
| 50 | **Zamurón** | Criollo/Espanto | F | s2 | 420 | linea1 | → reyzamuro |
| 51 | **Rey Zamuro** | Criollo/Espanto | F | s3 | 520 | linea1 | — |
| 52 | **Gato Negro** | Espanto/Criollo | K | s2 | 420 | linea1 | — |
| 53 | **Mapanarita** | Monte/Espanto | F | s1 | 310 | linea1 | → mapanare |
| 54 | **Mapanare** | Monte/Espanto | F | s2 | 435 | linea1 | — |
| 55 | **Cachicamo** | Tepuy | F | s1 | 335 | linea1 | → glipton |
| 56 | **Gliptón** | Tepuy | F | s2 | 440 | linea3 | — |
| 57 | **Morrocoy** | Tepuy/Sabroso | F | s2 | 440 | linea1 | — |
| 58 | **Arepita** | Sabroso | U | s1 | 315 | linea1 | → arepon |
| 59 | **Arepón** | Sabroso | U | s2 | 425 | linea1 | → reinapepiada |
| 60 | **Reina Pepiada** | Sabroso/Criollo | U | s3 | 525 | linea1 | — |
| 61 | **Cachapín** | Sabroso/Monte | U | s1 | 305 | linea3 | → cachapon |
| 62 | **Cachapón** | Sabroso/Monte | U | s2 | 420 | linea3 | — |
| 63 | **Tequeñito** | Sabroso | U | s1 | 300 | linea1 | → tequenon |
| 64 | **Tequeñón** | Sabroso | U | s2 | 420 | linea1 | — |
| 65 | **Mangüito** | Monte/Sabroso | F | s1 | 310 | linea1 | → mangazo |
| 66 | **Mangazo** | Monte/Sabroso | F | s2 | 430 | linea1 | — |
| 67 | **Coquito** | Sabroso/Tepuy | F | s1 | 315 | linea2 | → cocotero |
| 68 | **Cocotero** | Sabroso/Tepuy | F | s2 | 430 | linea2 | — |
| 69 | **Papelonero** | Sabroso | U | s2 | 425 | linea3 | — |
| 70 | **Cafecito** | Sabroso/Catatumbo | U | s1 | 300 | linea1 | → cerreron |
| 71 | **Cerrerón** | Sabroso/Catatumbo | U | s2 | 430 | linea1 | — |
| 72 | **Guarapita** | Sabroso/Caribe | U | s2 | 415 | linea3 | — |
| 73 | **El Pabellón** | Sabroso/Criollo | U | s3 | 530 | linea3 | — |
| 74 | **Hallaquín** | Sabroso/Espanto | K | s1 | 320 | linea4 | → hallacon |
| 75 | **Hallacón** | Sabroso/Espanto | K | s2 | 435 | linea4 | — |
| 76 | **Burrito Sabanero** | Criollo/Rumba | F | s2 | 415 | linea3 | — |
| 77 | **Chicharrita** | Rumba/Monte | F | s1 | 300 | linea3 | → chicharrota |
| 78 | **Chicharrota** | Rumba/Monte | F | s2 | 420 | linea3 | — |
| 79 | **Cuatrico** | Rumba | U | s1 | 310 | linea4 | → bandolo |
| 80 | **Bandolo** | Rumba | U | s2 | 420 | linea4 | → arpaviva |
| 81 | **Arpa Viva** | Rumba | U | s3 | 520 | linea4 | — |
| 82 | **Tamborcito** | Rumba | U | s1 | 310 | metrocable_sanagustin | → tamboron |
| 83 | **Tamborón** | Rumba | U | s2 | 430 | metrocable_sanagustin | — |
| 84 | **Maraquita** | Rumba/Monte | U | s1 | 300 | linea1 | → capachon |
| 85 | **Capachón** | Rumba/Monte | U | s2 | 415 | linea1 | — |
| 86 | **Furrunguito** | Rumba/Caribe | U | s1 | 305 | linea2 | → furrucon |
| 87 | **Furrucón** | Rumba/Caribe | U | s2 | 425 | linea2 | — |
| 88 | **Paraulata** | Rumba/Criollo | F | s2 | 420 | linea3 | — |
| 89 | **Duendecito** | Espanto/Monte | K | s1 | 315 | linea1 | → sombreruo |
| 90 | **Sombrerúo** | Espanto/Monte | K | s2 | 430 | linea4 | — |
| 91 | **Pavoso** | Espanto | K | s1 | 330 | linea1 | → pavorreal |
| 92 | **Pavorreal** | Espanto | K | s2 | 440 | linea4 | — |
| 93 | **Sustico** | Espanto | K | s1 | 300 | linea1 | → suston |
| 94 | **Sustón** | Espanto | K | s2 | 420 | linea1 | — |
| 95 | **Velita** | Espanto | K | s1 | 305 | linea1 | → velorion |
| 96 | **Velorión** | Espanto | K | s2 | 425 | linea4 | — |
| 97 | **Aguaitacamino** | Espanto/Monte | F | s2 | 415 | linea2 | — |
| 98 | **Mula Maniá** | Espanto/Criollo | K | s2 | 425 | linea3 | — |
| 99 | **El Sereno** | Espanto/Criollo | K | s2 | 430 | linea1 | — |
| 100 | **El Coco** | Espanto | K | s3 | 525 | linea4 | — |
| 101 | **La Dientona** | Espanto | K | s3 | 520 | linea4 | — |
| 102 | **El Hachador** | Espanto/Monte | K | s2 | 435 | linea2 | — |
| 103 | **Toninita** | Caribe | F | s1 | 310 | linea1 | → tonina |
| 104 | **Tonina** | Caribe/Espanto | K | s2 | 435 | linea1 | — |
| 105 | **Babito** | Caribe/Monte | F | s1 | 310 | linea2 | → babote |
| 106 | **Babote** | Caribe/Monte | F | s2 | 430 | linea2 | — |
| 107 | **Sapito Lipa** | Caribe/Rumba | F | s1 | 300 | superficie | → sapoton |
| 108 | **Sapotón** | Caribe/Rumba | F | s2 | 415 | superficie | — |
| 109 | **Manatón** | Caribe | F | s2 | 435 | superficie | — |
| 110 | **Güío** | Caribe/Monte | F | s3 | 520 | linea2 | — |
| 111 | **Fuentecita** | Caribe/Rumba | U | s2 | 420 | linea1 | — |
| 112 | **Bombillito** | Catatumbo | U | s1 | 305 | linea1 | → reflectoron |
| 113 | **Reflectorón** | Catatumbo | U | s2 | 425 | linea4 | — |
| 114 | **Cablebrita** | Catatumbo | U | s1 | 305 | linea2 | → cablebra |
| 115 | **Cablebra** | Catatumbo | U | s2 | 425 | linea2 | — |
| 116 | **Pilica** | Catatumbo | U | s1 | 300 | linea2 | → plantaelectrica |
| 117 | **Planta Eléctrica** | Catatumbo | U | s2 | 430 | linea2 | — |
| 118 | **Telefonito** | Espanto/Catatumbo | U | s2 | 420 | linea1 | — |
| 119 | **Busetica** | Criollo | U | s1 | 315 | linea3 | → camioneton |
| 120 | **Camionetón** | Criollo/Catatumbo | U | s2 | 430 | linea3 | — |
| 121 | **Fichita** | Criollo/Tepuy | U | s1 | 335 | linea1 | — |
| 122 | **Maletica** | Espanto | U | s2 | 420 | linea5 | — |
| 123 | **Torrecita** | Tepuy/Criollo | U | s1 | 320 | linea4 | → torregemela |
| 124 | **Torregemela** | Tepuy/Catatumbo | U | s2 | 440 | linea4 | — |
| 125 | **Vagónima** | Espanto/Catatumbo | U | s3 | 520 | linea1 | — |
| 126 | **La Llorona** | Espanto/Caribe | K | s3 | 520 | avila | — |
| 127 | **La Sayona** | Espanto | K | s3 | 530 | linea4 | — |
| 128 | **Baquirito** | Monte | F | s1 | 310 | linea2 | → baquiron |
| 129 | **Baquirón** | Monte | F | s2 | 425 | linea2 | — |
| 130 | **Dantica** | Monte/Tepuy | F | s1 | 320 | linea2 | → dantota |
| 131 | **Dantota** | Monte/Tepuy | F | s2 | 440 | linea2 | — |
| 132 | **Hormiguerito** | Monte | F | s1 | 310 | linea2 | → palmero |
| 133 | **Palmero** | Monte | F | s2 | 435 | linea2 | — |
| 134 | **Tigrito** | Monte | F | s1 | 320 | metrocable_mariche | → tigron |
| 135 | **Tigrón** | Monte/Tepuy | F | s3 | 525 | metrocable_mariche | — |
| 136 | **Lajita** | Tepuy | F | s1 | 310 | linea2 | → lajon |
| 137 | **Lajón** | Tepuy | F | s2 | 420 | linea2 | → tepuyon |
| 138 | **Tepuyón** | Tepuy | F | s3 | 525 | losteques | — |
| 139 | **Cuarzito** | Tepuy/Catatumbo | F | s2 | 430 | losteques | — |
| 140 | **Frailejín** | Monte/Tepuy | F | s1 | 315 | losteques | → frailejon |
| 141 | **Frailejón** | Monte/Tepuy | F | s2 | 430 | losteques | — |
| 142 | **Neblinita** | Espanto/Caribe | K | s1 | 305 | avila | → neblinon |
| 143 | **Neblinón** | Espanto/Caribe | K | s2 | 425 | avila | — |
| 144 | **Condorín** | Tepuy | F | s1 | 330 | losteques | → condoron |
| 145 | **Condorón** | Tepuy/Monte | F | s3 | 530 | losteques | — |
| 146 | **La Loca Luz Caraballo** | Espanto/Tepuy | K | leg | 580 | losteques | — |
| 147 | **El Carretón** | Espanto/Criollo | K | leg | 580 | losteques | — |
| 148 | **El Silbón** | Espanto/Rumba | K | leg | 580 | linea4 | — |
| 149 | **Catatumbo** | Catatumbo/Caribe | K | leg | 600 | avila | — |
| 150 | **Tren Fantasma** | Espanto/Catatumbo | U | leg | 600 | linea5 | — |
