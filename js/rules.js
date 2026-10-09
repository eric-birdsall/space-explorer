// Pure game rules: parsing levels, moving on the grid, goal finding and a solver.
// No drawing or timing here, so the level checker can reuse exactly the same rules.
(function (G) {
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const CONVEYORS = { '>': [1, 0], '<': [-1, 0], '^': [0, -1], 'v': [0, 1] };
  // One-way tiles can only be entered moving in their direction.
  const ONE_WAY = { '}': [1, 0], '{': [-1, 0], 'A': [0, -1], 'V': [0, 1] };
  const DIR_NAMES = { right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1] };
  const MAX_CHAIN = 60;

  function parse(level) {
    const rows = level.map;
    const world = {
      w: rows[0].length,
      h: rows.length,
      grid: [],
      player: null,
      start: null,
      exit: null,
      keys: [],
      doors: [],
      crates: [],                       // { x, y, slick? } - slick crates slide on ice
      pads: [],
      buttons: [],
      teleports: [],
      receivers: [],                    // crystals (q) that open gates while a beam hits them
      mirrors: [],                      // { x, y, o: '/' | '\\' } - bump one to turn it
      aliens: [],                       // friendly aliens (a) move aside for a space fruit
      items: [],                        // fruits (f), shield helmets (h) and flashlights (t)
      cracked: [],                      // crumbly floor (*) stepped off once: cracked, still walkable
      crumbled: [],                     // crumbly floor stepped off twice: now a hole
      filled: [],                       // holes (_) filled in by a crate
      inv: { r: 0, g: 0, b: 0, y: 0, x: 0, f: 0 }, // keys by color, gems (x) and fruit (f)
      dark: !!level.dark,               // a dark level: only the area around the player is lit
      light: false,                     // flashlight picked up?
      hasField: false,
      fieldOpen: true,
      color: 0,                         // color switch: 0 = pink blocks up, 1 = cyan blocks up
      lever: false,                     // big lever pulled?
      leverBelts: !!level.leverReversesBelts,
      timers: [],                       // timer buttons (d)
      timer: 0,                         // moves left before timed doors (D) close
      timerMax: level.timer || 10,
      holdTimer: !!level.holdTimer,     // hint: this level needs a crate parked on the timer button
      crateSpots: (level.crateSpots || []).map(([x, y]) => ({ x, y })), // hint: where a crate should go
      // Lasers: a list of `tiles` shining from tiles[0] onward, or a beam traced `from` an emitter
      // in direction `dir`, bouncing off mirrors. `always` beams block the way; `switch` beams go
      // off while the lever is pulled.
      lasers: (level.lasers || []).map(l => ({
        tiles: l.tiles ? l.tiles.map(([x, y]) => ({ x, y })) : null,
        from: l.from ? { x: l.from[0], y: l.from[1] } : null,
        dir: l.dir ? DIR_NAMES[l.dir] : null,
        always: !!l.always,
        switch: !!l.switch,
      })),
      _beams: null,
    };
    // Counting doors (X) take their gem counts from `gemDoors`, in reading order.
    const gemNeeds = (level.gemDoors || []).slice();
    rows.forEach((row, y) => {
      if (row.length !== world.w) throw new Error(`Row ${y} has length ${row.length}, expected ${world.w}`);
      const line = [];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        let base = '.';
        if (ch === '#') base = '#';
        else if (ch === 'P') world.player = { x, y };
        else if (ch === 'E') { base = 'E'; world.exit = { x, y }; }
        else if (ch === 'o') { base = 'o'; world.pads.push({ x, y }); }
        else if (ch === 'F') { base = 'F'; world.hasField = true; world.fieldOpen = false; }
        else if (ch === '+') { base = '+'; world.buttons.push({ x, y }); }
        else if (ch === 'd') { base = 'd'; world.timers.push({ x, y }); }
        else if ('=D~J_*smcLOS'.includes(ch)) base = ch; // (S, a checkpoint beacon, is plain floor to the rules)
        else if (CONVEYORS[ch] || ONE_WAY[ch]) base = ch;
        else if (ch >= '1' && ch <= '9') { base = 'T'; world.teleports.push({ x, y, id: ch }); }
        else if (ch === 'q') { base = 'q'; world.receivers.push({ x, y }); }
        else if (ch === 'M' || ch === 'W') { base = 'M'; world.mirrors.push({ x, y, o: ch === 'M' ? '/' : '\\' }); }
        else if (ch === 'C') world.crates.push({ x, y });
        else if (ch === 'I') world.crates.push({ x, y, slick: true });
        else if (ch === 'a') world.aliens.push({ x, y });
        else if (ch === 'f' || ch === 'h' || ch === 't') world.items.push({ x, y, kind: ch });
        else if ('rgbyx'.includes(ch)) world.keys.push({ x, y, color: ch }); // a gem (x) is a key you count
        else if (ch === 'X') world.doors.push({ x, y, color: 'x', need: gemNeeds.length ? gemNeeds.shift() : 1 });
        else if ('RGBY'.includes(ch)) world.doors.push({ x, y, color: ch.toLowerCase() });
        else if (ch !== '.') throw new Error(`Unknown map character "${ch}" at ${x},${y}`);
        line.push(base);
      }
      world.grid.push(line);
    });
    if (!world.player) throw new Error('Level has no player start (P)');
    if (!world.exit) throw new Error('Level has no exit (E)');
    if (gemNeeds.length) throw new Error('`gemDoors` lists more counts than there are counting doors (X)');
    const gems = world.keys.filter(k => k.color === 'x').length;
    const needed = world.doors.reduce((n, d) => n + (d.color === 'x' ? d.need : 0), 0);
    if (needed > gems) throw new Error(`Counting doors need ${needed} gems but the level has ${gems}`);
    world.start = { x: world.player.x, y: world.player.y };
    const ids = {};
    world.teleports.forEach(t => { ids[t.id] = (ids[t.id] || 0) + 1; });
    Object.keys(ids).forEach(id => {
      if (ids[id] !== 2) throw new Error(`Teleporter ${id} needs exactly 2 tiles, found ${ids[id]}`);
    });
    return world;
  }

  const indexAt = (list, x, y) => list.findIndex(o => o.x === x && o.y === y);
  const has = (list, x, y) => indexAt(list, x, y) >= 0;
  const inBounds = (w, x, y) => x >= 0 && y >= 0 && x < w.w && y < w.h;

  // The tile as it is now: crumbly floor may have become a hole, and holes may be filled in.
  function tileAt(w, x, y) {
    let t = w.grid[y][x];
    if (t === '*' && has(w.crumbled, x, y)) t = '_';
    if (t === '_' && has(w.filled, x, y)) t = '.';
    return t;
  }

  const blockUp = (w, t) => (t === 'm' && w.color === 0) || (t === 'c' && w.color === 1);

  // Gates are open while any button has the player or a crate on it, or a beam hits a crystal.
  function gatesOpen(w) {
    return w.buttons.some(b => (w.player.x === b.x && w.player.y === b.y) || has(w.crates, b.x, b.y)) ||
      beams(w).receivers.size > 0;
  }

  // Timed doors are open while the countdown runs, or while the player or a crate is on a
  // timer button (a crate parked there holds them open for good).
  function timedOpen(w) {
    return w.timer > 0 || w.timers.some(b => (w.player.x === b.x && w.player.y === b.y) || has(w.crates, b.x, b.y));
  }

  function partner(w, x, y) {
    const t = w.teleports.find(o => o.x === x && o.y === y);
    return w.teleports.find(o => o.id === t.id && (o.x !== x || o.y !== y));
  }

  // ---------- Lasers ----------
  // Traces one laser. Returns the tiles it lights in order ({ x, y, mirror? }) and the crystal it
  // hits, if any. Beams stop at walls, crates, closed doors, raised blocks and aliens.
  function trace(w, laser) {
    if (laser.switch && w.lever) return { tiles: [], receiver: null };
    const tiles = [];
    if (laser.tiles) {
      for (const t of laser.tiles) {
        if (has(w.crates, t.x, t.y)) break;
        tiles.push(t);
      }
      return { tiles, receiver: null };
    }
    let x = laser.from.x;
    let y = laser.from.y;
    let [dx, dy] = laser.dir;
    for (let i = 0; i < 200; i++) {
      x += dx;
      y += dy;
      if (!inBounds(w, x, y)) break;
      const t = tileAt(w, x, y);
      if (t === '#' || blockUp(w, t) || has(w.crates, x, y) || has(w.doors, x, y) || has(w.aliens, x, y)) break;
      if (t === 'q') return { tiles, receiver: { x, y }, dir: [dx, dy] };
      if (t === 'M') {
        const m = w.mirrors.find(o => o.x === x && o.y === y);
        tiles.push({ x, y, mirror: true });
        [dx, dy] = m.o === '/' ? [-dy, -dx] : [dy, dx];
        continue;
      }
      if (t === 'F' && !w.fieldOpen) break;
      tiles.push({ x, y });
    }
    return { tiles, receiver: null, dir: [dx, dy] };
  }

  // Lit tiles of always-on beams, plus crystals being hit. Cached until the world changes.
  function beams(w) {
    if (w._beams) return w._beams;
    const lit = new Set();
    const receivers = new Set();
    for (const l of w.lasers) {
      const r = trace(w, l);
      if (l.always) r.tiles.forEach(t => { if (!t.mirror) lit.add(t.y * w.w + t.x); });
      if (r.receiver) receivers.add(r.receiver.y * w.w + r.receiver.x);
    }
    w._beams = { lit, receivers };
    return w._beams;
  }

  const beamTiles = (w, laser) => trace(w, laser).tiles.filter(t => !t.mirror);
  const inBeam = (w, x, y) => beams(w).lit.has(y * w.w + x);
  const changed = w => { w._beams = null; };

  // ---------- Walking ----------
  // Why the player can't enter a tile moving (dx,dy) (ignoring doors and crates), or null.
  // Without a direction, one-way tiles count as open (used by chasing robots).
  function blocker(w, x, y, dx, dy) {
    if (!inBounds(w, x, y) || w.grid[y][x] === '#') return 'wall';
    const t = tileAt(w, x, y);
    if (t === '_') return 'pit';
    if (t === 'O') return 'hole';
    if (t === 'q') return 'wall';
    if (t === 'M') return 'mirror';
    if (blockUp(w, t)) return 'block';
    if (t === 'F' && !w.fieldOpen) return 'field';
    if (t === '=' && !gatesOpen(w)) return 'gate';
    if (t === 'D' && !timedOpen(w)) return 'timed';
    const one = ONE_WAY[t];
    if (one && dx !== undefined && (one[0] !== dx || one[1] !== dy)) return 'oneway';
    if (has(w.aliens, x, y)) return 'alien';
    if (inBeam(w, x, y)) return 'laser';
    return null;
  }

  // Can a crate be pushed onto this tile? (Holes swallow the crate and become floor.)
  function crateCanEnter(w, x, y) {
    if (!inBounds(w, x, y)) return false;
    const t = tileAt(w, x, y);
    if (!'.o+d~_*'.includes(t)) return false;
    return !has(w.crates, x, y) && !has(w.doors, x, y) && !has(w.keys, x, y) && !has(w.items, x, y) && !has(w.aliens, x, y);
  }

  // A plain, empty tile the player can safely be bounced onto.
  function isPlain(w, x, y) {
    if (!inBounds(w, x, y)) return false;
    const t = tileAt(w, x, y);
    const ok = '.o+~*'.includes(t) || (t === 'F' && w.fieldOpen);
    return ok && !inBeam(w, x, y) && !has(w.crates, x, y) && !has(w.doors, x, y) && !has(w.keys, x, y) &&
      !has(w.items, x, y) && !has(w.aliens, x, y);
  }

  // Walkable right now moving (dx,dy) (keys and items don't block: they're picked up).
  function isOpen(w, x, y, dx, dy) {
    return !blocker(w, x, y, dx, dy) && !has(w.crates, x, y) && !has(w.doors, x, y);
  }

  function beltDir(w, t) {
    const c = CONVEYORS[t];
    if (!c) return null;
    return w.leverBelts && w.lever ? [-c[0], -c[1]] : c;
  }

  // After entering (x,y) moving in direction (dx,dy): follow teleporters, conveyor belts, ice,
  // jump pads and a black hole's pull. Returns the tiles visited after (x,y), marked with how
  // the player got there (tele / slide / jump / pull).
  function chain(w, x, y, dx, dy) {
    const pts = [];
    let cx = x;
    let cy = y;
    let justTeleported = false;
    for (let i = 0; i < MAX_CHAIN; i++) {
      const t = tileAt(w, cx, cy);
      if (t === 'T' && !justTeleported) {
        const p = partner(w, cx, cy);
        cx = p.x;
        cy = p.y;
        pts.push({ x: cx, y: cy, tele: true });
        justTeleported = true;
        continue;
      }
      justTeleported = false;
      const c = beltDir(w, t);
      if (c) {
        [dx, dy] = c;
        if (!isOpen(w, cx + dx, cy + dy, dx, dy)) break;
        cx += dx;
        cy += dy;
        pts.push({ x: cx, y: cy });
        continue;
      }
      // Ice: keep sliding the same way until something stops you.
      if (t === '~' && isOpen(w, cx + dx, cy + dy, dx, dy)) {
        cx += dx;
        cy += dy;
        pts.push({ x: cx, y: cy, slide: true });
        continue;
      }
      // Jump pad: hop over the next tile (anything but a wall) onto the one after.
      if (t === 'J') {
        const ox = cx + dx;
        const oy = cy + dy;
        const lx = cx + 2 * dx;
        const ly = cy + 2 * dy;
        if (inBounds(w, ox, oy) && w.grid[oy][ox] !== '#' && inBounds(w, lx, ly) && isOpen(w, lx, ly, dx, dy)) {
          cx = lx;
          cy = ly;
          pts.push({ x: cx, y: cy, jump: true });
          continue;
        }
      }
      break;
    }
    // A black hole two tiles away in a straight, clear line pulls you one tile closer
    // (but reaching the rocket always counts).
    if (w.grid[cy][cx] === 'E') return pts;
    for (const [hx, hy] of DIRS) {
      const bx = cx + 2 * hx;
      const by = cy + 2 * hy;
      if (inBounds(w, bx, by) && tileAt(w, bx, by) === 'O' && isOpen(w, cx + hx, cy + hy)) {
        cx += hx;
        cy += hy;
        pts.push({ x: cx, y: cy, pull: true });
        break;
      }
    }
    return pts;
  }

  function pickup(w, x, y, events) {
    const ki = indexAt(w.keys, x, y);
    if (ki >= 0) {
      const key = w.keys.splice(ki, 1)[0];
      w.inv[key.color]++;
      events.push({ type: 'pickup', x, y, color: key.color });
    }
    const ii = indexAt(w.items, x, y);
    if (ii >= 0) {
      const item = w.items.splice(ii, 1)[0];
      if (item.kind === 'f') {
        w.inv.f++;
        events.push({ type: 'fruit', x, y });
      } else if (item.kind === 't') {
        w.light = true;
        events.push({ type: 'flashlight', x, y });
      } else {
        events.push({ type: 'shield', x, y });
      }
    }
  }

  // Try to move the player one tile. Mutates the world and returns what happened.
  // `path` lists every tile the player passes through, starting where they were.
  function step(w, dx, dy) {
    const tx = w.player.x + dx;
    const ty = w.player.y + dy;
    const block = blocker(w, tx, ty, dx, dy);
    if (block === 'mirror') return { moved: false, events: [{ type: 'mirrorBump', x: tx, y: ty }] };
    if (block === 'alien') {
      if (w.inv.f > 0) {
        w.inv.f--;
        w.aliens.splice(indexAt(w.aliens, tx, ty), 1);
        changed(w);
        return { moved: false, events: [{ type: 'alienHappy', x: tx, y: ty }] };
      }
      return { moved: false, events: [{ type: 'alien', x: tx, y: ty }] };
    }
    if (block) return { moved: false, events: [{ type: block, x: tx, y: ty }] };

    const di = indexAt(w.doors, tx, ty);
    if (di >= 0) {
      const door = w.doors[di];
      const need = door.need || 1; // counting doors use up that many gems
      if (w.inv[door.color] >= need) {
        w.inv[door.color] -= need;
        w.doors.splice(di, 1);
        changed(w);
        return { moved: false, events: [{ type: 'doorOpen', x: tx, y: ty, color: door.color, need }] };
      }
      return { moved: false, events: [{ type: 'locked', x: tx, y: ty, color: door.color }] };
    }

    const events = [];
    let crate = null;
    const ci = indexAt(w.crates, tx, ty);
    if (ci >= 0) {
      const box = w.crates[ci];
      let cx = tx + dx;
      let cy = ty + dy;
      if (!crateCanEnter(w, cx, cy)) return { moved: false, events: [{ type: 'crateStuck' }] };
      // Slippery crates keep sliding across ice.
      while (box.slick && tileAt(w, cx, cy) === '~' && crateCanEnter(w, cx + dx, cy + dy)) {
        cx += dx;
        cy += dy;
      }
      w.crates[ci] = { x: cx, y: cy, slick: box.slick };
      changed(w);
      // Pushing a crate out of a beam would leave the player standing in it: not allowed.
      if (inBeam(w, tx, ty)) {
        w.crates[ci] = box;
        changed(w);
        return { moved: false, events: [{ type: 'laser', x: tx, y: ty }] };
      }
      crate = { index: ci, fromX: tx, fromY: ty, toX: cx, toY: cy };
      events.push({ type: 'push' });
      const under = tileAt(w, cx, cy);
      if (under === '_') {
        // The crate drops into the hole and fills it.
        w.crates.splice(ci, 1);
        w.filled = w.filled.concat([{ x: cx, y: cy }]);
        crate.fell = true;
        changed(w);
        events.push({ type: 'fill', x: cx, y: cy });
      } else {
        if (w.lasers.some(l => l.tiles && l.tiles.some(t => t.x === cx && t.y === cy))) events.push({ type: 'block', x: cx, y: cy });
        if (under === 'o' || under === '+') events.push({ type: 'padOn', x: cx, y: cy });
      }
      if (!w.fieldOpen && w.pads.every(p => has(w.crates, p.x, p.y))) {
        w.fieldOpen = true; // stays open for good, so nothing can be undone by accident
        changed(w);
        events.push({ type: 'fieldOpen' });
      }
    }

    const from = { x: w.player.x, y: w.player.y };
    w.player = { x: tx, y: ty };
    pickup(w, tx, ty, events);
    const path = [from, { x: tx, y: ty }];
    for (const p of chain(w, tx, ty, dx, dy)) {
      w.player = { x: p.x, y: p.y };
      pickup(w, p.x, p.y, events);
      path.push(p);
    }
    // Crumbly floor cracks the first time you step off it and gives way the second time.
    for (let i = 0; i < path.length - 1; i++) {
      const p = path[i];
      if (w.grid[p.y][p.x] !== '*' || has(w.crumbled, p.x, p.y)) continue;
      if (has(w.cracked, p.x, p.y)) {
        w.crumbled = w.crumbled.concat([{ x: p.x, y: p.y }]);
        events.push({ type: 'crumble', x: p.x, y: p.y });
      } else {
        w.cracked = w.cracked.concat([{ x: p.x, y: p.y }]);
        events.push({ type: 'crack', x: p.x, y: p.y });
      }
    }
    // Levers and color switches flip when you step onto them.
    for (let i = 1; i < path.length; i++) {
      const t = tileAt(w, path[i].x, path[i].y);
      if (t === 'L') { w.lever = !w.lever; changed(w); events.push({ type: 'lever', x: path[i].x, y: path[i].y }); }
      if (t === 's') { w.color = 1 - w.color; changed(w); events.push({ type: 'colorSwitch', x: path[i].x, y: path[i].y }); }
    }
    if (path.some(p => p.pull)) events.push({ type: 'pull' });
    // Each move uses up one tick of a running countdown; touching a timer button restarts it.
    if (w.timer > 0) w.timer--;
    if (path.some(p => w.grid[p.y][p.x] === 'd')) {
      w.timer = w.timerMax;
      events.push({ type: 'timerStart' });
    }
    if (w.grid[w.player.y][w.player.x] === 'E') events.push({ type: 'exit' });
    return { moved: true, from, crate, path, events };
  }

  // Mirrors next to the player (up, down, left, right) that Space can turn.
  function useTargets(w) {
    return DIRS.map(([dx, dy]) => ({ x: w.player.x + dx, y: w.player.y + dy }))
      .filter(p => has(w.mirrors, p.x, p.y));
  }

  // Turn the mirror at (x,y) between / and \. Mutates the world, like `step`.
  function flip(w, x, y) {
    const mi = indexAt(w.mirrors, x, y);
    if (mi < 0) return { moved: false, events: [] };
    w.mirrors[mi] = { x, y, o: w.mirrors[mi].o === '/' ? '\\' : '/' };
    changed(w);
    return { moved: false, events: [{ type: 'mirror', x, y }] };
  }

  // Every action the player could take from here: the four moves plus turning any mirror
  // they're standing next to. Solvers and checkers use this so they see what the player sees.
  function successors(w) {
    const out = [];
    for (const [dx, dy] of DIRS) {
      const n = clone(w);
      out.push({ move: [dx, dy], w: n, res: step(n, dx, dy) });
    }
    for (const t of useTargets(w)) {
      const n = clone(w);
      out.push({ use: t, w: n, res: flip(n, t.x, t.y) });
    }
    return out;
  }

  // Shortest path from (sx,sy) to (tx,ty), riding belts, ice, jump pads and teleporters like
  // the player would. The target itself may be blocked (a door, crate, lever or mirror).
  function findPath(w, sx, sy, tx, ty) {
    const K = (x, y) => y * w.w + x;
    const prev = new Map([[K(sx, sy), null]]);
    const walk = k => {
      const out = [];
      let e = prev.get(k);
      while (e) {
        out.unshift(...e.pts);
        e = prev.get(e.parent);
      }
      out.unshift({ x: sx, y: sy });
      return out;
    };
    const queue = [{ x: sx, y: sy }];
    while (queue.length) {
      const cur = queue.shift();
      const ck = K(cur.x, cur.y);
      for (const [dx, dy] of DIRS) {
        const nx = cur.x + dx;
        const ny = cur.y + dy;
        if (nx === tx && ny === ty) return walk(ck).concat([{ x: nx, y: ny }]);
        if (!isOpen(w, nx, ny, dx, dy)) continue;
        const pts = [{ x: nx, y: ny }].concat(chain(w, nx, ny, dx, dy));
        const hit = pts.findIndex(p => p.x === tx && p.y === ty);
        if (hit >= 0) return walk(ck).concat(pts.slice(0, hit + 1));
        const end = pts[pts.length - 1];
        const ek = K(end.x, end.y);
        if (prev.has(ek)) continue;
        prev.set(ek, { parent: ck, pts });
        queue.push(end);
      }
    }
    return null;
  }

  // Tiles a crate still needs to be pushed onto.
  function crateTargets(w) {
    const covered = p => has(w.crates, p.x, p.y);
    const targets = [];
    if (!w.fieldOpen) targets.push(...w.pads.filter(p => !covered(p)));
    if (w.buttons.length && !w.buttons.some(covered)) targets.push(...w.buttons);
    for (const l of w.lasers) {
      if (l.always && l.tiles && beamTiles(w, l).length) targets.push(...l.tiles);
    }
    if (w.holdTimer && !w.timers.some(covered)) targets.push(...w.timers);
    targets.push(...w.crateSpots.filter(p => !covered(p)));
    return targets;
  }

  // What should the child do next? Returns { x, y, kind, path, pad? } or null.
  function nextGoal(w) {
    const p = w.player;
    const targets = crateTargets(w);
    // A crate already doing its job (on a pad, button, timer, beam or marked spot) is left alone.
    const onTarget = c => 'o+d'.includes(w.grid[c.y][c.x]) || w.crateSpots.some(s => s.x === c.x && s.y === c.y) ||
      w.lasers.some(l => l.always && l.tiles && l.tiles.some(t => t.x === c.x && t.y === c.y));
    const toggles = [];
    w.grid.forEach((row, y) => row.forEach((t, x) => { if (t === 'L' || t === 's') toggles.push({ x, y, kind: 'switch' }); }));
    const groups = [
      w.doors.filter(d => w.inv[d.color] >= (d.need || 1)).map(d => ({ x: d.x, y: d.y, kind: 'door' })),
      w.inv.f > 0 ? w.aliens.map(a => ({ x: a.x, y: a.y, kind: 'alien' })) : [],
      w.keys.map(k => ({ x: k.x, y: k.y, kind: 'key' }))
        .concat(w.items.filter(i => i.kind === 'f' && w.aliens.length).map(i => ({ x: i.x, y: i.y, kind: 'key' }))),
      // Groups that can't be reached are skipped, so the exit wins as soon as it's reachable.
      [{ x: w.exit.x, y: w.exit.y, kind: 'exit' }],
      // A timed door is in the way: go press its timer button.
      !timedOpen(w) && !w.holdTimer ? w.timers.map(b => ({ x: b.x, y: b.y, kind: 'timer' })) : [],
      targets.length ? w.crates.filter(c => !onTarget(c)).map(c => ({ x: c.x, y: c.y, kind: 'crate' })) : [],
      // Still stuck? Try a lever, a color switch or a mirror.
      toggles.concat(w.mirrors.map(m => ({ x: m.x, y: m.y, kind: 'mirror' }))),
    ];
    for (const group of groups) {
      let best = null;
      for (const g of group) {
        if (g.x === p.x && g.y === p.y) continue;
        const path = findPath(w, p.x, p.y, g.x, g.y);
        if (path && (!best || path.length < best.path.length)) best = Object.assign({ path }, g);
      }
      if (best) {
        if (best.kind === 'crate') {
          // Highlight the target this crate can most easily reach.
          let bestLen = Infinity;
          for (const t of targets) {
            const tp = findPath(w, best.x, best.y, t.x, t.y);
            if (tp && tp.length < bestLen) { bestLen = tp.length; best.pad = t; }
          }
        }
        return best;
      }
    }
    return null;
  }

  // Copy only what `step` changes; the grid, pads, buttons, teleporters and lasers are shared.
  const clone = w => Object.assign({}, w, {
    player: { x: w.player.x, y: w.player.y },
    keys: w.keys.slice(),
    doors: w.doors.slice(),
    crates: w.crates.slice(),
    mirrors: w.mirrors.slice(),
    aliens: w.aliens.slice(),
    items: w.items.slice(),
    inv: Object.assign({}, w.inv),
    _beams: null,
  });

  // Checkpoints: everything about a world that changes during play, as plain data, and back.
  const LIVE = ['player', 'keys', 'doors', 'crates', 'mirrors', 'aliens', 'items', 'cracked', 'crumbled', 'filled',
    'inv', 'fieldOpen', 'color', 'lever', 'timer', 'light'];
  function snapshot(w) {
    const out = {};
    LIVE.forEach(k => { out[k] = w[k]; });
    return JSON.parse(JSON.stringify(out));
  }
  function restore(w, snap) {
    Object.assign(w, JSON.parse(JSON.stringify(snap)));
    changed(w);
    return w;
  }

  function stateKey(w) {
    const list = a => a.map(o => `${o.x},${o.y}`).sort().join(';');
    return [
      w.player.x, w.player.y,
      list(w.keys), list(w.doors), list(w.crates), list(w.items), list(w.aliens),
      list(w.cracked), list(w.crumbled), list(w.filled),
      w.mirrors.map(m => m.o).join(''),
      w.inv.r, w.inv.g, w.inv.b, w.inv.y, w.inv.x, w.inv.f,
      w.fieldOpen ? 1 : 0, w.color, w.lever ? 1 : 0,
      w.timer,
    ].join('|');
  }

  // Breadth-first search over full game states (ignoring moving obstacles and timed lasers).
  function solve(level, maxStates = 200000) {
    const start = parse(level);
    const seen = new Set([stateKey(start)]);
    const queue = [{ w: start, moves: 0 }];
    while (queue.length) {
      const { w, moves } = queue.shift();
      for (const { w: n, res } of successors(w)) {
        if (res.events.some(e => e.type === 'exit')) return { solvable: true, moves: moves + 1, states: seen.size };
        const k = stateKey(n);
        if (seen.has(k)) continue;
        seen.add(k);
        if (seen.size > maxStates) return { solvable: false, reason: 'state limit reached', states: seen.size };
        queue.push({ w: n, moves: moves + 1 });
      }
    }
    return { solvable: false, reason: 'exit unreachable', states: seen.size };
  }

  // Can the level still be finished from this state? (Used to spot softlocks.)
  function canFinish(w, maxStates = 20000) {
    const seen = new Set([stateKey(w)]);
    const queue = [w];
    while (queue.length) {
      const cur = queue.shift();
      for (const { w: n, res } of successors(cur)) {
        if (res.events.some(e => e.type === 'exit')) return true;
        const k = stateKey(n);
        if (seen.has(k)) continue;
        seen.add(k);
        if (seen.size > maxStates) return true;
        queue.push(n);
      }
    }
    return false;
  }

  G.Rules = {
    parse, clone, snapshot, restore, step, flip, useTargets, successors, stateKey, tileAt, isPlain, isOpen, gatesOpen, timedOpen, beamTiles, trace,
    findPath, nextGoal, solve, canFinish, CONVEYORS, ONE_WAY,
  };
})(window.Game = window.Game || {});
