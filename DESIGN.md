# Metro Quest — Diseño de sistemas

Referencia de mecánicas (qué tomamos de los RPG clásicos de captura de criaturas y
cómo se llama aquí), y guía para extender el mundo sin romper nada.

## Paridad de mecánicas con los clásicos

| Mecánica clásica | En Metro Quest | Estado |
|---|---|---|
| Tipos + tabla de efectividad | 8 tipos criollos (`MQ.CHART`), x2 / x0.5 | ✅ |
| STAB (bonus por tipo propio) | x1.5 si el movimiento comparte tipo | ✅ |
| Fórmula de daño (gen 1) | `((2·nivel/5+2)·poder·ATQ/DEF)/50+2`, azar 0.85–1.0 | ✅ |
| Golpes críticos | 1/16 de probabilidad, x1.5, sacudida más fuerte | ✅ |
| Etapas de stats (±) | ATQ/DEF/VEL, −4..+4, multiplicador 2/(2−s) | ✅ |
| Precisión por movimiento | `acc`; el Silbido Lejano (acc 1000) nunca falla | ✅ |
| PP por movimiento | `pp` por movimiento; sin PP → **Forcejeo** (con retroceso) | ✅ |
| Estados alterados | **ENV** veneno (1/8 por ronda), **PAR** parálisis (VEL ÷2, 25% pierde turno), **DRM** sueño (1–3 turnos) | ✅ |
| Curación de estados | Agua de Coco, Módulo de Atención, abuela, derrota | ✅ |
| Captura | catch rate (0–255) · vida restante · ficha · **bonus de estado** (DRM x2, PAR/ENV x1.5) | ✅ |
| Huir | probabilidad por diferencia de VEL; jefes/tren bloquean | ✅ |
| 4 movimientos + olvidar | menú de olvido al aprender el quinto | ✅ |
| Evolución | por nivel al terminar combate (no al perder) | ✅ |
| Curva de XP | cúbica (`n³`), bonus x1.5 contra entrenadores | ✅ |
| Equipo de 6 + almacenamiento | el LOCKER de estación | ✅ |
| Dex visto/capturado | Cuaderno de Espantos, entrada al fichar | ✅ |
| Medallas / gimnasios | 4 Fichas Doradas de los Jefes de Estación | ✅ |
| Rival recurrente | Cheo, 3 combates, equipo que contra-pica tu inicial | ✅ |
| Legendarios / post-game | Silbón (raro), Catatumbo (post-final), Tren Fantasma (jefe) | ✅ |
| Gritos por especie | `MQ.CRIES`: chiptune por criatura, al aparecer/caer/evolucionar | ✅ |
| Intro cinematográfica | `assets/intro.webm/.mp4`, saltable (A: sonido, B: saltar) | ✅ |
| Físico/Especial separados | un solo ATQ/DEF (estilo gen 1 simplificado) | ✗ a propósito |
| Objetos equipados, habilidades, climas | — | 🔜 candidatos |

## Cómo extender el mundo

**Nueva criatura** (`js/dex.js`): agrega la especie a `MQ.SPECIES` (tipos, `base`,
`catch`, `learn`, `dex` en clave realismo mágico, `pal`+`art` de ≤16 columnas),
su grito en `MQ.CRIES`, y el id en `MQ.DEX_ORDER`. Colócala en una tabla `enc` de
algún mapa. `tests/smoke.js` valida todo lo demás (paleta, movimientos, grito).

**Nuevo movimiento**: en `MQ.MOVES` con `pow/acc/pp` y opcional `fx`
(`{heal}`, `{stage:[stat,±1,'self'|'foe']}`, `{status:'psn'|'par'|'slp', chance}`)
o `recoil`. Referencia desde algún `learn`.

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
