// All sound is synthesized with WebAudio, so no audio files are needed.
(function (G) {
  let ac = null;
  let master, musicGain, sfxGain;
  let muted = false;
  let musicTimer = null;
  let nextNoteTime = 0;
  let step = 0;

  try { muted = localStorage.getItem('spaceExplorerMuted') === '1'; } catch (e) { /* storage unavailable */ }

  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  function ensure() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ac = new AC();
      master = ac.createGain();
      master.gain.value = muted ? 0 : 0.9;
      master.connect(ac.destination);
      musicGain = ac.createGain();
      musicGain.gain.value = 0.16;
      musicGain.connect(master);
      sfxGain = ac.createGain();
      sfxGain.gain.value = 0.55;
      sfxGain.connect(master);
    }
    if (ac.state !== 'running') ac.resume(); // 'suspended', or 'interrupted' on iPad after switching apps
    return true;
  }

  // Play one enveloped oscillator note. `at` is an absolute AudioContext time.
  function tone({ freq, to, dur = 0.15, type = 'square', vol = 0.3, delay = 0, at, dest }) {
    if (!ac) return;
    const t0 = (at !== undefined ? at : ac.currentTime) + delay;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(dest || sfxGain);
    o.start(t0);
    o.stop(t0 + dur + 0.03);
  }

  const arp = (notes, gap, opts) =>
    notes.forEach((m, i) => tone(Object.assign({ freq: mtof(m), delay: i * gap }, opts)));

  const SFX = {
    step: () => tone({ freq: 200, dur: 0.04, type: 'triangle', vol: 0.05 }),
    pickup: () => arp([72, 76, 79, 84], 0.07, { dur: 0.13, type: 'square', vol: 0.16 }),
    // Gems chime one step higher up the scale for each one you're carrying: counting by ear.
    gem: (n = 1) => {
      const scale = [72, 74, 76, 79, 81, 84, 86, 88, 91];
      const m = scale[Math.min(scale.length, Math.max(1, n)) - 1];
      tone({ freq: mtof(m), dur: 0.22, type: 'triangle', vol: 0.28 });
      tone({ freq: mtof(m + 12), dur: 0.3, type: 'sine', vol: 0.14, delay: 0.05 });
    },
    checkpoint: () => arp([67, 72, 79], 0.09, { dur: 0.2, type: 'triangle', vol: 0.22 }),
    flashlight: () => {
      tone({ freq: 900, dur: 0.03, type: 'square', vol: 0.12 });
      tone({ freq: 300, to: 1200, dur: 0.5, type: 'sine', vol: 0.16, delay: 0.05 });
    },
    door: () => {
      tone({ freq: 220, to: 660, dur: 0.35, type: 'sawtooth', vol: 0.1 });
      tone({ freq: mtof(79), dur: 0.25, type: 'triangle', vol: 0.25, delay: 0.3 });
    },
    locked: () => {
      tone({ freq: 190, dur: 0.1, type: 'square', vol: 0.1 });
      tone({ freq: 150, dur: 0.14, type: 'square', vol: 0.1, delay: 0.13 });
    },
    boing: () => {
      tone({ freq: 180, to: 540, dur: 0.18, type: 'sine', vol: 0.4 });
      tone({ freq: 540, to: 200, dur: 0.25, type: 'sine', vol: 0.35, delay: 0.17 });
    },
    push: () => tone({ freq: 120, to: 80, dur: 0.12, type: 'triangle', vol: 0.3 }),
    thud: () => tone({ freq: 90, to: 60, dur: 0.09, type: 'triangle', vol: 0.2 }),
    pad: () => arp([67, 72, 79], 0.08, { dur: 0.2, type: 'triangle', vol: 0.3 }),
    field: () => tone({ freq: 900, to: 120, dur: 0.5, type: 'sawtooth', vol: 0.09 }),
    zap: () => tone({ freq: 420, to: 300, dur: 0.1, type: 'sawtooth', vol: 0.05 }),
    launch: () => {
      tone({ freq: 70, to: 800, dur: 1.8, type: 'sawtooth', vol: 0.07 });
      arp([72, 76, 79, 84, 88], 0.1, { dur: 0.2, type: 'square', vol: 0.12, delay: 0.5 });
    },
    fanfare: () => {
      arp([72, 72, 72, 76, 79, 76, 79, 84], 0.14, { dur: 0.22, type: 'square', vol: 0.14 });
      arp([48, 55, 60], 0.37, { dur: 0.5, type: 'triangle', vol: 0.3 });
    },
    start: () => arp([60, 64, 67, 72], 0.06, { dur: 0.12, type: 'triangle', vol: 0.3 }),
    teleport: () => {
      tone({ freq: 300, to: 1400, dur: 0.3, type: 'sine', vol: 0.3 });
      tone({ freq: 1400, to: 500, dur: 0.25, type: 'triangle', vol: 0.15, delay: 0.25 });
    },
    ride: () => tone({ freq: 140, to: 170, dur: 0.1, type: 'triangle', vol: 0.12 }),
    gateOpen: () => tone({ freq: 200, to: 500, dur: 0.25, type: 'square', vol: 0.08 }),
    gateClose: () => tone({ freq: 400, to: 160, dur: 0.25, type: 'square', vol: 0.08 }),
    tick: () => tone({ freq: 880, dur: 0.06, type: 'triangle', vol: 0.2 }),
    slide: () => tone({ freq: 1200, to: 600, dur: 0.25, type: 'sine', vol: 0.12 }),
    jump: () => tone({ freq: 300, to: 900, dur: 0.22, type: 'square', vol: 0.12 }),
    pull: () => tone({ freq: 500, to: 150, dur: 0.25, type: 'sine', vol: 0.2 }),
    mirror: () => arp([84, 88], 0.05, { dur: 0.08, type: 'triangle', vol: 0.2 }),
    alienHm: () => {
      tone({ freq: 330, to: 280, dur: 0.15, type: 'sine', vol: 0.25 });
      tone({ freq: 280, to: 360, dur: 0.18, type: 'sine', vol: 0.25, delay: 0.16 });
    },
    alienHappy: () => arp([76, 79, 84, 88, 91], 0.06, { dur: 0.12, type: 'sine', vol: 0.25 }),
    shield: () => {
      tone({ freq: 200, to: 800, dur: 0.4, type: 'triangle', vol: 0.2 });
      arp([79, 84, 88], 0.08, { dur: 0.15, type: 'sine', vol: 0.15, delay: 0.3 });
    },
    crumble: () => {
      tone({ freq: 120, to: 50, dur: 0.3, type: 'sawtooth', vol: 0.08 });
      tone({ freq: 90, to: 40, dur: 0.25, type: 'square', vol: 0.06, delay: 0.05 });
    },
    lever: () => {
      tone({ freq: 160, dur: 0.06, type: 'square', vol: 0.15 });
      tone({ freq: 440, to: 660, dur: 0.15, type: 'triangle', vol: 0.2, delay: 0.07 });
    },
    switch: () => arp([72, 79], 0.07, { dur: 0.1, type: 'square', vol: 0.12 }),
    // A long, low, wobbly raspberry (for the secret fart spray).
    fart: () => {
      const t0 = ac.currentTime;
      const dur = 1.1;
      const o = ac.createOscillator();
      const g = ac.createGain();
      const lfo = ac.createOscillator();
      const lfoGain = ac.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(95, t0);
      o.frequency.exponentialRampToValueAtTime(55, t0 + dur);
      lfo.frequency.setValueAtTime(18, t0);
      lfo.frequency.linearRampToValueAtTime(9, t0 + dur);
      lfoGain.gain.value = 22;
      lfo.connect(lfoGain);
      lfoGain.connect(o.frequency);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.05);
      g.gain.setValueAtTime(0.3, t0 + dur * 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g);
      g.connect(sfxGain);
      o.start(t0); lfo.start(t0);
      o.stop(t0 + dur + 0.05); lfo.stop(t0 + dur + 0.05);
      tone({ freq: 70, to: 45, dur: 0.25, type: 'square', vol: 0.12, delay: dur - 0.1 }); // ...pfft
    },
  };

  // ---------- Background music: an 8-bar synthwave loop ----------
  // A minor, Am - F - C - G, 96 BPM in sixteenth notes: pulsing octave bass, wide detuned pads
  // that "pump" with the kick, a sparkly arpeggio, a lead with a dotted-eighth echo, a soft
  // four-on-the-floor kick and a big roomy snare on 2 and 4.
  const BPM = 96;
  const SIXTEENTH = 60 / BPM / 4;
  const STEPS = 16 * 8;
  const CHORDS = [ // [root MIDI note, intervals]
    [45, [0, 3, 7]],  // Am
    [41, [0, 4, 7]],  // F
    [48, [0, 4, 7]],  // C
    [43, [0, 4, 7]],  // G
  ];
  // Lead melody: [bar, sixteenth, MIDI note, length in sixteenths]
  const LEAD = [
    [0, 0, 76, 4], [0, 4, 72, 2], [0, 6, 74, 2], [0, 8, 76, 4], [0, 12, 79, 4],
    [1, 0, 77, 4], [1, 4, 76, 2], [1, 6, 74, 2], [1, 8, 72, 8],
    [2, 0, 72, 4], [2, 4, 76, 2], [2, 6, 79, 2], [2, 8, 84, 4], [2, 12, 83, 2], [2, 14, 79, 2],
    [3, 0, 79, 8], [3, 8, 74, 2], [3, 10, 76, 2], [3, 12, 79, 4],
    [4, 0, 76, 4], [4, 4, 72, 2], [4, 6, 74, 2], [4, 8, 76, 4], [4, 12, 79, 4],
    [5, 0, 77, 4], [5, 4, 81, 2], [5, 6, 79, 2], [5, 8, 77, 4], [5, 12, 76, 4],
    [6, 0, 76, 4], [6, 4, 79, 2], [6, 6, 76, 2], [6, 8, 72, 2], [6, 10, 74, 2], [6, 12, 76, 4],
    [7, 0, 74, 4], [7, 4, 71, 4], [7, 8, 67, 8],
  ];

  let music = null; // the music mixing desk, built the first time music starts
  let noiseBuf = null;

  function buildMusicDesk() {
    // White noise, shared by the drums.
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    // A roomy reverb from a decaying burst of noise.
    const len = ac.sampleRate * 2.2;
    const ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    const reverb = ac.createConvolver();
    reverb.buffer = ir;
    const reverbOut = ac.createGain();
    reverbOut.gain.value = 0.35;
    reverb.connect(reverbOut);
    reverbOut.connect(musicGain);

    // Dotted-eighth echo.
    const delay = ac.createDelay(1);
    delay.delayTime.value = SIXTEENTH * 3;
    const feedback = ac.createGain();
    feedback.gain.value = 0.38;
    const delayOut = ac.createGain();
    delayOut.gain.value = 0.35;
    const delayTone = ac.createBiquadFilter();
    delayTone.type = 'lowpass';
    delayTone.frequency.value = 2500;
    delay.connect(delayTone);
    delayTone.connect(feedback);
    feedback.connect(delay);
    delayTone.connect(delayOut);
    delayOut.connect(musicGain);
    delayOut.connect(reverb);

    // The pads get their own bus so it can duck ("pump") on every kick.
    const padBus = ac.createGain();
    padBus.gain.value = 1;
    const padFilter = ac.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 1400;
    padFilter.Q.value = 3;
    padBus.connect(padFilter);
    padFilter.connect(musicGain);
    padFilter.connect(reverb);

    music = { reverb, delay, padBus, padFilter };
  }

  // One synth note with a filter and an attack/release envelope, sent to `outs`.
  function synth({ freq, at, dur, type = 'sawtooth', vol = 0.3, attack = 0.01, release = 0.1, cutoff = 3000, q = 1, detune = 0, outs }) {
    const o = ac.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    const f = ac.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = cutoff;
    f.Q.value = q;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + attack);
    g.gain.setValueAtTime(vol, at + Math.max(attack, dur - release));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur + release);
    o.connect(f);
    f.connect(g);
    outs.forEach(out => g.connect(out));
    o.start(at);
    o.stop(at + dur + release + 0.05);
  }

  function kick(at) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(140, at);
    o.frequency.exponentialRampToValueAtTime(42, at + 0.18);
    g.gain.setValueAtTime(0.9, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.35);
    o.connect(g);
    g.connect(musicGain);
    o.start(at);
    o.stop(at + 0.4);
    // Sidechain pump: the pads dip under the kick and swell back.
    const pad = music.padBus.gain;
    pad.cancelScheduledValues(at);
    pad.setValueAtTime(0.35, at);
    pad.linearRampToValueAtTime(1, at + SIXTEENTH * 3.5);
  }

  function noiseHit(at, { vol, dur, type, freq, q = 1, reverb = 0 }) {
    const src = ac.createBufferSource();
    src.buffer = noiseBuf;
    const f = ac.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(f);
    f.connect(g);
    g.connect(musicGain);
    if (reverb) {
      const send = ac.createGain();
      send.gain.value = reverb;
      g.connect(send);
      send.connect(music.reverb);
    }
    src.start(at, Math.random() * 0.5);
    src.stop(at + dur + 0.05);
  }

  function playStep(i, at) {
    const bar = Math.floor(i / 16);
    const s16 = i % 16;
    const [root, ivs] = CHORDS[bar % 4];
    const chord = ivs.map(v => root + v);

    // Drums
    if (s16 % 4 === 0) kick(at);
    if (s16 === 4 || s16 === 12) {
      noiseHit(at, { vol: 0.45, dur: 0.22, type: 'bandpass', freq: 1800, q: 0.8, reverb: 0.9 });
      synth({ freq: 190, at, dur: 0.06, type: 'triangle', vol: 0.25, release: 0.08, cutoff: 1200, outs: [musicGain] });
    }
    if (s16 % 2 === 0) noiseHit(at, { vol: s16 % 4 === 2 ? 0.14 : 0.06, dur: 0.05, type: 'highpass', freq: 8000 });

    // Pulsing octave bass on every eighth note
    if (s16 % 2 === 0) {
      const note = root - 12 + (s16 % 4 === 2 ? 12 : 0);
      synth({ freq: mtof(note), at, dur: SIXTEENTH * 1.6, vol: 0.5, release: 0.05, cutoff: 700 + (s16 % 4 === 2 ? 400 : 0), q: 4, outs: [musicGain] });
    }

    // Wide pad chord, held for the whole bar (three notes, two detuned saws each)
    if (s16 === 0) {
      for (const n of chord) {
        for (const det of [-9, 9]) {
          synth({ freq: mtof(n + 12), at, dur: SIXTEENTH * 15, vol: 0.09, attack: 0.25, release: 0.4, cutoff: 5000, detune: det, outs: [music.padBus] });
        }
      }
    }

    // Sparkly arpeggio up and down the chord
    const arpNotes = [chord[0] + 24, chord[1] + 24, chord[2] + 24, chord[0] + 36, chord[2] + 24, chord[1] + 24];
    synth({ freq: mtof(arpNotes[i % arpNotes.length]), at, dur: SIXTEENTH * 0.7, type: 'square', vol: 0.06, release: 0.06, cutoff: 3500, outs: [musicGain, music.delay] });

    // Lead melody
    for (const [b, st, note, len] of LEAD) {
      if (b === bar && st === s16) {
        synth({ freq: mtof(note), at, dur: SIXTEENTH * len * 0.9, vol: 0.16, attack: 0.02, release: 0.15, cutoff: 2600, q: 2, outs: [musicGain, music.delay] });
        synth({ freq: mtof(note), at, dur: SIXTEENTH * len * 0.9, type: 'triangle', vol: 0.12, attack: 0.02, release: 0.15, detune: 7, outs: [musicGain, music.delay] });
      }
    }
  }

  function scheduler() {
    // After a pause (a hidden tab, a sleeping tablet) skip ahead instead of playing all the missed notes at once.
    if (nextNoteTime < ac.currentTime - 0.1) nextNoteTime = ac.currentTime + 0.05;
    while (nextNoteTime < ac.currentTime + 0.2) {
      playStep(step, nextNoteTime);
      nextNoteTime += SIXTEENTH;
      step = (step + 1) % STEPS;
    }
  }

  G.Audio = {
    ensure,
    play(name, arg) { if (ac && SFX[name]) SFX[name](arg); },
    startMusic() {
      if (musicTimer || !ensure()) return;
      if (!music) buildMusicDesk();
      nextNoteTime = ac.currentTime + 0.1;
      step = 0;
      musicTimer = setInterval(scheduler, 50);
    },
    toggleMute() {
      muted = !muted;
      try { localStorage.setItem('spaceExplorerMuted', muted ? '1' : '0'); } catch (e) { /* ignore */ }
      if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, ac.currentTime, 0.02);
      return muted;
    },
    isMuted: () => muted,
  };
})(window.Game = window.Game || {});
