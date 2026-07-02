// Metro Quest — combate por turnos en el andén, ahora con el motor Gen-3 completo:
// físico/especial por tipo, etapas ±6, críticos por etapa, 7 estados, clima,
// habilidades, objetos equipados y la captura Gen-3 exacta (systems-spec §1-2).
(() => {
  const MQ = (globalThis.MQ = globalThis.MQ || {});

  const stageMul = (s) => Math.max(2, 2 + s) / Math.max(2, 2 - s);
  const accMul = (s) => Math.max(3, 3 + s) / Math.max(3, 3 - s);
  const name = (m) => MQ.SPECIES[m.id].name;
  const FALL = 16;        // cuadros que tarda un espanto en caer al debilitarse
  const E_X = MQ.W - 84, E_Y = 28, M_X = 18, M_Y = 130, SC = 4;
  const artH = (id) => ((MQ.SPECIES[id].art || ['']).length * SC);
  const CRIT_ODDS = [16, 8, 4, 3, 2];   // etapas de crítico Gen 3 (1/x)
  const zeroStages = () => ({ atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 });
  const freshVol = () => ({ mareo: 0, trap: 0, noescape: false, charging: null,
    protectCount: 0, protected: false, endure: false, recharge: false,
    flinch: false, leech: false, curse: false, critUp: 0, loaf: false,
    lastPhys: 0, lastSpec: 0 });

  MQ.addMon = (mon) => {
    const p = MQ.player;
    p.dexCaught[mon.id] = true; p.dexSeen[mon.id] = true;
    if (p.party.length < 6) { p.party.push(mon); return 'equipo'; }
    p.locker.push(mon); return 'locker';
  };

  MQ.BattleScene = class {
    constructor(opts, onEnd) {
      this.opts = opts; this.onEnd = onEnd;
      this.tb = new MQ.Textbox();
      this.queue = [];
      this.phase = 'msg';
      this.menu = null;
      this.over = false;
      this.anim = { shake: 0, flash: 0, px: 0, ex: 0, intro: 36, efall: 0, mfall: 0 };
      this.cap = null;
      this.fc = 0;
      this.fleeTries = 0;
      this.moneyMul = 1;
      // clima: del mapa (nativo, no expira) o de movimientos/habilidades (5 rondas)
      this.weather = opts.weather ? { kind: opts.weather, turns: -1 } : null;
      this.phaz = {}; this.ehaz = {};   // cardonal por lado

      const p = MQ.player;
      p.party.forEach(MQ.ensurePP); // migra partidas viejas
      this.trainer = opts.trainer || null;
      if (this.trainer) {
        this.eteam = this.trainer.team.map(([id, lvl]) => MQ.makeMon(id, lvl));
        this.ei = 0;
        this.enemy = this.eteam[0];
        MQ.audio.music(this.trainer.boss ? 'boss' : 'battle');
      } else {
        this.enemy = MQ.makeMon(opts.wild.id, opts.wild.lvl,
          { shiny: opts.wild.shiny ?? (MQ.rand(MQ.SHINY_ODDS) === 0), hidden: MQ.rand(64) === 0 });
        MQ.audio.music(opts.wild.id === 'trenfantasma' ? 'boss' : 'battle');
      }
      p.dexSeen[this.enemy.id] = true;
      this.mi = p.party.findIndex((m) => m.hp > 0);
      this.mine = p.party[this.mi];
      this.pst = zeroStages(); this.est = zeroStages();
      this.pvol = freshVol(); this.evol = freshVol();
      const foes = this.eteam ? this.eteam.map((m) => m.id) : [this.enemy.id];
      MQ.sprites.preload(foes, ['front']);
      MQ.sprites.preload(p.party.map((m) => m.id), ['front', 'back']);

      if (this.trainer) {
        this.say(`¡${this.trainer.cls} ${this.trainer.name || ''} te reta!`.replace('  ', ' '));
        this.say(this.trainer.intro);
        this.say(`${this.trainer.name || this.trainer.cls} saca a ${name(this.enemy)}.`, () => MQ.audio.cry(this.enemy.id));
      } else {
        MQ.audio.cry(this.enemy.id);
        if (this.enemy.shiny) MQ.audio.sfx('sparkle');
        this.say(this.enemy.shiny
          ? `¡Un ${name(this.enemy)} TORNASOL salvaje apareció! ¡De esos no se ven todos los días!`
          : `¡Un ${name(this.enemy)} salvaje apareció en la oscuridad!`);
      }
      this.announceWeather();
      this.entryEffects(this.enemy, false);
      this.say(`¡Dale, ${name(this.mine)}!`, () => {
        MQ.audio.cry(this.mine.id);
        this.entryEffects(this.mine, true);
        this.act(() => this.toMenu());
      });
    }

    say(t, fn) { this.queue.push({ t, fn }); }
    // encola una acción sin texto: corre cuando le toca el turno en la cola
    act(fn) { this.queue.push({ t: null, fn }); }

    pump() {
      if (this.tb.active) return;
      const m = this.queue.shift();
      if (!m) return;
      if (m.t === null) { m.fn && m.fn(); this.pump(); return; }
      this.phase = 'msg';
      this.tb.open(MQ.ctx, m.t, () => { m.fn && m.fn(); this.pump(); });
    }

    announceWeather() {
      if (this.weather) this.say(MQ.WEATHER[this.weather.kind].desc);
    }

    // — habilidades y peligros al entrar al andén —
    entryEffects(mon, isMine) {
      const foeSt = isMine ? this.est : this.pst;
      const foe = isMine ? this.enemy : this.mine;
      const haz = isMine ? this.phaz : this.ehaz;
      if (haz.cardonal && mon.ability !== 'nadoaereo') {
        const d = Math.max(1, Math.floor(mon.maxhp / 8));
        mon.hp = Math.max(1, mon.hp - d);
        this.say(`¡El cardonal pincha a ${name(mon)} al entrar!`);
      }
      if (mon.ability === 'malacara' && foe.hp > 0 && foe.ability !== 'brazofirme') {
        foeSt.atk = MQ.clamp(foeSt.atk - 1, -6, 6);
        this.say(`La mala cara de ${name(mon)} intimida: el ataque rival baja.`);
      }
      const wAb = { niebladensa: 'neblina', llamadordeaguas: 'lluvia', horacero: 'apagon' }[mon.ability];
      if (wAb && (!this.weather || this.weather.kind !== wAb)) {
        this.weather = { kind: wAb, turns: -1 };
        this.say(`${name(mon)} trae consigo ${MQ.WEATHER[wAb].name.toLowerCase()}. ${MQ.WEATHER[wAb].desc}`);
      }
    }

    toMenu() {
      if (this.over) return;
      this.phase = 'menu';
      this.menu = new MQ.Menu(
        [{ label: 'PELEAR' }, { label: 'MOCHILA' }, { label: 'EQUIPO' }, { label: 'HUIR' }],
        { x: MQ.W - 110, y: MQ.H - 70, w: 102, rows: 4,
          onPick: (it) => this.pickAction(it.label),
          onCancel: () => {} });
    }

    pickAction(a) {
      if (a === 'PELEAR') {
        if (this.pvol.charging) { this.turn(this.pvol.charging); return; }
        if (this.pvol.recharge) { this.turn(null); return; }
        if (!this.mine.moves.some((id) => (this.mine.pp[id] ?? 0) > 0)) {
          this.say(`¡A ${name(this.mine)} no le quedan fuerzas pa' más! Le toca FORCEJEO.`, () => this.turn('forcejeo'));
          this.pump();
          return;
        }
        const mv = this.mine.moves.map((id) => ({
          label: MQ.MOVES[id].name.slice(0, 16), sub: `${this.mine.pp[id] ?? 0}/${MQ.MOVES[id].pp}`, value: id }));
        this.phase = 'moves';
        this.menu = new MQ.Menu(mv, { x: 6, y: MQ.H - 13 * mv.length - 28, w: 180, rows: 4,
          title: 'MOVIMIENTOS',
          onPick: (it) => {
            if ((this.mine.pp[it.value] ?? 0) <= 0) { MQ.audio.sfx('bump'); return; }
            this.turn(it.value);
          },
          onCancel: () => this.toMenu() });
      } else if (a === 'MOCHILA') this.openBag();
      else if (a === 'EQUIPO') this.openParty(false);
      else if (a === 'HUIR') this.tryFlee();
    }

    openBag() {
      const p = MQ.player;
      const usable = (k) => {
        const it = MQ.ITEMS[k];
        return it.ball || it.heal || it.cure || it.revive || it.battleStage;
      };
      const items = Object.keys(p.bag).filter((k) => p.bag[k] > 0 && usable(k)).map((k) => ({
        label: MQ.ITEMS[k].name, sub: 'x' + p.bag[k], value: k }));
      if (!items.length) { this.say('La mochila está vacía. Ni un confite.', () => this.toMenu()); this.pump(); return; }
      this.phase = 'bag';
      this.menu = new MQ.Menu(items, { x: 6, y: 40, w: 190, rows: 6, title: 'MOCHILA',
        onPick: (it) => this.useItem(it.value),
        onCancel: () => this.toMenu() });
    }

    useItem(k) {
      const p = MQ.player, item = MQ.ITEMS[k];
      if (item.ball) {
        if (this.trainer) { this.say('¡A los espantos ajenos no se les lanza ficha! Eso es de mala educación.', () => this.toMenu()); this.pump(); return; }
        p.bag[k]--;
        this.throwFicha(item);
      } else if (item.battleStage) {
        p.bag[k]--;
        MQ.audio.sfx('heal');
        if (item.battleStage === 'crit') {
          this.pvol.critUp = Math.min(4, this.pvol.critUp + 1);
          this.say(`¡${name(this.mine)} afina la puntería con la ${item.name}!`, () => this.enemyTurn());
        } else {
          this.pst[item.battleStage] = MQ.clamp(this.pst[item.battleStage] + 1, -6, 6);
          this.say(`¡${MQ.STAT_NAMES[item.battleStage]} de ${name(this.mine)} sube con la ${item.name}!`, () => this.enemyTurn());
        }
        this.pump();
      } else if (item.heal) {
        if (this.mine.hp <= 0) { this.toMenu(); return; }
        p.bag[k]--;
        const h = Math.min(item.heal, this.mine.maxhp - this.mine.hp);
        this.mine.hp += h;
        if (item.cure) { this.mine.status = null; this.pvol.mareo = 0; }
        MQ.audio.sfx('heal');
        this.say(`${name(this.mine)} recupera ${h} PS. ¡Qué sabroso!`, () => this.enemyTurn());
        this.pump();
      } else if (item.cure) {
        if (!this.mine.status && !this.pvol.mareo) { this.say('No tiene ningún mal que curar. ¡Está más sano que tú!', () => this.toMenu()); this.pump(); return; }
        p.bag[k]--;
        this.mine.status = null; this.mine.psn2T = 0; this.pvol.mareo = 0;
        MQ.audio.sfx('heal');
        this.say(`El agua de coco obra el milagro: ¡${name(this.mine)} quedó como nuevo!`, () => this.enemyTurn());
        this.pump();
      } else if (item.revive) {
        const t = p.party.find((m) => m.hp <= 0);
        if (!t) { this.say('Nadie necesita el cariaquito... todavía.', () => this.toMenu()); this.pump(); return; }
        p.bag[k]--;
        t.hp = Math.max(1, Math.floor(t.maxhp * item.revive));
        MQ.audio.sfx('heal');
        this.say(`¡${name(t)} despertó! Milagros de los de antes.`, () => this.enemyTurn());
        this.pump();
      }
    }

    // ---- captura Gen 3 (spec §1.5) ---------------------------------------------
    throwFicha(item) {
      const sp = MQ.SPECIES[this.enemy.id];
      const e = this.enemy;
      // multiplicador de ficha, con condiciones (rayada: estado; madrugadora: oscuridad)
      let ball = item.ball;
      if (item.ballIf) {
        if (item.ballIf.status && e.status) ball = item.ballIf.status;
        if (item.ballIf.dark && this.opts.dark) ball = item.ballIf.dark;
      }
      const statusMul = (e.status === 'slp' || e.status === 'pav') ? 2
        : e.status ? 1.5 : 1;
      let willCatch, shakes;
      if (this.opts.noCatch) { willCatch = false; shakes = 0; }
      else if (ball >= 255) { willCatch = true; shakes = 4; }
      else {
        const a = Math.max(1, Math.floor(
          Math.floor((3 * e.maxhp - 2 * e.hp) * sp.catch * ball / (3 * e.maxhp)) * statusMul));
        if (a >= 255) { willCatch = true; shakes = 4; }
        else {
          const b = Math.floor(1048560 / Math.sqrt(Math.sqrt(16711680 / a)));
          shakes = 0;
          for (let i = 0; i < 4; i++) if (MQ.rand(65536) < b) shakes++; else break;
          willCatch = shakes === 4;
        }
      }
      const col = ball >= 255
        ? { a: '#ffe66e', b: '#f5a623' }
        : item.ball >= 2 || ball >= 2
          ? { a: '#f5d76e', b: '#d9a441' }
          : { a: '#e0b24a', b: '#a8782a' };
      this.phase = 'capture';
      this.menu = null;
      this.cap = { stage: 'toss', t: 0, item, willCatch, shakes: Math.min(shakes, 3), wob: 0, mul: 1, flash: 0, col };
      MQ.audio.sfx('toss');
      this.say(`¡Le lanzas una ${item.name}!`);
      this.pump();
    }

    tickCapture() {
      const c = this.cap;
      if (this.tb.active) return;
      c.t++;
      switch (c.stage) {
        case 'toss':
          if (c.t >= 22) { c.stage = 'suck'; c.t = 0; c.flash = 6; MQ.audio.sfx('door'); }
          break;
        case 'suck':
          c.mul = Math.max(0, 1 - c.t / 12);
          if (c.flash > 0) c.flash--;
          if (c.t >= 12) { c.mul = 0; c.stage = 'fall'; c.t = 0; }
          break;
        case 'fall':
          if (c.t >= 10) { c.stage = 'settle'; c.t = 0; MQ.audio.sfx('bump'); }
          break;
        case 'settle':
          if (c.t >= 9) {
            if (c.wob < c.shakes) { c.stage = 'wobble'; c.t = 0; MQ.audio.sfx('wobble'); }
            else { c.stage = 'decide'; c.t = 0; }
          }
          break;
        case 'wobble':
          if (c.t >= 20) { c.wob++; c.stage = 'settle'; c.t = 0; }
          break;
        case 'decide':
          if (c.willCatch) { c.stage = 'caught'; c.t = 0; MQ.audio.sfx('click'); MQ.audio.sfx('sparkle'); }
          else { c.stage = 'breakout'; c.t = 0; MQ.audio.sfx('breakout'); }
          break;
        case 'caught':
          if (c.t >= 30) this.captured();
          break;
        case 'breakout':
          c.mul = Math.min(1, c.t / 10);
          if (c.t >= 14) { c.mul = 1; this.captureFailed(); }
          break;
      }
    }

    captured() {
      const e = this.enemy;
      this.cap = null;
      this.phase = 'msg';
      MQ.audio.cry(e.id);
      const mon = { ...e }; delete mon._disp;
      const dest = MQ.addMon(mon);
      this.say(`¡PLIN! La ficha se quedó quieta. ¡${name(e)} aceptó tu ficha!`);
      this.say(dest === 'equipo'
        ? `¡${name(e)} se une a tu equipo! Quedó FICHADO.`
        : `Tu equipo está full. ${name(e)} te espera en el LOCKER de la estación.`,
        () => this.finish('catch'));
      this.pump();
    }

    captureFailed() {
      const e = this.enemy;
      this.cap = null;
      this.phase = 'msg';
      MQ.audio.cry(e.id);
      this.say(`¡${name(e)} reventó la ficha! Todavía no te respeta.`, () => this.enemyTurn());
      this.pump();
    }

    openParty(forced) {
      const p = MQ.player;
      const items = p.party.map((m, i) => ({
        label: `${m.shiny ? '★' : ''}${name(m)} N${m.lvl}`, sub: m.hp <= 0 ? 'K.O.' : `${m.hp}/${m.maxhp}`, value: i, icon: m.id }));
      this.phase = 'party';
      this.menu = new MQ.Menu(items, { x: 6, y: 40, w: 200, rows: 6, rowH: 18, title: forced ? '¡ELIGE OTRO!' : 'EQUIPO',
        onPick: (it) => {
          const m = p.party[it.value];
          if (m.hp <= 0) { MQ.audio.sfx('bump'); return; }
          if (it.value === this.mi && !forced) { MQ.audio.sfx('bump'); return; }
          if (!forced && (this.pvol.trap > 0 || this.pvol.noescape)) {
            this.say('¡No hay cambio: lo tienen agarrado!', () => this.toMenu());
            this.pump();
            return;
          }
          this.switchMine(it.value, forced);
        },
        onCancel: () => { if (!forced) this.toMenu(); } });
    }

    switchMine(idx, forced) {
      const prev = this.mine;
      if (prev && prev.hp > 0 && prev.ability === 'serenodelavila' && prev.status) {
        prev.status = null; prev.psn2T = 0;
      }
      this.mi = idx; this.mine = MQ.player.party[idx];
      this.anim.mfall = 0;
      this.pst = zeroStages();
      this.pvol = freshVol();
      this.say(`¡Échale pichón, ${name(this.mine)}!`, () => {
        this.entryEffects(this.mine, true);
        this.act(() => { if (forced) this.toMenu(); else this.enemyTurn(); });
      });
      this.pump();
    }

    tryFlee() {
      if (this.trainer) { this.say('¡De un duelo no se huye, chamo! Eso no se hace.', () => this.toMenu()); this.pump(); return; }
      if (this.opts.noFlee) { this.say('¡El Tren Fantasma bloquea el túnel! No hay pa\' dónde correr.', () => this.toMenu()); this.pump(); return; }
      if (this.pvol.trap > 0 || this.pvol.noescape) {
        this.say('¡Estás atrapado! No hay carrerita que valga.', () => this.enemyTurn());
        this.pump();
        return;
      }
      this.fleeTries++;
      const pSpe = this.effSpe(this.mine, this.pst), eSpe = Math.max(1, this.effSpe(this.enemy, this.est));
      const F = Math.floor(pSpe * 128 / eSpe) + 30 * this.fleeTries;
      if (MQ.rand(256) < F) {
        MQ.audio.sfx('flee');
        this.say('Saliste en carrerita. ¡El que corre vive pa\' contar el cuento!', () => this.finish('flee'));
      } else {
        this.say('¡No hubo chance! El espanto te cierra el paso.', () => this.enemyTurn());
      }
      this.pump();
    }

    // ---- velocidad efectiva (etapas, parálisis, clima, habilidades) -------------
    effSpe(m, st) {
      let s = m.spe * stageMul(st.spe);
      if (m.status === 'par') s /= 2;
      const w = this.weather && this.weather.kind;
      if (m.ability === 'solanero' && w === 'sol') s *= 2;
      if (m.ability === 'aguaje' && w === 'lluvia') s *= 2;
      return s;
    }

    // ---- turno ----------------------------------------------------------------
    turn(moveId) {
      this.phase = 'msg';
      const eMove = this.enemyPick();
      const pPrio = moveId ? MQ.MOVES[moveId].priority || 0 : 0;
      const ePrio = eMove ? MQ.MOVES[eMove].priority || 0 : 0;
      let mineFirst;
      if (pPrio !== ePrio) mineFirst = pPrio > ePrio;
      else {
        const pSpe = this.effSpe(this.mine, this.pst), eSpe = this.effSpe(this.enemy, this.est);
        const pQC = this.mine.item === 'garracunaguaro' && Math.random() < 0.2;
        const eQC = this.enemy.item === 'garracunaguaro' && Math.random() < 0.2;
        if (pQC !== eQC) mineFirst = pQC;
        else mineFirst = pSpe === eSpe ? Math.random() < 0.5 : pSpe > eSpe;
      }
      this.pvol.protected = false; this.evol.protected = false;
      this.pvol.endure = false; this.evol.endure = false;
      this.pvol.lastPhys = 0; this.pvol.lastSpec = 0;
      this.evol.lastPhys = 0; this.evol.lastSpec = 0;
      if (mineFirst) {
        this.doMove(this.mine, this.enemy, moveId, true, () => {
          if (this.enemy.hp <= 0) return this.enemyFaint();
          if (this.mine.hp <= 0) return; // retroceso/contacto: mineFaint ya encoló
          this.doMove(this.enemy, this.mine, eMove, false, () => this.afterRound());
        });
      } else {
        this.doMove(this.enemy, this.mine, eMove, false, () => {
          if (this.mine.hp <= 0) return this.afterRound();
          if (this.enemy.hp <= 0) return this.enemyFaint();
          this.doMove(this.mine, this.enemy, moveId, true, () => this.afterRound());
        });
      }
      this.pump();
    }

    enemyTurn() { // el enemigo pega tras ítem/cambio
      this.pvol.protected = false; this.evol.protected = false;
      this.doMove(this.enemy, this.mine, this.enemyPick(), false, () => this.afterRound());
      this.pump();
    }

    enemyPick() {
      if (this.evol.charging) return this.evol.charging;
      if (this.evol.recharge) return null;
      const avail = this.enemy.moves.filter((id) => (this.enemy.pp[id] ?? 0) > 0);
      if (!avail.length) return 'forcejeo';
      const scored = avail.map((id) => {
        const m = MQ.MOVES[id];
        let s = Math.random() * 20;
        if (m.pow) {
          const stab = MQ.SPECIES[this.enemy.id].types.includes(m.type) ? 1.5 : 1;
          s += m.pow * stab * MQ.effect(m.type, MQ.SPECIES[this.mine.id].types);
        } else if (m.effects.some((e) => e.kind === 'status')) {
          s += this.mine.status ? 0 : 40;
        } else if (m.effects.some((e) => e.kind === 'stage')) {
          s += this.est.atk + this.est.spa > 2 ? 0 : 25;
        } else s += 10;
        return [s, id];
      }).sort((a, b) => b[0] - a[0]);
      return scored[0][1];
    }

    // ---- estados: aplicar con inmunidades -----------------------------------
    statusBlocked(target, st) {
      const sp = MQ.SPECIES[target.id];
      const imm = { slp: 'trasnochao', psn: 'estomagodeacero', psn2: 'estomagodeacero',
        par: 'destrabao', que: 'pielmojada', pav: 'espiritualegre' };
      if (target.ability === imm[st]) return `${MQ.ABILITIES[target.ability].name} lo protege`;
      if (st === 'pav' && sp.types.includes('Espanto')) return 'a un espanto no le cae la pava';
      return null;
    }

    applyStatus(target, st, then) {
      if (target.hp <= 0) { then(); return; }
      const blocked = this.statusBlocked(target, st);
      if (blocked) { this.say(`...pero ${blocked}.`, then); return; }
      if (target.status) { this.say('...pero no surte efecto.', then); return; }
      target.status = st;
      if (st === 'slp') target.slpT = 1 + MQ.rand(3);
      if (st === 'psn2') target.psn2T = 0;
      MQ.audio.sfx('weak');
      this.say(`¡${name(target)} ${MQ.STATUS[st].verb}!`, () => this.fruitCheck(target, then));
    }

    applyMareo(target, vol, then) {
      if (target.hp <= 0 || vol.mareo > 0) { then(); return; }
      if (target.ability === 'asuritmo') { this.say(`...pero ${name(target)} va a su ritmo.`, then); return; }
      vol.mareo = 1 + MQ.rand(4);
      MQ.audio.sfx('weak');
      this.say(`¡${name(target)} ${MQ.VOLATILE.mareo.verb}!`, () => this.fruitCheck(target, then));
    }

    // fruta equipada: se auto-cura al recibir el estado que le toca
    fruitCheck(m, then) {
      const it = m.item && MQ.ITEMS[m.item];
      if (!it || it.hold !== 'fruta') { then(); return; }
      const vol = m === this.mine ? this.pvol : this.evol;
      let used = false;
      if (it.cures === 'mareo' && vol.mareo > 0) { vol.mareo = 0; used = true; }
      else if (it.cures && (m.status === it.cures || (it.cures === 'psn' && m.status === 'psn2'))) {
        m.status = null; m.psn2T = 0; used = true;
      }
      if (!used) { then(); return; }
      m.item = null;
      MQ.audio.sfx('heal');
      this.say(`¡${name(m)} se come su ${it.name} y se cura solito!`, then);
    }

    applyStage(target, st, stat, delta, then) {
      if (target.hp <= 0) { then(); return; }
      if (delta < 0) {
        if (stat === 'atk' && target.ability === 'brazofirme') { this.say(`El brazo firme de ${name(target)} no baja.`, then); return; }
        if (stat === 'acc' && target.ability === 'ojopelao') { this.say(`${name(target)} tiene el ojo pelao: su puntería no baja.`, then); return; }
      }
      const before = st[stat];
      st[stat] = MQ.clamp(st[stat] + delta, -6, 6);
      if (st[stat] === before) { this.say(`...pero ${MQ.STAT_NAMES[stat]} no puede ${delta > 0 ? 'subir' : 'bajar'} más.`, then); return; }
      MQ.audio.sfx(delta > 0 ? 'heal' : 'weak');
      const grado = Math.abs(delta) >= 2 ? (delta > 0 ? ' muchísimo' : ' un mundo') : '';
      this.say(`${MQ.STAT_NAMES[stat]} de ${name(target)} ${delta > 0 ? 'sube' : 'baja'}${grado}.`, then);
    }

    // ---- el corazón: ejecutar un movimiento -------------------------------------
    doMove(atk, def, moveId, isMine, then) {
      const aSt = isMine ? this.pst : this.est;
      const dSt = isMine ? this.est : this.pst;
      const aVol = isMine ? this.pvol : this.evol;
      const dVol = isMine ? this.evol : this.pvol;

      // recarga pendiente (Olla de Presión / Sobrecarga)
      if (aVol.recharge) {
        aVol.recharge = false;
        this.say(`${name(atk)} recupera el aliento...`, then);
        return;
      }
      // flojera (Pereza): descansa ronda por medio
      if (atk.ability === 'flojera') {
        aVol.loaf = !aVol.loaf;
        if (aVol.loaf === false) { /* actúa */ } else if (aVol.loaf) {
          this.say(`${name(atk)} está flojeando... mañana sí.`, then);
          return;
        }
      }
      // amedrentado este turno
      if (aVol.flinch) {
        aVol.flinch = false;
        this.say(`¡${name(atk)} se amedrentó y no pudo moverse!`, then);
        return;
      }
      // dormido
      if (atk.status === 'slp') {
        atk.slpT = (atk.slpT || 1) - 1;
        if (atk.slpT > 0) { this.say(`${name(atk)} está dormido... sueña con el llano.`, then); return; }
        atk.status = null;
        this.say(`¡${name(atk)} despertó!`);
      }
      // empavado: no actúa; 20% se le quita solo
      if (atk.status === 'pav') {
        if (Math.random() < 0.2) {
          atk.status = null;
          this.say(`¡${name(atk)} tocó madera y se le quitó la pava!`);
        } else {
          this.say(`${name(atk)} está empavado. No se atreve ni a moverse.`, then);
          return;
        }
      }
      // paralizado: 25% pierde el turno
      if (atk.status === 'par' && Math.random() < 0.25) {
        MQ.audio.sfx('weak');
        this.say(`¡${name(atk)} está paralizado! El corrientazo no lo deja moverse.`, then);
        return;
      }
      // mareado: 1-4 rondas, 50% se pega solo
      if (aVol.mareo > 0) {
        aVol.mareo--;
        if (aVol.mareo === 0) {
          this.say(`¡A ${name(atk)} se le pasó el mareo!`);
        } else if (Math.random() < 0.5) {
          const A = atk.atk, D = Math.max(1, atk.def);
          let dmg = Math.max(1, Math.floor((((2 * atk.lvl / 5 + 2) * 40 * A / D) / 50 + 2) * (0.85 + Math.random() * 0.15)));
          atk.hp = Math.max(0, atk.hp - dmg);
          this.anim.shake = 8;
          MQ.audio.sfx('hit');
          this.say(`¡${name(atk)} está tan mareado que se pegó solito! (${dmg})`, () => {
            if (atk.hp <= 0) return isMine ? this.mineFaint(then) : this.enemyFaint();
            then();
          });
          return;
        }
      }

      const mv = moveId && MQ.MOVES[moveId];
      if (!mv) { this.say(`${name(atk)} duda un momento...`, then); return; }

      // carga (Botija / Salto Ángel): primer turno se prepara (y ahí gasta el PP)
      const chargeFx = mv.effects.find((e) => e.kind === 'charge');
      const spendPP = () => {
        if (moveId !== 'forcejeo' && atk.pp && atk.pp[moveId] !== undefined) {
          const cost = def.ability === 'presenciapesada' ? 2 : 1;
          atk.pp[moveId] = Math.max(0, atk.pp[moveId] - cost);
        }
      };
      if (chargeFx && aVol.charging !== moveId) {
        aVol.charging = moveId;
        spendPP();
        this.say(`¡${name(atk)} ${mv.id === 'saltoangel' ? 'se eleva hacia lo alto del túnel' : 'concentra su fuerza'}!`, then);
        return;
      }
      const wasCharging = aVol.charging === moveId;
      aVol.charging = null;
      if (!wasCharging) spendPP();

      this.say(`${isMine ? '' : 'El rival: '}¡${name(atk)} usa ${mv.name}!`, () => {
        // protegido
        if (dVol.protected && mv.pow) {
          this.say(`¡${name(def)} se resteó y aguantó el golpe!`, then);
          return;
        }
        // objetivo por los aires (semi-invulnerable)
        if (dVol.charging && MQ.MOVES[dVol.charging].effects.some((e) => e.kind === 'charge' && e.semiInvulnerable)) {
          this.say('...¡pero no hay nadie ahí! Se fue por los aires.', then);
          return;
        }
        // precisión
        if (!this.rollAccuracy(atk, def, mv, aSt, dSt)) {
          MQ.audio.sfx('weak');
          this.say('...¡pero falló! Quedó pintado en la pared.', then);
          return;
        }
        if (mv.pow || mv.effects.some((e) => e.kind === 'counter'))
          this.dealDamage(atk, def, mv, isMine, aSt, dSt, aVol, dVol, then);
        else this.statusMove(atk, def, mv, isMine, aSt, dSt, aVol, dVol, then);
      });
    }

    rollAccuracy(atk, def, mv, aSt, dSt) {
      if (mv.acc === null || mv.acc === undefined) return true;
      const w = this.weather && this.weather.kind;
      const cm = mv.effects.find((e) => e.kind === 'cantmiss-under');
      if (cm && w === cm.weather) return true;
      let chance = mv.acc * accMul(MQ.clamp(aSt.acc - dSt.eva, -6, 6));
      if (atk.ability === 'faroles') chance *= 1.3;
      if (w === 'neblina' && !MQ.SPECIES[atk.id].types.includes('Espanto')) chance *= 0.9;
      if (w === 'apagon' && mv.category === 'physical') chance *= 0.9;
      if (def.ability === 'entreelgentio' && w === 'horapico') chance /= 1.2;
      if (def.item === 'polvomariposa') chance /= 1.1;
      return Math.random() * 100 <= chance;
    }

    // inmunidades/absorciones por habilidad del defensor
    absorbCheck(def, mv, dSt, isMineTarget) {
      if (def.ability === 'oidosordo' && mv.type === 'Rumba') return `¡${name(def)} ni lo oye! Oído sordo.`;
      if (def.ability === 'nadoaereo' && mv.type === 'Tepuy') return `¡${name(def)} nada en el aire! No lo toca.`;
      if (def.ability === 'espirituerrante' && mv.type === 'Criollo') return `¡${name(def)} es puro espíritu! Lo atraviesa.`;
      if (def.ability === 'pararrayos' && mv.type === 'Catatumbo') {
        dSt.spa = MQ.clamp(dSt.spa + 1, -6, 6);
        return `¡${name(def)} absorbe el corrientazo y se carga!`;
      }
      if (def.ability === 'esponja' && mv.type === 'Caribe') {
        def.hp = Math.min(def.maxhp, def.hp + Math.floor(def.maxhp / 4));
        return `¡${name(def)} absorbe el agua y se repone!`;
      }
      return null;
    }

    dealDamage(atk, def, mv, isMine, aSt, dSt, aVol, dVol, then) {
      const absorbed = this.absorbCheck(def, mv, dSt);
      if (absorbed) { this.say(absorbed, then); return; }

      // contragolpes (El Vuelto / Contrapunteo): devuelven el doble del daño recibido
      const counterFx = mv.effects.find((e) => e.kind === 'counter');
      if (counterFx) {
        const got = counterFx.category === 'physical' ? aVol.lastPhys : aVol.lastSpec;
        if (!got) { this.say('...¡pero no había nada que devolver!', then); return; }
        const dmg = got * 2;
        def.hp = Math.max(0, def.hp - dmg);
        this.anim.shake = 10;
        MQ.audio.sfx('eff');
        this.say(`¡${name(atk)} devuelve el vuelto! ${dmg} de daño.`, () => {
          if (def.hp <= 0) return isMine ? then() : this.mineFaint(then);
          then();
        });
        return;
      }

      const multiFx = mv.effects.find((e) => e.kind === 'multi');
      const hits = multiFx
        ? (multiFx.min === multiFx.max ? multiFx.min
          : [2, 2, 2, 3, 3, 3, 4, 5][MQ.rand(8)])
        : 1;

      const sp = MQ.SPECIES[def.id];
      const eff = MQ.effect(mv.type, sp.types);
      if (eff === 0) { this.say('...pero no le afecta para nada.', then); return; }
      const stab = MQ.SPECIES[atk.id].types.includes(mv.type) ? 1.5 : 1;

      // crítico por etapas (base 1/16), multiplicador canon x1.5
      const critFx = mv.effects.find((e) => e.kind === 'crit');
      const critStage = Math.min(4, aVol.critUp + (critFx ? critFx.stages : 0));
      const isCrit = Math.random() < 1 / CRIT_ODDS[critStage];
      const crit = isCrit ? 1.5 : 1;

      const phys = mv.category === 'physical';
      // el crítico ignora las etapas que perjudican al atacante o ayudan al defensor
      const aStageRaw = phys ? aSt.atk : aSt.spa;
      const dStageRaw = phys ? dSt.def : dSt.spd;
      const aStage = isCrit ? Math.max(0, aStageRaw) : aStageRaw;
      const dStage = isCrit ? Math.min(0, dStageRaw) : dStageRaw;
      let A = (phys ? atk.atk : atk.spa) * stageMul(aStage);
      let D = Math.max(1, (phys ? def.def : def.spd) * stageMul(dStage));

      // quemadura: mitad de daño físico (menos con Echao Pa'lante)
      if (phys && atk.status === 'que' && atk.ability !== 'echaopalante') A *= 0.5;
      if (atk.status && atk.ability === 'echaopalante' && phys) A *= 1.5;
      // habilidad de apuro (x1.5 al tipo propio con poca vida)
      const pinch = { raizfirme: 'Tepuy', coroalzao: 'Rumba', plenacarga: 'Catatumbo', verdor: 'Monte' };
      let mod = 1;
      if (pinch[atk.ability] === mv.type && atk.hp <= atk.maxhp / 3) mod *= 1.5;
      // objeto de tipo (x1.1)
      const it = atk.item && MQ.ITEMS[atk.item];
      if (it && it.hold === 'boost' && it.boostType === mv.type) mod *= 1.1;
      // bien comido (x0.5 de Sabroso y Caribe)
      if (def.ability === 'biencomido' && (mv.type === 'Sabroso' || mv.type === 'Caribe')) mod *= 0.5;
      // clima
      const w = this.weather && this.weather.kind;
      if (w === 'lluvia') mod *= mv.type === 'Caribe' ? 1.5 : mv.type === 'Sabroso' ? 0.5 : 1;
      if (w === 'sol') mod *= mv.type === 'Sabroso' ? 1.5 : mv.type === 'Caribe' ? 0.5 : 1;
      if (w === 'apagon' && mv.type === 'Espanto') mod *= 1.2;

      let total = 0, lastDmg = 0;
      for (let h = 0; h < hits; h++) {
        let dmg = Math.floor((((2 * atk.lvl / 5 + 2) * mv.pow * A / D) / 50 + 2)
          * stab * eff * crit * mod * (0.85 + Math.random() * 0.15));
        dmg = Math.max(1, dmg);
        // aguantes: resteo del turno, concha dura desde full, azabache de pulsera
        if (dmg >= def.hp) {
          if (dVol.endure) dmg = def.hp - 1;
          else if (def.ability === 'conchadura' && def.hp === def.maxhp) dmg = def.hp - 1;
          else if (def.item === 'azabachepulsera' && Math.random() < 0.1) {
            dmg = def.hp - 1;
          }
        }
        def.hp = Math.max(0, def.hp - dmg);
        total += dmg; lastDmg = dmg;
        if (def.hp <= 0) break;
      }
      if (phys) dVol.lastPhys = lastDmg; else dVol.lastSpec = lastDmg;

      // apagón: un golpe Catatumbo con daño lo termina ("volvió la luz")
      if (w === 'apagon' && mv.type === 'Catatumbo' && total > 0 && this.weather) {
        this.weather = null;
        this.say('¡El corrientazo prendió los bombillos! Volvió la luz.');
      }

      this.anim.shake = crit > 1 ? 12 : 8;
      MQ.audio.sfx(eff > 1 || crit > 1 ? 'eff' : eff < 1 ? 'weak' : 'hit');
      let extra = eff > 1 ? ' ¡Le dolió hasta el apellido!' : eff < 1 ? ' No le hizo ni cosquillas...' : '';
      if (crit > 1) extra = ' ¡GOLPE CRÍTICO! De los que no se olvidan.' + (eff > 1 ? ' Y encima le dolió doble.' : '');
      const hitsTxt = hits > 1 ? ` (x${hits} golpes)` : '';
      this.say(`Hace ${total} de daño${hitsTxt}.${extra}`, () => {
        const chain = [];
        // drenaje
        const drainFx = mv.effects.find((e) => e.kind === 'drain');
        if (drainFx && total > 0) chain.push((next) => {
          const h = Math.min(Math.max(1, Math.floor(total * drainFx.fraction)), atk.maxhp - atk.hp);
          if (h > 0) { atk.hp += h; MQ.audio.sfx('heal'); this.say(`¡${name(atk)} le saca el jugo! Recupera ${h} PS.`, next); }
          else next();
        });
        // campana del vagón
        if (atk.item === 'campanavagon' && total > 0 && atk.hp > 0 && atk.hp < atk.maxhp) chain.push((next) => {
          atk.hp = Math.min(atk.maxhp, atk.hp + Math.max(1, Math.floor(total / 8)));
          next();
        });
        // retroceso
        const recoilFx = mv.effects.find((e) => e.kind === 'recoil');
        if (recoilFx && total > 0) chain.push((next) => {
          atk.hp = Math.max(0, atk.hp - Math.max(1, Math.ceil(total * recoilFx.fraction)));
          this.say(`¡${name(atk)} se resiente del envión!`, next);
        });
        // efectos secundarios sobre el objetivo
        for (const fx of mv.effects) {
          if (fx.kind === 'status' && def.hp > 0) {
            const chance = (fx.chance ?? 100) / 100;
            chain.push((next) => {
              if (Math.random() >= chance) return next();
              const target = fx.target === 'self' ? atk : def;
              if (fx.status === 'mareo') this.applyMareo(target, target === this.mine ? this.pvol : this.evol, next);
              else this.applyStatus(target, fx.status, next);
            });
          } else if (fx.kind === 'stage' && (fx.target === 'self' ? atk : def).hp > 0) {
            const chance = (fx.chance ?? 100) / 100;
            chain.push((next) => {
              if (Math.random() >= chance) return next();
              const tIsAtk = fx.target === 'self';
              this.applyStage(tIsAtk ? atk : def, tIsAtk ? aSt : dSt, fx.stat, fx.delta, next);
            });
          } else if (fx.kind === 'flinch' && def.hp > 0) {
            chain.push((next) => {
              if (def.ability !== 'cabezafria' && Math.random() < fx.chance / 100) dVol.flinch = true;
              next();
            });
          } else if (fx.kind === 'trap' && def.hp > 0) {
            chain.push((next) => {
              if (dVol.trap <= 0) {
                dVol.trap = fx.turns[0] + MQ.rand(fx.turns[1] - fx.turns[0] + 1);
                this.say(`¡${name(def)} quedó atrapado en el tumulto!`, next);
              } else next();
            });
          } else if (fx.kind === 'recharge') {
            chain.push((next) => { aVol.recharge = true; next(); });
          } else if (fx.kind === 'switch' && fx.who === 'self' && isMine && total > 0) {
            // Ahí Nos Vidrios: cambia tras golpear (si hay a quién)
            chain.push((next) => {
              const others = MQ.player.party.filter((m, i) => m.hp > 0 && i !== this.mi);
              if (!others.length || def.hp <= 0) return next();
              this.say(`¡${name(atk)} pega y se va: ahí nos vidrios!`, () => this.openParty(true));
            });
          }
        }
        // moneda de locha (10% amedrenta)
        if (atk.item === 'monedalocha' && def.hp > 0) chain.push((next) => {
          if (def.ability !== 'cabezafria' && Math.random() < 0.1) dVol.flinch = true;
          next();
        });
        // habilidades de contacto del defensor
        if (mv.contact && def.hp > 0 && atk.hp > 0) chain.push((next) => this.contactEffects(atk, def, isMine, next));

        const run = (i) => {
          if (atk.hp <= 0) return isMine ? this.mineFaint(then) : this.enemyFaint();
          if (def.hp <= 0) return isMine ? then() : this.mineFaint(then);
          if (i >= chain.length) return then();
          chain[i]((/* next */) => run(i + 1));
        };
        run(0);
      });
    }

    contactEffects(atk, def, isMine, then) {
      const roll = Math.random();
      if (def.ability === 'pieldelija') {
        atk.hp = Math.max(0, atk.hp - Math.max(1, Math.floor(atk.maxhp / 16)));
        this.say(`¡La piel de lija de ${name(def)} raspa a ${name(atk)}!`, () => {
          if (atk.hp <= 0) return isMine ? this.mineFaint(then) : this.enemyFaint();
          then();
        });
        return;
      }
      const contactStatus = { estatica: 'par', brasaviva: 'que', colmillountado: 'psn' }[def.ability];
      if (contactStatus && roll < 0.3 && !atk.status && !this.statusBlocked(atk, contactStatus)) {
        this.applyStatus(atk, contactStatus, then);
        return;
      }
      then();
    }

    statusMove(atk, def, mv, isMine, aSt, dSt, aVol, dVol, then) {
      const chain = [];
      for (const fx of mv.effects) {
        if (fx.kind === 'heal') chain.push((next) => {
          let frac = fx.fraction;
          if (mv.id === 'solana' && this.weather && this.weather.kind === 'sol') frac = 2 / 3;
          const h = Math.min(Math.floor(atk.maxhp * frac), atk.maxhp - atk.hp);
          if (h > 0) { atk.hp += h; MQ.audio.sfx('heal'); this.say(`${name(atk)} recupera ${h} PS. Eso cura el alma.`, next); }
          else this.say('Pero ya estaba full...', next);
        });
        else if (fx.kind === 'status') chain.push((next) => {
          if (Math.random() >= (fx.chance ?? 100) / 100) return next();
          const target = fx.target === 'self' ? atk : def;
          if (fx.status === 'mareo') this.applyMareo(target, target === this.mine ? this.pvol : this.evol, next);
          else this.applyStatus(target, fx.status, next);
        });
        else if (fx.kind === 'stage') chain.push((next) => {
          if (Math.random() >= (fx.chance ?? 100) / 100) return next();
          const tIsAtk = fx.target === 'self';
          this.applyStage(tIsAtk ? atk : def, tIsAtk ? aSt : dSt, fx.stat, fx.delta, next);
        });
        else if (fx.kind === 'crit') chain.push((next) => {
          aVol.critUp = Math.min(4, aVol.critUp + fx.stages);
          this.say(`¡${name(atk)} afina la puntería!`, next);
        });
        else if (fx.kind === 'weather') chain.push((next) => {
          this.weather = { kind: fx.weather, turns: 5 };
          this.say(MQ.WEATHER[fx.weather].desc, next);
        });
        else if (fx.kind === 'protect') chain.push((next) => {
          // usos seguidos fallan cada vez más
          if (Math.random() < Math.pow(0.5, aVol.protectCount)) {
            aVol.protected = true; aVol.protectCount++;
            this.say(`¡${name(atk)} se restea y se cubre!`, next);
          } else { aVol.protectCount = 0; this.say('...¡pero esta vez no le salió!', next); }
        });
        else if (fx.kind === 'endure') chain.push((next) => {
          if (Math.random() < Math.pow(0.5, aVol.protectCount)) {
            aVol.endure = true; aVol.protectCount++;
            this.say(`¡${name(atk)} aprieta los dientes: va a aguantar!`, next);
          } else { aVol.protectCount = 0; this.say('...¡pero esta vez no le salió!', next); }
        });
        else if (fx.kind === 'noescape') chain.push((next) => {
          dVol.noescape = true;
          this.say(`¡${name(def)} quedó clavado en el sitio! No hay escape.`, next);
        });
        else if (fx.kind === 'money') chain.push((next) => {
          this.moneyMul = fx.multiplier || 2;
          this.say('¡Cae plata del techo! La vaca está echada.', next);
        });
        else if (fx.kind === 'curse') chain.push((next) => {
          if (dVol.curse) return this.say('...pero el velorio ya estaba puesto.', next);
          const pay = Math.floor(atk.maxhp / 2);
          atk.hp = Math.max(1, atk.hp - pay);
          dVol.curse = true;
          this.say(`¡${name(atk)} monta un velorio con sus propias fuerzas! ${name(def)} quedó señalado.`, next);
        });
        else if (fx.kind === 'leech') chain.push((next) => {
          if (dVol.leech) return this.say('...pero ya estaba enredado.', next);
          if (MQ.SPECIES[def.id].types.includes('Monte')) return this.say(`...pero ${name(def)} conoce el monte demasiado bien.`, next);
          dVol.leech = true;
          this.say(`¡La enredadera se prende de ${name(def)}!`, next);
        });
        else if (fx.kind === 'hazard') chain.push((next) => {
          const haz = isMine ? this.ehaz : this.phaz;
          if (haz.cardonal) return this.say('...pero el cardonal ya estaba sembrado.', next);
          haz.cardonal = true;
          this.say('¡Un cardonal de púas brota en el andén rival!', next);
        });
        else if (fx.kind === 'switch' && fx.who === 'foe') chain.push((next) => {
          // Voz del Andén: en lo salvaje termina el pleito; contra entrenador, cambia
          if (!this.trainer && !isMine) return next();
          if (!this.trainer && isMine) {
            this.say(`¡La voz del andén se lleva a ${name(def)}! El pleito se acabó.`, () => this.finish('flee'));
            return;
          }
          if (isMine && this.eteam) {
            const others = this.eteam.filter((m, i) => m.hp > 0 && i !== this.ei);
            if (!others.length) return this.say('...pero no hay quién lo reemplace.', next);
            const pickIdx = this.eteam.indexOf(others[MQ.rand(others.length)]);
            this.ei = pickIdx; this.enemy = this.eteam[pickIdx];
            MQ.player.dexSeen[this.enemy.id] = true;
            Object.assign(this.est, zeroStages());
            Object.assign(this.evol, freshVol());
            this.anim.efall = 0;
            this.say(`¡${name(def)} sale empujado! Entra ${name(this.enemy)}.`, () => {
              MQ.audio.cry(this.enemy.id);
              this.entryEffects(this.enemy, false);
              this.act(next);
            });
            return;
          }
          next();
        });
      }
      if (!chain.length) chain.push((next) => this.say('...no pasa nada visible. Cosas de espantos.', next));
      const run = (i) => {
        if (i >= chain.length) return then();
        if (atk.hp <= 0) return isMine ? this.mineFaint(then) : this.enemyFaint();
        chain[i](() => run(i + 1));
      };
      run(0);
    }

    // ---- cierre de ronda: clima, estados, goteos ---------------------------------
    afterRound() {
      if (this.enemy.hp <= 0) return this.enemyFaint();
      if (this.mine.hp <= 0) return; // mineFaint ya encoló
      const ticks = [];
      const w = this.weather && this.weather.kind;

      for (const [m, isMine] of [[this.mine, true], [this.enemy, false]]) {
        const vol = isMine ? this.pvol : this.evol;
        const foe = isMine ? this.enemy : this.mine;
        // clima: hora pico pellizca a los que no son Criollo/Tepuy
        if (w === 'horapico') {
          const t = MQ.SPECIES[m.id].types;
          if (!t.includes('Criollo') && !t.includes('Tepuy'))
            ticks.push([m, isMine, Math.max(1, Math.floor(m.maxhp / 16)), 'el gentío de la hora pico estruja a']);
        }
        // estados que gotean
        if (m.status === 'psn') ticks.push([m, isMine, Math.max(1, Math.floor(m.maxhp / 8)), 'el veneno hace lo suyo con']);
        if (m.status === 'psn2') {
          m.psn2T = (m.psn2T || 0) + 1;
          ticks.push([m, isMine, Math.max(1, Math.floor(m.maxhp * m.psn2T / 16)), 'el veneno de mapanare aprieta a']);
        }
        if (m.status === 'que') ticks.push([m, isMine, Math.max(1, Math.floor(m.maxhp / 8)), 'la quemadura arde en']);
        if (vol.trap > 0) {
          vol.trap--;
          ticks.push([m, isMine, Math.max(1, Math.floor(m.maxhp / 16)), 'el agarre estruja a']);
        }
        if (vol.curse) ticks.push([m, isMine, Math.max(1, Math.floor(m.maxhp / 4)), 'el velorio pesa sobre']);
        if (vol.leech && foe.hp > 0) {
          const d = Math.max(1, Math.floor(m.maxhp / 8));
          ticks.push([m, isMine, d, 'la enredadera chupa a', foe]);
        }
        // curaciones de cierre
        if (m.item === 'tajadaplatano' && m.hp > 0 && m.hp < m.maxhp)
          m.hp = Math.min(m.maxhp, m.hp + Math.max(1, Math.floor(m.maxhp / 16)));
        if (m.ability === 'bebelluvia' && w === 'lluvia' && m.hp > 0 && m.hp < m.maxhp)
          m.hp = Math.min(m.maxhp, m.hp + Math.max(1, Math.floor(m.maxhp / 16)));
        if (m.item === 'merey' && m.hp > 0 && m.hp <= m.maxhp / 2) {
          m.hp = Math.min(m.maxhp, m.hp + 10);
          m.item = null;
        }
        if (m.ability === 'mudadepiel' && m.status && Math.random() < 0.33) {
          m.status = null; m.psn2T = 0;
        }
        if (m.ability === 'pilaspuestas') {
          const st = isMine ? this.pst : this.est;
          st.spe = MQ.clamp(st.spe + 1, -6, 6);
        }
      }
      // el clima de movimiento expira
      if (this.weather && this.weather.turns > 0) {
        this.weather.turns--;
        if (this.weather.turns === 0) {
          this.weather = null;
          ticks.push(null); // marcador: anuncia el despeje
        }
      }

      const next = () => {
        if (!ticks.length) return this.toMenu();
        const tk = ticks.shift();
        if (tk === null) { this.say('El andén vuelve a la calma de la hora fantasma.', next); return; }
        const [m, isMine, dmg, verb, healTo] = tk;
        m.hp = Math.max(0, m.hp - dmg);
        if (healTo && healTo.hp > 0) healTo.hp = Math.min(healTo.maxhp, healTo.hp + dmg);
        MQ.audio.sfx('weak');
        this.say(`${verb.charAt(0).toUpperCase() + verb.slice(1)} ${name(m)}...`, () => {
          if (m.hp <= 0) return isMine ? this.mineFaint(() => {}) : this.enemyFaint();
          next();
        });
      };
      next();
    }

    mineFaint(thenIgnored) {
      MQ.audio.sfx('faint');
      this.anim.mfall = 1;
      this.mine.status = null;
      this.mine.psn2T = 0;
      this.mine.confianza = Math.max(0, (this.mine.confianza || 70) - 5);
      this.say(`¡${name(this.mine)} se debilitó! Se fue en blanco.`, () => {
        const alive = MQ.player.party.some((m) => m.hp > 0);
        if (!alive) {
          this.say('No te quedan espantos en pie...', () => this.finish('lose'));
        } else {
          this.openParty(true);
        }
      });
    }

    enemyFaint() {
      MQ.audio.sfx('faint');
      this.anim.efall = 1;
      MQ.audio.cry(this.enemy.id);
      const e = this.enemy;
      e.status = null;
      this.say(`¡${name(e)} rival quedó fuera de servicio!`, () => this.giveXP(e));
    }

    giveXP(e) {
      const m = this.mine;
      if (m.hp > 0) {
        let xp = Math.floor(MQ.expYield(e.id) * e.lvl / 7 * (this.trainer ? 1.5 : 1));
        if (m.item === 'huevoguacharaca') xp = Math.floor(xp * 1.5);
        xp = Math.max(1, xp);
        m.xp += xp;
        // calle (EVs) del caído, tope Gen 3
        const yieldEv = MQ.SPECIES[e.id].ev_yield || {};
        m.evs = m.evs || MQ.zeroEVs();
        const total = Object.values(m.evs).reduce((a, b) => a + b, 0);
        let room = 510 - total;
        for (const [st, n] of Object.entries(yieldEv)) {
          const add = Math.min(n, room, 252 - (m.evs[st] || 0));
          if (add > 0) { m.evs[st] += add; room -= add; }
        }
        m.confianza = Math.min(255, (m.confianza || 70) + 2);
        this.say(`${name(m)} gana ${xp} puntos de experiencia.`);
        this.levelUps(m, () => this.nextEnemyOrWin());
      } else this.nextEnemyOrWin();
      this.pump();
    }

    levelUps(m, then) {
      const group = MQ.xpGroupOf(m.id);
      if (m.lvl < 100 && m.xp >= MQ.xpForLevel(m.lvl + 1, group)) {
        m.lvl++;
        MQ.recalcStats(m);
        MQ.audio.sfx('lvl');
        this.say(`¡${name(m)} sube al nivel ${m.lvl}!`);
        const learnable = MQ.SPECIES[m.id].learn.filter(([l]) => l === m.lvl).map(([, mv]) => mv);
        const teach = (i) => {
          if (i >= learnable.length) return this.levelUps(m, then);
          const mv = learnable[i];
          if (m.moves.includes(mv)) return teach(i + 1);
          if (m.moves.length < 4) {
            m.moves.push(mv);
            m.pp[mv] = MQ.MOVES[mv].pp;
            this.say(`¡${name(m)} aprende ${MQ.MOVES[mv].name}!`, () => teach(i + 1));
          } else {
            this.say(`${name(m)} quiere aprender ${MQ.MOVES[mv].name}, pero ya sabe 4 movimientos.`, () => {
              this.phase = 'learn';
              const items = m.moves.map((id, idx) => ({ label: 'Olvidar ' + MQ.MOVES[id].name.slice(0, 16), value: idx }))
                .concat([{ label: `No aprender ${MQ.MOVES[mv].name.slice(0, 12)}`, value: -1 }]);
              this.menu = new MQ.Menu(items, { x: 6, y: 40, w: 210, rows: 5, title: '¿OLVIDAR CUÁL?',
                onPick: (it) => {
                  if (it.value >= 0) {
                    const old = m.moves[it.value];
                    m.moves[it.value] = mv;
                    m.pp[mv] = MQ.MOVES[mv].pp;
                    this.say(`${name(m)} olvidó ${MQ.MOVES[old].name} y aprendió ${MQ.MOVES[mv].name}. ¡Uno, dos y... pum!`, () => teach(i + 1));
                  } else {
                    this.say(`Bueno, ${MQ.MOVES[mv].name} quedó pa' otra vida.`, () => teach(i + 1));
                  }
                  this.pump();
                },
                onCancel: () => {} });
            });
          }
        };
        teach(0);
      } else then();
    }

    nextEnemyOrWin() {
      if (this.trainer && this.ei < this.eteam.length - 1) {
        this.ei++;
        this.enemy = this.eteam[this.ei];
        this.anim.efall = 0;
        MQ.player.dexSeen[this.enemy.id] = true;
        Object.assign(this.est, zeroStages());
        Object.assign(this.evol, freshVol());
        this.say(`${this.trainer.name || this.trainer.cls} saca a ${name(this.enemy)}. ¡La cosa sigue!`, () => {
          MQ.audio.cry(this.enemy.id);
          this.entryEffects(this.enemy, false);
          this.act(() => this.toMenu());
        });
        this.pump();
        return;
      }
      if (this.trainer) {
        MQ.audio.music('gaita');
        let money = this.trainer.money * this.moneyMul;
        if (MQ.player.party.some((m) => m.item === 'morocota')) money *= 2;
        MQ.player.money += money;
        this.say(this.trainer.win);
        this.say(`Ganas ${money} bolos.`, () => this.finish('win'));
      } else {
        MQ.audio.stop();
        MQ.audio.sfx('victory');
        // buhonero: 10% de encontrarse algo tras el pleito
        const scav = MQ.player.party.find((m) => m.hp > 0 && m.ability === 'buhonero');
        if (scav && Math.random() < 0.1) {
          const finds = ['malta', 'ficha', 'cafe', 'mamon', 'tamarindo'];
          const k = finds[MQ.rand(finds.length)];
          MQ.player.bag[k] = (MQ.player.bag[k] || 0) + 1;
          this.say(`¡${name(scav)} se consiguió un(a) ${MQ.ITEMS[k].name} entre los rieles! Ojo de buhonero.`);
        }
        this.say('La oscuridad vuelve a quedarse quieta.', () => this.finish('win'));
      }
      this.pump();
    }

    finish(result) {
      if (this.over) return;
      this.over = true;
      // limpia volátiles que no deben salir del andén
      for (const m of MQ.player.party) { delete m._disp; }
      delete this.enemy._disp;
      // evoluciones pendientes (por nivel o por confianza)
      const evos = MQ.player.party.filter((m) => {
        const ev = MQ.SPECIES[m.id].evolve;
        if (!ev || result === 'lose') return false;
        if (ev.method === 'confianza') return (m.confianza || 0) >= (ev.confianza || 220);
        return m.lvl >= (ev.lvl || 999);
      });
      const doEvo = () => {
        const m = evos.shift();
        if (!m) { this.onEnd(result); return; }
        const ev = MQ.SPECIES[m.id].evolve;
        const from = m.id;
        this.say(`¿¡Qué molleja!? ¡${name(m)} está cambiando de forma!`, () => {
          MQ.sprites.preload([ev.to], ['front']);
          MQ.audio.sfx('lvl');
          this.phase = 'evo';
          this.evo = {
            from, to: ev.to, t: 0, stage: 'flash',
            apply: () => {
              m.id = ev.to;
              MQ.recalcStats(m);
              for (const [l, mv] of MQ.SPECIES[m.id].learn)
                if (l <= m.lvl && !m.moves.includes(mv) && m.moves.length < 4) { m.moves.push(mv); m.pp[mv] = MQ.MOVES[mv].pp; }
              MQ.player.dexCaught[m.id] = true; MQ.player.dexSeen[m.id] = true;
              MQ.audio.cry(m.id);
            },
            after: () => {
              this.evo = null; this.phase = 'msg';
              this.say(`¡Evolucionó a ${name(m)}! Caracas lo vio crecer.`, doEvo);
              this.pump();
            },
          };
        });
        this.pump();
      };
      doEvo();
      this.pump();
    }

    // La metamorfosis: parpadeo blanco que acelera, cambio de forma y estrellitas.
    tickEvo() {
      const e = this.evo;
      e.t++;
      if (e.stage === 'flash') {
        if (e.t % 8 === 0) MQ.audio.sfx('blip');
        if (e.t >= 96) { e.stage = 'burst'; e.t = 0; e.apply(); MQ.audio.sfx('catch'); MQ.audio.sfx('sparkle'); }
      } else if (e.stage === 'burst') {
        if (e.t >= 26) { e.stage = 'end'; e.t = 0; }
      } else if (e.stage === 'end') {
        if (e.t >= 8) e.after();
      }
    }

    drawEvo(ctx) {
      const e = this.evo, W = MQ.W, H = MQ.H;
      ctx.fillStyle = '#06040c'; ctx.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2 - 14, sc = 4;
      if (e.stage === 'flash') {
        const p = e.t / 96;
        const period = Math.max(3, 16 - Math.floor(p * 13));
        const id = (Math.floor(e.t / period) % 2) ? e.to : e.from;
        MQ.drawMonCentered(ctx, id, cx, cy, sc);
        MQ.drawMonCentered(ctx, id, cx, cy, sc, false, 1, '#fdf6e3', (0.25 + 0.6 * p) * ((Math.sin(e.t / 2) + 1) / 2));
      } else if (e.stage === 'burst') {
        MQ.drawMonCentered(ctx, e.to, cx, cy, sc);
        const a = Math.max(0, 1 - e.t / 26);
        ctx.fillStyle = `rgba(253,246,227,${a.toFixed(2)})`; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ffe66e';
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2, d = 8 + e.t * 1.6;
          const sx = Math.round(cx + Math.cos(ang) * d), sy = Math.round(cy + Math.sin(ang) * d);
          ctx.fillRect(sx - 1, sy, 3, 1); ctx.fillRect(sx, sy - 1, 1, 3);
        }
      } else {
        MQ.drawMonCentered(ctx, e.to, cx, cy, sc);
      }
    }

    // ---- entrada / dibujo --------------------------------------------------------
    press(k) {
      if (this.tb.active) { if (k === 'a' || k === 'b') this.tb.advance(); return; }
      if (this.menu && this.phase !== 'msg') this.menu.press(k);
    }

    update() {
      this.fc = (this.fc || 0) + 1;
      if (this.anim.shake > 0) this.anim.shake--;
      if (this.anim.intro > 0) this.anim.intro--;
      if (this.anim.efall > 0 && this.anim.efall < FALL) this.anim.efall++;
      if (this.anim.mfall > 0 && this.anim.mfall < FALL) this.anim.mfall++;
      if (this.cap) this.tickCapture();
      if (this.evo) this.tickEvo();
      for (const m of [this.mine, this.enemy]) {
        if (m._disp === undefined) m._disp = m.hp;
        const rate = Math.max(0.5, m.maxhp / 36);
        m._disp += MQ.clamp(m.hp - m._disp, -rate, rate);
        if (Math.abs(m.hp - m._disp) < 0.5) m._disp = m.hp;
      }
      if (!this.over && this.mine.hp > 0 && this.mine.hp <= this.mine.maxhp / 4 && this.fc % 48 === 0)
        MQ.audio.sfx('lowhp');
      if (!this.tb.active && this.phase === 'msg') this.pump();
    }

    statusChip(ctx, m, vol, x, y) {
      const st = m.status;
      if (st) {
        const S = MQ.STATUS[st];
        ctx.fillStyle = S.color; ctx.fillRect(x, y, 22, 9);
        ctx.fillStyle = '#16121f'; ctx.font = MQ.FONT;
        ctx.fillText(S.name, x + 2, y + 1);
      } else if (vol && vol.mareo > 0) {
        const S = MQ.VOLATILE.mareo;
        ctx.fillStyle = S.color; ctx.fillRect(x, y, 22, 9);
        ctx.fillStyle = '#16121f'; ctx.font = MQ.FONT;
        ctx.fillText('MAR', x + 2, y + 1);
      }
    }

    hpBar(ctx, x, y, w, m) {
      ctx.fillStyle = '#1a1a28'; ctx.fillRect(x, y, w, 6);
      const f = (m._disp ?? m.hp) / m.maxhp;
      ctx.fillStyle = f > 0.5 ? '#5e8b3f' : f > 0.2 ? '#e8a040' : '#b5300a';
      ctx.fillRect(x + 1, y + 1, Math.max(0, (w - 2) * f), 4);
    }

    // La ceremonia de captura, fotograma a fotograma.
    drawCapture(ctx, eCx, eCy, eBaseCy) {
      const c = this.cap;
      const restY = eBaseCy - 8;
      const ficha = (fx, fy, spin, tilt, open) => {
        ctx.save();
        ctx.translate(fx, fy);
        if (tilt) ctx.rotate(tilt);
        const sx = spin ? Math.max(0.2, Math.abs(Math.cos(spin))) : 1;
        ctx.scale(sx, 1);
        const r = 6;
        ctx.fillStyle = '#1a140a'; ctx.beginPath(); ctx.arc(0, 0, r + 1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = c.col.b; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = c.col.a; ctx.beginPath(); ctx.arc(0, 0, r - 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1a140a'; ctx.fillRect(-1.5, -1.5, 3, 3);
        if (open) { ctx.fillStyle = 'rgba(255,240,200,0.9)'; ctx.fillRect(-r, -1.5, r * 2, 3); }
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(-r + 1, -r + 2, 2, 2);
        ctx.restore();
      };
      const stars = (cx, cy, t) => {
        ctx.fillStyle = '#ffe66e';
        for (let i = 0; i < 3; i++) {
          const a = -Math.PI / 2 + (i - 1) * 0.7, d = 2 + t * 0.5;
          const sx = Math.round(cx + Math.cos(a) * d), sy = Math.round(cy - 6 + Math.sin(a) * d - t * 0.3);
          const s = i === 1 ? 2 : 1;
          ctx.fillRect(sx - s, sy, s * 2 + 1, 1); ctx.fillRect(sx, sy - s, 1, s * 2 + 1);
        }
      };
      const id = this.enemy.id;
      if (c.stage === 'toss') {
        const u = c.t / 22;
        const fx = 70 + (eCx - 70) * u;
        const fy = 180 + (eCy - 180) * u - Math.sin(u * Math.PI) * 60;
        ficha(fx, fy, c.t * 0.7, 0, false);
      } else if (c.stage === 'suck') {
        if (c.mul > 0.02) MQ.drawMonCentered(ctx, id, eCx, eCy, SC, false, c.mul, '#fdf6e3', 1);
        ficha(eCx, eCy, 0, 0, true);
        if (c.flash > 0) { ctx.fillStyle = `rgba(253,246,227,${(c.flash / 6 * 0.5).toFixed(2)})`; ctx.fillRect(0, 0, MQ.W, MQ.H); }
      } else if (c.stage === 'fall') {
        const u = c.t / 10;
        ficha(eCx, eCy + (restY - eCy) * u, 0, 0, false);
      } else if (c.stage === 'wobble') {
        const tilt = Math.sin(c.t / 20 * Math.PI * 2) * 0.5 * (1 - c.t / 20);
        ficha(eCx, restY, 0, tilt, false);
      } else if (c.stage === 'breakout') {
        if (c.mul < 1) MQ.drawMonCentered(ctx, id, eCx, eCy, SC, false, c.mul, '#fdf6e3', 1 - c.mul * 0.3);
      } else if (c.stage === 'caught') {
        ficha(eCx, restY, 0, 0, false);
        stars(eCx, restY, c.t);
      } else { // settle / decide
        ficha(eCx, restY, 0, 0, false);
      }
    }

    draw(ctx) {
      if (this.evo) { this.drawEvo(ctx); this.tb.draw(ctx); return; }
      const grad = ctx.createLinearGradient(0, 0, 0, MQ.H);
      grad.addColorStop(0, '#14101e'); grad.addColorStop(0.55, '#1e1830'); grad.addColorStop(1, '#2a2238');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, MQ.W, MQ.H);
      ctx.fillStyle = 'rgba(245,166,35,0.05)';
      for (let i = 0; i < 5; i++) ctx.fillRect(20 + i * 64, 0, 10, 150);
      ctx.fillStyle = '#0e0a16'; ctx.fillRect(0, 150, MQ.W, 2);
      ctx.fillStyle = 'rgba(245,166,35,0.04)'; ctx.fillRect(0, 152, MQ.W, MQ.H - 152);

      const slide = this.anim.intro > 0 ? this.anim.intro * 5 : 0;
      const sh = this.anim.shake ? (Math.random() * 4 - 2) : 0;
      const eAH = artH(this.enemy.id), mAH = artH(this.mine.id);
      const eCx = E_X + 32, eCy = E_Y + eAH / 2, eBaseCy = E_Y + eAH - 2;
      const mCx = M_X + 32, mBaseCy = M_Y + mAH - 2;

      const base = (cx, cy, rw, rh) => {
        ctx.fillStyle = '#3a3242'; ctx.beginPath(); ctx.ellipse(cx, cy + 2, rw, rh, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8a7a62'; ctx.beginPath(); ctx.ellipse(cx, cy + 1, rw, rh, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#b8a888'; ctx.beginPath(); ctx.ellipse(cx, cy - 1, rw - 2, rh - 1, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#c9bb9a'; ctx.beginPath(); ctx.ellipse(cx - rw * 0.25, cy - 2, rw * 0.38, rh * 0.4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#e85a1a'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(cx, cy + 1, rw - 3, rh - 1, 0, Math.PI * 0.12, Math.PI * 0.88); ctx.stroke();
      };
      base(eCx, eBaseCy, 40, 11);
      base(mCx, mBaseCy, 52, 14);

      const shadow = (cx, cy, rw, alpha) => {
        if (alpha <= 0) return;
        ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(cx, cy, rw, rw * 0.3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      };

      const combatant = (id, kind, tlx, tly, fall, alive) => {
        const bob = (alive && fall === 0 && this.anim.intro === 0) ? Math.round(Math.sin(this.fc / 16) * 1.5) : 0;
        const yOff = fall ? Math.round((fall / FALL) * 22) : 0;
        const alpha = fall ? Math.max(0, 1 - fall / FALL) : 1;
        if (alpha <= 0) return;
        const yy = tly + yOff - bob, size = SC * 16;
        if (MQ.drawSprite(ctx, id, kind, tlx, yy, size, false, null, alpha)) return;
        if (alpha < 1) { ctx.save(); ctx.globalAlpha = alpha; }
        MQ.drawMon(ctx, id, tlx, yy, SC, kind === 'back');
        if (alpha < 1) ctx.restore();
      };

      const capByFX = this.cap && this.cap.stage !== 'toss';
      if (!capByFX && this.anim.efall < FALL && (this.enemy.hp > 0 || this.phase === 'msg' || this.anim.efall > 0)) {
        shadow(eCx, eBaseCy, 22, 0.3 * (1 - this.anim.efall / FALL));
        combatant(this.enemy.id, this.enemy.shiny ? 'shiny' : 'front', E_X + sh + slide, E_Y, this.anim.efall, this.enemy.hp > 0);
        if (this.enemy.shiny && this.enemy.hp > 0 && this.fc < 60) {
          const tt = this.fc;
          ctx.fillStyle = '#bdfcff';
          for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + tt * 0.15, d = 10 + (tt % 30);
            const sx = Math.round(eCx + Math.cos(a) * d), sy = Math.round(eCy + Math.sin(a) * d);
            ctx.fillRect(sx - 1, sy, 3, 1); ctx.fillRect(sx, sy - 1, 1, 3);
          }
        }
      }
      if (this.anim.mfall < FALL && (this.mine.hp > 0 || this.anim.mfall > 0)) {
        shadow(mCx, mBaseCy, 28, 0.3 * (1 - this.anim.mfall / FALL));
        combatant(this.mine.id, 'back', M_X - sh - slide, M_Y, this.anim.mfall, this.mine.hp > 0);
      }

      if (this.cap) this.drawCapture(ctx, eCx, eCy, eBaseCy);

      if (this.anim.intro > 28 && this.anim.intro % 4 < 2) {
        ctx.fillStyle = 'rgba(245,215,110,0.35)'; ctx.fillRect(0, 0, MQ.W, MQ.H);
      }

      // clima activo: letrero discreto arriba al centro
      if (this.weather) {
        ctx.font = MQ.FONT;
        ctx.fillStyle = 'rgba(232,223,200,0.75)';
        const wn = MQ.WEATHER[this.weather.kind].name.toUpperCase();
        ctx.fillText(wn, (MQ.W - wn.length * 4.8) / 2, 1);
      }

      ctx.font = MQ.FONT_B; ctx.textBaseline = 'top';
      MQ.panel(ctx, 6, 8, 150, 34);
      ctx.fillStyle = '#e8dfc8';
      const eGender = this.enemy.gender === 'm' ? '♂' : this.enemy.gender === 'f' ? '♀' : '';
      ctx.fillText((this.enemy.shiny ? '★' : '') + name(this.enemy) + eGender + '  N' + this.enemy.lvl, 14, 15);
      this.hpBar(ctx, 14, 28, 120, this.enemy);
      this.statusChip(ctx, this.enemy, this.evol, 112, 14);
      ctx.font = MQ.FONT_B;
      const types = MQ.SPECIES[this.enemy.id].types;
      types.forEach((t, i) => {
        ctx.fillStyle = MQ.TYPES[t].color;
        ctx.fillRect(140, 15 + i * 8, 8, 6);
      });
      MQ.panel(ctx, MQ.W - 166, 156, 160, 44);
      ctx.fillStyle = '#e8dfc8';
      const mGender = this.mine.gender === 'm' ? '♂' : this.mine.gender === 'f' ? '♀' : '';
      ctx.fillText((this.mine.shiny ? '★' : '') + name(this.mine) + mGender + '  N' + this.mine.lvl, MQ.W - 158, 163);
      this.hpBar(ctx, MQ.W - 158, 176, 130, this.mine);
      ctx.font = MQ.FONT;
      ctx.fillStyle = '#8a8aa0';
      ctx.fillText(`${this.mine.hp}/${this.mine.maxhp} PS`, MQ.W - 158, 186);
      this.statusChip(ctx, this.mine, this.pvol, MQ.W - 92, 185);
      const group = MQ.xpGroupOf(this.mine.id);
      const cur = MQ.xpForLevel(this.mine.lvl, group), nxt = MQ.xpForLevel(this.mine.lvl + 1, group);
      const xf = MQ.clamp((this.mine.xp - cur) / (nxt - cur), 0, 1);
      ctx.fillStyle = '#1a1a28'; ctx.fillRect(MQ.W - 60, 188, 50, 4);
      ctx.fillStyle = '#4a90d9'; ctx.fillRect(MQ.W - 60, 188, 50 * xf, 4);

      if (this.menu && (this.phase === 'menu' || this.phase === 'moves' || this.phase === 'party' || this.phase === 'bag' || this.phase === 'learn'))
        this.menu.draw(ctx);
      this.tb.draw(ctx);
    }
  };
})();
