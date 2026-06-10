// Prueba de humo: carga el juego en Node con stubs de DOM y valida datos + lógica.
// Uso: node tests/smoke.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let failures = 0;
const ok = (cond, msg) => {
  if (!cond) { failures++; console.error('  ✗ ' + msg); }
};
const section = (s) => console.log('— ' + s);

// ---- stubs de navegador ----
const ctxStub = new Proxy({
  measureText: (t) => ({ width: String(t).length * 4.8 }),
  createLinearGradient: () => ({ addColorStop() {} }),
  createRadialGradient: () => ({ addColorStop() {} }),
}, { get(t, k) { return k in t ? t[k] : () => {}; }, set() { return true; } });

const sandbox = {
  console, Math, JSON, performance: { now: () => Date.now() },
  setTimeout, clearTimeout,
  addEventListener: () => {},
  window: {},
  localStorage: { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = v; } },
  document: { getElementById: () => null, querySelectorAll: () => [] },
  prompt: () => 'Tester',
  requestAnimationFrame: () => {},
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

for (const f of ['core.js', 'audio.js', 'dex.js', 'sprites.js', 'world.js', 'battle.js', 'overworld.js', 'main.js']) {
  const code = fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8');
  vm.runInContext(code, sandbox, { filename: f });
}
const MQ = sandbox.MQ;
MQ.ctx = ctxStub;
ok(MQ && MQ.SPECIES && MQ.MAPS, 'MQ cargó con especies y mapas');

// ---- 1. integridad del dex ----
section('Dex');
ok(MQ.DEX_ORDER.length === Object.keys(MQ.SPECIES).length, 'DEX_ORDER cubre todas las especies');
for (const id of MQ.DEX_ORDER) {
  const sp = MQ.SPECIES[id];
  ok(sp, `especie ${id} existe`);
  ok(sp.types.every((t) => MQ.TYPES[t]), `${id}: tipos válidos (${sp.types})`);
  ok(sp.learn.length > 0, `${id}: tiene movimientos`);
  for (const [lvl, mv] of sp.learn) ok(MQ.MOVES[mv], `${id}: movimiento ${mv} existe`);
  ok(sp.learn.some(([l]) => l === 1), `${id}: tiene movimiento de nivel 1`);
  if (sp.evolve) ok(MQ.SPECIES[sp.evolve.to], `${id}: evolución ${sp.evolve.to} existe`);
  ok(sp.dex && sp.dex.length > 20, `${id}: tiene entrada de dex`);
  ok(sp.catch > 0 && sp.catch <= 255, `${id}: catch rate válido`);
  // arte: todos los caracteres en paleta
  for (const row of sp.art) {
    ok(row.length <= 17, `${id}: fila de arte <= 17 chars (${row.length})`);
    for (const ch of row) if (ch !== '.') ok(sp.pal[ch], `${id}: color '${ch}' en paleta`);
  }
}
for (const [id, mv] of Object.entries(MQ.MOVES)) {
  ok(MQ.TYPES[mv.type], `mov ${id}: tipo válido`);
  ok(mv.pow > 0 || mv.fx, `mov ${id}: tiene poder o efecto`);
}
for (const [atk, row] of Object.entries(MQ.CHART))
  for (const def of Object.keys(row)) ok(MQ.TYPES[def], `tabla de tipos: ${atk}->${def} válido`);

// ---- 2. integridad del mundo ----
section('Mundo');
const walk = (m, x, y) => {
  const g = MQ.MAPS[m].grid;
  return y >= 0 && y < g.length && x >= 0 && x < g[y].length && MQ.WALKABLE.has(g[y][x]);
};
for (const [mid, m] of Object.entries(MQ.MAPS)) {
  ok(m.grid.every((r) => typeof r === 'string'), `${mid}: grid de strings`);
  const w0 = m.grid[0].length;
  ok(m.grid.every((r) => r.length === w0), `${mid}: filas de ancho uniforme (${m.grid.map((r) => r.length).join(',')})`);
  for (const w of m.warps || []) {
    ok(MQ.MAPS[w.to], `${mid}: warp hacia ${w.to} existe`);
    ok(MQ.WALKABLE.has(m.grid[w.y][w.x]), `${mid}: tile de warp (${w.x},${w.y}) es caminable`);
    ok(walk(w.to, w.tx, w.ty), `${mid}: destino ${w.to}(${w.tx},${w.ty}) caminable [tile='${MQ.MAPS[w.to].grid[w.ty] && MQ.MAPS[w.to].grid[w.ty][w.tx]}']`);
    // el destino no debe ser otro warp (rebote infinito)
    const back = (MQ.MAPS[w.to].warps || []).find((b) => b.x === w.tx && b.y === w.ty);
    ok(!back, `${mid}: destino ${w.to}(${w.tx},${w.ty}) no cae sobre otro warp`);
  }
  for (const n of m.npcs || []) {
    const ch = m.grid[n.y] && m.grid[n.y][n.x];
    ok(ch !== undefined && ch !== '#' && ch !== 'T', `${mid}: NPC ${n.name || n.mon} en tile válido (${n.x},${n.y})='${ch}'`);
    if (n.script) ok(MQ.SCRIPTS[n.script], `${mid}: script '${n.script}' existe`);
    if (n.look) ok(MQ.LOOKS[n.look], `${mid}: look '${n.look}' existe`);
    if (n.mon) ok(MQ.SPECIES[n.mon], `${mid}: NPC-espanto '${n.mon}' existe`);
    if (n.trainer) {
      for (const [sid, lvl] of n.trainer.team) {
        ok(MQ.SPECIES[sid], `${mid}: trainer ${n.trainer.id} usa especie válida ${sid}`);
        ok(lvl >= 1 && lvl <= 60, `${mid}: trainer ${n.trainer.id} nivel razonable`);
      }
    }
  }
  for (const t of m.triggers || []) {
    ok(MQ.SCRIPTS[t.script], `${mid}: trigger script '${t.script}' existe`);
    ok(walk(mid, t.x, t.y), `${mid}: trigger en tile caminable (${t.x},${t.y})`);
  }
  if (m.enc) for (const e of m.enc.mons) ok(MQ.SPECIES[e[0]], `${mid}: encuentro ${e[0]} existe`);
  if (m.shopStock) for (const it of m.shopStock) ok(MQ.ITEMS[it], `${mid}: ítem de tienda ${it} existe`);
}
for (const s of MQ.TRAIN_STOPS) ok(MQ.MAPS[s] && MQ.MAPS[s].station, `parada de tren ${s} es estación`);

// conectividad: BFS desde casa debe alcanzar todas las estaciones y la línea fantasma
{
  const seen = new Set(['casa']);
  const q = ['casa'];
  while (q.length) {
    const m = MQ.MAPS[q.shift()];
    for (const w of m.warps || []) if (!seen.has(w.to)) { seen.add(w.to); q.push(w.to); }
  }
  for (const mid of Object.keys(MQ.MAPS)) ok(seen.has(mid), `mapa ${mid} alcanzable desde casa`);
}

// camino interno: en cada mapa, todo warp debe poder llegar a los demás warps a pie
{
  for (const [mid, m] of Object.entries(MQ.MAPS)) {
    const pts = (m.warps || []).map((w) => [w.x, w.y]);
    for (const t of m.triggers || []) pts.push([t.x, t.y]);
    if (pts.length < 2) continue;
    const key = (x, y) => x + ',' + y;
    const seen = new Set([key(...pts[0])]);
    const q = [pts[0]];
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const nx = x + dx, ny = y + dy;
        if (!walk(mid, nx, ny) || seen.has(key(nx, ny))) continue;
        seen.add(key(nx, ny)); q.push([nx, ny]);
      }
    }
    for (const [x, y] of pts) ok(seen.has(key(x, y)), `${mid}: punto (${x},${y}) conectado a pie`);
  }
}

// ---- 3. lógica: stats, xp, daño ----
section('Lógica');
const mon = MQ.makeMon('arepito', 5);
ok(mon.hp === mon.maxhp && mon.hp > 10, 'makeMon: PS positivos');
ok(mon.moves.length >= 1 && mon.moves.length <= 4, 'makeMon: 1-4 movimientos');
ok(MQ.movesAtLevel('arepito', 50).length === 4, 'movesAtLevel recorta a 4');
ok(MQ.effect('Rumba', ['Espanto']) === 2, 'tabla: Rumba > Espanto');
ok(MQ.effect('Caribe', ['Monte', 'Tepuy']) === 1, 'tabla: multiplicadores compuestos');
ok(MQ.xpForLevel(10) === 1000, 'curva de XP');

// ---- 4. simulación de combate completo ----
section('Combate');
// presiona A en todo, pero en el menú de movimientos elige uno con daño
const pickDamage = (b) => {
  const i = b.mine.moves.findIndex((m) => MQ.MOVES[m].pow > 0);
  for (let k = 0; k < Math.max(0, i); k++) b.press('down');
  b.press('a');
};
function autoBattle(opts, presses = 3000) {
  MQ.player = MQ.newPlayer('Tester', 'player');
  MQ.player.party = [MQ.makeMon('caribazo', 30), MQ.makeMon('cantaclaro', 28)];
  MQ.player.bag = { ficha: 10, malta: 5 };
  let result = null;
  const b = new MQ.BattleScene(opts, (r) => { result = r; });
  for (let i = 0; i < presses && !result; i++) {
    b.update();
    if (b.tb.active) { b.press('a'); continue; }
    if (b.phase === 'menu') { b.press('a'); continue; }           // PELEAR
    if (b.phase === 'moves') { pickDamage(b); continue; }
    if (b.phase === 'party' || b.phase === 'bag' || b.phase === 'learn') { b.press('a'); continue; }
  }
  return result;
}
const r1 = autoBattle({ wild: { id: 'duendecito', lvl: 5 } });
ok(r1 === 'win', `combate salvaje termina en victoria (=${r1})`);
const r2 = autoBattle({ trainer: { id: 'tt', cls: 'Test', team: [['bachaquito', 4], ['caribito', 4]], money: 50, intro: 'hola', win: 'ganaste', lose: 'perdiste' } });
ok(r2 === 'win', `combate de entrenador termina en victoria (=${r2})`);
ok(MQ.player.money === 300, `dinero del entrenador pagado (${MQ.player.money})`);

// derrota: equipo débil vs jefe
{
  MQ.player = MQ.newPlayer('Tester', 'player');
  MQ.player.party = [MQ.makeMon('bachaquito', 2)];
  let result = null;
  const b = new MQ.BattleScene({ wild: { id: 'silbon', lvl: 40 } }, (r) => { result = r; });
  for (let i = 0; i < 2000 && !result; i++) {
    b.update();
    if (b.tb.active) { b.press('a'); continue; }
    if (b.phase === 'menu') { b.press('a'); continue; }
    if (b.phase === 'moves') { b.press('a'); continue; }
  }
  ok(result === 'lose', `combate imposible termina en derrota (=${result})`);
}

// captura forzada (ficha de oro = garantizada)
{
  MQ.player = MQ.newPlayer('Tester', 'player');
  MQ.player.party = [MQ.makeMon('pepiada', 30)];
  MQ.player.bag = { fichaoro: 1 };
  let result = null;
  const b = new MQ.BattleScene({ wild: { id: 'vagonima', lvl: 10 } }, (r) => { result = r; });
  for (let i = 0; i < 500 && !result; i++) {
    b.update();
    if (b.tb.active) { b.press('a'); continue; }
    if (b.phase === 'menu') { b.press('down'); b.press('a'); continue; } // MOCHILA
    if (b.phase === 'bag') { b.press('a'); continue; }
  }
  ok(result === 'catch', `ficha de oro captura garantizada (=${result})`);
  ok(MQ.player.party.length === 2, 'el espanto fichado entra al equipo');
  ok(MQ.player.dexCaught.vagonima, 'el dex registra la captura');
}

// evolución
{
  MQ.player = MQ.newPlayer('T', 'player');
  const m = MQ.makeMon('arepito', 15);
  m.xp = MQ.xpForLevel(16) - 1;
  MQ.player.party = [m];
  let result = null;
  const b = new MQ.BattleScene({ wild: { id: 'caribito', lvl: 3 } }, (r) => { result = r; });
  for (let i = 0; i < 3000 && !result; i++) {
    b.update();
    if (b.tb.active) { b.press('a'); continue; }
    if (b.phase === 'menu' || b.phase === 'learn') { b.press('a'); continue; }
    if (b.phase === 'moves') { pickDamage(b); continue; }
  }
  ok(result === 'win', `combate de evolución gana (=${result})`);
  ok(m.lvl >= 16, `subió de nivel (${m.lvl})`);
  ok(m.id === 'pepiada', `evolucionó a pepiada (=${m.id})`);
}

// ---- 5. mundo: caminar, warp, scripts ----
section('Overworld');
{
  MQ.player = MQ.newPlayer('Tester', 'player');
  MQ.player.party = [MQ.makeMon('arepito', 5)];
  MQ.player.flags.starter = true;
  MQ.scenes.length = 0;
  const w = new MQ.WorldScene();
  MQ.pushScene(w);
  ok(w.map.id === 'casa', 'empieza en casa');
  // caminar hasta la puerta (5,7) desde (5,5)
  MQ.input.held.down = true;
  for (let i = 0; i < 200 && MQ.player.map === 'casa'; i++) w.update();
  MQ.input.held.down = false;
  ok(MQ.player.map === 'propatria', `warp casa→propatria (mapa=${MQ.player.map})`);
  ok(MQ.player.visited.propatria, 'propatria marcada como visitada');

  // curación: párate bajo el módulo H (3,7) mirando arriba
  MQ.player.x = 3; MQ.player.y = 7; MQ.player.dir = 'up';
  MQ.player.party[0].hp = 1;
  w.interact();
  for (let i = 0; i < 60 && (w.tb.active || w.script); i++) { w.update(); if (w.tb.active) w.press('a'); }
  ok(MQ.player.party[0].hp === MQ.player.party[0].maxhp, 'el Doctorcito cura el equipo');
  ok(MQ.player.respawn.map === 'propatria', 'respawn actualizado');

  // tienda: párate bajo la S y compra
  MQ.player.x = 21; MQ.player.y = 7; MQ.player.dir = 'up';
  const moneyBefore = MQ.player.money;
  w.interact();
  for (let i = 0; i < 20 && w.tb.active; i++) w.press('a');
  ok(!!w.menu, 'tienda abre menú');
  w.menu && w.press('a'); // compra ficha
  ok(MQ.player.money === moneyBefore - MQ.ITEMS.ficha.price, `compra descuenta bolos (${MQ.player.money})`);
  ok((MQ.player.bag.ficha || 0) >= 1, 'la ficha llegó a la mochila');
  w.menu = null;
}

// reja con requisito: sin ficha1 no se pasa de Capitolio
{
  MQ.player = MQ.newPlayer('Tester', 'player');
  MQ.player.party = [MQ.makeMon('arepito', 10)];
  MQ.player.flags.starter = true;
  MQ.player.map = 'capitolio'; MQ.player.x = 24; MQ.player.y = 5; MQ.player.dir = 'right';
  MQ.scenes.length = 0;
  const w = new MQ.WorldScene();
  MQ.pushScene(w);
  MQ.input.held.right = true;
  for (let i = 0; i < 60 && !w.tb.active; i++) w.update();
  MQ.input.held.right = false;
  ok(MQ.player.map === 'capitolio' && MQ.player.x === 24, 'sin ficha: el operador te devuelve');
  while (w.tb.active) w.press('a');
  MQ.setFlag('ficha1');
  MQ.input.held.right = true;
  for (let i = 0; i < 60 && MQ.player.map === 'capitolio'; i++) w.update();
  MQ.input.held.right = false;
  ok(MQ.player.map === 'tunel3', `con ficha: pasa al túnel 3 (=${MQ.player.map})`);
}

// guion del altar y del tren
{
  MQ.player = MQ.newPlayer('Tester', 'player');
  MQ.player.party = [MQ.makeMon('sayona', 60)];
  MQ.player.map = 'lineafantasma'; MQ.player.x = 22; MQ.player.y = 3;
  MQ.scenes.length = 0;
  const w = new MQ.WorldScene();
  MQ.pushScene(w);
  MQ.player.dir = 'up';
  w.interact(); // altar en (22,2)
  for (let i = 0; i < 60 && (w.tb.active || w.script); i++) { w.update(); if (w.tb.active) w.press('a'); }
  ok(MQ.player.flags.fichaoro, 'altar otorga la ficha de oro');
  ok(MQ.player.bag.fichaoro === 1, 'ficha de oro en mochila');

  // disparo del tren fantasma: caminar al tile (42,4)
  MQ.player.x = 42; MQ.player.y = 4;
  w.checkTrigger();
  let steps = 0;
  while ((w.tb.active || w.script || MQ.scenes.length > 1) && steps++ < 6000) {
    const t = MQ.scenes[MQ.scenes.length - 1];
    t.update && t.update();
    if (t.tb && t.tb.active) { t.press('a'); continue; }
    if (t.phase === 'menu') { t.press('down'); t.press('a'); continue; } // MOCHILA
    if (t.phase === 'bag') { t.press('a'); continue; }                    // ficha de oro
    if (t.pages) { t.press('a'); continue; }                              // EndScene
  }
  ok(MQ.player.flags.tren, 'el Tren Fantasma fue enfrentado y fichado');
  ok(MQ.player.dexCaught.trenfantasma, 'tren fantasma en el dex');
  ok(MQ.player.flags.ending || MQ.scenes.length >= 1, 'el final corre sin romperse');
}

// guion de inicio (starter)
{
  MQ.player = MQ.newPlayer('Tester', 'player');
  MQ.scenes.length = 0;
  const w = new MQ.WorldScene();
  MQ.pushScene(w);
  MQ.player.x = 4; MQ.player.y = 4; MQ.player.dir = 'up';
  w.interact(); // arepito en (4,3)
  for (let i = 0; i < 80 && (w.tb.active || w.script || w.menu); i++) {
    w.update();
    if (w.tb.active) { w.press('a'); continue; }
    if (w.menu) { w.press('a'); continue; } // "¡Sí, de una!"
  }
  ok(MQ.player.flags.starter, 'elegir inicial marca la bandera');
  ok(MQ.player.party.length === 1 && MQ.player.party[0].id === 'arepito', 'arepito en el equipo');
  ok(MQ.player.bag.ficha === 5 && MQ.player.bag.malta === 3, 'la abuela da fichas y maltas');

  // intentar agarrar un segundo inicial: la abuela no lo permite
  MQ.player.x = 6; MQ.player.y = 4; MQ.player.dir = 'up';
  w.interact(); // turpialin en (6,3)
  for (let i = 0; i < 80 && (w.tb.active || w.script || w.menu); i++) {
    w.update();
    if (w.tb.active) { w.press('a'); continue; }
    if (w.menu) { w.press('a'); continue; }
  }
  ok(MQ.player.party.length === 1, 'no se puede agarrar un segundo inicial');
}

// scripts de historia existen y devuelven listas
for (const k of ['intro', 'abuela', 'heal', 'rival1', 'rival2', 'rival3', 'altar', 'trenfantasma']) {
  MQ.player = MQ.newPlayer('T', 'player');
  MQ.player.party = [MQ.makeMon('arepito', 5)];
  const s = MQ.SCRIPTS[k]();
  ok(Array.isArray(s) && s.length > 0, `script ${k} devuelve pasos`);
}

console.log(failures ? `\n✗ ${failures} fallos` : '\n✓ Todo pasó');
process.exit(failures ? 1 : 0);
