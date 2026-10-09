// Startup: build sprites, wire up keys and clicks, run the frame loop.
(function (G) {
  const canvas = document.getElementById('game');
  G.Sprites.build();
  G.Render.init(canvas);

  G.Input.onKey(e => {
    G.Audio.ensure();
    G.Audio.startMusic();
    if (e.key === ' ') e.preventDefault();
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    if (k === 'm') G.Audio.toggleMute();
    else if (k === 'r' && e.shiftKey) G.Game.restartFull(); // parent shortcut: forget the checkpoint too
    else if (k === 'r') G.Game.restart();
    else if (k === 'enter' || k === ' ') G.Game.confirm();
    else if (k === 'escape') G.Game.home();
    else if (k === 'n' && e.shiftKey) G.Game.skip(); // parent shortcut: skip a level
    else if (k === 'f') G.Game.fart(); // shh - a secret for levels with chasing robots
  });

  canvas.addEventListener('pointerdown', e => {
    G.Audio.ensure();
    G.Audio.startMusic();
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) * canvas.width) / r.width;
    const y = ((e.clientY - r.top) * canvas.height) / r.height;
    const btn = G.Render.hitButton(x, y);
    if (btn === 'mute') G.Audio.toggleMute();
    else if (btn === 'restart') G.Game.restart();
    else if (btn === 'home') G.Game.home();
    else if (btn && btn.startsWith('level:')) G.Game.startLevel(Number(btn.slice(6)));
    else if (btn && btn.startsWith('page:')) G.Game.menuPage(Number(btn.slice(5)));
    else if (G.Game.S.screen === 'title') G.Game.openMenu();
    else if (G.Game.S.screen === 'win') G.Game.confirm();
  });

  // The first frame's timestamp can be a little earlier than performance.now() at startup, so the step
  // is clamped at 0: a negative clock would ask for sprite frames like "astro_down_-1" that don't exist.
  let last = null;
  function frame(now) {
    requestAnimationFrame(frame); // queue the next frame first, so one bad frame can't freeze the game
    const dt = last === null ? 0 : Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    G.Game.update(dt);
    G.Render.draw();
  }
  requestAnimationFrame(frame);
})(window.Game = window.Game || {});
