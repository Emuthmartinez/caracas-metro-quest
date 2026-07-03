// Metro Quest — el mundo caminable: andenes, túneles y la hora fantasma.
(() => {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  const T = MQ.TILE;
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  // ---- El viaje en tren: llega, abre puertas, te montas, viajas y te bajas ---------
  MQ.RideScene = class {
    constructor(fromId, toId, onArrive) {
      this.from = fromId;
      this.to = toId;
      this.onArrive = onArrive;
      // la línea que comparte origen y destino (la red creció más allá de la 1)
      const stops = (MQ.LINES
        ? (Object.values(MQ.LINES).map((l) => l.stops).find((s) => s.includes(fromId) && s.includes(toId)) || MQ.TRAIN_STOPS)
        : MQ.TRAIN_STOPS);
      const a = stops.indexOf(fromId), b = stops.indexOf(toId);
      // estaciones intermedias que se ven pasar por la ventana
      this.passing = stops.slice(Math.min(a, b) + 1, Math.max(a, b));
      if (a > b) this.passing.reverse();
      this.hops = Math.max(1, Math.abs(a - b));
      this.dur = Math.min(150 + this.hops * 55, 420); // tramo interior
      this.PRE = 175;   // ceremonia de abordaje
      this.TAIL = 145;  // ceremonia de llegada
      this.total = this.PRE + this.dur + this.TAIL;
      this.t = 0;
      this.x = 0;       // distancia recorrida (px de ventana)
      this.done = false;
    }
    // velocidad del tramo interior: arranca suave, cruza a tope y frena al final
    speed() {
      const f = MQ.clamp((this.t - this.PRE) / this.dur, 0, 1);
      if (f < 0.15) return 2 + (f / 0.15) * 8;
      if (f > 0.82) return Math.max(1.2, 10 * (1 - f) / 0.18);
      return 10;
    }
    finish() {
      if (this.done) return;
      this.done = true;
      MQ.popScene();
      this.onArrive();
    }
    press(k) {
      if (k !== 'a' && k !== 'b' && k !== 'start') return;
      // saltar adelanta a la ceremonia de llegada; durante la llegada no hay apuro
      if (this.t < this.PRE + this.dur - 20) {
        this.t = this.PRE + this.dur;
        MQ.audio.sfx('brake');
      }
    }
    update() {
      this.t++;
      const rideT = this.t - this.PRE;
      if (rideT > 0 && rideT <= this.dur) {
        this.x += this.speed();
        if (this.t % 22 === 0) MQ.audio.sfx('riel');
      }
      // hitos sonoros del abordaje
      if (this.t === 16 || this.t === 40) MQ.audio.sfx('riel');   // las luces parpadean dos veces
      if (this.t === 52) MQ.audio.sfx('brake');                    // el tren entra frenando
      if (this.t === 118) MQ.audio.sfx('doors');                   // puertas abren
      if (this.t === this.PRE - 10) MQ.audio.sfx('doors');         // puertas cierran
      if (this.t === this.PRE) MQ.audio.sfx('whistle');            // arranca
      // hitos de la llegada
      const aT = this.t - this.PRE - this.dur;
      if (aT === 20) MQ.audio.sfx('doors');                        // puertas abren
      if (aT === 68) MQ.audio.sfx('doors');                        // puertas cierran
      if (aT === 78) MQ.audio.sfx('train');                        // el tren sigue su ruta
      if (this.t >= this.total) this.finish();
    }

    // tren grande de perfil: tx=0 lo deja cuadrado con el andén · puertas 0-1
    drawBigTrain(ctx, tx, doorOpen) {
      const W = MQ.W;
      const y = 112, h = 56, len = 460;
      const x = tx - 70;
      ctx.fillStyle = '#c9c9d4'; ctx.fillRect(x, y, len, h);
      ctx.fillStyle = '#a8a8b8'; ctx.fillRect(x, y, len, 4);
      // ventanas
      ctx.fillStyle = '#28323c';
      for (let wx = x + 10; wx < x + len - 20; wx += 42) ctx.fillRect(wx, y + 10, 24, 16);
      // franja naranja
      ctx.fillStyle = '#e85a1a'; ctx.fillRect(x, y + 34, len, 6);
      // bajos y ruedas
      ctx.fillStyle = '#1a1a24'; ctx.fillRect(x, y + h - 6, len, 6);
      ctx.fillStyle = '#0e0e16';
      for (let wx = x + 24; wx < x + len; wx += 80) ctx.fillRect(wx, y + h - 4, 14, 4);
      // puerta central (alineada con el caminar del jugador)
      const dx = tx + W / 2 - 14, dw = 28;
      ctx.fillStyle = doorOpen > 0 ? '#241c30' : '#b8b8c8';
      ctx.fillRect(dx, y + 8, dw, h - 16);
      if (doorOpen > 0) {
        // luz cálida adentro
        ctx.fillStyle = 'rgba(245,215,110,0.25)';
        ctx.fillRect(dx + 2, y + 10, dw - 4, h - 20);
      }
      const slide = Math.round((dw / 2) * doorOpen);
      ctx.fillStyle = '#b8b8c8';
      ctx.fillRect(dx, y + 8, dw / 2 - slide, h - 16);
      ctx.fillRect(dx + dw / 2 + slide, y + 8, dw / 2 - slide, h - 16);
      ctx.fillStyle = '#e85a1a';
      if (dw / 2 - slide > 2) { ctx.fillRect(dx, y + 34, dw / 2 - slide, 6); ctx.fillRect(dx + dw / 2 + slide, y + 34, dw / 2 - slide, 6); }
    }

    // andén de perfil: cartel, lámparas, piso y el jugador montándose o bajándose
    drawPlatform(ctx, mapId, ph) {
      const W = MQ.W, H = MQ.H;
      ctx.fillStyle = '#1c1826'; ctx.fillRect(0, 0, W, H);
      // pared del fondo con cenefa
      ctx.fillStyle = '#3a3242'; ctx.fillRect(0, 60, W, 110);
      ctx.fillStyle = '#2a2438';
      for (let bx = 0; bx < W; bx += 24) ctx.fillRect(bx, 60, 12, 110);
      ctx.fillStyle = '#e85a1a'; ctx.fillRect(0, 64, W, 3);
      // lámparas
      for (let lx = 28; lx < W; lx += 64) {
        ctx.fillStyle = '#8a8a96'; ctx.fillRect(lx, 48, 2, 8);
        ctx.fillStyle = ph.lightsOut ? '#3a3a44' : '#ffe66e';
        ctx.fillRect(lx - 5, 56, 12, 4);
        if (!ph.lightsOut) { ctx.fillStyle = 'rgba(255,230,110,0.08)'; ctx.fillRect(lx - 16, 60, 34, 110); }
      }
      // cartel de la estación
      const nm = MQ.MAPS[mapId].name.replace('Estación ', '').toUpperCase();
      ctx.font = MQ.FONT_B;
      const tw = ctx.measureText(nm).width;
      MQ.panel(ctx, W / 2 - tw / 2 - 12, 76, tw + 24, 20);
      ctx.fillStyle = ph.lightsOut ? '#5a5a72' : '#f5a623';
      ctx.textBaseline = 'top';
      ctx.fillText(nm, W / 2 - tw / 2, 82);
      // el tren (si ya llegó)
      if (ph.trainX !== null) this.drawBigTrain(ctx, ph.trainX, ph.doorOpen);
      // piso del andén con franja amarilla
      ctx.fillStyle = '#f5d76e'; ctx.fillRect(0, 168, W, 3);
      ctx.fillStyle = '#b8a888'; ctx.fillRect(0, 171, W, 50);
      ctx.fillStyle = '#a89878';
      for (let fx = 0; fx < W; fx += 32) ctx.fillRect(fx, 171, 16, 50);
      ctx.fillStyle = '#14101e'; ctx.fillRect(0, 221, W, H - 221);
      // el jugador
      if (ph.playerY !== null) {
        const look = MQ.LOOKS[MQ.player.look] || MQ.LOOKS.player;
        MQ.drawPerson(ctx, W / 2 - 8, ph.playerY, look, ph.playerDir, (this.t / 8 | 0) % 2, ph.playerWalk);
      }
      // apagón de la hora fantasma
      if (ph.lightsOut) { ctx.fillStyle = 'rgba(2,0,8,0.55)'; ctx.fillRect(0, 0, W, H); }
    }

    draw(ctx) {
      const W = MQ.W, H = MQ.H;
      const t = this.t;
      // — abordaje —
      if (t < this.PRE) {
        const flicker = (t >= 16 && t < 23) || (t >= 40 && t < 47);
        const trainX = t < 50 ? null : t < 112 ? -420 * Math.pow(1 - (t - 50) / 62, 2) : 0;
        const doorOpen = t < 118 ? 0 : t < 130 ? (t - 118) / 12 : t < this.PRE - 10 ? 1 : Math.max(0, 1 - (t - (this.PRE - 10)) / 8);
        let playerY = 196, playerDir = 'up', playerWalk = false;
        if (t >= 132 && t < 165) { playerY = 196 - (t - 132) * 1.7; playerWalk = true; }
        this.drawPlatform(ctx, this.from, {
          lightsOut: flicker, trainX, doorOpen,
          playerY: t >= 132 && playerY < 142 ? null : playerY,
          playerDir, playerWalk,
        });
        if ((t / 35 | 0) % 2) {
          ctx.fillStyle = '#8a8aa0'; ctx.font = MQ.FONT; ctx.textAlign = 'center';
          ctx.fillText('A: llegar de una vez', W / 2, H - 14);
          ctx.textAlign = 'left';
        }
        return;
      }
      // — llegada —
      const aT = t - this.PRE - this.dur;
      if (aT >= 0) {
        const doorOpen = aT < 20 ? 0 : aT < 32 ? (aT - 20) / 12 : aT < 68 ? 1 : Math.max(0, 1 - (aT - 68) / 8);
        const trainX = aT < 78 ? 0 : 420 * Math.pow((aT - 78) / 64, 2);
        let playerY = null, playerWalk = false;
        if (aT >= 34 && aT < 66) { playerY = 142 + (aT - 34) * 1.7; playerWalk = true; }
        else if (aT >= 66) playerY = 196;
        this.drawPlatform(ctx, this.to, {
          lightsOut: false, trainX, doorOpen,
          playerY, playerDir: 'down', playerWalk,
        });
        return;
      }
      // — interior del vagón —
      const rumble = Math.round(Math.sin(this.t * 1.7) * Math.min(1.5, this.speed() / 5));
      ctx.fillStyle = '#1c1826'; ctx.fillRect(0, 0, W, H);

      // — ventana del vagón (el túnel corre afuera) —
      const wy = 56 + rumble, wh = 96;
      ctx.fillStyle = '#06040c'; ctx.fillRect(12, wy, W - 24, wh);
      // cableado del túnel ondulando
      ctx.strokeStyle = '#2a2438'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let px = 12; px <= W - 12; px += 8) {
        const yy = wy + 18 + Math.sin((px + this.x) / 38) * 5;
        px === 12 ? ctx.moveTo(px, yy) : ctx.lineTo(px, yy);
      }
      ctx.stroke();
      // luces de servicio pasando (más separadas cuando frena)
      for (let i = 0; i < 6; i++) {
        const lx = W - 12 - ((this.x * 2 + i * 95) % (W + 60)) + 24;
        if (lx < 12 || lx > W - 16) continue;
        ctx.fillStyle = '#f5d76e'; ctx.fillRect(lx, wy + 10, 3, 8);
        ctx.fillStyle = 'rgba(245,215,110,0.12)'; ctx.fillRect(lx - 8, wy, 19, wh);
      }
      // andenes iluminados de las estaciones intermedias
      const span = this.dur * 10 / (this.passing.length + 1); // px aprox entre estaciones
      this.passing.forEach((sid, i) => {
        const sx = W - ((this.x - span * (i + 1) * 0.9) * 1.0);
        if (sx < -160 || sx > W) return;
        ctx.fillStyle = '#2e2840'; ctx.fillRect(sx, wy + 30, 150, wh - 30);
        ctx.fillStyle = '#f5a623';
        for (let j = 0; j < 6; j++) ctx.fillRect(sx + 8 + j * 24, wy + 36, 4, 3);
        ctx.fillStyle = '#0e0a16'; ctx.fillRect(sx + 20, wy + 48, 110, 14);
        ctx.fillStyle = '#e8dfc8'; ctx.font = MQ.FONT;
        ctx.fillText(MQ.MAPS[sid].name.replace('Estación ', '').toUpperCase(), sx + 26, wy + 51);
      });
      // marco de la ventana
      ctx.strokeStyle = '#3a3242'; ctx.lineWidth = 4;
      ctx.strokeRect(12, wy, W - 24, wh);
      for (let mx = 12 + (W - 24) / 3; mx < W - 24; mx += (W - 24) / 3)
        ctx.fillRect(mx, wy, 4, wh);

      // — interior: letrero LED, pasamanos, asientos y un pasajero de la hora fantasma —
      ctx.fillStyle = '#0e0a16'; ctx.fillRect(0, 18 + rumble, W, 16);
      ctx.font = MQ.FONT_B;
      const led = `PRÓXIMA PARADA: ${MQ.MAPS[this.to].name.replace('Estación ', '').toUpperCase()}  ·  LÍNEA 1  ·  `;
      const lw = ctx.measureText(led).width;
      ctx.fillStyle = '#e85a1a';
      const off = (this.t * 1.2) % lw;
      ctx.fillText(led, 8 - off, 22 + rumble);
      ctx.fillText(led, 8 - off + lw, 22 + rumble);
      // pasamanos con agarraderas que se mecen
      ctx.fillStyle = '#8a8a96'; ctx.fillRect(0, 42 + rumble, W, 3);
      for (let hx = 30; hx < W; hx += 56) {
        const sw = Math.sin(this.t / 14 + hx) * this.speed() * 0.7;
        ctx.strokeStyle = '#c9c9d4'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(hx, 45 + rumble); ctx.lineTo(hx + sw, 58 + rumble); ctx.stroke();
        ctx.strokeRect(hx + sw - 3, 58 + rumble, 7, 9);
      }
      // banca del vagón
      ctx.fillStyle = '#2a3a55'; ctx.fillRect(0, H - 96 + rumble, W, 34);
      ctx.fillStyle = '#1c2840';
      for (let bx = 6; bx < W; bx += 44) ctx.fillRect(bx, H - 96 + rumble, 3, 34);
      ctx.fillStyle = '#14101e'; ctx.fillRect(0, H - 62 + rumble, W, 62);
      // un chigüi viaja contigo, porque en la hora fantasma a nadie le parece raro
      MQ.drawMon(ctx, 'chigui', W - 74, H - 104 + rumble + Math.round(Math.sin(this.t / 9) * 1.5), 3);

      // letrero de saltar
      if ((this.t / 35 | 0) % 2) {
        ctx.fillStyle = '#8a8aa0'; ctx.font = MQ.FONT;
        ctx.textAlign = 'center';
        ctx.fillText('A: llegar de una vez', W / 2, H - 14);
        ctx.textAlign = 'left';
      }
    }
  };

  MQ.WorldScene = class {
    constructor() {
      this.tb = new MQ.Textbox();
      this.menu = null;          // menú activo (pausa, tienda, tren...)
      this.menuStack = [];
      this.script = null;        // {list, i}
      this.moving = 0;           // px restantes del paso
      this.frame = 0;
      this.banner = null;        // {text, t}
      this.fade = 0;
      this.dexView = null;       // página del cuaderno
      this.statView = null;
      this.mapView = false;      // mapa del Metro a pantalla completa
      this.mapBehind = false;    // mapa de fondo al elegir destino del tren
      this.engage = null;        // {npc, phase, t, moving} — el ¡! del entrenador
      this.enterMap(MQ.player.map, true);
    }

    get map() { return MQ.MAPS[MQ.player.map]; }
    tile(x, y) {
      const g = this.map.grid;
      if (y < 0 || y >= g.length || x < 0 || x >= g[y].length) return '#';
      return g[y][x];
    }
    npcAt(x, y) {
      return (this.map.npcs || []).find((n) => n.x === x && n.y === y && !(n.hideIf && MQ.player.flags[n.hideIf]) && (!n.showIf || MQ.player.flags[n.showIf]));
    }
    walkable(x, y) {
      return MQ.WALKABLE.has(this.tile(x, y)) && !this.npcAt(x, y);
    }

    enterMap(id, first) {
      const p = MQ.player;
      p.map = id;
      this.engage = null;
      const m = this.map;
      if (m.station) p.visited[id] = true;
      this.banner = { text: m.name.toUpperCase(), t: 150 };
      MQ.audio.music(m.music || 'town');
      if (!first) this.checkTrigger();
    }

    // ---- guion (escenas de historia) ----------------------------------------
    runScript(list) { this.script = { list: list.slice(), i: 0 }; this.stepScript(); }

    stepScript() {
      const s = this.script;
      if (!s || s.i >= s.list.length) { this.script = null; return; }
      const op = s.list[s.i++];
      if (op.say) {
        const [spk, txt] = Array.isArray(op.say) ? op.say : ['', op.say];
        this.tb.open(MQ.ctx, txt, () => this.stepScript(), spk);
      } else if (op.battle) {
        MQ.pushScene(new MQ.BattleScene({
          ambience: { theme: this.map.theme, region: this.map.region },
          dark: this.map.theme === 'tunel' || this.map.theme === 'ghost',
          weather: this.map.weather,
          ...op.battle }, (res) => {
          MQ.popScene();
          MQ.audio.music(this.map.music || 'town');
          if (res === 'lose') { this.script = null; MQ.respawn(this); return; }
          if (op.battle.trainer) MQ.player.flags['t_' + op.battle.trainer.id] = true;
          if (op.winScript && (res === 'win' || res === 'catch')) {
            s.list.splice(s.i, 0, ...op.winScript);
          }
          this.stepScript();
        }));
      } else if (op.flag) { MQ.setFlag(op.flag); this.stepScript(); }
      else if (op.give) { MQ.player.bag[op.give.item] = (MQ.player.bag[op.give.item] || 0) + op.give.n; MQ.audio.sfx('ficha'); this.stepScript(); }
      else if (op.money) { MQ.player.money += op.money; this.stepScript(); }
      else if (op.mon) { MQ.addMon(MQ.makeMon(op.mon[0], op.mon[1])); this.stepScript(); }
      else if (op.healParty) { MQ.player.party.forEach(MQ.fullHeal); MQ.audio.sfx('heal'); this.stepScript(); }
      else if (op.choice) {
        this.menu = new MQ.Menu(op.choice.options.map((o) => ({ label: o.label, value: o })), {
          x: 40, y: 80, w: 200, title: op.choice.title, rows: 4,
          onPick: (it) => { this.menu = null; if (it.value.script) s.list.splice(s.i, 0, ...it.value.script); this.stepScript(); },
          onCancel: () => { this.menu = null; this.stepScript(); },
        });
      }
      else if (op.fn) { op.fn(this); this.stepScript(); }
      else if (op.sfx) { MQ.audio.sfx(op.sfx); this.stepScript(); }
      else if (op.music) { MQ.audio.music(op.music); this.stepScript(); }
      else if (op.warpTo) { const w = op.warpTo; MQ.player.x = w.x; MQ.player.y = w.y; this.enterMap(w.map); this.stepScript(); }
      else if (op.ending) { this.script = null; MQ.startEnding(); }
      else this.stepScript();
    }

    checkTrigger() {
      const p = MQ.player;
      for (const tr of this.map.triggers || []) {
        if (tr.x === p.x && tr.y === p.y) {
          if (tr.once && p.flags[tr.once]) continue;
          const s = MQ.SCRIPTS[tr.script] && MQ.SCRIPTS[tr.script]();
          if (s) { this.runScript(s); return true; }
        }
      }
      return false;
    }

    // ---- interacción -----------------------------------------------------------
    interact() {
      const p = MQ.player;
      const [dx, dy] = DIRS[p.dir];
      const tx = p.x + dx, ty = p.y + dy;
      const npc = this.npcAt(tx, ty);
      if (npc) return this.talkTo(npc);
      // lo enterrado: se saca con A mirando el escondite (o parado encima)
      const hid = (this.map.hidden || []).find((h) => !p.flags[h.flag] && ((h.x === tx && h.y === ty) || (h.x === p.x && h.y === p.y)));
      if (hid) {
        const n = hid.n || 1;
        p.bag[hid.item] = (p.bag[hid.item] || 0) + n;
        MQ.setFlag(hid.flag);
        MQ.audio.sfx('sparkle');
        this.tb.open(MQ.ctx, `¡Había algo escondido! Sacas ${n > 1 ? n + '× ' : ''}${MQ.ITEMS[hid.item].name}.`);
        return;
      }
      const ch = this.tile(tx, ty);
      // las bancas de andén y de parada menor guardan la partida (world bible §0)
      if (ch === 'B') {
        MQ.save();
        MQ.audio.sfx('save');
        this.tb.open(MQ.ctx, 'Te sientas un momento en la banca. El andén está tranquilo... Partida guardada.');
        return;
      }
      if (ch === 'H') return this.runScript(MQ.SCRIPTS.heal());
      if (ch === 'S') return this.openShop();
      // A en el borde del andén (sobre la franja M o mirando la vía) también aborda
      if (this.map.station && (this.tile(p.x, p.y) === 'M' || ch === 'M' || ch === 'T')) return this.openTrain();
      if (ch === 'a' && this.map.tileScripts && this.map.tileScripts.a)
        return this.runScript(MQ.SCRIPTS[this.map.tileScripts.a]());
    }

    talkTo(npc) {
      // los paqueticos del andén: se recogen con A y no reaparecen
      if (npc.itemBall) {
        const n = npc.n || 1;
        MQ.player.bag[npc.itemBall] = (MQ.player.bag[npc.itemBall] || 0) + n;
        MQ.setFlag(npc.hideIf);
        MQ.audio.sfx('ficha');
        this.tb.open(MQ.ctx, `¡Encontraste ${n > 1 ? n + '× ' : ''}${MQ.ITEMS[npc.itemBall].name}!`);
        return;
      }
      if (!npc.mon) npc.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[MQ.player.dir];
      if (npc.script) {
        const s = MQ.SCRIPTS[npc.script] && MQ.SCRIPTS[npc.script]();
        if (s) return this.runScript(s);
      }
      if (npc.trainer) return this.startTrainer(npc);
      const txt = Array.isArray(npc.text) ? MQ.pick(npc.text) : npc.text;
      if (txt) this.tb.open(MQ.ctx, txt, null, npc.name);
    }

    startTrainer(npc) {
      const tr = npc.trainer;
      if (MQ.player.flags['t_' + tr.id]) {
        this.tb.open(MQ.ctx, tr.after || (tr.boss ? 'Ya tienes mi Ficha Dorada. Hazle honor, chamo.' : '¡Buen combate el de nosotros! Sigue pa\' lante.'), null, npc.name);
        return;
      }
      if (!tr.boss) MQ.audio.music('reto'); // el reto suena desde la primera palabra
      const script = [
        { say: [npc.name, tr.intro] },
        { battle: { trainer: { ...tr, name: npc.name } },
          winScript: tr.reward ? [
            { fn: () => { MQ.setFlag(tr.reward); MQ.audio.sfx('catch'); } },
            { say: ['', `★ ¡Obtienes la ${MQ.FICHAS[tr.reward]}! ★`] },
            { fn: () => MQ.save(true) },
          ] : [] },
      ];
      return this.runScript(script);
    }

    // Línea de vista estilo FireRed: el entrenador que te ve dentro de 4 casillas
    // por donde mira (sin pared ni gente en medio) suelta el ¡! y va por ti.
    // Los Jefes no cazan a nadie: esperan en su puesto, como manda el protocolo.
    trainerSpotting() {
      const p = MQ.player;
      for (const n of this.map.npcs || []) {
        if (!n.trainer || n.trainer.boss || n.boss) continue;
        if (p.flags['t_' + n.trainer.id]) continue;
        if (n.hideIf && p.flags[n.hideIf]) continue;
        if (n.showIf && !p.flags[n.showIf]) continue;
        const [dx, dy] = DIRS[n.dir || 'down'];
        for (let i = 1; i <= 4; i++) {
          const tx = n.x + dx * i, ty = n.y + dy * i;
          if (tx === p.x && ty === p.y) return n;
          if (!MQ.WALKABLE.has(this.tile(tx, ty)) || this.npcAt(tx, ty)) break;
        }
      }
      return null;
    }

    // mirar y encontrar: si alguien te tiene en la mira, arranca el ¡!
    spotNow() {
      if (this.engage) return false;
      const sp = this.trainerSpotting();
      if (!sp) return false;
      this.engage = { npc: sp, phase: 'alert', t: 0, moving: 0 };
      MQ.audio.sfx('alert');
      MQ.audio.music('reto'); // el tema de la mirada cruzada, hasta que arranque el combate
      return true;
    }

    openShop() {
      const stock = this.map.shopStock || ['ficha', 'malta'];
      const build = () => stock.map((k) => ({ label: MQ.ITEMS[k].name, sub: MQ.ITEMS[k].price + 'b', value: k }))
        .concat([{ label: 'Salir', value: null }]);
      this.tb.open(MQ.ctx, '¡Lleve lleve! ¡Ficha, maltica, marroncito! Todo bueno, bonito y barato, mi pana.', () => {
        this.menu = new MQ.Menu(build(), {
          x: 8, y: 30, w: 200, rows: 8, title: `BUHONERO · Tienes ${MQ.player.money}b`,
          onPick: (it) => {
            if (!it.value) { this.menu = null; return; }
            const item = MQ.ITEMS[it.value];
            if (MQ.player.money < item.price) { this.tb.open(MQ.ctx, 'Estás más pelado que rodilla de chivo, chamo. Vuelve cuando tengas bolos.', null, 'Buhonero'); this.menu = null; return; }
            MQ.player.money -= item.price;
            MQ.player.bag[it.value] = (MQ.player.bag[it.value] || 0) + 1;
            MQ.audio.sfx('ficha');
            this.menu.title = `BUHONERO · Tienes ${MQ.player.money}b`;
          },
          onCancel: () => { this.menu = null; },
        });
      }, 'Buhonero');
    }

    openTrain() {
      const p = MQ.player;
      // a las estaciones que ya conoces (de todas las líneas que pasan por aquí);
      // en la Línea 1, la cortesía canon: también la siguiente parada
      const EAST_GATE = { capitolio: 'ficha1' }; // la Doña no se brinca ni en tren
      const lines = MQ.linesAt ? MQ.linesAt(p.map) : [{ stops: MQ.TRAIN_STOPS }];
      const known = new Set();
      const stops = [];
      for (const line of lines) {
        for (const s of line.stops) if (p.visited[s]) known.add(s);
        if (!MQ.LINES || line === MQ.LINES.linea1) {
          const idx = line.stops.indexOf(p.map);
          const next = line.stops[idx + 1];
          if (next && (!EAST_GATE[p.map] || p.flags[EAST_GATE[p.map]])) known.add(next);
          if (idx > 0) known.add(line.stops[idx - 1]);
        }
      }
      known.delete(p.map);
      for (const line of lines)
        for (const s of line.stops)
          if (known.has(s) && !stops.includes(s)) stops.push(s);
      if (!lines.length || (MQ.LINES && !lines.some((l) => l.stops.includes(p.map)))) {
        this.tb.open(MQ.ctx, 'Las luces prenden, el cartel brilla... pero por esta vía nunca ha pasado un tren. Bello Monte quedó a medio hacer, como tantas promesas.', null, 'Voz del Metro');
        return;
      }
      if (!stops.length) {
        this.tb.open(MQ.ctx, 'El tren de la hora fantasma solo para en estaciones que ya conoces. Camina los túneles primero. Cuando vuelvas, párate aquí en la franja del andén y listo.', null, 'Voz del Metro');
        return;
      }
      this.mapBehind = true; // el mapa del Metro de fondo mientras eliges
      this.menu = new MQ.Menu(
        stops.map((s) => ({ label: MQ.MAPS[s].name.replace('Estación ', ''), sub: p.visited[s] ? '' : '▸nueva', value: s })).concat([{ label: 'Quedarme', value: null }]),
        { x: MQ.W - 158, y: MQ.H - 116, w: 150, rows: 6, title: '¿Destino?',
          onPick: (it) => {
            this.menu = null; this.mapBehind = false;
            if (!it.value) return;
            MQ.pushScene(new MQ.RideScene(p.map, it.value, () => {
              const ts = MQ.MAPS[it.value].trainSpawn || { x: 13, y: 3 };
              MQ.player.x = ts.x; MQ.player.y = ts.y; MQ.player.dir = 'down';
              this.enterMap(it.value);
              this.tb.open(MQ.ctx, `«Estación ${MQ.MAPS[it.value].name.replace('Estación ', '')}. Recuerde: deje salir antes de entrar.»`, null, 'Voz del Metro');
            }));
          },
          onCancel: () => { this.menu = null; this.mapBehind = false; } });
    }

    // ---- el mapa de la RED (como el Town Map de los clásicos, pero criollo) ---------
    drawMetroMap(ctx) {
      const p = MQ.player;
      MQ.panel(ctx, 8, 8, MQ.W - 16, MQ.H - 16);
      ctx.font = MQ.FONT_B; ctx.textBaseline = 'top';
      ctx.fillStyle = '#f5a623';
      ctx.fillText('RED DEL METRO · HORA FANTASMA', 24, 20);
      ctx.fillStyle = '#3a3242'; ctx.fillRect(24, 31, MQ.W - 48, 2);

      // — esquema de la red: cada línea con su color de plano de pared —
      const L1 = MQ.LINES ? MQ.LINES.linea1.stops : MQ.TRAIN_STOPS;
      const x0 = 32, x1 = MQ.W - 40, l1y = 66;
      const sx = (i) => x0 + ((x1 - x0) * i) / (L1.length - 1);
      const POS = {};
      L1.forEach((s, i) => { POS[s] = [sx(i), l1y]; });
      const capX = POS.capitolio[0], pvX = POS.plazavenezuela[0];
      // L2 baja del Capitolio y corre al oeste
      const l2y = 150;
      const L2 = ['st_elsilencio', 'st_capuchinos', 'st_layaguara', 'st_caricuao', 'st_lasadjuntas'];
      L2.forEach((s, i) => { POS[s] = [capX - 4 - i * 15, l2y]; });
      POS.st_zoologico = [POS.st_caricuao[0], l2y + 30];
      // L3 baja de Plaza Venezuela
      const L3 = ['st_ciudaduniversitaria', 'st_labandera', 'st_elvalle', 'st_larinconada'];
      L3.forEach((s, i) => { POS[s] = [pvX + 4, l1y + 34 + i * 26]; });
      // L4 corre al este desde Capuchinos
      const L4 = ['st_teatros', 'st_nuevocirco', 'st_parquecentral', 'st_zonarental'];
      L4.forEach((s, i) => { POS[s] = [POS.st_capuchinos[0] + 34 + i * 40, l2y + 46] });
      // L5 fantasma, en diagonal desde Zona Rental
      const L5 = ['st_bellomonte', 'gh_lasmercedes', 'gh_tamanaco', 'gh_chuao', 'gh_bellocampo', 'gh_miranda_l5'];
      L5.forEach((s, i) => { POS[s] = [POS.st_zonarental[0] + 14 + i * 13, l2y + 60 - i * 4]; });
      // Los Teques se va del valle desde Las Adjuntas
      const LT = ['st_aliprimera', 'st_guaicaipuro', 'st_independencia', 'st_carrizal', 'st_sanantonio'];
      LT.forEach((s, i) => { POS[s] = [Math.max(14, POS.st_lasadjuntas[0] - 2 - i * 3), l2y + 22 + i * 11]; });

      const line = (pts, color, dash) => {
        ctx.strokeStyle = color; ctx.lineWidth = 3;
        if (dash) ctx.setLineDash(dash);
        ctx.beginPath();
        pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
        ctx.stroke();
        ctx.setLineDash([]);
      };
      // trazos
      line([[x0, l1y], [x1, l1y]], '#e85a1a');
      line([[capX, l1y], [capX, l2y], [POS.st_lasadjuntas[0], l2y]], '#5e8b3f');
      line([[POS.st_caricuao[0], l2y], POS.st_zoologico], '#5e8b3f');
      line([[pvX, l1y], [pvX + 4, POS.st_larinconada[1]]], '#4a90d9');
      line([[POS.st_capuchinos[0], l2y], [POS.st_capuchinos[0], l2y + 46], [POS.st_zonarental[0], l2y + 46]], '#9a5ad9');
      if (p.flags.fichas4 || p.flags.consejo || p.flags.tren)
        line([POS.st_zonarental, POS.gh_miranda_l5], '#7affc9', [3, 4]);
      if (p.flags.tren)
        line([POS.st_lasadjuntas, POS.st_sanantonio], '#8a8aa0', [2, 3]);
      // el Ávila vigila el norte
      ctx.strokeStyle = '#3a5a3f'; ctx.lineWidth = 2;
      const avX = POS.altamira[0];
      ctx.beginPath();
      ctx.moveTo(avX - 26, 52); ctx.lineTo(avX - 8, 40); ctx.lineTo(avX + 6, 50);
      ctx.lineTo(avX + 18, 42); ctx.lineTo(avX + 32, 52);
      ctx.stroke();

      // — estaciones: cuadrito brillante si la conoces —
      ctx.font = MQ.FONT;
      for (const [s, [x, y]] of Object.entries(POS)) {
        const seen = p.visited[s];
        ctx.fillStyle = '#101020'; ctx.fillRect(x - 4, y - 4, 8, 8);
        ctx.fillStyle = seen ? '#f2ead8' : '#2a2438';
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
      // nombres de la Línea 1 en diagonal, como los planos de pared
      const SHORT = {
        propatria: 'Propatria', canoamarillo: 'C.Amarillo', capitolio: 'Capitolio',
        bellasartes: 'B.Artes', plazavenezuela: 'Pza.Vzla', sabanagrande: 'S.Grande',
        chacaito: 'Chacaíto', altamira: 'Altamira', petare: 'Petare', st_paloverde: 'P.Verde',
      };
      L1.forEach((s, i) => {
        const [x] = POS[s];
        ctx.save();
        ctx.translate(x + 2, l1y - (i % 2 ? 26 : 10));
        ctx.rotate(-0.7);
        ctx.fillStyle = p.visited[s] ? '#e8dfc8' : '#5a5a72';
        ctx.fillText(p.visited[s] ? SHORT[s] : '???', 0, 0);
        ctx.restore();
      });
      // etiquetas de línea
      ctx.fillStyle = '#5e8b3f'; ctx.fillText('L2', POS.st_lasadjuntas[0] - 6, l2y - 14);
      ctx.fillText('Zoo', POS.st_zoologico[0] + 6, POS.st_zoologico[1] - 3);
      ctx.fillStyle = '#4a90d9'; ctx.fillText('L3', pvX + 10, POS.st_larinconada[1] - 6);
      ctx.fillStyle = '#9a5ad9'; ctx.fillText('L4', POS.st_zonarental[0] - 8, l2y + 50);
      if (p.flags.fichas4 || p.flags.consejo || p.flags.tren) {
        ctx.fillStyle = '#7affc9'; ctx.fillText('L5', POS.gh_miranda_l5[0] - 4, POS.gh_miranda_l5[1] + 8);
      }
      if (p.flags.tren) {
        ctx.fillStyle = '#8a8aa0'; ctx.fillText('Los Teques', POS.st_sanantonio[0] + 8, POS.st_sanantonio[1] - 3);
      }

      // — ¿dónde estás? —
      let hx = null, hy = null;
      if (POS[p.map]) { [hx, hy] = POS[p.map]; }
      else {
        const tn = /^tunel(\d+)$/.exec(p.map);
        if (tn) { hx = (POS[L1[tn[1] - 1]][0] + POS[L1[+tn[1]]][0]) / 2; hy = l1y; }
        else if (p.map === 'casa') { [hx, hy] = POS.propatria; }
        else if (p.map === 'calvario') { [hx, hy] = POS.canoamarillo; }
        else if (p.map === 'fuente' || p.map === 'zonarental' || p.map === 'lineafantasma') { [hx, hy] = POS.plazavenezuela; }
        else if (p.map === 'mercado') { [hx, hy] = POS.petare; }
        else {
          // aproxima por la región del mapa generado
          const m = MQ.MAPS[p.map] || {};
          const R = { linea2: POS.st_layaguara, linea3: POS.st_labandera, linea4: POS.st_nuevocirco,
            linea5: POS.gh_chuao, losteques: POS.st_independencia, avila: [avX, 46],
            metrocable_sanagustin: POS.st_parquecentral, metrocable_mariche: POS.st_paloverde,
            superficie: POS[p.map === 'sf_bulevar' ? 'sabanagrande' : 'bellasartes'] };
          if (m.region && R[m.region]) { [hx, hy] = R[m.region]; }
        }
      }
      const now = performance.now();
      if (hx !== null && (now / 400 | 0) % 2) {
        ctx.fillStyle = '#f5d76e'; ctx.font = MQ.FONT_B;
        ctx.fillText('▼', hx - 4, hy - 13);
      }
      // leyenda
      ctx.font = MQ.FONT;
      ctx.fillStyle = '#f2ead8'; ctx.fillRect(24, MQ.H - 51, 6, 6);
      ctx.fillStyle = '#2a2438'; ctx.fillRect(98, MQ.H - 51, 6, 6);
      ctx.fillStyle = '#8a8aa0';
      ctx.fillText('conocida', 34, MQ.H - 52);
      ctx.fillText('por conocer', 108, MQ.H - 52);
      ctx.fillStyle = '#f5d76e'; ctx.fillText('▼', 186, MQ.H - 52);
      ctx.fillStyle = '#8a8aa0';
      ctx.fillText('estás aquí', 196, MQ.H - 52);
      ctx.fillText('(A para volver)', 24, MQ.H - 34);
    }

    // ---- menú de pausa ----------------------------------------------------------
    openPause() {
      MQ.audio.sfx('sel');
      const p = MQ.player;
      this.menu = new MQ.Menu([
        { label: 'EQUIPO' }, { label: 'CUADERNO' }, { label: 'MAPA' }, { label: 'MOCHILA' },
        { label: 'CARNET' }, { label: 'LOCKER' }, { label: 'FICHAS' }, { label: 'GUARDAR' },
        { label: MQ.audio.muted ? 'SONIDO: NO' : 'SONIDO: SÍ' }, { label: 'CERRAR' },
      ], { x: MQ.W - 124, y: 8, w: 116, rows: 10, title: p.name + ' · ' + p.money + 'b',
        onPick: (it) => {
          const l = it.label;
          if (l === 'EQUIPO') this.openParty();
          else if (l === 'CUADERNO') this.openDex();
          else if (l === 'MAPA') { this.mapView = true; this.menu = null; }
          else if (l === 'CARNET') { this.carnetView = true; this.menu = null; }
          else if (l === 'MOCHILA') this.openBag();
          else if (l === 'LOCKER') this.openLocker();
          else if (l === 'FICHAS') this.showFichas();
          else if (l === 'GUARDAR') { MQ.save(); MQ.audio.sfx('save'); this.menu = null; this.tb.open(MQ.ctx, '¡Partida guardada! Tranquilo, que esto no se lo lleva ni un apagón.'); }
          else if (l.startsWith('SONIDO')) { MQ.audio.toggleMute(); it.label = MQ.audio.muted ? 'SONIDO: NO' : 'SONIDO: SÍ'; }
          else this.menu = null;
        },
        onCancel: () => { this.menu = null; } });
    }

    openParty() {
      const p = MQ.player;
      if (!p.party.length) { this.menu = null; this.tb.open(MQ.ctx, 'No tienes espantos todavía.'); return; }
      this.menu = new MQ.Menu(
        p.party.map((m, i) => ({ label: `${m.shiny ? '★' : ''}${MQ.SPECIES[m.id].name} N${m.lvl}`, sub: m.hp <= 0 ? 'K.O.' : `${m.hp}/${m.maxhp}${m.status ? ' ' + MQ.STATUS[m.status].name : ''}`, value: i, icon: m.id })),
        { x: 8, y: 8, w: 200, rows: 6, rowH: 18, title: 'EQUIPO',
          onPick: (it) => {
            const i = it.value;
            const sub = [{ label: 'Ver ficha' }, { label: 'Poner de primero' }];
            if (p.party[i].item) sub.push({ label: 'Quitar objeto' });
            sub.push({ label: 'Atrás' });
            this.menu = new MQ.Menu(sub, { x: 60, y: 70, w: 150, rows: sub.length,
              onPick: (s) => {
                if (s.label === 'Ver ficha') { this.statView = p.party[i]; this.menu = null; }
                else if (s.label === 'Poner de primero') { p.party.unshift(p.party.splice(i, 1)[0]); this.openParty(); }
                else if (s.label === 'Quitar objeto') {
                  const m = p.party[i];
                  p.bag[m.item] = (p.bag[m.item] || 0) + 1;
                  this.menu = null;
                  this.tb.open(MQ.ctx, `Le quitas ${MQ.ITEMS[m.item].name} a ${MQ.SPECIES[m.id].name} y lo guardas.`);
                  m.item = null;
                }
                else this.openParty();
              },
              onCancel: () => this.openParty() });
          },
          onCancel: () => { this.menu = null; } });
    }

    openBag() {
      const p = MQ.player;
      const keys = Object.keys(p.bag).filter((k) => p.bag[k] > 0);
      if (!keys.length) { this.menu = null; this.tb.open(MQ.ctx, 'La mochila está vacía. Ni un confite de papelón.'); return; }
      this.menu = new MQ.Menu(
        keys.map((k) => ({ label: MQ.ITEMS[k].name, sub: 'x' + p.bag[k], value: k })),
        { x: 8, y: 8, w: 200, rows: 7, title: 'MOCHILA',
          onPick: (it) => {
            const item = MQ.ITEMS[it.value];
            if (item.ball || item.battleStage || item.cholas) { this.menu = null; this.tb.open(MQ.ctx, item.desc); return; }
            if (item.patineta) {
              this.menu = null;
              if (this.map.station || this.map.theme === 'casa') { this.tb.open(MQ.ctx, 'OPERADOR: ¡Aquí no, chamo! La patineta se rueda en túneles y en la calle.'); return; }
              p.skating = !p.skating;
              MQ.audio.sfx('sel');
              this.tb.open(MQ.ctx, p.skating ? 'Te montas en la patineta. El eco del túnel aplaude.' : 'Te bajas de la patineta y la guardas bajo el brazo.');
              return;
            }
            if (item.biper) {
              this.menu = null;
              if ((p.biperCharge || 0) < 100) { this.tb.open(MQ.ctx, `El Bíper parpadea sin señal: le faltan ${100 - (p.biperCharge || 0)} pasos de carga.`); return; }
              // banderas t_ que otras personas usan como reja de aparición: intocables
              const gated = new Set();
              for (const mm of Object.values(MQ.MAPS))
                for (const nn of mm.npcs || []) if (nn.showIf) gated.add(nn.showIf);
              const rematch = (this.map.npcs || []).filter((n) =>
                n.trainer && !n.trainer.boss && !gated.has('t_' + n.trainer.id) && p.flags['t_' + n.trainer.id]);
              if (!rematch.length) { this.tb.open(MQ.ctx, 'El Bíper suena en el vacío: aquí no hay entrenadores pendientes de revancha.'); return; }
              for (const n of rematch) delete p.flags['t_' + n.trainer.id];
              p.biperCharge = 0;
              MQ.audio.sfx('lowhp');
              this.tb.open(MQ.ctx, `¡Bip-bip! ${rematch.length} entrenador${rematch.length === 1 ? '' : 'es'} de este andén responde${rematch.length === 1 ? '' : 'n'} al mensaje: quieren la revancha.`);
              return;
            }
            if (item.finder) {
              this.menu = null;
              const left = (this.map.hidden || []).filter((h) => !p.flags[h.flag]);
              if (!left.length) { MQ.audio.sfx('weak'); this.tb.open(MQ.ctx, 'El Rastreador se queda mudo. Aquí no hay nada enterrado... o ya te lo llevaste todo.'); return; }
              let best = left[0], bd = Infinity;
              for (const h of left) { const d = Math.abs(h.x - p.x) + Math.abs(h.y - p.y); if (d < bd) { bd = d; best = h; } }
              MQ.audio.sfx('click');
              if (bd === 0) { this.tb.open(MQ.ctx, '¡El Rastreador vibra como loco! Está justo bajo tus pies. Dale A.'); return; }
              const hdx = best.x - p.x, hdy = best.y - p.y;
              const rumbo = Math.abs(hdx) >= Math.abs(hdy) ? (hdx > 0 ? 'este' : 'oeste') : (hdy > 0 ? 'sur' : 'norte');
              this.tb.open(MQ.ctx, bd <= 8
                ? `El Rastreador vibra fuerte hacia el ${rumbo}. Algo espera escondido, cerquita.`
                : `El Rastreador zumba bajito hacia el ${rumbo}. Hay algo enterrado en este lugar, pero falta caminar.`);
              return;
            }
            if (item.rod) {
              this.menu = null;
              const [fdx, fdy] = DIRS[p.dir];
              const facing = this.tile(p.x + fdx, p.y + fdy);
              const table = this.map.encRef && MQ.DATA.encounters.tables[this.map.encRef];
              const pool = table && table.fishing && table.fishing[item.rod];
              if (facing !== 'W' && facing !== 'f') { this.tb.open(MQ.ctx, 'Aquí no hay dónde lanzar el anzuelo. Busca agua de verdad.'); return; }
              if (!pool || !pool.length) { this.tb.open(MQ.ctx, 'Lanzas el anzuelo... nada pica. Esta agua guarda silencio.'); return; }
              let fr = Math.random() * 100;
              let sl = pool[0];
              for (const s of pool) { fr -= s.w; if (fr <= 0) { sl = s; break; } }
              MQ.audio.sfx('toss');
              this.encFlash = 22;
              this.pendingEnc = { id: sl.id, lvl: sl.min + MQ.rand(sl.max - sl.min + 1) };
              MQ.audio.music('battle');
              return;
            }
            if (item.repel) {
              if (p.repelSteps > 0) { this.menu = null; this.tb.open(MQ.ctx, 'Ya llevas una esencia encima. No abuses de la protección.'); return; }
              p.bag[it.value]--; p.repelSteps = item.repel;
              MQ.audio.sfx('heal'); this.menu = null;
              this.tb.open(MQ.ctx, `Te untas la ${item.name}. Los espantos débiles no se te acercarán por ${item.repel} pasos.`);
              return;
            }
            // elegir objetivo
            this.menu = new MQ.Menu(
              p.party.map((m, i) => ({ label: `${MQ.SPECIES[m.id].name}`, sub: `${m.hp}/${m.maxhp}${m.item ? ' ◆' : ''}`, value: i, icon: m.id })),
              { x: 40, y: 60, w: 180, rows: 6, rowH: 18, title: '¿Para quién?',
                onPick: (t) => {
                  const m = p.party[t.value];
                  MQ.migrateMon(m);
                  if (item.casete) {
                    const mv = item.casete;
                    if (m.moves.includes(mv)) { MQ.audio.sfx('bump'); this.menu = null; this.tb.open(MQ.ctx, `${MQ.SPECIES[m.id].name} ya se sabe ${MQ.MOVES[mv].name} de memoria.`); return; }
                    const teach = () => {
                      m.pp[mv] = MQ.MOVES[mv].pp; p.bag[it.value]--;
                      MQ.audio.sfx('lvl'); this.menu = null;
                      this.tb.open(MQ.ctx, `¡${MQ.SPECIES[m.id].name} aprendió ${MQ.MOVES[mv].name}! La cinta quedó gastada, como manda la piratería.`);
                    };
                    if (m.moves.length < 4) { m.moves.push(mv); teach(); return; }
                    this.menu = new MQ.Menu(
                      m.moves.map((old, mi) => ({ label: 'Olvidar ' + MQ.MOVES[old].name.slice(0, 14), value: mi }))
                        .concat([{ label: 'Mejor no', value: -1 }]),
                      { x: 50, y: 70, w: 170, rows: 5, title: '¿OLVIDAR CUÁL?',
                        onPick: (s) => {
                          if (s.value < 0) { this.openBag(); return; }
                          m.moves[s.value] = mv;
                          teach();
                        },
                        onCancel: () => this.openBag() });
                    return;
                  }
                  if (item.hold) {
                    // equipar: si ya carga algo, se intercambia a la mochila
                    p.bag[it.value]--;
                    if (m.item) p.bag[m.item] = (p.bag[m.item] || 0) + 1;
                    m.item = it.value;
                    MQ.audio.sfx('sel'); this.menu = null;
                    this.tb.open(MQ.ctx, `${MQ.SPECIES[m.id].name} ahora carga ${item.name}.`);
                  } else if (item.ev && m.hp > 0) {
                    m.evs = m.evs || MQ.zeroEVs();
                    const total = Object.values(m.evs).reduce((a, b) => a + b, 0);
                    if (m.evs[item.ev] >= 100 || total >= 510) { MQ.audio.sfx('bump'); this.menu = null; this.tb.open(MQ.ctx, `${MQ.SPECIES[m.id].name} ya no le saca más a eso. La calle tiene su límite.`); return; }
                    m.evs[item.ev] = Math.min(100, m.evs[item.ev] + 10); p.bag[it.value]--;
                    MQ.recalcStats(m);
                    MQ.audio.sfx('heal'); this.menu = null;
                    this.tb.open(MQ.ctx, `¡${MQ.SPECIES[m.id].name} agarra calle! Su ${MQ.STAT_NAMES[item.ev]} mejora.`);
                  } else if (item.heal && m.hp > 0 && m.hp < m.maxhp) {
                    m.hp = Math.min(m.maxhp, m.hp + item.heal); p.bag[it.value]--;
                    if (item.cure) { m.status = null; m.psn2T = 0; }
                    MQ.audio.sfx('heal'); this.menu = null;
                    this.tb.open(MQ.ctx, `${MQ.SPECIES[m.id].name} se siente como nuevo. ¡Gracias a la maltica de la patria!`);
                  } else if (item.cure && m.status && m.hp > 0) {
                    m.status = null; m.psn2T = 0; p.bag[it.value]--;
                    MQ.audio.sfx('heal'); this.menu = null;
                    this.tb.open(MQ.ctx, `El agua de coco obra el milagro: ¡${MQ.SPECIES[m.id].name} quedó como nuevo!`);
                  } else if (item.revive && m.hp <= 0) {
                    m.hp = Math.max(1, Math.floor(m.maxhp * item.revive)); p.bag[it.value]--;
                    MQ.audio.sfx('heal'); this.menu = null;
                    this.tb.open(MQ.ctx, `¡${MQ.SPECIES[m.id].name} volvió en sí! La cocada no falla.`);
                  } else MQ.audio.sfx('bump');
                },
                onCancel: () => this.openBag() });
          },
          onCancel: () => { this.menu = null; } });
    }

    openLocker() {
      const p = MQ.player;
      this.menu = new MQ.Menu([
        { label: 'Sacar espanto', sub: p.locker.length + '' },
        { label: 'Guardar espanto', sub: p.party.length + '' },
        { label: 'Atrás' },
      ], { x: 8, y: 8, w: 180, rows: 3, title: 'LOCKER DE ESTACIÓN',
        onPick: (it) => {
          if (it.label === 'Sacar espanto') {
            if (!p.locker.length) { MQ.audio.sfx('bump'); return; }
            if (p.party.length >= 6) { this.menu = null; this.tb.open(MQ.ctx, 'Tu equipo está full (6). Guarda uno primero.'); return; }
            this.menu = new MQ.Menu(
              p.locker.map((m, i) => ({ label: `${m.shiny ? '★' : ''}${MQ.SPECIES[m.id].name} N${m.lvl}`, value: i, icon: m.id })),
              { x: 20, y: 40, w: 190, rows: 7, rowH: 18, title: 'SACAR',
                onPick: (s) => { p.party.push(p.locker.splice(s.value, 1)[0]); MQ.audio.sfx('sel'); this.openLocker(); },
                onCancel: () => this.openLocker() });
          } else if (it.label === 'Guardar espanto') {
            if (p.party.length <= 1) { this.menu = null; this.tb.open(MQ.ctx, 'Ni de vaina te quedas solo en la hora fantasma.'); return; }
            this.menu = new MQ.Menu(
              p.party.map((m, i) => ({ label: `${m.shiny ? '★' : ''}${MQ.SPECIES[m.id].name} N${m.lvl}`, value: i, icon: m.id })),
              { x: 20, y: 40, w: 190, rows: 7, rowH: 18, title: 'GUARDAR',
                onPick: (s) => { p.locker.push(p.party.splice(s.value, 1)[0]); MQ.audio.sfx('sel'); this.openLocker(); },
                onCancel: () => this.openLocker() });
          } else this.menu = null;
        },
        onCancel: () => { this.menu = null; } });
    }

    openDex() {
      const p = MQ.player;
      this.menu = new MQ.Menu(
        MQ.DEX_ORDER.map((id, i) => {
          const seen = p.dexSeen[id], caught = p.dexCaught[id];
          return { label: `${String(i + 1).padStart(2, '0')} ${caught ? '●' : seen ? '○' : '—'} ${seen ? MQ.SPECIES[id].name : '???'}`, value: id, icon: seen ? id : null };
        }),
        { x: 8, y: 8, w: 200, rows: 11, rowH: 18, title: 'CUADERNO DE ESPANTOS',
          onPick: (it) => { if (p.dexSeen[it.value]) { this.dexView = it.value; this.menu = null; MQ.audio.cry(it.value); } else MQ.audio.sfx('bump'); },
          onCancel: () => { this.menu = null; } });
    }

    showFichas() {
      const p = MQ.player;
      const owned = ['ficha1', 'ficha2', 'ficha3', 'ficha4'].filter((f) => p.flags[f]).map((f) => '★ ' + MQ.FICHAS[f]);
      this.menu = null;
      this.tb.open(MQ.ctx, owned.length
        ? 'Fichas Doradas:\n' + owned.join('\n')
        : 'Aún no tienes Fichas Doradas. Los Jefes de Estación las custodian: gánatelas.');
    }

    // ---- movimiento y mundo -------------------------------------------------------
    press(k) {
      if (this.carnetView) { if (k === 'a' || k === 'b') { this.carnetView = false; MQ.audio.sfx('blip'); } return; }
      if (this.mapView) { if (k === 'a' || k === 'b') { this.mapView = false; MQ.audio.sfx('blip'); } return; }
      if (this.dexView) {
        if (k === 'start') { this.dexLang = this.dexLang === 'en' ? 'es' : 'en'; MQ.audio.sfx('sel'); return; }
        if (k === 'a' || k === 'b') { this.dexView = null; MQ.audio.sfx('blip'); }
        return;
      }
      if (this.statView) { if (k === 'a' || k === 'b') { this.statView = null; MQ.audio.sfx('blip'); } return; }
      if (this.tb.active) { if (k === 'a' || k === 'b') this.tb.advance(); return; }
      if (this.menu) { this.menu.press(k); return; }
      if (this.script) return;
      if (k === 'a') this.interact();
      else if (k === 'start') this.openPause();
    }

    update() {
      this.frame++;
      if (this.banner && --this.banner.t <= 0) this.banner = null;
      // mariposas amarillas: cruzan el andén y nadie pregunta de dónde vienen
      const th = this.map.theme;
      this.motes = this.motes || [];
      if ((th === 'metro' || th === 'calle') && this.motes.length < 2 && Math.random() < 0.004) {
        this.motes.push({ x: -8, y: 36 + Math.random() * 150, t: Math.random() * 99 });
      }
      this.motes = this.motes.filter((m) => (m.x += 0.55, m.t++, m.x < MQ.W + 10));
      // fundido del warp: a mitad del negro se cambia de mapa
      if (this.fade > 0) {
        this.fade--;
        if (this.fade === 11 && this.pendingWarp) {
          const w = this.pendingWarp;
          this.pendingWarp = null;
          MQ.player.x = w.tx; MQ.player.y = w.ty;
          this.enterMap(w.to);
        }
        return;
      }
      // destello del encuentro salvaje
      if (this.encFlash > 0) {
        this.encFlash--;
        if (this.encFlash === 0) {
          const e = this.pendingEnc;
          this.pendingEnc = null;
          MQ.pushScene(new MQ.BattleScene({ wild: e,
            dark: this.map.theme === 'tunel' || this.map.theme === 'ghost',
            ambience: { theme: this.map.theme, region: this.map.region },
            weather: this.map.weather }, (res) => {
            MQ.popScene();
            MQ.audio.music(this.map.music || 'town');
            if (res === 'lose') MQ.respawn(this);
          }));
        }
        return;
      }
      if (this.tb.active || this.menu || this.script || this.dexView || this.statView || this.mapView || this.carnetView) return;

      // el entrenador que te vio: suelta el ¡!, camina hasta ti y te reta
      if (this.engage) {
        const e = this.engage, n = e.npc, p = MQ.player;
        e.t++;
        if (e.phase === 'alert') {
          if (e.t >= 34) { e.phase = 'walk'; e.t = 0; }
          return;
        }
        if (e.moving > 0) { e.moving -= 2; return; }
        if (Math.abs(p.x - n.x) + Math.abs(p.y - n.y) <= 1) {
          p.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[n.dir];
          this.engage = null;
          return this.startTrainer(n);
        }
        const [dx, dy] = DIRS[n.dir];
        n.x += dx; n.y += dy;
        e.moving = T;
        return;
      }

      // la gente del andén mira alrededor, como la gente de verdad
      // (los entrenadores no: su mirada es su línea de vista, y esa se respeta)
      if (this.frame % 70 === 0 && Math.random() < 0.6) {
        const idlers = (this.map.npcs || []).filter((n) => !n.mon && !n.trainer && !n.itemBall && !(n.hideIf && MQ.player.flags[n.hideIf]) && (!n.showIf || MQ.player.flags[n.showIf]));
        if (idlers.length) MQ.pick(idlers).dir = MQ.pick(['up', 'down', 'left', 'right']);
      }

      // los que giran barren el túnel con la mirada — y quieto también te encuentran
      if (this.frame % 50 === 0) {
        for (const n of this.map.npcs || []) {
          if (!n.spin || !n.trainer || MQ.player.flags['t_' + n.trainer.id]) continue;
          if (n.hideIf && MQ.player.flags[n.hideIf]) continue;
          if (Math.random() < 0.6) n.dir = MQ.pick(['up', 'down', 'left', 'right']);
        }
        if (this.moving === 0 && this.spotNow()) return;
      }

      const p = MQ.player;
      if (this.moving > 0) {
        // patineta > trote con las Cholas (B sostenido) > caminar
        this.moving -= (p.skating && !this.map.station ? 4 : (MQ.input.held.b && p.flags.cholas ? 3 : 2));
        if (this.moving <= 0) { this.moving = 0; this.arrived(); }
        return;
      }
      for (const d of ['up', 'down', 'left', 'right']) {
        if (MQ.input.held[d]) {
          p.dir = d;
          const [dx, dy] = DIRS[d];
          if (this.walkable(p.x + dx, p.y + dy)) {
            p.x += dx; p.y += dy;
            this.moving = T;
          } else if (this.frame % 16 === 0) MQ.audio.sfx('bump'); // el topetazo contra la pared
          break;
        }
      }
    }

    arrived() {
      const p = MQ.player;
      const ch = this.tile(p.x, p.y);
      // el safari se camina con pasos contados (spec §1.5)
      if (this.map.id === 'in_safari') {
        p.safariSteps = (p.safariSteps ?? 0) - 1;
        if (p.safariSteps <= 0) {
          p.safariSteps = 0;
          const back = MQ.MAPS.st_zoologico.warps.find((w) => w.to === 'in_safari');
          p.x = back ? back.x : 20; p.y = back ? Math.max(1, back.y - 1) : 8;
          this.enterMap('st_zoologico');
          this.tb.open(MQ.ctx, 'TAQUILLA: ¡Se acabaron los pasos del safari, mijo! Los animales también descansan. Vuelve cuando quieras.');
          return;
        }
      }
      // el bíper se carga caminando
      if ((p.biperCharge || 0) < 100) p.biperCharge = (p.biperCharge || 0) + 1;
      // la esencia protectora se gasta paso a paso
      if (p.repelSteps > 0) {
        p.repelSteps--;
        if (p.repelSteps === 0) this.banner = { text: 'La esencia se desvaneció...', t: 90 };
      }
      // el veneno gotea al caminar (estilo clásico: se detiene en 1 PS)
      p.steps = (p.steps || 0) + 1;
      if (p.steps % 4 === 0) {
        for (const m of p.party) {
          if ((m.status === 'psn' || m.status === 'psn2') && m.hp > 1) {
            m.hp = Math.max(1, m.hp - 1);
            if (m.hp === 1) { m.status = null; m.psn2T = 0; this.banner = { text: `${MQ.SPECIES[m.id].name} resiste el veneno a pura vergüenza...`, t: 90 }; }
          }
        }
      }
      // warp
      const w = (this.map.warps || []).find((w) => w.x === p.x && w.y === p.y);
      if (w) {
        if (w.requires && !p.flags[w.requires]) {
          const [dx, dy] = DIRS[p.dir];
          p.x -= dx; p.y -= dy;
          this.tb.open(MQ.ctx, w.denied || 'No puedes pasar por aquí todavía.');
          return;
        }
        // el shoop de la puerta + fundido a negro, como manda la tradición
        MQ.audio.sfx('door');
        this.fade = 22;
        this.pendingWarp = w;
        return;
      }
      if (ch === 'M') { this.openTrain(); return; } // pisar la franja del andén = tomar el tren
      if (this.checkTrigger()) return;
      // ¡te vieron! — el ¡! del andén (línea de vista estilo FireRed)
      if (this.spotNow()) return;
      // encuentro salvaje: la pantalla parpadea y arranca la música antes del combate.
      // Tablas nuevas (data/encounters vía encRef) o las clásicas del mapa (enc).
      if (ch !== '~' && ch !== 'g') return;
      // el Carretón ronda Los Teques en el post-juego: se oye antes de verse
      if (this.map.region === 'losteques' && p.flags.ending && !p.dexCaught.carreton && Math.random() < 0.05) {
        MQ.audio.sfx('whistle');
        this.encFlash = 22;
        this.pendingEnc = { id: 'carreton', lvl: 65 };
        MQ.audio.music('boss');
        return;
      }
      const table = this.map.encRef && MQ.DATA && MQ.DATA.encounters.tables[this.map.encRef];
      const enc = this.map.enc;
      let picked = null;
      if (table) {
        const RATES = { oscura: 1 / 8, matorral: 1 / 10, anden: 1 / 12, sendero: 1 / 10, azotea: 1 / 10, tableau: 1 / 8 };
        if (Math.random() < (RATES[table.kind] || 1 / 9)) {
          const pool = table.slots.filter((s) => s.w > 0);
          let r = Math.random() * 100;
          let sl = pool[0];
          for (const s of pool) { r -= s.w; if (r <= 0) { sl = s; break; } }
          picked = { id: sl.id, lvl: sl.min + MQ.rand(sl.max - sl.min + 1) };
        }
      } else if (enc && Math.random() < enc.rate) {
        const pool = enc.mons.filter((m) => !m[4] || p.flags[m[4]]);
        const total = pool.reduce((s, m) => s + m[1], 0);
        let r = Math.random() * total;
        let pickd = pool[0];
        for (const m of pool) { r -= m[1]; if (r <= 0) { pickd = m; break; } }
        picked = { id: pickd[0], lvl: pickd[2] + MQ.rand(pickd[3] - pickd[2] + 1) };
      }
      if (!picked) return;
      // la esencia de azabache espanta a los débiles
      const lead = p.party.find((m) => m.hp > 0);
      if (p.repelSteps > 0 && lead && picked.lvl < lead.lvl) return;
      this.encFlash = 22;
      this.pendingEnc = picked;
      MQ.audio.music(picked.id === 'trenfantasma' ? 'boss' : 'battle');
    }

    // ---- dibujo ---------------------------------------------------------------------
    draw(ctx) {
      const p = MQ.player;
      const m = this.map;
      const th = MQ.THEMES[m.theme] || MQ.THEMES.metro;
      const mw = m.grid[0].length * T, mh = m.grid.length * T;
      // posición en píxeles del jugador (interpola el paso)
      const [dx, dy] = DIRS[p.dir];
      const off = this.moving;
      const ppx = p.x * T - dx * off, ppy = p.y * T - dy * off;
      let camX = MQ.clamp(ppx - MQ.W / 2 + T / 2, 0, Math.max(0, mw - MQ.W));
      let camY = MQ.clamp(ppy - MQ.H / 2 + T / 2, 0, Math.max(0, mh - MQ.H));
      if (mw < MQ.W) camX = (mw - MQ.W) / 2;
      if (mh < MQ.H) camY = (mh - MQ.H) / 2;

      ctx.fillStyle = '#08060e'; ctx.fillRect(0, 0, MQ.W, MQ.H);
      const x0 = Math.floor(camX / T), y0 = Math.floor(camY / T);
      const now = performance.now();
      const peekAt = (gx, gy) => (ddx, ddy) => {
        const row = m.grid[gy + ddy];
        return (row && row[gx + ddx]) || '#';
      };
      for (let y = y0; y <= y0 + MQ.VIEW_H && y < m.grid.length; y++) {
        if (y < 0) continue;
        for (let x = x0; x <= x0 + MQ.VIEW_W && x < m.grid[y].length; x++) {
          if (x < 0) continue;
          MQ.drawTile(ctx, m.grid[y][x], Math.round(x * T - camX), Math.round(y * T - camY), th, now, x, y, peekAt(x, y));
        }
      }
      // el tren de la estación vive su ciclo: entra, espera con las puertas
      // encendidas y sigue su ruta (pisar la franja M lo aborda en cualquier momento)
      if (m.station) {
        const per = 11000, ph = (now % per) / 1000;
        const tw = m.grid[0].length * T - 2 * T;
        let tx = null;
        if (ph < 1.2) tx = T - (tw + 2 * T) * Math.pow(1 - ph / 1.2, 2);
        else if (ph < 6.4) tx = T;
        else if (ph < 7.6) tx = T + (tw + 2 * T) * Math.pow((ph - 6.4) / 1.2, 2);
        if (tx !== null) {
          MQ.drawTrain(ctx, Math.round(tx - camX), Math.round(T - camY), tw);
          if (ph >= 1.2 && ph < 6.4) { // puertas cálidas mientras espera
            ctx.fillStyle = (now / 500 | 0) % 2 ? 'rgba(255,230,110,0.85)' : 'rgba(255,230,110,0.55)';
            for (let dx = 20; dx < tw - 20; dx += 56) ctx.fillRect(Math.round(tx + dx - camX), Math.round(T - camY) + 11, 8, 5);
          }
        }
        // seña parpadeante para abordar cuando estás cerca del borde
        if (!this.menu && !this.tb.active && !this.script && p.y >= 3 && p.y <= 4 && (now / 450 | 0) % 2) {
          ctx.font = MQ.FONT_B; ctx.fillStyle = '#f5d76e';
          ctx.fillText('▲ TREN', Math.round(p.x * T - camX) - 6, Math.round(2 * T - camY) + 4);
        }
      }
      // NPCs
      for (const n of m.npcs || []) {
        if (n.hideIf && p.flags[n.hideIf]) continue;
        if (n.showIf && !p.flags[n.showIf]) continue;
        const eng = this.engage && this.engage.npc === n ? this.engage : null;
        // el entrenador que camina hacia ti se interpola como el jugador
        let ex = 0, ey = 0, step = 0;
        if (eng && eng.moving > 0) {
          const [edx, edy] = DIRS[n.dir];
          ex = -edx * eng.moving; ey = -edy * eng.moving;
          step = ((eng.moving / 8) | 0) % 2;
        }
        const nx = Math.round(n.x * T - camX + ex), ny = Math.round(n.y * T - camY + ey);
        if (nx < -T || ny < -T || nx > MQ.W || ny > MQ.H) continue;
        // paquetico tirado: bultico claro con cinta naranja y su nudo
        if (n.itemBall) {
          ctx.fillStyle = '#d8d8e2'; ctx.fillRect(nx + 4, ny + 7, 8, 7);
          ctx.fillStyle = '#e85a1a'; ctx.fillRect(nx + 4, ny + 10, 8, 2);
          ctx.fillStyle = '#8a8a96'; ctx.fillRect(nx + 6, ny + 5, 4, 2);
          continue;
        }
        if (n.mon) MQ.drawMon(ctx, n.mon, nx, ny, 1);
        else MQ.drawPerson(ctx, nx, ny, MQ.LOOKS[n.look] || MQ.LOOKS.chamo, n.dir || 'down', step, !!(eng && eng.moving > 0));
        if (n.boss && !p.flags['t_' + (n.trainer && n.trainer.id)] && (now / 500 | 0) % 2) {
          ctx.fillStyle = '#f5d76e'; ctx.font = MQ.FONT_B;
          ctx.fillText('★', nx + 5, ny - 9);
        }
        // el globo del ¡! — brinca dos píxeles, como en el andén de verdad
        if (eng && eng.phase === 'alert') {
          const hop = eng.t < 8 ? -2 : 0;
          MQ.panel(ctx, nx + 2, ny - 18 + hop, 12, 14);
          ctx.fillStyle = '#e04b32'; ctx.font = MQ.FONT_B; ctx.textBaseline = 'top';
          ctx.fillText('!', nx + 6, ny - 15 + hop);
        }
      }
      // jugador
      const walkFrame = this.moving > 0 ? ((this.moving / 8) | 0) % 2 : 0;
      MQ.drawPerson(ctx, Math.round(ppx - camX), Math.round(ppy - camY), MQ.LOOKS[p.look] || MQ.LOOKS.player, p.dir, walkFrame, this.moving > 0);

      // mariposas amarillas (realismo mágico de a 3 píxeles)
      for (const mt of this.motes || []) {
        const fy = mt.y + Math.sin(mt.t / 9) * 6;
        ctx.fillStyle = '#ffd94a';
        ctx.fillRect(mt.x, fy, 2, 2);
        if ((mt.t / 6 | 0) % 2) { ctx.fillRect(mt.x - 2, fy - 1, 2, 2); ctx.fillRect(mt.x + 2, fy - 1, 2, 2); }
      }

      // oscuridad ambiental en túneles
      if (m.theme === 'tunel' || m.theme === 'ghost') {
        const g = ctx.createRadialGradient(ppx - camX + 8, ppy - camY + 8, 30, ppx - camX + 8, ppy - camY + 8, m.theme === 'ghost' ? 90 : 130);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, m.theme === 'ghost' ? 'rgba(2,0,8,0.88)' : 'rgba(2,0,8,0.7)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, MQ.W, MQ.H);
      }

      if (this.banner) {
        ctx.font = MQ.FONT_B;
        const tw = ctx.measureText(this.banner.text).width;
        MQ.panel(ctx, MQ.W / 2 - tw / 2 - 10, 6, tw + 20, 18);
        ctx.fillStyle = '#f5a623'; ctx.textBaseline = 'top';
        ctx.fillText(this.banner.text, MQ.W / 2 - tw / 2, 11);
      }

      if (this.mapView || this.mapBehind) this.drawMetroMap(ctx);
      if (this.carnetView) this.drawCarnet(ctx);
      if (this.dexView) this.drawDexPage(ctx, this.dexView);
      if (this.statView) this.drawStatPage(ctx, this.statView);
      if (this.menu) this.menu.draw(ctx);
      this.tb.draw(ctx);

      // fundido del warp / destello del encuentro
      if (this.fade > 0) {
        const a = this.fade > 11 ? (22 - this.fade) / 11 : this.fade / 11;
        ctx.fillStyle = `rgba(2,0,8,${a.toFixed(2)})`;
        ctx.fillRect(0, 0, MQ.W, MQ.H);
      }
      if (this.encFlash > 0 && (this.encFlash / 4 | 0) % 2) {
        ctx.fillStyle = 'rgba(245,235,210,0.85)';
        ctx.fillRect(0, 0, MQ.W, MQ.H);
      }
    }

    // el Carnet del Pasajero: la Trainer Card del Metro
    drawCarnet(ctx) {
      const p = MQ.player;
      MQ.panel(ctx, 8, 8, MQ.W - 16, MQ.H - 16);
      ctx.font = MQ.FONT_B; ctx.textBaseline = 'top';
      ctx.fillStyle = '#e85a1a';
      ctx.fillRect(16, 16, MQ.W - 32, 3);
      ctx.fillStyle = '#f5a623';
      ctx.fillText('CARNET DEL PASAJERO · METRO DE CARACAS', 20, 26);
      // foto tipo carnet: el pasajero sobre fondo de cabina
      ctx.fillStyle = '#2a2438'; ctx.fillRect(22, 44, 36, 42);
      ctx.strokeStyle = '#8a8a96'; ctx.lineWidth = 1; ctx.strokeRect(22.5, 44.5, 35, 41);
      MQ.drawPerson(ctx, 32, 58, MQ.LOOKS[p.look] || MQ.LOOKS.player, 'down', 0);
      // datos del viajero
      const f = p.frames || 0;
      const hh = Math.floor(f / 216000), mm = Math.floor(f / 3600) % 60;
      const caught = Object.keys(p.dexCaught).length, seen = Object.keys(p.dexSeen).length;
      ctx.fillStyle = '#e8dfc8'; ctx.font = MQ.FONT;
      ctx.fillText(`PASAJERO: ${p.name}`, 70, 46);
      ctx.fillText(`BOLOS: ${p.money}b`, 70, 60);
      ctx.fillText(`TIEMPO DE VIAJE: ${hh}:${String(mm).padStart(2, '0')}`, 70, 74);
      ctx.fillText(`CUADERNO: ${caught} fichados · ${seen} vistos`, 70, 88);
      // las ocho Fichas Doradas: troqueles que se van dorando
      ctx.fillStyle = '#f5a623'; ctx.font = MQ.FONT_B;
      ctx.fillText('FICHAS DORADAS', 22, 104);
      Object.keys(MQ.FICHAS).forEach((fk, i) => {
        const fx = 24 + i * 26, fy = 118;
        ctx.fillStyle = p.flags[fk] ? '#f5d76e' : '#2a2438';
        ctx.beginPath(); ctx.arc(fx + 8, fy + 8, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = p.flags[fk] ? '#b8860b' : '#4a4458'; ctx.stroke();
        if (p.flags[fk]) { ctx.fillStyle = '#b8860b'; ctx.font = MQ.FONT; ctx.fillText(String(i + 1), fx + 6, fy + 4); }
      });
      ctx.fillStyle = '#8a8aa0'; ctx.font = MQ.FONT;
      ctx.fillText('Válido para una (1) hora fantasma por noche.', 22, 146);
      ctx.fillText('Intransferible. El Metro no se hace responsable', 22, 158);
      ctx.fillText('por espantos fichados dentro de sus instalaciones.', 22, 168);
      ctx.fillText('(A para volver)', 22, MQ.H - 34);
    }

    drawDexPage(ctx, id) {
      const sp = MQ.SPECIES[id];
      MQ.panel(ctx, 8, 8, MQ.W - 16, MQ.H - 16);
      MQ.drawMon(ctx, id, 24, 26, 4);
      ctx.font = MQ.FONT_B; ctx.textBaseline = 'top'; ctx.fillStyle = '#f5a623';
      ctx.fillText(`#${String(MQ.DEX_ORDER.indexOf(id) + 1).padStart(2, '0')}  ${sp.name}`, 110, 26);
      sp.types.forEach((t, i) => {
        ctx.fillStyle = MQ.TYPES[t].color;
        ctx.fillRect(110, 40 + i * 12, 8, 8);
        ctx.fillStyle = '#e8dfc8'; ctx.font = MQ.FONT;
        ctx.fillText(t, 122, 40 + i * 12);
      });
      ctx.fillStyle = '#8a8aa0'; ctx.font = MQ.FONT;
      const caught = MQ.player.dexCaught[id];
      ctx.fillText(caught ? 'FICHADO ●' : 'VISTO ○', 110, 70);
      ctx.fillStyle = '#e8dfc8';
      const entry = this.dexLang === 'en' ? (sp.dex_en || sp.dex) : sp.dex;
      const lines = MQ.wrap(ctx, caught ? entry : 'Se sabe poco. Fíchalo para que el Cuaderno hable.', MQ.W - 56);
      lines.forEach((l, i) => ctx.fillText(l, 24, 108 + i * 12));
      ctx.fillStyle = '#8a8aa0';
      ctx.fillText(`(A para volver · MENÚ: ${this.dexLang === 'en' ? 'ver en español' : 'read in English'})`, 24, MQ.H - 34);
    }

    drawStatPage(ctx, m) {
      const sp = MQ.SPECIES[m.id];
      MQ.panel(ctx, 8, 8, MQ.W - 16, MQ.H - 16);
      if (!(m.shiny && MQ.drawSprite(ctx, m.id, 'shiny', 24, 26, 64))) MQ.drawMon(ctx, m.id, 24, 26, 4);
      ctx.font = MQ.FONT_B; ctx.textBaseline = 'top'; ctx.fillStyle = '#f5a623';
      MQ.migrateMon(m);
      const gen = m.gender === 'm' ? '♂' : m.gender === 'f' ? '♀' : '';
      ctx.fillText(`${m.shiny ? '★' : ''}${sp.name}${gen}  N${m.lvl}`, 110, 26);
      ctx.font = MQ.FONT; ctx.fillStyle = '#e8dfc8';
      ctx.fillText(`PS  ${m.hp}/${m.maxhp}${m.status ? '  · ' + MQ.STATUS[m.status].name : ''}`, 110, 42);
      ctx.fillText(`ATQ ${m.atk}  DEF ${m.def}  VEL ${m.spe}`, 110, 54);
      ctx.fillText(`A.E ${m.spa}  D.E ${m.spd}`, 110, 66);
      ctx.fillStyle = '#8a8aa0';
      ctx.fillText(`${MQ.NATURE_NAMES[m.nature] || ''} · ${m.ability ? MQ.ABILITIES[m.ability].name : ''}`, 110, 78);
      if (m.item) ctx.fillText(`Lleva: ${MQ.ITEMS[m.item].name}`, 110, 88);
      const nxt = MQ.xpForLevel(m.lvl + 1, MQ.xpGroupOf(m.id)) - m.xp;
      ctx.fillText(`Faltan ${Math.max(0, nxt)} EXP para nivel ${m.lvl + 1}`, 110, m.item ? 98 : 88);
      ctx.fillStyle = '#f5a623';
      ctx.fillText('MOVIMIENTOS · PP', 24, 108);
      ctx.fillStyle = '#e8dfc8';
      MQ.ensurePP(m);
      m.moves.forEach((mv, i) => {
        const M = MQ.MOVES[mv];
        ctx.fillText(`${M.name}`, 24, 122 + i * 12);
        ctx.fillStyle = '#8a8aa0';
        ctx.fillText(`${m.pp[mv] ?? M.pp}/${M.pp}`, 160, 122 + i * 12);
        ctx.fillStyle = MQ.TYPES[M.type].color;
        ctx.fillText(M.pow ? `${M.pow}` : '—', 200, 122 + i * 12);
        ctx.fillStyle = '#e8dfc8';
      });
      ctx.fillStyle = '#8a8aa0';
      ctx.fillText('(A para volver)', 24, MQ.H - 34);
    }
  };
})();
