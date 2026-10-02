// Touch controls for tablets and phones: an on-screen arrow pad that feeds the same input as the
// arrow keys, plus a round action button ("go" on the menus, "turn the mirror" during play).
(function (G) {
  const root = document.documentElement;
  const canvas = document.getElementById('game');
  const dpad = document.getElementById('dpad');
  const action = document.getElementById('action');
  const arrows = {};
  dpad.querySelectorAll('.arrow').forEach(el => { arrows[el.dataset.key] = el; });

  const ICONS = {
    go: '<svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg>',
    turn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 3v5h-5"/></svg>',
  };

  function enable() {
    if (G.touch) return;
    G.touch = true;
    root.classList.add('touch');
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
  // the pad, so a thumb can slide from one arrow to the next without lifting.
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

  dpad.addEventListener('pointerdown', e => {
    e.preventDefault();
    wake();
    if (padPointer !== null) return;
    padPointer = e.pointerId;
    try { dpad.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
    setPadKey(keyAt(e));
  });
  dpad.addEventListener('pointermove', e => {
    if (e.pointerId === padPointer) setPadKey(keyAt(e));
  });
  function padUp(e) {
    if (e.pointerId !== padPointer) return;
    padPointer = null;
    setPadKey(null);
  }
  dpad.addEventListener('pointerup', padUp);
  dpad.addEventListener('pointercancel', padUp);
  dpad.addEventListener('lostpointercapture', padUp);
  window.addEventListener('blur', () => { padPointer = null; setPadKey(null); });

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

  // ---------- Secret: tap the astronaut three times quickly (same as the F key) ----------
  let secretTaps = [];
  canvas.addEventListener('pointerdown', e => {
    const S = G.Game.S;
    if (S.screen !== 'play') return;
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) * canvas.width) / r.width + S.cam.x;
    const y = ((e.clientY - r.top) * canvas.height) / r.height + S.cam.y;
    const pv = G.Game.playerPos();
    const TS = G.Game.TS;
    const slop = TS * 0.4;
    const onPlayer = x > pv.x * TS - slop && x < (pv.x + 1) * TS + slop && y > pv.y * TS - slop && y < (pv.y + 1) * TS + slop;
    const now = performance.now();
    secretTaps = onPlayer ? secretTaps.filter(t => now - t < 1200).concat(now) : [];
    if (secretTaps.length >= 3) {
      secretTaps = [];
      G.Game.fart();
    }
  });
})(window.Game = window.Game || {});
