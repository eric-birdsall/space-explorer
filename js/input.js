// Arrow-key input. Tracks held keys (most recent wins) plus a queue of fresh taps,
// so very quick taps between frames are never lost. The on-screen touch pad feeds the
// same held keys and taps through press() and release().
(function (G) {
  const DIRS = {
    ArrowUp: { dx: 0, dy: -1, name: 'up' },
    ArrowDown: { dx: 0, dy: 1, name: 'down' },
    ArrowLeft: { dx: -1, dy: 0, name: 'left' },
    ArrowRight: { dx: 1, dy: 0, name: 'right' },
  };
  const held = [];
  const taps = [];
  const listeners = [];

  window.addEventListener('keydown', e => {
    if (DIRS[e.key]) {
      e.preventDefault();
      if (!held.includes(e.key)) held.push(e.key);
      if (!e.repeat) taps.push(e.key);
    }
    listeners.forEach(fn => fn(e));
  });

  function release(key) {
    const i = held.indexOf(key);
    if (i >= 0) held.splice(i, 1);
  }

  window.addEventListener('keyup', e => release(e.key));

  window.addEventListener('blur', () => { held.length = 0; });

  G.Input = {
    // Next direction to act on: a fresh tap first, otherwise the most recently held key.
    next() {
      if (taps.length) return Object.assign({ fresh: true }, DIRS[taps.shift()]);
      const k = held[held.length - 1];
      return k ? Object.assign({ fresh: false }, DIRS[k]) : null;
    },
    takeTap() {
      const had = taps.length > 0;
      taps.length = 0;
      return had;
    },
    clearTaps() { taps.length = 0; },
    onKey(fn) { listeners.push(fn); },
    // Touch pad: `key` is 'ArrowUp', 'ArrowDown', 'ArrowLeft' or 'ArrowRight'.
    press(key) {
      if (!DIRS[key] || held.includes(key)) return;
      held.push(key);
      taps.push(key);
    },
    release,
  };
})(window.Game = window.Game || {});
