// Metro Quest — la gente de la red (world bible §1-8): los Jefes 5-8 con sus
// Fichas Doradas, el Consejo de la Hora Fantasma, los tutores de oficios, los
// legendarios estáticos y los entrenadores de las rutas nuevas.
// Carga después de main.js: extiende MQ.SCRIPTS y puebla los mapas generados.
(() => {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  if (!MQ.MAPS.st_elsilencio) return; // sin la red no hay a quién sentar

  // ---- tutores de oficios ---------------------------------------------------------
  // Enseñan el oficio (bandera que abre rejas) y, si hay campo, el movimiento.
  const OFICIOS = {
    luzdecocuyo: { flag: 'oficio_luz', move: 'luzdecocuyo', name: 'LUZ DE COCUYO', desc: 'alumbra las zonas de apagón' },
    machetazo:   { flag: 'oficio_machete', move: 'machetazo', name: 'MACHETE', desc: 'abre el monte crecido' },
    empuje:      { flag: 'oficio_empuje', move: 'empuje', name: 'EMPUJE', desc: 'mueve vagones y cajas varadas' },
    demolicion:  { flag: 'oficio_demolicion', move: 'demolicion', name: 'DEMOLICIÓN', desc: 'tumba derrumbes y muros flojos' },
    nado:        { flag: 'oficio_nado', move: 'nado', name: 'NADO', desc: 'cruza los tramos inundados' },
    teleferico:  { flag: 'oficio_teleferico', move: null, name: 'TELEFÉRICO', desc: 'llama las cabinas del Metrocable' },
  };
  const tutorScript = (key, intro, done) => () => {
    const of = OFICIOS[key];
    if (MQ.player.flags[of.flag]) return [{ say: [null, done] }];
    return [
      { say: [null, intro] },
      { choice: { title: `¿Aprender ${of.name}?`, options: [
        { label: '¡Sí, enséñame!', script: [
          { fn: () => {
            MQ.setFlag(of.flag);
            const m = MQ.player.party[0];
            if (of.move && m && !m.moves.includes(of.move) && m.moves.length < 4) {
              m.moves.push(of.move);
              m.pp[of.move] = MQ.MOVES[of.move].pp;
            }
          } },
          { sfx: 'lvl' },
          { say: [null, `¡Aprendiste el oficio de ${of.name}! ${of.desc.charAt(0).toUpperCase() + of.desc.slice(1)}. Las puertas que pedían este oficio ya te reconocen.`] },
          { fn: () => MQ.save(true) },
        ] },
        { label: 'Ahora no', script: [{ say: [null, 'Cuando quieras, mijo. El oficio no se vence.'] }] },
      ] } },
    ];
  };

  Object.assign(MQ.SCRIPTS, {
    'tutor:luz': tutorScript('luzdecocuyo',
      'MAESTRO COCUYERO: En el oeste hay túneles donde ni el tercer riel alumbra. Yo le enseño a su espanto a cargar la luz del cocuyo.',
      'MAESTRO COCUYERO: Con esa lucecita no hay apagón que lo pare, chamo.'),
    'tutor:machete': tutorScript('machetazo',
      'VIEJO MACHETERO: El monte del Calvario y la Puerta del Ávila están cerrados de maleza. Un buen MACHETE los abre con respeto.',
      'VIEJO MACHETERO: Machete estate quieto... hasta que haga falta.'),
    'tutor:empuje': tutorScript('empuje',
      'MAESTRA DE OBRA: Hay vagones varados que nadie mueve desde el 99. Con el oficio del EMPUJE, su espanto los rueda solito.',
      'MAESTRA DE OBRA: Empuje parejo, sin rabia, que rinde más.'),
    'tutor:demolicion': tutorScript('demolicion',
      'DEMOLEDOR JUBILADO: Un derrumbe no es una pared: es una pared cansada. El oficio de DEMOLICIÓN sabe dónde tocarla.',
      'DEMOLEDOR JUBILADO: Tumbe con cariño, que la ciudad oye.'),
    'tutor:nado': tutorScript('nado',
      'PESCADORA DEL GUAIRE: El tramo de El Valle está inundado hasta el techo. Con el oficio del NADO se cruza como tonina.',
      'PESCADORA DEL GUAIRE: Nade con la corriente, nunca contra ella.'),
    'tutor:teleferico': tutorScript('teleferico',
      'OPERADOR DEL METROCABLE: Las cabinas duermen desde la última lluvia brava. El oficio del TELEFÉRICO las despierta: San Agustín y Mariche lo esperan.',
      'OPERADOR DEL METROCABLE: Arriba el cielo es de los tambores, chamo.'),
  });

  // ---- legendarios estáticos (data/encounters.static) --------------------------------
  const staticScript = (id, lvl, intro) => () => {
    if (MQ.player.flags['static_' + id]) return [{ say: [null, 'El aire todavía recuerda lo que estuvo aquí.'] }];
    return [
      { sfx: 'whistle' },
      { say: [null, intro] },
      { fn: () => MQ.audio.cry(id) },
      { battle: { wild: { id, lvl }, noFlee: true },
        winScript: [{ flag: 'static_' + id }, { fn: () => MQ.save(true) }] },
    ];
  };
  Object.assign(MQ.SCRIPTS, {
    'static:bachacon': staticScript('bachacon', 36,
      'En lo más hondo del pozo, algo sostiene el techo con el lomo. El BACHACÓN legendario te mira: nadie le paga el condominio a él.'),
    'static:silbon': staticScript('silbon', 48,
      'Un silbido lejano... demasiado cerca. EL SILBÓN suelta su saco de huesos en el riel.'),
    'static:catatumbo': staticScript('catatumbo', 70,
      'En la cumbre del Ávila el cielo se parte sin trueno. EL CATATUMBO bajó a ver quién sube.'),
    'static:luzcaraballo': staticScript('luzcaraballo', 68,
      'De Chachopo a Apartaderos la niebla cuenta niños. LA LOCA LUZ CARABALLO te cuenta entre los suyos.'),
  });

  // ---- guiones de los Jefes y el Consejo ---------------------------------------------
  // Los jefes son NPCs trainer con reward (el motor ya entrega la ficha y el flag).
  const npcsOf = (id) => (MQ.MAPS[id].npcs = MQ.MAPS[id].npcs || []);

  // ---- Jefe 5: el Baquiano del Zoológico (Monte) — Ficha del Monte ----
  npcsOf('st_zoologico').push(
    { x: 20, y: 8, look: 'obrero', dir: 'down', name: 'el Baquiano', boss: true,
      trainer: { id: 'boss5', cls: 'Baquiano del Zoológico', boss: true, reward: 'ficha5', money: 1600,
        team: [['baquiron', 31], ['babote', 32], ['dantota', 32], ['iguanota', 33], ['matapalo', 34, 'macheteviejo']],
        intro: 'Cuando la gente dejó de venir, yo me quedé. Y como yo me quedé, los animales se quedaron. ¿Tú también sabes quedarte?',
        win: 'Sabes quedarte y sabes pelear. La FICHA DEL MONTE es tuya: el monte te reconoce.',
        after: 'El zoológico abre a la hora fantasma. Los animales prefieren esa tanda.',
        lose: 'El monte no se apura. Vuelve cuando estés listo.' } },
    { x: 12, y: 8, look: 'chama', dir: 'down', name: 'Cuidadora Yusmely',
      text: ['El Baquiano conoce cada animal por su nombre. Y a los espantos del monte, por su apodo.',
             'Dicen que en el safari del zoo salen especies que no se ven en ningún túnel.'] },
  );

  // ---- Jefe 6: el Pescador del Guaire (Caribe) — Ficha del Río ----
  npcsOf('st_layaguara').push(
    { x: 20, y: 8, look: 'obrero', dir: 'down', name: 'el Pescador', boss: true,
      trainer: { id: 'boss6', cls: 'Pescador del Guaire', boss: true, reward: 'ficha6', money: 1900,
        team: [['guabinota', 35], ['sapoton', 35], ['babote', 36], ['manaton', 37], ['caribazo', 38, 'aguaanauco']],
        intro: 'Yo pesco en el río que la ciudad dio por muerto, y el río me devuelve lo que la ciudad botó. Hoy pescaste tú: un combate.',
        win: 'El Guaire te respeta, y eso no lo dice de cualquiera. Llévate la FICHA DEL RÍO.',
        after: 'Todo lo que la ciudad bota vuelve por el río. Hasta el cariño.',
        lose: 'El río sigue corriendo. Tú también: a entrenar.' } },
    { x: 8, y: 8, look: 'senora', dir: 'right', name: 'Doña Milagros',
      text: ['El Pescador le devolvió a mi hija la cadenita que se le cayó al Guaire en el 92. Tal cual, brillandito.'] },
  );

  // ---- Jefe 7: la Amazona de La Rinconada (Criollo) — Ficha del Sur ----
  npcsOf('st_larinconada').push(
    { x: 20, y: 8, look: 'sifrina', dir: 'down', name: 'la Amazona', boss: true,
      trainer: { id: 'boss7', cls: 'Amazona de La Rinconada', boss: true, reward: 'ficha7', money: 2300,
        team: [['guachiman', 39], ['palomota', 39], ['burritosabanero', 40, 'franelabarrio'], ['camioneton', 40], ['mulamania', 41], ['reyzamuro', 42, 'polvomariposa']],
        intro: 'Mis caballos corren la hora fantasma contra jinetes que solo yo veo. Nunca pierden. A ver si tú me haces sudar la montura.',
        win: 'Corriste parejo, chamo. La FICHA DEL SUR es tuya: el hipódromo te anota en su libro.',
        after: 'La sexta válida de la hora fantasma la gana siempre el mismo caballo. No preguntes cuál.',
        lose: 'Foto final: perdiste por cinco cuerpos. Vuelve entrenado.' } },
  );

  // ---- Jefe 8: la Ingeniera de las Torres (Catatumbo) — Ficha de la Torre ----
  npcsOf('st_parquecentral').push(
    { x: 20, y: 8, look: 'operador', dir: 'down', name: 'la Ingeniera', boss: true,
      trainer: { id: 'boss8', cls: 'Ingeniera de las Torres', boss: true, reward: 'ficha8', money: 2800,
        team: [['cablebra', 43], ['plantaelectrica', 43], ['reflectoron', 44, 'bombilloahorrador'], ['cerreron', 45], ['camioneton', 45], ['torregemela', 46, 'azabachepulsera']],
        intro: 'Estas torres no se han apagado ni una noche desde antes de que tú nacieras. ¿Sabes por qué? Porque yo no duermo. Demuéstrame que tampoco duermes tú.',
        win: 'Quedas conectado al circuito, chamo. La FICHA DE LA TORRE: que nunca se te apague.',
        after: 'Zona Rental te espera. Ocho fichas abren esa puerta, y lo que hay detrás no es un jefe: es la memoria.',
        lose: 'Se te bajó el breaker. Súbelo y vuelve.' } },
    { x: 6, y: 8, look: 'operador', dir: 'down', name: 'Operador del Metrocable', script: 'tutor:teleferico' },
  );

  // ---- el Consejo de la Hora Fantasma (Zona Rental) -----------------------------------
  // Cuatro ánimas, en orden y sin curación entre medio, como manda el clásico.
  const consejo = (n, id, cls, team, intro, win) => ({
    x: 10 + n * 5, y: 8, look: 'vieja', dir: 'down', name: cls, boss: true,
    showIf: n === 0 ? 'fichas8' : 't_consejo' + n,
    trainer: { id: 'consejo' + (n + 1), cls, boss: true, money: 0, team, intro, win,
      lose: 'La hora fantasma sigue sin ti, chamo.' },
  });
  npcsOf('st_zonarental').push(
    consejo(0, 'obrero83', 'el Obrero del 83',
      [['lajon', 50], ['glipton', 51], ['cachicamo', 51], ['tepuyon', 52, 'piedraabuelo']],
      'Yo excavé estos túneles con estas manos. Pasamos la tuneladora por debajo de la memoria de la ciudad. Enséñame qué construiste tú.',
      'Construiste un equipo. Eso también es obra. Pasa.'),
    consejo(1, 'maestra', 'la Maestra Eterna',
      [['guachiman', 51], ['ratonante', 52], ['gatonegro', 52], ['elcoco', 53, 'cintamorada']],
      'Todo chamo de Caracas fue alumno mío, hasta los que juran que no. A ver la tarea: ¡combate!',
      'Veinte puntos. Pasa al siguiente salón.'),
    consejo(2, 'estudiante', 'el Estudiante de la UCV',
      [['cardenalito', 52], ['bandolo', 53], ['cerreron', 53], ['arpaviva', 53, 'cuatroafinado']],
      'Me falta un semestre desde 1987. La tesis era sobre la memoria eléctrica de las ciudades. Tú eres mi último experimento.',
      'Hipótesis confirmada: la ciudad recuerda. Sigue.'),
    consejo(3, 'cantora', 'la Cantora de Velorios',
      [['furrucon', 53], ['velorion', 53], ['tamboron', 54], ['llorona', 54, 'campanavagon']],
      'Yo canto a los muertos para que duerman y a los vivos para que lloren. Para ti tengo una canción nueva.',
      'Mi canción termina y tú sigues de pie. El Consejo te reconoce.'),
    { x: 33, y: 8, look: 'vieja', dir: 'down', name: 'Voz del Consejo', showIf: 't_consejo4', script: 'consejo:cierre' },
  );
  Object.assign(MQ.SCRIPTS, {
    'consejo:cierre': () => {
      if (MQ.player.flags.consejo) return [{ say: [null, 'CONSEJO: La Línea Fantasma te espera al final del andén. Ve con la bendición.'] }];
      return [
        { say: [null, 'CONSEJO: Cuatro ánimas te probaron y las cuatro dicen tu nombre.'] },
        { healParty: true },
        { flag: 'consejo' },
        { sfx: 'victory' },
        { say: [null, 'Las luces del andén parpadean dos veces, largas, como una reverencia. El paso a la Línea Fantasma está abierto.'] },
        { fn: () => MQ.save(true) },
      ];
    },
  });

  // ---- tutores repartidos (siempre antes de su primera reja obligatoria) --------------
  MQ.MAPS.propatria.npcs.push({ x: 22, y: 8, look: 'musico', dir: 'left', name: 'Maestro Cocuyero', script: 'tutor:luz' });
  MQ.MAPS.calvario.npcs.push({ x: 4, y: 7, look: 'obrero', dir: 'down', name: 'Viejo Machetero', script: 'tutor:machete' });
  MQ.MAPS.bellasartes.npcs.push({ x: 20, y: 8, look: 'obrero', dir: 'down', name: 'Maestra de Obra', script: 'tutor:empuje', showIf: 'ficha2' });
  npcsOf('st_elsilencio').push({ x: 26, y: 8, look: 'obrero', dir: 'down', name: 'Demoledor Jubilado', script: 'tutor:demolicion' });
  npcsOf('st_layaguara').push({ x: 26, y: 8, look: 'chama', dir: 'down', name: 'Pescadora del Guaire', script: 'tutor:nado', showIf: 'ficha6' });

  // ---- los estáticos en su sitio (mismos datos de data/encounters.static) -------------
  npcsOf('tn_layaguara__caricuao').push(
    { x: 40, y: 2, mon: 'bachacon', name: 'algo enorme', script: 'static:bachacon',
      hideIf: 'static_bachacon', showIf: 'oficio_demolicion' });
  npcsOf('tn_capuchinos__teatros').push(
    { x: 40, y: 2, mon: 'silbon', name: 'un silbido', script: 'static:silbon',
      hideIf: 'static_silbon', showIf: 'fichas7' });
  npcsOf('sf_cumbre').push(
    { x: 24, y: 10, mon: 'catatumbo', name: 'el relámpago', script: 'static:catatumbo',
      hideIf: 'static_catatumbo', showIf: 'ending' });
  npcsOf('tn_carrizal__sanantonio').push(
    { x: 40, y: 2, mon: 'luzcaraballo', name: 'una silueta en la niebla', script: 'static:luzcaraballo',
      hideIf: 'static_luzcaraballo', showIf: 'ending' });

  // ---- entrenadores de las rutas nuevas ------------------------------------------------
  const T2 = (id, x, look, name, cls, team, intro, win, lose) =>
    ({ x, y: 2, look, dir: 'down', name, trainer: { id, cls, team, money: 60 * team[team.length - 1][1] / 3 | 0, intro, win, lose } });
  npcsOf('tn_elsilencio__capuchinos').push(
    T2('ucv1', 22, 'chamo', 'Andrés', 'Estudiante de la UCV',
      [['bachaquito', 31], ['cunaguaro', 32]],
      'Estudio biología y esto de aquí abajo no sale en ningún libro. ¡Dame data!',
      'Anotado: me faltaba muestra de derrota.',
      'La ciencia avanza. Tú no.'),
    T2('moto1', 55, 'obrero', 'Wilmer', 'Motorizado',
      [['camioneton', 32], ['cachorro', 31], ['guachiman', 33]],
      '¡Epa! Por aquí no se pasa sin pagar peaje... de combate.',
      'Pasa pues, y saluda al oeste de mi parte.',
      'El que sabe la ruta, cobra la ruta.'));
  npcsOf('tn_capuchinos__layaguara').push(
    T2('obr2', 30, 'obrero', 'Petra', 'Operadora del Metro',
      [['pilica', 33], ['bombillito', 33], ['cablebrita', 34]],
      'Turno nocturno en zona de apagón. Uno se entretiene como puede.',
      'Buen combate. Cuida esa luz que llevas.',
      'A oscuras también se gana.'));
  npcsOf('tn_caricuao__zoologico').push(
    T2('cuid1', 25, 'chama', 'Marisol', 'Cuidadora',
      [['baquirito', 32], ['dantica', 33]],
      'Voy al zoo a llevarle mango a los que se quedaron. ¿Combate de camino?',
      'Los animales te van a caer bien.',
      'El monte cuida a los suyos.'));
  npcsOf('tn_caricuao__lasadjuntas').push(
    T2('sen2', 35, 'senora', 'Doña Chela', 'Abuela del Oeste',
      [['morrocoy', 34], ['pereza', 35]],
      'Mijo, a esta hora por aquí solo andamos las abuelas y los espantos. Y a veces somos lo mismo.',
      'Toma pa\' que meriendes... mentira, gana tú primero.',
      'La paciencia, mijo. La paciencia.'));
  npcsOf('tn_plazavenezuela__ciudaduniversitaria').push(
    T2('ucv2', 28, 'chama', 'Coraima', 'Estudiante de Arquitectura',
      [['torrecita', 35], ['fichita', 34], ['bejuquito', 35]],
      'Villanueva diseñó hasta la sombra de la UCV. Yo diseño victorias.',
      'Síntesis de las artes: perdí con estilo.',
      'Patrimonio de la Humanidad, chamo.'));
  npcsOf('tn_ciudaduniversitaria__labandera').push(
    T2('ajedrez1', 40, 'vieja', 'Don Emiliano', 'Ajedrecista del Bulevar',
      [['glipton', 36], ['maraquita', 35], ['capachon', 36]],
      'Jaque en cuatro. Siempre es en cuatro. ¿Empezamos?',
      'Jaque mate... al revés. Bien jugado.',
      'Te lo dije: en cuatro.'));
  npcsOf('tn_labandera__elvalle').push(
    T2('buho1', 33, 'buhonero', 'Richard', 'Buhonero Mayor',
      [['arepon', 37], ['tequenon', 37], ['cafecito', 36]],
      '¡Lleve lleve! Hoy tengo oferta: combate gratis y la derrota se la lleva usted.',
      'Se me acabó la mercancía. Usted gana.',
      '¡Lleve su derrota, casero!'));
  npcsOf('tn_elvalle__larinconada').push(
    T2('guardia1', 50, 'guardia', 'Sargento Mora', 'Guardia del Hipódromo',
      [['guachiman', 38], ['zamuron', 39], ['mapanare', 39]],
      'Nadie ve a la Amazona sin pasar por mí. Reglamento.',
      'Reglamento cumplido. Adelante.',
      'El reglamento siempre gana.'));
  npcsOf('tn_teatros__nuevocirco').push(
    T2('musico2', 30, 'musico', 'la Contralto', 'Cantante del Municipal',
      [['paraulata', 42], ['arpaviva', 43]],
      'El teatro está oscuro pero la acústica sigue perfecta. Escucha mi aria de combate.',
      'Bravo. El aplauso es tuyo.',
      'La ópera no perdona.'));
  npcsOf('tn_nuevocirco__parquecentral').push(
    T2('oper3', 45, 'operador', 'Técnico Ledezma', 'Operador de las Torres',
      [['reflectoron', 44], ['cablebra', 44]],
      'Reviso el cableado que sube a las torres. Tú pareces un pico de tensión.',
      'Circuito estable. Sigue.',
      'Sobrecarga controlada.'));
  npcsOf('tn_aliprimera__guaicaipuro').push(
    T2('teq1', 30, 'chamo', 'Yonaikel', 'Viajero de Los Teques',
      [['frailejon', 62], ['neblinon', 63]],
      'Yo bajo a Caracas todos los días y subo todas las noches. La niebla ya me saluda.',
      'La niebla también te saluda a ti ya.',
      'De Chachopo a Apartaderos...'));
  npcsOf('tn_independencia__carrizal').push(
    T2('teq2', 45, 'vieja', 'Doña Encarnación', 'Abuela del Páramo',
      [['condoron', 64], ['tepuyon', 65]],
      'Aquí arriba el frío guarda mejor los recuerdos. ¿Trajiste los tuyos?',
      'Llévate un poquito de páramo en el bolsillo.',
      'El páramo no suelta lo suyo.'));

  // ---- la reja del safari (Zoológico) — versión de taquilla -----------------------------
  Object.assign(MQ.SCRIPTS, {
    'safari:taquilla': () => {
      if (MQ.player.money < 500) return [{ say: [null, 'TAQUILLA: La entrada del safari cuesta 500 bolos, mijo. El mantenimiento de la hora fantasma no se paga solo.'] }];
      return [
        { say: [null, 'TAQUILLA: Bienvenido al Safari del Zoológico de Caricuao. 500 bolos la entrada, e incluye 15 Fichas de Feria. Los espantos de adentro no se ven en ningún otro lado.'] },
        { choice: { title: '¿Pagar 500 bolos?', options: [
          { label: '¡De una!', script: [
            { money: -500 },
            { give: { item: 'fichaferia', n: 15 } },
            { sfx: 'catch' },
            { say: [null, 'TAQUILLA: Sus fichas. Recuerde: adentro no se pelea con espantos ajenos y el mango de los tapires no se toca.'] },
          ] },
          { label: 'Ahora no', script: [{ say: [null, 'TAQUILLA: El safari no se va a ninguna parte. Bueno... ya no.'] }] },
        ] } },
      ];
    },
  });
  npcsOf('in_safari').push({ x: 10, y: 11, look: 'buhonero', dir: 'down', name: 'Taquillero', script: 'safari:taquilla' });

  // ---- el arco de Cheo, re-sentado en la red grande (world bible §1-4) -----------------
  // Cheo 3 se muda a Las Adjuntas: anda tanteando la línea que se va de la ciudad,
  // como hizo él una vez. El guion canon rival3 se reutiliza tal cual.
  npcsOf('st_lasadjuntas').push(
    { x: 26, y: 8, look: 'rival', dir: 'down', name: 'Cheo', hideIf: 'rival3', script: 'rival3' });

  // Cheo final: después de las cuatro ánimas, antes de que el Consejo te bendiga.
  const lineOf = (id) => MQ.player.party.concat(MQ.player.locker).some((m) => m.id === id) || MQ.player.dexCaught[id];
  const starterOf = () => {
    for (const id of ['frontinito', 'ucumari', 'waraira']) if (lineOf(id)) return 'frontinito';
    for (const id of ['turpialin', 'cantaclaro', 'florentin']) if (lineOf(id)) return 'turpialin';
    return 'cocuyin';
  };
  Object.assign(MQ.SCRIPTS, {
    rival4: () => {
      const counter = { frontinito: 'caribazo', turpialin: 'centellon', cocuyin: 'chiguiral' }[starterOf()] || 'caribazo';
      return [
        { say: ['Cheo', 'Primo. Cuatro ánimas me dejaron pasar y una sola pregunta me trajo hasta aquí: ¿qué se siente quedarse?'] },
        { say: ['Cheo', 'Yo me fui cinco años y volví de visita. Tú te quedaste y la ciudad entera te conoce por tu nombre. Vamos a ver quién aprendió más.'] },
        { battle: { trainer: { id: 'cheofinal', cls: 'Tu primo', name: 'Cheo', boss: true, money: 4000,
          team: [['palomota', 52], ['vagonima', 53, 'cintamorada'], ['reyzamuro', 54], ['elpabellon', 54, 'ajidulce'], ['guacamayon', 55], [counter, 56, 'azabachepulsera']],
          intro: 'Sin llorar, ¿oíste? Ni tú ni yo.',
          win: 'Coño, primo... Ganaste tú. Ganaste tú y ganó esta ciudad, que aunque me fui nunca supo soltarme.',
          lose: 'Todavía no, primo. Todavía no.' } },
          winScript: [
            { flag: 'rival4' },
            { say: ['Cheo', 'Lo que quería decirte desde que aterricé: me quedo. Me quedo, primo. Que el Tren reparta los recuerdos: yo prefiero hacer los míos aquí.'] },
            { healParty: true },
            { fn: () => MQ.save(true) },
          ] },
      ];
    },
  });
  npcsOf('st_zonarental').push(
    { x: 30, y: 8, look: 'rival', dir: 'down', name: 'Cheo', showIf: 't_consejo4', hideIf: 'rival4', script: 'rival4' });
  // la Voz del Consejo solo cierra el rito cuando Cheo dijo lo que vino a decir
  const voz = MQ.MAPS.st_zonarental.npcs.find((n) => n.script === 'consejo:cierre');
  if (voz) voz.showIf = 'rival4';

  // ---- el final: el andén de Miranda (Línea Fantasma) ----------------------------------
  for (const x of [14, 15, 16, 17, 18]) {
    MQ.MAPS.gh_miranda_l5.triggers.push({ x, y: 5, once: null, script: 'trenfantasma' });
    // el camino al final queda despejado
    const g = MQ.MAPS.gh_miranda_l5.grid;
    MQ.MAPS.gh_miranda_l5.grid[5] = g[5].slice(0, x) + '.' + g[5].slice(x + 1);
  }

  // ---- los Bachaqueros de Recuerdos y el Coleccionista (Nuevo Circo) --------------------
  Object.assign(MQ.SCRIPTS, {
    coleccionista: () => {
      if (MQ.player.flags.recuerdos) return [
        { say: ['el Coleccionista', 'Cada botella volvió con su dueño. Yo estoy aprendiendo a hacer recuerdos nuevos. Cuesta, ¿sabes? Pero huelen mejor.'] },
      ];
      return [
        { say: ['el Coleccionista', 'Yo también me fui, chamo. Y cuando quise empacar mis recuerdos... no me cupieron. Así que empecé a guardar los de los demás.'] },
        { say: ['el Coleccionista', 'Arepas de sábado, la voz de una abuela, el eco de un estadio. Todo embotellado, todo etiquetado, todo... robado, si somos sinceros.'] },
        { say: ['el Coleccionista', 'Tu manera de pelear me recordó algo que yo tenía olvidado: que esto no se colecciona. Se vive. Ayúdame a destaparlas.'] },
        { sfx: 'sparkle' },
        { say: ['', 'El Coleccionista destapa botella por botella. El mercado entero huele a hallaca, a lluvia de mayo, a gasolina de moto y a torta de cumpleaños, todo a la vez.'] },
        { flag: 'recuerdos' },
        { give: { item: 'morocota', n: 1 } },
        { say: ['el Coleccionista', 'Toma: una morocota de las de antes. El único recuerdo mío que sí quiero que cargue otro.'] },
        { fn: () => MQ.save(true) },
      ];
    },
  });
  npcsOf('in_mercadocirco').push(
    { x: 6, y: 6, look: 'buhonero', dir: 'down', name: 'Bachaquero de Recuerdos',
      trainer: { id: 'bachaq1', cls: 'Bachaquero de Recuerdos', money: 1200,
        team: [['ratonante', 44], ['maletica', 44], ['camioneton', 45]],
        intro: 'El jefe no recibe. Los recuerdos entran, no salen. ¿O es que tú quieres discutir el inventario?',
        win: 'Está bien, está bien... Pasa. Total, últimamente el jefe ni mira las botellas.',
        lose: 'Sin recibo no hay reclamo, chamo.' } },
    { x: 12, y: 6, look: 'senora', dir: 'down', name: 'el Coleccionista', showIf: 't_bachaq1', script: 'coleccionista' });

  // ---- el post-juego (world bible §7-8) --------------------------------------------
  // La Torre (Independencia): tres duelos seguidos, sin curarse entre medio.
  Object.assign(MQ.SCRIPTS, {
    'torre:reto': () => [
      { say: ['la Relojera', 'Bienvenido a LA TORRE. Tres retadores, uno detrás del otro, sin Doctorcito entre medio. El reloj de arriba lleva la cuenta desde 1953.'] },
      { choice: { title: '¿Aceptar el reto?', options: [
        { label: '¡Que suene el reloj!', script: [
          { battle: { trainer: { id: 'torre1', cls: 'Retador de la Torre', name: 'Ávido', money: 0,
            team: [['reyzamuro', 60], ['cablebra', 60], ['hallacon', 61]],
            intro: 'Piso uno. Sin calentamiento.', win: 'Sube.', lose: 'El reloj no espera.' } },
            winScript: [
              { battle: { trainer: { id: 'torre2', cls: 'Retadora de la Torre', name: 'Milagros', money: 0,
                team: [['guacamayon', 62], ['elpabellon', 62], ['dientona', 63]],
                intro: 'Piso dos. Aquí se acaban los turistas.', win: 'El último piso es tuyo.', lose: 'Hasta aquí llegó tu cuerda.' } },
                winScript: [
                  { battle: { trainer: { id: 'torre3', cls: 'Guardián del Reloj', name: 'el Puntual', money: 3000,
                    team: [['rabipelado', 64], ['matapalo', 64], ['arpaviva', 65], ['waraira', 66, 'tajadaplatano']],
                    intro: 'Piso tres. Yo le doy cuerda al reloj desde antes del Metro. A ver si llegas puntual a tu propia victoria.',
                    win: 'Puntual. La Torre te reconoce: llévate esto.', lose: 'Llegaste tarde. Como casi todos.' } },
                    winScript: [
                      { give: { item: 'estampa', n: 3 } },
                      { give: { item: 'cariaquitodoble', n: 2 } },
                      { give: { item: 'morocota', n: 1 } },
                      { sfx: 'victory' },
                      { say: ['la Relojera', 'Tres pisos, cero excusas. Vuelve cuando quieras: el reloj siempre tiene cuerda pa\' otra ronda.'] },
                      { healParty: true },
                      { fn: () => MQ.save(true) },
                    ] },
                ] },
            ] },
        ] },
        { label: 'Hoy no', script: [{ say: ['la Relojera', 'El reloj sabe esperar. Es lo único que sabe hacer.'] }] },
      ] } },
    ],
    // la Tía que Cuida (Caricuao): deja un espanto y ella lo cría con los pasos
    'tia:cuida': () => {
      const p = MQ.player;
      if (p.daycare) {
        const gained = Math.min(Math.floor((p.steps - p.daycare.steps) / 256), 100 - p.daycare.mon.lvl);
        const cost = 100 + gained * 100;
        const name = MQ.SPECIES[p.daycare.mon.id].name;
        return [
          { say: ['la Tía', `¡Llegaste! ${name} está ${gained > 0 ? `más grande: subió ${gained} nivel${gained === 1 ? '' : 'es'} caminando conmigo` : 'igualito, pero bien comido'}. Son ${cost} bolos de cariño.`] },
          { choice: { title: `¿Recogerlo (${cost}b)?`, options: [
            { label: 'Sí, gracias Tía', script: [
              { fn: () => {
                if (p.money < cost) return;
                p.money -= cost;
                const m = p.daycare.mon;
                m.lvl = Math.min(100, m.lvl + gained);
                m.xp = MQ.xpForLevel(m.lvl, MQ.xpGroupOf(m.id));
                MQ.recalcStats(m);
                if (p.party.length < 6) p.party.push(m); else p.locker.push(m);
                p.daycare = null;
                MQ.save(true);
              } },
              { say: ['la Tía', 'Pórtense bien los dos. Y coman, que andan en los huesos.'] },
            ] },
            { label: 'Todavía no', script: [{ say: ['la Tía', 'Aquí lo sigo cuidando. Este ya es de la familia.'] }] },
          ] } },
        ];
      }
      if (MQ.player.party.length < 2) return [
        { say: ['la Tía', 'Yo te cuido un espanto con gusto, mijo... pero no te vas a quedar solo en la hora fantasma. Trae compañía primero.'] },
      ];
      return [
        { say: ['la Tía', 'Yo crié a siete muchachos y a doce espantos. Déjame uno: yo lo camino, lo consiento y me lo engordo a nivel puro.'] },
        { choice: { title: '¿Dejar al primero del equipo?', options: [
          { label: 'Cuídemelo, Tía', script: [
            { fn: () => {
              const m = MQ.player.party.shift();
              MQ.player.daycare = { mon: m, steps: MQ.player.steps || 0 };
              MQ.save(true);
            } },
            { say: ['la Tía', 'Ya está en buenas manos. Camina bastante, que cada paso tuyo también lo cría.'] },
          ] },
          { label: 'Mejor no', script: [{ say: ['la Tía', 'Cuando quieras. La puerta de la Tía no tiene candado.'] }] },
        ] } },
      ];
    },
    // Cheo, ya quedado, entrena contigo en San Antonio cada vez que subas
    rival5: () => {
      const counter = { frontinito: 'caribazo', turpialin: 'centellon', cocuyin: 'chiguiral' }[starterOf()] || 'caribazo';
      return [
        { say: ['Cheo', 'Primo. Ahora que me quedé, subo aquí los fines de semana a entrenar con la niebla. ¿Le damos?'] },
        { battle: { trainer: { id: 'cheorematch', cls: 'Tu primo', name: 'Cheo', boss: true, money: 5000,
          team: [['palomota', 62], ['vagonima', 63, 'cintamorada'], ['reyzamuro', 63], ['elpabellon', 64, 'ajidulce'], ['guacamayon', 65], [counter, 66, 'azabachepulsera']],
          intro: 'Sin llorar. Ya lloramos aquella vez.',
          win: 'Cada vez que me ganas, más seguro estoy de que hice bien en quedarme.',
          lose: 'Hoy gané yo. El páramo me tiene fuerte, primo.' } },
          winScript: [{ healParty: true }, { fn: () => MQ.save(true) }] },
      ];
    },
  });
  npcsOf('in_latorre').push({ x: 10, y: 11, look: 'vieja', dir: 'down', name: 'la Relojera', script: 'torre:reto' });
  npcsOf('st_caricuao').push({ x: 26, y: 8, look: 'senora', dir: 'down', name: 'la Tía que Cuida', script: 'tia:cuida' });
  npcsOf('st_sanantonio').push({ x: 20, y: 8, look: 'rival', dir: 'down', name: 'Cheo', showIf: 'ending', script: 'rival5' });

  // ---- la gente de las estaciones nuevas (world bible §2-8, una voz por identidad) -----
  const say = (id, x, look, name, lines) => npcsOf(id).push({ x, y: 8, look, dir: 'down', name, text: lines });
  say('st_elsilencio', 6, 'senora', 'Señora de las Arcadas',
    ['Estas torres gemelas fueron las primeras en mirar la ciudad desde arriba. Ahora miran la hora fantasma, que es más entretenida.',
     'El oeste empieza aquí, mijo. De aquí pa\'llá, el monte se va comiendo las fábricas con paciencia de abuela.']);
  say('st_capuchinos', 6, 'vieja', 'Beata de la Capilla',
    ['¿Oyes ese silencio? Es la capilla de arriba, que se cuela por la rejilla. Hasta los espantos bajan la voz.',
     'Por ese túnel se va a los Teatros... cuando la Línea 4 quiera abrirte. Las puertas de esta ciudad tienen su genio.']);
  say('st_caricuao', 10, 'chamo', 'Chamo del Parque',
    ['Caricuao es puro parque y familia. Hasta los rabipelados saludan.',
     'La Tía que Cuida cría espantos ajenos como propios. El mío volvió gordo y con mejor carácter que yo.']);
  say('st_ciudaduniversitaria', 6, 'chama', 'Estudiante de Letras',
    ['La UCV es Patrimonio de la Humanidad, ¿sabías? Las nubes de Calder están ahí arriba, flotando en el Aula Magna.',
     'Dicen que el Estudiante Eterno sigue inscrito desde el 87. Lo he visto en la cola del comedor. Nunca avanza.']);
  say('st_labandera', 6, 'buhonero', 'Maletero del Terminal',
    ['¡La Bandera! De aquí salen los buses a todo el país. El andén de la hora fantasma es el más apretado de la red: hasta los espantos viajan con maleta.',
     '¿Pa\' dónde va tanta gente? Pa\' donde se pueda, mijo. Y algunos, de vuelta.']);
  say('st_teatros', 6, 'musico', 'Acomodadora del Municipal',
    ['El Teatro Municipal guarda su terciopelo a oscuras. La acústica de este andén es un regalo suyo.',
     'La hermana de la Coplera enseña por aquí los movimientos definitivos de los iniciales. Solo a quien de verdad canta con su espanto.']);
  say('st_nuevocirco', 6, 'obrero', 'Cronista del Redondel',
    ['El Nuevo Circo fue plaza de toros, terminal, refugio... Ahora es de los bachaqueros de recuerdos. Toda ruina consigue inquilino.',
     'Dicen que el jefe de ellos ni vende ya. Solo colecciona. Eso es peor.']);
  say('st_parquecentral', 12, 'chama', 'Vecina de las Torres',
    ['Vivo en el piso 40. Cuando hay apagón, la Ingeniera sube por las escaleras a encender la ciudad a mano.',
     'Del techo sale el Metrocable a San Agustín: la cuna de la salsa, mijo. Arriba se rumbea hasta en la niebla.']);
  say('st_bellomonte', 6, 'operador', 'Operador de Medio Turno',
    ['Bello Monte: la estación que quedó a medio hacer. Las luces prenden, los trenes no llegan. Casi.',
     'De aquí pa\'bajo ya no es Metro: es memoria con rieles. Persígnate o silba, lo que te salga primero.']);
  say('st_aliprimera', 6, 'musico', 'Cantor del Páramo',
    ['Alí decía que los que mueren por la vida no pueden llamarse muertos. Por eso esta línea canta bajito.',
     'De aquí subiendo, la niebla cuenta a los que pasan. No te asustes si te saluda por tu nombre.']);
  say('st_independencia', 10, 'vieja', 'Portera de la Torre',
    ['La Torre del reloj lleva la cuenta de todo: las horas, los retos y los que se fueron sin despedirse.',
     'Tres pisos, tres retadores. El de arriba le da cuerda al tiempo. Literal.']);
  say('st_zoologico', 26, 'chamo', 'Niño del Safari',
    ['¡En el safari vi un güío ASÍ de grande! Bueno, era una manguera. Pero AL LADO había un güío.',
     'El Baquiano deja entrar a la hora fantasma porque dice que los animales prefieren visitas que no griten.']);
  say('gh_lasmercedes', 8, 'senora', 'la que Cocina',
    ['Esta cocina la dejó una familia entera cuando se fue. Yo le mantengo el fuego bajito, por si vuelven.',
     'El Tren pasa cada noche y deja el olor a hallaca recién hecha. Nadie la ve, pero todos la olemos.']);
})();
