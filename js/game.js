// Game state, update loop, animation timing and reactions to rule events.
(function (G) {
  const STEP_DUR = 0.16;     // seconds to walk one tile
  const RIDE_DUR = 0.12;     // seconds per tile on a conveyor
  const SLIDE_DUR = 0.09;    // seconds per tile sliding on ice
  const JUMP_DUR = 0.32;     // hop over a tile from a jump pad
  const PULL_DUR = 0.22;     // tug toward a black hole
  const SHIELD_TIME = 8;     // seconds of bump-proof bubble from a helmet
  const TELE_DUR = 0.45;     // shrink out of one portal, grow out of the other
  const BOUNCE_DUR = 0.3;    // obstacle bump-back
  const INVULN = 1.3;        // grace period after a bump
  const HIT_DIST = 0.66;     // in tiles; generous so near-misses count as misses
  const LASER_HIT = 0.55;
  const LASER_WARN = 0.5;    // beam flickers this long before switching on
  const HINT_TIME = 12;      // seconds without progress before the sparkle trail
  const DOOR_ANIM = 0.45;
  const EXIT_DUR = 2.8;
  const TIMER_TICK = 0.6;    // a running countdown also ticks down this often while standing still
  const CHASER_NAP = 2.5;    // a chasing robot naps this long after bumping the player
  const TS = 64;
  const MENU_COLS = 5;
  const PER_PAGE = 10;       // levels per world / menu page
  const VIEW_W = 960;
  const VIEW_H = 640;

  function loadDone() {
    // Finished levels are stored by level id, so inserting new levels doesn't shift them.
    try { return new Set(JSON.parse(localStorage.getItem('spaceExplorerDoneIds') || '[]')); } catch (e) { return new Set(); }
  }
  function saveDone() {
    try { localStorage.setItem('spaceExplorerDoneIds', JSON.stringify([...S.done])); } catch (e) { /* ignore */ }
  }

  const S = {
    screen: 'title', // title | menu | play | exit | win
    time: 0,
    levelIndex: 0,
    particles: [],
    menuSel: 0,
    done: loadDone(),
  };

  const ease = t => t * t * (3 - 2 * t);

  function loadLevel(i) {
    const level = G.Levels[i];
    const w = G.Rules.parse(level);
    Object.assign(S, {
      screen: 'play',
      levelIndex: i,
      levelTime: 0,
      world: w,
      isSpace: computeSpace(w),
      move: null,
      bounce: null,
      moveLock: 0,
      dir: 'down',
      walk: 0,
      invuln: 0,
      prevTile: null,
      shield: 0,
      alienAnims: [],
      padAnims: [],
      fart: null,       // secret F-key cloud: { x, y, t, maxR } in pixels
      pending: [],      // pickups the rules already made but the player hasn't reached yet
      leverAnim: w.lever ? 1 : 0,
      obstacles: (level.obstacles || []).map(makeObstacle),
      lasers: (level.lasers || []).map((l, index) => ({
        index, // matching entry in world.lasers, which knows where crates cut the beam
        tiles: l.tiles ? l.tiles.map(([x, y]) => ({ x, y })) : null,
        from: l.from ? { x: l.from[0], y: l.from[1] } : null,
        dir: l.dir || null,
        always: !!l.always,
        switch: !!l.switch,
        period: l.period || 3, on: l.on || 1.3, offset: l.offset || 0,
      })),
      stuck: false,
      stuckJob: null,
      goalKey: null,
      timerAcc: 0,
      timedOpen: G.Rules.timedOpen(w),
      timedVis: G.Rules.timedOpen(w) ? 1 : 0,
      cam: { x: 0, y: 0 },
      gatesOpen: G.Rules.gatesOpen(w),
      gateVis: G.Rules.gatesOpen(w) ? 1 : 0,
      doorAnims: [],
      doorFrames: [],
      shakes: [],
      fieldAnim: -1,
      idle: 0,
      goal: null,
      exitT: 0,
      fadeIn: 0.5,
      lastBlockAt: -10,
    });
    S.particles.length = 0;
    updateCamera(0, true);
    G.Input.clearTaps();
  }

  // Levels bigger than the screen scroll: the camera follows the player, clamped to the map.
  function updateCamera(dt, snap) {
    const w = S.world;
    const pv = playerPos();
    const maxX = Math.max(0, w.w * TS - VIEW_W);
    const maxY = Math.max(0, w.h * TS - VIEW_H);
    const tx = Math.min(maxX, Math.max(0, (pv.x + 0.5) * TS - VIEW_W / 2));
    const ty = Math.min(maxY, Math.max(0, (pv.y + 0.5) * TS - VIEW_H / 2));
    const k = snap ? 1 : Math.min(1, dt * 6);
    S.cam.x += (tx - S.cam.x) * k;
    S.cam.y += (ty - S.cam.y) * k;
  }

  // Wall tiles fully surrounded by walls are drawn as open space.
  function computeSpace(w) {
    const wallAt = (x, y) => x < 0 || y < 0 || x >= w.w || y >= w.h || w.grid[y][x] === '#';
    return w.grid.map((row, y) => row.map((t, x) => {
      if (t !== '#') return false;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) if (!wallAt(x + dx, y + dy)) return false;
      }
      return true;
    }));
  }

  function makeObstacle(def) {
    const base = { sprite: def.sprite, switchable: !!def.switch };
    if (def.sprite === 'chaser') {
      const [x, y] = def.start;
      return Object.assign(base, { chaser: true, speed: def.speed || 1.3, x, y, nx: x, ny: y, delay: def.delay || 1.5, nap: 0 });
    }
    if (def.sprite === 'arm') {
      // A bar spinning around a center tile; `length` tiles each side.
      const [x, y] = def.center;
      return Object.assign(base, { arm: true, x, y, len: def.length || 2, speed: def.speed || 0.8, angle: def.angle || 0 });
    }
    if (def.sprite === 'comet') {
      // Flies diagonally and bounces off walls.
      const [x, y] = def.start;
      const [dx, dy] = def.dir || [1, 1];
      const sp = def.speed || 2;
      const n = Math.hypot(dx, dy);
      return Object.assign(base, { comet: true, x, y, vx: (dx / n) * sp, vy: (dy / n) * sp, trail: [] });
    }
    const pts = def.path.map(([x, y]) => ({ x, y }));
    const segs = [];
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const len = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
      segs.push({ a: pts[i], b: pts[i + 1], len });
      total += len;
    }
    // Path obstacles ping-pong; a UFO also hovers (`pause` seconds) at each end.
    const pause = def.pause !== undefined ? def.pause : (def.sprite === 'ufo' ? 2 : 0);
    return Object.assign(base, { speed: def.speed || 1, segs, total, d: 0, sign: 1, wait: 0, pause, x: pts[0].x, y: pts[0].y, ufo: def.sprite === 'ufo' });
  }

  function cometSolid(x, y) {
    const w = S.world;
    const tx = Math.floor(x + 0.5);
    const ty = Math.floor(y + 0.5);
    if (tx < 0 || ty < 0 || tx >= w.w || ty >= w.h) return true;
    const t = w.grid[ty][tx];
    return t === '#' || t === 'M' || t === 'q' || w.doors.some(d => d.x === tx && d.y === ty);
  }

  function updateComet(o, dt) {
    const nx = o.x + o.vx * dt;
    const ny = o.y + o.vy * dt;
    const lead = 0.45;
    if (cometSolid(nx + Math.sign(o.vx) * lead, o.y)) o.vx = -o.vx;
    if (cometSolid(o.x, ny + Math.sign(o.vy) * lead)) o.vy = -o.vy;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.trail.unshift({ x: o.x, y: o.y });
    if (o.trail.length > 8) o.trail.pop();
  }

  // Chasing robot: walks tile by tile toward the player along open floor, never through
  // doors, gates, crates or laser walls. Slower than the player, and naps after a bump.
  function updateChaser(o, dt) {
    if (o.delay > 0) { o.delay -= dt; return; }
    if (o.nap > 0) { o.nap -= dt; return; }
    let step = o.speed * dt;
    while (step > 0) {
      const dx = o.nx - o.x;
      const dy = o.ny - o.y;
      const d = Math.hypot(dx, dy);
      if (d > 1e-6) {
        const m = Math.min(d, step);
        o.x += (dx / d) * m;
        o.y += (dy / d) * m;
        step -= m;
        continue;
      }
      const next = chaserNext(Math.round(o.x), Math.round(o.y));
      if (!next) return;
      o.nx = next.x;
      o.ny = next.y;
    }
  }

  // Chasers never step onto teleporters or belts, even to reach the player, so they can't
  // park on a portal. If the player is standing on one, the chaser waits right next to it.
  function chaserCanWalk(x, y) {
    const w = S.world;
    return G.Rules.isOpen(w, x, y) && !'T><^v'.includes(w.grid[y][x]);
  }

  function chaserNext(sx, sy) {
    const w = S.world;
    const p = w.player;
    const playerReachable = chaserCanWalk(p.x, p.y);
    const isGoal = (x, y) => (x === p.x && y === p.y) ||
      (!playerReachable && Math.abs(x - p.x) + Math.abs(y - p.y) === 1);
    if (isGoal(sx, sy)) return null;
    const K = (x, y) => y * w.w + x;
    const prev = new Map([[K(sx, sy), -1]]);
    const queue = [[sx, sy]];
    while (queue.length) {
      const [x, y] = queue.shift();
      if (isGoal(x, y)) {
        // Walk back to the first step.
        let k = K(x, y);
        while (prev.get(k) !== K(sx, sy)) k = prev.get(k);
        return { x: k % w.w, y: Math.floor(k / w.w) };
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (prev.has(K(nx, ny))) continue;
        if (!chaserCanWalk(nx, ny) && !(playerReachable && nx === p.x && ny === p.y)) continue;
        prev.set(K(nx, ny), K(x, y));
        queue.push([nx, ny]);
      }
    }
    return null;
  }

  // Obstacles marked `switch` power down while the lever is pulled.
  const poweredDown = o => o.switchable && S.world.lever;

  function updateObstacle(o, dt) {
    if (poweredDown(o)) return;
    if (o.chaser) return updateChaser(o, dt);
    if (o.arm) { o.angle += o.speed * dt; return; }
    if (o.comet) return updateComet(o, dt);
    if (o.wait > 0) { o.wait -= dt; return; }
    o.d += o.sign * o.speed * dt;
    if (o.d >= o.total || o.d <= 0) {
      o.d = Math.max(0, Math.min(o.total, o.d));
      o.sign = -o.sign;
      o.wait = o.pause;
    }
    let d = o.d;
    for (const seg of o.segs) {
      if (d <= seg.len || seg === o.segs[o.segs.length - 1]) {
        const t = seg.len ? Math.min(1, d / seg.len) : 0;
        o.x = seg.a.x + (seg.b.x - seg.a.x) * t;
        o.y = seg.a.y + (seg.b.y - seg.a.y) * t;
        return;
      }
      d -= seg.len;
    }
  }

  // Closest point on a spinning arm (a bar through its center) to (px, py).
  function armPoint(o, px, py) {
    const ux = Math.cos(o.angle);
    const uy = Math.sin(o.angle);
    const t = Math.max(-o.len, Math.min(o.len, (px - o.x) * ux + (py - o.y) * uy));
    return { x: o.x + ux * t, y: o.y + uy * t };
  }

  // 'on', 'warn' (about to switch on) or 'off'.
  function laserState(l) {
    if (l.switch && S.world.lever) return 'off';
    if (l.always || l.from) return 'on';
    const phase = (((S.levelTime + l.offset) % l.period) + l.period) % l.period;
    if (phase < l.on) return 'on';
    if (phase > l.period - LASER_WARN) return 'warn';
    return 'off';
  }

  // Tiles the beam actually reaches (it stops at the first crate).
  const litTiles = l => G.Rules.beamTiles(S.world, S.world.lasers[l.index]);

  const onLaserTile = (x, y) => S.lasers.some(l => laserState(l) !== 'off' && litTiles(l).some(t => t.x === x && t.y === y));

  // ---------- Movement along a path (walk, conveyor rides, teleports) ----------
  function segDur(m) {
    const next = m.path[m.seg + 1];
    if (next.tele) return TELE_DUR;
    if (next.jump) return JUMP_DUR;
    if (next.pull) return PULL_DUR;
    if (m.seg === 0) return STEP_DUR;
    return next.slide ? SLIDE_DUR : RIDE_DUR;
  }

  // Player position in tile units, including walk / ride / teleport / bounce animation.
  function playerPos() {
    const p = S.world.player;
    if (S.move) {
      const m = S.move;
      const a = m.path[m.seg];
      const b = m.path[m.seg + 1];
      if (b.tele) {
        return m.t < 0.5
          ? { x: a.x, y: a.y, hop: 0, scale: 1 - m.t * 2 }
          : { x: b.x, y: b.y, hop: 0, scale: (m.t - 0.5) * 2 };
      }
      const t = m.seg === 0 || b.jump ? ease(m.t) : m.t;
      const hop = b.jump ? Math.sin(m.t * Math.PI) * 0.9 : 0;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, hop, scale: 1 };
    }
    if (S.bounce) {
      const b = S.bounce;
      const t = ease(Math.min(1, b.t));
      return { x: b.fromX + (b.toX - b.fromX) * t, y: b.fromY + (b.toY - b.fromY) * t, hop: Math.sin(Math.min(1, b.t) * Math.PI) * 0.35, scale: 1 };
    }
    return { x: p.x, y: p.y, hop: 0, scale: 1 };
  }

  function cratePos(i) {
    const c = S.world.crates[i];
    const m = S.move;
    if (m && m.crate && !m.crate.fell && m.crate.index === i && m.seg === 0) {
      const t = ease(Math.min(1, m.t));
      const k = m.crate;
      return { x: k.fromX + (k.toX - k.fromX) * t, y: k.fromY + (k.toY - k.fromY) * t };
    }
    return c;
  }

  // Rocket position in pixels during the launch sequence.
  function rocketPos() {
    const e = S.world.exit;
    let y = e.y * TS;
    let shake = 0;
    if (S.screen === 'exit') {
      const t = S.exitT - 0.6;
      if (t > 0) {
        shake = t < 0.5 ? Math.sin(S.time * 60) * 3 : 0;
        const lift = Math.max(0, t - 0.4);
        y -= lift * lift * 520;
      } else if (S.exitT > 0.3) {
        shake = Math.sin(S.time * 60) * 2;
      }
    }
    return { x: e.x * TS + shake, y };
  }

  // ---------- Particles ----------
  function burst(px, py, color, n, opts = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (opts.speed || 160) * (0.4 + Math.random() * 0.8);
      S.particles.push({
        x: px, y: py,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opts.up || 0),
        life: 0, max: (opts.life || 0.8) * (0.7 + Math.random() * 0.6),
        color: Array.isArray(color) ? color[i % color.length] : color,
        size: opts.size || 4, gravity: opts.gravity || 0, star: !!opts.star,
      });
    }
  }

  const CONFETTI = ['#ff4757', '#2ed573', '#3d8bff', '#ffd32a', '#ff9ff3', '#ffffff'];
  const PORTAL = ['#b86bff', '#ffffff'];

  function updateParticles(dt) {
    for (const p of S.particles) {
      p.life += dt;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    S.particles = S.particles.filter(p => p.life < p.max);
  }

  // ---------- Events from the rules ----------
  function blockedFeedback(fresh, sound, hint) {
    if (!fresh && S.time - S.lastBlockAt <= 0.9) return false;
    G.Audio.play(sound);
    S.lastBlockAt = S.time;
    if (hint) S.idle = HINT_TIME; // show the way right away
    return true;
  }

  function handleEvents(events, fresh) {
    for (const e of events) {
      const cx = (e.x + 0.5) * TS;
      const cy = (e.y + 0.5) * TS;
      switch (e.type) {
        case 'pickup':
          G.Audio.play('pickup');
          burst(cx, cy, [G.Sprites.KEY_COLORS[e.color].C, '#ffffff'], 18, { star: true, size: 5 });
          S.idle = 0;
          break;
        case 'doorOpen':
          G.Audio.play('door');
          S.doorAnims.push({ x: e.x, y: e.y, color: e.color, t: 0 });
          S.doorFrames.push({ x: e.x, y: e.y });
          burst(cx, cy, G.Sprites.KEY_COLORS[e.color].C, 14, { size: 5 });
          S.moveLock = 0.3;
          S.idle = 0;
          break;
        case 'locked':
          if (blockedFeedback(fresh, 'locked', true)) S.shakes.push({ x: e.x, y: e.y, t: 0 });
          break;
        case 'field':
        case 'laser':
          blockedFeedback(fresh, 'zap', true);
          break;
        case 'block':
          G.Audio.play('pad');
          burst(cx, cy, ['#ff4757', '#ffffff'], 16, { star: true });
          S.idle = 0;
          break;
        case 'timed':
          if (blockedFeedback(fresh, 'thud', true)) S.shakes.push({ x: e.x, y: e.y, t: 0 });
          break;
        case 'timerStart':
          G.Audio.play('tick');
          S.timerAcc = 0;
          S.idle = 0;
          break;
        case 'gate':
          if (blockedFeedback(fresh, 'thud', true)) S.shakes.push({ x: e.x, y: e.y, t: 0 });
          break;
        case 'crateStuck':
        case 'oneway':
        case 'pit':
        case 'hole':
          blockedFeedback(fresh, 'thud', false);
          break;
        case 'block':
          blockedFeedback(fresh, 'thud', true);
          break;
        case 'mirrorBump':
          // Mirrors are turned with Space now; walking into one just bumps.
          if (blockedFeedback(fresh, 'thud', false)) S.shakes.push({ x: e.x, y: e.y, t: 0 });
          break;
        case 'mirror':
          G.Audio.play('mirror');
          burst(cx, cy, ['#bfe6ff', '#ffffff'], 10, { star: true, speed: 90 });
          break;
        case 'alien':
          if (blockedFeedback(fresh, 'alienHm', true)) S.shakes.push({ x: e.x, y: e.y, t: 0 });
          break;
        case 'alienHappy':
          G.Audio.play('alienHappy');
          S.alienAnims.push({ x: e.x, y: e.y, t: 0 });
          burst(cx, cy, ['#ff6fc8', '#2ed573', '#ffffff'], 20, { star: true });
          S.idle = 0;
          break;
        case 'fruit':
          G.Audio.play('pickup');
          burst(cx, cy, ['#ff9f1c', '#ffd32a', '#ffffff'], 16, { star: true, size: 5 });
          S.idle = 0;
          break;
        case 'shield':
          G.Audio.play('shield');
          S.shield = SHIELD_TIME;
          burst(cx, cy, ['#4fe3ff', '#ffffff'], 20, { star: true });
          break;
        case 'crack':
          G.Audio.play('thud');
          burst(cx, cy, ['#8a93ad', '#4a5068'], 6, { speed: 60, gravity: 200, size: 4 });
          break;
        case 'crumble':
          G.Audio.play('crumble');
          burst(cx, cy, ['#8a93ad', '#4a5068'], 12, { speed: 90, gravity: 200, size: 6 });
          break;
        case 'fill':
          G.Audio.play('thud');
          burst(cx, cy, ['#ff9f1c', '#b86a00'], 12, { speed: 100, size: 6 });
          S.idle = 0;
          break;
        case 'lever':
          G.Audio.play('lever');
          S.idle = 0;
          break;
        case 'colorSwitch':
          G.Audio.play('switch');
          burst(cx, cy, S.world.color ? ['#4fe3ff', '#ffffff'] : ['#ff6fc8', '#ffffff'], 14, { star: true });
          S.idle = 0;
          break;
        case 'push':
          G.Audio.play('push');
          break;
        case 'padOn':
          G.Audio.play('pad');
          burst(cx, cy, ['#3effc8', '#ffffff'], 16, { star: true });
          S.idle = 0;
          break;
        case 'fieldOpen':
          setTimeout(() => G.Audio.play('field'), 250);
          S.fieldAnim = 0;
          S.idle = 0;
          break;
      }
    }
  }

  function tryMove() {
    const d = G.Input.next();
    if (!d) return;
    S.dir = d.name;
    const res = G.Rules.step(S.world, d.dx, d.dy);
    // The rules pick up keys, fruit and helmets for the whole move at once (a slide or belt
    // ride can pass several tiles). Hold each one back until the player actually gets there.
    const pickupTypes = ['pickup', 'fruit', 'shield'];
    const now = res.events.filter(e => !pickupTypes.includes(e.type));
    if (res.moved) {
      for (const e of res.events) {
        if (!pickupTypes.includes(e.type)) continue;
        const at = res.path.findIndex((p, i) => i > 0 && p.x === e.x && p.y === e.y);
        S.pending.push({ event: e, at: at > 0 ? at : 1 });
      }
    }
    handleEvents(now, d.fresh);
    // After a push or an ice slide, check whether the level can still be finished; if not, the
    // restart button starts pulsing.
    // Things that can't always be undone: check the level can still be finished.
    const risky = ['crumble', 'fill', 'mirror', 'lever', 'colorSwitch', 'alienHappy'];
    if (res.crate || (res.path && res.path.some(p => p.slide || p.jump)) || res.events.some(e => risky.includes(e.type))) {
      startStuckCheck();
    }
    if (res.moved) {
      S.prevTile = res.from;
      S.move = { path: res.path, seg: 0, t: 0, crate: res.crate };
      G.Audio.play('step');
    }
  }

  // ---------- Secret: the fart spray ----------
  // In a level with chasing robots, F lets rip a green cloud that billows out from the astronaut
  // until it fills the whole level, then fades. Every chaser it reaches falls asleep for good.
  const FART_GROW = 1.8;   // seconds to fill the level
  const FART_FADE = 1.4;   // seconds to fade away

  function fart() {
    if (S.screen !== 'play' || S.fart || !S.obstacles.some(o => o.chaser)) return;
    const pv = playerPos();
    const x = (pv.x + 0.5) * TS;
    const y = (pv.y + 0.5) * TS;
    // Far enough to reach the furthest corner of the level.
    const W = S.world.w * TS;
    const H = S.world.h * TS;
    const maxR = Math.max(Math.hypot(x, y), Math.hypot(W - x, y), Math.hypot(x, H - y), Math.hypot(W - x, H - y)) + TS;
    S.fart = { x, y, t: 0, maxR };
    G.Audio.play('fart');
  }

  function fartRadius() {
    const f = S.fart;
    const k = Math.min(1, f.t / FART_GROW);
    return f.maxR * (1 - Math.pow(1 - k, 2)); // fast at first, then slowing down
  }

  function updateFart(dt) {
    const f = S.fart;
    if (!f) return;
    f.t += dt;
    const r = fartRadius();
    for (const o of S.obstacles) {
      if (!o.chaser || o.asleep) continue;
      if (Math.hypot((o.x + 0.5) * TS - f.x, (o.y + 0.5) * TS - f.y) < r) {
        o.asleep = true;
        o.nap = Infinity;
        burst((o.x + 0.5) * TS, (o.y + 0.2) * TS, ['#b8f28a', '#ffffff'], 10, { star: true, speed: 70 });
      }
    }
    if (f.t > FART_GROW + FART_FADE) S.fart = null;
  }

  // Space: turn a mirror next to the player - the one they're facing if there is one.
  const FACING = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  function useAction() {
    if (S.move || S.bounce) return;
    const w = S.world;
    const targets = G.Rules.useTargets(w);
    if (!targets.length) return;
    const [fx, fy] = FACING[S.dir];
    const t = targets.find(p => p.x === w.player.x + fx && p.y === w.player.y + fy) || targets[0];
    // Turn to face the mirror being turned.
    const dx = t.x - w.player.x;
    const dy = t.y - w.player.y;
    S.dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
    const res = G.Rules.flip(w, t.x, t.y);
    handleEvents(res.events, true);
    S.shakes.push({ x: t.x, y: t.y, t: 0 });
    startStuckCheck();
  }

  function startSegment(m) {
    const a = m.path[m.seg];
    const b = m.path[m.seg + 1];
    if (b.tele) {
      G.Audio.play('teleport');
      burst((a.x + 0.5) * TS, (a.y + 0.5) * TS, PORTAL, 14, { star: true, speed: 120 });
      burst((b.x + 0.5) * TS, (b.y + 0.5) * TS, PORTAL, 14, { star: true, speed: 120 });
    } else if (b.jump) {
      G.Audio.play('jump');
      // The pad springs up and tips toward the jump.
      S.padAnims.push({ x: a.x, y: a.y, dx: Math.sign(b.x - a.x), dy: Math.sign(b.y - a.y), t: 0 });
      burst((a.x + 0.5) * TS, (a.y + 0.8) * TS, ['#ffd32a', '#ffffff'], 8, { speed: 90, size: 4 });
    } else if (b.pull) {
      G.Audio.play('pull');
    } else if (b.slide) {
      if (m.seg === 1) G.Audio.play('slide');
    } else {
      G.Audio.play('ride');
    }
  }

  function updateMove(dt) {
    const m = S.move;
    m.t += dt / segDur(m);
    while (m.t >= 1) {
      m.t -= 1;
      const landed = m.path[m.seg + 1];
      firePending(m.seg + 1);
      if (landed.jump) {
        // A puff of dust where the jump lands.
        burst((landed.x + 0.5) * TS, (landed.y + 0.85) * TS, ['#c3cbe0', '#8a93ad'], 10, { speed: 70, size: 5 });
        G.Audio.play('thud');
      }
      m.seg++;
      if (m.seg >= m.path.length - 1) {
        finishMove();
        return;
      }
      startSegment(m);
    }
  }

  // The player has reached tile `index` of the current move: collect anything waiting there.
  // With no index, collect everything that's still waiting.
  function firePending(index) {
    const ready = S.pending.filter(p => index === undefined || p.at <= index);
    if (!ready.length) return;
    S.pending = S.pending.filter(p => !ready.includes(p));
    handleEvents(ready.map(p => p.event), false);
  }

  function finishMove() {
    firePending();
    S.move = null;
    S.walk++;
    const p = S.world.player;
    if (S.world.grid[p.y][p.x] === 'E') startExit();
  }

  function startExit() {
    S.screen = 'exit';
    S.exitT = 0;
    S.done.add(G.Levels[S.levelIndex].id);
    saveDone();
    G.Audio.play('launch');
    const e = S.world.exit;
    burst((e.x + 0.5) * TS, (e.y + 0.5) * TS, CONFETTI, 50, { star: true, speed: 320, gravity: 300, life: 1.6, up: 120, size: 6 });
  }

  // Bounce the player away from `src` (an obstacle or laser tile), preferring the tile they came from.
  function hitBy(src) {
    const pv = playerPos();
    const w = S.world;
    const here = w.player;
    const cands = [{ x: here.x, y: here.y }];
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => cands.push({ x: here.x + dx, y: here.y + dy }));
    if (S.prevTile) cands.push(S.prevTile);
    let best = { x: here.x, y: here.y };
    let bestScore = -Infinity;
    for (const c of cands) {
      const isHere = c.x === here.x && c.y === here.y;
      if (!isHere && !G.Rules.isPlain(w, c.x, c.y)) continue;
      let score = Math.hypot(c.x - src.x, c.y - src.y);
      if (isHere) score -= 0.01;
      if (S.prevTile && c.x === S.prevTile.x && c.y === S.prevTile.y) score += 0.5;
      if (onLaserTile(c.x, c.y)) score -= 10;
      if (score > bestScore) { bestScore = score; best = c; }
    }
    firePending();
    S.move = null;
    w.player = { x: best.x, y: best.y };
    S.bounce = { fromX: pv.x, fromY: pv.y, toX: best.x, toY: best.y, t: 0 };
    S.invuln = INVULN;
    // A bump can land you somewhere new, so check the level can still be finished.
    startStuckCheck();
    G.Audio.play('boing');
    burst((pv.x + 0.5) * TS, (pv.y + 0.5) * TS, ['#ffffff', '#ffd32a'], 10, { star: true, speed: 120 });
  }

  function checkHits() {
    if (S.invuln > 0 || S.bounce || S.shield > 0) return;
    const pv = playerPos();
    if (pv.scale < 1 || pv.hop > 0.4) return; // mid-teleport or high in a jump
    for (const o of S.obstacles) {
      if (poweredDown(o) || o.asleep) continue;
      if (o.arm) {
        const c = armPoint(o, pv.x, pv.y);
        if (Math.hypot(c.x - pv.x, c.y - pv.y) < 0.45) return hitBy(c);
        continue;
      }
      const reach = o.ufo ? 0.85 : HIT_DIST;
      if (Math.hypot(o.x - pv.x, o.y - pv.y) < reach) {
        if (o.chaser) o.nap = CHASER_NAP;
        return hitBy(o);
      }
    }
    for (const l of S.lasers) {
      // Always-on laser walls only stop you walking in (the rules handle that); blinking
      // lasers are the ones that bump you.
      if (l.always || laserState(l) !== 'on') continue;
      const t = litTiles(l).find(t => Math.hypot(t.x - pv.x, t.y - pv.y) < LASER_HIT);
      if (t) return hitBy(t);
    }
  }

  // Timed doors: the countdown ticks with every move and, more slowly, while standing still.
  function updateTimedDoors(dt) {
    const w = S.world;
    if (w.timer > 0 && !S.move) {
      S.timerAcc += dt;
      if (S.timerAcc >= TIMER_TICK) {
        S.timerAcc = 0;
        w.timer--;
        if (w.timer > 0 && w.timer <= 3) G.Audio.play('tick');
      }
    }
    const open = G.Rules.timedOpen(w);
    if (open !== S.timedOpen) {
      G.Audio.play(open ? 'gateOpen' : 'gateClose');
      S.timedOpen = open;
    }
    const onDoor = w.grid[w.player.y][w.player.x] === 'D';
    const target = open || onDoor ? 1 : 0;
    S.timedVis += Math.sign(target - S.timedVis) * Math.min(Math.abs(target - S.timedVis), dt * 6);
  }

  function updateGates(dt) {
    const w = S.world;
    const open = G.Rules.gatesOpen(w);
    if (open !== S.gatesOpen) {
      G.Audio.play(open ? 'gateOpen' : 'gateClose');
      S.gatesOpen = open;
    }
    const onGate = w.grid[w.player.y][w.player.x] === '=';
    const target = open || onGate ? 1 : 0;
    S.gateVis += Math.sign(target - S.gateVis) * Math.min(Math.abs(target - S.gateVis), dt * 5);
  }

  // "Can this level still be finished?" - a search spread over several frames so it never
  // causes a hiccup. If it runs out of states to try, the restart button starts pulsing.
  const STUCK_BUDGET = 300;   // states per frame
  const STUCK_LIMIT = 30000;  // give up (assume fine) beyond this

  function startStuckCheck() {
    const w = G.Rules.clone(S.world);
    S.stuckJob = { queue: [w], head: 0, seen: new Set([G.Rules.stateKey(w)]) };
  }

  function advanceStuckCheck() {
    const job = S.stuckJob;
    if (!job) return;
    for (let n = 0; n < STUCK_BUDGET; n++) {
      if (job.head >= job.queue.length) { S.stuck = true; S.stuckJob = null; return; }
      const cur = job.queue[job.head];
      job.queue[job.head++] = null;
      for (const { w: next, res } of G.Rules.successors(cur)) {
        if (res.events.some(e => e.type === 'exit')) { S.stuck = false; S.stuckJob = null; return; }
        const k = G.Rules.stateKey(next);
        if (job.seen.has(k)) continue;
        job.seen.add(k);
        job.queue.push(next);
      }
      if (job.seen.size > STUCK_LIMIT) { S.stuck = false; S.stuckJob = null; return; }
    }
  }

  function updatePlay(dt) {
    advanceStuckCheck();
    S.levelTime += dt;
    S.fadeIn = Math.max(0, S.fadeIn - dt);
    S.invuln = Math.max(0, S.invuln - dt);
    S.shield = Math.max(0, S.shield - dt);
    S.alienAnims.forEach(a => { a.t += dt; });
    S.padAnims.forEach(a => { a.t += dt; });
    S.padAnims = S.padAnims.filter(a => a.t < 0.5);
    updateFart(dt);
    S.alienAnims = S.alienAnims.filter(a => a.t < 1.2);
    S.leverAnim += Math.sign((S.world.lever ? 1 : 0) - S.leverAnim) * Math.min(Math.abs((S.world.lever ? 1 : 0) - S.leverAnim), dt * 6);
    S.moveLock = Math.max(0, S.moveLock - dt);
    S.obstacles.forEach(o => updateObstacle(o, dt));
    S.doorAnims.forEach(a => { a.t += dt / DOOR_ANIM; });
    S.doorAnims = S.doorAnims.filter(a => a.t < 1);
    S.shakes.forEach(s => { s.t += dt; });
    S.shakes = S.shakes.filter(s => s.t < 0.4);
    if (S.fieldAnim >= 0) S.fieldAnim += dt;

    if (S.move) updateMove(dt);
    else if (S.bounce) {
      S.bounce.t += dt / BOUNCE_DUR;
      if (S.bounce.t >= 1) S.bounce = null;
    }
    updateGates(dt);
    updateTimedDoors(dt);
    updateCamera(dt, false);
    if (S.screen !== 'play') return;
    if (!S.move && !S.bounce && S.moveLock <= 0) tryMove();
    checkHits();

    S.idle += dt;
    // Only re-plan the hint when something actually changed.
    const gk = G.Rules.stateKey(S.world);
    if (gk !== S.goalKey) {
      S.goalKey = gk;
      S.goal = G.Rules.nextGoal(S.world);
    }
  }

  function updateExit(dt) {
    S.exitT += dt;
    if (S.exitT > 0.6) {
      const r = rocketPos();
      for (let i = 0; i < 3; i++) {
        S.particles.push({
          x: r.x + TS / 2 + (Math.random() - 0.5) * 18, y: r.y + TS - 4,
          vx: (Math.random() - 0.5) * 60, vy: 120 + Math.random() * 120,
          life: 0, max: 0.4 + Math.random() * 0.3,
          color: ['#ffd32a', '#ff9f1c', '#ff4757', '#ffffff'][Math.floor(Math.random() * 4)],
          size: 6, gravity: 0, star: false,
        });
      }
    }
    if (S.exitT >= EXIT_DUR) {
      if (S.levelIndex + 1 < G.Levels.length) {
        loadLevel(S.levelIndex + 1);
      } else {
        S.screen = 'win';
        S.winT = 0;
        S.particles.length = 0;
        G.Audio.play('fanfare');
      }
    }
  }

  function updateWin(dt) {
    S.winT += dt;
    if (Math.random() < dt * 6) {
      burst(80 + Math.random() * 800, 60 + Math.random() * 200, CONFETTI, 20, { star: true, speed: 220, gravity: 260, life: 1.8, size: 6 });
    }
    if (S.winT > 1.5 && G.Input.takeTap()) openMenu();
    else if (S.winT <= 1.5) G.Input.clearTaps();
  }

  // ---------- Menu ----------
  // Highlights `sel` if given (e.g. the level just left), else the first unfinished level.
  function openMenu(sel) {
    S.screen = 'menu';
    S.particles.length = 0;
    const firstUndone = G.Levels.findIndex(l => !S.done.has(l.id));
    S.menuSel = sel !== undefined ? sel : (firstUndone >= 0 ? firstUndone : 0);
    G.Input.clearTaps();
  }

  // Menu: one page per world (2 rows of 5). Left/right walk through the levels and flip pages.
  function updateMenu() {
    const d = G.Input.next();
    if (!d || !d.fresh) return;
    const n = G.Levels.length;
    let sel = S.menuSel;
    const inPage = sel % PER_PAGE;
    if (d.name === 'left') sel = Math.max(0, sel - 1);
    else if (d.name === 'right') sel = Math.min(n - 1, sel + 1);
    else if (d.name === 'up' && inPage >= MENU_COLS) sel -= MENU_COLS;
    else if (d.name === 'down' && inPage < MENU_COLS && sel + MENU_COLS < n) sel += MENU_COLS;
    if (sel !== S.menuSel) {
      S.menuSel = sel;
      G.Audio.play('tick');
    }
  }

  function menuPage(delta) {
    const pages = Math.ceil(G.Levels.length / PER_PAGE);
    const page = Math.floor(S.menuSel / PER_PAGE) + delta;
    if (page < 0 || page >= pages) return;
    S.menuSel = page * PER_PAGE;
    G.Audio.play('tick');
  }

  function startLevel(i) {
    G.Audio.play('start');
    loadLevel(i);
  }

  function update(dt) {
    S.time += dt;
    updateParticles(dt);
    if (S.screen === 'title') {
      if (G.Input.takeTap()) openMenu();
    } else if (S.screen === 'menu') {
      updateMenu();
    } else if (S.screen === 'play') {
      updatePlay(dt);
    } else if (S.screen === 'exit') {
      updatePlay(dt); // lets obstacles keep moving and any final slide finish
      updateExit(dt);
    } else if (S.screen === 'win') {
      updateWin(dt);
    }
  }

  G.Game = {
    S,
    TS,
    EXIT_DUR,
    HINT_TIME,
    MENU_COLS,
    PER_PAGE,
    VIEW_W,
    VIEW_H,
    menuPage,
    update,
    playerPos,
    cratePos,
    rocketPos,
    laserState,
    armPoint,
    poweredDown,
    litTiles,
    openMenu,
    startLevel,
    // Enter / Space: the "go" key on menus.
    confirm() {
      if (S.screen === 'play') useAction();
      else if (S.screen === 'title') openMenu();
      else if (S.screen === 'menu') startLevel(S.menuSel);
      else if (S.screen === 'win' && S.winT > 1.5) openMenu();
    },
    home() {
      if (S.screen === 'play') openMenu(S.levelIndex);
      else if (S.screen === 'win') openMenu();
    },
    restart() { if (S.screen === 'play') loadLevel(S.levelIndex); },
    skip() { if (S.screen === 'play') startExit(); },
    fart,
    fartRadius,
    FART_GROW,
    FART_FADE,
  };
})(window.Game = window.Game || {});
