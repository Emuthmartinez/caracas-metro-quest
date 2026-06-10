// Graba un video de gameplay real: título → escoger inicial → andén → túnel → combate.
// Uso: node tests/record.js  → produce /tmp/metro-quest-gameplay.webm
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 660, height: 600 },
    recordVideo: { dir: '/tmp/video', size: { width: 660, height: 600 } },
  });
  const page = await ctx.newPage();
  const tVideo = Date.now(); // el video por página arranca aquí (aprox)
  page.on('dialog', (d) => d.accept('Primo'));
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));

  // registra cada llamada de música/sfx con su tiempo absoluto para
  // re-sintetizar el soundtrack exacto (tests/render-audio.js) y muxearlo
  await page.evaluate(() => {
    window.__aud = [];
    const MQ = window.MQ;
    const om = MQ.audio.music.bind(MQ.audio);
    const os = MQ.audio.sfx.bind(MQ.audio);
    MQ.audio.music = (n) => { window.__aud.push([Date.now(), 'music', n]); om(n); };
    MQ.audio.sfx = (n) => { window.__aud.push([Date.now(), 'sfx', n]); os(n); };
    if (MQ.audio._wanted) window.__aud.push([Date.now(), 'music', MQ.audio._wanted]); // título ya sonando
  });

  const wait = (ms) => page.waitForTimeout(ms);
  const z = async (ms = 500) => { await page.keyboard.press('z'); await wait(ms); };
  const hold = async (key, ms) => { await page.keyboard.down(key); await wait(ms); await page.keyboard.up(key); await wait(120); };
  const state = () => page.evaluate(() => {
    const MQ = window.MQ;
    const s = MQ.scenes[MQ.scenes.length - 1] || {};
    return {
      scenes: MQ.scenes.length,
      tb: !!(s.tb && s.tb.active),
      menu: !!s.menu,
      phase: s.phase || null,
      script: !!s.script,
      map: MQ.player ? MQ.player.map : null,
      x: MQ.player ? MQ.player.x : 0,
      y: MQ.player ? MQ.player.y : 0,
      party: MQ.player ? MQ.player.party.length : 0,
      bagFicha: MQ.player && MQ.player.bag ? MQ.player.bag.ficha || 0 : 0,
      enemyFrac: s.enemy ? s.enemy.hp / s.enemy.maxhp : null,
      mode: s.mode || null,
    };
  });
  const drainText = async (gap = 850, max = 20) => {
    for (let i = 0; i < max; i++) {
      const st = await state();
      if (!st.tb) break;
      await z(gap);
    }
  };
  // camina hasta una casilla exacta, un paso a la vez
  const KEYS = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' };
  const moveTo = async (tx, ty, maxSteps = 40) => {
    for (let i = 0; i < maxSteps; i++) {
      const st = await state();
      if (st.tb) { await drainText(700); continue; }
      if (st.scenes > 1) return; // empezó un combate
      if (st.x === tx && st.y === ty) return;
      const dir = st.x !== tx ? (st.x < tx ? 'right' : 'left') : (st.y < ty ? 'down' : 'up');
      await hold(KEYS[dir], 150);
      await wait(80);
    }
  };

  // — título —
  await wait(3000);
  await z(700);              // splash → menú
  await z(700);              // NUEVA PARTIDA
  await z(900);              // CHAMO (el prompt del nombre se acepta solo)

  // — intro de la abuela —
  await drainText(950);

  // — escoger a Arepito: caminar a (4,4), mirar arriba e interactuar —
  await moveTo(4, 4);
  await hold('ArrowUp', 60);  // solo girar (la mesa bloquea el paso)
  await wait(400);
  await z(800);              // habla con el espanto de la mesa
  await drainText(900);
  let st = await state();
  if (st.menu) await z(800); // «¡Sí, de una!»
  await drainText(900);
  st = await state();
  console.log('tras inicial:', st.party === 1 ? 'arepito fichado ✓' : 'OJO: sin inicial', JSON.stringify(st));

  // — salir de casa: puerta (5,7) —
  await moveTo(5, 6);
  await moveTo(5, 7);
  for (let i = 0; i < 8 && (await state()).map === 'casa'; i++) await hold('ArrowDown', 150);
  await wait(1600);          // banner de Propatria
  await drainText(900);

  // — cruzar el andén hacia el túnel este —
  await moveTo(14, 5);
  await moveTo(24, 5);
  for (let i = 0; i < 8 && (await state()).map === 'propatria'; i++) await hold('ArrowRight', 150);
  await wait(1500);          // banner del túnel
  console.log('mapa:', (await state()).map);

  // — caminar el túnel; pelear lo que salga —
  let battles = 0;
  let inBattle = false;
  let threw = false;
  const start = Date.now();
  while (Date.now() - start < 80000) {
    st = await state();
    if (st.scenes > 1) {
      if (!inBattle) { inBattle = true; battles++; threw = false; }
      if (st.tb) { await z(800); continue; }
      if (st.phase === 'menu') {
        if (!threw && st.enemyFrac !== null && st.enemyFrac <= 0.55 && st.bagFicha > 0) {
          await page.keyboard.press('ArrowDown'); await wait(250);
          await z(500);      // MOCHILA
          threw = true;
          continue;
        }
        await z(450);        // PELEAR
        continue;
      }
      if (st.phase === 'moves' || st.phase === 'bag' || st.phase === 'party' || st.phase === 'learn') { await z(550); continue; }
      await wait(300);
      continue;
    }
    inBattle = false;
    if (battles >= 2) break;
    if (st.tb) { await drainText(800); continue; }
    if (st.map === 'canoamarillo') break;
    // serpentea por la zona oscura del túnel para provocar encuentros
    await hold(KEYS[st.x < 26 ? 'right' : 'left'], 160);
    if (Math.random() < 0.35) await hold(KEYS[Math.random() < 0.5 ? 'down' : 'up'], 160);
  }
  st = await state();
  console.log('final:', st, 'batallas:', battles);
  await wait(2500);

  // vuelca el registro de audio (tiempos relativos al inicio del video)
  const aud = await page.evaluate(() => window.__aud);
  fs.writeFileSync('/tmp/audlog.json', JSON.stringify({
    events: aud.map(([t, kind, name]) => [Math.max(0, (t - tVideo) / 1000), kind, name]),
  }));
  console.log('eventos de audio:', aud.length);

  await ctx.close();
  await browser.close();
  // renombra el video
  const dir = '/tmp/video';
  const f = fs.readdirSync(dir).find((x) => x.endsWith('.webm'));
  fs.copyFileSync(path.join(dir, f), '/tmp/metro-quest-gameplay.webm');
  console.log('video listo: /tmp/metro-quest-gameplay.webm', fs.statSync('/tmp/metro-quest-gameplay.webm').size, 'bytes');
})();
