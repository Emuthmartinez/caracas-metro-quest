// Metro Quest — el Cuaderno de Espantos: los 150 del bestiario, 204 movimientos,
// 41 habilidades, 25 naturalezas y las matemáticas Gen-3 (systems-spec Fase 1).
// Los datos viven en js/gamedata.js (compilado de data/*.json); aquí se les da forma.
(() => {
  const MQ = (globalThis.MQ = globalThis.MQ || {});

  // ---- Tipos ---------------------------------------------------------------
  MQ.TYPES = {
    Criollo:   { color: '#b0a890' },
    Sabroso:   { color: '#e8a040' },
    Rumba:     { color: '#d94f8a' },
    Espanto:   { color: '#7a5ad9' },
    Catatumbo: { color: '#f5d76e' },
    Caribe:    { color: '#4a90d9' },
    Monte:     { color: '#5e8b3f' },
    Tepuy:     { color: '#9a8468' },
  };

  // atacante -> { defensor: multiplicador } (lo no listado es x1)
  MQ.CHART = {
    Criollo:   { Tepuy: 0.5 },
    Sabroso:   { Criollo: 2, Espanto: 0.5, Caribe: 0.5 },
    Rumba:     { Espanto: 2, Tepuy: 0.5, Rumba: 0.5 },
    Espanto:   { Criollo: 2, Rumba: 0.5, Tepuy: 0.5 },
    Catatumbo: { Caribe: 2, Rumba: 2, Tepuy: 0.5 },
    Caribe:    { Tepuy: 2, Monte: 0.5, Catatumbo: 0.5, Caribe: 0.5 },
    Monte:     { Caribe: 2, Tepuy: 2, Sabroso: 0.5, Espanto: 0.5, Monte: 0.5 },
    Tepuy:     { Catatumbo: 2, Espanto: 2, Caribe: 0.5, Monte: 0.5 },
  };
  MQ.effect = (atk, defTypes) =>
    defTypes.reduce((m, t) => m * ((MQ.CHART[atk] || {})[t] ?? 1), 1);

  // División físico/especial por tipo (Gen 3, GATE 0/Q3B)
  MQ.CATEGORY = {
    Criollo: 'physical', Sabroso: 'physical', Monte: 'physical', Tepuy: 'physical',
    Rumba: 'special', Espanto: 'special', Catatumbo: 'special', Caribe: 'special',
  };

  // ---- Movimientos (204, data/moves/moves.json) ------------------------------
  // Campos: name/name_en, type, category, pow, acc (null = no falla), pp,
  // priority, contact, effects[] (taxonomía spec §2.7), oficio, desc.
  MQ.MOVES = {};
  for (const mv of MQ.DATA.moves) {
    MQ.MOVES[mv.id] = {
      id: mv.id, name: mv.name_es, name_en: mv.name_en,
      type: mv.type, category: mv.category,
      pow: mv.power, acc: mv.accuracy, pp: mv.pp,
      priority: mv.priority || 0, contact: !!mv.contact,
      effects: mv.effects || [], oficio: !!mv.oficio,
      desc: mv.desc_es, desc_en: mv.desc_en,
    };
  }

  // ---- Estados (mayores + volátil) -------------------------------------------
  MQ.STATUS = {
    psn:  { name: 'ENV', color: '#9a4ad9', verb: 'quedó envenenado' },
    psn2: { name: 'ENV', color: '#7a2ab0', verb: 'quedó grave de veneno de mapanare' },
    par:  { name: 'PAR', color: '#f5d76e', verb: 'quedó paralizado' },
    slp:  { name: 'DRM', color: '#8a8aa0', verb: 'se quedó dormido' },
    que:  { name: 'QUE', color: '#e85a1a', verb: 'quedó quemado' },
    pav:  { name: 'PAV', color: '#8a8adf', verb: 'quedó empavado' },
  };
  // mareo es volátil: vive en los volátiles del combate (pvol/evol), no en el mon
  MQ.VOLATILE = { mareo: { name: 'MAREO', color: '#d98aa0', verb: 'quedó mareado por el gentío' } };

  // ---- Clima de combate (5 condiciones criollas, spec §2.4) -------------------
  MQ.WEATHER = {
    lluvia:  { name: 'Palo de agua',      desc: 'Llueve a cántaros sobre el andén.' },
    sol:     { name: 'Sol de esquina',    desc: 'Un sol de esquina raja las piedras.' },
    neblina: { name: 'Neblina del Ávila', desc: 'La neblina del Ávila lo cubre todo.' },
    apagon:  { name: 'Apagón',            desc: 'Se fue la luz. Otra vez.' },
    horapico:{ name: 'Hora pico',         desc: 'El gentío de la hora pico aprieta.' },
  };

  // ---- Habilidades (41, data/abilities/abilities.json) ------------------------
  MQ.ABILITIES = {};
  for (const ab of MQ.DATA.abilities)
    MQ.ABILITIES[ab.id] = { id: ab.id, name: ab.name_es, desc: ab.effect_es };

  // ---- Naturalezas (25, spec §2.5): ±10% -------------------------------------
  MQ.NATURES = {
    chevere: {}, pana: {}, vale: {}, chamo: {}, burda: {},
    guapo:      { plus: 'atk', minus: 'def' },
    arrecho:    { plus: 'atk', minus: 'spa' },
    peleon:     { plus: 'atk', minus: 'spd' },
    cabezon:    { plus: 'atk', minus: 'spe' },
    conchudo:   { plus: 'def', minus: 'atk' },
    aguantador: { plus: 'def', minus: 'spa' },
    terco:      { plus: 'def', minus: 'spd' },
    pachorrudo: { plus: 'def', minus: 'spe' },
    cuentero:   { plus: 'spa', minus: 'atk' },
    sonador:    { plus: 'spa', minus: 'def' },
    brujito:    { plus: 'spa', minus: 'spd' },
    poeta:      { plus: 'spa', minus: 'spe' },
    sereno:     { plus: 'spd', minus: 'atk' },
    confiao:    { plus: 'spd', minus: 'def' },
    calladito:  { plus: 'spd', minus: 'spa' },
    flojo:      { plus: 'spd', minus: 'spe' },
    ligero:     { plus: 'spe', minus: 'atk' },
    resbalao:   { plus: 'spe', minus: 'def' },
    callejero:  { plus: 'spe', minus: 'spa' },
    acelerao:   { plus: 'spe', minus: 'spd' },
  };
  MQ.NATURE_NAMES = {
    chevere: 'Chévere', pana: 'Pana', vale: 'Vale', chamo: 'Chamo', burda: 'Burda',
    guapo: 'Guapo', arrecho: 'Arrecho', peleon: 'Peleón', cabezon: 'Cabezón',
    conchudo: 'Conchudo', aguantador: 'Aguantador', terco: 'Terco', pachorrudo: 'Pachorrudo',
    cuentero: 'Cuentero', sonador: 'Soñador', brujito: 'Brujito', poeta: 'Poeta',
    sereno: 'Sereno', confiao: 'Confiao', calladito: 'Calladito', flojo: 'Flojo',
    ligero: 'Ligero', resbalao: 'Resbalao', callejero: 'Callejero', acelerao: 'Acelerao',
  };
  const NATURE_KEYS = Object.keys(MQ.NATURES);
  MQ.natureMul = (nat, stat) => {
    const n = MQ.NATURES[nat] || {};
    return n.plus === stat ? 1.1 : n.minus === stat ? 0.9 : 1;
  };

  // ---- Especies (150, data/creatures/creatures.json) --------------------------
  MQ.SPECIES = {};
  MQ.DEX_ORDER = [];
  for (const c of MQ.DATA.creatures) {
    const evolve = c.evolves_to
      ? { to: c.evolves_to.to, method: c.evolves_to.method,
          lvl: c.evolves_to.level, confianza: c.evolves_to.confianza }
      : undefined;
    const fb = (MQ.FALLBACK_ART || {})[c.id];
    MQ.SPECIES[c.id] = {
      num: c.num, name: c.name_es, name_en: c.name_en,
      types: c.types, category: c.category, region: c.region, habitats: c.habitats,
      budget: c.budget, base: c.base, catch: c.catch, exp_group: c.exp_group,
      gender: c.gender, abilities: c.abilities, ev_yield: c.ev_yield,
      learn: c.learnset, evolve,
      dex: c.dex_es, dex_en: c.dex_en,
      pal: fb && fb.pal, art: fb && fb.art,
    };
    MQ.DEX_ORDER.push(c.id);
  }

  // PRNG determinista para arte/gritos generados (mismo resultado en cada carga)
  const seeded = (seed) => {
    let s = seed >>> 0 || 1;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  };

  // Silueta pixel de respaldo para especies sin arte pintado (hasta que llegue
  // su PNG): un cuerpo simétrico determinista con los colores de sus tipos.
  const genArt = (id) => {
    const sp = MQ.SPECIES[id];
    const rng = seeded(sp.num * 7919 + 31);
    const c1 = MQ.TYPES[sp.types[0]].color;
    const c2 = sp.types[1] ? MQ.TYPES[sp.types[1]].color : '#2a2438';
    sp.pal = { k: '#1a1a1a', b: c1, d: c2, e: '#f2ead8' };
    const H = 12, W = 16, half = W / 2;
    const rows = [];
    // perfil de anchura: cabeza redonda, cuerpo, base
    for (let y = 0; y < H; y++) {
      const t = y / (H - 1);
      const bulge = Math.sin(Math.PI * (0.15 + 0.85 * t));
      const w = Math.max(2, Math.round((2 + bulge * 5) + rng() * 1.5));
      let row = '';
      for (let x = 0; x < half; x++) {
        const dist = half - 1 - x;
        if (dist < w - 1) row += (y > 2 && y % 3 === 0 && dist < 2) ? 'd' : 'b';
        else if (dist === w - 1) row += 'k';
        else row += '.';
      }
      rows.push(row + row.split('').reverse().join(''));
    }
    // ojos en la fila 3
    const eye = rows[3].split('');
    if (eye[5] !== '.') eye[5] = 'e';
    if (eye[10] !== '.') eye[10] = 'e';
    rows[3] = eye.join('');
    sp.art = rows;
  };
  for (const id of MQ.DEX_ORDER) if (!MQ.SPECIES[id].art) genArt(id);

  // ---- Gritos ------------------------------------------------------------------
  // Los 29 canon vienen afinados a mano (js/art.js); el resto se genera con un
  // motivo por categoría/tipo/porte, determinista por número de dex.
  MQ.CRIES = Object.assign({}, MQ.CRIES_CANON || {});
  const genCry = (id) => {
    const sp = MQ.SPECIES[id];
    const rng = seeded(sp.num * 2654435761 + 97);
    const big = sp.budget === 's3' || sp.budget === 'leg';
    const segs = [];
    if (sp.category === 'folklore') {
      // lamento: senos que suben y bajan, con un soplo de ruido
      const f = 380 + Math.round(rng() * 420);
      segs.push(['b', f, 0.22 + rng() * 0.15, 'sine', 0.05, 0, Math.round(200 + rng() * 300)]);
      segs.push(['b', Math.round(f * 1.4), 0.3, 'sine', 0.045, 0.24, -Math.round(300 + rng() * 300)]);
      if (rng() < 0.6) segs.push(['n', 0.18, 0.03, 0.1]);
    } else if (sp.category === 'urban-magical') {
      // electrónico: blips cuadrados con algún chispazo
      const f = 700 + Math.round(rng() * 900);
      segs.push(['b', f, 0.06, 'square', 0.05, 0, 0]);
      segs.push(['b', Math.round(f * (1.1 + rng() * 0.4)), 0.07, 'square', 0.05, 0.08, 0]);
      if (rng() < 0.5) segs.push(['b', Math.round(f * 0.8), 0.1, 'square', 0.045, 0.17, -Math.round(rng() * 400)]);
      else segs.push(['n', 0.06, 0.04, 0.16]);
    } else if (big) {
      // fauna grande: gruñido de sierra con peso
      const f = 120 + Math.round(rng() * 220);
      segs.push(['n', 0.12, 0.04, 0]);
      segs.push(['b', f, 0.3 + rng() * 0.15, 'sawtooth', 0.06, 0.02, -Math.round(20 + rng() * 60)]);
      segs.push(['b', Math.round(f * 0.7), 0.25, 'triangle', 0.05, 0.3, -20]);
    } else {
      // fauna chica: chirridos vivos
      const f = 800 + Math.round(rng() * 900);
      segs.push(['b', f, 0.07, rng() < 0.5 ? 'square' : 'triangle', 0.05, 0, Math.round(rng() * 200)]);
      segs.push(['b', Math.round(f * (0.8 + rng() * 0.5)), 0.08, 'square', 0.05, 0.09, 0]);
      if (rng() < 0.5) segs.push(['b', Math.round(f * 1.2), 0.1, 'square', 0.045, 0.18, -150]);
    }
    MQ.CRIES[id] = segs;
  };
  for (const id of MQ.DEX_ORDER) if (!MQ.CRIES[id]) genCry(id);

  // ---- Cálculos Gen 3 -----------------------------------------------------------
  // Grupos de experiencia (spec §1.3): 4 curvas cúbicas
  MQ.XP_GROUPS = { rapido: 0.8, parejo: 1, pausado: 1.15, lento: 1.3 };
  MQ.xpForLevel = (l, group) =>
    Math.floor(l * l * l * (MQ.XP_GROUPS[group || 'parejo'] || 1));
  MQ.xpGroupOf = (id) => (MQ.SPECIES[id] && MQ.SPECIES[id].exp_group) || 'parejo';

  const STATS6 = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
  MQ.STATS6 = STATS6;
  MQ.STAT_NAMES = { hp: 'PS', atk: 'Ataque', def: 'Defensa', spa: 'At. Esp', spd: 'Def. Esp', spe: 'Velocidad', acc: 'puntería', eva: 'evasión' };

  // Fórmula Gen 3 textual (spec §1.3). ivs/evs/nature opcionales (0/0/neutra).
  MQ.calcStats = (id, lvl, ivs, evs, nature) => {
    const b = MQ.SPECIES[id].base;
    const iv = ivs || {}, ev = evs || {};
    const st = {};
    for (const s of STATS6) {
      const core = Math.floor((2 * b[s] + (iv[s] || 0) + Math.floor((ev[s] || 0) / 4)) * lvl / 100);
      st[s] = s === 'hp'
        ? core + lvl + 10
        : Math.floor((core + 5) * MQ.natureMul(nature, s));
    }
    return st;
  };

  MQ.movesAtLevel = (id, lvl) =>
    MQ.SPECIES[id].learn.filter(([l]) => l <= lvl).map(([, m]) => m).slice(-4);

  // 1 de cada SHINY_ODDS sale "tornasol" (spec §1.4: probabilidad moderna);
  // el Tornasol Bendito (100 fichados) mejora la suerte a 1/1365
  MQ.SHINY_ODDS = 4096;
  MQ.shinyOdds = () =>
    (MQ.player && MQ.player.flags && MQ.player.flags.tornasolbendito) ? 1365 : MQ.SHINY_ODDS;

  // objeto equipado de los salvajes (spec §1.4): 5% fruta del estado, 1% potenciador
  const TYPE_BOOST = { Criollo: 'franelabarrio', Sabroso: 'ajidulce', Rumba: 'cuatroafinado',
    Espanto: 'cintamorada', Catatumbo: 'bombilloahorrador', Caribe: 'aguaanauco',
    Monte: 'macheteviejo', Tepuy: 'piedraabuelo' };
  MQ.wildHold = (id) => {
    const r = Math.random();
    if (r < 0.01) return TYPE_BOOST[MQ.SPECIES[id].types[0]] || null;
    if (r < 0.05) return MQ.pick(['mamon', 'semeruco', 'guanabana', 'tamarindo', 'parchita', 'lechosapicada', 'merey']);
    return null;
  };

  MQ.rollIVs = () => {
    const iv = {};
    for (const s of STATS6) iv[s] = MQ.rand(32);
    return iv;
  };
  MQ.zeroEVs = () => ({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 });

  const rollGender = (sp) => {
    if (sp.gender === 'genderless' || !sp.gender) return null;
    return Math.random() * 100 < sp.gender.m ? 'm' : 'f';
  };
  const rollAbility = (sp, hidden) => {
    const ab = sp.abilities || {};
    if (hidden && ab.hidden) return ab.hidden;
    if (ab.secondary && Math.random() < 0.5) return ab.secondary;
    return ab.primary || null;
  };

  // opts: {shiny, ability, ivs, nature, hidden} — o un booleano (compat: shiny)
  MQ.makeMon = (id, lvl, opts) => {
    if (typeof opts === 'boolean') opts = { shiny: opts };
    opts = opts || {};
    const sp = MQ.SPECIES[id];
    const ivs = opts.ivs || MQ.rollIVs();
    const evs = MQ.zeroEVs();
    const nature = opts.nature || NATURE_KEYS[MQ.rand(NATURE_KEYS.length)];
    const st = MQ.calcStats(id, lvl, ivs, evs, nature);
    const m = {
      id, lvl, xp: MQ.xpForLevel(lvl, sp.exp_group),
      hp: st.hp, maxhp: st.hp,
      atk: st.atk, def: st.def, spa: st.spa, spd: st.spd, spe: st.spe,
      ivs, evs, nature,
      gender: rollGender(sp),
      ability: opts.ability || rollAbility(sp, opts.hidden),
      item: opts.item || null,
      confianza: 70,
      moves: MQ.movesAtLevel(id, lvl),
      status: null, pp: {},
      shiny: opts.shiny ?? (MQ.rand(MQ.shinyOdds()) === 0),
    };
    MQ.ensurePP(m);
    return m;
  };

  // Recalcula las 6 estadísticas al nivel actual conservando la fracción de PS.
  MQ.recalcStats = (m) => {
    const frac = m.maxhp > 0 ? m.hp / m.maxhp : 1;
    const st = MQ.calcStats(m.id, m.lvl, m.ivs, m.evs, m.nature);
    m.maxhp = st.hp;
    m.hp = m.hp <= 0 ? 0 : Math.max(1, Math.round(st.hp * frac));
    m.atk = st.atk; m.def = st.def; m.spa = st.spa; m.spd = st.spd; m.spe = st.spe;
    return m;
  };

  // Migración de partidas v1 (4 stats, sin IVs): se les da chispa, calle y
  // naturaleza, y el viejo `spd` (velocidad) pasa a ser `spe`.
  MQ.migrateMon = (m) => {
    if (!m || m.ivs) return m;
    const sp = MQ.SPECIES[m.id];
    if (!sp) return m;
    m.ivs = MQ.rollIVs();
    m.evs = MQ.zeroEVs();
    m.nature = NATURE_KEYS[MQ.rand(NATURE_KEYS.length)];
    m.gender = m.gender ?? rollGender(sp);
    m.ability = m.ability || rollAbility(sp);
    m.item = m.item || null;
    m.confianza = m.confianza ?? 70;
    m.xp = Math.max(m.xp || 0, MQ.xpForLevel(m.lvl, sp.exp_group)); // no se pierde lo caminado
    MQ.recalcStats(m);
    return m;
  };

  // rellena PP faltantes (también migra partidas guardadas viejas)
  MQ.ensurePP = (m) => {
    MQ.migrateMon(m);
    m.pp = m.pp || {};
    for (const mv of m.moves) if (m.pp[mv] === undefined && MQ.MOVES[mv]) m.pp[mv] = MQ.MOVES[mv].pp;
    return m;
  };

  // curación completa: PS, estado, mareo y PP (módulo, abuela, respawn)
  MQ.fullHeal = (m) => {
    MQ.migrateMon(m);
    m.hp = m.maxhp;
    m.status = null;
    m.pp = {};
    MQ.ensurePP(m);
  };

  MQ.expYield = (id) => {
    const b = MQ.SPECIES[id].base;
    const bst = b.hp + b.atk + b.def + b.spa + b.spd + b.spe;
    return Math.round(bst * 0.3);
  };

  // ---- Ítems ----------------------------------------------------------------
  // ball: multiplicador de captura (Gen 3). ballIf: condición ('status'|'dark').
  // heal/cure/revive: uso de campo/combate. ev: vitamina +10 calle.
  // battleStage: X-item (+1 etapa en combate). hold: efecto como objeto equipado.
  // repel: pasos de esencia. cures: fruta equipada que se auto-cura ese estado.
  MQ.ITEMS = {
    // — fichas (capture, spec §1.5) —
    ficha:     { name: 'Ficha del Metro',   price: 30,  desc: 'Ficha amarilla del 83. Lánzala para fichar un espanto salvaje.', ball: 1 },
    fichaferia:{ name: 'Ficha de Feria',    price: 90,  desc: 'Del tobo de fichas del buhonero. Rinde más de lo que parece.', ball: 1.5 },
    fichaplus: { name: 'Ficha Dorada',      price: 150, desc: 'Ficha conmemorativa pulida con Brasso. Los espantos la respetan.', ball: 2 },
    ficharayada: { name: 'Ficha Rayada',    price: 130, desc: 'Rayada en el torniquete. Muerde el triple si el espanto está afligido.', ball: 1, ballIf: { status: 3 } },
    fichamadrugadora: { name: 'Ficha Madrugadora', price: 130, desc: 'De la primera cola de la mañana. En túnel y zona oscura vale por cuatro.', ball: 1, ballIf: { dark: 4 } },
    fichaoro:  { name: 'Ficha de Oro',      price: 0,   desc: 'Bendecida en la montaña de Sorte. No falla jamás.', ball: 255 },
    // — curación —
    malta:     { name: 'Maltín frío',       price: 20,  desc: 'Restaura 30 PS. La merienda de los campeones.', heal: 30 },
    cafe:      { name: 'Marroncito',        price: 45,  desc: 'Restaura 70 PS. Oscuro, dulce y de máquina de estación.', heal: 70 },
    golfeado:  { name: 'Golfeado',          price: 90,  desc: 'Restaura todos los PS. Con queso de mano encima, obvio.', heal: 9999 },
    cocada:    { name: 'Cocada',            price: 120, desc: 'Revive a un espanto debilitado con la mitad de sus PS.', revive: 0.5 },
    aguacoco:  { name: 'Agua de Coco',      price: 60,  desc: 'Cura cualquier mal: veneno, parálisis, sueño, quemadura o pava.', cure: true },
    sancocho:  { name: 'Sancocho Completo', price: 200, desc: 'Restaura todos los PS y cura cualquier mal. Cocinado a fuego lento.', heal: 9999, cure: true },
    cariaquitodoble: { name: 'Cariaquito Doble', price: 320, desc: 'Revive a un espanto debilitado con todos sus PS. Morado, del bueno.', revive: 1 },
    // — vitaminas (+10 de calle, spec §1.9) —
    carnemechada: { name: 'Carne Mechada',  price: 950, desc: '+10 de calle en Ataque. La fibra del pabellón.', ev: 'atk' },
    tajada:    { name: 'Tajada',            price: 950, desc: '+10 de calle en Defensa. Dulce escudo de plátano.', ev: 'def' },
    papelon:   { name: 'Papelón con Limón', price: 950, desc: '+10 de calle en At. Esp. Energía de la buena.', ev: 'spa' },
    quesorallado: { name: 'Queso Rallado',  price: 950, desc: '+10 de calle en Def. Esp. Llanero curado.', ev: 'spd' },
    cafecerrero: { name: 'Café Cerrero',    price: 950, desc: '+10 de calle en Velocidad. Sin azúcar y sin perdón.', ev: 'spe' },
    hervido:   { name: 'Hervido de Gallina', price: 950, desc: '+10 de calle en PS. Levanta muertos, dicen.', ev: 'hp' },
    // — X-items (combate) —
    xarrechera:{ name: 'X Arrechera',       price: 90, desc: 'Sube el Ataque en combate. Úsala con respeto.', battleStage: 'atk' },
    xconcha:   { name: 'X Concha',          price: 90, desc: 'Sube la Defensa en combate. Dura como concha e coco.', battleStage: 'def' },
    xlabia:    { name: 'X Labia',           price: 90, desc: 'Sube el At. Esp en combate. Pura elocuencia.', battleStage: 'spa' },
    xaguante:  { name: 'X Aguante',         price: 90, desc: 'Sube la Def. Esp en combate. Aguanta callao.', battleStage: 'spd' },
    xpilas:    { name: 'X Pilas',           price: 90, desc: 'Sube la Velocidad en combate. ¡Ponte las pilas!', battleStage: 'spe' },
    estampa:   { name: 'Estampa de Ajedrez', price: 90, desc: 'Afina la puntería crítica en combate, como jugada del bulevar.', battleStage: 'crit' },
    // — esencias (repelente, spec §1.8) —
    azabache:  { name: 'Esencia de Azabache', price: 80,  desc: 'Protección de azabache: 100 pasos sin espantos salvajes débiles.', repel: 100 },
    azabachedoble: { name: 'Azabache Doble', price: 140, desc: 'Doble protección: 200 pasos sin espantos salvajes débiles.', repel: 200 },
    contrafirmada: { name: 'Contra Firmada', price: 190, desc: 'Contra firmada por quien sabe: 300 pasos de tranquilidad.', repel: 300 },
    // — objetos equipables (spec §2.9) —
    tajadaplatano: { name: 'Tajada de Plátano', price: 400, desc: 'Equipado: recupera 1/16 de PS cada ronda. Siempre cae bien.', hold: 'leftovers' },
    garracunaguaro: { name: 'Garra de Cunaguaro', price: 400, desc: 'Equipado: 20% de moverse primero. Reflejos de monte.', hold: 'quickclaw' },
    monedalocha: { name: 'Moneda de Locha', price: 400, desc: 'Equipado: 10% de amedrentar al golpear. Una locha con historia.', hold: 'kingsrock' },
    huevoguacharaca: { name: 'Huevo de Guacharaca', price: 500, desc: 'Equipado: gana 1.5x de experiencia. Madruga como su madre.', hold: 'luckyegg' },
    morocota:  { name: 'Morocota',          price: 500, desc: 'Equipado: dobla los bolos ganados en duelos. Oro del de antes.', hold: 'amuletcoin' },
    mediaarepa: { name: 'Media Arepa',      price: 500, desc: 'Equipado: al que la carga le llega la mitad de la experiencia sin pelear. Compartir es de panas.', hold: 'expshare' },
    campanavagon: { name: 'Campana del Vagón', price: 450, desc: 'Equipado: recupera 1/8 del daño que causa. Din, don.', hold: 'shellbell' },
    azabachepulsera: { name: 'Azabache de Pulsera', price: 450, desc: 'Equipado: 10% de aguantar a 1 PS un golpe fatal.', hold: 'focusband' },
    polvomariposa: { name: 'Polvo de Mariposa', price: 450, desc: 'Equipado: evasión x1.1. De las mariposas amarillas del andén.', hold: 'brightpowder' },
    franelabarrio: { name: 'Franela del Barrio', price: 350, desc: 'Equipado: movimientos Criollo x1.1. Sudada con orgullo.', hold: 'boost', boostType: 'Criollo' },
    ajidulce:  { name: 'Ají Dulce',         price: 350, desc: 'Equipado: movimientos Sabroso x1.1. El secreto de toda cocina.', hold: 'boost', boostType: 'Sabroso' },
    cuatroafinado: { name: 'Cuatro Afinado', price: 350, desc: 'Equipado: movimientos Rumba x1.1. Afinado por la Coplera.', hold: 'boost', boostType: 'Rumba' },
    cintamorada: { name: 'Cinta Morada',    price: 350, desc: 'Equipado: movimientos Espanto x1.1. De un velorio con buena fiesta.', hold: 'boost', boostType: 'Espanto' },
    bombilloahorrador: { name: 'Bombillo Ahorrador', price: 350, desc: 'Equipado: movimientos Catatumbo x1.1. Alumbra bajito pero seguro.', hold: 'boost', boostType: 'Catatumbo' },
    aguaanauco: { name: 'Agua del Anauco',  price: 350, desc: 'Equipado: movimientos Caribe x1.1. Del río que la ciudad enterró.', hold: 'boost', boostType: 'Caribe' },
    macheteviejo: { name: 'Machete Viejo',  price: 350, desc: 'Equipado: movimientos Monte x1.1. Heredado y bien amolado.', hold: 'boost', boostType: 'Monte' },
    piedraabuelo: { name: 'Piedra del Abuelo', price: 350, desc: 'Equipado: movimientos Tepuy x1.1. Traída de la Gran Sabana.', hold: 'boost', boostType: 'Tepuy' },
    // — frutas (equipadas: auto-cura, spec §2.9) —
    mamon:     { name: 'Mamón',             price: 60, desc: 'Equipada: se la come para curarse la parálisis.', hold: 'fruta', cures: 'par' },
    semeruco:  { name: 'Semeruco',          price: 60, desc: 'Equipada: se la come para curarse la quemadura.', hold: 'fruta', cures: 'que' },
    guanabana: { name: 'Guanábana',         price: 60, desc: 'Equipada: se la come para despertarse del sueño.', hold: 'fruta', cures: 'slp' },
    tamarindo: { name: 'Tamarindo',         price: 60, desc: 'Equipada: se la come para curarse el veneno.', hold: 'fruta', cures: 'psn' },
    parchita:  { name: 'Parchita',          price: 60, desc: 'Equipada: se la come para quitarse la pava de encima.', hold: 'fruta', cures: 'pav' },
    lechosapicada: { name: 'Lechosa Picada', price: 60, desc: 'Equipada: se la come para que se le pase el mareo.', hold: 'fruta', cures: 'mareo' },
    merey:     { name: 'Merey',             price: 60, desc: 'Equipada: se lo come al estar grave y recupera 10 PS.', hold: 'fruta', heals: 10 },
    // — casetes (TMs de un solo uso, spec §1.6: "casetes quemados del bulevar") —
    casete01:  { name: 'Casete 01 · Trancón', price: 400, desc: 'Enseña TRANCÓN (Criollo, atrapa al rival). Un solo uso, como todo casete pirata.', casete: 'trancon' },
    casete02:  { name: 'Casete 02 · Sablazo', price: 450, desc: 'Enseña SABLAZO (Criollo, drena la mitad del daño). Grabado en vivo.', casete: 'sablazo' },
    casete03:  { name: 'Casete 03 · Aguante', price: 500, desc: 'Enseña AGUANTE (se restea y bloquea el golpe). Lado B rayado.', casete: 'aguante' },
    casete04:  { name: 'Casete 04 · La Vaca', price: 600, desc: 'Enseña LA VACA (dobla los bolos del duelo). El favorito del buhonero.', casete: 'lavaca' },
    casete05:  { name: 'Casete 05 · Salto Ángel', price: 900, desc: 'Enseña SALTO ÁNGEL (Tepuy, se eleva y cae al turno siguiente). Épico.', casete: 'saltoangel' },
    casete06:  { name: 'Casete 06 · Cardonal', price: 550, desc: 'Enseña CARDONAL (siembra púas en el andén rival). Con espinas y todo.', casete: 'cardonal' },
    casete07:  { name: 'Casete 07 · Velorio', price: 700, desc: 'Enseña VELORIO (Espanto: paga vida y señala al rival). No apto pa\' pavosos.', casete: 'velorio' },
    casete08:  { name: 'Casete 08 · Madrugón', price: 400, desc: 'Enseña MADRUGÓN (Criollo, pega primero al amanecer del turno).', casete: 'madrugon' },
    // — anzuelos (spec §1.8: fuentes, pozos y el Guaire) —
    anzueloviejo: { name: 'Anzuelo Viejo',  price: 150, desc: 'Pesca en fuentes y pozos. Oxidado pero digno: pica lo común.', rod: 'viejo' },
    anzuelobueno: { name: 'Anzuelo Bueno',  price: 400, desc: 'Pesca mejor: lo raro del agua se asoma.', rod: 'bueno' },
    anzuelosuper: { name: 'Anzuelo Súper',  price: 900, desc: 'El anzuelo de los cuentos. Lo que pique, respétalo.', rod: 'super' },
    // — la patineta (la "bici" criolla, regalo de Sabana Grande) —
    patineta:  { name: 'La Patineta',       price: 0, desc: 'Rueda al doble de velocidad. En los andenes de estación el operador la mira feo.', patineta: true },
    biper:     { name: 'El Bíper',          price: 0, desc: 'Pager noventero: al cargarse con 100 pasos, avisa a los entrenadores del mapa que quieres la revancha.', biper: true },
    rastreador: { name: 'El Rastreador',    price: 0, desc: 'Antena de zahorí urbano: vibra hacia lo que la gente enterró pa\' olvidarlo. Se usa desde la mochila.', finder: true },
    cholas:    { name: 'Las Cholas',        price: 0, desc: 'Deportivas del Maratón del Metro del 83. Sostén B mientras caminas y trota: el andén es pista.', cholas: true },
  };
})();
