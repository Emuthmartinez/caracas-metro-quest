// Metro Quest — audio: chiptune procedural (sin archivos, sin dependencias).
(() => {
  const MQ = (globalThis.MQ = globalThis.MQ || {});
  let ctx = null, musicTimer = null, current = null, muted = false;

  const N = {}; // nombre -> frecuencia
  {
    const names = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'];
    for (let oct = 2; oct <= 6; oct++)
      names.forEach((n, i) => { N[n + oct] = 440 * Math.pow(2, (oct - 4) + (i - 9) / 12); });
  }

  function beep(freq, dur, type = 'square', vol = 0.06, when = 0, slide = 0) {
    if (!ctx || muted) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noise(dur, vol = 0.05, when = 0) {
    if (!ctx || muted) return;
    const t = ctx.currentTime + when;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = buf;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(g).connect(ctx.destination);
    s.start(t);
  }

  const SFX = {
    blip: () => beep(880, 0.05, 'square', 0.03),
    sel: () => { beep(660, 0.06); beep(990, 0.08, 'square', 0.05, 0.06); },
    bump: () => beep(120, 0.08, 'triangle', 0.07),
    hit: () => { noise(0.12, 0.08); beep(160, 0.12, 'sawtooth', 0.05, 0, -80); },
    eff: () => { noise(0.18, 0.1); beep(420, 0.18, 'sawtooth', 0.06, 0, -300); },
    weak: () => beep(300, 0.1, 'triangle', 0.04),
    heal: () => [523, 659, 784, 1046].forEach((f, i) => beep(f, 0.1, 'triangle', 0.05, i * 0.08)),
    ficha: () => { beep(1318, 0.07, 'square', 0.05); beep(1760, 0.1, 'square', 0.05, 0.08); },
    catch: () => [392, 523, 659, 784].forEach((f, i) => beep(f, 0.12, 'square', 0.05, i * 0.1)),
    flee: () => beep(700, 0.25, 'sawtooth', 0.04, 0, -500),
    lvl: () => [523, 659, 784, 1046, 1318].forEach((f, i) => beep(f, 0.09, 'square', 0.04, i * 0.07)),
    faint: () => beep(400, 0.4, 'sawtooth', 0.06, 0, -350),
    train: () => { noise(0.5, 0.04); beep(220, 0.5, 'triangle', 0.03, 0, 60); },
    whistle: () => { beep(1100, 0.5, 'sine', 0.05, 0, 500); beep(1400, 0.5, 'sine', 0.04, 0.55, -600); },
  };

  // Pistas: [nota|null, duración en pasos] — paso = semicorchea aprox.
  const bass = (seq) => seq.map(([n, d]) => [n, d, 'triangle', 0.05]);
  const TRACKS = {
    // Joropo-ish 3/4 para el título: arpa de cuerdas cuadradas.
    title: { bpm: 168, seq: [
      ['E4',1],['G4',1],['B4',1],['E5',1],['B4',1],['G4',1],
      ['C4',1],['E4',1],['G4',1],['C5',1],['G4',1],['E4',1],
      ['D4',1],['Fs4',1],['A4',1],['D5',1],['A4',1],['Fs4',1],
      ['B3',1],['Ds4',1],['Fs4',1],['B4',1],['Fs4',1],['Ds4',1],
    ] },
    town: { bpm: 110, seq: [
      ['G4',2],['B4',2],['D5',3],[null,1],['E5',2],['D5',2],['B4',3],[null,1],
      ['C5',2],['B4',2],['A4',3],[null,1],['B4',2],['A4',2],['G4',3],[null,1],
    ] },
    tunnel: { bpm: 96, seq: bass([
      ['E3',3],[null,1],['G3',3],[null,1],['E3',3],[null,1],['B2',3],[null,1],
      ['C3',3],[null,1],['E3',3],[null,1],['B2',3],[null,1],['As2',3],[null,1],
    ]) },
    battle: { bpm: 150, seq: [
      ['A3',1],['A3',1],['C4',1],['A3',1],['E4',1],['A3',1],['G4',2],
      ['F4',1],['F4',1],['A3',1],['F4',1],['E4',1],['D4',1],['C4',2],
      ['A3',1],['A3',1],['C4',1],['A3',1],['E4',1],['G4',1],['A4',2],
      ['G4',1],['E4',1],['D4',1],['E4',1],['C4',1],['D4',1],['E4',2],
    ] },
    boss: { bpm: 160, seq: [
      ['D3',1],['D3',1],['D4',1],['D3',1],['Cs4',1],['D3',1],['C4',1],['D3',1],
      ['As3',1],['D3',1],['A3',1],['D3',1],['G3',1],['Gs3',1],['A3',2],
    ] },
    ghost: { bpm: 80, seq: [
      ['B3',4],['D4',4],['F4',4],['E4',2],['Ds4',2],
      ['B3',4],['As3',4],['B3',4],[null,4],
    ] },
    gaita: { bpm: 132, seq: [ // victoria
      ['C5',2],['C5',1],['B4',1],['A4',2],['G4',2],['F4',2],['G4',2],['A4',2],['F4',2],
      ['G4',2],['G4',1],['A4',1],['B4',2],['C5',2],['D5',2],['B4',2],['C5',4],
    ] },
  };

  MQ.audio = {
    unlock() {
      if (!ctx) {
        try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
        if (this._wanted) this.music(this._wanted);
      }
      if (ctx.state === 'suspended') ctx.resume();
    },
    sfx(name) { if (ctx && SFX[name]) SFX[name](); },
    cry(id) {
      const c = MQ.CRIES && MQ.CRIES[id];
      if (!ctx || !c) return;
      for (const s of c) {
        if (s[0] === 'n') noise(s[1], s[2], s[3]);
        else beep(s[1], s[2], s[3], s[4], s[5], s[6] || 0);
      }
    },
    music(name) {
      this._wanted = name;
      if (!ctx) return;
      if (current === name) return;
      this.stop();
      current = name;
      const tr = TRACKS[name];
      if (!tr) return;
      const stepDur = 60 / tr.bpm / 2;
      let i = 0;
      const tick = () => {
        const [note, d, type, vol] = tr.seq[i % tr.seq.length];
        if (note && !muted) beep(N[note], stepDur * d * 0.9, type || 'square', vol ?? 0.035);
        i++;
        musicTimer = setTimeout(tick, stepDur * d * 1000);
      };
      tick();
    },
    stop() { clearTimeout(musicTimer); musicTimer = null; current = null; },
    toggleMute() { muted = !muted; return muted; },
    get muted() { return muted; },
  };
})();
