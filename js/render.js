// Drawing: level tiles, entities, hints, particles, HUD and the title / win screens.
(function (G) {
  const TS = G.Game.TS;
  const S = G.Game.S;
  let canvas, ctx;
  const buttons = [];

  // Background stars for title / win screens.
  const STARS = Array.from({ length: 140 }, () => ({
    x: Math.random() * 960, y: Math.random() * 640,
    s: Math.random() < 0.2 ? 3 : 2, p: Math.random() * Math.PI * 2,
  }));

  const hash = (x, y, i) => {
    const n = Math.sin(x * 127.1 + y * 311.7 + i * 74.7) * 43758.5453;
    return n - Math.floor(n);
  };

  function init(c) {
    canvas = c;
    ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
  }

  function spr(name, x, y, size = TS) {
    ctx.drawImage(G.Sprites.get(name), Math.round(x), Math.round(y), size, size);
  }

  // Chunky 4-point sparkle.
  function sparkle(cx, cy, size, color, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    const u = Math.max(2, Math.round(size / 3));
    ctx.fillRect(cx - u / 2, cy - size, u, size * 2);
    ctx.fillRect(cx - size, cy - u / 2, size * 2, u);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - u / 2, cy - u / 2, u, u);
    ctx.globalAlpha = 1;
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---------- Level ----------
  function drawSpaceTile(x, y) {
    ctx.fillStyle = '#070916';
    ctx.fillRect(x * TS, y * TS, TS, TS);
    for (let i = 0; i < 3; i++) {
      const sx = x * TS + Math.floor(hash(x, y, i) * 15) * 4;
      const sy = y * TS + Math.floor(hash(y, x, i + 7) * 15) * 4;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(S.time * (0.8 + hash(x, y, i + 3)) + i * 2));
      ctx.globalAlpha = tw;
      ctx.fillStyle = i === 0 ? '#ffffff' : '#9fb4ff';
      ctx.fillRect(sx, sy, i === 0 ? 4 : 2, i === 0 ? 4 : 2);
    }
    ctx.globalAlpha = 1;
  }

  // Each world of 10 levels has its own wall and floor colors.
  const themeOf = i => Math.min(G.Sprites.THEME_COUNT - 1, Math.floor(i / G.Game.PER_PAGE));

  function drawTiles() {
    const w = S.world;
    const theme = themeOf(S.levelIndex);
    // Only draw what's on screen (big levels scroll).
    const x0 = Math.max(0, Math.floor(S.cam.x / TS));
    const y0 = Math.max(0, Math.floor(S.cam.y / TS));
    const x1 = Math.min(w.w - 1, Math.floor((S.cam.x + canvas.width) / TS));
    const y1 = Math.min(w.h - 1, Math.floor((S.cam.y + canvas.height) / TS));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const t = G.Rules.tileAt(w, x, y);
        if (t === '#') {
          if (S.isSpace[y][x]) drawSpaceTile(x, y);
          else spr(`wall_${theme}`, x * TS, y * TS);
          continue;
        }
        if (t === '~') {
          spr('ice', x * TS, y * TS);
          continue;
        }
        if (t === '_') {
          drawPit(x, y);
          continue;
        }
        spr(`floor_${theme}`, x * TS, y * TS);
        if (w.grid[y][x] === '_') {
          // A hole filled in by a crate.
          ctx.fillStyle = 'rgba(184,106,0,0.55)';
          ctx.fillRect(x * TS + 6, y * TS + 6, TS - 12, TS - 12);
          continue;
        }
        if (t === 'O') { drawBlackHole(x, y); continue; }
        if (t === '*') { drawCracks(x, y, w.cracked.some(c => c.x === x && c.y === y)); continue; }
        if (t === 'J') { drawJumpPad(x, y); continue; }
        if (G.Rules.ONE_WAY[t]) { drawOneWay(x, y, G.Rules.ONE_WAY[t]); continue; }
        if (t === 's') { drawColorSwitch(x, y); continue; }
        if (t === 'm' || t === 'c') { drawLoweredBlock(x, y, t); continue; }
        if (t === 'q') { spr(S.litCrystals.has(y * w.w + x) ? 'crystal_on' : 'crystal_off', x * TS, y * TS); continue; }
        if (t === 'd') {
          drawTimerButton(x, y);
          continue;
        }
        if (t === 'o') {
          const covered = w.crates.some(c => c.x === x && c.y === y);
          spr(covered ? 'pad_on' : 'pad_off', x * TS, y * TS);
        } else if (t === '+') {
          const pressed = w.crates.some(c => c.x === x && c.y === y) || (w.player.x === x && w.player.y === y);
          spr(pressed ? 'button_on' : 'button_off', x * TS, y * TS);
        } else if (t === 'T') {
          drawPortal(x, y, w.teleports.find(p => p.x === x && p.y === y).id);
        } else if (G.Rules.CONVEYORS[t]) {
          drawConveyor(x, y, t);
        }
      }
    }
    S.doorFrames.forEach(d => spr('doorOpen', d.x * TS, d.y * TS));
  }

  // ---------- New floor pieces ----------
  function drawPit(x, y) {
    ctx.fillStyle = '#03040b';
    ctx.fillRect(x * TS, y * TS, TS, TS);
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(S.time * (0.7 + hash(x, y, i)) + i));
      ctx.fillStyle = '#9fb4ff';
      ctx.fillRect(x * TS + 8 + Math.floor(hash(x, y, i + 1) * 12) * 4, y * TS + 12 + Math.floor(hash(y, x, i + 2) * 10) * 4, 2, 2);
    }
    ctx.globalAlpha = 1;
    // Shadowed rim so it reads as a hole.
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x * TS, y * TS, TS, 10);
    ctx.fillStyle = 'rgba(120,130,170,0.35)';
    ctx.fillRect(x * TS, y * TS + TS - 4, TS, 4);
  }

  // Crumbly floor: hairline cracks, then big dark cracks once it's been stepped on.
  function drawCracks(x, y, cracked) {
    ctx.strokeStyle = cracked ? 'rgba(0,0,0,0.95)' : 'rgba(10,10,20,0.6)';
    ctx.lineWidth = cracked ? 6 : 3;
    ctx.beginPath();
    const px = x * TS;
    const py = y * TS;
    ctx.moveTo(px + 10, py + 12); ctx.lineTo(px + 26, py + 28); ctx.lineTo(px + 22, py + 44); ctx.lineTo(px + 34, py + 56);
    ctx.moveTo(px + 26, py + 28); ctx.lineTo(px + 44, py + 24); ctx.lineTo(px + 54, py + 10);
    ctx.moveTo(px + 44, py + 24); ctx.lineTo(px + 50, py + 44);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(px + 4, py + 4, TS - 8, TS - 8);
  }

  // Jump pad: a spring under a yellow launch plate. When used, the plate springs up and
  // tips toward the jump, so it's clear the pad throws you over the next tile.
  function drawJumpPad(x, y) {
    const cx = (x + 0.5) * TS;
    const cy = (y + 0.5) * TS;
    const anim = S.padAnims.find(a => a.x === x && a.y === y);
    // Launch: shoot up fast, then settle back (0..1..0 over half a second).
    const k = anim ? Math.sin(Math.min(1, anim.t / 0.5) * Math.PI) : 0;
    const idle = 1 + Math.sin(S.time * 6 + x * 1.7) * 0.06;
    const lift = anim ? 10 + k * 26 : 12 * idle;
    const tilt = anim ? anim.dx * 0.6 * k : 0; // sideways jumps tip the plate
    // Base plate
    ctx.fillStyle = '#161a2e';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 12, 25, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6e6e7e';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 10, 22, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // Zig-zag spring
    ctx.strokeStyle = '#161a2e';
    ctx.lineWidth = 6;
    const zig = () => {
      ctx.beginPath();
      const turns = 4;
      for (let i = 0; i <= turns; i++) {
        const yy = cy + 8 - (lift * i) / turns;
        const xx = cx + (i % 2 ? 11 : -11) + tilt * 8 * (i / turns);
        if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
    };
    zig();
    ctx.strokeStyle = '#c3cbe0';
    ctx.lineWidth = 3;
    zig();
    // Launch plate on top, tipping toward the jump (up/down jumps squash it instead)
    ctx.save();
    ctx.translate(cx + tilt * 8, cy + 8 - lift);
    ctx.rotate(tilt);
    const squashY = anim && anim.dy ? 1 + 0.4 * k : 1;
    ctx.scale(1, squashY);
    ctx.fillStyle = '#161a2e';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd32a';
    ctx.beginPath();
    ctx.ellipse(0, -1, 17, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3a8';
    ctx.fillRect(-9, -4, 9, 2);
    ctx.restore();
  }

  // Dotted arcs from each jump pad over whatever it lets you cross (a hole, a laser, a crate...),
  // ending in a little arrow where you'll land.
  function drawJumpArcs() {
    const w = S.world;
    for (let y = 0; y < w.h; y++) {
      for (let x = 0; x < w.w; x++) {
        if (w.grid[y][x] !== 'J') continue;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const ox = x + dx;
          const oy = y + dy;
          const lx = x + 2 * dx;
          const ly = y + 2 * dy;
          if (lx < 0 || ly < 0 || lx >= w.w || ly >= w.h || w.grid[oy][ox] === '#') continue;
          if (!G.Rules.isOpen(w, lx, ly, dx, dy)) continue;
          if (G.Rules.isOpen(w, ox, oy, dx, dy)) continue; // nothing to jump over this way
          const x0 = (x + 0.5) * TS;
          const y0 = (y + 0.5) * TS;
          const x1 = (lx + 0.5) * TS;
          const y1 = (ly + 0.5) * TS;
          // Dots light up one after another along the arc, like a little "whoosh" preview.
          const n = 8;
          for (let i = 1; i < n; i++) {
            const t = i / n;
            const hx = x0 + (x1 - x0) * t;
            const hy = y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * TS * 0.9;
            const wave = 0.5 + 0.5 * Math.sin(S.time * 5 - i * 0.8);
            ctx.globalAlpha = 0.45 + 0.5 * wave;
            ctx.fillStyle = '#161a2e';
            ctx.beginPath();
            ctx.arc(hx, hy, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffe66d';
            ctx.beginPath();
            ctx.arc(hx, hy, 5, 0, Math.PI * 2);
            ctx.fill();
          }
          // Arrowhead pointing down at the landing tile
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = '#161a2e';
          ctx.beginPath();
          ctx.moveTo(x1, y1 + 10);
          ctx.lineTo(x1 - 12, y1 - 7);
          ctx.lineTo(x1 + 12, y1 - 7);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#ffe66d';
          ctx.beginPath();
          ctx.moveTo(x1, y1 + 6);
          ctx.lineTo(x1 - 8, y1 - 5);
          ctx.lineTo(x1 + 8, y1 - 5);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  function drawOneWay(x, y, [dx, dy]) {
    ctx.save();
    ctx.translate((x + 0.5) * TS, (y + 0.5) * TS);
    ctx.rotate(Math.atan2(dy, dx));
    const pulse = 0.55 + 0.35 * Math.sin(S.time * 4 - x - y);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#4fe3ff';
    for (const ox of [-12, 8]) {
      ctx.beginPath();
      ctx.moveTo(ox - 6, -18);
      ctx.lineTo(ox + 10, 0);
      ctx.lineTo(ox - 6, 18);
      ctx.lineTo(ox - 14, 18);
      ctx.lineTo(ox + 2, 0);
      ctx.lineTo(ox - 14, -18);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  const BLOCK_COLORS = { m: ['#ff6fc8', '#b83d8a', '#ffc0ea'], c: ['#4fe3ff', '#2a9bb8', '#c8f8ff'] };

  function drawColorSwitch(x, y) {
    const cx = (x + 0.5) * TS;
    const cy = (y + 0.5) * TS;
    ctx.fillStyle = '#161a2e';
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();
    const up = S.world.color === 0 ? 'm' : 'c';
    const down = up === 'm' ? 'c' : 'm';
    ctx.fillStyle = BLOCK_COLORS[down][1];
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = BLOCK_COLORS[up][0];
    ctx.beginPath();
    ctx.arc(cx, cy, 18, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(cx - 8, cy - 12, 6, 4);
  }

  function drawLoweredBlock(x, y, t) {
    if ((t === 'm' && S.world.color === 0) || (t === 'c' && S.world.color === 1)) return; // raised: drawn later
    ctx.strokeStyle = BLOCK_COLORS[t][0];
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 5]);
    ctx.strokeRect(x * TS + 6, y * TS + 6, TS - 12, TS - 12);
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  // Raised color blocks stand up like solid bricks.
  function drawRaisedBlocks() {
    const w = S.world;
    for (let y = 0; y < w.h; y++) {
      for (let x = 0; x < w.w; x++) {
        const t = w.grid[y][x];
        if (!((t === 'm' && w.color === 0) || (t === 'c' && w.color === 1))) continue;
        const [main, dark, light] = BLOCK_COLORS[t];
        const px = x * TS;
        const py = y * TS;
        ctx.fillStyle = '#161a2e';
        ctx.fillRect(px + 2, py + 2, TS - 4, TS - 2);
        ctx.fillStyle = dark;
        ctx.fillRect(px + 4, py + 12, TS - 8, TS - 14);
        ctx.fillStyle = main;
        ctx.fillRect(px + 4, py + 4, TS - 8, TS - 18);
        ctx.fillStyle = light;
        ctx.fillRect(px + 8, py + 8, TS - 16, 4);
      }
    }
  }

  function drawLevers() {
    const w = S.world;
    for (let y = 0; y < w.h; y++) {
      for (let x = 0; x < w.w; x++) {
        if (w.grid[y][x] !== 'L') continue;
        const cx = (x + 0.5) * TS;
        const cy = (y + 0.5) * TS;
        const a = -0.7 + S.leverAnim * 1.4;
        ctx.fillStyle = '#161a2e';
        ctx.fillRect(cx - 22, cy + 8, 44, 16);
        ctx.fillStyle = '#8a93ad';
        ctx.fillRect(cx - 20, cy + 10, 40, 12);
        ctx.save();
        ctx.translate(cx, cy + 14);
        ctx.rotate(a);
        ctx.fillStyle = '#161a2e';
        ctx.fillRect(-5, -34, 10, 34);
        ctx.fillStyle = '#c3cbe0';
        ctx.fillRect(-3, -32, 6, 32);
        ctx.fillStyle = S.world.lever ? '#2ed573' : '#ff4757';
        ctx.beginPath();
        ctx.arc(0, -34, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillRect(-4, -39, 4, 3);
        ctx.restore();
      }
    }
  }

  function drawMirrors() {
    for (const m of S.world.mirrors) {
      const cx = (m.x + 0.5) * TS;
      const cy = (m.y + 0.5) * TS;
      const sh = S.shakes.find(s => s.x === m.x && s.y === m.y);
      ctx.fillStyle = '#161a2e';
      ctx.beginPath();
      ctx.arc(cx, cy + 4, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4a5068';
      ctx.beginPath();
      ctx.arc(cx, cy + 4, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((m.o === '/' ? -Math.PI / 4 : Math.PI / 4) + (sh ? Math.sin(sh.t * 40) * 0.1 : 0));
      ctx.fillStyle = '#161a2e';
      ctx.fillRect(-28, -7, 56, 14);
      ctx.fillStyle = '#bfe6ff';
      ctx.fillRect(-26, -5, 52, 10);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-20, -3, 22, 3);
      ctx.restore();
    }
  }

  function drawBlackHole(x, y) {
    const cx = (x + 0.5) * TS;
    const cy = (y + 0.5) * TS;
    // Faint rings show how far the pull reaches (two tiles).
    ctx.strokeStyle = 'rgba(184,107,255,0.25)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 10]);
    ctx.lineDashOffset = S.time * 30;
    ctx.beginPath();
    ctx.arc(cx, cy, TS * 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, TS * 0.55);
    grad.addColorStop(0, '#000000');
    grad.addColorStop(0.55, '#1a0833');
    grad.addColorStop(0.8, '#7a3fc0');
    grad.addColorStop(1, 'rgba(122,63,192,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, TS * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d6b8ff';
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const a = S.time * 2.5 + (i * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 14 + i * 4, a, a + 1.4);
      ctx.stroke();
    }
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawAliens() {
    for (const a of S.world.aliens) {
      const sh = S.shakes.find(s => s.x === a.x && s.y === a.y);
      const off = sh ? Math.sin(sh.t * 50) * 5 * (1 - sh.t / 0.4) : 0;
      spr('alien', a.x * TS + off, a.y * TS + Math.sin(S.time * 3 + a.x) * 2);
    }
    // Happy aliens float away.
    for (const a of S.alienAnims) {
      ctx.globalAlpha = Math.max(0, 1 - a.t / 1.2);
      spr('alien_happy', a.x * TS + Math.sin(a.t * 8) * 6, a.y * TS - a.t * 60);
      ctx.globalAlpha = 1;
    }
  }

  function drawItems() {
    const items = S.world.items
      .concat(pendingOf('fruit').map(e => ({ x: e.x, y: e.y, kind: 'f' })))
      .concat(pendingOf('shield').map(e => ({ x: e.x, y: e.y, kind: 'h' })));
    for (const it of items) {
      const bob = Math.sin(S.time * 3 + it.x) * 4;
      spr(it.kind === 'f' ? 'fruit' : 'helmet', it.x * TS, it.y * TS + bob);
      if (it.kind === 'h') sparkle(it.x * TS + 50, it.y * TS + 12 + bob, 5 + Math.sin(S.time * 5) * 2, '#4fe3ff');
    }
  }

  // Timer button: a purple pad with a clock whose hand sweeps while the countdown runs.
  function drawTimerButton(x, y) {
    const w = S.world;
    const pressed = w.crates.some(c => c.x === x && c.y === y) || (w.player.x === x && w.player.y === y);
    const running = w.timer > 0 || pressed;
    spr(running ? 'timer_on' : 'timer_off', x * TS, y * TS);
    const cx = (x + 0.5) * TS;
    const cy = (y + 0.5) * TS;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 13, 0, Math.PI * 2);
    ctx.stroke();
    const frac = pressed ? 1 : w.timer / w.timerMax;
    const a = -Math.PI / 2 + (running ? (1 - frac) * Math.PI * 2 : 0);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * 10, cy + Math.sin(a) * 10);
    ctx.stroke();
  }

  // Timed doors: purple doors that slide open while the countdown runs. A row of lights
  // along the top shows how much time is left.
  function drawTimedDoors() {
    const w = S.world;
    const closed = 1 - S.timedVis;
    const pressed = w.timers.some(b => w.crates.some(c => c.x === b.x && c.y === b.y) || (w.player.x === b.x && w.player.y === b.y));
    const frac = pressed ? 1 : w.timer / w.timerMax;
    const lights = 5;
    for (let y = 0; y < w.h; y++) {
      for (let x = 0; x < w.w; x++) {
        if (w.grid[y][x] !== 'D') continue;
        const sh = S.shakes.find(s => s.x === x && s.y === y);
        const off = sh ? Math.sin(sh.t * 50) * 5 * (1 - sh.t / 0.4) : 0;
        const px = x * TS + off;
        const py = y * TS;
        spr('doorOpen', px, py);
        if (closed > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(px, py, TS, TS);
          ctx.clip();
          spr('door_timed', px, py - (1 - closed) * TS);
          ctx.restore();
        }
        for (let i = 0; i < lights; i++) {
          const on = frac > 0 && i < Math.ceil(frac * lights);
          const blink = frac > 0 && frac <= 0.3 && Math.floor(S.time * 6) % 2 === 0;
          ctx.fillStyle = on && !blink ? '#ffd32a' : 'rgba(22,26,46,0.9)';
          ctx.fillRect(px + 9 + i * 10, py + 3, 7, 6);
        }
      }
    }
  }

  const PORTAL_COLORS = { 1: '#b86bff', 2: '#4fe3ff', 3: '#ff9ff3', 4: '#2ed573' };

  function drawPortal(x, y, id) {
    const cx = (x + 0.5) * TS;
    const cy = (y + 0.5) * TS;
    const col = PORTAL_COLORS[id] || '#b86bff';
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, TS * 0.45);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, col);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, TS * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 6;
    ctx.setLineDash([10, 7]);
    ctx.lineDashOffset = -S.time * 40;
    ctx.beginPath();
    ctx.arc(cx, cy, TS * 0.38, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineDashOffset = S.time * 30;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, TS * 0.24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawConveyor(x, y, t) {
    let [dx, dy] = G.Rules.CONVEYORS[t];
    // In levels where the lever turns the belts around, draw them the way they now run.
    if (S.world.leverBelts && S.world.lever) { dx = -dx; dy = -dy; }
    const px = x * TS;
    const py = y * TS;
    ctx.fillStyle = '#2a2f45';
    ctx.fillRect(px + 2, py + 2, TS - 4, TS - 4);
    ctx.save();
    ctx.beginPath();
    ctx.rect(px + 2, py + 2, TS - 4, TS - 4);
    ctx.clip();
    ctx.translate(px + TS / 2, py + TS / 2);
    ctx.rotate(Math.atan2(dy, dx));
    // Side rails
    ctx.fillStyle = '#8a93ad';
    ctx.fillRect(-TS / 2, -TS / 2 + 2, TS, 6);
    ctx.fillRect(-TS / 2, TS / 2 - 8, TS, 6);
    // Moving chevrons
    ctx.fillStyle = '#ffd32a';
    const shift = (S.time * 48) % 32;
    for (let i = -2; i < 2; i++) {
      const cx = i * 32 + shift;
      ctx.beginPath();
      ctx.moveTo(cx - 8, -16);
      ctx.lineTo(cx + 6, 0);
      ctx.lineTo(cx - 8, 16);
      ctx.lineTo(cx - 16, 16);
      ctx.lineTo(cx - 2, 0);
      ctx.lineTo(cx - 16, -16);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // Gates: striped bars that sink into the floor when a button is pressed.
  function drawGates() {
    const w = S.world;
    const closed = 1 - S.gateVis;
    for (let y = 0; y < w.h; y++) {
      for (let x = 0; x < w.w; x++) {
        if (w.grid[y][x] !== '=') continue;
        const sh = S.shakes.find(s => s.x === x && s.y === y);
        const off = sh ? Math.sin(sh.t * 50) * 5 * (1 - sh.t / 0.4) : 0;
        const px = x * TS + off;
        const py = y * TS;
        ctx.fillStyle = '#161a2e';
        ctx.fillRect(px + 4, py + TS - 10, TS - 8, 6);
        if (closed > 0) {
          const h = (TS - 8) * closed;
          for (let i = 0; i < 4; i++) {
            const bx = px + 8 + i * 13;
            ctx.fillStyle = '#161a2e';
            ctx.fillRect(bx - 1, py + TS - 6 - h, 10, h);
            for (let s = 0; s < h; s += 12) {
              ctx.fillStyle = (Math.floor(s / 12) % 2) ? '#ffd32a' : '#ff9f1c';
              ctx.fillRect(bx, py + TS - 6 - h + s, 8, Math.min(12, h - s));
            }
          }
          ctx.fillStyle = '#8a93ad';
          ctx.fillRect(px + 2, py + TS - 8 - h, TS - 4, 6);
        }
        ctx.fillStyle = '#8a93ad';
        ctx.fillRect(px, py, 6, TS);
        ctx.fillRect(px + TS - 6, py, 6, TS);
      }
    }
  }

  // A beam traced from an emitter, bouncing off mirrors, maybe ending on a crystal.
  function drawTracedLaser(l) {
    const w = S.world;
    const state = G.Game.laserState(l);
    const r = G.Rules.trace(w, w.lasers[l.index]);
    const [dx, dy] = { right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1] }[l.dir];
    const c = t => [(t.x + 0.5) * TS, (t.y + 0.5) * TS];
    const pts = [[(l.from.x + 0.5 + dx * 0.4) * TS, (l.from.y + 0.5 + dy * 0.4) * TS]];
    r.tiles.forEach(t => pts.push(c(t)));
    if (r.receiver) pts.push(c(r.receiver));
    else if (r.tiles.length) {
      // Run on to the edge of the last tile, in the direction the beam was heading
      // (after bouncing off a mirror, that's the new direction).
      const last = r.tiles[r.tiles.length - 1];
      pts.push([(last.x + 0.5 + r.dir[0] * 0.5) * TS, (last.y + 0.5 + r.dir[1] * 0.5) * TS]);
    } else {
      pts.push([(l.from.x + 0.5 + dx) * TS, (l.from.y + 0.5 + dy) * TS]);
    }
    if (state === 'on') {
      const flick = 0.75 + 0.25 * Math.sin(S.time * 40);
      const line = (width, color) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
      };
      line(30, `rgba(255,71,87,${0.3 * flick})`);
      line(10, '#ff4757');
      line(3, '#ffd0d5');
    }
    // Emitter box on the wall, facing along the beam.
    const ex = (l.from.x + 0.5) * TS;
    const ey = (l.from.y + 0.5) * TS;
    ctx.fillStyle = '#161a2e';
    ctx.fillRect(ex - 18, ey - 18, 36, 36);
    ctx.fillStyle = '#8a93ad';
    ctx.fillRect(ex - 15, ey - 15, 30, 30);
    ctx.fillStyle = state === 'on' ? '#ff4757' : '#5a2a33';
    ctx.fillRect(ex - 7 + dx * 8, ey - 7 + dy * 8, 14, 14);
  }

  function drawLasers() {
    for (const l of S.lasers) {
      if (l.from) { drawTracedLaser(l); continue; }
      const state = G.Game.laserState(l);
      const first = l.tiles[0];
      const last = l.tiles[l.tiles.length - 1];
      // Direction the beam travels (single-tile beams shine downward).
      const dx = l.tiles.length > 1 ? Math.sign(l.tiles[1].x - first.x) : 0;
      const dy = l.tiles.length > 1 ? Math.sign(l.tiles[1].y - first.y) : 1;
      const vertical = dx === 0;
      const lit = G.Game.litTiles(l);

      // Beam: from the emitter to the first crate (or the far end).
      if (state !== 'off' && lit.length) {
        const a = lit[0];
        const b = lit[lit.length - 1];
        const x0 = Math.min(a.x, b.x) * TS;
        const y0 = Math.min(a.y, b.y) * TS;
        const x1 = (Math.max(a.x, b.x) + 1) * TS;
        const y1 = (Math.max(a.y, b.y) + 1) * TS;
        const flick = 0.75 + 0.25 * Math.sin(S.time * 40);
        const width = state === 'on' ? 12 : 3;
        ctx.globalAlpha = state === 'on' ? 1 : (Math.floor(S.time * 16) % 2 ? 0.8 : 0.2);
        const band = (off, w) => {
          if (vertical) ctx.fillRect(x0 + TS / 2 - w / 2, y0, w, y1 - y0);
          else ctx.fillRect(x0, y0 + TS / 2 - w / 2, x1 - x0, w);
        };
        if (state === 'on') {
          ctx.fillStyle = `rgba(255,71,87,${0.35 * flick})`;
          band(0, 36);
        }
        ctx.fillStyle = '#ff4757';
        band(0, width);
        if (state === 'on') {
          ctx.fillStyle = '#ffd0d5';
          band(0, 4);
        }
        ctx.globalAlpha = 1;
      }
      // Sparks where a crate stops the beam.
      if (state === 'on' && lit.length < l.tiles.length) {
        const c = l.tiles[lit.length];
        const cx = (c.x + 0.5) * TS - dx * TS * 0.5;
        const cy = (c.y + 0.5) * TS - dy * TS * 0.5;
        sparkle(cx + Math.sin(S.time * 23) * 4, cy + Math.cos(S.time * 19) * 4, 6 + Math.sin(S.time * 30) * 2, '#ff9aa2');
      }

      // Emitter behind the first tile (with a light), receiver past the last one.
      const light = state === 'on' ? '#ff4757' : state === 'warn' ? '#ffd32a' : '#5a2a33';
      const box = (t, sign, withLight) => {
        const cx = (t.x + 0.5) * TS + sign * dx * TS * 0.5;
        const cy = (t.y + 0.5) * TS + sign * dy * TS * 0.5;
        const w = vertical ? 32 : 14;
        const h = vertical ? 14 : 32;
        const ex = cx - w / 2 + (vertical ? 0 : sign * dx * 7);
        const ey = cy - h / 2 + (vertical ? sign * dy * 7 : 0);
        ctx.fillStyle = '#161a2e';
        ctx.fillRect(ex - 2, ey - 2, w + 4, h + 4);
        ctx.fillStyle = withLight ? '#8a93ad' : '#5a6380';
        ctx.fillRect(ex, ey, w, h);
        if (withLight) {
          ctx.fillStyle = light;
          ctx.fillRect(ex + w / 2 - 5, ey + h / 2 - 5, 10, 10);
        }
      };
      box(first, -1, true);
      box(last, 1, false);
    }
  }

  function drawDoors() {
    for (const d of S.world.doors) {
      const sh = S.shakes.find(s => s.x === d.x && s.y === d.y);
      const off = sh ? Math.sin(sh.t * 50) * 5 * (1 - sh.t / 0.4) : 0;
      spr(`door_${d.color}`, d.x * TS + off, d.y * TS);
    }
    // Opening doors slide up into the ceiling.
    for (const a of S.doorAnims) {
      const p = a.t * a.t;
      ctx.save();
      ctx.beginPath();
      ctx.rect(a.x * TS, a.y * TS, TS, TS);
      ctx.clip();
      spr(`door_${a.color}`, a.x * TS, a.y * TS - p * TS);
      ctx.restore();
    }
  }

  function drawField() {
    const w = S.world;
    if (!w.hasField) return;
    let alpha = 1;
    if (w.fieldOpen) {
      if (S.fieldAnim < 0 || S.fieldAnim > 0.8) return;
      alpha = 1 - S.fieldAnim / 0.8;
    }
    for (let y = 0; y < w.h; y++) {
      for (let x = 0; x < w.w; x++) {
        if (w.grid[y][x] !== 'F') continue;
        const px = x * TS;
        const py = y * TS;
        ctx.globalAlpha = alpha * 0.35;
        ctx.fillStyle = '#4fe3ff';
        ctx.fillRect(px + 4, py, TS - 8, TS);
        for (let i = 0; i < 4; i++) {
          const a = 0.5 + 0.5 * Math.sin(S.time * 8 + i * 1.7 + y);
          ctx.globalAlpha = alpha * (0.4 + 0.6 * a);
          ctx.fillStyle = i % 2 ? '#b8f6ff' : '#4fe3ff';
          ctx.fillRect(px + 8 + i * 13, py, 4, TS);
        }
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#8a93ad';
        ctx.fillRect(px, py, 8, TS);
        ctx.fillRect(px + TS - 8, py, 8, TS);
        ctx.globalAlpha = 1;
      }
    }
  }

  function drawGoalGlow() {
    const g = S.goal;
    if (!g || S.screen !== 'play' || S.stuck) return;
    const pulse = 0.5 + 0.5 * Math.sin(S.time * 4);
    const glow = (x, y, color) => {
      const cx = (x + 0.5) * TS;
      const cy = (y + 0.5) * TS;
      const r = TS * (0.7 + 0.15 * pulse);
      const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, r);
      grad.addColorStop(0, color.replace('A', (0.35 + 0.35 * pulse).toFixed(2)));
      grad.addColorStop(1, color.replace('A', '0'));
      ctx.fillStyle = grad;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    };
    glow(g.x, g.y, 'rgba(255,240,160,A)');
    if (g.pad) glow(g.pad.x, g.pad.y, 'rgba(62,255,200,A)');
  }

  function drawHintTrail() {
    const g = S.goal;
    if (!g || S.screen !== 'play' || S.stuck || S.idle < G.Game.HINT_TIME) return;
    const path = g.path;
    const fadeIn = Math.min(1, (S.idle - G.Game.HINT_TIME) * 2);
    for (let i = 1; i < path.length; i++) {
      const wave = Math.max(0, Math.sin(S.time * 6 - i * 0.7));
      const cx = (path[i].x + 0.5) * TS;
      const cy = (path[i].y + 0.5) * TS;
      sparkle(cx, cy, 6 + wave * 6, '#ffe66d', fadeIn * (0.25 + 0.75 * wave));
    }
  }

  // Keys, fruit and helmets the player is on the way to collecting are still drawn.
  const pendingOf = type => S.pending.filter(p => p.event.type === type).map(p => p.event);

  function drawKeys() {
    const keys = S.world.keys.concat(pendingOf('pickup'));
    for (const k of keys) {
      const bob = Math.sin(S.time * 3 + k.x) * 4;
      spr(`key_${k.color}`, k.x * TS, k.y * TS + bob);
      if (hash(k.x, k.y, Math.floor(S.time * 2)) > 0.6) {
        sparkle(k.x * TS + 12 + hash(k.y, k.x, Math.floor(S.time * 2)) * 40, k.y * TS + 14, 5, '#ffffff', 0.9);
      }
    }
  }

  function drawCrates() {
    S.world.crates.forEach((c, i) => {
      const p = G.Game.cratePos(i);
      spr(c.slick ? 'crate_slick' : 'crate', p.x * TS, p.y * TS);
    });
  }

  function drawRocket() {
    const r = G.Game.rocketPos();
    const frame = Math.floor(S.time * 8) % 2;
    const bob = S.screen === 'play' ? Math.sin(S.time * 2) * 2 : 0;
    spr(`rocket_${frame}`, r.x, r.y + bob);
  }

  function drawArm(o) {
    const off = G.Game.poweredDown(o);
    const cx = (o.x + 0.5) * TS;
    const cy = (o.y + 0.5) * TS;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(o.angle);
    const L = o.len * TS;
    ctx.fillStyle = '#161a2e';
    ctx.fillRect(-L - 4, -11, 2 * L + 8, 22);
    ctx.fillStyle = off ? '#6e6e7e' : '#ff9f1c';
    ctx.fillRect(-L, -8, 2 * L, 16);
    if (!off) {
      ctx.fillStyle = '#ffd32a';
      for (let i = -L; i < L; i += 24) ctx.fillRect(i, -8, 10, 16);
    }
    ctx.restore();
    ctx.fillStyle = '#161a2e';
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c3cbe0';
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawComet(o) {
    const off = G.Game.poweredDown(o);
    o.trail.forEach((p, i) => {
      ctx.globalAlpha = off ? 0 : 0.5 * (1 - i / o.trail.length);
      ctx.fillStyle = i % 2 ? '#ffd32a' : '#ff9f1c';
      ctx.beginPath();
      ctx.arc((p.x + 0.5) * TS, (p.y + 0.5) * TS, 18 - i * 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    const cx = (o.x + 0.5) * TS;
    const cy = (o.y + 0.5) * TS;
    ctx.fillStyle = '#161a2e';
    ctx.beginPath();
    ctx.arc(cx, cy, 21, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = off ? '#8a93ad' : '#ffe66d';
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 6, cy - 6, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // The secret fart cloud: a green haze with puffy edges rolling out from where it started.
  function drawFart() {
    const f = S.fart;
    if (!f) return;
    const r = G.Game.fartRadius();
    const fade = f.t < G.Game.FART_GROW ? 1 : Math.max(0, 1 - (f.t - G.Game.FART_GROW) / G.Game.FART_FADE);
    ctx.save();
    // The haze fills everything inside the edge.
    ctx.globalAlpha = 0.42 * fade;
    const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, Math.max(1, r));
    grad.addColorStop(0, '#9be15d');
    grad.addColorStop(0.8, '#b8f28a');
    grad.addColorStop(1, '#d9ffb0');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
    ctx.fill();
    // Big puffs roll along the edge.
    const n = Math.max(12, Math.floor(r / 22));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + f.t * 0.6;
      const wob = Math.sin(f.t * 5 + i * 1.7) * 10;
      const pr = 34 + (i % 3) * 12 + wob;
      ctx.globalAlpha = 0.5 * fade;
      ctx.fillStyle = i % 2 ? '#b8f28a' : '#9be15d';
      ctx.beginPath();
      ctx.arc(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r, pr, 0, Math.PI * 2);
      ctx.fill();
    }
    // A few swirly stink lines near the start.
    ctx.globalAlpha = 0.6 * fade;
    ctx.strokeStyle = '#6fbf3a';
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const bx = f.x - 20 + i * 20;
      for (let k = 0; k <= 10; k++) {
        const yy = f.y - 30 - k * 5 - f.t * 30;
        const xx = bx + Math.sin(k * 0.9 + f.t * 6 + i) * 6;
        if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawObstacles() {
    for (const o of S.obstacles) {
      const x = o.x * TS;
      const y = o.y * TS;
      ctx.globalAlpha = G.Game.poweredDown(o) && !o.arm && !o.comet ? 0.45 : 1;
      if (o.sprite === 'asteroid') {
        ctx.save();
        ctx.translate(x + TS / 2, y + TS / 2);
        ctx.rotate(S.time * 1.5);
        ctx.drawImage(G.Sprites.get('asteroid'), -TS / 2, -TS / 2, TS, TS);
        ctx.restore();
      } else if (o.arm) {
        drawArm(o);
      } else if (o.comet) {
        drawComet(o);
      } else if (o.ufo) {
        const bob = Math.sin(S.time * 3) * 4;
        const size = TS * 1.5;
        if (o.wait > 0 && !G.Game.poweredDown(o)) {
          // Hovering: a soft tractor-beam glow underneath.
          ctx.fillStyle = 'rgba(255,230,109,0.18)';
          ctx.beginPath();
          ctx.moveTo(x + TS / 2 - 10, y + TS / 2);
          ctx.lineTo(x + TS / 2 + 10, y + TS / 2);
          ctx.lineTo(x + TS / 2 + 30, y + TS);
          ctx.lineTo(x + TS / 2 - 30, y + TS);
          ctx.fill();
        }
        spr(`ufo_${Math.floor(S.time * 4) % 2}`, x + TS / 2 - size / 2, y + TS / 2 - size / 2 - 6 + bob, size);
      } else if (o.chaser) {
        const napping = o.nap > 0 || o.delay > 0;
        if (o.asleep) ctx.globalAlpha = 0.8;
        const frame = napping ? 0 : Math.floor(S.time * 5) % 2;
        spr(`chaser_${frame}`, x, y + (napping ? 0 : Math.abs(Math.sin(S.time * 10)) * -4));
        if (napping) {
          // Sleepy "z"s float up while it naps.
          ctx.font = 'bold 18px "Trebuchet MS", Verdana, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ffffff';
          // Fart-spray sleepers snore bigger and slower, for good.
          const big = o.asleep;
          if (big) ctx.font = 'bold 26px "Trebuchet MS", Verdana, sans-serif';
          for (let i = 0; i < (big ? 3 : 2); i++) {
            const t = (S.time * (big ? 0.5 : 0.8) + i / (big ? 3 : 2)) % 1;
            ctx.globalAlpha = 1 - t;
            ctx.fillText('z', x + TS * 0.75 + t * (big ? 18 : 10), y + 6 - t * (big ? 40 : 24));
          }
          ctx.globalAlpha = 1;
        }
      } else {
        const frame = Math.floor(S.time * 3) % 2;
        spr(`robot_${frame}`, x, y + Math.sin(S.time * 6) * 2);
      }
      ctx.globalAlpha = 1;
    }
  }

  // Standing next to a mirror: a little bouncing space bar above the astronaut says
  // "press Space to turn it".
  function drawSpacePrompt(px, py) {
    const bob = Math.abs(Math.sin(S.time * 5)) * -6;
    if (G.touch) {
      // On touch screens, show the round yellow "turn" button instead of a space bar.
      const cx = px + TS / 2;
      const cy = py - 20 + bob;
      ctx.fillStyle = '#161a2e';
      ctx.beginPath();
      ctx.arc(cx, cy + 2, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd32a';
      ctx.beginPath();
      ctx.arc(cx, cy, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#161a2e';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy, 7, -0.6, Math.PI * 1.45);
      ctx.stroke();
      ctx.fillStyle = '#161a2e';
      ctx.beginPath();
      ctx.moveTo(cx + 10, cy - 9);
      ctx.lineTo(cx + 10, cy - 1);
      ctx.lineTo(cx + 2, cy - 4);
      ctx.fill();
      ctx.lineCap = 'butt';
      return;
    }
    const w = 54;
    const h = 20;
    const x = px + TS / 2 - w / 2;
    const y = py - 26 + bob;
    const pressed = Math.floor(S.time * 2) % 2 === 0;
    ctx.fillStyle = '#161a2e';
    roundRect(x - 3, y - 3, w + 6, h + 9, 8);
    ctx.fill();
    ctx.fillStyle = '#8a93ad';
    roundRect(x, y + 4, w, h, 6);
    ctx.fill();
    ctx.fillStyle = '#f4f6ff';
    roundRect(x, y + (pressed ? 3 : 0), w, h, 6);
    ctx.fill();
    ctx.fillStyle = '#8a93ad';
    ctx.fillRect(x + 12, y + (pressed ? 3 : 0) + 12, w - 24, 3);
  }

  function drawPlayer() {
    const pv = G.Game.playerPos();
    let scale = pv.scale;
    let px = pv.x * TS;
    let py = pv.y * TS - pv.hop * TS;
    if (pv.hop > 0.05 && S.screen === 'play') {
      // Shadow on the ground shows you're flying over.
      ctx.fillStyle = `rgba(0,0,0,${0.35 - pv.hop * 0.15})`;
      ctx.beginPath();
      ctx.ellipse(pv.x * TS + TS / 2, pv.y * TS + TS * 0.85, 18 - pv.hop * 6, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (S.screen === 'exit') {
      // Hop into the rocket, then disappear.
      const t = Math.min(1, S.exitT / 0.5);
      if (t >= 1) return;
      scale = 1 - t;
      const r = G.Game.rocketPos();
      py = r.y + TS * 0.2 - Math.sin(t * Math.PI) * 30;
      px = r.x + (TS * (1 - scale)) / 2;
    }
    // Flash while invulnerable after a bump.
    if (S.invuln > 0 && Math.floor(S.invuln * 12) % 2 === 0) return;
    if (scale <= 0) return;
    const seq = [0, 1, 0, 2];
    const walking = S.move && S.move.seg === 0;
    const frame = walking ? seq[(S.walk * 2 + (S.move.t > 0.5 ? 1 : 0)) % 4] : 0;
    const size = TS * scale;
    if (S.screen === 'exit') spr(`astro_${S.dir}_${frame}`, px, py + (TS - size), size);
    else spr(`astro_${S.dir}_${frame}`, px + (TS - size) / 2, py + (TS - size) / 2, size);
    if (S.screen === 'play' && !S.move && !S.bounce && G.Rules.useTargets(S.world).length) drawSpacePrompt(px, py);
    if (S.shield > 0 && S.screen === 'play' && (S.shield > 2 || Math.floor(S.time * 8) % 2 === 0)) {
      ctx.strokeStyle = 'rgba(79,227,255,0.9)';
      ctx.fillStyle = 'rgba(79,227,255,0.15)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(px + TS / 2, py + TS / 2, TS * 0.58 + Math.sin(S.time * 6) * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  function drawParticles() {
    for (const p of S.particles) {
      const a = 1 - p.life / p.max;
      if (p.star) {
        sparkle(p.x, p.y, p.size * (0.5 + a * 0.6), p.color, a);
      } else {
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.globalAlpha = 1;
      }
    }
  }

  // ---------- HUD ----------
  function drawRestartIcon(x, y, s) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x + s / 2, y + s / 2, s * 0.3, -Math.PI * 0.35, Math.PI * 1.45);
    ctx.stroke();
    const ax = x + s / 2 + Math.cos(-Math.PI * 0.35) * s * 0.3;
    const ay = y + s / 2 + Math.sin(-Math.PI * 0.35) * s * 0.3;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(ax + 8, ay - 2);
    ctx.lineTo(ax - 6, ay - 8);
    ctx.lineTo(ax - 2, ay + 8);
    ctx.closePath();
    ctx.fill();
  }

  function drawSpeakerIcon(x, y, s, muted) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x + s * 0.18, y + s * 0.38);
    ctx.lineTo(x + s * 0.34, y + s * 0.38);
    ctx.lineTo(x + s * 0.52, y + s * 0.2);
    ctx.lineTo(x + s * 0.52, y + s * 0.8);
    ctx.lineTo(x + s * 0.34, y + s * 0.62);
    ctx.lineTo(x + s * 0.18, y + s * 0.62);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = muted ? '#ff4757' : '#ffffff';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (muted) {
      ctx.moveTo(x + s * 0.62, y + s * 0.36);
      ctx.lineTo(x + s * 0.84, y + s * 0.64);
      ctx.moveTo(x + s * 0.84, y + s * 0.36);
      ctx.lineTo(x + s * 0.62, y + s * 0.64);
    } else {
      ctx.arc(x + s * 0.52, y + s * 0.5, s * 0.18, -0.9, 0.9);
      ctx.moveTo(x + s * 0.52 + Math.cos(-0.9) * s * 0.3, y + s * 0.5 + Math.sin(-0.9) * s * 0.3);
      ctx.arc(x + s * 0.52, y + s * 0.5, s * 0.3, -0.9, 0.9);
    }
    ctx.stroke();
  }

  function drawHomeIcon(x, y, s) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x + s * 0.5, y + s * 0.18);
    ctx.lineTo(x + s * 0.82, y + s * 0.48);
    ctx.lineTo(x + s * 0.72, y + s * 0.48);
    ctx.lineTo(x + s * 0.72, y + s * 0.8);
    ctx.lineTo(x + s * 0.28, y + s * 0.8);
    ctx.lineTo(x + s * 0.28, y + s * 0.48);
    ctx.lineTo(x + s * 0.18, y + s * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#161a2e';
    ctx.fillRect(x + s * 0.43, y + s * 0.6, s * 0.14, s * 0.2);
  }

  function drawButtons() {
    const s = 48;
    const y = 8;
    const inPlay = S.screen === 'play';
    const defs = [
      { name: 'home', show: inPlay || S.screen === 'win' },
      { name: 'mute', show: true },
      { name: 'restart', show: inPlay },
    ].filter(b => b.show);
    defs.forEach((b, i) => {
      const x = canvas.width - (defs.length - i) * (s + 10);
      const stuck = b.name === 'restart' && S.stuck;
      const pulse = 0.5 + 0.5 * Math.sin(S.time * 6);
      ctx.fillStyle = stuck ? `rgba(255,${160 + pulse * 60},40,${0.7 + pulse * 0.3})` : 'rgba(10,12,30,0.55)';
      roundRect(x, y, s, s, 12);
      ctx.fill();
      if (stuck) sparkle(x + 6, y + s - 6, 6 + pulse * 4, '#ffffff');
      if (b.name === 'mute') drawSpeakerIcon(x, y, s, G.Audio.isMuted());
      else if (b.name === 'home') drawHomeIcon(x, y, s);
      else drawRestartIcon(x, y, s);
      buttons.push({ name: b.name, x, y, w: s, h: s });
    });
  }

  function drawInventory() {
    // Don't show things in the pocket until the player has actually reached them.
    const inv = Object.assign({}, S.world.inv);
    pendingOf('pickup').forEach(e => { inv[e.color]--; });
    inv.f -= pendingOf('fruit').length;
    const items = [];
    Object.keys(inv).forEach(c => { for (let i = 0; i < inv[c]; i++) items.push(c); });
    if (!items.length) return;
    const size = 52;
    const w = items.length * size + 16;
    ctx.fillStyle = 'rgba(10,12,30,0.6)';
    roundRect(8, 6, w, size + 4, 14);
    ctx.fill();
    items.forEach((c, i) => spr(c === 'f' ? 'fruit' : `key_${c}`, 16 + i * size, 8, size));
  }

  // Bottom-center badge: this level's planet and number. Clicking it opens the level menu.
  function drawLevelBadge() {
    const label = `Level ${S.levelIndex + 1}`;
    const total = `/ ${G.Levels.length}`;
    const big = 'bold 26px "Trebuchet MS", Verdana, sans-serif';
    const small = 'bold 16px "Trebuchet MS", Verdana, sans-serif';
    ctx.font = big;
    const lw = ctx.measureText(label).width;
    ctx.font = small;
    const tw = ctx.measureText(total).width;
    const h = 52;
    const w = 58 + lw + 6 + tw + 18 + 22 + 16; // planet, label, total, gap, grid icon, padding
    const x = canvas.width / 2 - w / 2;
    const y = canvas.height - h - 6;
    ctx.fillStyle = 'rgba(10,12,30,0.7)';
    roundRect(x, y, w, h, h / 2);
    ctx.fill();
    drawPlanet(S.levelIndex, x + 30, y + h / 2, 17, false, false);

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = big;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, x + 58, y + h / 2 + 1);
    ctx.font = small;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(total, x + 58 + lw + 6, y + h / 2 + 3);

    // Little grid icon hints that this opens the level menu.
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    const gx = x + w - 16 - 19;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) ctx.fillRect(gx + c * 7, y + h / 2 - 10 + r * 7, 5, 5);
    }
    buttons.push({ name: 'home', x, y, w, h });
  }

  // ---------- Screens ----------
  function drawStarfield() {
    ctx.fillStyle = '#070916';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const s of STARS) {
      ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(S.time * 0.9 + s.p));
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
    ctx.globalAlpha = 1;
  }

  function bigText(text, x, y, size, fill) {
    ctx.font = `bold ${size}px "Trebuchet MS", "Arial Rounded MT Bold", Verdana, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = size / 6;
    ctx.strokeStyle = '#161a2e';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fill;
    ctx.fillText(text, x, y);
  }

  // A friendly keyboard arrow key.
  function arrowKey(x, y, s, dir, lit) {
    ctx.fillStyle = lit ? '#ffd32a' : '#c3cbe0';
    roundRect(x, y + 6, s, s, 12);
    ctx.fill();
    ctx.fillStyle = lit ? '#fff3a8' : '#f4f6ff';
    roundRect(x, y, s, s, 12);
    ctx.fill();
    ctx.fillStyle = '#161a2e';
    ctx.save();
    ctx.translate(x + s / 2, y + s / 2);
    ctx.rotate({ up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 }[dir]);
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.28);
    ctx.lineTo(s * 0.24, s * 0.05);
    ctx.lineTo(s * 0.09, s * 0.05);
    ctx.lineTo(s * 0.09, s * 0.28);
    ctx.lineTo(-s * 0.09, s * 0.28);
    ctx.lineTo(-s * 0.09, s * 0.05);
    ctx.lineTo(-s * 0.24, s * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function arrowCluster(cx, cy, s) {
    const lit = ['up', 'right', 'down', 'left'][Math.floor(S.time * 2.5) % 4];
    const g = 8;
    arrowKey(cx - s / 2, cy - s - g / 2, s, 'up', lit === 'up');
    arrowKey(cx - s * 1.5 - g, cy + g / 2, s, 'left', lit === 'left');
    arrowKey(cx - s / 2, cy + g / 2, s, 'down', lit === 'down');
    arrowKey(cx + s / 2 + g, cy + g / 2, s, 'right', lit === 'right');
  }

  function drawTitle() {
    drawStarfield();
    const cx = canvas.width / 2;
    bigText('SPACE', cx, 110 + Math.sin(S.time * 2) * 6, 96, '#ffd32a');
    bigText('EXPLORER', cx, 205 + Math.sin(S.time * 2 + 1) * 6, 80, '#4fe3ff');

    const dir = ['down', 'right', 'down', 'left'][Math.floor(S.time) % 4];
    spr(`astro_${dir}_${Math.floor(S.time * 4) % 3}`, cx - 250, 290 + Math.abs(Math.sin(S.time * 4)) * -20, 160);
    spr(`rocket_${Math.floor(S.time * 8) % 2}`, cx + 110, 280 + Math.sin(S.time * 2) * 8, 160);
    spr('key_y', cx - 60, 330 + Math.sin(S.time * 3) * 8, 120);

    arrowCluster(cx, 540, 56);

    ctx.font = '16px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.textAlign = 'right';
    if (!G.touch) ctx.fillText('Arrow keys: move · R: restart level · M: sound', canvas.width - 16, canvas.height - 16);
  }

  // ---------- Level-select menu: one planet per level ----------
  const PLANETS = [
    ['#ff9f1c', '#b86a00'], ['#2ed573', '#1e9150'], ['#3d8bff', '#2458b0'], ['#ff4757', '#b8323f'],
    ['#b86bff', '#7a3fc0'], ['#4fe3ff', '#2a9bb8'], ['#ffd32a', '#c49a00'], ['#ff9ff3', '#c066b8'],
  ];

  // Menu page positions: 2 rows of 5 planets per world.
  function menuPos(i) {
    const cols = G.Game.MENU_COLS;
    const j = i % G.Game.PER_PAGE;
    const col = j % cols;
    const row = Math.floor(j / cols);
    return { x: canvas.width / 2 + (col - (cols - 1) / 2) * 150, y: 250 + row * 170 };
  }

  function drawPlanet(i, x, y, r, selected, labelled = true) {
    const [light, dark] = PLANETS[i % PLANETS.length];
    if (selected) {
      const pulse = 0.5 + 0.5 * Math.sin(S.time * 5);
      ctx.strokeStyle = `rgba(255,240,160,${0.5 + 0.5 * pulse})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(x, y, r + 12 + pulse * 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.arc(x - r * 0.12, y - r * 0.12, r * 0.86, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(x - r * 0.4, y - r * 0.4, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
    if (i % 3 === 1) {
      // A ring on some planets
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.45, r * 0.4, -0.35, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (!labelled) return;
    bigText(String(i + 1), x, y + 3, 32, '#ffffff');
    if (S.done.has(G.Levels[i].id)) sparkle(x + r * 0.75, y - r * 0.75, 12, '#ffd32a');
  }

  function pageArrow(x, y, dir, enabled) {
    ctx.globalAlpha = enabled ? 0.55 + 0.45 * Math.abs(Math.sin(S.time * 3)) : 0.15;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x + dir * 18, y);
    ctx.lineTo(x - dir * 12, y - 26);
    ctx.lineTo(x - dir * 12, y + 26);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawMenu() {
    drawStarfield();
    const n = G.Levels.length;
    const per = G.Game.PER_PAGE;
    const page = Math.floor(S.menuSel / per);
    const pages = Math.ceil(n / per);

    // World name and page dots
    const name = (G.WorldNames && G.WorldNames[page]) || `World ${page + 1}`;
    bigText(name, canvas.width / 2, 60, 44, ['#4fe3ff', '#d6d6e6', '#ff9f6a', '#bff4ff', '#d6b8ff'][page % 5]);
    for (let p = 0; p < pages; p++) {
      ctx.fillStyle = p === page ? '#ffffff' : 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.arc(canvas.width / 2 + (p - (pages - 1) / 2) * 22, 104, p === page ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = page * per; i < Math.min(n, (page + 1) * per); i++) {
      const p = menuPos(i);
      const selected = i === S.menuSel;
      drawPlanet(i, p.x, p.y, selected ? 44 : 38, selected);
      buttons.push({ name: `level:${i}`, x: p.x - 60, y: p.y - 60, w: 120, h: 120 });
    }
    const sp = menuPos(S.menuSel);
    const bob = Math.sin(S.time * 4) * 5;
    spr(`astro_down_${Math.floor(S.time * 4) % 3}`, sp.x - 24, sp.y - 112 + bob, 48);

    // Page arrows
    pageArrow(40, 330, -1, page > 0);
    pageArrow(canvas.width - 40, 330, 1, page < pages - 1);
    if (page > 0) buttons.push({ name: 'page:-1', x: 0, y: 270, w: 80, h: 120 });
    if (page < pages - 1) buttons.push({ name: 'page:1', x: canvas.width - 80, y: 270, w: 80, h: 120 });

    // "Go" key, pulsing
    const cx = canvas.width / 2;
    const pulse = 1 + Math.sin(S.time * 5) * 0.04;
    const w = 190 * pulse;
    const h = 64 * pulse;
    ctx.fillStyle = '#c49a00';
    roundRect(cx - w / 2, 560 - h / 2 + 6, w, h, 14);
    ctx.fill();
    ctx.fillStyle = '#ffd32a';
    roundRect(cx - w / 2, 560 - h / 2, w, h, 14);
    ctx.fill();
    ctx.font = 'bold 30px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#161a2e';
    ctx.fillText('GO  ⏎', cx, 561);
    buttons.push({ name: `level:${S.menuSel}`, x: cx - w / 2, y: 560 - h / 2, w, h });

    ctx.font = '16px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.textAlign = 'right';
    ctx.fillText('Arrow keys: pick a planet · Enter or Space: go · Esc: back here', canvas.width - 16, canvas.height - 16);
  }

  // When the goal is off screen (big levels), a pulsing arrow at the edge points to it.
  function drawGoalPointer() {
    const g = S.goal;
    if (!g || S.screen !== 'play' || S.stuck) return;
    const gx = (g.x + 0.5) * TS - S.cam.x;
    const gy = (g.y + 0.5) * TS - S.cam.y;
    const m = 40;
    if (gx > m && gx < canvas.width - m && gy > m && gy < canvas.height - m) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const a = Math.atan2(gy - cy, gx - cx);
    // Clamp the arrow to the screen edge.
    const t = Math.min(
      Math.abs((cx - m - 30) / Math.cos(a) || Infinity),
      Math.abs((cy - m - 30) / Math.sin(a) || Infinity),
    );
    const ax = cx + Math.cos(a) * t;
    const ay = cy + Math.sin(a) * t;
    const pulse = 1 + Math.sin(S.time * 6) * 0.15;
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(a);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#ffe66d';
    ctx.strokeStyle = '#161a2e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.lineTo(-12, -20);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-12, 20);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    ctx.restore();
  }

  function drawWin() {
    drawStarfield();
    const cx = canvas.width / 2;
    bigText('YOU DID IT!', cx, 120 + Math.sin(S.time * 3) * 8, 96, '#ffd32a');

    const jump = Math.abs(Math.sin(S.time * 5)) * 50;
    spr(`astro_down_${Math.floor(S.time * 6) % 3}`, cx - 90, 300 - jump, 180);
    const n = G.Levels.length;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + S.time;
      sparkle(cx + Math.cos(a) * 190, 390 + Math.sin(a) * 110, 14, ['#ffd32a', '#ff4757', '#2ed573', '#3d8bff'][i % 4]);
    }
    drawParticles();
    if (S.winT > 1.5) {
      const bounce = Math.sin(S.time * 5) * 6;
      arrowKey(cx - 36, 540 + bounce, 72, 'right', Math.floor(S.time * 2) % 2 === 0);
    }
  }

  function draw() {
    ctx.imageSmoothingEnabled = false;
    buttons.length = 0;
    if (S.screen === 'title') {
      drawTitle();
      drawButtons();
      return;
    }
    if (S.screen === 'menu') {
      drawMenu();
      drawButtons();
      return;
    }
    if (S.screen === 'win') {
      drawWin();
      drawButtons();
      return;
    }
    // Crystals glow while a beam hits them.
    S.litCrystals = new Set();
    for (const l of S.world.lasers) {
      const r = G.Rules.trace(S.world, l);
      if (r.receiver) S.litCrystals.add(r.receiver.y * S.world.w + r.receiver.x);
    }

    // The level scrolls with the camera; the HUD stays put.
    ctx.save();
    ctx.translate(-Math.round(S.cam.x), -Math.round(S.cam.y));
    drawTiles();
    drawGoalGlow();
    drawHintTrail();
    drawJumpArcs();
    drawField();
    drawGates();
    drawTimedDoors();
    drawDoors();
    drawRaisedBlocks();
    drawLevers();
    drawMirrors();
    drawKeys();
    drawItems();
    drawCrates();
    drawAliens();
    drawRocket();
    drawObstacles();
    drawPlayer();
    drawLasers();
    drawParticles();
    drawFart();
    ctx.restore();
    drawGoalPointer();
    drawInventory();
    drawLevelBadge();
    drawButtons();

    let fade = S.fadeIn / 0.5;
    if (S.screen === 'exit') fade = Math.max(0, (S.exitT - (G.Game.EXIT_DUR - 0.5)) / 0.5);
    if (fade > 0) {
      ctx.fillStyle = `rgba(7,9,22,${Math.min(1, fade)})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  G.Render = {
    init,
    draw,
    hitButton(x, y) {
      const b = buttons.find(b => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
      return b ? b.name : null;
    },
  };
})(window.Game = window.Game || {});
