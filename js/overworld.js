// Metro Quest — el mundo caminable: andenes, túneles y la hora fantasma.
(() => {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  const T = MQ.TILE;
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

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
      this.enterMap(MQ.player.map, true);
    }

    get map() { return MQ.MAPS[MQ.player.map]; }
    tile(x, y) {
      const g = this.map.grid;
      if (y < 0 || y >= g.length || x < 0 || x >= g[y].length) return '#';
      return g[y][x];
    }
    npcAt(x, y) {
      return (this.map.npcs || []).find((n) => n.x === x && n.y === y && !(n.hideIf && MQ.player.flags[n.hideIf]));
    }
    walkable(x, y) {
      return MQ.WALKABLE.has(this.tile(x, y)) && !this.npcAt(x, y);
    }

    enterMap(id, first) {
      const p = MQ.player;
      p.map = id;
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
        MQ.pushScene(new MQ.BattleScene(op.battle, (res) => {
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
      const ch = this.tile(tx, ty);
      if (ch === 'H') return this.runScript(MQ.SCRIPTS.heal());
      if (ch === 'S') return this.openShop();
      if (ch === 'a' && this.map.tileScripts && this.map.tileScripts.a)
        return this.runScript(MQ.SCRIPTS[this.map.tileScripts.a]());
    }

    talkTo(npc) {
      if (!npc.mon) npc.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[MQ.player.dir];
      if (npc.script) {
        const s = MQ.SCRIPTS[npc.script] && MQ.SCRIPTS[npc.script]();
        if (s) return this.runScript(s);
      }
      if (npc.trainer) {
        const tr = npc.trainer;
        if (MQ.player.flags['t_' + tr.id]) {
          this.tb.open(MQ.ctx, tr.after || (tr.boss ? 'Ya tienes mi Ficha Dorada. Hazle honor, chamo.' : '¡Buen combate el de nosotros! Sigue pa\' lante.'), null, npc.name);
          return;
        }
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
      const txt = Array.isArray(npc.text) ? MQ.pick(npc.text) : npc.text;
      if (txt) this.tb.open(MQ.ctx, txt, null, npc.name);
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
      const stops = MQ.TRAIN_STOPS.filter((s) => p.visited[s] && s !== p.map);
      if (!stops.length) {
        this.tb.open(MQ.ctx, 'El tren de la hora fantasma solo para en estaciones que ya conoces. Por ahora: túnel y pata, mi pana.', null, 'Voz del Metro');
        return;
      }
      this.menu = new MQ.Menu(
        stops.map((s) => ({ label: MQ.MAPS[s].name.replace('Estación ', ''), value: s })).concat([{ label: 'Quedarme', value: null }]),
        { x: 8, y: 30, w: 190, rows: 9, title: 'TREN FANTASMA · ¿Destino?',
          onPick: (it) => {
            this.menu = null;
            if (!it.value) return;
            MQ.audio.sfx('train');
            MQ.player.x = 13; MQ.player.y = 3; MQ.player.dir = 'down';
            this.enterMap(it.value);
            this.tb.open(MQ.ctx, `«Próxima estación: ${MQ.MAPS[it.value].name.replace('Estación ', '')}. Recuerde: deje salir antes de entrar.»`, null, 'Voz del Metro');
          },
          onCancel: () => { this.menu = null; } });
    }

    // ---- menú de pausa ----------------------------------------------------------
    openPause() {
      MQ.audio.sfx('sel');
      const p = MQ.player;
      this.menu = new MQ.Menu([
        { label: 'EQUIPO' }, { label: 'CUADERNO' }, { label: 'MOCHILA' },
        { label: 'LOCKER' }, { label: 'FICHAS' }, { label: 'GUARDAR' },
        { label: MQ.audio.muted ? 'SONIDO: NO' : 'SONIDO: SÍ' }, { label: 'CERRAR' },
      ], { x: MQ.W - 124, y: 8, w: 116, rows: 8, title: p.name + ' · ' + p.money + 'b',
        onPick: (it) => {
          const l = it.label;
          if (l === 'EQUIPO') this.openParty();
          else if (l === 'CUADERNO') this.openDex();
          else if (l === 'MOCHILA') this.openBag();
          else if (l === 'LOCKER') this.openLocker();
          else if (l === 'FICHAS') this.showFichas();
          else if (l === 'GUARDAR') { MQ.save(); this.menu = null; this.tb.open(MQ.ctx, '¡Partida guardada! Tranquilo, que esto no se lo lleva ni un apagón.'); }
          else if (l.startsWith('SONIDO')) { MQ.audio.toggleMute(); it.label = MQ.audio.muted ? 'SONIDO: NO' : 'SONIDO: SÍ'; }
          else this.menu = null;
        },
        onCancel: () => { this.menu = null; } });
    }

    openParty() {
      const p = MQ.player;
      if (!p.party.length) { this.menu = null; this.tb.open(MQ.ctx, 'No tienes espantos todavía.'); return; }
      this.menu = new MQ.Menu(
        p.party.map((m, i) => ({ label: `${MQ.SPECIES[m.id].name} N${m.lvl}`, sub: m.hp <= 0 ? 'K.O.' : `${m.hp}/${m.maxhp}${m.status ? ' ' + MQ.STATUS[m.status].name : ''}`, value: i })),
        { x: 8, y: 8, w: 200, rows: 6, title: 'EQUIPO',
          onPick: (it) => {
            const i = it.value;
            this.menu = new MQ.Menu([
              { label: 'Ver ficha' }, { label: 'Poner de primero' }, { label: 'Atrás' },
            ], { x: 60, y: 70, w: 150, rows: 3,
              onPick: (s) => {
                if (s.label === 'Ver ficha') { this.statView = p.party[i]; this.menu = null; }
                else if (s.label === 'Poner de primero') { p.party.unshift(p.party.splice(i, 1)[0]); this.openParty(); }
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
            if (item.ball) { this.menu = null; this.tb.open(MQ.ctx, item.desc); return; }
            // elegir objetivo
            this.menu = new MQ.Menu(
              p.party.map((m, i) => ({ label: `${MQ.SPECIES[m.id].name}`, sub: `${m.hp}/${m.maxhp}`, value: i })),
              { x: 40, y: 60, w: 180, rows: 6, title: '¿Para quién?',
                onPick: (t) => {
                  const m = p.party[t.value];
                  if (item.heal && m.hp > 0 && m.hp < m.maxhp) {
                    m.hp = Math.min(m.maxhp, m.hp + item.heal); p.bag[it.value]--;
                    MQ.audio.sfx('heal'); this.menu = null;
                    this.tb.open(MQ.ctx, `${MQ.SPECIES[m.id].name} se siente como nuevo. ¡Gracias a la maltica de la patria!`);
                  } else if (item.cure && m.status && m.hp > 0) {
                    m.status = null; p.bag[it.value]--;
                    MQ.audio.sfx('heal'); this.menu = null;
                    this.tb.open(MQ.ctx, `El agua de coco obra el milagro: ¡${MQ.SPECIES[m.id].name} quedó como nuevo!`);
                  } else if (item.revive && m.hp <= 0) {
                    m.hp = Math.floor(m.maxhp * item.revive); p.bag[it.value]--;
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
              p.locker.map((m, i) => ({ label: `${MQ.SPECIES[m.id].name} N${m.lvl}`, value: i })),
              { x: 20, y: 40, w: 190, rows: 7, title: 'SACAR',
                onPick: (s) => { p.party.push(p.locker.splice(s.value, 1)[0]); MQ.audio.sfx('sel'); this.openLocker(); },
                onCancel: () => this.openLocker() });
          } else if (it.label === 'Guardar espanto') {
            if (p.party.length <= 1) { this.menu = null; this.tb.open(MQ.ctx, 'Ni de vaina te quedas solo en la hora fantasma.'); return; }
            this.menu = new MQ.Menu(
              p.party.map((m, i) => ({ label: `${MQ.SPECIES[m.id].name} N${m.lvl}`, value: i })),
              { x: 20, y: 40, w: 190, rows: 7, title: 'GUARDAR',
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
          return { label: `${String(i + 1).padStart(2, '0')} ${caught ? '●' : seen ? '○' : '—'} ${seen ? MQ.SPECIES[id].name : '???'}`, value: id };
        }),
        { x: 8, y: 8, w: 200, rows: 12, title: 'CUADERNO DE ESPANTOS',
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
      if (this.dexView) { if (k === 'a' || k === 'b') { this.dexView = null; MQ.audio.sfx('blip'); } return; }
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
      if (this.tb.active || this.menu || this.script || this.dexView || this.statView) return;

      const p = MQ.player;
      if (this.moving > 0) {
        this.moving -= 2;
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
          }
          break;
        }
      }
    }

    arrived() {
      const p = MQ.player;
      const ch = this.tile(p.x, p.y);
      // warp
      const w = (this.map.warps || []).find((w) => w.x === p.x && w.y === p.y);
      if (w) {
        if (w.requires && !p.flags[w.requires]) {
          const [dx, dy] = DIRS[p.dir];
          p.x -= dx; p.y -= dy;
          this.tb.open(MQ.ctx, w.denied || 'No puedes pasar por aquí todavía.');
          return;
        }
        p.x = w.tx; p.y = w.ty;
        this.enterMap(w.to);
        return;
      }
      if (ch === 'M') { if (p.dir === 'up') this.openTrain(); return; }
      if (this.checkTrigger()) return;
      // encuentro salvaje
      const enc = this.map.enc;
      if (enc && (ch === '~' || ch === 'g') && Math.random() < enc.rate) {
        const pool = enc.mons.filter((m) => !m[4] || p.flags[m[4]]);
        const total = pool.reduce((s, m) => s + m[1], 0);
        let r = Math.random() * total;
        let pickd = pool[0];
        for (const m of pool) { r -= m[1]; if (r <= 0) { pickd = m; break; } }
        const lvl = pickd[2] + MQ.rand(pickd[3] - pickd[2] + 1);
        MQ.pushScene(new MQ.BattleScene({ wild: { id: pickd[0], lvl } }, (res) => {
          MQ.popScene();
          MQ.audio.music(this.map.music || 'town');
          if (res === 'lose') MQ.respawn(this);
        }));
      }
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
      for (let y = y0; y <= y0 + MQ.VIEW_H && y < m.grid.length; y++) {
        if (y < 0) continue;
        for (let x = x0; x <= x0 + MQ.VIEW_W && x < m.grid[y].length; x++) {
          if (x < 0) continue;
          MQ.drawTile(ctx, m.grid[y][x], Math.round(x * T - camX), Math.round(y * T - camY), th, now);
        }
      }
      // tren decorativo en estaciones
      if (m.station && (now / 9000 | 0) % 2 === 0) {
        MQ.drawTrain(ctx, Math.round(T - camX), Math.round(T - camY), m.grid[0].length * T - 2 * T);
      }
      // NPCs
      for (const n of m.npcs || []) {
        if (n.hideIf && p.flags[n.hideIf]) continue;
        const nx = Math.round(n.x * T - camX), ny = Math.round(n.y * T - camY);
        if (nx < -T || ny < -T || nx > MQ.W || ny > MQ.H) continue;
        if (n.mon) MQ.drawMon(ctx, n.mon, nx, ny, 1);
        else MQ.drawPerson(ctx, nx, ny, MQ.LOOKS[n.look] || MQ.LOOKS.chamo, n.dir || 'down', 0);
        if (n.boss && !p.flags['t_' + (n.trainer && n.trainer.id)] && (now / 500 | 0) % 2) {
          ctx.fillStyle = '#f5d76e'; ctx.font = MQ.FONT_B;
          ctx.fillText('★', nx + 5, ny - 9);
        }
      }
      // jugador
      const walkFrame = this.moving > 0 ? ((this.moving / 8) | 0) % 2 : 0;
      MQ.drawPerson(ctx, Math.round(ppx - camX), Math.round(ppy - camY), MQ.LOOKS[p.look] || MQ.LOOKS.player, p.dir, walkFrame);

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

      if (this.dexView) this.drawDexPage(ctx, this.dexView);
      if (this.statView) this.drawStatPage(ctx, this.statView);
      if (this.menu) this.menu.draw(ctx);
      this.tb.draw(ctx);
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
      const lines = MQ.wrap(ctx, caught ? sp.dex : 'Se sabe poco. Fíchalo para que el Cuaderno hable.', MQ.W - 56);
      lines.forEach((l, i) => ctx.fillText(l, 24, 108 + i * 12));
      ctx.fillStyle = '#8a8aa0';
      ctx.fillText('(A para volver)', 24, MQ.H - 34);
    }

    drawStatPage(ctx, m) {
      const sp = MQ.SPECIES[m.id];
      MQ.panel(ctx, 8, 8, MQ.W - 16, MQ.H - 16);
      MQ.drawMon(ctx, m.id, 24, 26, 4);
      ctx.font = MQ.FONT_B; ctx.textBaseline = 'top'; ctx.fillStyle = '#f5a623';
      ctx.fillText(`${sp.name}  N${m.lvl}`, 110, 26);
      ctx.font = MQ.FONT; ctx.fillStyle = '#e8dfc8';
      ctx.fillText(`PS  ${m.hp}/${m.maxhp}${m.status ? '  · ' + MQ.STATUS[m.status].name : ''}`, 110, 42);
      ctx.fillText(`ATQ ${m.atk}  DEF ${m.def}  VEL ${m.spd}`, 110, 54);
      const nxt = MQ.xpForLevel(m.lvl + 1) - m.xp;
      ctx.fillStyle = '#8a8aa0';
      ctx.fillText(`Faltan ${Math.max(0, nxt)} EXP para nivel ${m.lvl + 1}`, 110, 66);
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
