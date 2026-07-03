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

for (const f of ['core.js', 'audio.js', 'gamedata.js', 'art.js', 'dex.js', 'sprite-manifest.js', 'sprites.js', 'world.js', 'world2.js', 'battle.js', 'overworld.js', 'main.js', 'world3.js']) {
  const code = fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8');
  vm.runInContext(code, sandbox, { filename: f });
}
const MQ = sandbox.MQ;
MQ.ctx = ctxStub;
ok(MQ && MQ.SPECIES && MQ.MAPS, 'MQ cargó con especies y mapas');

// ---- 1. integridad del dex (150 especies, 204 movimientos, Gen 3) ----
section('Dex');
ok(MQ.DEX_ORDER.length === 150, `el bestiario completo está vivo (${MQ.DEX_ORDER.length}/150)`);
ok(MQ.DEX_ORDER.length === Object.keys(MQ.SPECIES).length, 'DEX_ORDER cubre todas las especies');
ok(MQ.SPECIES[MQ.DEX_ORDER[149]] && MQ.DEX_ORDER[149] === 'trenfantasma', 'el Tren Fantasma cierra el dex (#150)');
const BUDGETS = { s1: [300, 340], s2: [400, 440], s3: [500, 540], leg: [570, 600] };
const EV_TOTAL = { s1: 1, s2: 2, s3: 3, leg: 3 };
for (const id of MQ.DEX_ORDER) {
  const sp = MQ.SPECIES[id];
  ok(sp, `especie ${id} existe`);
  ok(sp.types.every((t) => MQ.TYPES[t]), `${id}: tipos válidos (${sp.types})`);
  // seis estadísticas base dentro de su presupuesto de poder
  ok(MQ.STATS6.every((s) => Number.isInteger(sp.base[s]) && sp.base[s] > 0), `${id}: 6 stats base positivas`);
  const bst = MQ.STATS6.reduce((a, s) => a + sp.base[s], 0);
  const [lo, hi] = BUDGETS[sp.budget] || [0, 9999];
  ok(bst >= lo && bst <= hi, `${id}: BST ${bst} dentro del presupuesto ${sp.budget}`);
  ok(MQ.XP_GROUPS[sp.exp_group], `${id}: grupo de experiencia válido (${sp.exp_group})`);
  // habilidades registradas
  ok(sp.abilities && MQ.ABILITIES[sp.abilities.primary], `${id}: habilidad primaria existe`);
  if (sp.abilities.secondary) ok(MQ.ABILITIES[sp.abilities.secondary], `${id}: habilidad secundaria existe`);
  if (sp.abilities.hidden) ok(MQ.ABILITIES[sp.abilities.hidden], `${id}: habilidad oculta existe`);
  // calle (EV yield) acorde al porte
  const evTotal = Object.values(sp.ev_yield || {}).reduce((a, b) => a + b, 0);
  ok(evTotal === EV_TOTAL[sp.budget], `${id}: calle otorgada ${evTotal} = ${EV_TOTAL[sp.budget]}`);
  ok(sp.learn.length > 0, `${id}: tiene movimientos`);
  for (const [lvl, mv] of sp.learn) ok(MQ.MOVES[mv], `${id}: movimiento ${mv} existe`);
  ok(sp.learn.some(([l]) => l === 1), `${id}: tiene movimiento de nivel 1`);
  if (sp.evolve) {
    ok(MQ.SPECIES[sp.evolve.to], `${id}: evolución ${sp.evolve.to} existe`);
    ok(sp.evolve.method === 'level' ? sp.evolve.lvl > 1 : sp.evolve.method === 'confianza',
      `${id}: método de evolución válido (${sp.evolve.method})`);
  }
  ok(sp.dex && sp.dex.length > 20, `${id}: tiene entrada de dex`);
  ok(sp.dex_en && sp.dex_en.length > 10, `${id}: tiene entrada de dex en inglés`);
  ok(sp.catch > 0 && sp.catch <= 255, `${id}: catch rate válido`);
  const cry = MQ.CRIES[id];
  ok(Array.isArray(cry) && cry.length > 0, `${id}: tiene grito`);
  for (const s of cry || [])
    ok(s[0] === 'n' ? s.length === 4 : s.length === 7 && s[1] > 0 && s[2] > 0, `${id}: paso de grito válido (${s[0]})`);
  // arte: todos los caracteres en paleta (pintado a mano o silueta generada)
  ok(Array.isArray(sp.art) && sp.art.length > 0 && sp.pal, `${id}: tiene arte de respaldo`);
  for (const row of sp.art) {
    ok(row.length <= 17, `${id}: fila de arte <= 17 chars (${row.length})`);
    for (const ch of row) if (ch !== '.') ok(sp.pal[ch], `${id}: color '${ch}' en paleta`);
  }
}
// movimientos: esquema Gen 3 (categoría por tipo, efectos de la taxonomía §2.7)
ok(Object.keys(MQ.MOVES).length === 204, `los 204 movimientos cargaron (${Object.keys(MQ.MOVES).length})`);
const FX_KINDS = new Set(['status', 'stage', 'heal', 'drain', 'recoil', 'multi', 'flinch',
  'crit', 'weather', 'trap', 'hazard', 'charge', 'protect', 'endure', 'counter',
  'recharge', 'switch', 'noescape', 'money', 'curse', 'leech', 'cantmiss-under']);
for (const [id, mv] of Object.entries(MQ.MOVES)) {
  ok(MQ.TYPES[mv.type], `mov ${id}: tipo válido`);
  ok(['physical', 'special', 'status'].includes(mv.category), `mov ${id}: categoría válida`);
  if (mv.pow > 0 && !mv.effects.some((e) => e.kind === 'counter'))
    ok(mv.category === MQ.CATEGORY[mv.type], `mov ${id}: categoría acorde al tipo (${mv.category})`);
  ok(mv.pow > 0 || mv.effects.length > 0, `mov ${id}: tiene poder o efecto`);
  ok(mv.pp > 0 && mv.pp <= 99, `mov ${id}: PP válidos (${mv.pp})`);
  ok(mv.acc === null || (mv.acc > 0 && mv.acc <= 100), `mov ${id}: precisión válida (${mv.acc})`);
  for (const fx of mv.effects) {
    ok(FX_KINDS.has(fx.kind), `mov ${id}: efecto '${fx.kind}' reconocido`);
    if (fx.kind === 'status') ok(MQ.STATUS[fx.status] || fx.status === 'mareo', `mov ${id}: estado '${fx.status}' existe`);
    if (fx.kind === 'stage') ok(['atk', 'def', 'spa', 'spd', 'spe', 'acc', 'eva'].includes(fx.stat), `mov ${id}: stat de etapa válida`);
    if (fx.kind === 'weather') ok(MQ.WEATHER[fx.weather], `mov ${id}: clima '${fx.weather}' existe`);
  }
}
ok(MQ.MOVES.forcejeo && MQ.MOVES.forcejeo.effects.some((e) => e.kind === 'recoil'), 'Forcejeo existe con retroceso');
ok(MQ.MOVES.arrullo && MQ.MOVES.arrullo.effects.some((e) => e.kind === 'status' && e.status === 'slp'), 'Arrullo duerme');
ok(Object.keys(MQ.NATURES).length === 25, 'las 25 naturalezas están');
ok(Object.keys(MQ.ABILITIES).length === 41, 'las 41 habilidades están');
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
        ok(lvl >= 1 && lvl <= 70, `${mid}: trainer ${n.trainer.id} nivel razonable`);
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
const mon = MQ.makeMon('frontinito', 5);
ok(mon.hp === mon.maxhp && mon.hp > 10, 'makeMon: PS positivos');
ok(mon.moves.length >= 1 && mon.moves.length <= 4, 'makeMon: 1-4 movimientos');
ok(mon.moves.every((m) => mon.pp[m] === MQ.MOVES[m].pp), 'makeMon: PP llenos');
// curación completa: limpia estado y restaura PP (y migra mons sin pp)
{
  const m = MQ.makeMon('mapanare', 12);
  m.status = 'psn'; m.hp = 3; m.pp[m.moves[0]] = 0;
  MQ.fullHeal(m);
  ok(m.hp === m.maxhp && !m.status && m.pp[m.moves[0]] === MQ.MOVES[m.moves[0]].pp, 'fullHeal: PS, estado y PP');
  const viejo = { id: 'morrocoy', lvl: 9, hp: 5, maxhp: 30, moves: ['conchazo'] }; // guardado pre-PP
  MQ.ensurePP(viejo);
  ok(viejo.pp.conchazo === MQ.MOVES.conchazo.pp, 'ensurePP migra guardados viejos');
}
ok(MQ.movesAtLevel('frontinito', 50).length === 4, 'movesAtLevel recorta a 4');
ok(MQ.effect('Rumba', ['Espanto']) === 2, 'tabla: Rumba > Espanto');
ok(MQ.effect('Caribe', ['Monte', 'Tepuy']) === 1, 'tabla: multiplicadores compuestos');
ok(MQ.xpForLevel(10) === 1000, 'curva de XP');
// triángulo de iniciales: oso > cocuyo > turpial > oso
ok(MQ.effect('Tepuy', MQ.SPECIES.cocuyin.types) === 2, 'triángulo: Frontinito (Tepuy) > Cocuyín');
ok(MQ.effect('Catatumbo', MQ.SPECIES.turpialin.types) === 2, 'triángulo: Cocuyín (Catatumbo) > Turpialín');
ok(MQ.effect('Monte', MQ.SPECIES.frontinito.types) === 2, 'triángulo: Turpialín (Monte) > Frontinito');

// ---- 4. simulación de combate completo ----
section('Combate');
// presiona A en todo, pero en el menú de movimientos elige uno con daño y PP
const pickDamage = (b) => {
  let i = b.mine.moves.findIndex((m) => MQ.MOVES[m].pow > 0 && (b.mine.pp[m] ?? 0) > 0);
  if (i < 0) i = b.mine.moves.findIndex((m) => (b.mine.pp[m] ?? 0) > 0);
  if (i < 0) { b.press('b'); return; } // sin PP: vuelve al menú y PELEAR fuerza el Forcejeo
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
    if (b.phase === 'shift') { b.press('b'); continue; } // no cambio: sigue el pleito
    if (b.phase === 'party') { if (Math.random() < 0.5) b.press('down'); b.press('a'); continue; }
    if (b.phase === 'bag' || b.phase === 'learn') { b.press('a'); continue; }
  }
  return result;
}
const r1 = autoBattle({ wild: { id: 'duendecito', lvl: 5 } });
ok(r1 === 'win', `combate salvaje termina en victoria (=${r1})`);
{
  const m = MQ.player.party[0];
  ok(m.moves.some((k) => m.pp[k] < MQ.MOVES[k].pp), 'los PP se gastan al pelear');
}
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
  MQ.player.party = [MQ.makeMon('ucumari', 30)];
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
  const m = MQ.makeMon('frontinito', 15);
  m.xp = MQ.xpForLevel(16, MQ.xpGroupOf('frontinito')) - 1;
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
  ok(m.id === 'ucumari', `evolucionó a ucumari (=${m.id})`);
}

// ---- 4b. fuzz: combates aleatorios por todo el bestiario ----
// Ejercita el motor Gen-3 entero (los 204 movimientos, habilidades, estados,
// clima) con combates auto-jugados: nada debe reventar ni colgarse.
section('Fuzz Gen-3');
{
  const WEATHERS = [null, 'lluvia', 'sol', 'neblina', 'apagon', 'horapico'];
  let stalls = 0, errors = 0;
  for (let t = 0; t < 60; t++) {
    const pid = MQ.DEX_ORDER[Math.floor(Math.random() * 150)];
    const eid = MQ.DEX_ORDER[Math.floor(Math.random() * 150)];
    const lvl = 5 + Math.floor(Math.random() * 50);
    MQ.player = MQ.newPlayer('Fuzz', 'player');
    MQ.player.party = [MQ.makeMon(pid, lvl + 3), MQ.makeMon(MQ.DEX_ORDER[Math.floor(Math.random() * 150)], lvl)];
    // a veces con objeto equipado
    const holds = ['tajadaplatano', 'garracunaguaro', 'monedalocha', 'campanavagon', 'azabachepulsera', 'polvomariposa', 'franelabarrio', 'mamon', 'merey', null];
    MQ.player.party[0].item = holds[Math.floor(Math.random() * holds.length)];
    MQ.player.bag = { ficha: 3, fichaferia: 2, ficharayada: 2, fichamadrugadora: 2, malta: 2, xarrechera: 1 };
    let result = null;
    let b;
    try {
      b = new MQ.BattleScene({ wild: { id: eid, lvl },
        weather: WEATHERS[Math.floor(Math.random() * WEATHERS.length)],
        dark: Math.random() < 0.5 }, (r) => { result = r; });
      for (let i = 0; i < 4000 && !result; i++) {
        b.update();
        if (b.tb.active) { b.press('a'); continue; }
        if (b.phase === 'menu') {
          // mezcla acciones: pelear, mochila (fichas/x-items), huir a veces
          const roll = Math.random();
          if (roll < 0.6) b.press('a');
          else if (roll < 0.85) { b.press('down'); b.press('a'); }
          else { b.press('down'); b.press('down'); b.press('down'); b.press('a'); }
          continue;
        }
        if (b.phase === 'moves') {
          if (!b.mine.moves.some((m) => (b.mine.pp[m] ?? 0) > 0)) { b.press('b'); continue; }
          for (let k = 0; k < Math.floor(Math.random() * 4); k++) b.press('down');
          b.press('a'); continue;
        }
        if (b.phase === 'shift') { b.press('b'); continue; }
        if (b.phase === 'party' || b.phase === 'bag' || b.phase === 'learn') {
          if (Math.random() < 0.3) b.press('down');
          b.press('a');
          continue;
        }
      }
    } catch (e) {
      errors++;
      ok(false, `fuzz ${t}: ${pid}@${lvl + 3} vs ${eid}@${lvl} revienta: ${e.message}`);
      continue;
    }
    if (!result) {
      stalls++;
      ok(false, `fuzz ${t}: ${pid}@${lvl + 3} vs ${eid}@${lvl} se cuelga (phase=${b.phase} q=${b.queue.length} tb=${b.tb.active})`);
    }
  }
  ok(stalls === 0 && errors === 0, `fuzz: 60 combates aleatorios sin cuelgues ni errores (${stalls} cuelgues, ${errors} errores)`);
}

// migración de partidas v1: espanto de 4 stats gana chispa, calle y naturaleza
{
  const legacy = { id: 'chigui', lvl: 12, xp: 1728, hp: 20, maxhp: 34, atk: 15, def: 17, spd: 12, moves: ['trancazo', 'aguacerito'], status: null, pp: {}, shiny: false };
  MQ.migrateMon(legacy);
  ok(legacy.ivs && MQ.STATS6.every((s) => legacy.ivs[s] >= 0 && legacy.ivs[s] <= 31), 'migración: IVs 0-31');
  ok(legacy.spe > 0 && legacy.spa > 0 && legacy.spd > 0, 'migración: seis stats presentes');
  ok(MQ.NATURES[legacy.nature], 'migración: naturaleza válida');
  ok(legacy.hp > 0 && legacy.hp <= legacy.maxhp, 'migración: PS conservan proporción');
  ok(legacy.ability && MQ.ABILITIES[legacy.ability], 'migración: habilidad asignada');
}

// las estadísticas Gen 3: IVs/EVs/naturaleza mueven el resultado
{
  const base = MQ.calcStats('frontinito', 50, null, null, 'chevere');
  const full = MQ.calcStats('frontinito', 50, { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 }, { atk: 252 }, 'guapo');
  ok(full.atk > base.atk, `IVs+EVs+naturaleza suben el ataque (${base.atk} -> ${full.atk})`);
  ok(full.hp > base.hp, 'IVs suben los PS');
  const minus = MQ.calcStats('frontinito', 50, null, null, 'conchudo');
  ok(minus.atk < base.atk, 'naturaleza -ATQ baja el ataque');
}

// curva de experiencia por grupo
ok(MQ.xpForLevel(20, 'rapido') < MQ.xpForLevel(20, 'parejo'), 'grupo rápido requiere menos XP');
ok(MQ.xpForLevel(20, 'lento') > MQ.xpForLevel(20, 'pausado'), 'grupo lento requiere más XP');

// ---- 5. mundo: caminar, warp, scripts ----
section('Overworld');
{
  MQ.player = MQ.newPlayer('Tester', 'player');
  MQ.player.party = [MQ.makeMon('frontinito', 5)];
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
  MQ.player.party = [MQ.makeMon('frontinito', 10)];
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

// línea de vista estilo FireRed: Ramón te ve, suelta el ¡!, camina hasta ti y te reta
{
  MQ.player = MQ.newPlayer('Tester', 'player');
  MQ.player.party = [MQ.makeMon('frontinito', 12)];
  MQ.player.flags.starter = true;
  MQ.player.map = 'tunel1'; MQ.player.x = 17; MQ.player.y = 2; MQ.player.dir = 'down';
  MQ.scenes.length = 0;
  const w = new MQ.WorldScene();
  MQ.pushScene(w);
  const ram = w.map.npcs.find((n) => n.trainer && n.trainer.id === 'ramon');
  ram.dir = 'right'; // que vigile el pasillo despejado (al sur hay un pilar)
  w.arrived();
  ok(w.engage && w.engage.npc === ram && w.engage.phase === 'alert', 'Ramón te vio: suelta el ¡!');
  let guard = 0;
  while (w.engage && guard++ < 400) w.update();
  ok(!w.engage && !!w.script, 'tras el ¡! camina hasta ti y arranca el reto');
  ok(ram.x === 16 && ram.y === 2, `Ramón caminó hasta quedar al lado (${ram.x},${ram.y})`);
  ok(MQ.player.dir === 'left', 'el jugador voltea a mirarlo');
  let steps = 0;
  while ((w.tb.active || w.script || MQ.scenes.length > 1) && steps++ < 3000) {
    const t = MQ.scenes[MQ.scenes.length - 1];
    t.update && t.update();
    if (t.tb && t.tb.active) { t.press('a'); continue; }
    if (t.phase === 'menu') { t.press('a'); continue; }
    if (t.phase === 'moves') {
      let idx = t.mine.moves.findIndex((m) => MQ.MOVES[m].pow > 0 && (t.mine.pp[m] ?? 0) > 0);
      if (idx < 0) idx = 0;
      for (let k = 0; k < idx; k++) t.press('down');
      t.press('a'); continue;
    }
    if (t.phase === 'shift') { t.press('b'); continue; }
    if (t.phase === 'party' || t.phase === 'learn' || t.phase === 'bag') { t.press('a'); continue; }
  }
  ok(MQ.player.flags.t_ramon, 'el combate por línea de vista se ganó');
  MQ.player.x = 17; MQ.player.y = 2;
  w.arrived();
  ok(!w.engage, 'un entrenador vencido ya no persigue a nadie');
  ram.x = 14; ram.y = 2; ram.dir = 'down'; // de vuelta a su puesto pa' los demás tests
}

// los paqueticos del andén: sólidos, se recogen una sola vez, y todos en piso legal
{
  MQ.player = MQ.newPlayer('Tester', 'player');
  MQ.player.party = [MQ.makeMon('frontinito', 10)];
  MQ.player.flags.starter = true;
  MQ.player.map = 'tunel1';
  MQ.scenes.length = 0;
  const w = new MQ.WorldScene();
  MQ.pushScene(w);
  const ball = w.map.npcs.find((n) => n.itemBall);
  ok(!!ball, 'tunel1 tiene un paquetico tirado');
  ok(!w.walkable(ball.x, ball.y), 'el paquetico es sólido (bloquea el paso)');
  MQ.player.x = ball.x; MQ.player.y = ball.y + 1; MQ.player.dir = 'up';
  w.interact();
  ok((MQ.player.bag[ball.itemBall] || 0) >= (ball.n || 1), `el paquetico cayó en la mochila (${ball.itemBall})`);
  ok(MQ.player.flags[ball.hideIf], 'la bandera evita que reaparezca');
  ok(!w.npcAt(ball.x, ball.y), 'el paquetico ya no está en el piso');
  while (w.tb.active) w.press('a');

  let count = 0;
  for (const [id, m] of Object.entries(MQ.MAPS)) {
    for (const n of m.npcs || []) {
      if (!n.itemBall) continue;
      count++;
      ok(MQ.ITEMS[n.itemBall], `paquetico en ${id}: ítem real (${n.itemBall})`);
      ok(MQ.WALKABLE.has((m.grid[n.y] || '')[n.x] || '#'), `paquetico en ${id} (${n.x},${n.y}) en piso caminable`);
      ok(n.hideIf && n.hideIf.startsWith('item_'), `paquetico en ${id} con bandera propia`);
    }
  }
  ok(count >= 14, `hay ${count} paqueticos regados por la red`);
}

// lo enterrado y el Rastreador: escondites sin brillo + la antena que los huele
{
  MQ.player = MQ.newPlayer('Tester', 'player');
  MQ.player.party = [MQ.makeMon('frontinito', 10)];
  MQ.player.flags.starter = true;
  MQ.player.map = 'tunel1';
  MQ.scenes.length = 0;
  const w = new MQ.WorldScene();
  MQ.pushScene(w);
  // sacar la ficha de detrás del pilar (14,4) mirando desde (13,4)
  MQ.player.x = 13; MQ.player.y = 4; MQ.player.dir = 'right';
  const before = MQ.player.bag.ficha || 0;
  w.interact();
  ok((MQ.player.bag.ficha || 0) === before + 1, 'lo enterrado sale con A mirando el pilar');
  ok(MQ.player.flags.hid_tunel1_14_4, 'el escondite levanta su bandera');
  while (w.tb.active) w.press('a');
  w.interact();
  ok((MQ.player.bag.ficha || 0) === before + 1, 'el escondite no se saca dos veces');
  while (w.tb.active) w.press('a');

  // todos los escondites del mundo: en casilla real y con ítem real
  let hidCount = 0;
  for (const [id, m] of Object.entries(MQ.MAPS)) {
    for (const h of m.hidden || []) {
      hidCount++;
      ok(MQ.ITEMS[h.item], `escondite en ${id}: ítem real (${h.item})`);
      ok(((m.grid[h.y] || '')[h.x] || '') !== '', `escondite en ${id} (${h.x},${h.y}) dentro del mapa`);
      const vecino = MQ.WALKABLE.has((m.grid[h.y] || '')[h.x] || '#') ||
        [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => MQ.WALKABLE.has((m.grid[h.y + dy] || '')[h.x + dx] || '#'));
      ok(vecino, `escondite en ${id} (${h.x},${h.y}) alcanzable`);
    }
  }
  ok(hidCount >= 10, `hay ${hidCount} escondites enterrados por la red`);

  // el Zahorí regala el Rastreador
  const za = MQ.MAPS.st_bellomonte.npcs.find((n) => n.script === 'regalo:rastreador');
  ok(!!za, 'el Zahorí espera en Bello Monte');
  w.runScript(MQ.SCRIPTS['regalo:rastreador']());
  for (let i = 0; i < 30 && (w.tb.active || w.script); i++) { w.update(); if (w.tb.active) w.press('a'); }
  ok(MQ.player.bag.rastreador === 1, 'el Zahorí entrega el Rastreador');

  // la antena: apunta al escondite más cercano sin sacar
  MQ.player.x = 5; MQ.player.y = 5; // tunel2 papelón está en (9,5)... aquí seguimos en tunel1
  w.openBag();
  ok(!!w.menu, 'la mochila abre con el Rastreador dentro');
  const idx = w.menu.items.findIndex((it) => it.value === 'rastreador');
  ok(idx >= 0, 'el Rastreador aparece en la mochila');
  for (let k = 0; k < idx; k++) w.press('down');
  w.press('a');
  ok(!w.menu && w.tb.active, 'el Rastreador habla (ya no queda nada en tunel1: se queda mudo)');
  while (w.tb.active) w.press('a');
}

// el Carnet, las Cholas y el susto a mitad de bolos (a la FireRed)
{
  MQ.player = MQ.newPlayer('Tester', 'player');
  MQ.player.party = [MQ.makeMon('frontinito', 10)];
  MQ.player.flags.starter = true;
  MQ.player.map = 'propatria'; MQ.player.x = 6; MQ.player.y = 8; MQ.player.dir = 'left';
  MQ.scenes.length = 0;
  const w = new MQ.WorldScene();
  MQ.pushScene(w);
  // el Maratonista regala las Cholas
  const mar = MQ.MAPS.propatria.npcs.find((n) => n.script === 'regalo:cholas');
  ok(!!mar && mar.x === 5 && mar.y === 8, 'el Maratonista espera en Propatria');
  w.interact();
  for (let i = 0; i < 30 && (w.tb.active || w.script); i++) { w.update(); if (w.tb.active) w.press('a'); }
  ok(MQ.player.bag.cholas === 1 && MQ.player.flags.cholas, 'las Cholas llegan a la mochila');
  // trotar: con B sostenido el paso gasta menos cuadros
  const stepFrames = (b) => {
    MQ.player.x = 10; MQ.player.y = 3; MQ.player.dir = 'right';
    MQ.input.held.b = b; MQ.input.held.right = true;
    w.update(); // arranca el paso
    let n = 1;
    while (w.moving > 0 && n < 20) { w.update(); n++; }
    MQ.input.held.right = false; MQ.input.held.b = false;
    return n;
  };
  const lento = stepFrames(false), rapido = stepFrames(true);
  ok(rapido < lento, `el trote apura el paso (${rapido} < ${lento} cuadros)`);
  // el Carnet abre y cierra
  MQ.player.frames = 216000 * 2 + 3600 * 34; // 2:34 de viaje
  w.carnetView = true;
  w.draw(MQ.ctx);
  w.press('a');
  ok(!w.carnetView, 'el Carnet se cierra con A');
  // el susto cuesta la mitad, como manda FireRed
  MQ.player.money = 501;
  MQ.player.respawn = { map: 'propatria', x: 6, y: 8 };
  MQ.respawn(w);
  ok(MQ.player.money === 250, `el susto cobra la mitad (${MQ.player.money})`);
  while (w.tb.active) w.press('a');
}

// el retador da la cara: figura antes del espanto, y otra vez al ser vencido
{
  MQ.player = MQ.newPlayer('Tester', 'player');
  MQ.player.party = [MQ.makeMon('frontinito', 30)];
  MQ.player.flags.starter = true;
  let res = null;
  const b = new MQ.BattleScene({ trainer: { id: 'x_probador', cls: 'Probador', name: 'Canario', look: 'obrero',
    team: [['cachicamo', 3]], money: 10, intro: 'Dale pues.', win: 'Bien jugado.', lose: 'Ja.' } }, (r) => { res = r; });
  ok(b.showTrainer === true, 'la figura del retador abre el combate');
  let steps = 0;
  while (b.phase !== 'menu' && steps++ < 200) { b.update(); if (b.tb.active) b.press('a'); }
  ok(b.showTrainer === false, 'la figura se retira al sacar su espanto');
  steps = 0;
  while (!res && steps++ < 3000) {
    b.update();
    if (b.tb.active) { b.press('a'); continue; }
    if (b.phase === 'menu') { b.press('a'); continue; }
    if (b.phase === 'moves') {
      let idx = b.mine.moves.findIndex((m) => MQ.MOVES[m].pow > 0 && (b.mine.pp[m] ?? 0) > 0);
      if (idx < 0) idx = 0;
      for (let k = 0; k < idx; k++) b.press('down');
      b.press('a'); continue;
    }
    if (b.phase === 'shift') { b.press('b'); continue; }
    if (b.phase === 'party' || b.phase === 'learn' || b.phase === 'bag') { b.press('a'); continue; }
  }
  ok(res === 'win', 'el Probador cae ante el frontino');
  ok(b.showTrainer === true, 'el vencido vuelve a dar la cara en la despedida');
}

// AJUSTES: máquina de escribir, estilo CAMBIO/SEGUIDO y el menú que los gobierna
{
  MQ.player = MQ.newPlayer('Tester', 'player');
  MQ.player.party = [MQ.makeMon('frontinito', 40), MQ.makeMon('chigui', 38)];
  MQ.player.flags.starter = true;
  // máquina de escribir: el texto se revela al dibujar y A completa la página
  const tb = new MQ.Textbox();
  tb.open(MQ.ctx, 'Un texto largo del andén que la máquina de escribir revela letra por letra, con calma criolla.');
  ok(tb.reveal === 0, 'la página arranca sin revelar');
  tb.draw(MQ.ctx); tb.draw(MQ.ctx);
  ok(tb.reveal > 0 && tb.reveal < tb.lines.join('').length, 'el texto se va escribiendo');
  tb.advance();
  ok(tb.reveal === tb.lines.join('').length && tb.active, 'A completa la página sin pasarla');
  while (tb.active) tb.advance();
  ok(!tb.active, 'la caja cierra al agotar las páginas');

  // estilo CAMBIO: aviso de relevo con cambio gratis (sin turno regalado)
  let res = null;
  const b = new MQ.BattleScene({ trainer: { id: 'x_duo', cls: 'Probadora', name: 'Dúo', look: 'chama',
    team: [['cachicamo', 3], ['bachaquito', 3]], money: 10, intro: 'Van dos.', win: 'Bien.', lose: 'Ja.' } }, (r) => { res = r; });
  let sawShift = false, shifted = false, steps = 0;
  while (!res && steps++ < 4000) {
    b.update();
    if (b.tb.active) { b.press('a'); continue; }
    if (b.phase === 'shift') {
      sawShift = true;
      if (!shifted) { b.press('a'); shifted = true; } // Sí, cambio
      else b.press('b');
      continue;
    }
    if (b.phase === 'party') { b.press('down'); b.press('a'); continue; }
    if (b.phase === 'menu') { b.press('a'); continue; }
    if (b.phase === 'moves') {
      let idx = b.mine.moves.findIndex((m) => MQ.MOVES[m].pow > 0 && (b.mine.pp[m] ?? 0) > 0);
      if (idx < 0) idx = 0;
      for (let k = 0; k < idx; k++) b.press('down');
      b.press('a'); continue;
    }
    if (b.phase === 'learn' || b.phase === 'bag') { b.press('a'); continue; }
  }
  ok(sawShift, 'el estilo CAMBIO avisa el relevo rival');
  ok(res === 'win', 'la Probadora cae con cambio de por medio');
  ok(b.mi === 1, 'el cambio de cortesía entró de verdad');

  // en SEGUIDO no hay aviso
  MQ.player.battleStyle = 'seguido';
  MQ.player.party.forEach(MQ.fullHeal);
  res = null; sawShift = false; steps = 0;
  const b2 = new MQ.BattleScene({ trainer: { id: 'x_duo2', cls: 'Probadora', name: 'Dúo II', look: 'chama',
    team: [['cachicamo', 3], ['bachaquito', 3]], money: 10, intro: 'Van dos.', win: 'Bien.', lose: 'Ja.' } }, (r) => { res = r; });
  while (!res && steps++ < 4000) {
    b2.update();
    if (b2.tb.active) { b2.press('a'); continue; }
    if (b2.phase === 'shift') { sawShift = true; b2.press('b'); continue; }
    if (b2.phase === 'menu') { b2.press('a'); continue; }
    if (b2.phase === 'moves') {
      let idx = b2.mine.moves.findIndex((m) => MQ.MOVES[m].pow > 0 && (b2.mine.pp[m] ?? 0) > 0);
      if (idx < 0) idx = 0;
      for (let k = 0; k < idx; k++) b2.press('down');
      b2.press('a'); continue;
    }
    if (b2.phase === 'party' || b2.phase === 'learn' || b2.phase === 'bag') { b2.press('a'); continue; }
  }
  ok(res === 'win' && !sawShift, 'en SEGUIDO el relevo entra sin preguntar');
  MQ.player.battleStyle = 'cambio';

  // el menú AJUSTES rota las opciones
  MQ.player.map = 'propatria';
  MQ.scenes.length = 0;
  const w = new MQ.WorldScene();
  MQ.pushScene(w);
  w.openSettings();
  ok(!!w.menu && w.menu.items[0].label.includes('MEDIO'), 'AJUSTES abre con TEXTO: MEDIO');
  w.press('a');
  ok(MQ.player.textSpeed === 'rapido' && w.menu.items[0].label.includes('RÁPIDO'), 'TEXTO rota a RÁPIDO');
  w.press('down'); w.press('a');
  ok(MQ.player.battleStyle === 'seguido' && w.menu.items[1].label.includes('SEGUIDO'), 'COMBATE rota a SEGUIDO');
  w.press('b');
  ok(!w.menu, 'AJUSTES cierra con B');
  MQ.player.textSpeed = 'medio'; MQ.player.battleStyle = 'cambio';
}

// el vigilante que gira: te encuentra hasta parado (spinner estilo FireRed)
{
  MQ.player = MQ.newPlayer('Tester', 'player');
  MQ.player.party = [MQ.makeMon('frontinito', 40)];
  MQ.player.flags.starter = true;
  MQ.player.map = 'tn_ciudaduniversitaria__labandera';
  MQ.scenes.length = 0;
  const w = new MQ.WorldScene();
  MQ.pushScene(w);
  const don = w.map.npcs.find((n) => n.trainer && n.trainer.id === 'ajedrez1');
  ok(don && don.spin, 'Don Emiliano es de los que giran');
  // parado en su mirada: spotNow lo encuentra
  don.dir = 'down';
  let py = 0;
  for (let y = don.y + 1; y <= don.y + 4; y++) {
    if (!MQ.WALKABLE.has(w.tile(don.x, y)) || w.npcAt(don.x, y)) break;
    py = y;
  }
  ok(py > 0, 'hay casilla libre en la mirada de Don Emiliano');
  MQ.player.x = don.x; MQ.player.y = py; MQ.player.dir = 'up';
  ok(w.spotNow(), 'parado en su línea de vista: te encuentra');
  ok(w.engage && w.engage.npc === don, 'el ¡! es de Don Emiliano');
  w.engage = null;
  // la rotación del turno (frame % 50) también dispara la mirada
  // (el giro es probabilístico: se reintenta el tic del turno hasta que caiga)
  don.dir = 'up';
  const oldPick = MQ.pick;
  MQ.pick = (arr) => (arr.length === 4 && arr[0] === 'up' ? 'down' : oldPick(arr));
  for (let tries = 0; tries < 200 && !w.engage; tries++) { w.frame = 49; w.update(); }
  MQ.pick = oldPick;
  ok(don.dir === 'down', 'el giro del turno lo volteó hacia ti');
  ok(w.engage && w.engage.npc === don, 'al girar te ve sin que muevas un pie');
  w.engage = null;
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

  // la vieja entrada de Plaza Venezuela: el Tren pasa de largo (Q6A), sin combate
  MQ.player.x = 42; MQ.player.y = 4;
  w.checkTrigger();
  for (let i = 0; i < 200 && (w.tb.active || w.script); i++) { w.update(); if (w.tb.active) w.press('a'); }
  ok(!MQ.player.flags.tren, 'el Tren ya no se enfrenta en la entrada vieja');
  ok(MQ.scenes.length === 1, 'el pase de largo no deja escenas colgadas');
}

// el final de verdad: el andén de Miranda (Línea Fantasma, tras Consejo + bendición)
{
  MQ.player = MQ.newPlayer('Tester', 'player');
  // Tepuy pega 4x al Espanto/Catatumbo del Tren y resiste su STAB a 0.25x
  MQ.player.party = [MQ.makeMon('waraira', 72), MQ.makeMon('tepuyon', 70)];
  MQ.player.flags.starter = true;
  ['ficha1', 'ficha2', 'ficha3', 'ficha4', 'ficha5', 'ficha6', 'ficha7', 'ficha8'].forEach((f) => MQ.setFlag(f));
  MQ.setFlag('consejo'); MQ.setFlag('fichaoro');
  MQ.player.map = 'gh_miranda_l5';
  MQ.scenes.length = 0;
  const w = new MQ.WorldScene();
  MQ.pushScene(w);
  w.enterMap('gh_miranda_l5');
  const drive = (label) => {
    let steps = 0;
    while ((w.tb.active || w.script || MQ.scenes.length > 1) && steps++ < 8000) {
      const t = MQ.scenes[MQ.scenes.length - 1];
      t.update && t.update();
      if (t.tb && t.tb.active) { t.press('a'); continue; }
      if (t.phase === 'menu') {
        // primera vuelta: pelea; segunda vuelta: mochila (ficha de oro)
        if (label === 'catch') { t.press('down'); t.press('a'); } else t.press('a');
        continue;
      }
      if (t.phase === 'moves') {
        let idx = t.mine.moves.findIndex((m) => MQ.MOVES[m].pow > 0 && (t.mine.pp[m] ?? 0) > 0);
        if (idx < 0) idx = 0;
        for (let k = 0; k < Math.max(0, idx); k++) t.press('down');
        t.press('a'); continue;
      }
      if (t.phase === 'shift') { t.press('b'); continue; }
      if (t.phase === 'party') { if (Math.random() < 0.5) t.press('down'); t.press('a'); continue; }
      if (t.phase === 'bag' || t.phase === 'learn') { t.press('a'); continue; }
      if (t.pages) { t.press('a'); continue; } // EndScene
    }
  };
  MQ.player.x = 16; MQ.player.y = 5;
  w.checkTrigger();
  drive('fight');
  ok(MQ.player.flags.tren, 'el Tren Fantasma fue ayudado en Miranda');
  ok(MQ.player.flags.ending, 'el final corre (EndScene)');
  ok(!MQ.player.dexCaught.trenfantasma, 'la primera vuelta no lo ficha (canon: sin villano)');
  // la segunda vuelta: ahora sí decide viajar contigo
  MQ.player.party.forEach(MQ.fullHeal);
  MQ.player.bag = { fichaoro: 1 };
  MQ.player.x = 16; MQ.player.y = 5;
  w.checkTrigger();
  drive('catch');
  ok(MQ.player.dexCaught.trenfantasma, 'la segunda vuelta lo ficha: el dex se puede completar (150/150)');
}

// guion de inicio (starter)
{
  MQ.player = MQ.newPlayer('Tester', 'player');
  MQ.scenes.length = 0;
  const w = new MQ.WorldScene();
  MQ.pushScene(w);
  MQ.player.x = 4; MQ.player.y = 4; MQ.player.dir = 'up';
  w.interact(); // frontinito en (4,3)
  for (let i = 0; i < 80 && (w.tb.active || w.script || w.menu); i++) {
    w.update();
    if (w.tb.active) { w.press('a'); continue; }
    if (w.menu) { w.press('a'); continue; } // "¡Sí, de una!"
  }
  ok(MQ.player.flags.starter, 'elegir inicial marca la bandera');
  ok(MQ.player.party.length === 1 && MQ.player.party[0].id === 'frontinito', 'frontinito en el equipo');
  ok(MQ.player.bag.ficha === 5 && MQ.player.bag.malta === 3, 'la abuela da fichas y maltas');
  ok(!w.npcAt(4, 3), 'el inicial elegido se baja de la mesa (ya no está)');
  ok(w.npcAt(6, 3) && w.npcAt(8, 3), 'los otros dos se quedan con la abuela');

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

// tren: abordar desde el tile M, elegir destino y VIAJAR (RideScene)
{
  MQ.player = MQ.newPlayer('Tester', 'player');
  MQ.player.party = [MQ.makeMon('frontinito', 5)];
  MQ.player.flags.starter = true;
  MQ.player.map = 'propatria'; MQ.player.x = 13; MQ.player.y = 3;
  MQ.player.visited = { propatria: true, capitolio: true, petare: true };
  MQ.scenes.length = 0;
  const w = new MQ.WorldScene();
  MQ.pushScene(w);
  // jugador nuevo: aunque solo conozca propatria, el tren ofrece la siguiente
  {
    MQ.player.visited = { propatria: true };
    w.openTrain();
    ok(!!w.menu, 'recién empezado, el tren igual ofrece destino');
    ok(w.menu.items.some((it) => it.value === 'canoamarillo'), 'ofrece la siguiente estación de la línea');
    w.press('b');
    // la reja de la Doña no se brinca ni en tren
    MQ.player.map = 'capitolio'; MQ.player.visited = { propatria: true, canoamarillo: true, capitolio: true };
    w.openTrain();
    ok(!w.menu.items.some((it) => it.value === 'bellasartes'), 'sin ficha1 el tren no pasa de Capitolio');
    w.press('b');
    MQ.setFlag('ficha1');
    w.openTrain();
    ok(w.menu.items.some((it) => it.value === 'bellasartes'), 'con ficha1 el tren sí sigue al este');
    w.press('b');
    MQ.player.flags.ficha1 = false; MQ.player.flags.fichas4 = false;
    MQ.player.map = 'propatria';
    MQ.player.visited = { propatria: true, capitolio: true, petare: true };
  }
  // pisa la franja del tren (M) caminando de lado: igual aborda
  MQ.player.x = 13; MQ.player.y = 2; MQ.player.dir = 'right';
  w.arrived();
  ok(!!w.menu && w.mapBehind, 'pisar la franja M abre el tren (en cualquier dirección) con el mapa de fondo');
  w.draw(ctxStub); // el mapa + menú dibujan sin reventar
  w.press('down'); w.press('a'); // capitolio (el primero es la adyacente caño amarillo)
  ok(MQ.scenes[MQ.scenes.length - 1] instanceof MQ.RideScene, 'elegir destino monta el RideScene');
  const ride = MQ.scenes[MQ.scenes.length - 1];
  for (let i = 0; i < 1200 && MQ.scenes.length > 1; i++) { ride.update(); ride.draw(ctxStub); }
  ok(MQ.scenes.length === 1, 'el viaje termina solo (abordaje + interior + llegada)');
  ok(MQ.player.map === 'capitolio', `el tren llega a capitolio (=${MQ.player.map})`);
  while (w.tb.active) w.press('a');
  // viaje largo: abordar con A desde el andén (mirando la vía), saltar a mitad de camino
  MQ.player.x = 13; MQ.player.y = 3; MQ.player.dir = 'up';
  w.interact();
  ok(!!w.menu, 'A mirando la vía también abre el tren');
  w.press('down'); w.press('down'); w.press('a'); // petare (tras propatria y la adyacente caño amarillo)
  const ride2 = MQ.scenes[MQ.scenes.length - 1];
  ok(ride2 instanceof MQ.RideScene && ride2.passing.length >= 3, `el viaje largo pasa estaciones (${ride2.passing.length})`);
  for (let i = 0; i < 10; i++) ride2.update();
  ride2.press('a'); // saltar: adelanta a la ceremonia de llegada
  for (let i = 0; i < 400 && MQ.scenes.length > 1; i++) { ride2.update(); ride2.draw(ctxStub); }
  ok(MQ.player.map === 'petare', `saltar el viaje también llega (=${MQ.player.map})`);
  while (w.tb.active) w.press('a');
  // el mapa del Metro desde el menú de pausa
  w.openPause();
  w.press('down'); w.press('down'); w.press('a'); // EQUIPO→CUADERNO→MAPA
  ok(w.mapView === true && !w.menu, 'MAPA abre el mapa del Metro');
  w.draw(ctxStub);
  w.press('b');
  ok(w.mapView === false, 'el mapa se cierra con B');
}

// ---- 5b. la red completa (world2: 88 mapas del world bible) ----
section('Red');
{
  ok(Object.keys(MQ.MAPS).length >= 90, `la red completa está montada (${Object.keys(MQ.MAPS).length} mapas)`);
  // regiones representadas
  for (const mid of ['st_elsilencio', 'st_zoologico', 'st_larinconada', 'st_zonarental', 'gh_miranda_l5', 'sf_cumbre', 'cb_sanagustin', 'st_sanantonio'])
    ok(MQ.MAPS[mid], `mapa ${mid} existe`);
  // toda reja usa una bandera conocida
  const KNOWN_FLAGS = new Set(['starter', 'ficha1', 'ficha2', 'ficha3', 'ficha4', 'ficha5', 'ficha6', 'ficha7', 'ficha8',
    'fichas4', 'fichas5', 'fichas7', 'fichas8', 'tren', 'fichaoro', 'consejo', 'ending',
    'oficio_machete', 'oficio_nado', 'oficio_demolicion', 'oficio_teleferico']);
  for (const [mid, m] of Object.entries(MQ.MAPS))
    for (const w of m.warps || [])
      if (w.requires) ok(KNOWN_FLAGS.has(w.requires), `${mid}: reja usa bandera conocida (${w.requires})`);
  // las líneas del tren: cada parada es una estación real
  ok(MQ.LINES && Object.keys(MQ.LINES).length >= 6, 'las 6 líneas del tren existen');
  for (const [lid, line] of Object.entries(MQ.LINES))
    for (const s of line.stops) ok(MQ.MAPS[s] && MQ.MAPS[s].station, `línea ${lid}: parada ${s} es estación`);
  // banderas derivadas de fichas
  MQ.player = MQ.newPlayer('T', 'player');
  ['ficha1', 'ficha2', 'ficha3', 'ficha4', 'ficha5', 'ficha6', 'ficha7', 'ficha8'].forEach((f) => MQ.setFlag(f));
  ok(MQ.player.flags.fichas4 && MQ.player.flags.fichas5 && MQ.player.flags.fichas7 && MQ.player.flags.fichas8,
    'las 8 fichas derivan fichas4/5/7/8');
  // el transfer Capitolio -> El Silencio se cruza a pie con 4 fichas
  MQ.player = MQ.newPlayer('T', 'player');
  MQ.player.party = [MQ.makeMon('frontinito', 20)];
  MQ.player.flags.starter = true;
  ['ficha1', 'ficha2', 'ficha3', 'ficha4'].forEach((f) => MQ.setFlag(f));
  MQ.player.map = 'capitolio'; MQ.player.x = 18; MQ.player.y = 9; MQ.player.dir = 'down';
  MQ.scenes.length = 0;
  const w2 = new MQ.WorldScene();
  MQ.pushScene(w2);
  MQ.input.held.down = true;
  for (let i = 0; i < 300 && MQ.player.map === 'capitolio'; i++) w2.update();
  MQ.input.held.down = false;
  ok(MQ.player.map === 'st_elsilencio', `transfer a El Silencio funciona (=${MQ.player.map})`);
  // el tren de la Línea 2 ofrece destinos visitados
  MQ.player.visited.st_elsilencio = true; MQ.player.visited.st_capuchinos = true;
  const ts = MQ.MAPS.st_elsilencio.trainSpawn;
  MQ.player.x = ts.x; MQ.player.y = ts.y;
  w2.openTrain();
  ok(!!w2.menu && w2.menu.items.some((it) => it.value === 'st_capuchinos'), 'el tren de la Línea 2 ofrece Capuchinos');
  w2.press('b');
  // el módulo de atención de una estación generada cura
  MQ.player.map = 'st_elsilencio';
  w2.enterMap('st_elsilencio');
  MQ.player.x = 3; MQ.player.y = 7; MQ.player.dir = 'up';
  MQ.player.party[0].hp = 1;
  w2.interact();
  for (let i = 0; i < 60 && (w2.tb.active || w2.script); i++) { w2.update(); if (w2.tb.active) w2.press('a'); }
  ok(MQ.player.party[0].hp === MQ.player.party[0].maxhp, 'el Doctorcito de El Silencio cura');
  // una reja de oficio niega el paso
  MQ.player.map = 'st_altamira' in MQ.MAPS ? MQ.player.map : MQ.player.map;
  MQ.player.map = 'altamira';
  w2.enterMap('altamira');
  const door = MQ.MAPS.altamira.warps.find((w) => w.to === 'sf_puertaavila');
  ok(door && door.requires === 'oficio_machete', 'la Puerta del Ávila pide el machete');
}

// ---- 5c. la gente de la red (world3: jefes, tutores, estáticos, consejo) ----
section('Gente');
{
  // los 4 jefes nuevos existen con su recompensa
  const bosses = { boss5: ['st_zoologico', 'ficha5'], boss6: ['st_layaguara', 'ficha6'],
    boss7: ['st_larinconada', 'ficha7'], boss8: ['st_parquecentral', 'ficha8'] };
  for (const [bid, [mid, reward]] of Object.entries(bosses)) {
    const npc = (MQ.MAPS[mid].npcs || []).find((n) => n.trainer && n.trainer.id === bid);
    ok(npc, `jefe ${bid} vive en ${mid}`);
    ok(npc && npc.trainer.reward === reward, `jefe ${bid} entrega ${reward}`);
    ok(npc && npc.trainer.team.length >= 4, `jefe ${bid} tiene equipo serio (${npc && npc.trainer.team.length})`);
  }
  // jefes 7-8 con equipo de 6 (regla del spec §3)
  ok(MQ.MAPS.st_larinconada.npcs.find((n) => n.trainer && n.trainer.id === 'boss7').trainer.team.length === 6, 'la Amazona lleva 6');
  ok(MQ.MAPS.st_parquecentral.npcs.find((n) => n.trainer && n.trainer.id === 'boss8').trainer.team.length === 6, 'la Ingeniera lleva 6');
  // el Consejo: 4 ánimas encadenadas por showIf + el cierre
  const zr = MQ.MAPS.st_zonarental.npcs || [];
  for (let i = 1; i <= 4; i++) ok(zr.find((n) => n.trainer && n.trainer.id === 'consejo' + i), `ánima ${i} del Consejo existe`);
  ok(zr.find((n) => n.script === 'consejo:cierre'), 'la voz del Consejo cierra el rito');
  // tutor de oficio funciona: enseña la bandera y abre la reja
  MQ.player = MQ.newPlayer('T', 'player');
  MQ.player.party = [MQ.makeMon('frontinito', 20)];
  MQ.player.flags.starter = true;
  MQ.scenes.length = 0;
  const w3 = new MQ.WorldScene();
  MQ.pushScene(w3);
  w3.enterMap('calvario');
  const tutor = MQ.MAPS.calvario.npcs.find((n) => n.script === 'tutor:machete');
  ok(tutor, 'el Viejo Machetero está en el Calvario');
  MQ.player.x = tutor.x; MQ.player.y = tutor.y + 1; MQ.player.dir = 'up';
  w3.interact();
  for (let i = 0; i < 120 && (w3.tb.active || w3.script || w3.menu); i++) {
    w3.update();
    if (w3.tb.active) { w3.press('a'); continue; }
    if (w3.menu) { w3.press('a'); continue; }
  }
  ok(MQ.player.flags.oficio_machete, 'el tutor enseña el oficio del machete');
  // el jefe 5 se puede vencer y entrega la Ficha del Monte
  MQ.player = MQ.newPlayer('T', 'player');
  MQ.player.party = [MQ.makeMon('waraira', 60), MQ.makeMon('florentin', 60)];
  MQ.player.flags.starter = true;
  MQ.scenes.length = 0;
  const w4 = new MQ.WorldScene();
  MQ.pushScene(w4);
  w4.enterMap('st_zoologico');
  const jefe = MQ.MAPS.st_zoologico.npcs.find((n) => n.trainer && n.trainer.id === 'boss5');
  MQ.player.x = jefe.x; MQ.player.y = jefe.y + 1; MQ.player.dir = 'up';
  w4.interact();
  let guard = 0;
  while ((w4.tb.active || w4.script || MQ.scenes.length > 1) && guard++ < 8000) {
    const t = MQ.scenes[MQ.scenes.length - 1];
    t.update && t.update();
    if (t.tb && t.tb.active) { t.press('a'); continue; }
    if (t.phase === 'menu') { t.press('a'); continue; }
    if (t.phase === 'moves') {
      let idx = t.mine.moves.findIndex((m) => MQ.MOVES[m].pow > 0 && (t.mine.pp[m] ?? 0) > 0);
      if (idx < 0) idx = t.mine.moves.findIndex((m) => (t.mine.pp[m] ?? 0) > 0);
      if (idx < 0) { t.press('b'); continue; }
      for (let k = 0; k < Math.max(0, idx); k++) t.press('down');
      t.press('a'); continue;
    }
    if (t.phase === 'shift') { t.press('b'); continue; }
    if (t.phase === 'party') { if (Math.random() < 0.5) t.press('down'); t.press('a'); continue; }
    if (t.phase === 'bag' || t.phase === 'learn') { t.press('a'); continue; }
  }
  ok(MQ.player.flags.ficha5, `el Baquiano entrega la Ficha del Monte (guard=${guard})`);
  ok(MQ.player.flags.t_boss5, 'el jefe queda vencido');
  // el estático del Silbón aparece solo con su reja y se esfuma al ficharlo
  const sil = MQ.MAPS['tn_capuchinos__teatros'].npcs.find((n) => n.mon === 'silbon');
  ok(sil && sil.showIf === 'fichas7' && sil.hideIf === 'static_silbon', 'el Silbón estático respeta sus rejas');
}

// scripts de historia existen y devuelven listas
// la Tía que Cuida: dejar, caminar y recoger más grande
{
  MQ.player = MQ.newPlayer('T', 'player');
  MQ.player.party = [MQ.makeMon('chigui', 20), MQ.makeMon('frontinito', 18)];
  MQ.player.flags.starter = true;
  MQ.player.money = 2000;
  MQ.scenes.length = 0;
  const w = new MQ.WorldScene();
  MQ.pushScene(w);
  w.enterMap('st_caricuao');
  const tia = MQ.MAPS.st_caricuao.npcs.find((n) => n.script === 'tia:cuida');
  const talk = () => {
    MQ.player.x = tia.x; MQ.player.y = tia.y + 1; MQ.player.dir = 'up';
    w.interact();
    for (let i = 0; i < 200 && (w.tb.active || w.script || w.menu); i++) {
      w.update();
      if (w.tb.active) { w.press('a'); continue; }
      if (w.menu) { w.press('a'); continue; }
    }
  };
  talk();
  ok(!!MQ.player.daycare && MQ.player.party.length === 1, 'la Tía recibe al espanto');
  MQ.player.steps = (MQ.player.steps || 0) + 1024; // cuatro niveles de caminata
  talk();
  ok(!MQ.player.daycare && MQ.player.party.length === 2, 'la Tía lo devuelve');
  ok(MQ.player.party[1].lvl === 24, `el espanto creció con los pasos (N${MQ.player.party[1].lvl})`);
  // el Carretón ronda Los Teques tras el final
  MQ.player.flags.ending = true;
  const lt = MQ.MAPS['tn_independencia__carrizal'];
  ok(lt.region === 'losteques', 'los túneles del páramo conocen su región');
  // la Torre y el rematch de Cheo están en su sitio
  ok(MQ.MAPS.in_latorre.npcs.some((n) => n.script === 'torre:reto'), 'la Relojera espera en la Torre');
  ok(MQ.MAPS.st_sanantonio.npcs.some((n) => n.script === 'rival5' && n.showIf === 'ending'), 'Cheo entrena en San Antonio tras el final');
  // pistas musicales por región
  for (const [mid, track] of [['st_elsilencio', 'oeste'], ['st_labandera', 'sur'], ['st_teatros', 'teatros'], ['st_carrizal', 'paramo'], ['cb_laceiba', 'cable'], ['sf_neblina', 'avila']])
    ok(MQ.MAPS[mid].music === track, `${mid} suena a ${track} (=${MQ.MAPS[mid].music})`);
}

// ---- 5d. el kit FireRed: casetes, anzuelos, patineta, safari ----
section('Kit');
{
  MQ.player = MQ.newPlayer('T', 'player');
  MQ.player.party = [MQ.makeMon('chigui', 12)]; // 3 movimientos: hay campo pa'l casete
  MQ.player.flags.starter = true;
  MQ.player.bag = { casete01: 1, anzuelobueno: 1, patineta: 1 };
  MQ.scenes.length = 0;
  const w = new MQ.WorldScene();
  MQ.pushScene(w);
  const drain = () => { for (let i = 0; i < 30 && w.tb.active; i++) w.press('a'); };
  // casete: enseña Trancón desde la mochila
  w.enterMap('propatria');
  w.openBag();
  w.press('a'); // casete01
  w.press('a'); // chigui
  if (w.menu) w.press('a'); // (por si abre el menú de olvido)
  drain();
  w.menu = null;
  ok(MQ.player.party[0].moves.includes('trancon'), 'el casete enseña Trancón');
  ok(!MQ.player.bag.casete01, 'la cinta se gasta (un solo uso)');
  // pesca en Los Caobos (enc.sf_caobos tiene tabla de anzuelos)
  w.enterMap('sf_caobos');
  const g = MQ.MAPS.sf_caobos.grid;
  let spot = null;
  outer: for (let y = 1; y < g.length - 1; y++)
    for (let x = 1; x < g[y].length - 1; x++)
      if ((g[y][x] === 'W' || g[y][x] === 'f') && MQ.WALKABLE.has(g[y + 1][x])) { spot = [x, y]; break outer; }
  if (!spot) { // el generador no puso agua: siembra una fuente para pescar
    MQ.MAPS.sf_caobos.grid[10] = g[10].slice(0, 10) + 'f' + g[10].slice(11);
    spot = [10, 10];
    MQ.MAPS.sf_caobos.grid[11] = g[11].slice(0, 10) + '.' + g[11].slice(11);
  }
  MQ.player.x = spot[0]; MQ.player.y = spot[1] + 1; MQ.player.dir = 'up';
  drain();
  w.openBag();
  {
    const idx = w.menu.items.findIndex((it) => it.value === 'anzuelobueno');
    for (let k = 0; k < idx; k++) w.press('down');
    w.press('a');
  }
  ok(w.encFlash > 0 && w.pendingEnc, `el anzuelo engancha algo (${w.pendingEnc && w.pendingEnc.id})`);
  w.encFlash = 0; w.pendingEnc = null;
  // patineta: acelera fuera de estaciones
  w.enterMap('tunel1');
  drain();
  w.openBag();
  {
    const idx = w.menu.items.findIndex((it) => it.value === 'patineta');
    for (let k = 0; k < idx; k++) w.press('down');
    w.press('a');
  }
  drain();
  ok(MQ.player.skating === true, 'la patineta rueda en el túnel');
  // safari: los pasos se agotan y te devuelven a la taquilla
  MQ.player.skating = false;
  MQ.player.safariSteps = 2;
  w.enterMap('in_safari');
  MQ.player.x = 5; MQ.player.y = 6;
  w.arrived();
  w.arrived();
  ok(MQ.player.map === 'st_zoologico', `el safari te devuelve al agotar pasos (=${MQ.player.map})`);
  // la Coplera y el Olvidadizo están en su andén
  ok(MQ.MAPS.canoamarillo.npcs.some((n) => n.script === 'coplera'), 'la Coplera canta en Caño Amarillo');
  ok(MQ.MAPS.bellasartes.npcs.some((n) => n.script === 'olvidadizo'), 'el Olvidadizo olvida en Bellas Artes');
  ok(MQ.MAPS.sabanagrande.npcs.some((n) => n.script === 'regalo:patineta'), 'la patineta se regala en el bulevar');
}

// ---- 5e-pre. anti-softlock: el juego entero se completa jugando (world bible §9) ----
section('Camino crítico');
{
  // Fuentes de banderas: en qué mapa se gana cada bandera (jefes, tutores, ritos)
  // y qué requiere ganarla ahí mismo. Punto fijo: expandir alcance -> ganar
  // banderas -> expandir de nuevo, hasta estabilizar. Nada de teletransporte.
  const SOURCES = [
    { map: 'casa', gives: 'starter' },
    { map: 'propatria', gives: 'oficio_luz' },
    { map: 'calvario', gives: 'oficio_machete' },
    { map: 'capitolio', gives: 'ficha1' },
    { map: 'bellasartes', gives: 'oficio_empuje', needs: ['ficha2'] },
    { map: 'plazavenezuela', gives: 'ficha2' },
    { map: 'chacaito', gives: 'ficha3' },
    { map: 'mercado', gives: 'ficha4' },
    { map: 'st_elsilencio', gives: 'oficio_demolicion' },
    { map: 'st_zoologico', gives: 'ficha5' },
    { map: 'st_layaguara', gives: 'ficha6' },
    { map: 'st_layaguara', gives: 'oficio_nado', needs: ['ficha6'] },
    { map: 'st_larinconada', gives: 'ficha7' },
    { map: 'st_parquecentral', gives: 'ficha8' },
    { map: 'st_parquecentral', gives: 'oficio_teleferico' },
    { map: 'st_zonarental', gives: 'consejo', needs: ['fichas8'] },
    { map: 'lineafantasma', gives: 'fichaoro' },
    { map: 'gh_miranda_l5', gives: 'tren' },
    { map: 'gh_miranda_l5', gives: 'ending', needs: ['tren'] },
  ];
  const flags = new Set();
  const derive = () => {
    const owned = ['ficha1', 'ficha2', 'ficha3', 'ficha4', 'ficha5', 'ficha6', 'ficha7', 'ficha8'].filter((f) => flags.has(f)).length;
    for (const n of [4, 5, 7, 8]) if (owned >= n) flags.add('fichas' + n);
  };
  const reachable = new Set(['casa']);
  let changed = true;
  let rounds = 0;
  while (changed && rounds++ < 250) {
    changed = false;
    // expandir por warps cuyas rejas ya se cumplen
    const frontier = [...reachable];
    for (const mid of frontier) {
      for (const w of MQ.MAPS[mid].warps || []) {
        if (w.requires && !flags.has(w.requires)) continue;
        if (!reachable.has(w.to)) { reachable.add(w.to); changed = true; }
      }
    }
    // ganar banderas donde ya llegamos
    for (const s of SOURCES) {
      if (!reachable.has(s.map) || flags.has(s.gives)) continue;
      if (s.needs && !s.needs.every((f) => flags.has(f))) continue;
      flags.add(s.gives);
      derive();
      changed = true;
    }
  }
  ok(flags.has('starter') && flags.has('fichas4'), 'Acto 1 completable (4 fichas)');
  ok(flags.has('ficha5') && flags.has('ficha6'), 'Acto 2 completable (Zoológico y Guaire)');
  ok(flags.has('oficio_nado'), 'el Nado llega antes de su reja (anti-softlock §9)');
  ok(flags.has('ficha7') && flags.has('ficha8'), 'Acto 3 completable (Sur y Torre)');
  ok(flags.has('consejo') && flags.has('fichaoro'), 'Consejo y bendición alcanzables');
  ok(reachable.has('gh_miranda_l5') && flags.has('ending'), 'el final se alcanza JUGANDO, sin teletransporte');
  const unreachable = Object.keys(MQ.MAPS).filter((m) => !reachable.has(m));
  ok(unreachable.length === 0, `toda la red se abre al completar el juego (faltan: ${unreachable.join(',') || 'ninguno'})`);
}

// ---- 5e. el Cronista, el Bíper y los salvajes con carga ----
{
  // los hitos del Cuaderno premian (50 -> madrugadoras, 100 -> tornasol bendito)
  MQ.player = MQ.newPlayer('T', 'player');
  MQ.player.party = [MQ.makeMon('chigui', 10)];
  MQ.player.flags.starter = true;
  for (let i = 0; i < 50; i++) MQ.player.dexCaught[MQ.DEX_ORDER[i]] = true;
  MQ.scenes.length = 0;
  const w = new MQ.WorldScene();
  MQ.pushScene(w);
  w.enterMap('bellasartes');
  const cron = MQ.MAPS.bellasartes.npcs.find((n) => n.script === 'cronista');
  const habla = () => {
    MQ.player.x = cron.x; MQ.player.y = cron.y + 1; MQ.player.dir = 'up';
    w.interact();
    for (let i = 0; i < 60 && (w.tb.active || w.script); i++) { w.update(); if (w.tb.active) w.press('a'); }
  };
  habla();
  ok(MQ.player.flags.dex50 && MQ.player.bag.fichamadrugadora === 5, 'el Cronista premia los 50 fichados');
  for (let i = 50; i < 100; i++) MQ.player.dexCaught[MQ.DEX_ORDER[i]] = true;
  habla();
  ok(MQ.player.flags.tornasolbendito, 'los 100 fichados bendicen el tornasol');
  ok(MQ.shinyOdds() === 1365, `las probabilidades tornasol mejoran (1/${MQ.shinyOdds()})`);
  // el bíper: carga con pasos y reabre revanchas del mapa
  MQ.player.bag.biper = 1;
  MQ.player.flags.t_ramon = true;
  MQ.player.biperCharge = 100;
  w.enterMap('tunel1');
  w.openBag();
  {
    const idx = w.menu.items.findIndex((it) => it.value === 'biper');
    for (let k = 0; k < idx; k++) w.press('down');
    w.press('a');
  }
  ok(!MQ.player.flags.t_ramon, 'el Bíper reabre la revancha de Ramón');
  ok(MQ.player.biperCharge === 0, 'el Bíper queda descargado');
  for (let i = 0; i < 30 && w.tb.active; i++) w.press('a');
  // los salvajes a veces cargan fruta (5%) o potenciador (1%)
  let holds = 0;
  for (let i = 0; i < 600; i++) if (MQ.wildHold('chigui')) holds++;
  ok(holds > 3 && holds < 120, `los salvajes cargan objeto a la tasa esperada (${holds}/600)`);
}

for (const k of ['intro', 'abuela', 'heal', 'rival1', 'rival2', 'rival3', 'rival4', 'rival5', 'altar', 'trenfantasma', 'trenpasa', 'coleccionista', 'torre:reto', 'tia:cuida', 'coplera', 'olvidadizo', 'padrino', 'regalo:patineta', 'cronista', 'regalo:biper']) {
  MQ.player = MQ.newPlayer('T', 'player');
  MQ.player.party = [MQ.makeMon('frontinito', 5)];
  const s = MQ.SCRIPTS[k]();
  ok(Array.isArray(s) && s.length > 0, `script ${k} devuelve pasos`);
}

console.log(failures ? `\n✗ ${failures} fallos` : '\n✓ Todo pasó');
process.exit(failures ? 1 : 0);
