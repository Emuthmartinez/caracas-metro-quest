// Metro Quest — dibujo: tiles del Metro, gente y espantos (todo procedural).
(() => {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  const T = MQ.TILE;

  // ---- Espantos ---------------------------------------------------------------
  MQ.drawMon = (ctx, id, x, y, scale = 3, flip = false) => {
    const sp = MQ.SPECIES[id];
    if (!sp) return;
    const art = sp.art, pal = sp.pal;
    for (let r = 0; r < art.length; r++) {
      const row = art[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === '.' || !pal[ch]) continue;
        ctx.fillStyle = pal[ch];
        const cx = flip ? row.length - 1 - c : c;
        ctx.fillRect(x + cx * scale, y + r * scale, scale, scale);
      }
    }
  };

  // ---- Gente ------------------------------------------------------------------
  // look: { skin, shirt, pants, hat, hair } · dir: up/down/left/right · frame 0/1
  MQ.drawPerson = (ctx, px, py, look, dir = 'down', frame = 0) => {
    const x = px + 4, y = py + 1;
    const F = (c, dx, dy, w, h) => { ctx.fillStyle = c; ctx.fillRect(x + dx, y + dy, w, h); };
    const skin = look.skin || '#c98e5a', shirt = look.shirt || '#4a6741';
    const pants = look.pants || '#33334a', hair = look.hair || '#26201a';

    // pelo / sombrero
    if (look.hat) { F(look.hat, 0, 0, 8, 2); F(look.hat, -1, 2, 10, 1); }
    else F(hair, 0, 0, 8, 2);
    // cabeza
    F(skin, 0, 2, 8, 4);
    // ojos según dirección
    ctx.fillStyle = '#1a1a1a';
    if (dir === 'down') { ctx.fillRect(x + 1, y + 3, 2, 2); ctx.fillRect(x + 5, y + 3, 2, 2); }
    else if (dir === 'left') ctx.fillRect(x + 0, y + 3, 2, 2);
    else if (dir === 'right') ctx.fillRect(x + 6, y + 3, 2, 2);
    // cuerpo
    F(shirt, 0, 6, 8, 5);
    // brazos
    F(skin, -1, 7, 1, 3); F(skin, 8, 7, 1, 3);
    // piernas (animación)
    if (frame) { F(pants, 0, 11, 3, 3); F(pants, 5, 11, 3, 4); }
    else { F(pants, 0, 11, 3, 4); F(pants, 5, 11, 3, 3); }
  };

  MQ.LOOKS = {
    player:  { skin: '#c98e5a', shirt: '#b5300a', pants: '#33334a', hat: '#8a1a2a' },   // gorra Leones
    rival:   { skin: '#b87a4a', shirt: '#1a3a6b', pants: '#2a2a2a', hat: '#1a3a8a' },   // gorra Magallanes
    abuela:  { skin: '#b87a4a', shirt: '#d98ab0', pants: '#6a4a8a', hair: '#d8d8d8' },
    doctor:  { skin: '#c98e5a', shirt: '#1a1a1a', pants: '#1a1a1a', hat: '#2a2a2a' },
    buhonero:{ skin: '#9a6a3a', shirt: '#e8a040', pants: '#33334a', hat: '#c9a36a' },
    senora:  { skin: '#b87a4a', shirt: '#7bb05a', pants: '#4a3266', hair: '#3a2a1a' },
    chamo:   { skin: '#c98e5a', shirt: '#2b6bd9', pants: '#33334a', hair: '#1a1a1a' },
    chama:   { skin: '#9a6a3a', shirt: '#d94f8a', pants: '#2a2a3a', hair: '#26100a' },
    musico:  { skin: '#8a5a3a', shirt: '#f2ead8', pants: '#3a2d1e', hat: '#c9a36a' },
    obrero:  { skin: '#9a6a3a', shirt: '#f5a623', pants: '#33334a', hat: '#f5d76e' },
    operador:{ skin: '#c98e5a', shirt: '#3a4a8a', pants: '#1a1a2e', hat: '#3a4a8a' },
    vieja:   { skin: '#c98e5a', shirt: '#8a6a9a', pants: '#4a4a5a', hair: '#cfcfcf' },
    sifrina: { skin: '#d9a87a', shirt: '#f0f0f0', pants: '#c98ab0', hair: '#c9a36a' },
    barbara: { skin: '#b87a4a', shirt: '#1c1c28', pants: '#1c1c28', hair: '#1a1a1a' },
    rumbero: { skin: '#7a4a2a', shirt: '#d94f8a', pants: '#f2ead8', hat: '#f2ead8' },
    reina:   { skin: '#b87a4a', shirt: '#4ab0a0', pants: '#2a5a8a', hair: '#1a1a1a' },
    guardia: { skin: '#9a6a3a', shirt: '#3a4a8a', pants: '#1a1a2e', hat: '#2a3a6a' },
  };

  // ---- Tiles --------------------------------------------------------------------
  // theme: { floor, floor2, wall, wallTop, dark }
  MQ.THEMES = {
    metro:  { floor: '#b8a888', floor2: '#a89878', wall: '#7a6a52', wallTop: '#5a4d3a', dark: '#14101e' },
    casa:   { floor: '#a8784a', floor2: '#9a6a3e', wall: '#c9b090', wallTop: '#8a7050', dark: '#14101e' },
    calle:  { floor: '#8a8a8a', floor2: '#7e7e7e', wall: '#5a5a6a', wallTop: '#42424e', dark: '#14101e' },
    tunel:  { floor: '#4a4452', floor2: '#423c4a', wall: '#2a2433', wallTop: '#1c1824', dark: '#0e0a16' },
    ghost:  { floor: '#3a3448', floor2: '#322c40', wall: '#221c30', wallTop: '#161020', dark: '#0a0614' },
  };

  MQ.WALKABLE = new Set(['.', '~', 'g', 'M', 'D', ',']);

  MQ.drawTile = (ctx, ch, x, y, th, time) => {
    const F = (c, dx = 0, dy = 0, w = T, h = T) => { ctx.fillStyle = c; ctx.fillRect(x + dx, y + dy, w, h); };
    switch (ch) {
      case '.': case ',': // piso (',' variante)
        F(((x / T + y / T) % 2 === 0) ? th.floor : th.floor2);
        if (ch === ',') { F('rgba(0,0,0,0.08)', 3, 3, 2, 2); F('rgba(0,0,0,0.08)', 10, 9, 2, 2); }
        break;
      case '#': // pared
        F(th.wall); F(th.wallTop, 0, 0, T, 5);
        F('rgba(0,0,0,0.25)', 0, 5, T, 1);
        F('rgba(255,255,255,0.05)', 2, 8, 5, 3); F('rgba(0,0,0,0.1)', 9, 10, 5, 3);
        break;
      case 'T': // vía
        F(th.dark);
        F('#3a3242', 0, 3, T, 2); F('#3a3242', 0, 11, T, 2);   // rieles
        F('#55485f', 0, 3, T, 1); F('#55485f', 0, 11, T, 1);
        F('#2a2433', 2, 0, 2, T); F('#2a2433', 9, 0, 2, T);    // durmientes
        break;
      case '~': { // zona oscura del túnel: aquí viven los espantos
        F(th.dark);
        const tw = (Math.sin(time / 400 + x * 0.7 + y) + 1) / 2;
        F(`rgba(122,90,217,${0.10 + tw * 0.15})`, 4, 4, 3, 3);
        F(`rgba(122,90,217,${0.06 + (1 - tw) * 0.12})`, 10, 10, 2, 2);
        break;
      }
      case 'g': // monte
        F('#3e6b2e');
        F('#54883e', 2, 2, 3, 4); F('#54883e', 9, 6, 3, 4); F('#54883e', 5, 10, 3, 4);
        F('#2e5222', 12, 2, 2, 3); F('#2e5222', 2, 11, 2, 3);
        break;
      case 'W': { // agua (el Guaire, la fuente)
        const ph = Math.sin(time / 500 + (x + y) / 24);
        F('#2b5b7c'); F(ph > 0 ? '#3b6b8c' : '#2b5b7c', 0, 4, T, 3);
        F('rgba(255,255,255,0.18)', (time / 200 + x) % 12, 8, 4, 1);
        break;
      }
      case 'P': // columna del andén
        F(((x / T + y / T) % 2 === 0) ? th.floor : th.floor2);
        F('#8a7a62', 4, 0, 8, T); F('#a89878', 4, 0, 2, T); F('#6a5a45', 10, 0, 2, T);
        F('#e85a1a', 4, 6, 8, 3); // franja naranja del Metro
        break;
      case 'H': // Módulo de Atención (el Doctorcito)
        F(th.floor); F('#f2ead8', 1, 2, 14, 12); F('#b5300a', 1, 2, 14, 3);
        F('#f2ead8', 6, 0, 4, 2); F('#b5300a', 5, 6, 6, 4);
        break;
      case 'S': // puesto de buhonero
        F(th.floor); F('#c9a36a', 1, 4, 14, 10); F('#d9342b', 1, 2, 14, 3);
        F('#f5d76e', 3, 8, 3, 3); F('#7bb05a', 8, 8, 3, 3); F('#4a90d9', 11, 8, 2, 3);
        break;
      case 'M': // borde de andén / puerta del tren
        F(((x / T + y / T) % 2 === 0) ? th.floor : th.floor2);
        F('#f5d76e', 0, 0, T, 3); F('#1a1a1a', 0, 3, T, 1); // franja amarilla
        break;
      case 'D': // escalera / salida
        F(th.dark);
        for (let i = 0; i < 4; i++) F(i % 2 ? '#9a8a70' : '#b8a888', 0, i * 4, T, 4);
        F('rgba(0,0,0,0.3)', 0, 0, T, 2);
        break;
      case 'B': // banco
        F(((x / T + y / T) % 2 === 0) ? th.floor : th.floor2);
        F('#8a4a2a', 1, 5, 14, 5); F('#6a3a20', 2, 10, 2, 4); F('#6a3a20', 12, 10, 2, 4);
        break;
      case 'm': // mesa de madera (la mesa de la abuela)
        F(th.floor);
        F('#8a5a2e', 0, 2, T, 12); F('#a8743e', 0, 2, T, 3);
        F('#6a4422', 1, 12, 2, 4); F('#6a4422', 13, 12, 2, 4);
        break;
      case 'k': // kiosco de periódicos
        F(th.floor); F('#3a6b4a', 1, 1, 14, 13); F('#f2ead8', 3, 4, 4, 5); F('#f2ead8', 9, 4, 4, 5);
        break;
      case 't': // árbol (chaguaramo/araguaney)
        F('#3e6b2e');
        F('#54883e', 2, 0, 12, 9); F('#f5d76e', 4, 2, 3, 2); F('#f5d76e', 9, 5, 3, 2);
        F('#6a4a2a', 6, 9, 4, 7);
        break;
      case 'f': { // fuente de Plaza Venezuela
        F('#8a8a8a'); F('#2b5b7c', 2, 2, 12, 12);
        const j = Math.abs(Math.sin(time / 300));
        F('#aaddff', 7, 7 - j * 4, 2, 3 + j * 4);
        F('rgba(255,255,255,0.35)', 4, 11, 3, 1); F('rgba(255,255,255,0.35)', 10, 10, 3, 1);
        break;
      }
      case 'a': // velas y flores (altar de la Reina)
        F(th.dark);
        F('#f2ead8', 3, 6, 2, 6); F('#f2ead8', 8, 4, 2, 8); F('#f2ead8', 12, 7, 2, 5);
        const fl = (time / 120 | 0) % 2;
        F(fl ? '#ffe66e' : '#f5a623', 3, 4, 2, 2); F(fl ? '#f5a623' : '#ffe66e', 8, 2, 2, 2); F(fl ? '#ffe66e' : '#f5a623', 12, 5, 2, 2);
        break;
      case '=': // boca de túnel
        F(th.wallTop); F('#000000', 2, 4, 12, 12);
        break;
      default:
        F(th.dark);
    }
  };

  // tren detenido en el andén (decorativo, 1 tile de alto sobre vías)
  MQ.drawTrain = (ctx, x, y, w) => {
    ctx.fillStyle = '#c9c9d4'; ctx.fillRect(x, y + 2, w, 12);
    ctx.fillStyle = '#e85a1a'; ctx.fillRect(x, y + 9, w, 3);
    ctx.fillStyle = '#28323c';
    for (let dx = 4; dx < w - 8; dx += 24) ctx.fillRect(x + dx, y + 4, 10, 4);
    ctx.fillStyle = '#1a1a24'; ctx.fillRect(x, y + 14, w, 2);
  };
})();
