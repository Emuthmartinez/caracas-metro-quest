// Metro Quest — arranque, historia, guardado y pantalla final.
(() => {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  const SAVE_KEY = 'metroquest_caracas_v1';

  MQ.FICHAS = {
    ficha1: 'FICHA DEL CENTRO',
    ficha2: 'FICHA DE LA FUENTE',
    ficha3: 'FICHA DEL ESTE',
    ficha4: 'FICHA DEL PUEBLO',
  };

  // ---- estado del jugador ------------------------------------------------------
  MQ.newPlayer = (name, look) => ({
    name: name || 'Chamo', look: look || 'player',
    map: 'casa', x: 5, y: 5, dir: 'down',
    party: [], locker: [],
    bag: {}, money: 250,
    flags: {}, dexSeen: {}, dexCaught: {},
    visited: {},
    respawn: { map: 'casa', x: 5, y: 5 },
  });

  MQ.setFlag = (f) => {
    MQ.player.flags[f] = true;
    if (['ficha1', 'ficha2', 'ficha3', 'ficha4'].every((k) => MQ.player.flags[k]))
      MQ.player.flags.fichas4 = true;
  };

  MQ.save = (silent) => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(MQ.player)); } catch (e) {}
  };
  MQ.loadSave = () => {
    try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; }
  };

  MQ.respawn = (world) => {
    const p = MQ.player;
    p.money = Math.floor(p.money / 2);
    p.party.forEach(MQ.fullHeal);
    p.x = p.respawn.x; p.y = p.respawn.y;
    world.enterMap(p.respawn.map);
    world.tb.open(MQ.ctx, 'Te fuiste en blanco... El Doctorcito te recogió del andén, te sanó el equipo y te cobró la mitad de los bolos "por concepto de susto".');
  };

  // ---- guiones de historia --------------------------------------------------------
  const starterScript = (id, abuelaLine) => () => {
    if (MQ.player.flags.starter) return [
      { say: ['Abuela', `${MQ.SPECIES[id].name} se queda acompañándome a mí, mijo. Uno no anda recogiendo compañeros como quien recoge mangos.`] },
    ];
    return [
    { say: ['Abuela', abuelaLine] },
    { choice: { title: `¿Llevarte a ${MQ.SPECIES[id].name}?`, options: [
      { label: '¡Sí, de una!', script: [
        { mon: [id, 5] },
        { flag: 'starter' },
        { fn: () => MQ.setFlag('took_' + id) }, // se baja de la mesa: ahora viaja contigo
        { give: { item: 'ficha', n: 5 } },
        { give: { item: 'malta', n: 3 } },
        { sfx: 'catch' },
        { fn: () => MQ.audio.cry(id) },
        { say: ['', `¡${MQ.SPECIES[id].name} se baja de la mesa y se une a tu equipo!`] },
        { say: ['Abuela', 'Toma: CINCO FICHAS del 83 y unas malticas. Si un espanto salvaje te acepta la ficha, te acompaña pa\' siempre. Eso es FICHAR, como decía tu abuelo.'] },
        { say: ['Abuela', 'Y oye bien: a los espantos no se les grita. Se les canta, se les cocina o se les aguanta el carácter. Como a la familia.'] },
        { say: ['Abuela', 'Los Jefes de Estación guardan cuatro FICHAS DORADAS. Con las cuatro te abren la Línea Fantasma... donde está penando el Tren. Anda. Caracas te necesita despierto.'] },
        { fn: () => MQ.save(true) },
      ] },
      { label: 'Mejor lo pienso' },
    ] } },
  ]; };

  MQ.SCRIPTS = {
    intro: () => [
      { say: ['', 'Caracas. El Metro abrió en 1983: «La Gran Solución». Pero las tuneladoras pasaron por donde no debían: por debajo de la memoria de la ciudad.'] },
      { say: ['', 'Desde entonces, cuando pasa el último tren, empieza la HORA FANTASMA: la fauna de toda Venezuela baja a los túneles a calentarse junto a los rieles.'] },
      { say: ['', 'Chigüires que cruzaron desde el llano por los sueños de la gente. Toninas que nadan por el aire. Osos que bajan del Ávila a pedir la hora. En Caracas a nadie le parece raro: se les da el asiento y ya.'] },
      { say: ['', 'Esta noche, dicen, vuelve a rodar el TREN FANTASMA... y cada vez que pasa, la ciudad amanece con menos recuerdos. Y la diáspora, con menos sueños.'] },
      { say: ['Abuela', '¡Mijito! Ven acá antes de salir. Asómate a la mesa: tengo tres criaturitas esperando por ti. Háblales, que no muerden... bueno, casi.'] },
    ],

    'starter:frontinito': starterScript('frontinito', '¿El Frontinito? Bajó del Ávila una noche de neblina y se quedó porque aquí el café huele mejor. Nació con los anteojos puestos: ve clarito quién tiene buen corazón. Por eso te está mirando así.'),
    'starter:turpialin': starterScript('turpialin', '¿El Turpialín? Ese pajarito cantó el día que tú naciste, te lo juro por esta luz. Tiene la rumba por dentro.'),
    'starter:cocuyin': starterScript('cocuyin', '¿El Cocuyín? Sabia decisión, mijo: en este país, el que alumbra cuando se va la luz... ese manda.'),

    abuela: () => {
      const f = MQ.player.flags;
      if (!f.starter) return [
        { say: ['Abuela', 'En esa mesa hay tres compañeros: el Frontinito te carga y te abraza como montaña, el Turpialín canta y pelea, y el Cocuyín alumbra hasta en apagón. Escoge con calma.'] },
      ];
      if (f.tren) return [
        { say: ['Abuela', 'Ay, mi amor... La ciudad amaneció distinta. Me llamó tu primo llorando: soñó con el pan de jamón de la bisabuela, después de años sin soñar en venezolano.'] },
        { say: ['Abuela', 'Eso fuiste tú. Yo lo sé. Ven acá, deja que te abrace... y después te calientes una arepita, que los héroes también desayunan.'] },
        { healParty: true },
      ];
      if (f.fichas4) return [
        { say: ['Abuela', 'Cuatro fichas doradas... igualito a tu abuelo, que se ganó esta ciudad a punta de constancia. La Línea 5 te espera en Plaza Venezuela.'] },
        { say: ['Abuela', 'Llévate suéter, que allá abajo hace un frío de páramo. Y dale mis saludos a la Reina, si te la encuentras. Ella sabe quién soy.'] },
        { say: ['Abuela', 'Un consejo de vieja: si el Tren te parece mucho tren, acuérdate que la piedra del tepuy es más vieja que el olvido. Lo viejo respeta a lo más viejo.'] },
        { healParty: true },
        { say: ['', 'La abuela te sanó el equipo con caldo de gallina y bendiciones.'] },
      ];
      return [
        { say: ['Abuela', MQ.pick([
          'Tu primo Cheo llegó anoche de allá. Está flaco: allá no hay quien lo regañe. Lo consigues por Capitolio, seguro comiéndose la ciudad con los ojos.',
          '¿Comiste? Había golfeados en la nevera... bueno, HABÍA. Vino tu primo. Cinco años afuera y lo primero que hizo fue saquearme la nevera. Así se quiere.',
          'Las fichas del 83 las guardé toda la vida. Decían que ya no servían. Nada que guarda una abuela deja de servir, mijo.',
        ])] },
        { healParty: true },
        { say: ['', 'La abuela te sanó el equipo. El cariño cura, eso es ciencia.'] },
      ];
    },

    heal: () => [
      { say: ['El Doctorcito', 'A ver, mis criaturas, vengan acá...'] },
      { healParty: true },
      { fn: (w) => { const p = MQ.player; p.respawn = { map: p.map, x: p.x, y: p.y }; } },
      { say: ['El Doctorcito', 'Listo: sanitos y bendecidos. Que me los cuiden, que ellos también son Caracas. Vuelve cuando quieras, hijo.'] },
    ],

    rival1: () => {
      const c = MQ.cheoCounter(firstStarter());
      return [
        { say: ['Cheo', '¡PRIMO! ¡Mírate! La abuela me dijo que andabas fichando espantos por los túneles. ¡Cinco años sin verte, chamo!'] },
        { say: ['Cheo', 'Llegué anoche de allá. En el taxi del aeropuerto sonó una gaita y casi lloro en plena autopista. No le digas a nadie.'] },
        { say: ['Cheo', 'Mira lo que me acompañó en la maleta todos estos años. ¡Vamos a ver quién quiere más a esta ciudad!'] },
        { battle: { trainer: { id: 'rival1', cls: 'Tu primo', name: 'Cheo', money: 300,
          team: [[c, 9], ['bachaquito', 8]],
          intro: '¡Sin llorar, que esto es de cariño!',
          win: '¡Sigues siendo el mismo carajito arrecho! Me alegra. Hay cosas que ni la distancia.',
          lose: 'Te falta calle, primo... y a mí me sobraba nostalgia. ¡Entrena!' } },
          winScript: [
            { flag: 'rival1' },
            { say: ['Cheo', 'Voy a comer tequeños hasta que me duela el alma y después te alcanzo por el este. ¡Dale duro a los Jefes de Estación, primo!'] },
          ] },
      ];
    },

    rival2: () => {
      const c = MQ.cheoCounterEvo(firstStarter());
      return [
        { say: ['Cheo', '¿Sabes qué extrañaba? El RUIDO. Allá todo suena a biblioteca. Aquí hasta el silencio tiene cuatro y maracas.'] },
        { say: ['Cheo', 'He estado entrenando yo también... en el gimnasio del edificio, que tiene wifi. ¡No te rías! ¡Pelea!'] },
        { battle: { trainer: { id: 'rival2', cls: 'Tu primo', name: 'Cheo', money: 600,
          team: [['pavoso', 18], [c, 19]],
          intro: '¡Esta vez vengo con la pava de mi lado!',
          win: 'Está bien, está bien... admito que la ciudad te entrenó mejor que el wifi.',
          lose: '¿Viste? ¡El gimnasio del edificio SÍ sirve!' } },
          winScript: [
            { flag: 'rival2' },
            { say: ['Cheo', 'Oye... en serio: dicen que el Tren Fantasma se lleva los recuerdos de la ciudad. Si eso es verdad, defiéndelos, primo. Los míos también viajan ahí.'] },
          ] },
      ];
    },

    rival3: () => {
      const c = MQ.cheoCounterEvo(firstStarter());
      return [
        { say: ['Cheo', 'Sabía que llegarías hasta aquí. Cuatro Fichas Doradas... Llamé a la abuela esta mañana: está que no le cabe el orgullo en la bata.'] },
        { say: ['Cheo', 'Allá afuera uno aprende a querer esto con una rabia dulce, primo. Uno arma la arepa con harina de allá y se le aguan los ojos con un vals de acá.'] },
        { say: ['Cheo', 'Si el Tren se lleva los recuerdos... ¿con qué sueño yo allá? Demuéstrame que los vas a cuidar bien. ¡ÚLTIMA PELEA, A TODO O NADA!'] },
        { battle: { trainer: { id: 'rival3', cls: 'Tu primo', name: 'Cheo', money: 1500,
          team: [['guacamayo', 30], ['vagonima', 31], [c, 33]],
          intro: '¡Por los que se fueron y por los que se quedaron!',
          win: 'Ahí está... Eso era lo que necesitaba ver. Ve tranquilo, primo.',
          lose: 'La nostalgia pega duro, ¿viste? Recupérate y vuelve.' } },
          winScript: [
            { flag: 'rival3' },
            { healParty: true },
            { give: { item: 'golfeado', n: 3 } },
            { say: ['Cheo', 'Toma: te curé el equipo y te metí tres golfeados en la mochila. Y cuando veas al Tren... no le tengas miedo. Todo lo olvidado también es de la familia.'] },
          ] },
      ];
    },

    altar: () => {
      if (MQ.player.flags.fichaoro) return [
        { say: ['La Reina', 'Ya llevas mi bendición, caminante. El fondo del túnel te espera. Ve sin miedo: el miedo no paga pasaje aquí.'] },
        { healParty: true },
      ];
      return [
        { say: ['', 'Las velas se encienden solas. Un perfume de montaña llena el túnel: flores, tabaco dulce, agua de río.'] },
        { sfx: 'heal' },
        { say: ['La Reina', 'Yo soy María de la Onza, Reina de Sorte, de las aguas y de los montes. Sé por qué vienes: vienes por lo que la ciudad olvidó.'] },
        { say: ['La Reina', 'El Tren no es tu enemigo, muchacho. Es el guardián de lo que dejaron atrás los que se fueron. Pero ya no puede solo: son demasiados recuerdos para un solo tren.'] },
        { say: ['La Reina', 'Llévale esta FICHA DE ORO, bendecida en mi montaña. Si te acepta, los recuerdos volverán a circular: de ida y de vuelta, como debe ser.'] },
        { give: { item: 'fichaoro', n: 1 } },
        { flag: 'fichaoro' },
        { healParty: true },
        { say: ['', '★ Obtienes la FICHA DE ORO y tu equipo fue bendecido por la Reina. ★'] },
        { fn: () => MQ.save(true) },
      ];
    },

    trenfantasma: () => {
      if (MQ.player.flags.tren) return [
        { say: ['', 'El túnel respira tranquilo. A lo lejos se oye al Tren, repartiendo recuerdos estación por estación, como un cartero viejo.'] },
      ];
      return [
        { sfx: 'whistle' },
        { say: ['', 'Un silbido de tren llena la Línea Fantasma... Las luces de emergencia parpadean dos veces. El aire huele a 1983.'] },
        { say: ['', 'Del fondo del túnel emergen dos faros amarillos. Es ÉL: el primer tren, el que nunca llegó a Palo Verde, el que la ciudad olvidó sin querer.'] },
        { say: ['', 'Sus vagones van llenos hasta el techo: cumpleaños con bala fría, despedidas en Maiquetía, tardes de Ávila, goles gritados en cocinas ajenas.'] },
        { battle: { wild: { id: 'trenfantasma', lvl: 38 }, noFlee: true },
          winScript: [
            { flag: 'tren' },
            { fn: () => MQ.save(true) },
            { ending: true },
          ] },
      ];
    },
  };

  const firstStarter = () => {
    for (const id of ['frontinito', 'ucumari']) if (hasLine(id)) return 'frontinito';
    for (const id of ['turpialin', 'cantaclaro']) if (hasLine(id)) return 'turpialin';
    return 'cocuyin';
  };
  const hasLine = (id) => MQ.player.party.concat(MQ.player.locker).some((m) => m.id === id) || MQ.player.dexCaught[id];

  // ---- escenas: pila --------------------------------------------------------------
  MQ.scenes = [];
  MQ.pushScene = (s) => MQ.scenes.push(s);
  MQ.popScene = () => MQ.scenes.pop();
  const top = () => MQ.scenes[MQ.scenes.length - 1];

  // ---- intro cinematográfica (saltable, estilo apertura de los clásicos) -----------
  class IntroScene {
    constructor() {
      this.done = false;
      this.hint = 0;
      const v = (this.v = document.createElement('video'));
      v.muted = true; v.playsInline = true; v.preload = 'auto';
      for (const [src, type] of [['assets/intro.webm', 'video/webm'], ['assets/intro.mp4', 'video/mp4']]) {
        const s = document.createElement('source');
        s.src = src; s.type = type;
        v.appendChild(s);
      }
      v.oncanplay = () => v.play().catch(() => this.skip());
      v.onended = () => this.skip();
      v.onerror = () => this.skip();
      v.load();
      // si el video no carga (sin red, navegador viejo), directo al título
      this.timeout = setTimeout(() => { if (v.readyState < 2) this.skip(); }, 5000);
    }
    skip() {
      if (this.done) return;
      this.done = true;
      clearTimeout(this.timeout);
      try { this.v.pause(); } catch (e) {}
      MQ.popScene();
      MQ.pushScene(new TitleScene());
    }
    press(k) {
      if (k === 'a' && this.v.muted && !this.v.ended) { this.v.muted = false; return; } // primer A: sonido
      this.skip();
    }
    update() { this.hint++; }
    draw(ctx) {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, MQ.W, MQ.H);
      if (this.v.readyState >= 2 && this.v.videoWidth) {
        const s = Math.min(MQ.W / this.v.videoWidth, MQ.H / this.v.videoHeight);
        const w = this.v.videoWidth * s, h = this.v.videoHeight * s;
        try { ctx.drawImage(this.v, (MQ.W - w) / 2, (MQ.H - h) / 2, w, h); } catch (e) {}
      }
      if ((this.hint / 40 | 0) % 2) {
        ctx.font = MQ.FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillStyle = 'rgba(232,223,200,0.8)';
        ctx.fillText(this.v.muted ? 'A: sonido · B: saltar' : 'B: saltar', MQ.W / 2, MQ.H - 14);
        ctx.textAlign = 'left';
      }
    }
  }

  // ---- título -----------------------------------------------------------------------
  class TitleScene {
    constructor() { this.mode = 'splash'; this.menu = null; this.t = 0; MQ.audio.music('title'); }
    press(k) {
      if (this.mode === 'splash' && (k === 'a' || k === 'start')) {
        MQ.audio.sfx('sel');
        const save = MQ.loadSave();
        const items = [];
        if (save) items.push({ label: 'CONTINUAR', value: 'cont' });
        items.push({ label: 'NUEVA PARTIDA', value: 'new' });
        this.mode = 'menu';
        this.menu = new MQ.Menu(items, { x: MQ.W / 2 - 70, y: 190, w: 140, rows: 3,
          onPick: (it) => {
            if (it.value === 'cont') { MQ.player = MQ.loadSave(); startWorld(false); }
            else this.chooseLook();
          },
          onCancel: () => {} });
      } else if (this.menu) this.menu.press(k);
    }
    chooseLook() {
      this.menu = new MQ.Menu([
        { label: 'CHAMO', value: 'player' },
        { label: 'CHAMA', value: 'playera' },
      ], { x: MQ.W / 2 - 70, y: 190, w: 140, rows: 2, title: '¿Quién eres?',
        onPick: (it) => {
          let name = '';
          try { name = (prompt('¿Cómo te dice tu abuela? (tu nombre)', '') || '').trim().slice(0, 10); } catch (e) {}
          MQ.player = MQ.newPlayer(name || (it.value === 'playera' ? 'Chama' : 'Chamo'), it.value);
          startWorld(true);
        },
        onCancel: () => {} });
    }
    update() { this.t++; }
    draw(ctx) {
      // cielo nocturno y Ávila
      const g = ctx.createLinearGradient(0, 0, 0, MQ.H);
      g.addColorStop(0, '#0b0b1f'); g.addColorStop(0.6, '#1c1430'); g.addColorStop(1, '#2a1838');
      ctx.fillStyle = g; ctx.fillRect(0, 0, MQ.W, MQ.H);
      // estrellas
      for (let i = 0; i < 40; i++) {
        const sx = (i * 53) % MQ.W, sy = (i * 31) % 110;
        ctx.fillStyle = (i + (this.t / 30 | 0)) % 7 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)';
        ctx.fillRect(sx, sy, 1, 1);
      }
      // el Ávila
      ctx.fillStyle = '#16241c';
      ctx.beginPath();
      ctx.moveTo(0, 150);
      ctx.lineTo(60, 100); ctx.lineTo(110, 125); ctx.lineTo(180, 85); ctx.lineTo(240, 120); ctx.lineTo(320, 95);
      ctx.lineTo(MQ.W, 150); ctx.closePath(); ctx.fill();
      // skyline
      ctx.fillStyle = '#0e0e1a';
      const bld = [14, 30, 22, 44, 18, 36, 26, 50, 20, 34, 16, 42];
      let bx = 0;
      bld.forEach((h) => { ctx.fillRect(bx, 168 - h, 24, h); bx += 27; });
      ctx.fillStyle = '#f5d76e';
      for (let i = 0; i < 30; i++) ctx.fillRect((i * 37) % MQ.W + 4, 130 + (i * 13) % 34, 2, 2);
      // suelo / vía
      ctx.fillStyle = '#14101e'; ctx.fillRect(0, 168, MQ.W, MQ.H - 168);
      ctx.fillStyle = '#3a3242'; ctx.fillRect(0, 176, MQ.W, 2); ctx.fillRect(0, 184, MQ.W, 2);
      // tren pasando
      const tx = (this.t * 1.5) % (MQ.W + 200) - 100;
      MQ.drawTrain(ctx, tx, 164, 90);
      ctx.fillStyle = 'rgba(255,230,110,0.5)'; ctx.fillRect(tx + 88, 170, 10, 4);

      ctx.textBaseline = 'top'; ctx.textAlign = 'center';
      ctx.font = 'bold 26px ui-monospace, Menlo, Consolas, monospace';
      ctx.fillStyle = '#1a1a1a'; ctx.fillText('METRO QUEST', MQ.W / 2 + 2, 34);
      ctx.fillStyle = '#f5a623'; ctx.fillText('METRO QUEST', MQ.W / 2, 32);
      ctx.font = MQ.FONT_B;
      ctx.fillStyle = '#e8dfc8';
      ctx.fillText('· Leyendas del Subterráneo de Caracas ·', MQ.W / 2, 62);
      ctx.fillStyle = '#8a8aa0';
      ctx.fillText('Un regalo para la diáspora', MQ.W / 2, 74);
      if (this.mode === 'splash' && (this.t / 30 | 0) % 2) {
        ctx.fillStyle = '#f5d76e';
        ctx.fillText('— PRESIONA A —', MQ.W / 2, 215);
      }
      ctx.fillStyle = '#5a5a72';
      ctx.font = MQ.FONT;
      ctx.fillText('La Gran Solución para Caracas · 1983', MQ.W / 2, MQ.H - 14);
      ctx.textAlign = 'left';
      if (this.menu) this.menu.draw(ctx);
    }
  }

  // ---- final ---------------------------------------------------------------------------
  class EndScene {
    constructor() {
      this.i = 0; this.t = 0;
      MQ.setFlag('ending'); // libera al Catatumbo en la Línea Fantasma
      MQ.audio.music('gaita');
      this.pages = [
        'El Tren Fantasma se detiene por primera vez en cuarenta años.\n\nLas puertas se abren con un suspiro de 1983.',
        'Y los recuerdos salen volando túnel arriba:\n\nolor a pan de jamón, la voz del abuelo, el Ávila en diciembre, la cancha del barrio, el último abrazo en Maiquetía.',
        'Esta noche, en Madrid y en Santiago, en Miami y en Buenos Aires, en Bogotá y en Lisboa...\n\nmiles de personas levantan la cabeza al mismo tiempo, sin saber por qué.\n\nY sonríen.',
        'La Reina sonríe también, desde su montaña.\n\n«Los recuerdos ya circulan de ida y de vuelta», dice. «Como debe ser.»',
      ];
    }
    press(k) {
      if (k === 'a' || k === 'start') {
        MQ.audio.sfx('sel');
        this.i++;
        if (this.i > this.pages.length) {
          MQ.popScene();
          MQ.save(true);
          const w = top();
          if (w && w.tb) w.tb.open(MQ.ctx, 'POSDATA: dicen que con el alboroto, el mismísimo CATATUMBO bajó a curiosear por la Línea Fantasma. Brilla entre las sombras... por si te atreves.');
        }
      }
    }
    update() { this.t++; }
    draw(ctx) {
      ctx.fillStyle = '#06040c'; ctx.fillRect(0, 0, MQ.W, MQ.H);
      ctx.textBaseline = 'top';
      if (this.i < this.pages.length) {
        ctx.font = MQ.FONT;
        ctx.fillStyle = '#e8dfc8';
        const lines = MQ.wrap(ctx, this.pages[this.i], MQ.W - 60);
        lines.forEach((l, j) => {
          ctx.textAlign = 'center';
          ctx.fillText(l, MQ.W / 2, 80 + j * 14);
        });
        if ((this.t / 30 | 0) % 2) { ctx.fillStyle = '#f5a623'; ctx.fillText('▼', MQ.W / 2, MQ.H - 30); }
        ctx.textAlign = 'left';
      } else {
        // dedicatoria
        ctx.textAlign = 'center';
        ctx.font = MQ.FONT_B;
        ctx.fillStyle = '#f5a623';
        ctx.fillText('★  F I N  ★', MQ.W / 2, 50);
        ctx.fillStyle = '#e8dfc8';
        ctx.fillText('Para los que se fueron', MQ.W / 2, 90);
        ctx.fillText('y para los que se quedaron.', MQ.W / 2, 104);
        ctx.fillStyle = '#f5d76e';
        ctx.fillText('Caracas no se olvida:', MQ.W / 2, 130);
        ctx.fillText('Caracas se lleva.', MQ.W / 2, 144);
        // desfile de espantos
        const ids = ['frontinito', 'turpialin', 'cocuyin', 'chigui', 'tonina', 'cunaguaro'];
        ids.forEach((id, i) => MQ.drawMon(ctx, id, 30 + i * 45 + Math.sin(this.t / 20 + i) * 3, 180 + Math.cos(this.t / 25 + i) * 4, 2));
        ctx.fillStyle = '#8a8aa0';
        ctx.font = MQ.FONT;
        ctx.fillText('(A para seguir jugando: el Metro nunca cierra)', MQ.W / 2, MQ.H - 30);
        ctx.textAlign = 'left';
      }
    }
  }

  MQ.startEnding = () => MQ.pushScene(new EndScene());

  // ---- arranque ----------------------------------------------------------------------
  function startWorld(isNew) {
    MQ.scenes.length = 0;
    const w = new MQ.WorldScene();
    MQ.pushScene(w);
    if (isNew) w.runScript(MQ.SCRIPTS.intro());
  }

  addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game');
    MQ.ctx = canvas.getContext('2d');
    MQ.ctx.imageSmoothingEnabled = false;
    // look femenino: vinotinto, sin gorra
    MQ.LOOKS.player.shirt = '#7a1f3d';
    MQ.LOOKS.playera = { skin: '#b87a4a', shirt: '#7a1f3d', pants: '#33334a', hair: '#26100a', bag: '#5e8b3f' };

    MQ.pushScene(new IntroScene());
    const loop = () => {
      const s = top();
      if (s) {
        let k;
        while ((k = MQ.input.next())) s.press(k);
        s.update && s.update();
        s.draw(MQ.ctx);
      }
      requestAnimationFrame(loop);
    };
    loop();
  });
})();
