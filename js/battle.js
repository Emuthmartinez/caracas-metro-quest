// Metro Quest — combate por turnos en el andén.
(() => {
  const MQ = (globalThis.MQ = globalThis.MQ || {});

  const stageMul = (s) => Math.max(2, 2 + s) / Math.max(2, 2 - s);
  const name = (m) => MQ.SPECIES[m.id].name;
  const FALL = 16;        // cuadros que tarda un espanto en caer al debilitarse
  // posición de cada combatiente en el andén de combate (esquina sup-der / inf-izq)
  const E_X = MQ.W - 84, E_Y = 28, M_X = 18, M_Y = 130, SC = 4;
  const artW = (id) => (MQ.SPECIES[id].art[0].length * SC);
  const artH = (id) => (MQ.SPECIES[id].art.length * SC);

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
      this.queue = [];          // [{t:texto, fn}]
      this.phase = 'msg';
      this.menu = null;
      this.over = false;
      this.anim = { shake: 0, flash: 0, px: 0, ex: 0, intro: 36, efall: 0, mfall: 0 };
      this.cap = null;          // ceremonia de captura en curso
      this.fc = 0;

      const p = MQ.player;
      p.party.forEach(MQ.ensurePP); // migra partidas viejas sin PP
      this.trainer = opts.trainer || null;
      if (this.trainer) {
        this.eteam = this.trainer.team.map(([id, lvl]) => MQ.makeMon(id, lvl));
        this.ei = 0;
        this.enemy = this.eteam[0];
        MQ.audio.music(this.trainer.boss ? 'boss' : 'battle');
      } else {
        this.enemy = MQ.makeMon(opts.wild.id, opts.wild.lvl);
        MQ.audio.music(opts.wild.id === 'trenfantasma' ? 'boss' : 'battle');
      }
      p.dexSeen[this.enemy.id] = true;
      this.mi = p.party.findIndex((m) => m.hp > 0);
      this.mine = p.party[this.mi];
      this.pst = { atk: 0, def: 0, spd: 0 };
      this.est = { atk: 0, def: 0, spd: 0 };
      // precarga de sprites: rivales (front) y propios (back) para que no haya pop-in
      const foes = this.eteam ? this.eteam.map((m) => m.id) : [this.enemy.id];
      MQ.sprites.preload(foes, ['front']);
      MQ.sprites.preload(p.party.map((m) => m.id), ['front', 'back']);

      if (this.trainer) {
        this.say(`¡${this.trainer.cls} ${this.trainer.name || ''} te reta!`.replace('  ', ' '));
        this.say(this.trainer.intro);
        this.say(`${this.trainer.name || this.trainer.cls} saca a ${name(this.enemy)}.`, () => MQ.audio.cry(this.enemy.id));
      } else {
        MQ.audio.cry(this.enemy.id);
        this.say(`¡Un ${name(this.enemy)} salvaje apareció en la oscuridad!`);
      }
      this.say(`¡Dale, ${name(this.mine)}!`, () => { MQ.audio.cry(this.mine.id); this.toMenu(); });
    }

    say(t, fn) { this.queue.push({ t, fn }); }

    pump() {
      if (this.tb.active) return;
      const m = this.queue.shift();
      if (m) { this.phase = 'msg'; this.tb.open(MQ.ctx, m.t, () => { m.fn && m.fn(); this.pump(); }); }
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
      const items = Object.keys(p.bag).filter((k) => p.bag[k] > 0).map((k) => ({
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
      } else if (item.heal) {
        if (this.mine.hp <= 0) { this.toMenu(); return; }
        p.bag[k]--;
        const h = Math.min(item.heal, this.mine.maxhp - this.mine.hp);
        this.mine.hp += h;
        MQ.audio.sfx('heal');
        this.say(`${name(this.mine)} recupera ${h} PS. ¡Qué sabroso!`, () => this.enemyTurn());
        this.pump();
      } else if (item.cure) {
        if (!this.mine.status) { this.say('No tiene ningún mal que curar. ¡Está más sano que tú!', () => this.toMenu()); this.pump(); return; }
        p.bag[k]--;
        this.mine.status = null;
        MQ.audio.sfx('heal');
        this.say(`El agua de coco obra el milagro: ¡${name(this.mine)} quedó como nuevo!`, () => this.enemyTurn());
        this.pump();
      } else if (item.revive) {
        const t = p.party.find((m) => m.hp <= 0);
        if (!t) { this.say('Nadie necesita la cocada... todavía.', () => this.toMenu()); this.pump(); return; }
        p.bag[k]--;
        t.hp = Math.floor(t.maxhp * item.revive);
        MQ.audio.sfx('heal');
        this.say(`¡${name(t)} despertó con la cocada! Azúcar es azúcar.`, () => this.enemyTurn());
        this.pump();
      }
    }

    // La ceremonia de la ficha: vuela en arco, el espanto se encoge dentro,
    // la ficha cae y tambalea; si lo respeta se queda quieta con estrellitas,
    // si no, revienta y el espanto sale de vuelta. El alma de un juego de fichar.
    throwFicha(item) {
      const sp = MQ.SPECIES[this.enemy.id];
      const noCatch = this.opts.noCatch;
      const hpFrac = this.enemy.hp / this.enemy.maxhp;
      // dormido ayuda el doble; paralizado o envenenado, la mitad más
      const statusMul = this.enemy.status === 'slp' ? 2 : this.enemy.status ? 1.5 : 1;
      const pr = Math.max(0.03, (sp.catch / 255) * (1 - 0.66 * hpFrac) * item.ball * statusMul);
      const willCatch = !noCatch && (item.ball >= 255 || Math.random() < pr);
      // cuántas veces tambalea antes de fallar: cuanto más cerca, más aguanta
      const shakes = willCatch ? 3 : MQ.clamp(Math.round(pr * 3), 0, 2);
      const col = item.ball >= 255
        ? { a: '#ffe66e', b: '#f5a623' }          // Ficha de Oro
        : item.ball >= 1.8
          ? { a: '#f5d76e', b: '#d9a441' }        // Ficha Dorada (pulida)
          : { a: '#e0b24a', b: '#a8782a' };       // Ficha del Metro (latón)
      this.phase = 'capture';
      this.menu = null;
      this.cap = { stage: 'toss', t: 0, item, willCatch, shakes, wob: 0, mul: 1, flash: 0, col };
      MQ.audio.sfx('toss');
      this.say(`¡Le lanzas una ${item.name}!`);
      this.pump();
    }

    tickCapture() {
      const c = this.cap;
      if (this.tb.active) return;   // deja leer "¡Le lanzas una ...!"
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
      const e = this.enemy, item = this.cap.item;
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
      void item;
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
        label: `${name(m)} N${m.lvl}`, sub: m.hp <= 0 ? 'K.O.' : `${m.hp}/${m.maxhp}`, value: i }));
      this.phase = 'party';
      this.menu = new MQ.Menu(items, { x: 6, y: 40, w: 200, rows: 6, title: forced ? '¡ELIGE OTRO!' : 'EQUIPO',
        onPick: (it) => {
          const m = p.party[it.value];
          if (m.hp <= 0) { MQ.audio.sfx('bump'); return; }
          if (it.value === this.mi && !forced) { MQ.audio.sfx('bump'); return; }
          this.mi = it.value; this.mine = m;
          this.anim.mfall = 0;
          this.pst = { atk: 0, def: 0, spd: 0 };
          this.say(`¡Échale pichón, ${name(m)}!`, () => forced ? this.toMenu() : this.enemyTurn());
          this.pump();
        },
        onCancel: () => { if (!forced) this.toMenu(); } });
    }

    tryFlee() {
      if (this.trainer) { this.say('¡De un duelo no se huye, chamo! Eso no se hace.', () => this.toMenu()); this.pump(); return; }
      if (this.opts.noFlee) { this.say('¡El Tren Fantasma bloquea el túnel! No hay pa\' dónde correr.', () => this.toMenu()); this.pump(); return; }
      const odds = 0.6 + (this.mine.spd - this.enemy.spd) / 80;
      if (Math.random() < odds) {
        MQ.audio.sfx('flee');
        this.say('Saliste en carrerita. ¡El que corre vive pa\' contar el cuento!', () => this.finish('flee'));
      } else {
        this.say('¡No hubo chance! El espanto te cierra el paso.', () => this.enemyTurn());
      }
      this.pump();
    }

    // ---- turno ----------------------------------------------------------------
    turn(moveId) {
      this.phase = 'msg';
      const parMul = (m) => (m.status === 'par' ? 0.5 : 1);
      const pSpd = this.mine.spd * stageMul(this.pst.spd) * parMul(this.mine);
      const eSpd = this.enemy.spd * stageMul(this.est.spd) * parMul(this.enemy);
      const mineFirst = pSpd === eSpd ? Math.random() < 0.5 : pSpd > eSpd;
      if (mineFirst) {
        this.doMove(this.mine, this.enemy, moveId, true, () => {
          if (this.enemy.hp <= 0) return this.enemyFaint();
          this.doMove(this.enemy, this.mine, this.enemyPick(), false, () => this.afterRound());
        });
      } else {
        this.doMove(this.enemy, this.mine, this.enemyPick(), false, () => {
          if (this.mine.hp <= 0) return this.afterRound();
          this.doMove(this.mine, this.enemy, moveId, true, () => this.afterRound());
        });
      }
      this.pump();
    }

    enemyTurn() { // el enemigo pega tras ítem/cambio
      this.doMove(this.enemy, this.mine, this.enemyPick(), false, () => this.afterRound());
      this.pump();
    }

    enemyPick() {
      const avail = this.enemy.moves.filter((id) => (this.enemy.pp[id] ?? 0) > 0);
      if (!avail.length) return 'forcejeo';
      const scored = avail.map((id) => {
        const m = MQ.MOVES[id];
        let s = Math.random() * 20;
        if (m.pow) s += m.pow * MQ.effect(m.type, MQ.SPECIES[this.mine.id].types);
        else if (m.fx && m.fx.status) s += this.mine.status ? 0 : 40;
        else s += this.est.atk + this.pst.atk > -2 ? 25 : 0;
        return [s, id];
      }).sort((a, b) => b[0] - a[0]);
      return scored[0][1];
    }

    applyStatus(target, st, then) {
      if (target.hp <= 0) { then(); return; }
      if (target.status) { this.say('...pero no surte efecto.', then); return; }
      target.status = st;
      if (st === 'slp') target.slpT = 1 + MQ.rand(3); // 1-3 turnos
      MQ.audio.sfx('weak');
      this.say(`¡${name(target)} ${MQ.STATUS[st].verb}!`, then);
    }

    doMove(atk, def, moveId, isMine, then) {
      const mv = MQ.MOVES[moveId];
      const aSt = isMine ? this.pst : this.est;
      const dSt = isMine ? this.est : this.pst;
      // dormido: pierde el turno hasta despertar
      if (atk.status === 'slp') {
        atk.slpT = (atk.slpT || 1) - 1;
        if (atk.slpT > 0) { this.say(`${name(atk)} está dormido... sueña con el llano.`, then); return; }
        atk.status = null;
        this.say(`¡${name(atk)} despertó!`);
      }
      // paralizado: 25% de quedarse pegado
      if (atk.status === 'par' && Math.random() < 0.25) {
        MQ.audio.sfx('weak');
        this.say(`¡${name(atk)} está paralizado! El corrientazo no lo deja moverse.`, then);
        return;
      }
      if (moveId !== 'forcejeo' && atk.pp && atk.pp[moveId] !== undefined) atk.pp[moveId]--;
      this.say(`${isMine ? '' : 'El rival: '}¡${name(atk)} usa ${mv.name}!`, () => {
        if (Math.random() * 100 > mv.acc) {
          MQ.audio.sfx('weak');
          this.say('...¡pero falló! Quedó pintado en la pared.', then);
          return;
        }
        if (mv.pow) {
          const sp = MQ.SPECIES[def.id];
          const eff = MQ.effect(mv.type, sp.types);
          const stab = MQ.SPECIES[atk.id].types.includes(mv.type) ? 1.5 : 1;
          const crit = Math.random() < 1 / 16 ? 1.5 : 1;
          const A = atk.atk * stageMul(aSt.atk), D = Math.max(1, def.def * stageMul(dSt.def));
          let dmg = Math.floor((((2 * atk.lvl / 5 + 2) * mv.pow * A / D) / 50 + 2) * stab * eff * crit * (0.85 + Math.random() * 0.15));
          dmg = Math.max(1, dmg);
          def.hp = Math.max(0, def.hp - dmg);
          this.anim.shake = crit > 1 ? 12 : 8;
          MQ.audio.sfx(eff > 1 || crit > 1 ? 'eff' : eff < 1 ? 'weak' : 'hit');
          let extra = eff > 1 ? ' ¡Le dolió hasta el apellido!' : eff < 1 ? ' No le hizo ni cosquillas...' : '';
          if (crit > 1) extra = ' ¡GOLPE CRÍTICO! De los que no se olvidan.' + (eff > 1 ? ' Y encima le dolió doble.' : '');
          this.say(`Hace ${dmg} de daño.${extra}`, () => {
            const cont = () => {
              if (def.hp <= 0) return isMine ? then() : this.mineFaint(then);
              if (mv.fx && mv.fx.status && Math.random() < (mv.fx.chance ?? 1))
                return this.applyStatus(def, mv.fx.status, then);
              then();
            };
            if (mv.recoil && dmg > 0) {
              atk.hp = Math.max(0, atk.hp - Math.max(1, Math.ceil(dmg * mv.recoil)));
              this.say(`¡${name(atk)} se resiente del forcejeo!`, () => {
                if (atk.hp <= 0) return isMine ? this.mineFaint(then) : this.enemyFaint();
                cont();
              });
            } else cont();
          });
        } else if (mv.fx && mv.fx.status) {
          this.applyStatus(def, mv.fx.status, then);
        } else if (mv.fx && mv.fx.heal) {
          const h = Math.min(Math.floor(atk.maxhp * mv.fx.heal), atk.maxhp - atk.hp);
          atk.hp += h;
          MQ.audio.sfx('heal');
          this.say(h > 0 ? `${name(atk)} recupera ${h} PS. Eso cura el alma.` : 'Pero ya estaba full...', then);
        } else if (mv.fx && mv.fx.stage) {
          const [stat, d, who] = mv.fx.stage;
          const target = who === 'self' ? aSt : dSt;
          target[stat] = MQ.clamp(target[stat] + d, -4, 4);
          const tn = who === 'self' ? name(atk) : name(who === 'foe' && isMine ? this.enemy : this.mine);
          const sn = { atk: 'ataque', def: 'defensa', spd: 'velocidad' }[stat];
          MQ.audio.sfx(d > 0 ? 'heal' : 'weak');
          this.say(`La ${sn} de ${tn} ${d > 0 ? 'sube' : 'baja'}.`, then);
        } else then();
      });
    }

    afterRound() {
      if (this.enemy.hp <= 0) return this.enemyFaint();
      if (this.mine.hp <= 0) return; // mineFaint ya encoló
      // el veneno gotea al cierre de la ronda
      const ticks = [];
      if (this.mine.status === 'psn') ticks.push([this.mine, true]);
      if (this.enemy.status === 'psn') ticks.push([this.enemy, false]);
      const next = () => {
        if (!ticks.length) return this.toMenu();
        const [m, isMine] = ticks.shift();
        m.hp = Math.max(0, m.hp - Math.max(1, Math.floor(m.maxhp / 8)));
        MQ.audio.sfx('weak');
        this.say(`El veneno hace lo suyo con ${name(m)}...`, () => {
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
        xp = Math.max(1, xp);
        m.xp += xp;
        this.say(`${name(m)} gana ${xp} puntos de experiencia.`);
        this.levelUps(m, () => this.nextEnemyOrWin());
      } else this.nextEnemyOrWin();
      this.pump();
    }

    levelUps(m, then) {
      if (m.lvl < 99 && m.xp >= MQ.xpForLevel(m.lvl + 1)) {
        m.lvl++;
        const st = MQ.calcStats(m.id, m.lvl);
        const dHp = st.hp - m.maxhp;
        m.maxhp = st.hp; m.hp = Math.min(m.maxhp, m.hp + dHp);
        m.atk = st.atk; m.def = st.def; m.spd = st.spd;
        MQ.audio.sfx('lvl');
        this.say(`¡${name(m)} sube al nivel ${m.lvl}!`);
        const learnable = MQ.SPECIES[m.id].learn.filter(([l]) => l === m.lvl).map(([, mv]) => mv);
        const teach = (i) => {
          if (i >= learnable.length) return this.levelUps(m, then);
          const mv = learnable[i];
          if (m.moves.includes(mv)) return teach(i + 1);
          if (m.moves.length < 4) {
            m.moves.push(mv);
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
        this.est = { atk: 0, def: 0, spd: 0 };
        this.say(`${this.trainer.name || this.trainer.cls} saca a ${name(this.enemy)}. ¡La cosa sigue!`, () => { MQ.audio.cry(this.enemy.id); this.toMenu(); });
        this.pump();
        return;
      }
      if (this.trainer) {
        MQ.audio.music('gaita');
        MQ.player.money += this.trainer.money;
        this.say(this.trainer.win);
        this.say(`Ganas ${this.trainer.money} bolos.`, () => this.finish('win'));
      } else {
        MQ.audio.stop();
        MQ.audio.sfx('victory');
        this.say('La oscuridad vuelve a quedarse quieta.', () => this.finish('win'));
      }
      this.pump();
    }

    finish(result) {
      if (this.over) return;
      this.over = true;
      // evoluciones pendientes
      const evos = MQ.player.party.filter((m) => {
        const ev = MQ.SPECIES[m.id].evolve;
        return ev && m.lvl >= ev.lvl && result !== 'lose';
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
          // la metamorfosis ocurre a media animación (apply); luego el remate
          this.evo = {
            from, to: ev.to, t: 0, stage: 'flash',
            apply: () => {
              const frac = m.hp / m.maxhp;
              m.id = ev.to;
              const st = MQ.calcStats(m.id, m.lvl);
              m.maxhp = st.hp; m.hp = Math.max(1, Math.floor(st.hp * frac));
              m.atk = st.atk; m.def = st.def; m.spd = st.spd;
              for (const [l, mv] of MQ.SPECIES[m.id].learn)
                if (l <= m.lvl && !m.moves.includes(mv) && m.moves.length < 4) m.moves.push(mv);
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
        const p = e.t / 96;                                  // 0..1, acelera
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
      // las barras de vida se vacían poco a poco, como debe ser
      for (const m of [this.mine, this.enemy]) {
        if (m._disp === undefined) m._disp = m.hp;
        const rate = Math.max(0.5, m.maxhp / 36);
        m._disp += MQ.clamp(m.hp - m._disp, -rate, rate);
        if (Math.abs(m.hp - m._disp) < 0.5) m._disp = m.hp;
      }
      // pitido de alarma cuando tu espanto está grave
      if (!this.over && this.mine.hp > 0 && this.mine.hp <= this.mine.maxhp / 4 && this.fc % 48 === 0)
        MQ.audio.sfx('lowhp');
      if (!this.tb.active && this.phase === 'msg') this.pump();
    }

    statusChip(ctx, st, x, y) {
      if (!st) return;
      const S = MQ.STATUS[st];
      ctx.fillStyle = S.color; ctx.fillRect(x, y, 22, 9);
      ctx.fillStyle = '#16121f'; ctx.font = MQ.FONT;
      ctx.fillText(S.name, x + 2, y + 1);
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
        ctx.fillStyle = '#1a140a'; ctx.fillRect(-1.5, -1.5, 3, 3);            // hueco de la ficha
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
      // fondo: pared del túnel arriba, andén de concreto abajo
      const grad = ctx.createLinearGradient(0, 0, 0, MQ.H);
      grad.addColorStop(0, '#14101e'); grad.addColorStop(0.55, '#1e1830'); grad.addColorStop(1, '#2a2238');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, MQ.W, MQ.H);
      // pilares de luz de servicio (apenas insinuados)
      ctx.fillStyle = 'rgba(245,166,35,0.05)';
      for (let i = 0; i < 5; i++) ctx.fillRect(20 + i * 64, 0, 10, 150);
      // junta pared/andén y vías al fondo
      ctx.fillStyle = '#0e0a16'; ctx.fillRect(0, 150, MQ.W, 2);
      ctx.fillStyle = 'rgba(245,166,35,0.04)'; ctx.fillRect(0, 152, MQ.W, MQ.H - 152);

      // posiciones y geometría de cada combatiente
      const slide = this.anim.intro > 0 ? this.anim.intro * 5 : 0;
      const sh = this.anim.shake ? (Math.random() * 4 - 2) : 0;
      const eAH = artH(this.enemy.id), mAH = artH(this.mine.id);
      const eCx = E_X + 32, eCy = E_Y + eAH / 2, eBaseCy = E_Y + eAH - 2;
      const mCx = M_X + 32, mBaseCy = M_Y + mAH - 2;

      // — discos del andén (las "bases" estilo clásico, con la franja naranja) —
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

      // dibuja un combatiente con cabeceo en reposo y caída al debilitarse;
      // usa el sprite PNG (front del enemigo / back del propio) o el fallback
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

      const capByFX = this.cap && this.cap.stage !== 'toss';   // la captura dibuja al enemigo
      // enemigo (arriba derecha) — sombra + sprite
      if (!capByFX && this.anim.efall < FALL && (this.enemy.hp > 0 || this.phase === 'msg' || this.anim.efall > 0)) {
        shadow(eCx, eBaseCy, 22, 0.3 * (1 - this.anim.efall / FALL));
        combatant(this.enemy.id, 'front', E_X + sh + slide, E_Y, this.anim.efall, this.enemy.hp > 0);
      }
      // mío (abajo izquierda) — sprite trasero
      if (this.anim.mfall < FALL && (this.mine.hp > 0 || this.anim.mfall > 0)) {
        shadow(mCx, mBaseCy, 28, 0.3 * (1 - this.anim.mfall / FALL));
        combatant(this.mine.id, 'back', M_X - sh - slide, M_Y, this.anim.mfall, this.mine.hp > 0);
      }

      // — la ceremonia de la ficha —
      if (this.cap) this.drawCapture(ctx, eCx, eCy, eBaseCy);

      // destello inicial
      if (this.anim.intro > 28 && this.anim.intro % 4 < 2) {
        ctx.fillStyle = 'rgba(245,215,110,0.35)'; ctx.fillRect(0, 0, MQ.W, MQ.H);
      }

      ctx.font = MQ.FONT_B; ctx.textBaseline = 'top';
      // panel enemigo
      MQ.panel(ctx, 6, 8, 150, 34);
      ctx.fillStyle = '#e8dfc8';
      ctx.fillText(name(this.enemy) + '  N' + this.enemy.lvl, 14, 15);
      this.hpBar(ctx, 14, 28, 120, this.enemy);
      this.statusChip(ctx, this.enemy.status, 112, 14);
      ctx.font = MQ.FONT_B;
      const types = MQ.SPECIES[this.enemy.id].types;
      types.forEach((t, i) => {
        ctx.fillStyle = MQ.TYPES[t].color;
        ctx.fillRect(140, 15 + i * 8, 8, 6);
      });
      // panel mío
      MQ.panel(ctx, MQ.W - 166, 156, 160, 44);
      ctx.fillStyle = '#e8dfc8';
      ctx.fillText(name(this.mine) + '  N' + this.mine.lvl, MQ.W - 158, 163);
      this.hpBar(ctx, MQ.W - 158, 176, 130, this.mine);
      ctx.font = MQ.FONT;
      ctx.fillStyle = '#8a8aa0';
      ctx.fillText(`${this.mine.hp}/${this.mine.maxhp} PS`, MQ.W - 158, 186);
      this.statusChip(ctx, this.mine.status, MQ.W - 92, 185);
      // barra xp
      const cur = MQ.xpForLevel(this.mine.lvl), nxt = MQ.xpForLevel(this.mine.lvl + 1);
      const xf = MQ.clamp((this.mine.xp - cur) / (nxt - cur), 0, 1);
      ctx.fillStyle = '#1a1a28'; ctx.fillRect(MQ.W - 60, 188, 50, 4);
      ctx.fillStyle = '#4a90d9'; ctx.fillRect(MQ.W - 60, 188, 50 * xf, 4);

      if (this.menu && (this.phase === 'menu' || this.phase === 'moves' || this.phase === 'party' || this.phase === 'bag' || this.phase === 'learn'))
        this.menu.draw(ctx);
      this.tb.draw(ctx);
    }
  };
})();
