// Metro Quest — combate por turnos en el andén.
(() => {
  const MQ = (globalThis.MQ = globalThis.MQ || {});

  const stageMul = (s) => Math.max(2, 2 + s) / Math.max(2, 2 - s);
  const name = (m) => MQ.SPECIES[m.id].name;

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
      this.anim = { shake: 0, flash: 0, px: 0, ex: 0 };

      const p = MQ.player;
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
        const mv = this.mine.moves.map((id) => ({
          label: MQ.MOVES[id].name.slice(0, 18), sub: MQ.MOVES[id].type.slice(0, 3), value: id }));
        this.phase = 'moves';
        this.menu = new MQ.Menu(mv, { x: 6, y: MQ.H - 13 * mv.length - 28, w: 180, rows: 4,
          title: 'MOVIMIENTOS',
          onPick: (it) => this.turn(it.value),
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

    throwFicha(item) {
      const sp = MQ.SPECIES[this.enemy.id];
      const noCatch = this.opts.noCatch;
      this.phase = 'msg';
      MQ.audio.sfx('ficha');
      const hpFrac = this.enemy.hp / this.enemy.maxhp;
      const p = (sp.catch / 255) * (1 - 0.66 * hpFrac) * item.ball;
      const caught = !noCatch && (item.ball >= 255 || Math.random() < Math.max(0.03, p));
      this.say(`Lanzas una ${item.name}... La ficha gira en el aire...`);
      if (caught) {
        MQ.audio.sfx('catch');
        const mon = { ...this.enemy };
        const dest = MQ.addMon(mon);
        this.say(`¡PLIN! ¡${name(this.enemy)} aceptó tu ficha!`);
        this.say(dest === 'equipo'
          ? `¡${name(this.enemy)} se une a tu equipo! Quedó FICHADO.`
          : `Tu equipo está full. ${name(this.enemy)} te espera en el LOCKER de la estación.`,
          () => this.finish('catch'));
      } else {
        this.say(`¡${name(this.enemy)} escupió la ficha! Todavía no te respeta.`, () => this.enemyTurn());
      }
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
      const pSpd = this.mine.spd * stageMul(this.pst.spd);
      const eSpd = this.enemy.spd * stageMul(this.est.spd);
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
      const mv = this.enemy.moves;
      const scored = mv.map((id) => {
        const m = MQ.MOVES[id];
        let s = Math.random() * 20;
        if (m.pow) s += m.pow * MQ.effect(m.type, MQ.SPECIES[this.mine.id].types);
        else s += this.est.atk + this.pst.atk > -2 ? 25 : 0;
        return [s, id];
      }).sort((a, b) => b[0] - a[0]);
      return scored[0][1];
    }

    doMove(atk, def, moveId, isMine, then) {
      const mv = MQ.MOVES[moveId];
      const aSt = isMine ? this.pst : this.est;
      const dSt = isMine ? this.est : this.pst;
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
          const A = atk.atk * stageMul(aSt.atk), D = Math.max(1, def.def * stageMul(dSt.def));
          let dmg = Math.floor((((2 * atk.lvl / 5 + 2) * mv.pow * A / D) / 50 + 2) * stab * eff * (0.85 + Math.random() * 0.15));
          dmg = Math.max(1, dmg);
          def.hp = Math.max(0, def.hp - dmg);
          this.anim.shake = 8;
          MQ.audio.sfx(eff > 1 ? 'eff' : eff < 1 ? 'weak' : 'hit');
          let extra = eff > 1 ? ' ¡Le dolió hasta el apellido!' : eff < 1 ? ' No le hizo ni cosquillas...' : '';
          this.say(`Hace ${dmg} de daño.${extra}`, () => {
            if (def.hp <= 0 && !isMine) return this.mineFaint(then);
            then();
          });
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
      this.toMenu();
    }

    mineFaint(thenIgnored) {
      MQ.audio.sfx('faint');
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
      MQ.audio.cry(this.enemy.id);
      const e = this.enemy;
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
        this.say(`¿¡Qué molleja!? ¡${name(m)} está cambiando de forma!`, () => {
          const frac = m.hp / m.maxhp;
          m.id = ev.to;
          const st = MQ.calcStats(m.id, m.lvl);
          m.maxhp = st.hp; m.hp = Math.max(1, Math.floor(st.hp * frac));
          m.atk = st.atk; m.def = st.def; m.spd = st.spd;
          for (const [l, mv] of MQ.SPECIES[m.id].learn)
            if (l <= m.lvl && !m.moves.includes(mv) && m.moves.length < 4) m.moves.push(mv);
          MQ.player.dexCaught[m.id] = true; MQ.player.dexSeen[m.id] = true;
          MQ.audio.sfx('catch');
          MQ.audio.cry(m.id);
          this.say(`¡Evolucionó a ${name(m)}! Caracas lo vio crecer.`, doEvo);
        });
        this.pump();
      };
      doEvo();
      this.pump();
    }

    // ---- entrada / dibujo --------------------------------------------------------
    press(k) {
      if (this.tb.active) { if (k === 'a' || k === 'b') this.tb.advance(); return; }
      if (this.menu && this.phase !== 'msg') this.menu.press(k);
    }

    update() {
      if (this.anim.shake > 0) this.anim.shake--;
      if (!this.tb.active && this.phase === 'msg') this.pump();
    }

    hpBar(ctx, x, y, w, m) {
      ctx.fillStyle = '#1a1a28'; ctx.fillRect(x, y, w, 6);
      const f = m.hp / m.maxhp;
      ctx.fillStyle = f > 0.5 ? '#5e8b3f' : f > 0.2 ? '#e8a040' : '#b5300a';
      ctx.fillRect(x + 1, y + 1, Math.max(0, (w - 2) * f), 4);
    }

    draw(ctx) {
      // fondo: túnel
      const grad = ctx.createLinearGradient(0, 0, 0, MQ.H);
      grad.addColorStop(0, '#16121f'); grad.addColorStop(1, '#241c30');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, MQ.W, MQ.H);
      ctx.fillStyle = '#0e0a16'; ctx.fillRect(0, 96, MQ.W, 4);
      ctx.fillStyle = '#3a3242'; ctx.fillRect(0, 196, MQ.W, 3);
      ctx.fillStyle = 'rgba(245,166,35,0.06)';
      for (let i = 0; i < 5; i++) ctx.fillRect(20 + i * 64, 0, 10, MQ.H);

      const sh = this.anim.shake ? (Math.random() * 4 - 2) : 0;
      // enemigo (arriba derecha)
      if (this.enemy.hp > 0 || this.phase === 'msg') {
        MQ.drawMon(ctx, this.enemy.id, MQ.W - 84 + sh, 28, 4);
      }
      // mío (abajo izquierda, volteado)
      if (this.mine.hp > 0) MQ.drawMon(ctx, this.mine.id, 18 - sh, 130, 4, true);

      ctx.font = MQ.FONT_B; ctx.textBaseline = 'top';
      // panel enemigo
      MQ.panel(ctx, 6, 8, 150, 34);
      ctx.fillStyle = '#e8dfc8';
      ctx.fillText(name(this.enemy) + '  N' + this.enemy.lvl, 14, 15);
      this.hpBar(ctx, 14, 28, 120, this.enemy);
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
