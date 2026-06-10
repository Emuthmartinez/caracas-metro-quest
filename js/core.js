// Metro Quest — núcleo: constantes, entrada, texto y cajas de diálogo.
(() => {
  const MQ = (globalThis.MQ = globalThis.MQ || {});

  MQ.TILE = 16;
  MQ.VIEW_W = 20;  // tiles visibles
  MQ.VIEW_H = 18;
  MQ.W = MQ.TILE * MQ.VIEW_W;   // 320
  MQ.H = MQ.TILE * MQ.VIEW_H;   // 288

  MQ.rand = (n) => Math.floor(Math.random() * n);
  MQ.pick = (arr) => arr[MQ.rand(arr.length)];
  MQ.clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---- Entrada -------------------------------------------------------------
  // held: direcciones sostenidas (para caminar). pressed: golpes discretos.
  const input = (MQ.input = {
    held: {},
    queue: [],
    press(k) { this.queue.push(k); },
    next() { return this.queue.shift() || null; },
    clear() { this.queue.length = 0; },
  });

  const KEYMAP = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right',
    W: 'up', S: 'down', A: 'left', D: 'right',
    z: 'a', Z: 'a', ' ': 'a', x: 'b', X: 'b', Escape: 'b', Enter: 'start',
  };

  addEventListener('keydown', (e) => {
    const k = KEYMAP[e.key];
    if (!k) return;
    e.preventDefault();
    if (!input.held[k]) input.press(k);
    input.held[k] = true;
    MQ.audio && MQ.audio.unlock();
  });
  addEventListener('keyup', (e) => {
    const k = KEYMAP[e.key];
    if (k) input.held[k] = false;
  });

  addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.pb').forEach((btn) => {
      const k = btn.dataset.k;
      if (k === 'none') return;
      const down = (e) => { e.preventDefault(); if (!input.held[k]) input.press(k); input.held[k] = true; MQ.audio && MQ.audio.unlock(); };
      const up = (e) => { e.preventDefault(); input.held[k] = false; };
      btn.addEventListener('touchstart', down, { passive: false });
      btn.addEventListener('touchend', up, { passive: false });
      btn.addEventListener('mousedown', down);
      btn.addEventListener('mouseup', up);
      btn.addEventListener('mouseleave', up);
    });
  });

  // ---- Texto ---------------------------------------------------------------
  MQ.FONT = '8px ui-monospace, Menlo, Consolas, monospace';
  MQ.FONT_B = 'bold 8px ui-monospace, Menlo, Consolas, monospace';

  MQ.wrap = (ctx, text, maxW) => {
    ctx.font = MQ.FONT;
    const out = [];
    for (const para of String(text).split('\n')) {
      let line = '';
      for (const word of para.split(' ')) {
        const t = line ? line + ' ' + word : word;
        if (ctx.measureText(t).width <= maxW) line = t;
        else { if (line) out.push(line); line = word; }
      }
      out.push(line);
    }
    return out;
  };

  MQ.panel = (ctx, x, y, w, h, opts = {}) => {
    ctx.fillStyle = opts.bg || '#101020';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = opts.border || '#e8dfc8';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    ctx.strokeStyle = opts.border2 || '#f5a623';
    ctx.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
  };

  // Caja de diálogo con páginas. say(texto) -> promesa-like via callback.
  MQ.Textbox = class {
    constructor() { this.pages = []; this.lines = []; this.done = null; this.speaker = ''; }
    open(ctx, text, done, speaker = '') {
      const all = MQ.wrap(ctx, text, MQ.W - 28);
      this.pages = [];
      for (let i = 0; i < all.length; i += 3) this.pages.push(all.slice(i, i + 3));
      this.lines = this.pages.shift() || [''];
      this.done = done;
      this.speaker = speaker;
    }
    get active() { return this.lines.length > 0; }
    advance() {
      if (!this.active) return;
      MQ.audio && MQ.audio.sfx('blip');
      if (this.pages.length) this.lines = this.pages.shift();
      else { this.lines = []; const d = this.done; this.done = null; d && d(); }
    }
    draw(ctx) {
      if (!this.active) return;
      const h = 58, y = MQ.H - h;
      MQ.panel(ctx, 0, y, MQ.W, h);
      ctx.fillStyle = '#e8dfc8';
      ctx.font = MQ.FONT;
      ctx.textBaseline = 'top';
      if (this.speaker) {
        MQ.panel(ctx, 6, y - 13, ctx.measureText(this.speaker).width + 14, 16, { border2: '#101020' });
        ctx.fillStyle = '#f5a623';
        ctx.fillText(this.speaker, 13, y - 8);
        ctx.fillStyle = '#e8dfc8';
      }
      this.lines.forEach((l, i) => ctx.fillText(l, 12, y + 11 + i * 13));
      if ((performance.now() / 400 | 0) % 2) {
        ctx.fillStyle = '#f5a623';
        ctx.fillText('▼', MQ.W - 16, y + h - 13);
      }
    }
  };

  // Menú vertical reutilizable.
  MQ.Menu = class {
    constructor(items, opts = {}) {
      this.items = items;           // [{label, sub?, value}]
      this.i = 0;
      this.x = opts.x ?? 8; this.y = opts.y ?? 8;
      this.w = opts.w ?? 120;
      this.title = opts.title || '';
      this.onPick = opts.onPick || (() => {});
      this.onCancel = opts.onCancel || (() => {});
      this.rows = opts.rows ?? 8;   // visibles
      this.top = 0;
    }
    press(k) {
      if (k === 'up') { this.i = (this.i + this.items.length - 1) % this.items.length; MQ.audio.sfx('blip'); }
      else if (k === 'down') { this.i = (this.i + 1) % this.items.length; MQ.audio.sfx('blip'); }
      else if (k === 'a') { MQ.audio.sfx('sel'); this.onPick(this.items[this.i], this.i); }
      else if (k === 'b' || k === 'start') { this.onCancel(); }
      if (this.i < this.top) this.top = this.i;
      if (this.i >= this.top + this.rows) this.top = this.i - this.rows + 1;
    }
    draw(ctx) {
      const n = Math.min(this.items.length, this.rows);
      const h = n * 13 + 16 + (this.title ? 12 : 0);
      MQ.panel(ctx, this.x, this.y, this.w, h);
      ctx.font = MQ.FONT; ctx.textBaseline = 'top';
      let y = this.y + 9;
      if (this.title) { ctx.fillStyle = '#f5a623'; ctx.fillText(this.title, this.x + 10, y); y += 12; }
      for (let r = 0; r < n; r++) {
        const idx = this.top + r;
        const it = this.items[idx];
        if (!it) break;
        ctx.fillStyle = idx === this.i ? '#f5a623' : '#e8dfc8';
        ctx.fillText((idx === this.i ? '▶' : ' ') + it.label, this.x + 8, y);
        if (it.sub) {
          ctx.fillStyle = '#8a8aa0';
          ctx.fillText(it.sub, this.x + this.w - 8 - ctx.measureText(it.sub).width, y);
        }
        y += 13;
      }
    }
  };
})();
