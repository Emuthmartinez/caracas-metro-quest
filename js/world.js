// Metro Quest — el mundo: Línea 1 del Metro de Caracas, sus túneles y su gente.
(() => {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  const rep = (c, n) => c.repeat(n);

  // ---- Constructores de mapas -------------------------------------------------
  // Estación estándar: vía arriba, andén, módulo de atención (H), buhonero (S).
  function station(o) {
    const w = o.w || 26, h = 11;
    const g = [];
    g[0] = rep('#', w);
    g[1] = '#' + rep('T', w - 2) + '#';
    g[2] = '#' + rep('M', w - 2) + '#';
    for (let y = 3; y <= 9; y++) {
      let r = '';
      for (let x = 0; x < w; x++) {
        if (x === 0 || x === w - 1) r += '#';
        else if (y === 4 && x >= 4 && (x - 4) % 6 === 0 && x < w - 3) r += 'P';
        else if (y === 6 && x === 3) r += 'H';
        else if (y === 6 && o.shop && x === w - 5) r += 'S';
        else if (y === 8 && (x === 8 || x === 9)) r += 'B';
        else if (y === 8 && x === w - 9) r += 'k';
        else r += (x * 7 + y * 13) % 11 === 0 ? ',' : '.';
      }
      g[y] = r;
    }
    g[10] = rep('#', w);
    const set = (x, y, ch) => { g[y] = g[y].slice(0, x) + ch + g[y].slice(x + 1); };
    const warps = [];
    if (o.west) { set(0, 5, 'D'); warps.push({ x: 0, y: 5, ...o.west }); }
    if (o.east) { set(w - 1, 5, 'D'); warps.push({ x: w - 1, y: 5, ...o.east }); }
    for (const s of o.streets || []) { set(s.x, 10, 'D'); warps.push({ x: s.x, y: 10, ...s }); }
    return {
      id: o.id, name: o.name, theme: 'metro', music: o.music || 'town', station: true,
      grid: g, warps, npcs: o.npcs || [], triggers: o.triggers || [],
      enc: null, shopStock: o.shopStock, healSpot: { x: 3, y: 7 },
    };
  }

  // Túnel: vía arriba, pasarela de mantenimiento con zonas oscuras (~).
  function tunnel(o) {
    const w = o.w || 30;
    const g = [];
    g[0] = rep('#', w);
    g[1] = rep('T', w);
    for (let y = 2; y <= 7; y++) {
      let r = '';
      for (let x = 0; x < w; x++) {
        if (x === 0 || x === w - 1) r += '#';
        else if (y >= 3 && y <= 6 && ((x * 13 + y * 31) % 17 === 0)) r += 'P';
        else if (y >= 3 && y <= 6 && Math.sin(x * 0.55 + y * 1.7 + (o.seed || 0)) > 0.05) r += '~';
        else r += '.';
      }
      g[y] = r;
    }
    g[8] = rep('#', w);
    const set = (x, y, ch) => { g[y] = g[y].slice(0, x) + ch + g[y].slice(x + 1); };
    set(0, 4, 'D'); set(w - 1, 4, 'D');
    // garantiza pasarela continua
    g[2] = '#' + g[2].slice(1, w - 1).replace(/[P]/g, '.') + '#';
    set(1, 4, '.'); set(w - 2, 4, '.');
    return {
      id: o.id, name: o.name, theme: o.theme || 'tunel', music: o.music || 'tunnel',
      grid: g, npcs: o.npcs || [], triggers: o.triggers || [],
      warps: [{ x: 0, y: 4, ...o.west }, { x: w - 1, y: 4, ...o.east }],
      enc: o.enc || null,
    };
  }

  const heal3 = ['malta', 'cafe'];

  // ---- Diálogo del primo (depende de tu inicial) -------------------------------
  MQ.cheoCounter = (starter) =>
    ({ frontinito: 'caribito', turpialin: 'cocuyin', cocuyin: 'cachicamo' }[starter] || 'caribito');
  MQ.cheoCounterEvo = (starter) =>
    ({ frontinito: 'caribazo', turpialin: 'centella', cocuyin: 'chiguiron' }[starter] || 'caribazo');

  // ---- Mapas --------------------------------------------------------------------
  const MAPS = {};

  // — Casa de la Abuela (Propatria, bloque 7) —
  MAPS.casa = {
    id: 'casa', name: 'Casa de la Abuela', theme: 'casa', music: 'town',
    grid: [
      '############',
      '#k........B#',
      '#..........#',
      '#..mmmmmm..#',
      '#..........#',
      '#..........#',
      '#..........#',
      '#####D######',
    ],
    warps: [{ x: 5, y: 7, to: 'propatria', tx: 13, ty: 3, requires: 'starter',
      denied: 'ABUELA: ¿Vas a salir solo a la hora fantasma? ¡Ni de vaina! Escoge primero un compañero de la mesa.' }],
    npcs: [
      { x: 4, y: 3, mon: 'frontinito', script: 'starter:frontinito', hideIf: 'took_frontinito' },
      { x: 6, y: 3, mon: 'turpialin', script: 'starter:turpialin', hideIf: 'took_turpialin' },
      { x: 8, y: 3, mon: 'cocuyin', script: 'starter:cocuyin', hideIf: 'took_cocuyin' },
      { x: 2, y: 5, look: 'abuela', dir: 'right', name: 'Abuela', script: 'abuela' },
    ],
    triggers: [], enc: null,
  };

  // — PROPATRIA —
  MAPS.propatria = station({
    id: 'propatria', name: 'Estación Propatria', shop: true,
    east: { to: 'tunel1', tx: 1, ty: 4 },
    streets: [{ x: 13, to: 'casa', tx: 5, ty: 6 }],
    shopStock: ['ficha', 'malta'],
    npcs: [
      { x: 6, y: 5, look: 'operador', dir: 'down', name: 'Operador Nelson',
        text: ['Deje salir antes de entrar. Es ley del Metro y de la vida, ciudadano.',
               '¿Quiere tomar el tren? Suba a la FRANJA del borde del andén, mire hacia la vía y él lo siente. El tren para en las estaciones que usted ya conoce.',
               'Después del último tren empieza la hora fantasma. Lo que camine por ahí... ya no es pasajero.'] },
      { x: 16, y: 7, look: 'senora', dir: 'left', name: 'Doña Iraida',
        text: ['Llevo harina, llevo queso, llevo cariño. Lo que no llevo es apuro, mijo.',
               'Mi hijo está en Chile y mi hija en Madrid. Yo les cuido los espantos hasta que vuelvan. Todos los días les hablo.'] },
      { x: 11, y: 9, look: 'chamo', dir: 'up', name: 'Yorbi',
        text: ['¿Viste? Cuando las luces parpadean dos veces, algo viene por el túnel. ¡El último que llegue al torniquete apaga la luz!',
               'En la zona oscura del túnel sale la fauna de la hora fantasma. Lánzale una ficha del 83: si te acepta, te acompaña. Eso es FICHAR.',
               'Hay un rabipelado que se hace el muerto en plena vía. El tren lo esquiva por respeto: ya lo veló una familia entera y eso impone.'] },
      { x: 20, y: 3, look: 'obrero', dir: 'down', name: 'Maestro Argenis',
        text: ['Yo ayudé a excavar esto en el 79. Pasamos la tuneladora por debajo de la memoria de la ciudad. Por eso es que pasan cosas.'] },
    ],
  });

  // — Túnel 1: Propatria → Caño Amarillo —
  MAPS.tunel1 = tunnel({
    id: 'tunel1', name: 'Túnel: Propatria — Caño Amarillo', seed: 1,
    west: { to: 'propatria', tx: 24, ty: 5 },
    east: { to: 'canoamarillo', tx: 1, ty: 5 },
    enc: { rate: 0.16, mons: [['rabipelado', 28, 2, 4], ['bachaquito', 25, 2, 4], ['caribito', 25, 2, 4], ['duendecito', 12, 3, 5], ['pavoso', 10, 3, 5]] },
    npcs: [
      { x: 14, y: 2, look: 'obrero', dir: 'down', name: 'Obrero Ramón',
        trainer: { id: 'ramon', cls: 'Obrero del Metro', team: [['cachicamo', 5]], money: 80,
          intro: '¡Epa chamo! En este turno no pasa nadie sin echar una mano... o un combate.',
          win: 'Recio el muchacho. Sigue así y llegas a Palo Verde.',
          lose: 'El que sabe, sabe. A seguir picando piedra.' } },
    ],
  });

  // — CAÑO AMARILLO —
  MAPS.canoamarillo = station({
    id: 'canoamarillo', name: 'Estación Caño Amarillo', shop: false,
    west: { to: 'tunel1', tx: 28, ty: 4 },
    east: { to: 'tunel2', tx: 1, ty: 4 },
    streets: [{ x: 7, to: 'calvario', tx: 8, ty: 9 }],
    npcs: [
      { x: 10, y: 5, look: 'vieja', dir: 'down', name: 'Señora Coromoto',
        text: ['Por esa salida está El Calvario, con sus escalinatas y su monte. Ahí los espantos toman sol, como la gente decente.',
               '¿Será que llueve? Está cayendo un palo de agua allá arriba... aquí abajo ni nos enteramos.'] },
      { x: 18, y: 8, look: 'musico', dir: 'left', name: 'Cuatrista Eladio',
        text: ['Afino mi cuatro con el zumbido del tercer riel. Sol, re, la, mi... y lo que sea que cante el túnel.'] },
    ],
  });

  // — El Calvario (parque, monte) —
  MAPS.calvario = {
    id: 'calvario', name: 'Paseo El Calvario', theme: 'calle', music: 'town',
    grid: [
      '################',
      '#tt.gggg..ggg.t#',
      '#t..gggg..gggg.#',
      '#..ggggg...ggg.#',
      '#.....g....gg..#',
      '#.ggg.....t....#',
      '#.ggg..W.......#',
      '#.gg..WWW..ggg.#',
      '#......W...ggg.#',
      '#t.............#',
      '########D#######',
    ],
    warps: [{ x: 8, y: 10, to: 'canoamarillo', tx: 7, ty: 9 }],
    enc: { rate: 0.18, mons: [['chigui', 28, 3, 5], ['bachaquito', 20, 3, 5], ['pereza', 14, 4, 6], ['guacamayo', 12, 4, 6], ['caribito', 12, 3, 5], ['morrocoy', 8, 4, 6], ['cunaguaro', 6, 4, 6]] },
    npcs: [
      { x: 12, y: 4, look: 'chamo', dir: 'left', name: 'Liceísta Andrés',
        trainer: { id: 'andres', cls: 'Liceísta', team: [['bachaquito', 4], ['caribito', 4]], money: 60,
          intro: '¡Mira! Me volé la última hora de clase pa\' entrenar. ¡Échale pichón pues!',
          win: 'Naguará... Bueno, peor fue el examen de física.',
          lose: '¡Chévere cambur! Mañana sí voy a clase. Quizás.' } },
      { x: 3, y: 9, look: 'vieja', dir: 'right', name: 'Jardinera Eulalia',
        text: ['Este parque lo abrieron en 1883. Los chigüires de la fuente son más viejos que mi abuela, y mi abuela conoció a Gómez.',
               'La pereza del árbol grande llegó en el 87 por un cable de luz y no se ha bajado. Yo le riego el árbol; ella me cuida las horas. Buen trato.',
               'De noche baja un cunaguaro a contar las palomas. No se come ninguna: dice que contar también es cazar, pero más elegante.'] },
    ],
    triggers: [],
  };

  // — Túnel 2: Caño Amarillo → Capitolio —
  MAPS.tunel2 = tunnel({
    id: 'tunel2', name: 'Túnel: Caño Amarillo — Capitolio', seed: 7,
    west: { to: 'canoamarillo', tx: 24, ty: 5 },
    east: { to: 'capitolio', tx: 1, ty: 5 },
    enc: { rate: 0.16, mons: [['duendecito', 25, 4, 7], ['rabipelado', 20, 4, 7], ['pavoso', 18, 4, 7], ['bachaquito', 17, 4, 6], ['mapanare', 12, 5, 7], ['cocuyin', 8, 5, 7]] },
    npcs: [
      { x: 18, y: 5, look: 'musico', dir: 'left', name: 'Coplero Florentino',
        trainer: { id: 'florentino', cls: 'Coplero', team: [['araguako', 7]], money: 100,
          intro: 'Yo le canté al Diablo una noche entera y amanecí invicto. ¿Tú aguantas un contrapunteo?',
          win: 'Zumba que zumba... ganaste tú, catire. El llano sabe perder con elegancia.',
          lose: '¡Y dele que dele! El que nace pa\' coplero, del cielo le caen los versos.' } },
    ],
  });

  // — CAPITOLIO —
  MAPS.capitolio = station({
    id: 'capitolio', name: 'Estación Capitolio', shop: true,
    west: { to: 'tunel2', tx: 28, ty: 4 },
    east: { to: 'tunel3', tx: 1, ty: 4, requires: 'ficha1',
      denied: 'OPERADOR JEFE: Pasando Capitolio la vaina se pone seria, chamo. Sin la Ficha del Centro no te puedo dejar pasar. Habla con la Doña: ella manda aquí.' },
    shopStock: ['ficha', 'malta', 'cafe'],
    npcs: [
      { x: 13, y: 7, look: 'barbara', dir: 'down', name: 'Doña Bárbara', boss: true,
        trainer: { id: 'boss1', cls: 'Jefa de Estación', boss: true, money: 600, reward: 'ficha1',
          team: [['pavoso', 10], ['mapanare', 11], ['sayona', 12]],
          intro: 'Yo soy la Doña. El llano me quedó chiquito, así que ahora administro el centro de Caracas y todo lo que pena debajo. ¿Quieres mi Ficha del Centro? Demuéstrame que no eres un espanto más.',
          win: 'Vaya... Tienes el ojo turbio de los que no se rinden. Toma la FICHA DEL CENTRO. La devoradora de hombres sabe reconocer a una criatura indomable.',
          lose: 'Las cosas, niño, se hacen bien o no se hacen. Vuelve cuando se te quite lo manso.' } },
      { x: 7, y: 5, look: 'senora', dir: 'down', name: 'Hermana Dolores',
        text: ['Aquí abajo prendo una velita por los que viajan y otra por los que se fueron lejos. Las dos alumbran igual.',
               'Al Doctorcito del módulo no le preguntes el nombre. Sombrero negro, bigote, manos tibias. Tú ya sabes quién es. Él cura por cariño.'] },
      { x: 19, y: 9, look: 'chamo', dir: 'up', name: 'Mensajero Wilfredo',
        text: ['La Doña usa puros espantos. Contra eso, ponle rumba: un buen joropo espanta hasta al miedo.'] },
      { x: 5, y: 5, look: 'rival', dir: 'left', name: 'Cheo', hideIf: 'rival1', script: 'rival1' },
    ],
    triggers: [
      { x: 1, y: 5, once: 'rival1', script: 'rival1' },
    ],
  });

  // — Túnel 3: Capitolio → Bellas Artes —
  MAPS.tunel3 = tunnel({
    id: 'tunel3', name: 'Túnel: Capitolio — Bellas Artes', seed: 13,
    west: { to: 'capitolio', tx: 24, ty: 5 },
    east: { to: 'bellasartes', tx: 1, ty: 5 },
    enc: { rate: 0.16, mons: [['pavoso', 25, 7, 10], ['duendecito', 25, 7, 10], ['mapanare', 22, 8, 10], ['cocuyin', 15, 8, 10], ['vagonima', 13, 9, 11]] },
    npcs: [
      { x: 15, y: 6, look: 'obrero', dir: 'right', name: 'Soldador Pancho',
        trainer: { id: 'pancho', cls: 'Soldador', team: [['cocuyin', 9], ['cachicamo', 9]], money: 110,
          intro: 'Mi cocuyo me alumbra la soldadura desde el apagón del 2019. ¡Mira cómo brilla!',
          win: 'Buen corrientazo el tuyo. Te ganaste el paso.',
          lose: '¡Luz, cámara y corriente, mi pana!' } },
    ],
  });

  // — BELLAS ARTES —
  MAPS.bellasartes = station({
    id: 'bellasartes', name: 'Estación Bellas Artes', shop: false,
    west: { to: 'tunel3', tx: 28, ty: 4 },
    east: { to: 'tunel4', tx: 1, ty: 4 },
    npcs: [
      { x: 9, y: 5, look: 'musico', dir: 'down', name: 'Poeta Aquilino',
        text: ['"Creo en los poderes creadores del pueblo", decía el maestro Aquiles. Yo creo también en los poderes creadores del que espera el tren sin perder la sonrisa.',
               'Arriba están los museos, el Ateneo, la esquina del chiste y la del lamento. Caracas entera es una galería, chamo.'] },
      { x: 17, y: 7, look: 'sifrina', dir: 'left', name: 'Galerista Mirtha',
        text: ['Le monté una exposición a un Duendecito: "Chancletas izquierdas de la Gran Caracas, 1958-2025". Un éxito. Robó media sala.'] },
      { x: 20, y: 5, look: 'chamo', dir: 'down', name: 'Estudiante Keiber',
        text: ['Un reventón de agua en el túnel 4 trajo caribitos del Guaire. Sobrevivieron AL GUAIRE, hermano. Respeta.',
               'Con el reventón también llegó una TONINA del Orinoco. Nada por el aire del túnel como si el río siguiera ahí. Nadie le ha avisado que no, y mejor así.'] },
    ],
  });

  // — Túnel 4: Bellas Artes → Plaza Venezuela —
  MAPS.tunel4 = tunnel({
    id: 'tunel4', name: 'Túnel: Bellas Artes — Plaza Venezuela', seed: 21,
    west: { to: 'bellasartes', tx: 24, ty: 5 },
    east: { to: 'plazavenezuela', tx: 1, ty: 5 },
    enc: { rate: 0.16, mons: [['cachicamo', 22, 9, 12], ['mapanare', 22, 9, 12], ['caribito', 22, 9, 12], ['duendecito', 14, 10, 12], ['tonina', 10, 10, 12], ['vagonima', 10, 10, 12]] },
    npcs: [
      { x: 17, y: 3, look: 'senora', dir: 'down', name: 'Señora Carmen',
        trainer: { id: 'carmen', cls: 'Señora del Mercado', team: [['chigui', 10], ['morrocoy', 10]], money: 130,
          intro: 'Vengo del Guaicaipuro con las bolsas llenas y el morrocoy alebrestado. ¡Quítate o combate!',
          win: 'Ay, mijo... ganaste. Toma pa\' que te compres una maltica.',
          lose: 'El morrocoy será lento, pero llega. Igualito que el aguinaldo.' } },
    ],
  });

  // — PLAZA VENEZUELA —
  MAPS.plazavenezuela = station({
    id: 'plazavenezuela', name: 'Estación Plaza Venezuela', shop: true,
    west: { to: 'tunel4', tx: 28, ty: 4 },
    east: { to: 'tunel5', tx: 1, ty: 4 },
    streets: [
      { x: 8, to: 'fuente', tx: 8, ty: 9 },
      { x: 17, to: 'zonarental', tx: 9, ty: 2, requires: 'fichas4',
        denied: 'GUARDIA DE LA LÍNEA FANTASMA: ¿Pa\' la Línea 5, chamo? Esa línea no existe... oficialmente. Tráeme las CUATRO Fichas Doradas y hablamos de lo que no existe.' },
    ],
    shopStock: ['ficha', 'fichaplus', 'malta', 'cafe', 'aguacoco', 'cocada'],
    npcs: [
      { x: 13, y: 5, look: 'rumbero', dir: 'down', name: 'El Rumbero Mayor', boss: true,
        trainer: { id: 'boss2', cls: 'Jefe de Estación', boss: true, money: 800, reward: 'ficha2',
          team: [['guacamayo', 17], ['araguako', 18], ['cantaclaro', 19]],
          intro: '¡Llegó el dueño del sabor! Cuando la fuente baila, yo dirijo la orquesta. ¿Ficha de la Fuente? Aquí los premios se bailan, mi hermano.',
          win: '¡TREMENDO! Tú tienes swing de Línea 1, ritmo de hora pico. Toma la FICHA DE LA FUENTE, te la ganaste con sabor.',
          lose: 'Te faltó cintura, chamo. ¡La vida es una rumba seria!' } },
      { x: 6, y: 8, look: 'chama', dir: 'right', name: 'Universitaria Yusneidi',
        text: ['De aquí salgo pa\' la UCV. La ciudad universitaria es Patrimonio de la Humanidad, ¿oíste? Nubes de Calder abajo, guacamayas arriba.',
               'Dicen que en la Línea Fantasma el tiempo no pasa. Como en la cola del Saime.'] },
      { x: 21, y: 7, look: 'guardia', dir: 'down', name: 'Guardia Ledezma',
        text: ['Yo cuido la reja de la Línea 5 desde 2008. La línea no existe, el cargo sí. Así es la vida del funcionario.'] },
    ],
  });

  // — Fuente de Plaza Venezuela (calle) —
  MAPS.fuente = {
    id: 'fuente', name: 'Plaza Venezuela — La Fuente', theme: 'calle', music: 'town',
    grid: [
      '################',
      '#t....t...t...t#',
      '#..............#',
      '#....WWWWWW....#',
      '#...WWWfWWWW...#',
      '#...WWWWWWWW...#',
      '#....WWWWWW....#',
      '#..............#',
      '#.t....t.....t.#',
      '#..............#',
      '########D#######',
    ],
    warps: [{ x: 8, y: 10, to: 'plazavenezuela', tx: 8, ty: 9 }],
    enc: null,
    npcs: [
      { x: 3, y: 7, look: 'chamo', dir: 'right', name: 'Fotógrafo Brayan',
        text: ['La fuente tiene 16 millones de combinaciones de colores. Mi abuelo la vio inaugurar; yo le mando fotos por el grupo de la familia. 200 emojis de respuesta.'] },
      { x: 12, y: 2, look: 'vieja', dir: 'down', name: 'Doña Auxiliadora',
        text: ['A medianoche el agua de la fuente se pone quietica quietica... y algo con plumas de relámpago viene a beber. Yo lo he visto. Yo no miento.'] },
    ],
    triggers: [],
  };

  // — Túnel 5: Plaza Venezuela → Sabana Grande —
  MAPS.tunel5 = tunnel({
    id: 'tunel5', name: 'Túnel: Plaza Venezuela — Sabana Grande', seed: 33,
    west: { to: 'plazavenezuela', tx: 24, ty: 5 },
    east: { to: 'sabanagrande', tx: 1, ty: 5 },
    enc: { rate: 0.17, mons: [['duendecito', 25, 12, 15], ['mapanare', 25, 12, 15], ['araguako', 20, 12, 15], ['pavoso', 15, 12, 15], ['vagonima', 10, 13, 15], ['sayona', 5, 14, 16]] },
    npcs: [
      { x: 19, y: 6, look: 'chama', dir: 'left', name: 'Tesista Oriana',
        trainer: { id: 'oriana', cls: 'Tesista', team: [['mapanare', 13], ['guacamayo', 13]], money: 150,
          intro: 'Mi tesis es sobre fauna espectral del subsuelo caraqueño. ¡Tú me sirves de capítulo cinco!',
          win: 'Excelente muestra... digo, derrota. Igual te cito en los agradecimientos.',
          lose: 'Defendido el título, como la tesis: con las uñas.' } },
    ],
  });

  // — SABANA GRANDE —
  MAPS.sabanagrande = station({
    id: 'sabanagrande', name: 'Estación Sabana Grande', shop: true,
    west: { to: 'tunel5', tx: 28, ty: 4 },
    east: { to: 'tunel6', tx: 1, ty: 4 },
    shopStock: ['ficha', 'fichaplus', 'malta', 'cafe', 'aguacoco', 'golfeado'],
    npcs: [
      { x: 8, y: 5, look: 'vieja', dir: 'down', name: 'Ajedrecista Margot',
        text: ['En el bulevar jugamos ajedrez desde antes de que tú nacieras. Una vez La Sayona se sentó a jugar. Le gané. No volvió... creo que por eso penan más por aquí.',
               'Jaque mate en cuatro, mijo. Igual que el Metro: piensa dos estaciones más adelante.'] },
      { x: 15, y: 7, look: 'musico', dir: 'down', name: 'Saxofonista Gualberto',
        text: ['Toco en el vagón de adelante desde el 95. Los espantos son mi mejor público: no piden reggaetón y siempre aplauden con frío.'] },
      { x: 20, y: 9, look: 'chamo', dir: 'up', name: 'Heladero Misael',
        text: ['¡EFE, EFE, tinita-tinita! Si oyes un silbido lejano por el túnel... lejos significa CERCA. Corre, o saluda con respeto, una de dos.'] },
    ],
  });

  // — Túnel 6: Sabana Grande → Chacaíto —
  MAPS.tunel6 = tunnel({
    id: 'tunel6', name: 'Túnel: Sabana Grande — Chacaíto', seed: 41,
    west: { to: 'sabanagrande', tx: 24, ty: 5 },
    east: { to: 'chacaito', tx: 1, ty: 5 },
    enc: { rate: 0.17, mons: [['araguako', 22, 14, 17], ['mapanare', 20, 14, 17], ['cachicamo', 18, 14, 17], ['guacamayo', 15, 14, 17], ['cunaguaro', 13, 14, 17], ['vagonima', 12, 15, 17]] },
    npcs: [
      { x: 16, y: 4, look: 'chamo', dir: 'down', name: 'Motorizado Jeison',
        trainer: { id: 'jeison', cls: 'Motorizado', team: [['centella', 16]], money: 170,
          intro: 'Yo hago Petare—Chacaíto en doce minutos, mi llave. Mi centella y yo no conocemos la cola.',
          win: 'Coñ... ¡digo, caramba! Me ganaste hasta el casco. Dale pues.',
          lose: '¡Vruum vruum, chamo! La vía es del que la usa.' } },
    ],
  });

  // — CHACAÍTO —
  MAPS.chacaito = station({
    id: 'chacaito', name: 'Estación Chacaíto', shop: true,
    west: { to: 'tunel6', tx: 28, ty: 4 },
    east: { to: 'tunel7', tx: 1, ty: 4 },
    shopStock: ['ficha', 'fichaplus', 'malta', 'cafe', 'aguacoco', 'golfeado', 'cocada'],
    npcs: [
      { x: 13, y: 7, look: 'sifrina', dir: 'down', name: 'Valentina', boss: true,
        trainer: { id: 'boss3', cls: 'Jefa de Estación', boss: true, money: 1000, reward: 'ficha3',
          team: [['chiguiron', 22], ['guacamayo', 22], ['morrocoy', 23]],
          intro: 'O sea, ¿TÚ quieres MI Ficha del Este? Qué ladilla contigo... Mira, mi equipo está importado, asesorado y con personal trainer. Te va a doler, te lo juro por mi visa.',
          win: 'O SEA. Okay. Wow. ¿Sabes qué? Te la ganaste, naguará de combate. Toma la FICHA DEL ESTE... pero esto no sale de aquí.',
          lose: 'Te lo dije, mi amor. Esto es nivel Altamira. Vuelve cuando madures, ¿sí?' } },
      { x: 7, y: 9, look: 'chamo', dir: 'up', name: 'Repartidor Edixon',
        text: ['De aquí pa\' arriba todo es brunch y oficina, mi pana, pero el túnel es igual de oscuro pa\' todo el mundo. La hora fantasma no tiene urbanización.'] },
      { x: 19, y: 5, look: 'senora', dir: 'down', name: 'Niñera Belkis',
        text: ['La niña que cuido le puso "Frappuccino" a un duendecito. El duendecito, indignado, le esconde UNA media. Tiene su dignidad.'] },
      { x: 5, y: 5, look: 'rival', dir: 'left', name: 'Cheo', hideIf: 'rival2', script: 'rival2' },
    ],
    triggers: [
      { x: 1, y: 5, once: 'rival2', script: 'rival2' },
    ],
  });

  // — Túnel 7: Chacaíto → Altamira —
  MAPS.tunel7 = tunnel({
    id: 'tunel7', name: 'Túnel: Chacaíto — Altamira', seed: 55,
    west: { to: 'chacaito', tx: 24, ty: 5 },
    east: { to: 'altamira', tx: 1, ty: 5 },
    enc: { rate: 0.17, mons: [['guacamayo', 20, 16, 20], ['araguako', 18, 16, 20], ['cachicamo', 16, 16, 19], ['cunaguaro', 14, 16, 20], ['morrocoy', 12, 16, 20], ['pereza', 10, 16, 20], ['vagonima', 10, 17, 20]] },
    npcs: [
      { x: 14, y: 5, look: 'sifrina', dir: 'right', name: 'Sifrino Juan Andrés',
        trainer: { id: 'juanandres', cls: 'Sifrino', team: [['chiguiron', 18], ['cunaguaro', 18]], money: 200,
          intro: 'Bro, literal este túnel es mi cardio. Mi chigüirón pesa 80 kilos de puro pilates y el cunaguaro tiene nutricionista.',
          win: 'Bro... me dejaste en visto. Bien jugado, full respeto.',
          lose: 'Es que el coach de mi chigüirón es buenísimo, bro. Te paso el contacto.' } },
    ],
  });

  // — ALTAMIRA —
  MAPS.altamira = station({
    id: 'altamira', name: 'Estación Altamira', shop: false,
    west: { to: 'tunel7', tx: 28, ty: 4 },
    east: { to: 'tunel8', tx: 1, ty: 4 },
    npcs: [
      { x: 10, y: 5, look: 'vieja', dir: 'down', name: 'Doña Donatella',
        text: ['Mi esposo, que en paz descanse, decía que el obelisco de arriba es el palito de altura que Dios le puso a Caracas pa\' medirla. 105 metros de pura elegancia.',
               'Yo vine de Italia en el 52 con una maleta. Caracas me dio todo lo demás. Por eso le cuido sus espantos: son de la familia.'] },
      { x: 16, y: 8, look: 'chamo', dir: 'left', name: 'Corredor Samuel',
        text: ['Subo el Ávila los domingos. Desde Sabas Nieves se ve TODO: la ciudad, el mar atrás... y se entiende por qué nadie la olvida, ni yéndose.',
               'Una vez me crucé con el oso frontino subiendo a Sabas Nieves. Me preguntó la hora con los ojos, asentí, y cada quien siguió su camino. Así es el Ávila.'] },
      { x: 21, y: 4, look: 'guardia', dir: 'down', name: 'PoliChacao Maikel',
        text: ['Anoche una Llorona pidió la hora en el andén 2. Le dije "las tres". Lloró más. Creo que era por otra cosa.'] },
    ],
  });

  // — Túnel 8: Altamira → Petare —
  MAPS.tunel8 = tunnel({
    id: 'tunel8', name: 'Túnel: Altamira — Petare', seed: 61, w: 34,
    west: { to: 'altamira', tx: 24, ty: 5 },
    east: { to: 'petare', tx: 1, ty: 5 },
    enc: { rate: 0.18, mons: [['morrocoy', 20, 18, 22], ['cachicamo', 18, 18, 22], ['mapanare', 18, 18, 22], ['araguako', 16, 18, 22], ['bachacon', 12, 19, 22], ['cunaguaro', 8, 19, 22], ['llorona', 8, 20, 23]] },
    npcs: [
      { x: 17, y: 3, look: 'vieja', dir: 'down', name: 'Abuelita Petra del Carmen',
        trainer: { id: 'abuelita', cls: 'Abuelita', team: [['morrocoy', 20], ['llorona', 20]], money: 220,
          intro: 'La Llorona me acompaña desde el 58, mija de mi alma. Llora ella, lloro yo, y así nos vamos turneando.',
          win: 'Ganaste, papito. Toma pa\'l pasaje... y come, que estás flaco.',
          lose: 'Una no llega a vieja en Caracas siendo mansa, mi amor.' } },
    ],
  });

  // — PETARE —
  MAPS.petare = station({
    id: 'petare', name: 'Estación Petare', shop: true,
    west: { to: 'tunel8', tx: 32, ty: 4 },
    streets: [{ x: 13, to: 'mercado', tx: 8, ty: 9 }],
    shopStock: ['ficha', 'fichaplus', 'malta', 'cafe', 'aguacoco', 'golfeado', 'cocada'],
    npcs: [
      { x: 8, y: 5, look: 'senora', dir: 'down', name: 'Vendedora Maigualida',
        text: ['¡Empanada, empanada, café con leche, teléfono, recargaaa! Petare madruga antes que el sol, mi amor, y se acuesta después que los espantos.',
               'Petare es Petare, mi reina. Aquí hasta los aparecidos bajan al centro a buscarse la vida.'] },
      { x: 17, y: 7, look: 'chamo', dir: 'left', name: 'Barbero Yeferson',
        text: ['Le hice un degradado a un Araguako. Quedó DURO. Ahora ruge con más confianza, se le nota en el flow.'] },
      { x: 21, y: 9, look: 'obrero', dir: 'up', name: 'Maestro Cándido',
        text: ['El casco viejo de arriba es de 1621, ¿oíste? Cuatrocientos años. Petare ya era pueblo cuando Caracas era un proyecto.'] },
    ],
  });

  // — Mercado de Petare —
  MAPS.mercado = {
    id: 'mercado', name: 'Mercado de Petare', theme: 'calle', music: 'town',
    grid: [
      '################',
      '#k.S..k..S...k.#',
      '#..............#',
      '#.....,....,...#',
      '#..k........k..#',
      '#..............#',
      '#....,...,.....#',
      '#.k........k...#',
      '#..............#',
      '#..............#',
      '########D#######',
    ],
    warps: [{ x: 8, y: 10, to: 'petare', tx: 13, ty: 9 }],
    shopStock: ['ficha', 'fichaplus', 'malta', 'cafe', 'aguacoco', 'golfeado', 'cocada'],
    enc: null,
    npcs: [
      { x: 7, y: 5, look: 'senora', dir: 'down', name: 'Doña Petra del Mercado', boss: true,
        trainer: { id: 'boss4', cls: 'Jefa de Estación', boss: true, money: 1200, reward: 'ficha4',
          team: [['cachicamo', 24], ['bachacon', 23], ['morrocoy', 26]],
          intro: 'Cuarenta años despachando en este mercado, muchacho. Mis criaturas cargan bultos, aguantan sol y no le deben nada a nadie. La Ficha del Pueblo no se regala: se suda.',
          win: 'Así mismo es. Sudaste, peleaste y no te quejaste: eso vale más que cualquier apellido. Toma la FICHA DEL PUEBLO, que de aquí eres.',
          lose: 'Vuelve mañana, mijo. El mercado abre a las cinco y la vida también.' } },
      { x: 12, y: 8, look: 'chamo', dir: 'left', name: 'Caletero Brayan',
        text: ['Con las cuatro Fichas Doradas te abren la reja de la Línea Fantasma, allá en Plaza Venezuela. Yo no bajo ni amarrado: ahí el tiempo no corre... se esconde.'] },
    ],
    triggers: [],
  };

  // — Zona Rental: la reja de la Línea 5 —
  MAPS.zonarental = {
    id: 'zonarental', name: 'Zona Rental — Acceso Línea 5', theme: 'ghost', music: 'ghost',
    grid: [
      '##################',
      '#........D.......#',
      '#................#',
      '#......,...,.....#',
      '#..P..........P..#',
      '#................#',
      '#....,....,......#',
      '#................#',
      '########D#########',
    ],
    warps: [
      { x: 9, y: 1, to: 'plazavenezuela', tx: 17, ty: 9 },
      { x: 8, y: 8, to: 'lineafantasma', tx: 2, ty: 4 },
    ],
    enc: null,
    npcs: [{ x: 9, y: 4, look: 'rival', dir: 'up', name: 'Cheo', hideIf: 'rival3', script: 'rival3' }],
    triggers: [{ x: 9, y: 2, once: 'rival3', script: 'rival3' }],
  };

  // — La Línea Fantasma —
  MAPS.lineafantasma = {
    id: 'lineafantasma', name: 'La Línea Fantasma', theme: 'ghost', music: 'ghost',
    grid: (() => {
      const w = 44, g = [];
      g[0] = rep('#', w);
      g[1] = rep('T', w);
      for (let y = 2; y <= 7; y++) {
        let r = '';
        for (let x = 0; x < w; x++) {
          if (x === 0 || x === w - 1) r += '#';
          else if (y >= 3 && y <= 6 && (x * 11 + y * 29) % 19 === 0) r += 'P';
          else if (y >= 3 && Math.sin(x * 0.5 + y * 2.1) > -0.2) r += '~';
          else r += '.';
        }
        g[y] = r;
      }
      g[8] = rep('#', w);
      const set = (x, y, ch) => { g[y] = g[y].slice(0, x) + ch + g[y].slice(x + 1); };
      // pasarela de entrada y altar de la Reina
      for (let x = 1; x <= 4; x++) set(x, 4, '.');
      set(22, 2, 'a'); set(21, 2, '.'); set(22, 3, '.'); set(23, 3, '.');
      set(42, 4, '.'); set(41, 4, '.');
      set(1, 4, 'D');
      return g;
    })(),
    warps: [{ x: 1, y: 4, to: 'zonarental', tx: 8, ty: 7 }],
    enc: { rate: 0.2, mons: [['vagonima', 38, 28, 33], ['llorona', 22, 28, 33], ['sayona', 18, 29, 34], ['duendecito', 12, 28, 32], ['silbon', 6, 32, 35], ['catatumbo', 4, 36, 40, 'ending']] },
    npcs: [],
    triggers: [
      { x: 42, y: 4, once: null, script: 'trenfantasma' },
      { x: 41, y: 4, once: null, script: 'trenfantasma' },
    ],
    tileScripts: { a: 'altar' },
  };

  MQ.MAPS = MAPS;

  // ---- Orden de estaciones para el tren ----------------------------------------
  MQ.TRAIN_STOPS = ['propatria', 'canoamarillo', 'capitolio', 'bellasartes', 'plazavenezuela', 'sabanagrande', 'chacaito', 'altamira', 'petare'];
})();
