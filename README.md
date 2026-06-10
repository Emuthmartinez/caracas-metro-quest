# 🚇 METRO QUEST — Leyendas del Subterráneo de Caracas

Un RPG de bolsillo estilo Pokémon ambientado en el Metro de Caracas, hecho con puro
HTML5 + Canvas + JavaScript — **cero dependencias, cero instalación**. Abre el enlace
y juega, en el teléfono o en la computadora.

> *Para los que se fueron y para los que se quedaron.*

## Cómo jugar

**Opción 1 — doble clic:** abre `index.html` en cualquier navegador moderno. Listo.

**Opción 2 — servidor local:**

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

**Opción 3 — GitHub Pages:** activa Pages sobre la rama y comparte el enlace con la familia.

### Controles

| Acción | Teclado | Móvil |
|---|---|---|
| Moverse | Flechas / WASD | Cruceta |
| Aceptar / Interactuar | Z o Espacio | A |
| Cancelar | X | B |
| Menú de pausa | Enter | MENÚ |

## El juego

- Es la **hora fantasma**: pasó el último tren y los espantos del folclore venezolano
  bajaron a los túneles de la Línea 1.
- Tu abuela te da un inicial (**Arepito**, **Turpialín** o **Cocuyín**) y cinco
  **fichas del Metro del 83**: lánzaselas a los espantos salvajes para **ficharlos**.
- Camina los túneles de **Propatria a Petare**, vence a los **cuatro Jefes de Estación**
  por sus **Fichas Doradas**, pelea con tu primo **Cheo** (que volvió de visita después
  de cinco años afuera) y baja a la **Línea Fantasma** a enfrentar al **Tren Fantasma**,
  el que se lleva los recuerdos de la ciudad.
- 25 espantos para fichar, 8 tipos criollos (Sabroso, Rumba, Espanto, Catatumbo,
  Caribe, Monte, Tepuy, Criollo), combate por turnos, evoluciones, tienda de buhonero,
  el Doctorcito que cura, tren rápido entre estaciones y guardado automático en el navegador.

Toda la mitología del juego — de dónde sale cada criatura, cada estación y cada chiste —
está en **[LORE.md](LORE.md)**.

## Estructura

```
index.html        el juego (carga los scripts en orden)
css/style.css     marco retro + controles táctiles
js/core.js        entrada, texto, cajas de diálogo, menús
js/audio.js       chiptune procedural (WebAudio, sin archivos)
js/dex.js         tipos, movimientos y los 25 espantos (con su pixel art)
js/sprites.js     tiles del Metro, gente y criaturas (todo dibujado por código)
js/world.js       Línea 1 completa: estaciones, túneles, NPCs, jefes
js/battle.js      combate por turnos, fichar, experiencia, evolución
js/overworld.js   caminar, encuentros, tiendas, tren, menú de pausa
js/main.js        título, historia, guardado, final
LORE.md           la biblia del mundo
tests/smoke.js    prueba de humo (node tests/smoke.js)
```

## Pruebas

```bash
node tests/smoke.js
```

Valida la integridad de los datos (especies, movimientos, mapas, warps, conectividad a
pie de toda la red) y simula combates completos, capturas, evoluciones y los guiones de
historia de punta a punta.
