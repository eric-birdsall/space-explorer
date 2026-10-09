// Pixel-art sprites. Each sprite is a 16x16 grid of characters mapped to a palette,
// rendered once to an offscreen canvas at startup and scaled up when drawn.
(function (G) {
  const SIZE = 16;

  const PAL = {
    k: '#161a2e', // outline
    w: '#f4f6ff', // white suit
    l: '#c3cbe0', // light gray
    g: '#8a93ad', // gray
    d: '#4a5068', // dark gray
    v: '#2f8fe0', // visor
    V: '#bfe6ff', // visor shine
    o: '#ff9f1c', // orange
    O: '#b86a00', // dark orange
    R: '#ff4757', // red
    Y: '#ffd32a', // yellow
    m: '#6a7699', // wall light edge
    p: '#465173', // wall plate
    n: '#2a3150', // wall dark edge
    q: '#a3aecb', // rivet
    h: '#2e3560', // floor grid line
    f: '#1c2140', // floor
    F: '#232a52', // floor detail
    a: '#9b7b5b', // asteroid
    A: '#c9a67c', // asteroid highlight
    S: '#5e4632', // crater
    s: '#3f2e20', // crater dark
  };

  const KEY_COLORS = {
    r: { C: '#ff4757', c: '#b8323f' },
    g: { C: '#2ed573', c: '#1e9150' },
    b: { C: '#3d8bff', c: '#2458b0' },
    y: { C: '#ffd32a', c: '#c49a00' },
    x: { C: '#4fe3ff', c: '#2a9bb8' }, // gems and counting doors
  };

  // ---------- Astronaut ----------
  const ASTRO_TOP = {
    down: [
      '......kkkk......',
      '....kkwwwwkk....',
      '...kwwwwwwwwk...',
      '..kwwkkkkkkwwk..',
      '..kwkvvvvVVkwk..',
      '..kwkvvvvvVkwk..',
      '..kwkvvvvvvkwk..',
      '..kwwkkkkkkwwk..',
      '...kwwwwwwwwk...',
      '..kkkwwoowwkkk..',
      '.kwlkwwoowwklwk.',
      '.kwlkwwwwwwklwk.',
      '..kkkwwwwwwkkk..',
      '....kwwkkwwk....',
    ],
    up: [
      '......kkkk......',
      '....kkwwwwkk....',
      '...kwwwwwwwwk...',
      '..kwwwwwwwwwwk..',
      '..kwwwwwwwwwwk..',
      '..kwwwwwwwwwwk..',
      '..kwwwwwwwwwwk..',
      '..kwwwwwwwwwwk..',
      '...kkkkkkkkkk...',
      '..kkkggggggkkk..',
      '.kwkggggggggkwk.',
      '.kwkgdggggdgkwk.',
      '..kkkggggggkkk..',
      '....kwwkkwwk....',
    ],
    right: [
      '......kkkk......',
      '....kkwwwwkk....',
      '...kwwwwwwwwk...',
      '..kwwwwwkkkkwk..',
      '..kwwwwkvvVVkk..',
      '..kwwwwkvvvVkk..',
      '..kwwwwkvvvvkk..',
      '..kwwwwwkkkkwk..',
      '...kwwwwwwwwk...',
      '..kggkwwwwwwk...',
      '.kgggkwwwwlwk...',
      '.kgdgkwwwwlwk...',
      '..kkkkwwwwwwk...',
      '....kwwwwwwk....',
    ],
  };
  const ASTRO_LEGS = [
    ['....kllkkllk....', '...kkkk..kkkk...'],
    ['....kkk.kllk....', '.........kkkk...'],
    ['....kllk.kkk....', '...kkkk.........'],
  ];

  // ---------- Tiles ----------
  const WALL = [
    'mmmmmmmmmmmmmmmn',
    'mqppppppppppppqn',
    'mppppppppppppppn',
    'mppppppppppppppn',
    'mppppppppppppppn',
    'mppppppppppppppn',
    'mppppppppppppppn',
    'mnnnnnnnnnnnnnnn',
    'mmmmmmmmmmmmmmmn',
    'mppppppppppppppn',
    'mppppppppppppppn',
    'mppppppppppppppn',
    'mppppppppppppppn',
    'mppppppppppppppn',
    'mqppppppppppppqn',
    'nnnnnnnnnnnnnnnn',
  ];

  const FLOOR = [
    'hhhhhhhhhhhhhhhh',
    'hfffffffffffffff',
    'hfffffffffffffff',
    'hfffffffffffffff',
    'hfffffffffffffff',
    'hfffffffffffffff',
    'hfffffffffffffff',
    'hffffffFFfffffff',
    'hffffffFFfffffff',
    'hfffffffffffffff',
    'hfffffffffffffff',
    'hfffffffffffffff',
    'hfffffffffffffff',
    'hfffffffffffffff',
    'hfffffffffffffff',
    'hfffffffffffffff',
  ];

  const KEY = [
    '................',
    '................',
    '................',
    '................',
    '..kkkk..........',
    '.kCwCCk.........',
    'kCCkkCCk........',
    'kCk..kCkkkkkkkk.',
    'kCk..kCCCCCCCCCk',
    'kCCkkCCcccccccck',
    '.kCCCCkkkkckkck.',
    '..kkkk....kk.kk.',
    '................',
    '................',
    '................',
    '................',
  ];

  const DOOR = [
    'kkkkkkkkkkkkkkkk',
    'kggggggggggggggk',
    'kgCCCCCCCCCCCCgk',
    'kgCccccccccccCgk',
    'kgCcCCCCCCCCcCgk',
    'kgCcCCCkkCCCcCgk',
    'kgCcCCkkkkCCcCgk',
    'kgCcCCkkkkCCcCgk',
    'kgCcCCCkkCCCcCgk',
    'kgCcCCCkkCCCcCgk',
    'kgCcCCCkkCCCcCgk',
    'kgCcCCCCCCCCcCgk',
    'kgCccccccccccCgk',
    'kgCCCCCCCCCCCCgk',
    'kggggggggggggggk',
    'kkkkkkkkkkkkkkkk',
  ];

  const DOOR_OPEN = Array(16).fill('kgk..........kgk');

  const CRATE = [
    'kkkkkkkkkkkkkkkk',
    'kooooooooooooook',
    'koOOOOOOOOOOOOok',
    'koOooooooooooOok',
    'koOoOooooooOoOok',
    'koOooOooooOooOok',
    'koOoooOooOoooOok',
    'koOooooOOooooOok',
    'koOooooOOooooOok',
    'koOoooOooOoooOok',
    'koOooOooooOooOok',
    'koOoOooooooOoOok',
    'koOooooooooooOok',
    'koOOOOOOOOOOOOok',
    'kooooooooooooook',
    'kkkkkkkkkkkkkkkk',
  ];

  const PAD = [
    '................',
    '................',
    '..kkkkkkkkkkkk..',
    '..kggggggggggk..',
    '..kgLLLLLLLLgk..',
    '..kgLLLLLLLLgk..',
    '..kgLLLLLLLLgk..',
    '..kgLLLLLLLLgk..',
    '..kgLLLLLLLLgk..',
    '..kgLLLLLLLLgk..',
    '..kgLLLLLLLLgk..',
    '..kgLLLLLLLLgk..',
    '..kgLLLLLLLLgk..',
    '..kggggggggggk..',
    '..kkkkkkkkkkkk..',
    '................',
  ];

  const ICE = [
    'iiiiiiiiiiiiiiij',
    'iIIiiiiiiiiiiiij',
    'iIiiiiiiiiiiiiij',
    'iiiiiiiiiIiiiiij',
    'iiiiiiiiIiiiiiij',
    'iiiiiiiIiiiiiiij',
    'iiiiiiiiiiiiiiij',
    'iiiiiiiiiiiiiiij',
    'iiiIiiiiiiiiiiij',
    'iiIiiiiiiiiiiiij',
    'iIiiiiiiiiiIIiij',
    'iiiiiiiiiiIiiiij',
    'iiiiiiiiiiiiiiij',
    'iiiiiiIiiiiiiiij',
    'iiiiiIiiiiiiiiij',
    'jjjjjjjjjjjjjjjj',
  ];
  const ICE_PAL = { i: '#8fd3ea', I: '#e8fbff', j: '#5fa8c4' };

  // One wall / floor color scheme per world.
  const THEMES = [
    { m: '#6a7699', p: '#465173', n: '#2a3150', q: '#a3aecb', h: '#2e3560', f: '#1c2140', F: '#232a52' }, // Space Station
    { m: '#9a9aa8', p: '#6e6e7e', n: '#40404e', q: '#cfcfdb', h: '#3a3a48', f: '#24242e', F: '#2d2d38' }, // Moon Base
    { m: '#c0694a', p: '#8e4430', n: '#55261a', q: '#eaa585', h: '#4a2418', f: '#2c150f', F: '#381b13' }, // Mars Outpost
    { m: '#a08060', p: '#6e5238', n: '#3e2c1c', q: '#d0b090', h: '#3a2a1a', f: '#20170e', F: '#2a1e12' }, // Asteroid Mine
    { m: '#7fc8e0', p: '#4d93b3', n: '#2a5870', q: '#c8f0ff', h: '#1f4a60', f: '#11293a', F: '#163548' }, // Ice Comet
    { m: '#a070d8', p: '#6a3fa0', n: '#3a2060', q: '#d6b8ff', h: '#3a2360', f: '#1d1135', F: '#261745' }, // Nebula
    { m: '#6aa84f', p: '#3f7a34', n: '#1f4a1c', q: '#b6e39a', h: '#1f3a1a', f: '#10220e', F: '#172e14' }, // Jungle Planet
    { m: '#d070b0', p: '#9a4080', n: '#5a2048', q: '#ffc0ea', h: '#4a1a3c', f: '#2a0e22', F: '#36122c' }, // Crystal Caves
    { m: '#e0b040', p: '#a87a20', n: '#604410', q: '#ffe8a0', h: '#4a3410', f: '#2a1d08', F: '#36260c' }, // Sun Station
    { m: '#4a8a8a', p: '#2a5a5e', n: '#12302f', q: '#90d8d8', h: '#143234', f: '#081a1b', F: '#0e2425' }, // Black Hole Rim
    { m: '#5a6078', p: '#3a3f55', n: '#1c1f30', q: '#ffd32a', h: '#22263a', f: '#12141f', F: '#181b29' }, // Dark Moon
    { m: '#4f7fd0', p: '#2f55a0', n: '#182f60', q: '#9fe8ff', h: '#1a2c5a', f: '#0c1630', F: '#111f42' }, // Gem Galaxy
    { m: '#d8dce8', p: '#9aa0b4', n: '#555a70', q: '#ff9f1c', h: '#30344a', f: '#1a1c2a', F: '#222536' }, // The Last Star
    { m: '#58c8b0', p: '#2f8f7c', n: '#17483f', q: '#fff3b0', h: '#173d36', f: '#0b211d', F: '#102c27' }, // Expeditions
  ];

  // ---------- Gems, counting doors and the flashlight ----------
  const GEM = [
    '................',
    '................',
    '................',
    '....kkkkkkkk....',
    '...kCwwCCCCck...',
    '..kCwCCCCCCcck..',
    '.kCCCCCCCCCCcck.',
    '.kkkkkkkkkkkkkk.',
    '.kcCCCCCCCCCcck.',
    '..kcCCCCCCCcck..',
    '...kcCCCCCcck...',
    '....kcCCCcck....',
    '.....kcCcck.....',
    '......kcck......',
    '.......kk.......',
    '................',
  ];

  // A plain door panel: the dots that say how many gems it wants are drawn on top.
  const GEM_DOOR = [
    'kkkkkkkkkkkkkkkk',
    'kggggggggggggggk',
    'kgCCCCCCCCCCCCgk',
    'kgCddddddddddCgk',
    'kgCddddddddddCgk',
    'kgCddddddddddCgk',
    'kgCddddddddddCgk',
    'kgCddddddddddCgk',
    'kgCddddddddddCgk',
    'kgCddddddddddCgk',
    'kgCddddddddddCgk',
    'kgCddddddddddCgk',
    'kgCddddddddddCgk',
    'kgCCCCCCCCCCCCgk',
    'kggggggggggggggk',
    'kkkkkkkkkkkkkkkk',
  ];

  const FLASHLIGHT = [
    '................',
    '................',
    '................',
    '................',
    '..........kkk...',
    '.kkkkkkkkkglk..Y',
    '.kddddddkgllkY..',
    '.kdoddddkgYYk.YY',
    '.kddddddkgllkY..',
    '.kkkkkkkkkglk..Y',
    '..........kkk...',
    '................',
    '................',
    '................',
    '................',
    '................',
  ];

  // Checkpoint beacon: a lamp on a pole (L is the lamp color).
  const BEACON = [
    '................',
    '.......kk.......',
    '......kLLk......',
    '.....kLwLLk.....',
    '.....kLLLLk.....',
    '......kLLk......',
    '.......kk.......',
    '.......kg.......',
    '.......kg.......',
    '.......kg.......',
    '.......kg.......',
    '.......kg.......',
    '.....kkkkkk.....',
    '....kggggggk....',
    '....kkkkkkkk....',
    '................',
  ];

  // ---------- Friends and items ----------
  const ALIEN = [
    '...kk......kk...',
    '...kGk....kGk...',
    '....kk....kk....',
    '....kkkkkkkk....',
    '...kaaaaaaaak...',
    '..kaawwaawwaak..',
    '..kaawkaawkaak..',
    '..kaawkaawkaak..',
    '..kaaaaaaaaaak..',
    '..kaaaAAAAaaak..',
    '...kaaaaaaaak...',
    '....kkaaaakk....',
    '...kaakaakaak...',
    '...kaaakkaaak...',
    '....kaak.kaak...',
    '....kkk..kkk....',
  ];
  const ALIEN_HAPPY = ALIEN.slice();
  ALIEN_HAPPY[5] = '..kaaaaaaaaaak..';
  ALIEN_HAPPY[6] = '..kakakaakakak..';
  ALIEN_HAPPY[7] = '..kaaaaaaaaaak..';
  ALIEN_HAPPY[9] = '..kaAaaaaaaAak..';
  ALIEN_HAPPY[10] = '...kaAAAAAAak...';
  const ALIEN_PAL = { a: '#6ee07a', A: '#2e9e4a', G: '#ffd32a' };

  const FRUIT = [
    '................',
    '........k.......',
    '.......kLk......',
    '......kLLk......',
    '....kkkkkkkk....',
    '...kooooooOOk...',
    '..kooYoooooOOk..',
    '..koYYooooooOk..',
    '..kooooooooOOk..',
    '..kooooooooOOk..',
    '..koooooooOOOk..',
    '...kooooooOOk...',
    '....kkooooOk....',
    '......kkkkk.....',
    '................',
    '................',
  ];

  const UFO = [
    '................',
    '................',
    '......kkkk......',
    '.....kVVVVk.....',
    '....kVVwVVVk....',
    '....kVVVVVVk....',
    '..kkkkkkkkkkkk..',
    '.kggllllllllggk.',
    'kggRggYggRggYggk',
    '.kggggggggggggk.',
    '..kkkkkkkkkkkk..',
    '....kYk..kYk....',
    '................',
    '................',
    '................',
    '................',
  ];

  const CRYSTAL = [
    '................',
    '.......kk.......',
    '......kCCk......',
    '.....kCcCCk.....',
    '....kCCcCCCk....',
    '....kCCcCCCk....',
    '...kCCCcCCCCk...',
    '...kCCcCCCCCk...',
    '...kCCcCCCCCk...',
    '....kCcCCCCk....',
    '....kCcCCCCk....',
    '.....kcCCCk.....',
    '......kCCk......',
    '...kkkkkkkkkk...',
    '...kggggggggk...',
    '...kkkkkkkkkk...',
  ];

  // ---------- Obstacles ----------
  const ASTEROID = [
    '................',
    '.....kkkkk......',
    '...kkaaaaakk....',
    '..kaaaAaaaaak...',
    '.kaaAAAaaaaaak..',
    '.kaaaAaaaSSaak..',
    'kaaaaaaaSssSaak.',
    'kaSSaaaaSssSaak.',
    'kSssSaaaaSSaaak.',
    'kSssSaaaaaaaaak.',
    '.kSSaaaaAaaaak..',
    '.kaaaaaAAAaaak..',
    '..kaaaaaAaaak...',
    '...kkaaaaakk....',
    '.....kkkkk......',
    '................',
  ];

  const ROBOT = [
    '.......kk.......',
    '.......RR.......',
    '.......kk.......',
    '...kkkkkkkkkk...',
    '..kllllllllllk..',
    '..klkkllllkklk..',
    '..klEEllllEElk..',
    '..klEEllllEElk..',
    '..kllllllllllk..',
    '..kllkkkkkkllk..',
    '..kllllllllllk..',
    '...kkkkkkkkkk...',
    '....kggggggk....',
    '...kgggRRgggk...',
    '....kggggggk....',
    '...kkk....kkk...',
  ];

  // ---------- Exit rocket ----------
  const ROCKET_TOP = [
    '.......kk.......',
    '......kRRk......',
    '.....kRRRRk.....',
    '.....kwwwwk.....',
    '....kwwwwwwk....',
    '....kwwvvwwk....',
    '....kwvVvvwk....',
    '....kwwvvwwk....',
    '....kwwwwwwk....',
    '...kRkwwwwkRk...',
    '..kRRkwwwwkRRk..',
    '..kRRkwwwwkRRk..',
    '..kkkkkkkkkkkk..',
  ];
  const ROCKET_FLAMES = [
    ['.....kooook.....', '......kYYk......', '.......YY.......'],
    ['.....kYooYk.....', '......kook......', '......oYYo......'],
  ];

  // ---------- Build ----------
  const cache = {};

  function make(rows, extra) {
    const pal = Object.assign({}, PAL, extra || {});
    const c = document.createElement('canvas');
    c.width = SIZE;
    c.height = SIZE;
    const ctx = c.getContext('2d');
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const col = pal[row[x]];
        if (col) {
          ctx.fillStyle = col;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });
    return c;
  }

  function flip(src) {
    const c = document.createElement('canvas');
    c.width = src.width;
    c.height = src.height;
    const ctx = c.getContext('2d');
    ctx.translate(src.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(src, 0, 0);
    return c;
  }

  function build() {
    ['down', 'up', 'right'].forEach(dir => {
      ASTRO_LEGS.forEach((legs, f) => {
        cache[`astro_${dir}_${f}`] = make(ASTRO_TOP[dir].concat(legs));
      });
    });
    for (let f = 0; f < ASTRO_LEGS.length; f++) {
      cache[`astro_left_${f}`] = flip(cache[`astro_right_${f}`]);
    }

    THEMES.forEach((t, i) => {
      cache[`wall_${i}`] = make(WALL, t);
      cache[`floor_${i}`] = make(FLOOR, t);
    });
    cache.wall = cache.wall_0;
    cache.floor = cache.floor_0;
    cache.ice = make(ICE, ICE_PAL);
    cache.timer_off = make(PAD, { L: '#4a2a78', g: '#c56cf0' });
    cache.timer_on = make(PAD, { L: '#c56cf0', g: '#ffd6f5' });
    cache.door_timed = make(DOOR, { C: '#c56cf0', c: '#7a3fc0' });
    cache.alien = make(ALIEN, ALIEN_PAL);
    cache.alien_happy = make(ALIEN_HAPPY, ALIEN_PAL);
    cache.fruit = make(FRUIT, { L: '#2ed573' });
    cache.helmet = make(['................', '................'].concat(ASTRO_TOP.down.slice(0, 9),
      ['...kllllllllk...', '....kkkkkkkk....', '................', '................', '................']));
    cache.ufo_0 = make(UFO);
    cache.ufo_1 = make(UFO, { R: '#ffd32a', Y: '#ff4757' });
    cache.crystal_off = make(CRYSTAL, { C: '#7a3fc0', c: '#b86bff' });
    cache.crystal_on = make(CRYSTAL, { C: '#ffd6f5', c: '#ffffff' });
    cache.crate_slick = make(CRATE, { o: '#9fe3f5', O: '#3d8bff' });
    cache.chaser_0 = make(ROBOT, { E: '#ffffff', g: '#ff6fc8', l: '#ffd6f5', R: '#ff4757' });
    cache.chaser_1 = make(ROBOT, { E: '#ff4757', g: '#ff6fc8', l: '#ffd6f5', R: '#ffd32a' });
    cache.doorOpen = make(DOOR_OPEN);
    cache.crate = make(CRATE);
    cache.pad_off = make(PAD, { L: '#1d5c63' });
    cache.pad_on = make(PAD, { L: '#3effc8' });
    cache.button_off = make(PAD, { L: '#7a2f3f', g: '#c46a00' });
    cache.button_on = make(PAD, { L: '#ff6b81', g: '#ffd32a' });
    cache.asteroid = make(ASTEROID);
    cache.robot_0 = make(ROBOT, { E: '#ff4d6d' });
    cache.robot_1 = make(ROBOT, { E: '#ffd166' });
    ROCKET_FLAMES.forEach((fl, i) => { cache[`rocket_${i}`] = make(ROCKET_TOP.concat(fl)); });

    Object.keys(KEY_COLORS).forEach(color => {
      cache[`key_${color}`] = make(KEY, KEY_COLORS[color]);
      cache[`door_${color}`] = make(DOOR, KEY_COLORS[color]);
    });
    cache.key_x = make(GEM, KEY_COLORS.x);
    cache.door_x = make(GEM_DOOR, { C: KEY_COLORS.x.c, d: '#161a2e' });
    cache.flashlight = make(FLASHLIGHT);
    cache.beacon_off = make(BEACON, { L: '#4a5068', w: '#6a7699' });
    cache.beacon_on = make(BEACON, { L: '#2ed573' });
  }

  G.Sprites = {
    build,
    get: name => cache[name],
    THEME_COUNT: THEMES.length,
    KEY_COLORS,
  };
})(window.Game = window.Game || {});
