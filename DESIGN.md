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

## Audio

Todo es chiptune procedural (`js/audio.js`): pistas en `TRACKS`, efectos en `SFX`,
gritos por especie en `MQ.CRIES` (js/dex.js). `tests/record.js` graba un gameplay
real y registra cada evento de audio; `tests/render-audio.js` re-sintetiza el
soundtrack exacto para muxearlo al video (la captura headless no trae audio).
