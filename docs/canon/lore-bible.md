# Metro Quest: Caracas — Lore Bible (Canon v1, pre-GATE 0)

> *Para los que se fueron y para los que se quedaron.*
> *Caracas no se olvida: Caracas se lleva.*

**Status:** Draft for GATE 0 review. Once approved, this document is frozen canon;
changes require explicit amendment recorded in the amendment log at the bottom.

**Sources ingested:** `LORE.md` (la biblia del mundo), `DESIGN.md` (systems reference),
`README.md`, and the shipped game data in `js/dex.js`, `js/world.js`, `js/main.js`.
Note: `/docs/lore/` and `/docs/worldbuilding/` did not exist in the repository at
ingestion time; the root documents above are the entire written canon. If additional
lore docs or Notion pages exist, they must be ingested and this bible amended before
GATE 0 closes.

---

## 1. Premise and history

- **1983.** The Caracas Metro opens — *«La Gran Solución para Caracas»* — and the
  tunnel-boring machines pass where they should not have: **underneath the memory of
  the city**.
- **La Hora Fantasma.** Ever since, when the last train passes, the espantos of all
  Venezuela — from the llano, the mountains, the lake, the market — come down into
  the tunnels to warm themselves beside the rails. The entire current game takes
  place during the Hora Fantasma.
- **El Tren Fantasma.** The first train of 1983 never reached its destination. The
  city forgot it by accident, and in Caracas, what is forgotten does not die: **it
  builds its own station**. The Tren Fantasma runs the unfinished Línea 5 (la "Línea
  Fantasma" — a real monument to broken promises), collecting the memories people
  leave behind when they emigrate. Each pass, the city wakes with fewer memories —
  and the diaspora with fewer dreams.
- **The player's call to adventure.** Your grandmother gives you three things: a
  companion creature, five **fichas del Metro del 83**, and a mission.

## 2. Laws of the magic system (rules, not vibes)

1. **Magical realism is the house rule.** Real Venezuelan fauna coexists with
   folkloric espantos and *nobody in Caracas raises an eyebrow*. The bear asks the
   time, the tonina swims through tunnel air, the rabipelado returns from his own
   wake — and the city gives them a seat. The impossible happens uncommented.
2. **Forgetting creates; memory anchors.** What Caracas forgets does not die — it
   makes its own place (the Tren Fantasma, the Línea Fantasma). Memory is the
   game's metaphysical currency.
3. **Fichar, not capture.** You don't capture an espanto; you throw it a 1983 Metro
   token and **it decides whether to accept you**. Acceptance, not subjugation.
   *Quedó fichado* — known in the neighborhood.
4. **Espantos are repelled or soothed by culture, not violence.** *"A los espantos
   no se les grita: se les canta, se les cocina o se les aguanta el carácter. Como a
   la familia."* (La Abuela's golden rule). This is why Rumba beats Espanto: un buen
   joropo espanta al espanto.
5. **The sacred is not gameplay.** Folkloric *espantos* can be befriended and
   battled; figures of living faith cannot. María Lionza and el Doctorcito are never
   fichados and never fought — they bless and heal. *El folclore espanta, la fe
   acompaña.*
6. **There is no villain.** The Tren Fantasma is the guardian of what the emigrants
   left behind, and it can no longer manage alone. "Defeating" it means helping it
   deliver memories *de ida y de vuelta, como debe ser*.

## 3. Tone guidelines

- **Diaspora-first emotional register:** nostalgia with a knot in the throat, jokes
  the whole family shares (el apagón, la cola, the 4 PM guacamayas), never bitterness.
- **Zero partisan politics.** The game is *una mesa servida, no una discusión*.
- **Venezuelan Spanish without subtitles or apologies.** The game sounds like home:
  chamo, pana, vale, naguará, qué molleja (evolution is announced in zuliano, por
  respeto).
- **Folklore handled as living heritage**, with affection — sustos come from the
  shared childhood canon (La Sayona's question, el Silbón's whistle), never gore or
  horror-prop treatment.
- **The Ávila is always north.** It appears on the title screen because *sin Ávila
  no hay norte*.

## 4. Capture items (canon)

| Item | Canon |
|---|---|
| **Ficha del Metro** | The common yellow 1983 token — the ones grandmothers kept in compota jars when the card replaced them. |
| **Ficha Dorada** | Commemorative, polished with Brasso. Espantos respect it more. |
| **Ficha de Oro** | Blessed on the mountain of Sorte (María Lionza). Never fails. |
| **Fichas Doradas de Jefe** (x4) | The "badges": del Centro, de la Fuente, del Este, del Pueblo. Held by the Jefes de Estación. |

## 5. The eight types and the effectiveness chart

| Type | Cultural root |
|---|---|
| **Criollo** | The everyday: the rush-hour shove, mom's scolding. |
| **Sabroso** | Venezuelan cooking as a force of nature. El arepazo cura el alma. |
| **Rumba** | Music: joropo, gaita, tambor de San Juan. |
| **Espanto** | The apparitions of folklore: sustos, mal de ojo, la pava. |
| **Catatumbo** | The eternal lightning of Lake Maracaibo. Electricity with denomination of origin. |
| **Caribe** | Water… and the piranha. In Venezuela, "caribe" bites. |
| **Monte** | The bush that swallows anything left still for six months. |
| **Tepuy** | The oldest stone on the planet. Pemón ancestral: la Gran Sabana, la piedra Kueka. |

Exact chart (attacker → defender multiplier; unlisted = ×1), as shipped in
`js/dex.js` (`MQ.CHART`):

| Atk \ Def | Criollo | Sabroso | Rumba | Espanto | Catatumbo | Caribe | Monte | Tepuy |
|---|---|---|---|---|---|---|---|---|
| **Criollo** | – | – | – | – | – | – | – | ×0.5 |
| **Sabroso** | ×2 | – | – | ×0.5 | – | ×0.5 | – | – |
| **Rumba** | – | – | ×0.5 | ×2 | – | – | – | ×0.5 |
| **Espanto** | ×2 | – | ×0.5 | – | – | – | – | ×0.5 |
| **Catatumbo** | – | – | ×2 | – | – | ×2 | – | ×0.5 |
| **Caribe** | – | – | – | – | ×0.5 | ×0.5 | ×0.5 | ×2 |
| **Monte** | – | ×0.5 | – | ×0.5 | – | ×2 | ×0.5 | ×2 |
| **Tepuy** | – | – | – | ×2 | ×2 | ×0.5 | ×0.5 | – |

**Starter triangle (canon):** Frontinito (Tepuy) beats Cocuyín (Catatumbo) beats
Turpialín (Rumba/Monte) beats Frontinito. *La piedra aterriza al rayo, el rayo calla
la canción, la raíz parte la piedra.*

## 6. El Cuaderno de Espantos — the 29 canon creatures

Every creature has its synthesized cry (`MQ.CRIES`). Names, types, and lore hooks
are frozen canon.

| # | Name | Types | Canon hook |
|---|---|---|---|
| 1 | **Frontinito** | Tepuy | Starter. Spectacled-bear cub, real neighbor of the Ávila; came down one foggy night and stayed because the coffee smells better here. |
| 2 | **Ucumarí** | Tepuy/Monte | Adult oso frontino, secret doorman of the Ávila. "Ucumarí" is its ancestral Andean name. |
| 3 | **Turpialín** | Rumba/Monte | Starter. The national bird, chiquito y arrecho. |
| 4 | **Cantaclaro** | Rumba/Monte | The coplero turpial with a hat. Homage to Rómulo Gallegos's *Cantaclaro* and Florentino, who out-sang the Devil. |
| 5 | **Cocuyín** | Catatumbo | Starter. A cocuyo that swallowed a high-tension cable. |
| 6 | **La Centella** | Catatumbo/Espanto | The fireball that chases travelers across the sabana; classic llanero espanto. |
| 7 | **Chigüi** | Caribe | Capybara. The Vatican ruled it counts as fish during Semana Santa: real fact, eternal meme. |
| 8 | **Chigüirón** | Caribe/Tepuy | Ancestral chigüire with a back of stone. |
| 9 | **Cunaguaro** | Monte | The Venezuelan ocelot. Hunts the tunnels at night, counts pigeons at El Calvario: counting is also hunting, but more elegant. |
| 10 | **Pereza** | Monte/Criollo | Arrived at El Calvario in 1987 by power line; still in the same tree, waiting for the city to slow down. |
| 11 | **Rabipelado** | Criollo/Espanto | Played dead so well they held his wake, coffee included; came back on day three for the mango teticas. Half animal, half aparecido. |
| 12 | **Guacamayo** | Rumba/Monte | The guacamayas of Caracas, collecting their seed on balconies at 4 PM sharp. Emotional patrimony of the city. |
| 13 | **Caribito** | Caribe | Piranha fry. |
| 14 | **Caribazo** | Caribe | The only thing that survived the Guaire. Respect. |
| 15 | **Araguako** | Monte/Rumba | Howler monkey. Audible at 5 km, like your aunt. |
| 16 | **Tonina** | Caribe/Espanto | Orinoco pink dolphin; a water-main burst brought her to tunnel 4 and she swims the air as if the river were still there. The *encantado* legend: at parties she dresses as people — don't look at the feet. |
| 17 | **Bachaquito** | Monte | Leafcutter ant carrying 50× its weight. |
| 18 | **Bachacón** | Monte/Tepuy | Legendary bachaco culón. |
| 19 | **Cachicamo** | Tepuy | "Cachicamo trabaja pa' lapa," says the refrán. This one went independent. |
| 20 | **Morrocoy** | Tepuy/Sabroso | Called the cachicamo *conchudo* (the full refrán). Lives in a patio since 1974. |
| 21 | **Mapanare** | Monte/Espanto | "Más peligrosa que mapanare en bolsillo de liqui-liqui." |
| 22 | **Duendecito** | Espanto/Monte | Hides left sandals. Only the left ones. |
| 23 | **Pavoso** | Espanto | La pava incarnate. Don't touch it, don't name it. |
| 24 | **Vagónima** | Espanto/Catatumbo | The car that left Propatria in 1987 and never reached Palo Verde. |
| 25 | **La Llorona** | Espanto/Caribe | Weeps along the Ávila ravines; in the tunnel she's mistaken for the train brakes. |
| 26 | **La Sayona** | Espanto | Appears beautiful on the platform and asks about your love life. Answer honestly. |
| 27 | **El Silbón** | Espanto/Rumba | Legendary. Sack of bones; if the whistle sounds far, it's near. Its signature move (*Silbido Lejano*) never misses. |
| 28 | **Catatumbo** | Catatumbo/Caribe | Legendary, post-game. The eternal lightning came down to Caracas to see what the corre-corre was about. |
| 29 | **Tren Fantasma** | Espanto/Catatumbo | Final boss. Not a villain: the guardian of what the emigrants left behind, and it can no longer manage alone. |

**Canon evolution lines:** Frontinito→Ucumarí (lvl 16); Turpialín→Cantaclaro;
Cocuyín→La Centella; Chigüi→Chigüirón; Caribito→Caribazo; Bachaquito→Bachacón.
(Exact levels per `js/dex.js`.)

## 7. The people of the subterráneo (canon characters)

- **La Abuela** — gives you your starter, your fichas, and the golden rule (§2.4).
- **Cheo, tu primo** — the rival. Emigrated five years ago, back visiting. Fights
  you three times, each closer to saying what he really means: *"si el Tren se lleva
  los recuerdos, ¿con qué sueño yo allá?"* He wears a Magallanes cap; you wear
  Caracas. La rivalidad eterna, en familia.
- **El Doctorcito** — the healer of the Módulos de Atención. Black hat, mustache,
  warm hands, never charges. No Venezuelan needs his name said. (Sacred: see §2.5.)
- **María Lionza, la Reina** — guardian of the Línea Fantasma. Not fichada, not
  fought: you ask her blessing. She gives the Ficha de Oro, the way her statue
  accompanies you on the autopista. (Sacred: see §2.5.)
- **The four Jefes de Estación** (badge holders):
  1. **Doña Bárbara** — Capitolio, Espanto. Gallegos's llano matriarch, relocated: "el llano me quedó chiquito, ahora administro el centro."
  2. **El Rumbero Mayor** — Plaza Venezuela, Rumba. Conducts the fountain's orchestra.
  3. **Valentina la Sifrina** — Chacaíto, imported/mixed team. "Te lo juro por mi visa."
  4. **Doña Petra del Mercado** — Petare, Tepuy/Sabroso. The hardest: "la Ficha del Pueblo no se regala: se suda."

## 8. Named locations (canon geography)

**The route (Línea 1, west → east):** Casa de la Abuela → Propatria → Caño Amarillo
(with El Calvario and its monte) → Capitolio → Bellas Artes → Plaza Venezuela (the
fountain of 16 million colors; the locked gate of Línea 5) → Sabana Grande (boulevard
chess) → Chacaíto → Altamira → Petare (the market) → Zona Rental → **La Línea
Fantasma**.

Other canon landmarks: **El Ávila** (title screen, Llorona's ravines, Cota Mil,
Ucumarí's domain), **el Guaire** (Caribazo survived it; Crecida del Guaire poisons),
**la montaña de Sorte** (blesses the Ficha de Oro), **la UCV** (Patrimonio de la
Humanidad), the Metro's **franja naranja** and platform voice: *«Próxima estación…
Recuerde: deje salir antes de entrar.»*

**Station anatomy (every station):** Módulo de Atención (healing), the buhonero
(*"¡lleve lleve!"*), and the platform edge where the hora-fantasma train takes you to
any visited station. Between stations you walk the tunnels; wild espantos glow in the
**zonas oscuras**.

## 9. Established mechanical canon (as shipped)

These are decisions already made and shipped; Phase 1's parity spec must treat them
as canon defaults (changes = flagged amendments):

- **Damage:** Gen-1 formula `((2·level/5+2)·power·ATK/DEF)/50+2`, random 0.85–1.0;
  STAB ×1.5; crits 1/16 at ×1.5.
- **Stats:** four — HP/ATK/DEF/SPD. The physical/special split was rejected *on
  purpose* in `DESIGN.md` ("estilo gen 1 simplificado — ✗ a propósito").
- **Stat stages:** −4..+4, multiplier `2/(2−s)`; accuracy per move (Silbido Lejano
  acc 1000 = never misses); PP per move; out of PP → **Forcejeo** (recoil).
- **Status conditions (3):** ENV veneno (1/8 per round), PAR parálisis (SPD ÷2, 25%
  skip), DRM sueño (1–3 turns). Cured by Agua de Coco, Módulo de Atención, la
  abuela, or fainting.
- **Capture:** catch rate 0–255 · remaining HP · ficha tier · status bonus (DRM ×2,
  PAR/ENV ×1.5).
- **Moves:** ~45 shipped moves in `MQ.MOVES` (Trancazo, Arepazo, Joropo Recio, Alma
  Llanera, Silbido Lejano, Bajón de Luz, Tercer Riel, Crecida del Guaire, Flor de
  Araguaney, Piedra Kueka, Derrumbe del Ávila…). All names/types are canon.
- **Party of 6 + LOCKER** storage at stations; **Cuaderno de Espantos** dex with
  seen/fichado; XP curve cubic (n³), ×1.5 vs trainers; evolution by level at battle
  end (never on a loss); 4 moves + forget menu.
- **Economy:** **bolos**; healing items are food canon — Maltín frío, marroncito,
  golfeado con queso de mano, cocada, Agua de Coco.
- **Audio:** all procedural chiptune (`js/audio.js`); per-species cries; per-ambient
  tracks (station, street, tunnel, Línea Fantasma, battle, boss, victory gaita).
- **Apertura:** cinematic intro (`assets/intro.webm/.mp4`), skippable.
- **Save:** automatic, in browser.

## 10. Design principles inherited from canon

1. **Web, zero dependencies** — a gift for the diaspora must open from a link on a
   tía's phone in Madrid. HTML + Canvas + pure JS; works double-clicking `index.html`.
2. **Spanish first, Venezuelan, unapologetic.**
3. **No partisan politics; shared jokes only.**
4. **The sacred blesses, never battles.**
5. **The ending has no villain.**

## 11. Amendment log

| Date | Amendment | Approved by |
|---|---|---|
| — | (none — pre-GATE 0 draft) | — |
