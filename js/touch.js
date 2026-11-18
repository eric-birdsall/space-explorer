// Touch controls for tablets and phones: a round on-screen arrow pad that feeds the same input as
// the arrow keys, a round action button ("go" on the menus, "turn the mirror" during play), and a
// HUD canvas with the home / sound / restart buttons and the level badge. layout() places them.
(function (G) {
  const root = document.documentElement;
  const canvas = document.getElementById('game');
  const hudCanvas = document.getElementById('hud');
  const dpad = document.getElementById('dpad');
  const padHit = dpad.querySelector('.pad-hit');
  const action = document.getElementById('action');

  // The four wedges: one shape, rotated. Each has an edge (its side, seen below it) and a cap.
  const WEDGE = 'M36.4 36.4 A90 90 0 0 1 163.6 36.4 L124.7 75.3 A35 35 0 0 0 75.3 75.3 Z';
  const arrows = {};
  [['ArrowUp', 0], ['ArrowRight', 90], ['ArrowDown', 180], ['ArrowLeft', 270]].forEach(([key, turn]) => {
    const ns = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('transform', `rotate(${turn} 100 100)`);
    g.innerHTML = `<g class="wedge"><path class="wedge-edge" d="${WEDGE}" transform="translate(0 4)"/>` +
      `<g class="wedge-cap"><path class="wedge-top" d="${WEDGE}"/>` +
      '<polygon class="wedge-arrow" points="100,23 116,47 84,47"/></g></g>';
    dpad.querySelector('.wedges').appendChild(g);
    arrows[key] = g.firstChild;
  });

  const ICONS = {
    go: '<svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg>',
    turn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 3v5h-5"/></svg>',
  };

  let layoutReady = false; // layout() needs the constants further down; see the end of this file
  function enable() {
    if (G.touch) return;
    G.touch = true;
    root.classList.add('touch');
    if (layoutReady) layout();
  }
  // Show the pad on touch screens (add ?touch=1 to the address to try it with a mouse).
  if (window.matchMedia('(any-pointer: coarse)').matches || /[?&]touch=1/.test(location.search)) enable();
  window.addEventListener('touchstart', enable, { passive: true });

  // iOS only lets sound start from a finished tap, so wake the audio on those too.
  function wake() {
    G.Audio.ensure();
    G.Audio.startMusic();
  }
  ['touchend', 'click'].forEach(type => window.addEventListener(type, wake, { passive: true }));

  // Stop the page from zooming, scrolling or popping up menus while playing.
  ['gesturestart', 'dblclick', 'contextmenu'].forEach(type => {
    document.addEventListener(type, e => { if (G.touch) e.preventDefault(); });
  });
  document.addEventListener('touchmove', e => { if (G.touch) e.preventDefault(); }, { passive: false });

  // ---------- Arrow pad ----------
  // One finger at a time. The arrow is chosen by where the finger is relative to the middle of
  // the pad, so a thumb can slide from one arrow to the next without lifting. Only touches that
  // start inside the round pad count, so a hand resting near it doesn't start walking.
  let padPointer = null;
  let padKey = null;

  function setPadKey(key) {
    if (key === padKey) return;
    if (padKey) {
      G.Input.release(padKey);
      arrows[padKey].classList.remove('down');
    }
    padKey = key;
    if (key) {
      G.Input.press(key);
      arrows[key].classList.add('down');
      dpad.dataset.dir = key;
    } else {
      delete dpad.dataset.dir;
    }
  }

  function keyAt(e) {
    const r = dpad.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) < r.width * 0.08) return padKey; // tiny dead zone in the very middle
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'ArrowRight' : 'ArrowLeft';
    return dy > 0 ? 'ArrowDown' : 'ArrowUp';
  }

  padHit.addEventListener('pointerdown', e => {
    e.preventDefault();
    wake();
    if (padPointer !== null) return;
    padPointer = e.pointerId;
    try { padHit.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
    dpad.classList.add('active');
    setPadKey(keyAt(e));
  });
  padHit.addEventListener('pointermove', e => {
    if (e.pointerId === padPointer) setPadKey(keyAt(e));
  });
  function padUp(e) {
    if (e.pointerId !== padPointer) return;
    padPointer = null;
    dpad.classList.remove('active');
    setPadKey(null);
  }
  padHit.addEventListener('pointerup', padUp);
  padHit.addEventListener('pointercancel', padUp);
  padHit.addEventListener('lostpointercapture', padUp);
  window.addEventListener('blur', () => { padPointer = null; dpad.classList.remove('active'); setPadKey(null); });

  // ---------- HUD buttons (home, sound, restart, level badge) ----------
  hudCanvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    wake();
    const r = hudCanvas.getBoundingClientRect();
    G.pressButton(G.Render.hitHud(e.clientX - r.left, e.clientY - r.top));
  });

  // ---------- Action button ----------
  action.addEventListener('pointerdown', e => {
    e.preventDefault();
    wake();
    action.classList.add('down');
    G.Game.confirm();
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => {
    action.addEventListener(type, () => action.classList.remove('down'));
  });

  // What the action button would do right now: 'go', 'turn' or nothing.
  function actionMode() {
    const S = G.Game.S;
    if (S.screen === 'title' || S.screen === 'menu') return 'go';
    if (S.screen === 'win') return S.winT > 1.5 ? 'go' : null;
    if (S.screen === 'play' && G.Rules.useTargets(S.world).length) return 'turn';
    return null;
  }

  let shown = null;
  function refresh() {
    requestAnimationFrame(refresh);
    if (!G.touch) return;
    const mode = actionMode();
    if (mode === shown) return;
    shown = mode;
    action.classList.toggle('show', !!mode);
    if (mode) action.innerHTML = ICONS[mode];
  }
  requestAnimationFrame(refresh);

  // ---------- Layout ----------
  // The game is 960 x 640 (3:2) and its levels have a one-tile wall all round (64 px).
  //  bar   (landscape, up to 1.75:1, i.e. iPads): the game on top and a bar below it for the
  //        buttons and badge. The pad hangs over the bottom-right corner, half see-through, and
  //        the game is made only as big as keeps the pad on the outer wall (never on the level).
  //  sides (wider landscape, i.e. phones): buttons and badge on the left, pad on the right.
  //  stack (portrait): the game on top, then the buttons row, then the action button and pad.
  const BAR_MIN = 64;   // the buttons and badge are 48-52 px tall
  const PAD_GAP = 6;    // between the pad and the inside of the outer wall
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function place(el, x, y, w, h) {
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
  }

  // Largest scale of the 960 x 640 game, centered across the width at the top, for which a pad of
  // radius r centred at (cx, cy) stays outside the wall ring's inside edge.
  function safeScale(X, Y, W, H, cx, cy, r) {
    for (let k = Math.min(W / 960, (H - BAR_MIN) / 640); k > 0.2; k -= 0.002) {
      const gx = X + (W - 960 * k) / 2;
      const x0 = gx + 64 * k, x1 = gx + 896 * k, y0 = Y + 64 * k, y1 = Y + 576 * k;
      const dx = Math.max(x0 - cx, 0, cx - x1);
      const dy = Math.max(y0 - cy, 0, cy - y1);
      if (Math.hypot(dx, dy) >= r + PAD_GAP) return k;
    }
    return 0.2;
  }

  function layout() {
    if (!G.touch) return;
    const cs = getComputedStyle(document.body);
    const X = parseFloat(cs.paddingLeft) || 0;
    const Y = parseFloat(cs.paddingTop) || 0;
    const W = window.innerWidth - X - (parseFloat(cs.paddingRight) || 0);
    const H = window.innerHeight - Y - (parseFloat(cs.paddingBottom) || 0);
    const mode = W < H ? 'stack' : W / H <= 1.75 ? 'bar' : 'sides';
    root.dataset.layout = mode;

    let game, hud, hudMode, pad, act;
    if (mode === 'bar') {
      const r = clamp(W * 0.09, 72, 110);
      const cx = X + W - r - 8;
      const cy = Y + H - r - 8;
      const k = safeScale(X, Y, W, H, cx, cy, r);
      game = { x: X + (W - 960 * k) / 2, y: Y, w: 960 * k };
      const gh = 640 * k;
      const a = r * 0.85;
      act = { x: cx - r - 16 - a, y: clamp(cy - a / 2, Y + gh + 6, Y + H - a - 10), s: a };
      hud = { x: game.x, y: Y + gh, w: game.w, h: H - gh };
      hud.free = act.x - 8 - hud.x;
      hudMode = 'row';
      pad = { cx, cy, r };
    } else if (mode === 'sides') {
      const r = clamp(H * 0.2, 55, 85);
      const right = 2 * r + 24;
      const leftMin = 72;
      const gw = Math.min(H * 1.5, W - right - leftMin);
      let left = Math.max(leftMin, (W - gw) / 2);
      if (W - gw - left < right) left = W - gw - right;
      game = { x: X + left, y: Y + (H - gw / 1.5) / 2, w: gw };
      const colX = game.x + gw;
      const colW = X + W - colX;
      pad = { cx: colX + colW / 2, cy: Y + H - r - 16, r };
      const a = r * 0.9;
      act = { x: pad.cx - a / 2, y: Math.max(Y + 8, pad.cy - r - 24 - a), s: a };
      hud = { x: X, y: Y, w: left, h: H };
      hudMode = 'column';
    } else {
      const r = clamp(W * 0.17, 70, 120);
      const rowH = BAR_MIN + 8;
      const need = rowH + 2 * r + 40;
      const gw = Math.min(W, (H - need) * 1.5);
      const gh = gw / 1.5;
      const top = Y + Math.max(0, (H - gh - need) / 2);
      game = { x: X + (W - gw) / 2, y: top, w: gw };
      hud = { x: X, y: top + gh + 4, w: W, h: rowH };
      hudMode = 'row';
      pad = { cx: X + W * 0.68, cy: hud.y + rowH + 16 + r, r };
      const a = r * 0.9;
      act = { x: X + W * 0.25 - a / 2, y: pad.cy - a / 2, s: a };
    }
    place(canvas, game.x, game.y, game.w, game.w / 1.5);
    place(hudCanvas, hud.x, hud.y, hud.w, hud.h);
    place(dpad, pad.cx - pad.r, pad.cy - pad.r, pad.r * 2, pad.r * 2);
    place(action, act.x, act.y, act.s, act.s);
    G.Render.setHud(hudCanvas, { w: hud.w, h: hud.h, mode: hudMode, free: hud.free || hud.w });
  }
  window.addEventListener('resize', layout);
  window.addEventListener('orientationchange', () => setTimeout(layout, 100));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', layout);
  layoutReady = true;
  layout();

  // ---------- Secret: tap the astronaut (same as the F key) ----------
  canvas.addEventListener('pointerdown', e => {
    const S = G.Game.S;
    if (S.screen !== 'play') return;
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) * canvas.width) / r.width + S.cam.x;
    const y = ((e.clientY - r.top) * canvas.height) / r.height + S.cam.y;
    const pv = G.Game.playerPos();
    const TS = G.Game.TS;
    const slop = TS * 0.4;
    if (x > pv.x * TS - slop && x < (pv.x + 1) * TS + slop && y > pv.y * TS - slop && y < (pv.y + 1) * TS + slop) G.Game.fart();
  });
})(window.Game = window.Game || {});
