// Re-sintetiza el soundtrack de una sesión grabada (mismo motor que js/audio.js,
// renderizado offline) y lo escribe como WAV para muxearlo al video.
// Uso: node tests/render-audio.js <duración_seg> [/tmp/audlog.json] [/tmp/soundtrack.wav]
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SR = 44100;

// los gritos de las criaturas viven en js/dex.js (MQ.CRIES) — cárgalos de verdad
const CRIES = (() => {
  const sb = { console };
  sb.globalThis = sb;
  vm.createContext(sb);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'dex.js'), 'utf8'), sb);
  return sb.MQ.CRIES;
})();

// ---- tabla de notas (idéntica a js/audio.js) ----
const N = {};
{
  const names = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'];
  for (let oct = 2; oct <= 6; oct++)
    names.forEach((n, i) => { N[n + oct] = 440 * Math.pow(2, (oct - 4) + (i - 9) / 12); });
}

const bass = (seq) => seq.map(([n, d]) => [n, d, 'triangle', 0.05]);
const TRACKS = {
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
  calle: { bpm: 124, seq: [
    ['C4',1],['E4',1],['G4',1],['A4',1],['G4',2],['E4',2],
    ['F4',1],['A4',1],['C5',1],['D5',1],['C5',2],['A4',2],
    ['G4',1],['B4',1],['D5',1],['E5',1],['D5',2],['B4',2],
    ['C5',2],['G4',2],['E4',2],['C4',2],
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
  gaita: { bpm: 132, seq: [
    ['C5',2],['C5',1],['B4',1],['A4',2],['G4',2],['F4',2],['G4',2],['A4',2],['F4',2],
    ['G4',2],['G4',1],['A4',1],['B4',2],['C5',2],['D5',2],['B4',2],['C5',4],
  ] },
};

// ---- efectos: [tipo, freq, dur, onda, vol, cuándo, slide] ó ['n', dur, vol, cuándo]
const SFX = {
  blip: [['b', 880, 0.05, 'square', 0.03, 0, 0]],
  sel: [['b', 660, 0.06, 'square', 0.06, 0, 0], ['b', 990, 0.08, 'square', 0.05, 0.06, 0]],
  bump: [['b', 120, 0.08, 'triangle', 0.07, 0, 0]],
  hit: [['n', 0.12, 0.08, 0], ['b', 160, 0.12, 'sawtooth', 0.05, 0, -80]],
  eff: [['n', 0.18, 0.1, 0], ['b', 420, 0.18, 'sawtooth', 0.06, 0, -300]],
  weak: [['b', 300, 0.1, 'triangle', 0.04, 0, 0]],
  heal: [523, 659, 784, 1046].map((f, i) => ['b', f, 0.1, 'triangle', 0.05, i * 0.08, 0]),
  ficha: [['b', 1318, 0.07, 'square', 0.05, 0, 0], ['b', 1760, 0.1, 'square', 0.05, 0.08, 0]],
  catch: [392, 523, 659, 784].map((f, i) => ['b', f, 0.12, 'square', 0.05, i * 0.1, 0]),
  flee: [['b', 700, 0.25, 'sawtooth', 0.04, 0, -500]],
  lvl: [523, 659, 784, 1046, 1318].map((f, i) => ['b', f, 0.09, 'square', 0.04, i * 0.07, 0]),
  faint: [['b', 400, 0.4, 'sawtooth', 0.06, 0, -350]],
  train: [['n', 0.5, 0.04, 0], ['b', 220, 0.5, 'triangle', 0.03, 0, 60]],
  riel: [['n', 0.04, 0.03, 0], ['b', 70, 0.06, 'triangle', 0.04, 0, 0]],
  door: [['b', 280, 0.12, 'square', 0.05, 0, 420]],
  doors: [['b', 784, 0.14, 'sine', 0.06, 0, 0], ['b', 659, 0.18, 'sine', 0.05, 0.16, 0]],
  brake: [['b', 1100, 0.5, 'sawtooth', 0.035, 0, -650], ['n', 0.4, 0.03, 0.1]],
  save: [659, 880, 1046, 1318].map((f, i) => ['b', f, 0.08, 'square', 0.045, i * 0.07, 0]),
  victory: [523, 523, 523, 659, 784, 1046].map((f, i) => ['b', f, i === 5 ? 0.3 : 0.09, 'square', 0.05, i * 0.1, 0]).concat([['b', 392, 0.6, 'triangle', 0.04, 0.1, 0]]),
  lowhp: [['b', 880, 0.07, 'square', 0.045, 0, -60]],
  whistle: [['b', 1100, 0.5, 'sine', 0.05, 0, 500], ['b', 1400, 0.5, 'sine', 0.04, 0.55, -600]],
};

// ---- síntesis ----
const durSec = parseFloat(process.argv[2] || '60');
const logPath = process.argv[3] || '/tmp/audlog.json';
const outPath = process.argv[4] || '/tmp/soundtrack.wav';
// corrección opcional de deriva del video grabado: t_video = offset + scale·t_evento
const tScale = parseFloat(process.argv[5] || '1');
const tOffset = parseFloat(process.argv[6] || '0');
const buf = new Float32Array(Math.ceil(durSec * SR));

function osc(type, phase) {
  const p = phase % 1;
  switch (type) {
    case 'square': return p < 0.5 ? 1 : -1;
    case 'triangle': return p < 0.5 ? 4 * p - 1 : 3 - 4 * p;
    case 'sawtooth': return 2 * p - 1;
    default: return Math.sin(2 * Math.PI * p);
  }
}

function beep(freq, dur, type = 'square', vol = 0.06, when = 0, slide = 0) {
  const start = Math.floor(when * SR);
  const n = Math.floor(dur * SR);
  const f1 = Math.max(20, freq + slide);
  const decay = Math.pow(0.0001 / Math.max(vol, 0.0001), 1 / n);
  let phase = 0, g = vol;
  for (let i = 0; i < n; i++) {
    const idx = start + i;
    if (idx >= buf.length) break;
    const f = slide ? freq * Math.pow(f1 / freq, i / n) : freq;
    phase += f / SR;
    buf[idx] += osc(type, phase) * g;
    g *= decay;
  }
}

function noise(dur, vol = 0.05, when = 0) {
  const start = Math.floor(when * SR);
  const n = Math.floor(dur * SR);
  const decay = Math.pow(0.0001 / Math.max(vol, 0.0001), 1 / n);
  let g = vol;
  for (let i = 0; i < n; i++) {
    const idx = start + i;
    if (idx >= buf.length) break;
    buf[idx] += (Math.random() * 2 - 1) * g;
    g *= decay;
  }
}

function renderTrack(name, t0, t1) {
  const tr = TRACKS[name];
  if (!tr) return;
  const stepDur = 60 / tr.bpm / 2;
  let t = t0, i = 0;
  while (t < t1) {
    const [note, d, type, vol] = tr.seq[i % tr.seq.length];
    if (note) beep(N[note], Math.min(stepDur * d * 0.9, t1 - t), type || 'square', vol ?? 0.035, t);
    t += stepDur * d;
    i++;
  }
}

const events = JSON.parse(fs.readFileSync(logPath, 'utf8'))
  .events.map(([t, k, n]) => [tOffset + tScale * t, k, n]);
// segmentos de música: de cada cambio hasta el siguiente
const music = [];
for (const [t, kind, name] of events) {
  if (kind !== 'music') continue;
  if (music.length && music[music.length - 1].name === name) continue;
  if (music.length) music[music.length - 1].end = t;
  music.push({ name, start: t, end: durSec });
}
for (const seg of music) renderTrack(seg.name, seg.start, seg.end);
let nsfx = 0, ncry = 0;
for (const [t, kind, name] of events) {
  const steps = kind === 'sfx' ? SFX[name] : kind === 'cry' ? CRIES[name] : null;
  if (!steps) continue;
  kind === 'sfx' ? nsfx++ : ncry++;
  for (const fx of steps) {
    if (fx[0] === 'n') noise(fx[1], fx[2], t + fx[3]);
    else beep(fx[1], fx[2], fx[3], fx[4], t + fx[5], fx[6]);
  }
}

// limitador suave y WAV de 16 bits
const pcm = Buffer.alloc(buf.length * 2);
for (let i = 0; i < buf.length; i++) {
  const v = Math.tanh(buf[i] * 1.4);
  pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v * 32767))), i * 2);
}
const hdr = Buffer.alloc(44);
hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + pcm.length, 4); hdr.write('WAVE', 8);
hdr.write('fmt ', 12); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(1, 22);
hdr.writeUInt32LE(SR, 24); hdr.writeUInt32LE(SR * 2, 28); hdr.writeUInt16LE(2, 32); hdr.writeUInt16LE(16, 34);
hdr.write('data', 36); hdr.writeUInt32LE(pcm.length, 40);
fs.writeFileSync(outPath, Buffer.concat([hdr, pcm]));
console.log(`soundtrack: ${outPath} · ${durSec}s · ${music.length} segmentos de música (${music.map(m => m.name).join('→')}) · ${nsfx} sfx · ${ncry} gritos`);
