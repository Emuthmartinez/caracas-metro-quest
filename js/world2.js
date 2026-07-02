// Metro Quest — la red completa (world bible, Fase 2): genera los 70 mapas
// nuevos desde data/maps (Líneas 2-5, superficie, Ávila, Metrocables, Los
// Teques), cose los warps con sus rejas, abre puertas nuevas en los mapas
// canon de la Línea 1 y convierte el tren en una red de varias líneas.
(() => {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  const D = MQ.DATA && MQ.DATA.maps;
  if (!D) return;

  // Los 18 mapas canon del Acto 1 conservan sus grillas pintadas a mano; las
  // zonas de superficie que ya existían (Calvario, Mercado) también.
  const CANON = Object.assign({}, D.canon_map, {
    sf_calvario: 'calvario',
    sf_mercadopetare: 'mercado',
  });
  const resolve = (id) => CANON[id] || id;

  // reja de cada conexión -> bandera del jugador + mensaje del operador
  const GATE_FLAG = {
    'fichas>=4': 'fichas4', 'fichas>=5': 'fichas5', 'fichas>=7': 'fichas7', 'fichas>=8': 'fichas8',
    'oficio.machete': 'oficio_machete', 'oficio.nado': 'oficio_nado',
    'oficio.demolicion': 'oficio_demolicion', 'oficio.teleferico': 'oficio_teleferico',
    'flag.tren_resuelto': 'tren', 'flag.bendicion': 'fichaoro', 'flag.consejo': 'consejo',
  };
  const GATE_MSG = {
    fichas4: 'OPERADOR: Este paso abre cuando tengas las 4 Fichas Doradas de la Línea 1. Reglas de la hora fantasma.',
    fichas5: 'OPERADOR: Sin la Ficha del Monte no hay paso al sur. Gánatela en el Zoológico.',
    fichas7: 'OPERADOR: La Línea 4 abre con la Ficha del Sur. La Amazona de La Rinconada la custodia.',
    fichas8: 'OPERADOR: Zona Rental es el umbral. Ocho Fichas Doradas o nada, chamo.',
    oficio_machete: 'El monte está crecido y cerrado. Con el oficio del MACHETE se abriría camino.',
    oficio_nado: 'El tramo está inundado hasta el techo. Sin el oficio del NADO, ni lo intentes.',
    oficio_demolicion: 'Un derrumbe tapa el paso. Hace falta el oficio de DEMOLICIÓN.',
    oficio_teleferico: 'La cabina del Metrocable no baja sola. El oficio del TELEFÉRICO la llama.',
    tren: 'La puerta hacia Los Teques está sellada. Dicen que solo se abre cuando el Tren Fantasma descanse.',
    fichaoro: 'MARÍA LIONZA espera al final del andén. Sin su bendición, la Línea Fantasma no te deja entrar.',
    consejo: 'EL CONSEJO DE LA HORA FANTASMA aguarda. Nadie baja a la Línea Fantasma sin pasar por ellos.',
  };

  const rep = (c, n) => c.repeat(n);
  const set = (g, x, y, ch) => { g[y] = g[y].slice(0, x) + ch + g[y].slice(x + 1); };

  // ---- plantillas de grilla por tipo ------------------------------------------
  // Regla de oro: la decoración sólida va en una retícula dispersa (nunca dos
  // sólidos adyacentes) sobre campo abierto: la conectividad queda garantizada.
  const sparse = (x, y, mod, salt) => ((x * 7 + y * 13 + salt) % mod === 0) && x % 2 === 0 && y % 2 === 1;

  function gridStation(w, h, seed, ghost) {
    const g = [];
    g[0] = rep('#', w);
    g[1] = '#' + rep('T', w - 2) + '#';
    g[2] = '#' + rep(ghost ? '~' : 'M', w - 2) + '#';
    for (let y = 3; y < h - 1; y++) {
      let r = '';
      for (let x = 0; x < w; x++) {
        if (x === 0 || x === w - 1) r += '#';
        else if (y >= 6 && y < h - 3 && sparse(x, y, 23, seed)) r += 'P';
        else if (!ghost && y === 6 && x === 3) r += 'H';
        else if (!ghost && y === 6 && x === w - 5) r += 'S';
        else if (!ghost && y === 9 && (x === 8 || x === 9)) r += 'B';
        else if (ghost && y >= 8 && y < h - 4 && Math.sin(x * 0.5 + y * 1.3 + seed) > 0.35) r += '~';
        else r += (x * 7 + y * 13 + seed) % 11 === 0 ? ',' : '.';
      }
      g[y] = r;
    }
    g[h - 1] = rep('#', w);
    return g;
  }

  function gridTunnel(w, h, seed, paradas) {
    const g = [];
    g[0] = rep('#', w);
    g[1] = rep('T', w);
    for (let y = 2; y < h - 1; y++) {
      let r = '';
      for (let x = 0; x < w; x++) {
        if (x === 0 || x === w - 1) r += '#';
        else if (y >= 4 && y < h - 2 && sparse(x, y, 31, seed)) r += 'P';
        else if (y >= 3 && y < h - 2 && Math.sin(x * 0.42 + y * 1.7 + seed) > 0.1) r += '~';
        else r += '.';
      }
      g[y] = r;
    }
    g[h - 1] = rep('#', w);
    // pasarela superior siempre despejada
    g[2] = '#' + g[2].slice(1, w - 1).replace(/[P~]/g, '.') + '#';
    // paradas menores: alcobas iluminadas (sin zona oscura) con su banca
    paradas.forEach((pm, i) => {
      const cx = Math.round(((i + 1) * w) / (paradas.length + 1));
      for (let y = 3; y < h - 2; y++)
        for (let x = cx - 2; x <= cx + 2; x++)
          if (x > 0 && x < w - 1) set(g, x, y, ',');
      set(g, cx, h - 3, 'B');
    });
    return g;
  }

  function gridSurface(w, h, seed) {
    const g = [];
    for (let y = 0; y < h; y++) {
      let r = '';
      for (let x = 0; x < w; x++) {
        if (x === 0 || x === w - 1 || y === 0 || y === h - 1) r += '#';
        else if (sparse(x, y, 19, seed)) r += 't';
        else if (Math.sin(x * 0.35 + seed) + Math.cos(y * 0.45 + seed) > 0.8) r += 'g';
        else r += (x * 7 + y * 13 + seed) % 13 === 0 ? ',' : '.';
      }
      g[y] = r;
    }
    return g;
  }

  function gridCable(w, h, seed) {
    const g = [];
    for (let y = 0; y < h; y++) {
      let r = '';
      for (let x = 0; x < w; x++) {
        if (x === 0 || x === w - 1 || y === 0 || y === h - 1) r += '#';
        else if (y === 2 && x > 2 && x < w - 3) r += 'T'; // el cable pasa por arriba
        else if (y >= 5 && sparse(x, y, 17, seed)) r += 'k';
        else if (y >= 5 && Math.sin(x * 0.6 + y * 0.9 + seed) > 0.55) r += 'g'; // azoteas
        else r += (x * 5 + y * 11 + seed) % 12 === 0 ? ',' : '.';
      }
      g[y] = r;
    }
    return g;
  }

  function gridInterior(w, h, seed) {
    const g = [];
    for (let y = 0; y < h; y++) {
      let r = '';
      for (let x = 0; x < w; x++) {
        if (x === 0 || x === w - 1 || y === 0 || y === h - 1) r += '#';
        else if (y === 3 && x >= 4 && x <= w - 5 && x % 4 === 0) r += 'm';
        else r += '.';
      }
      g[y] = r;
    }
    return g;
  }

  // ---- construcción -------------------------------------------------------------
  const THEME = { station: 'metro', tunnel: 'tunel', surface: 'calle', cable: 'calle', ghost: 'ghost', interior: 'casa' };
  const MUSIC = { station: 'town', tunnel: 'tunnel', surface: 'calle', cable: 'calle', ghost: 'ghost', interior: 'town' };
  // cada región suena distinto (Fase 8-lite): pista propia por línea/zona
  const REGION_MUSIC = {
    linea2: 'oeste', linea3: 'sur', linea4: 'teatros', linea5: 'ghost',
    losteques: 'paramo', avila: 'avila',
    metrocable_sanagustin: 'cable', metrocable_mariche: 'cable',
  };
  const NEW_SHOP = ['ficha', 'fichaferia', 'fichaplus', 'ficharayada', 'fichamadrugadora', 'malta', 'cafe', 'golfeado', 'aguacoco', 'cocada', 'sancocho', 'azabachedoble', 'contrafirmada', 'casete01', 'casete02', 'casete06', 'anzuelobueno'];

  // conexiones por mapa, deduplicadas por destino quedándose con la reja definida
  const consOf = (m) => {
    const seen = new Map();
    for (const c of m.connections) {
      const prev = seen.get(c.to);
      if (!prev || (c.gate && !prev.gate)) seen.set(c.to, c);
    }
    return [...seen.values()];
  };

  const doorPos = {};    // id -> { toId -> {x,y,land:{x,y}} }
  const generated = {};  // id -> map object (aún sin warps)

  const byId = {};
  for (const m of D.list) byId[m.id] = m;

  // 1) genera grillas y asigna puertas para cada mapa nuevo
  for (const m of D.list) {
    if (CANON[m.id]) continue;
    const seed = [...m.id].reduce((a, c) => a + c.charCodeAt(0), 0) % 97;
    const w = m.dims.w, h = m.dims.h;
    const cons = consOf(m);
    const paradas = m.features.filter((f) => f.kind === 'parada_menor');
    let g;
    if (m.type === 'station') g = gridStation(w, h, seed, false);
    else if (m.type === 'ghost') g = gridStation(w, h, seed, true);
    else if (m.type === 'tunnel') g = gridTunnel(w, h, seed, paradas);
    else if (m.type === 'surface') g = gridSurface(w, h, seed);
    else if (m.type === 'cable') g = gridCable(w, h, seed);
    else g = gridInterior(w, h, seed);

    // reparte puertas: túneles a los lados, lo demás al sur (y bordes en superficie)
    const doors = {};
    const midY = m.type === 'tunnel' ? Math.floor(h / 2) - 1 : 5;
    const sideSlots = [{ x: 0, y: midY, land: { x: 1, y: midY } }, { x: w - 1, y: midY, land: { x: w - 2, y: midY } }];
    let southX = Math.floor(w / 3);
    const takeSouth = () => {
      const x = southX; southX += Math.max(4, Math.floor(w / (cons.length + 1)));
      return { x: Math.min(x, w - 3), y: h - 1, land: { x: Math.min(x, w - 3), y: h - 2 } };
    };
    const tunnelish = cons.filter((c) => byId[c.to] && (byId[c.to].type === 'tunnel' || m.type === 'tunnel' || m.type === 'cable' || (m.type === 'surface' && byId[c.to].type === 'surface') || m.type === 'ghost'));
    for (const c of cons) {
      const lateral = tunnelish.includes(c) && sideSlots.length;
      const slot = lateral ? sideSlots.shift() : takeSouth();
      set(g, slot.x, slot.y, 'D');
      // el aterrizaje y su alrededor quedan despejados
      set(g, slot.land.x, slot.land.y, '.');
      if (slot.y === h - 1) set(g, slot.land.x, slot.land.y - 1, '.');
      doors[c.to] = slot;
    }
    doorPos[m.id] = doors;

    const featWeather = m.features.find((f) => f.kind === 'weather_zone');
    generated[m.id] = {
      id: m.id, name: m.name_es, theme: THEME[m.type],
      music: REGION_MUSIC[m.region] || MUSIC[m.type],
      station: m.type === 'station', region: m.region, kind: m.type,
      grid: g, npcs: [], triggers: [], warps: [],
      enc: null, encRef: m.encounters || undefined,
      weather: featWeather ? featWeather.weather : undefined,
      shopStock: m.type === 'station' ? NEW_SHOP : undefined,
      healSpot: m.type === 'station' ? { x: 3, y: 7 } : undefined,
      trainSpawn: m.type === 'station' ? { x: Math.floor(m.dims.w / 2), y: 3 } : undefined,
    };
  }

  // 2) puertas nuevas en los mapas canon (hacia la red que crece)
  //    posiciones elegidas para no chocar con las calles ya pintadas
  const CANON_DOORS = {
    st_capitolio: { toNew: { st_elsilencio: { x: 18, y: 10 } } },
    st_plazavenezuela: { toNew: { tn_plazavenezuela__ciudaduniversitaria: { x: 21, y: 10 } } },
    st_bellasartes: { toNew: { sf_caobos: { x: 16, y: 10 } } },
    st_sabanagrande: { toNew: { sf_bulevar: { x: 16, y: 10 } } },
    st_altamira: { toNew: { sf_parquedeleste: { x: 8, y: 10 }, sf_puertaavila: { x: 18, y: 10 } } },
    st_petare: { toNew: { tn_petare__paloverde: { x: 25, y: 5 } } },
  };

  // 3) cose todos los warps (ida y vuelta) con sus rejas
  const gateOf = (c) => {
    if (!c.gate) return {};
    const flag = GATE_FLAG[c.gate];
    return flag ? { requires: flag, denied: GATE_MSG[flag] } : {};
  };

  for (const m of D.list) {
    const cons = consOf(m);
    if (CANON[m.id]) {
      // mapa canon: solo agrega las puertas hacia lo nuevo
      const plan = CANON_DOORS[m.id];
      if (!plan) continue;
      const old = MQ.MAPS[resolve(m.id)];
      for (const c of cons) {
        const pos = plan.toNew[c.to];
        if (!pos || CANON[c.to]) continue;
        const target = generated[c.to];
        const back = doorPos[c.to] && doorPos[c.to][m.id];
        if (!target || !back) continue;
        set(old.grid, pos.x, pos.y, 'D');
        old.warps.push({ x: pos.x, y: pos.y, to: c.to, tx: back.land.x, ty: back.land.y, ...gateOf(c) });
      }
      continue;
    }
    const me = generated[m.id];
    for (const c of cons) {
      const slot = doorPos[m.id][c.to];
      if (!slot) continue;
      const targetId = resolve(c.to);
      if (CANON[c.to]) {
        // hacia un mapa canon: aterriza junto a la puerta que le abrimos (o la clásica)
        const old = MQ.MAPS[targetId];
        const w = (old.warps || []).find((wp) => wp.to === m.id);
        let tx, ty;
        if (w) { tx = w.x; ty = w.y - 1; if (!MQ.WALKABLE.has(old.grid[ty] && old.grid[ty][tx])) ty = w.y + 1; }
        else { tx = 13; ty = 4; } // andén clásico
        // caso especial: la puerta este de petare aterriza hacia adentro
        if (w && w.x === old.grid[0].length - 1) { tx = w.x - 1; ty = w.y; }
        me.warps.push({ x: slot.x, y: slot.y, to: targetId, tx, ty, ...gateOf(c) });
      } else {
        const back = doorPos[c.to] && doorPos[c.to][m.id];
        if (!back) continue;
        me.warps.push({ x: slot.x, y: slot.y, to: c.to, tx: back.land.x, ty: back.land.y, ...gateOf(c) });
      }
    }
  }

  for (const [id, m] of Object.entries(generated)) MQ.MAPS[id] = m;

  // ---- la red de trenes: varias líneas ------------------------------------------
  MQ.LINES = {
    linea1: { name: 'Línea 1', stops: ['propatria', 'canoamarillo', 'capitolio', 'bellasartes', 'plazavenezuela', 'sabanagrande', 'chacaito', 'altamira', 'petare', 'st_paloverde'] },
    linea2: { name: 'Línea 2', stops: ['st_elsilencio', 'st_capuchinos', 'st_layaguara', 'st_caricuao', 'st_lasadjuntas'] },
    ramal_zoologico: { name: 'Ramal Zoológico', stops: ['st_caricuao', 'st_zoologico'] },
    linea3: { name: 'Línea 3', stops: ['plazavenezuela', 'st_ciudaduniversitaria', 'st_labandera', 'st_elvalle', 'st_larinconada'] },
    linea4: { name: 'Línea 4', stops: ['st_capuchinos', 'st_teatros', 'st_nuevocirco', 'st_parquecentral', 'st_zonarental'] },
    losteques: { name: 'Los Teques', stops: ['st_lasadjuntas', 'st_aliprimera', 'st_guaicaipuro', 'st_independencia', 'st_carrizal', 'st_sanantonio'] },
  };
  MQ.linesAt = (mapId) => Object.values(MQ.LINES).filter((l) => l.stops.includes(mapId));

  // (las Fichas Doradas 5-8 y las banderas derivadas fichasN viven en main.js)
})();
