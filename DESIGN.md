# Metro Quest — Diseño de sistemas

Referencia de mecánicas (qué tomamos de los RPG clásicos de captura de criaturas y
cómo se llama aquí), y guía para extender el mundo sin romper nada.

## Paridad de mecánicas con los clásicos

| Mecánica clásica | En Metro Quest | Estado |
|---|---|---|
| Tipos + tabla de efectividad | 8 tipos criollos (`MQ.CHART`), x2 / x0.5 | ✅ |
| STAB (bonus por tipo propio) | x1.5 si el movimiento comparte tipo | ✅ |
| Fórmula de daño (Gen 3) | `((2·nivel/5+2)·poder·A/D)/50+2` con A/D **físico o especial según el tipo** (spec §2.2), azar 0.85–1.0 | ✅ |
| Físico/Especial separados | por tipo, estilo Gen 3 (GATE 0/Q3B): Criollo/Sabroso/Monte/Tepuy físicos; Rumba/Espanto/Catatumbo/Caribe especiales | ✅ |
| Seis estadísticas + IVs/EVs/naturalezas | PS/ATQ/DEF/A.E/D.E/VEL con fórmula Gen 3 textual; **la chispa** (IVs 0–31), **la calle** (EVs 510/252, vitaminas +10), 25 naturalezas criollas ±10% | ✅ |
| Golpes críticos | etapas Gen 3 (1/16→1/2 con Afinación/Estampa), x1.5 canon, ignora etapas adversas | ✅ |
| Etapas de stats (±) | ATQ/DEF/A.E/D.E/VEL/PUN/EVA, −6..+6 (Gen 3) | ✅ |
| Precisión por movimiento | `acc` (null = no falla jamás), etapas de puntería/evasión, clima y habilidades la modifican | ✅ |
| PP por movimiento | `pp` por movimiento; sin PP → **Forcejeo** (con retroceso); Presencia Pesada cobra doble | ✅ |
| Estados alterados | **ENV** veneno · **ENV+** veneno de mapanare (escala) · **PAR** parálisis · **DRM** sueño · **QUE** quemado (mitad de daño físico) · **PAV** empavado (lo cura un golpe de Rumba) · **MAREO** (volátil, 1–4 rondas) | ✅ |
| Curación de estados | Agua de Coco, Sancocho, frutas equipadas, Módulo, abuela, derrota | ✅ |
| Captura | **fórmula Gen 3 exacta** (spec §1.5) con 4 chequeos de tambaleo; 6 fichas: Metro x1 · Feria x1.5 · Dorada x2 · Rayada x3 con estado · Madrugadora x4 en oscuridad · de Oro garantizada | ✅ |
| Habilidades | 41 habilidades criollas (spec §2.8): Mala Cara, Estática, Concha Dura, Echao Pa'lante, Flojera, Pararrayos, Espíritu Errante... | ✅ |
| Objetos equipados | 22 + frutas (spec §2.9): Tajada de Plátano, Garra de Cunaguaro, Morocota, potenciadores por tipo, frutas que auto-curan | ✅ |
| Clima de combate | 5 condiciones criollas (spec §2.4): palo de agua, sol de esquina, neblina del Ávila, apagón, hora pico | ✅ |
| Efectos de movimiento | taxonomía completa §2.7: multigolpe, drenaje, retroceso, amedrentar, carga/semi-invulnerable, restearse/aguantar, contragolpes, trampas, cardonal, velorio, enredadera, Voz del Andén... | ✅ |
| Huir | fórmula Gen 3 (`VEL·128/VEL_rival + 30·intentos`); trampas y jefes bloquean | ✅ |
| 4 movimientos + olvidar | menú de olvido al aprender el quinto | ✅ |
| Evolución | por nivel o por **confianza** al terminar combate (no al perder) | ✅ |
| Curva de XP | 4 grupos cúbicos (rápido 0.8n³ · parejo n³ · pausado 1.15n³ · lento 1.3n³); bonus x1.5 entrenadores, Huevo de Guacharaca x1.5 | ✅ |
| Equipo de 6 + almacenamiento | el LOCKER de estación | ✅ |
| Dex visto/capturado | Cuaderno de Espantos, entrada al fichar; **150 especies** (data/creatures) | ✅ |
| Medallas / gimnasios | 4 Fichas Doradas de los Jefes de Estación (→ 8 con la expansión de red) | ✅ |
| Rival recurrente | Cheo, 3 combates, equipo que contra-pica tu inicial | ✅ |
| Línea de vista de entrenadores | el ¡! del andén: te ven a 4 casillas por donde miran (paredes y gente bloquean), caminan hasta ti y te retan; los Jefes esperan en su puesto | ✅ |
| Vigilantes que giran (spinners) | Jeison, Petra y Don Emiliano barren el túnel con la mirada cada tanto — quieto también te encuentran | ✅ |
| Ítems en el piso (Poké Balls tiradas) | 16 paqueticos sólidos regados por túneles, superficie, Línea Fantasma y Metrocable; se recogen una vez (la morocota del parque es la pepita) | ✅ |
| Ítems ocultos + Itemfinder | 10 escondites sin brillo (pilares, rincones, el safari); el Rastreador del Zahorí de Bello Monte vibra hacia el más cercano | ✅ |
| Tema de \"la mirada se cruza\" | pista `reto`: suena del ¡! hasta que arranca el combate (también al retar tú a un entrenador) | ✅ |
| Trainer Card | el Carnet del Pasajero (pausa → CARNET): foto, bolos, tiempo de viaje, troqueles de las 8 Fichas, cuenta del Cuaderno | ✅ |
| Running Shoes (B para correr) | las Cholas del Maratonista de Propatria: sostén B y trota (la patineta sigue siendo más rápida) | ✅ |
| Whiteout | irse en blanco cuesta la mitad de los bolos, como en FireRed | ✅ |
| Secuencia de retador | la figura del entrenador abre el combate ("¡te reta!"), se retira al sacar su espanto y vuelve a dar la cara vencido | ✅ |
| Transición al combate | iris que se cierra sobre el jugador en combates pactados (el destello clásico queda para los salvajes) | ✅ |
| Texto máquina de escribir | las cajas revelan letra a letra; A completa la página; velocidad en AJUSTES (LENTO/MEDIO/RÁPIDO) | ✅ |
| Estilo de combate SHIFT/SET | CAMBIO (avisa el relevo rival y ofrece cambio gratis) o SEGUIDO, en AJUSTES; se guarda con la partida | ✅ |
| Menú de opciones | AJUSTES en pausa: velocidad de texto, estilo de combate, sonido | ✅ |
| Gym guide | el Fanático: el mismo hincha en las 8 estaciones de Jefe — sopla el dato del equipo rival y celebra tu victoria | ✅ |
| Experiencia por participación + Exp Share | los que pelearon contra el rival de turno se reparten la EXP (Gen 3); la Media Arepa de la Panadera le pasa la mitad al de la banca (calle y confianza incluidas) | ✅ |
| Tutorial de captura (Old Man) | el Viejo del Andén en Caño Amarillo: demostración completa — baja la vida, lanza su ficha, ficha y suelta; nada queda en tu mochila ni tu Cuaderno | ✅ |
| Legendarios / post-game | Silbón (raro), Catatumbo (post-final), Tren Fantasma (jefe) | ✅ |
| Gritos por especie | `MQ.CRIES`: chiptune por criatura (29 afinados a mano + 121 generados por motivo) | ✅ |
| Tornasol (shiny) | 1/4096 (probabilidad moderna, spec §1.4), paleta franja-naranja | ✅ |
| Repelentes / esencias | Esencia de Azabache (100/200/300 pasos) | ✅ |
| Intro cinematográfica | `assets/intro.webm/.mp4`, saltable (A: sonido, B: saltar) | ✅ |
| Red completa (Líneas 2–6, superficie, Ávila, Metrocables, Los Teques) | 88 mapas del world bible generados de data/maps (js/world2.js), tren multi-línea, mapa de red en pausa | ✅ |
| 8 medallas + Liga | Jefes 5–8 + el Consejo de la Hora Fantasma + Cheo final (js/world3.js) | ✅ |
| Oficios (HMs) | 6 tutores con bandera de reja + movimiento de campo | ✅ |
| Casetes (TMs) | 8 casetes de un solo uso con menú de olvido | ✅ |
| Recordadora / borrador / name rater | la Coplera · el Olvidadizo · el Padrino | ✅ |
| Vs Seeker / pesca / bici / safari / guardería | el Bíper · 3 anzuelos · la Patineta · safari de 500 pasos · la Tía que Cuida | ✅ |
| Premios del dex | el Cronista: 50/100 (Tornasol Bendito 1/1365)/150 fichados | ✅ |
| Post-game | La Torre, el Carretón errante, estáticos legendarios, Cheo semanal | ✅ |
| Música por región | 6 pistas nuevas (oeste, sur, teatros, Ávila, cable, páramo) | ✅ |
| Localización EN | entradas del Cuaderno ES+EN (MENÚ alterna); UI en español por canon (Q12A) | ✅ parcial |

## Cómo extender el mundo

**Nueva criatura** (`data/creatures/creatures.json`): agrega la especie con el
esquema del bestiario (tipos, `base` de 6 stats, `catch`, `exp_group`, `gender`,
`abilities`, `ev_yield`, `learnset`, `evolves_to`, `dex_es/dex_en`), corre
`python3 scripts/validate_bestiario.py` y `python3 scripts/build_gamedata.py`
(regenera `js/gamedata.js`). El grito y la silueta de respaldo se generan solos;
un grito afinado a mano puede ir en `js/art.js` (`MQ.CRIES_CANON`). Colócala en
una tabla de `data/encounters/encounters.json`. `tests/smoke.js` valida el resto.

**Nuevo movimiento**: en `data/moves/moves.json` con el esquema del spec §2.7
(`power/accuracy/pp/priority/contact/category` + `effects[]` de la taxonomía:
`status`, `stage`, `heal`, `drain`, `recoil`, `multi`, `flinch`, `crit`,
`weather`, `trap`, `hazard`, `charge`, `protect`, `endure`, `counter`,
`recharge`, `switch`, `noescape`, `money`, `curse`, `leech`, `cantmiss-under`).
Regenera `js/gamedata.js` y referencia el id desde algún `learnset`.

**Nuevo mapa**: en `js/world.js` usa los constructores `station(...)` / `tunnel(...)`
o un grid a mano. Conecta con `warps` (el smoke test verifica ida/vuelta, ancho de
filas y que todo sea alcanzable a pie desde `casa`). Agrega NPCs (`text`, `trainer`
o `script`), encuentros (`enc`) y la parada en `MQ.TRAIN_STOPS` si es estación.

**Nuevo guion**: en `MQ.SCRIPTS` (js/main.js) devuelve una lista de pasos
(`say`, `battle`, `choice`, `give`, `flag`, `healParty`, `warpTo`, `ending`...).

**Ideas listas para crecer**: Línea 2 (El Silencio—Zoológico, con el Zoológico de
Caricuao como "safari"), el Ávila como zona montañosa a cielo abierto, el teleférico,
hora del día (la hora fantasma vs. el amanecer), intercambios con NPCs (la economía
del trueque criollo), y los espantos regionales que faltan: el Ánima Sola, María
Lionza completa, el Carretón.

## Los detalles de las 11 estrellas

Los toques sutiles de los clásicos de Game Boy, cruzados con el realismo mágico
caraqueño. La regla: cada transición tiene su sonido, cada lugar su música, y lo
imposible ocurre sin que nadie lo comente.

| Detalle | Dónde vive |
|---|---|
| El **shoop** de la puerta + fundido a negro en cada warp | `overworld` (`fade`, sfx `door`) |
| Destello de pantalla antes del combate salvaje, con la música arrancando antes | `encFlash` |
| **Ceremonia del tren**: las luces parpadean dos veces (la seña de Yorbi), el tren entra frenando, campanita, puertas que se abren, te montas, viajas, te bajas y el tren sigue su ruta | `RideScene` |
| Barras de PS que se **vacían poco a poco** | `_disp` en battle |
| **Alarma de PS bajos** (el pitido de urgencia) | sfx `lowhp` |
| Fanfarria de victoria salvaje · jingle de guardado · campanita del vagón | sfx `victory`/`save`/`doors` |
| Música propia por ambiente: estación, **calle** (sol de esquina), túnel, Línea Fantasma, combate, jefe, gaita de victoria | `TRACKS` |
| Topetazo al caminar contra la pared | sfx `bump` |
| Los NPC **miran alrededor** cada tanto, como gente de verdad | `update()` |
| **Mariposas amarillas** que cruzan los andenes y nadie pregunta de dónde vienen | `motes` |
| El jugador: gorra con visera direccional, **morral verde visto de espaldas**, brazos que se mecen al caminar y postura simétrica en reposo | `drawPerson` |
| El inicial **se baja de la mesa** al elegirlo, con su grito | `took_<id>` |
| Cada criatura con su **grito** al aparecer, caer y evolucionar | `MQ.CRIES` |
| **Discos de andén** (las "bases" clásicas) bajo cada combatiente, con su franja naranja, sombra y cabeceo en reposo | `battle` (`base`, `combatant`, `shadow`) |
| **Ceremonia de la ficha**: la ficha vuela en arco, el espanto se encoge en blanco hacia adentro, la ficha cae, tambalea según lo cerca que estuvo y se queda quieta con estrellitas — o revienta y el espanto sale de vuelta | `BattleScene.tickCapture` / `drawCapture` |
| El espanto **se desliza y se desvanece** al debilitarse | `anim.efall`/`anim.mfall` |
| **Sombra a los pies** de cada persona del andén | `drawPerson` |

## Audio

Todo es chiptune procedural (`js/audio.js`): pistas en `TRACKS`, efectos en `SFX`,
gritos por especie en `MQ.CRIES` (js/dex.js). `tests/record.js` graba un gameplay
real y registra cada evento de audio; `tests/render-audio.js` re-sintetiza el
soundtrack exacto para muxearlo al video (la captura headless no trae audio).
