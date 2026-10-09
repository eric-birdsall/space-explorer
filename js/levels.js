// Level maps. Most are 15 columns x 10 rows; bigger maps scroll with the player.
//   #  wall            .  floor           P  player start     E  exit rocket
//   r g b y  keys      R G B Y  doors     C  crate            I  slippery crate (slides on ice)
//   o  pressure pad    F  force field (turns off when every pad has a crate on it)
//   + button           =  gate (open while something is on a button, or a laser lights a crystal)
//   d timer button     D  timed door (opens for `timer` moves after the button is pressed,
//                         or for good while a crate sits on the button)
//   ~  ice (you slide until something stops you)
//   1-9 teleporters (two tiles with the same digit are linked)
//   > < ^ v  conveyor belts         } { A V  one-way arrows (right, left, up, down)
//   J  jump pad (hop over the next tile)      _  hole (a crate pushed in fills it)
//   *  crumbly floor (becomes a hole after you step off it)
//   s  color switch    m c  pink / blue blocks (pink start up; the switch swaps them)
//   L  big lever (switches off `switch` lasers and obstacles; can reverse belts)
//   x  gem             X  counting door (opens when you carry enough gems, and uses them up;
//                         the counts are listed in `gemDoors`, in reading order)
//   t  flashlight (lights up much more of a `dark: true` level)
//   S  checkpoint beacon (big levels: restart returns here with everything collected so far)
//   M W  mirrors ( / and \ ) - press Space next to one to turn it      q  crystal
//   a  friendly alien (moves aside for a fruit)          f  space fruit     h  shield helmet
//   O  black hole (can't be entered; tugs you one tile closer from two tiles away)
// Obstacles: 'asteroid' / 'robot' / 'ufo' ping-pong along a `path` (tiles per second; a UFO
// hovers `pause` seconds at each end); 'chaser' starts at `start` and follows the player;
// 'arm' spins around `center` (`length` tiles each way, `speed` in turns-ish per second);
// 'comet' starts at `start` and bounces off walls diagonally. `switch: true` = lever turns it off.
// Lasers shine along `tiles` (from the first), or from an emitter `from` in direction `dir`
// bouncing off mirrors. Timed lasers blink (`period`, `on`, `offset`); `always: true` beams
// block the way like a wall. A crate pushed into a beam blocks it.
// Optional hints: `holdTimer` (a crate should sit on the timer button) and `crateSpots`
// (where a crate should be pushed, e.g. to make a stopper on ice).
// `dark: true` hides everything except a circle around the player, the goal and anything moving.
// Each level has a stable `id` so saved progress survives levels being reordered.
// Every 10 levels form a world with its own look (see WORLD_SIZES at the bottom for exceptions);
// the names are in Game.WorldNames.
(function (G) {
  G.WorldNames = [
    'Space Station',
    'Moon Base',
    'Mars Outpost',
    'Asteroid Mine',
    'Ice Comet',
    'Nebula',
    'Jungle Planet',
    'Crystal Caves',
    'Sun Station',
    'Black Hole Rim',
    'Dark Moon',
    'Gem Galaxy',
    'The Last Star',
    'Expeditions',
  ];

  G.Levels = [
    // ===== World 1: Space Station =====

    // 1. Walk to the rocket.
    {
      id: 'walk',
      map: [
        '###############',
        '###############',
        '##...........##',
        '##...........##',
        '##.P.......E.##',
        '##...........##',
        '##...........##',
        '###############',
        '###############',
        '###############',
      ],
    },

    // 2. One key, one door.
    {
      id: 'one-key',
      map: [
        '###############',
        '#.....#.......#',
        '#.....#.......#',
        '#..r..#.......#',
        '#.....R.....E.#',
        '#.....#.......#',
        '#.P...#.......#',
        '#.....#.......#',
        '#.....#.......#',
        '###############',
      ],
    },

    // 3. Jump pads: step on one to hop over the hole in front of it.
    {
      id: 'jump-intro',
      map: [
        '###############',
        '###############',
        '#....._...._..#',
        '#....._...._..#',
        '#.P..J_...J_.E#',
        '#....._...._..#',
        '#....._...._..#',
        '###############',
        '###############',
        '###############',
      ],
    },

    // 4. Two colors: the red key opens the room with the blue key.
    {
      id: 'two-keys',
      map: [
        '###############',
        '#....#....#...#',
        '#.P..#.b..#...#',
        '#....R....#.E.#',
        '#....#....#...#',
        '#....######...#',
        '#.........B...#',
        '#..r......#...#',
        '#.........#...#',
        '###############',
      ],
    },

    // 5. Three colors in a loop: yellow opens the middle, red the corner room, green the rocket.
    {
      id: 'three-keys',
      map: [
        '###############',
        '#.P.#...#.....#',
        '#...Y...G..E..#',
        '#.y.#.r.#.....#',
        '#####...#.....#',
        '#...R...#######',
        '#.g.#...#######',
        '#...#...#######',
        '###############',
        '###############',
      ],
    },

    // 6. First asteroid drifting across the path.
    {
      id: 'asteroid',
      map: [
        '###############',
        '#...#.....#...#',
        '#.P.#.....#.E.#',
        '#...#.....#...#',
        '#.............#',
        '#...#.....#...#',
        '#...#.....#...#',
        '#...#.....#...#',
        '#...#.....#...#',
        '###############',
      ],
      obstacles: [
        { sprite: 'asteroid', path: [[7, 1], [7, 8]], speed: 1.6 },
      ],
    },

    // 7. One-way arrows: you can only walk over them the way they point. Go around the loop.
    {
      id: 'arrows-intro',
      map: [
        '###############',
        '#P..}.........#',
        '#.###########.#',
        '#.#.........#.#',
        '#.#.........#V#',
        '#A#....E....#.#',
        '#.#.........#y#',
        '#.#####Y#####.#',
        '#.........{...#',
        '###############',
      ],
    },

    // 8. Asteroid field: fetch the key from the middle of three drifting rocks.
    {
      id: 'asteroid-field',
      map: [
        '###############',
        '#P............#',
        '#.............#',
        '#.............#',
        '#......b......#',
        '#.............#',
        '#.............#',
        '###########B###',
        '###########.E.#',
        '###############',
      ],
      obstacles: [
        { sprite: 'asteroid', path: [[1, 2], [13, 2]], speed: 1.5 },
        { sprite: 'asteroid', path: [[10, 1], [10, 6]], speed: 1.2 },
        { sprite: 'asteroid', path: [[13, 5], [3, 5]], speed: 1.4 },
      ],
    },

    // 9. Keys, doors and two patrolling robots.
    {
      id: 'robots',
      map: [
        '###############',
        '#.....#.......#',
        '#.P...#...g...#',
        '#..y..Y.......#',
        '#.....#.......#',
        '#######...#####',
        '#...#.........#',
        '#.E.G.........#',
        '#...#.........#',
        '###############',
      ],
      obstacles: [
        { sprite: 'robot', path: [[8, 1], [8, 4]], speed: 1.2 },
        { sprite: 'robot', path: [[5, 7], [12, 7]], speed: 1.3 },
      ],
    },

    // 10. First crate: push it onto the pad to switch off the force field.
    {
      id: 'crate',
      map: [
        '###############',
        '#......#......#',
        '#.P....#......#',
        '#......F....E.#',
        '#......#......#',
        '#.######......#',
        '#.C...o#......#',
        '########......#',
        '########......#',
        '###############',
      ],
    },

    // ===== World 2: Moon Base =====

    // 11. Two crates, two pads: the force field needs both covered.
    {
      id: 'two-crates',
      map: [
        '###############',
        '#.P....#......#',
        '#......#......#',
        '#......F....E.#',
        '#.######......#',
        '#.C...o#......#',
        '#.######......#',
        '#.C...o#......#',
        '########......#',
        '###############',
      ],
    },

    // 12. Keys, a crate and obstacles together.
    {
      id: 'combo',
      map: [
        '###############',
        '#.P...#.......#',
        '#.....#...r...#',
        '#..b..B.......#',
        '#.....#.......#',
        '#.#####.......#',
        '#.C..o#####F###',
        '#######...#...#',
        '#######.E.R...#',
        '###############',
      ],
      obstacles: [
        { sprite: 'asteroid', path: [[9, 1], [9, 5]], speed: 1.4 },
        { sprite: 'robot', path: [[12, 1], [12, 5]], speed: 1.1 },
      ],
    },

    // 13. Laser gates that blink on and off: wait, then go.
    {
      id: 'lasers',
      map: [
        '###############',
        '###############',
        '###############',
        '#.............#',
        '#.P.........E.#',
        '#.............#',
        '###############',
        '###############',
        '###############',
        '###############',
      ],
      lasers: [
        { tiles: [[4, 3], [4, 4], [4, 5]], period: 3, on: 1.3, offset: 0 },
        { tiles: [[7, 3], [7, 4], [7, 5]], period: 3, on: 1.3, offset: 1 },
        { tiles: [[10, 3], [10, 4], [10, 5]], period: 3, on: 1.3, offset: 2 },
      ],
    },

    // 14. Big lever: pull it to switch off the laser wall (and put the robot to sleep).
    {
      id: 'lever-intro',
      map: [
        '###############',
        '###############',
        '#.............#',
        '#.P...........#',
        '#...........E.#',
        '#....L........#',
        '#.............#',
        '###############',
        '###############',
        '###############',
      ],
      obstacles: [
        { sprite: 'robot', path: [[10, 2], [10, 6]], speed: 1.3, switch: true },
      ],
      lasers: [
        { tiles: [[8, 2], [8, 3], [8, 4], [8, 5], [8, 6]], always: true, switch: true },
      ],
    },

    // 15. A laser that never switches off. Push the crate into the top of the beam: the beam stops
    //     at the crate, so the tiles below it are safe to cross.
    {
      id: 'laser-block',
      map: [
        '###############',
        '###############',
        '#.C.......#...#',
        '#.#######.....#',
        '#.P...........#',
        '#............E#',
        '###############',
        '###############',
        '###############',
        '###############',
      ],
      lasers: [
        { tiles: [[9, 2], [9, 3], [9, 4], [9, 5]], always: true },
      ],
    },

    // 16. Blinking lasers in the doorway and across the key, plus a patrolling robot.
    {
      id: 'laser-dance',
      map: [
        '###############',
        '#...#.....#...#',
        '#.P.#..y..#.E.#',
        '#...#.....#...#',
        '#.........Y...#',
        '#...#.....#...#',
        '#...#.....#...#',
        '#...#.....#...#',
        '#...#.....#...#',
        '###############',
      ],
      obstacles: [
        { sprite: 'robot', path: [[5, 6], [9, 6]], speed: 1.3 },
      ],
      lasers: [
        { tiles: [[4, 4]], period: 2.6, on: 1.2, offset: 0 },
        { tiles: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6], [7, 7], [7, 8]], period: 3.2, on: 1.4, offset: 1 },
      ],
    },

    // 17. A spinning arm sweeps the corridor. Slip past when it points the other way.
    {
      id: 'arm-intro',
      map: [
        '###############',
        '###############',
        '###############',
        '#.............#',
        '#.P.........E.#',
        '#.............#',
        '###############',
        '###############',
        '###############',
        '###############',
      ],
      obstacles: [
        { sprite: 'arm', center: [7, 4], length: 1.4, speed: 0.9 },
      ],
    },

    // 18. Teleporters: matching portals link rooms that have no doorway.
    {
      id: 'teleport',
      map: [
        '###############',
        '#...#.....#...#',
        '#.P.#..r..#.2.#',
        '#...#.....#...#',
        '#.1.#.1.2.#...#',
        '#####.....##R##',
        '#####.....#...#',
        '#####.....#.E.#',
        '#####.....#...#',
        '###############',
      ],
    },

    // 19. Two portals from the start room: one leads to the key, the other to its door.
    {
      id: 'portal-keys',
      map: [
        '###############',
        '#.....#...#...#',
        '#.P1.2#.1.#.2.#',
        '#.....#.r.#...#',
        '###########R###',
        '##########....#',
        '##########.E..#',
        '##########....#',
        '###############',
        '###############',
      ],
    },

    // 20. A friendly alien blocks the way. Bring it a space fruit and it hops aside.
    {
      id: 'alien-intro',
      map: [
        '###############',
        '###############',
        '#.....#.......#',
        '#.P...#.......#',
        '#.....a....E..#',
        '#..f..#.......#',
        '#.....#.......#',
        '###############',
        '###############',
        '###############',
      ],
    },

    // ===== World 3: Mars Outpost =====

    // 21. Conveyor belts: one-way rides through the wall and back.
    {
      id: 'conveyor',
      map: [
        '###############',
        '#.....#.......#',
        '#.P...>>>.....#',
        '#.....#.......#',
        '#.....<<<..y..#',
        '#.....#.......#',
        '##Y############',
        '#.>>>>>>>>....#',
        '#...........E.#',
        '###############',
      ],
    },

    // 22. Belt loop: four rooms joined only by one-way belts. Ride around to the key and back.
    {
      id: 'belt-loop',
      map: [
        '###############',
        '#......#......#',
        '#.E....#....y.#',
        '#......#......#',
        '###Y######^#v##',
        '#......#......#',
        '#.P....>......#',
        '#......<......#',
        '#......#......#',
        '###############',
      ],
      obstacles: [
        { sprite: 'robot', path: [[8, 5], [13, 5]], speed: 1.2 },
      ],
    },

    // 23. Buttons hold gates open, but only while something is on them:
    //     push the crate onto the button to keep the gate open.
    {
      id: 'buttons',
      map: [
        '###############',
        '#.....#.......#',
        '#.P...#.......#',
        '#.....=....E..#',
        '#.....#.......#',
        '#.#####.......#',
        '#.C..+#.......#',
        '#######.......#',
        '#######.......#',
        '###############',
      ],
    },

    // 24. Color switch: step on it to swap which blocks are up, pink or blue.
    {
      id: 'switch-intro',
      map: [
        '###############',
        '###############',
        '#..c...m......#',
        '#.Pc...m......#',
        '#..c.s.m....E.#',
        '#..c...m......#',
        '#..c...m......#',
        '###############',
        '###############',
        '###############',
      ],
    },

    // 25. First chasing robot: it follows you (slowly) and naps after a bump. Grab the key and go.
    {
      id: 'chaser-intro',
      map: [
        '###############',
        '#P............#',
        '#..##.....##..#',
        '#..##.....##..#',
        '#.......g.....#',
        '#..##.....##..#',
        '#..##.....##..#',
        '#............##',
        '############GE#',
        '###############',
      ],
      obstacles: [
        { sprite: 'chaser', start: [13, 1], speed: 1.1, delay: 2.5 },
      ],
    },

    // 26. Teleporter, laser, key, door, conveyor ride, then push the crate onto the button
    //     to open the gate to the rocket.
    {
      id: 'finale',
      map: [
        '###############',
        '#.P...#.......#',
        '#.....#.b.....#',
        '#..1..#.....1.#',
        '#.....###B#####',
        '#########v#####',
        '#.E.=.....#####',
        '#########C#####',
        '#########+#####',
        '###############',
      ],
      lasers: [
        { tiles: [[10, 1], [10, 2], [10, 3]], period: 3.2, on: 1.4, offset: 0 },
        { tiles: [[7, 6]], period: 2.8, on: 1.2, offset: 1.4 },
      ],
    },

    // 27. A comet bounces around the room. Watch where it goes and dodge.
    {
      id: 'comet-intro',
      map: [
        '###############',
        '#P............#',
        '#..........y..#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#............##',
        '#...........YE#',
        '###############',
      ],
      obstacles: [
        { sprite: 'comet', start: [6, 4], dir: [1, 1], speed: 2.2 },
      ],
    },

    // 28. Timer button: step on it and the purple door opens for a few moves. Hurry through!
    {
      id: 'timer-intro',
      timer: 6,
      map: [
        '###############',
        '###############',
        '#.....#.......#',
        '#.P.d.D.....E.#',
        '#.....#.......#',
        '###############',
        '###############',
        '###############',
        '###############',
        '###############',
      ],
    },

    // 29. Laser shadow: the beam guards the vault door. Push the crate into the beam
    //     ABOVE the doorway so its shadow falls on the way in. (Too low and it's stuck.)
    {
      id: 'laser-shadow',
      map: [
        '###############',
        '###############',
        '#..........#..#',
        '#..........#.E#',
        '#....C.....#..#',
        '#.P........#..#',
        '#..........B..#',
        '#.......b.#####',
        '###############',
        '###############',
      ],
      obstacles: [
        { sprite: 'robot', path: [[7, 5], [7, 7]], speed: 1.2 },
      ],
      lasers: [
        { tiles: [[10, 2], [10, 3], [10, 4], [10, 5], [10, 6]], always: true },
      ],
    },

    // 30. A UFO parks in the doorway for a while, then floats off. Wait for it.
    {
      id: 'ufo-intro',
      map: [
        '###############',
        '###############',
        '#......#......#',
        '#......#......#',
        '#.P.........E.#',
        '#......#......#',
        '#......#......#',
        '###############',
        '###############',
        '###############',
      ],
      obstacles: [
        { sprite: 'ufo', path: [[7, 4], [7, 1]], speed: 1.2, pause: 2.5 },
      ],
    },

    // ===== World 4: Asteroid Mine =====

    // 31. Crates can't teleport: park the crate on the button first, then take the portal
    //     to the key and the gate beyond it.
    {
      id: 'portal-button',
      map: [
        '###############',
        '#.P...#.......#',
        '#.....#...y...#',
        '#..1..#.......#',
        '#.....#...1...#',
        '#.#####=#######',
        '#.C..+#.......#',
        '#######......##',
        '#######.....YE#',
        '###############',
      ],
      obstacles: [
        { sprite: 'robot', path: [[7, 7], [11, 7]], speed: 1.1 },
      ],
      lasers: [
        { tiles: [[8, 1], [8, 2], [8, 3], [8, 4]], period: 3, on: 1.3, offset: 0 },
      ],
    },

    // 32. Timer race: walking around is too slow, but the belt gets you to the door in time.
    {
      id: 'timer-race',
      timer: 7,
      map: [
        '###############',
        '#d>>>>>>>>>>.##',
        '#.##########.##',
        '#.P..........##',
        '############D##',
        '##########....#',
        '##########.E..#',
        '##########....#',
        '###############',
        '###############',
      ],
    },

    // 33. The belts stop at the beam. Block it with the crate first, then ride
    //     across to the key and back.
    {
      id: 'belt-beam',
      map: [
        '###############',
        '###############',
        '#.C......######',
        '#.######.######',
        '#.P>>>>>>>>>..#',
        '#........###y.#',
        '#..<<<<<<<<<..#',
        '#Y#############',
        '#E#############',
        '###############',
      ],
      lasers: [
        { tiles: [[8, 2], [8, 3], [8, 4], [8, 5], [8, 6]], always: true },
      ],
    },

    // 34. Crumbly bridges fall away behind you. Cross on one, come back on the other.
    {
      id: 'crumble-intro',
      map: [
        '###############',
        '###############',
        '#......_......#',
        '#......*....y.#',
        '#.P...._......#',
        '#......*......#',
        '#......_......#',
        '#Y#############',
        '#E#############',
        '###############',
      ],
    },

    // 35. Keys and doors with a chasing robot in the second room.
    {
      id: 'chaser-keys',
      map: [
        '###############',
        '#P....#.......#',
        '#..y..#...r...#',
        '#.....Y.......#',
        '#.....#.......#',
        '#########R#####',
        '#.............#',
        '#.E...........#',
        '#.............#',
        '###############',
      ],
      obstacles: [
        { sprite: 'chaser', start: [12, 4], speed: 1.2, delay: 1.5 },
      ],
    },

    // 36. First big level: the camera scrolls. Four keys, four doors, six rooms.
    {
      id: 'big-station',
      map: [
        '##############################',
        '#P.......#.........#.........#',
        '#........#....b....#.........#',
        '#...r....R...................#',
        '#........#.........#....g....#',
        '#........#.........#.........#',
        '########################B#####',
        '#........#.........#.........#',
        '#........#.........#.........#',
        '#........#.........#.........#',
        '#.E......Y....y....G.........#',
        '#........#.........#.........#',
        '#........#.........#.........#',
        '##############################',
      ],
      obstacles: [
        { sprite: 'asteroid', path: [[12, 1], [12, 5]], speed: 1.3 },
        { sprite: 'robot', path: [[20, 2], [28, 2]], speed: 1.3 },
        { sprite: 'asteroid', path: [[22, 7], [22, 12]], speed: 1.4 },
        { sprite: 'chaser', start: [17, 12], speed: 1, delay: 3 },
      ],
    },

    // 37. The far timer button is too far from the door. Park the crate on the near one to hold it open.
    {
      id: 'timer-hold',
      timer: 6,
      holdTimer: true,
      map: [
        '###############',
        '#.P.....#.....#',
        '#.......#..E..#',
        '#.......D.....#',
        '#.......#.....#',
        '#.#####.#######',
        '#.C..d#.......#',
        '#######.......#',
        '#######.....d.#',
        '###############',
      ],
    },

    // 38. Grab the helmet: its bubble shield lets you walk straight through the robots for a while.
    {
      id: 'helmet-intro',
      map: [
        '###############',
        '###############',
        '###############',
        '#.............#',
        '#Ph.........E.#',
        '#.............#',
        '###############',
        '###############',
        '###############',
        '###############',
      ],
      obstacles: [
        { sprite: 'robot', path: [[4, 3], [4, 5]], speed: 2 },
        { sprite: 'robot', path: [[6, 5], [6, 3]], speed: 2.2 },
        { sprite: 'robot', path: [[8, 3], [8, 5]], speed: 2.4 },
        { sprite: 'robot', path: [[10, 5], [10, 3]], speed: 2 },
      ],
    },

    // 39. Challenge: block the beam, dodge the robot for the key, portal across,
    //     time the laser, open the door, ride the belt and push the crate onto the button.
    {
      id: 'grand-finale',
      map: [
        '###############',
        '#.C...#########',
        '#.###....2#...#',
        '#.P.......#.2.#',
        '#.......r.#...#',
        '###########R###',
        '#E=########v###',
        '#+.....C......#',
        '###############',
        '###############',
      ],
      obstacles: [
        { sprite: 'robot', path: [[6, 2], [6, 4]], speed: 1.1 },
      ],
      lasers: [
        { tiles: [[5, 1], [5, 2], [5, 3], [5, 4]], always: true },
        { tiles: [[11, 4], [12, 4], [13, 4]], period: 3, on: 1.2, offset: 0 },
        { tiles: [[4, 7]], period: 2.6, on: 1.1, offset: 1 },
      ],
    },

    // 40. Laser wall, chasing robot, red key, timer button in a closet, timed door.
    {
      id: 'mars-finale',
      timer: 20,
      map: [
        '###############',
        '#.C.....#....E#',
        '#.#####.##D####',
        '#.P...........#',
        '#..........r..#',
        '#.............#',
        '#.............#',
        '#............##',
        '#...........Rd#',
        '###############',
      ],
      obstacles: [
        { sprite: 'chaser', start: [12, 5], speed: 1.2, delay: 2 },
      ],
      lasers: [
        { tiles: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6], [7, 7], [7, 8]], always: true },
      ],
    },

    // ===== World 5: Ice Comet =====

    // 41. Ice! Step on it and you slide until something stops you. Zig-zag down to the rocket.
    {
      id: 'ice-intro',
      map: [
        '###############',
        '#P~~~~~~~~~~~.#',
        '#############~#',
        '#.~~~~~~~~~~~.#',
        '#~#############',
        '#.~~~~~~~~~~~E#',
        '###############',
        '###############',
        '###############',
        '###############',
      ],
    },

    // 42. Rocks stop you on the ice. Find the slide that lands on the key.
    {
      id: 'ice-stops',
      map: [
        '###############',
        '#.~~~~~~~~~~~.#',
        '#.~~~~~~~~~#~.#',
        '#.~~#~~y~~~~~.#',
        '#P~~~~~~~~~~~.#',
        '#.~~~~~~#~~~~.#',
        '#.~~~~~~~~~~~.#',
        '#############Y#',
        '#############E#',
        '###############',
      ],
    },

    // 43. Nothing to stop you where you need to be: push the crate onto the ice to make a stopper.
    {
      id: 'ice-crate',
      crateSpots: [[8, 4]],
      map: [
        '###############',
        '#.............#',
        '#.............#',
        '#.P....#C.....#',
        '#.~~~~~~~~~~~.#',
        '#######.#######',
        '#######E#######',
        '###############',
        '###############',
        '###############',
      ],
    },

    // 44. A slippery blue crate slides across the ice, all the way to the button.
    {
      id: 'slick-intro',
      map: [
        '###############',
        '###############',
        '###############',
        '#.PI~~~~~~~+###',
        '#.#############',
        '#.=.........E.#',
        '###############',
        '###############',
        '###############',
        '###############',
      ],
    },

    // 45. Slide to the key while asteroids drift across the lake.
    {
      id: 'ice-asteroids',
      map: [
        '###############',
        '#.............#',
        '#.~~~~~~~~~~~.#',
        '#.~~~~~~~~~~~.#',
        '#P~~~~~y~~~~~.#',
        '#.~~~~~~~~~~~.#',
        '#.~~~~~~~~~~~.#',
        '#............##',
        '############YE#',
        '###############',
      ],
      obstacles: [
        { sprite: 'asteroid', path: [[4, 1], [4, 7]], speed: 1.5 },
        { sprite: 'asteroid', path: [[10, 7], [10, 1]], speed: 1.3 },
      ],
    },

    // 46. A belt throws you onto the ice and across to the key; another belt brings you back.
    {
      id: 'ice-belts',
      map: [
        '###############',
        '#P.>>>~~~~~~y.#',
        '#.###########.#',
        '#.~~~~~~~~~<<.#',
        '#Y#############',
        '#E#############',
        '###############',
        '###############',
        '###############',
        '###############',
      ],
    },

    // 47. Portals in and out of an icy room with the key.
    {
      id: 'ice-portals',
      map: [
        '###############',
        '#.....#1~~~~~.#',
        '#.P...#~~~~#~.#',
        '#..1..#~~~~~~.#',
        '#.....#~#~~~~2#',
        '#...2.#~~~~~y~#',
        '##Y####~~~~~~.#',
        '#.E############',
        '###############',
        '###############',
      ],
    },

    // 48. Block the laser wall with the crate, then slide through its shadow.
    {
      id: 'ice-laser',
      map: [
        '###############',
        '###############',
        '#.C.......#.E.#',
        '#.#######.#.#.#',
        '#.P~~~~~~~~~~.#',
        '#.~~~~~~~~~~~.#',
        '###############',
        '###############',
        '###############',
        '###############',
      ],
      obstacles: [
        { sprite: 'asteroid', path: [[2, 5], [12, 5]], speed: 1.2 },
      ],
      lasers: [
        { tiles: [[9, 2], [9, 3], [9, 4], [9, 5]], always: true },
      ],
    },

    // 49. Big ice level: two frozen lakes, two keys and a scrolling camera.
    {
      id: 'big-comet',
      map: [
        '############################',
        '#P.....#~~~~~#~~~~~~#......#',
        '#......#~~~~#~~~~~~~~......#',
        '#......~~~~~~~#~~~~~#...y..#',
        '#......#~~~~~~#~~~~~#......#',
        '#......#~~~~~~~~~~~~#b.....#',
        '#####################Y######',
        '#...##~~~~~~~~~~~~~~~~.....#',
        '#.E.B~~~~#~~~~~~~#~~~~.....#',
        '#...#~~~~~~~~~~~~~~~~~.....#',
        '############################',
      ],
      obstacles: [
        { sprite: 'asteroid', path: [[15, 1], [15, 5]], speed: 1.2 },
      ],
    },

    // 50. A rocky ice lake, an asteroid and a chasing robot.
    {
      id: 'comet-finale',
      map: [
        '###############',
        '#P..~~~~~~#~~.#',
        '#...~~#~~~~~~.#',
        '#...~~~~~~~#~.#',
        '#...~~~~~~~~~.#',
        '#...~#~~b~~~~.#',
        '#...~~~~~~~~~.#',
        '#########B#####',
        '#########E#####',
        '###############',
      ],
      obstacles: [
        { sprite: 'asteroid', path: [[7, 1], [7, 6]], speed: 1.3 },
        { sprite: 'chaser', start: [13, 6], speed: 1, delay: 3 },
      ],
    },

    // ===== World 6: Nebula =====

    // 51. Slide away from a chasing robot to reach the key.
    {
      id: 'ice-chaser',
      map: [
        '###############',
        '#P............#',
        '#.~~~~~#~~~~~.#',
        '#.~~~~~~~~~~~.#',
        '#.~~~#~~~r~~~.#',
        '#.~~~~~~~~~~~.#',
        '#.~~~~~#~~~~~.#',
        '#......#......#',
        '######RE#######',
        '###############',
      ],
      obstacles: [
        { sprite: 'chaser', start: [13, 7], speed: 1.2, delay: 2 },
      ],
    },

    // 52. A black hole tugs you a step closer when you walk by. It can't swallow you: just go around.
    {
      id: 'hole-intro',
      map: [
        '###############',
        '#......y......#',
        '#.............#',
        '#.............#',
        '#P.....O......#',
        '#.............#',
        '#.............#',
        '#............##',
        '#...........YE#',
        '###############',
      ],
    },

    // 53. Press the timer, then take the portal: it lands you right by the timed door.
    {
      id: 'timer-portals',
      timer: 6,
      map: [
        '###############',
        '#.....#...#...#',
        '#.P...#.1.D.E.#',
        '#.....#...#...#',
        '#.d.1.#########',
        '#.....#########',
        '###############',
        '###############',
        '###############',
        '###############',
      ],
      obstacles: [
        { sprite: 'robot', path: [[1, 1], [5, 1]], speed: 1.2 },
      ],
    },

    // 54. Crate on the button to open the gate, then get the key past a chasing robot.
    {
      id: 'chaser-buttons',
      map: [
        '###############',
        '#.....#.......#',
        '#.P...#....####',
        '#.....=....R.E#',
        '#.....#....####',
        '#.#####.......#',
        '#.C..+#..r....#',
        '#######.......#',
        '#######.......#',
        '###############',
      ],
      obstacles: [
        { sprite: 'chaser', start: [13, 8], speed: 1.2, delay: 2 },
      ],
    },

    // 55. Bump the mirror to turn it and bounce the laser up into the crystal. The crystal opens the gate.
    {
      id: 'mirror-intro',
      map: [
        '###############',
        '########q######',
        '########.#..=E#',
        '########.#...##',
        '########.#.P..#',
        '#.......W.....#',
        '###############',
        '###############',
        '###############',
        '###############',
      ],
      lasers: [
        { from: [0, 5], dir: 'right', always: true },
      ],
    },

    // 56. Three blinking laser walls across one room. Time each crossing.
    {
      id: 'laser-maze',
      map: [
        '###############',
        '#P............#',
        '#..........y..#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#............##',
        '#...........YE#',
        '###############',
      ],
      lasers: [
        { tiles: [[4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [4, 7], [4, 8]], period: 3, on: 1.3, offset: 0 },
        { tiles: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6], [7, 7], [7, 8]], period: 3, on: 1.3, offset: 1 },
        { tiles: [[10, 1], [10, 2], [10, 3], [10, 4], [10, 5], [10, 6], [10, 7], [10, 8]], period: 3, on: 1.3, offset: 2 },
      ],
    },

    // 57. Two laser walls, two crates: block one, cross, block the next.
    {
      id: 'double-shadow',
      map: [
        '###############',
        '#.C...#.C...###',
        '#.###.#.##.####',
        '#.P..........E#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '###############',
      ],
      obstacles: [
        { sprite: 'robot', path: [[8, 3], [8, 8]], speed: 1.2 },
      ],
      lasers: [
        { tiles: [[5, 1], [5, 2], [5, 3], [5, 4], [5, 5], [5, 6], [5, 7], [5, 8]], always: true },
        { tiles: [[10, 1], [10, 2], [10, 3], [10, 4], [10, 5], [10, 6], [10, 7], [10, 8]], always: true },
      ],
    },

    // 58. Big level: red key, laser wall, chasing robot, timer button and a portal dash.
    {
      id: 'big-nebula',
      timer: 10,
      map: [
        '##############################',
        '#........#.C....#####.....####',
        '#.P......#.####.#####.....####',
        '#........#..........#.....####',
        '#........#..........#.....#..#',
        '#........R........1.#.1...D.E#',
        '#........#..........#.....#..#',
        '#........#..........#.....####',
        '#...r....#.......d..#.....####',
        '#........#..........#.....####',
        '#........#..........#.....####',
        '##############################',
      ],
      obstacles: [
        { sprite: 'asteroid', path: [[5, 1], [5, 10]], speed: 1.3 },
        { sprite: 'chaser', start: [12, 9], speed: 1.1, delay: 3 },
      ],
      lasers: [
        { tiles: [[15, 1], [15, 2], [15, 3], [15, 4], [15, 5], [15, 6], [15, 7], [15, 8], [15, 9], [15, 10]], always: true },
      ],
    },

    // 59. Walking to the timed door is too slow. The ice is fast!
    {
      id: 'timer-ice',
      timer: 5,
      map: [
        '###############',
        '###############',
        '#.P.........###',
        '#d~~~~~~~~~~D.#',
        '#############E#',
        '###############',
        '###############',
        '###############',
        '###############',
        '###############',
      ],
      obstacles: [
        { sprite: 'asteroid', path: [[7, 2], [7, 3]], speed: 0.8 },
      ],
    },

    // 60. Blinking lasers and a chasing robot in one room.
    {
      id: 'chaser-lasers',
      map: [
        '###############',
        '#.............#',
        '#.P........b..#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#............##',
        '#...........BE#',
        '###############',
      ],
      obstacles: [
        { sprite: 'chaser', start: [12, 5], speed: 1.2, delay: 2 },
      ],
      lasers: [
        { tiles: [[5, 1], [5, 2], [5, 3], [5, 4], [5, 5], [5, 6], [5, 7], [5, 8]], period: 3, on: 1.3, offset: 0 },
        { tiles: [[9, 1], [9, 2], [9, 3], [9, 4], [9, 5], [9, 6], [9, 7], [9, 8]], period: 3, on: 1.3, offset: 1.5 },
      ],
    },

    // ===== World 7: Jungle Planet =====

    // 61. Three belts lead to three rooms. Explore them in the right order.
    {
      id: 'belt-maze',
      map: [
        '###############',
        '#P....>.....g.#',
        '#.....<.......#',
        '#.....#########',
        '#.....>..G....#',
        '#.....<..#..y.#',
        '#.....#########',
        '#.....>..Y....#',
        '#.....<..#..E.#',
        '###############',
      ],
      obstacles: [
        { sprite: 'asteroid', path: [[3, 1], [3, 8]], speed: 1.3 },
        { sprite: 'robot', path: [[10, 4], [13, 4]], speed: 1.2 },
      ],
    },

    // 62. A hub with four portals, one to each corner room. A chasing robot guards the hub.
    {
      id: 'portal-hub',
      map: [
        '###############',
        '#.r.#.....#.b.#',
        '#...#1...2##R##',
        '#.1.#.....#.2.#',
        '#####..P..#####',
        '#####.....#####',
        '#.3.#.....#.4.#',
        '##B##3...4##Y##',
        '#.y.#.....#.E.#',
        '###############',
      ],
      obstacles: [
        { sprite: 'chaser', start: [7, 8], speed: 1, delay: 3 },
      ],
    },

    // 63. Island hopping: jump pads between islands, with an asteroid drifting past.
    {
      id: 'jungle-jumps',
      map: [
        '###############',
        '#P.._...._....#',
        '#..J_...J_y...#',
        '#..._...._..J.#',
        '#_____________#',
        '#_.._...._....#',
        '#_.._...._....#',
        '#EY._J..._J...#',
        '#_.._...._....#',
        '###############',
      ],
      obstacles: [
        { sprite: 'asteroid', path: [[1, 4], [13, 4]], speed: 1.4 },
      ],
    },

    // 64. Ride the belt down to the robot room. Pull the lever first to put the robots to sleep.
    {
      id: 'lever-robots',
      map: [
        '###############',
        '#.............#',
        '#.P....L......#',
        '#.............#',
        '############v##',
        '############v##',
        '#.............#',
        '#E............#',
        '#.............#',
        '###############',
      ],
      obstacles: [
        { sprite: 'robot', path: [[2, 7], [12, 7]], speed: 1.6, switch: true },
        { sprite: 'robot', path: [[6, 6], [6, 8]], speed: 1.4, switch: true },
        { sprite: 'robot', path: [[9, 8], [9, 6]], speed: 1.4, switch: true },
      ],
    },

    // 65. Two spinning arms turning opposite ways. Get the key and slip past.
    {
      id: 'arm-garden',
      map: [
        '###############',
        '#P..........YE#',
        '#............##',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#......y......#',
        '###############',
      ],
      obstacles: [
        { sprite: 'arm', center: [4, 4], length: 2, speed: 0.8 },
        { sprite: 'arm', center: [10, 5], length: 2, speed: -0.7 },
      ],
    },

    // 66. Two hungry aliens, two space fruits. Feed them in the right order.
    {
      id: 'alien-feast',
      map: [
        '###############',
        '#P...#.....#..#',
        '#....#..f..#..#',
        '#.f..a.....a.E#',
        '#....#.....#..#',
        '#}...#..{..#..#',
        '###############',
        '###############',
        '###############',
        '###############',
      ],
      obstacles: [
        { sprite: 'robot', path: [[6, 1], [10, 1]], speed: 1.2 },
      ],
    },

    // 67. A maze of one-way arrows. Find the loop that reaches the key and the door.
    {
      id: 'arrow-maze',
      map: [
        '###############',
        '#P..}..#..{...#',
        '#.###.##.##.#.#',
        '#.#y{.....#.#.#',
        '#.#.###A###.#.#',
        '#.....}....}..#',
        '#.#########.###',
        '#...{.......YE#',
        '###############',
        '###############',
      ],
    },

    // 68. Jump the chasm both ways while two comets bounce around.
    {
      id: 'jungle-comets',
      map: [
        '###############',
        '#P....._......#',
        '#......_....y.#',
        '#.....J_......#',
        '#......_......#',
        '#......_......#',
        '#......_J.....#',
        '##....._......#',
        '#EY...._......#',
        '###############',
      ],
      obstacles: [
        { sprite: 'comet', start: [3, 5], dir: [1, 1], speed: 2 },
        { sprite: 'comet', start: [11, 5], dir: [-1, 1], speed: 2.2 },
      ],
    },

    // 69. Grand voyage: keys, ice, belt, laser wall, portal, timer dash, robots and the rocket home.
    //     (A second timer button inside lets you back out.)
    {
      id: 'grand-voyage',
      timer: 22,
      map: [
        '################################',
        '#......#~~~~~~~#~~##..C...######',
        '#.P....Y~~~~#~~~~~>>.####.##...#',
        '#....y.#~~~~~~~~~~#........B.1.#',
        '#......#~~~b~~~~~~.........#...#',
        '###################........#...#',
        '################################',
        '#.....#.....#..................#',
        '#.....#.....#..................#',
        '#..E..R.....D................1.#',
        '#.....#.....#..................#',
        '#.....#..d..#.......r.......d..#',
        '#.....#.....#..................#',
        '################################',
      ],
      obstacles: [
        { sprite: 'asteroid', path: [[4, 1], [4, 4]], speed: 1.2 },
        { sprite: 'robot', path: [[14, 10], [26, 10]], speed: 1.3 },
        { sprite: 'chaser', start: [20, 8], speed: 1.1, delay: 4 },
      ],
      lasers: [
        { tiles: [[25, 1], [25, 2], [25, 3], [25, 4], [25, 5]], always: true },
      ],
    },

    // 70. Pull the lever, jump for the fruit, jump back, feed the alien and pass the spinning arm.
    {
      id: 'jungle-finale',
      map: [
        '###############',
        '#P....#.......#',
        '#.....#.....f.#',
        '#..L.J_.......#',
        '#....._J......#',
        '###a###########',
        '#.............#',
        '#............E#',
        '#.............#',
        '###############',
      ],
      obstacles: [
        { sprite: 'arm', center: [7, 7], length: 2, speed: 0.9 },
      ],
      lasers: [
        { tiles: [[10, 1], [10, 2], [10, 3], [10, 4]], always: true, switch: true },
      ],
    },

    // ===== World 8: Crystal Caves =====

    // 71. Turn two mirrors so the laser zig-zags into the crystal.
    {
      id: 'two-mirrors',
      map: [
        '###############',
        '###############',
        '#....M......=E#',
        '#............##',
        '#.............#',
        '#.............#',
        '#q...W........#',
        '#.............#',
        '#.......P.....#',
        '###############',
      ],
      lasers: [
        { from: [0, 2], dir: 'right', always: true },
      ],
    },

    // 72. Two color switches: swap the walls to reach the key, then swap back to reach the door.
    {
      id: 'color-keys',
      map: [
        '###############',
        '#P....m.....y.#',
        '#.....m.......#',
        '#..s..m...s...#',
        '#.....m.......#',
        '#cccccmccccccc#',
        '#............##',
        '#...........YE#',
        '#............##',
        '###############',
      ],
    },

    // 73. Crumbly bridges between four islands. Get the key before you cross to the rocket!
    {
      id: 'crumble-maze',
      map: [
        '###############',
        '#P....._......#',
        '#......*....y.#',
        '#......_......#',
        '#__*_______*__#',
        '#......_......#',
        '#......*......#',
        '#......_.....##',
        '#......_....YE#',
        '###############',
      ],
      obstacles: [
        { sprite: 'asteroid', path: [[7, 1], [7, 8]], speed: 1.2 },
      ],
    },

    // 74. Block one laser with the crate, then turn the mirror to light the crystal with the other.
    {
      id: 'mirror-crate',
      map: [
        '###############',
        '#.C.....#######',
        '#.#####.#######',
        '#.P.........=E#',
        '#.......#...###',
        '#.......#.....#',
        '#.......#..W..#',
        '#.......#.....#',
        '#.......#.....#',
        '###########q###',
      ],
      lasers: [
        { tiles: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6], [7, 7], [7, 8]], always: true },
        { from: [14, 6], dir: 'left', always: true },
      ],
    },

    // 75. An icy lake where color blocks become stoppers when they rise.
    {
      id: 'switch-ice',
      map: [
        '###############',
        '#P.s..........#',
        '#.~~~~~m~~~~~.#',
        '#.~~~~~~~~~~~.#',
        '#.~~c~~~~~~~~.#',
        '#.~~~~~~~y~~~.#',
        '#.~~~~~~~~~~~.#',
        '#............##',
        '#...........YE#',
        '###############',
      ],
    },

    // 76. A deep crack: spring across on the jump pad, grab the key, then come back over the
    //     crumbly stepping stone (the arrow means it's a way back only) to the yellow door.
    {
      id: 'crumble-jump',
      map: [
        '###############',
        '#P....._......#',
        '#......_...y..#',
        '#.....{*......#',
        '#......_......#',
        '#......_......#',
        '#.....J_......#',
        '##....._......#',
        '#EY...._......#',
        '###############',
      ],
    },

    // 77. Four mirrors, one crystal. Turn the right ones.
    {
      id: 'mirror-maze',
      map: [
        '###############',
        '#.............#',
        '#.M.....W....q#',
        '#.............#',
        '#.P...........#',
        '#.............#',
        '#.W.....M.....#',
        '#............##',
        '#...........=E#',
        '###############',
      ],
      lasers: [
        { from: [2, 9], dir: 'up', always: true },
      ],
    },

    // 78. Color switch opens the pink wall; turn the mirror so the laser lights the crystal
    //     and opens the key closet; then flip the switch back to lower the blue block by the door.
    {
      id: 'crystal-doors',
      map: [
        '###############',
        '#P.s..#....#y##',
        '#.....#....#.##',
        '#.....m.....=.#',
        '#.....#.......#',
        '#.....#..W...q#',
        '#..c..#.......#',
        '###Y###########',
        '#.E...........#',
        '###############',
      ],
      lasers: [
        { from: [9, 7], dir: 'up', always: true },
      ],
    },

    // 79. Big cave: flip the color walls one way, then the other, then cross the crumbly bridge.
    {
      id: 'big-caves',
      map: [
        '############################',
        '#........m........c________#',
        '#.P......m..y.....c________#',
        '#........m........c____....#',
        '#........m........c____...##',
        '#........m........c......YE#',
        '#........m........c____...##',
        '#........m........c____....#',
        '#...s....m.....s..c________#',
        '#........m........c________#',
        '#........m........c________#',
        '############################',
      ],
      obstacles: [
        { sprite: 'comet', start: [11, 6], dir: [1, 1], speed: 1.8 },
        { sprite: 'arm', center: [5, 5], length: 1.5, speed: 0.7 },
      ],
    },

    // 80. Fruit for the alien, a color wall, a mirror to the crystal gate and crumbly floor.
    {
      id: 'crystal-finale',
      map: [
        '###############',
        '#P.....#..q...#',
        '#......#......#',
        '#..f...#......#',
        '#......#..W...#',
        '#......#......#',
        '###a#####.q=###',
        '#...**....#.E.#',
        '#.........#...#',
        '###############',
      ],
      obstacles: [
        { sprite: 'comet', start: [5, 8], dir: [1, -1], speed: 1.6 },
      ],
      lasers: [
        { from: [14, 4], dir: 'left', always: true },
      ],
    },

    // ===== World 9: Sun Station =====

    // 81. Two UFOs park in two doorways. Time your dash between them.
    {
      id: 'ufo-convoy',
      map: [
        '###############',
        '#....#....#...#',
        '#....#....#...#',
        '#.P.........E.#',
        '#....#....#...#',
        '#....#....#...#',
        '###############',
        '###############',
        '###############',
        '###############',
      ],
      obstacles: [
        { sprite: 'ufo', path: [[5, 3], [5, 1]], speed: 1.4, pause: 2 },
        { sprite: 'ufo', path: [[10, 5], [10, 3]], speed: 1.2, pause: 2.5 },
      ],
    },

    // 82. Two comets bounce around a room with pillars. Grab the key and get out.
    {
      id: 'comet-room',
      map: [
        '###############',
        '#P............#',
        '#.............#',
        '#....#...#....#',
        '#......r......#',
        '#....#...#....#',
        '#.............#',
        '#............##',
        '#...........RE#',
        '###############',
      ],
      obstacles: [
        { sprite: 'comet', start: [3, 2], dir: [1, 1], speed: 2 },
        { sprite: 'comet', start: [11, 6], dir: [-1, 1], speed: 2.3 },
      ],
    },

    // 83. Slide two slippery crates across the ice onto the pads.
    {
      id: 'slick-buttons',
      map: [
        '###############',
        '#P#############',
        '#.I~~~~~~o#####',
        '#.#############',
        '#.I~~~~~~o#####',
        '#.#############',
        '#.......F....E#',
        '###############',
        '###############',
        '###############',
      ],
      obstacles: [
        { sprite: 'ufo', path: [[11, 6], [11, 8]], speed: 1.2, pause: 1.5 },
      ],
    },

    // 84. Press the timer, grab the helmet and charge through the robots to the door.
    {
      id: 'helmet-dash',
      timer: 8,
      map: [
        '###############',
        '#P.d#.........#',
        '#.h.D.........#',
        '#...#.........#',
        '#####.........#',
        '#.............#',
        '#............##',
        '#............E#',
        '#.............#',
        '###############',
      ],
      obstacles: [
        { sprite: 'robot', path: [[6, 2], [12, 2]], speed: 2.2 },
        { sprite: 'robot', path: [[12, 4], [6, 4]], speed: 2 },
        { sprite: 'robot', path: [[3, 6], [11, 6]], speed: 2.4 },
        { sprite: 'chaser', start: [12, 8], speed: 1.3, delay: 2 },
      ],
    },

    // 85. Both belts carry you over to the key, but not back. Pull a lever (either one) to turn
    //     the belts around and ride home.
    {
      id: 'belt-lever',
      leverReversesBelts: true,
      map: [
        '###############',
        '#P....#.......#',
        '#.....>>>>>>..#',
        '#..L..#....y..#',
        '#.....>>>>>>..#',
        '#.....#.....L.#',
        '###Y###########',
        '#.............#',
        '#.E...........#',
        '###############',
      ],
      obstacles: [
        { sprite: 'ufo', path: [[9, 3], [12, 3]], speed: 1, pause: 1.5 },
      ],
    },

    // 86. Slide across a rocky lake while a comet bounces overhead.
    {
      id: 'comet-ice',
      map: [
        '###############',
        '#P.~~~~~~~~~..#',
        '#..~~~~#~~~~..#',
        '#..~~~~~~~~~..#',
        '#..~~#~~~y~~..#',
        '#..~~~~~~~~~..#',
        '#..~~~~~~#~~..#',
        '#............##',
        '#...........YE#',
        '###############',
      ],
      obstacles: [
        { sprite: 'comet', start: [6, 3], dir: [1, -1], speed: 1.8 },
      ],
    },

    // 87. Portals between three rooms, with UFOs drifting through them.
    {
      id: 'ufo-portals',
      map: [
        '###############',
        '#P...1#.......#',
        '#.....#...2...#',
        '#.....#.......#',
        '#######1#######',
        '#.......#.....#',
        '#...b...#.....#',
        '#.......B...E.#',
        '#..2....#.....#',
        '###############',
      ],
      obstacles: [
        { sprite: 'ufo', path: [[3, 5], [3, 8]], speed: 1.2, pause: 1.5 },
        { sprite: 'ufo', path: [[9, 1], [13, 1]], speed: 1.2, pause: 1.5 },
      ],
    },

    // 88. Slide the slippery crate into the laser wall to block it.
    {
      id: 'slick-shadow',
      map: [
        '###############',
        '#.I~~~~~.######',
        '#.######.######',
        '#.P...........#',
        '#.............#',
        '#............E#',
        '#.............#',
        '###############',
        '###############',
        '###############',
      ],
      lasers: [
        { tiles: [[8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 6]], always: true },
      ],
    },

    // 89. Big level: timer dash, helmet, a long belt, a comet, a UFO and a robot.
    {
      id: 'big-sun',
      timer: 12,
      map: [
        '##############################',
        '#.........#.........#........#',
        '#.P.....d.#....r....#........#',
        '#.........#.........#........#',
        '#.........#.........#........#',
        '#.........D.>>>>>>>.R........#',
        '#.........#.........#........#',
        '#.........#.........#........#',
        '#....h....#.........#........#',
        '#.........#.........#......E.#',
        '#.........#.........#........#',
        '##############################',
      ],
      obstacles: [
        { sprite: 'comet', start: [14, 8], dir: [1, -1], speed: 2 },
        { sprite: 'ufo', path: [[24, 2], [24, 8]], speed: 1.3, pause: 1.5 },
        { sprite: 'robot', path: [[22, 6], [28, 6]], speed: 1.6 },
      ],
    },

    // 90. Slippery crate onto the pad, timer door, lever for the UFO, then the force field.
    {
      id: 'sun-finale',
      timer: 9,
      map: [
        '###############',
        '#.I~~~~~~o#####',
        '#.#############',
        '#P.h..#.......#',
        '#..d..D...L...#',
        '#.....#.....d.#',
        '##########F####',
        '#.............#',
        '#.....E.......#',
        '###############',
      ],
      obstacles: [
        { sprite: 'comet', start: [9, 2], dir: [1, 1], speed: 2 },
        { sprite: 'ufo', path: [[3, 7], [11, 7]], speed: 1.2, pause: 1.5, switch: true },
      ],
    },

    // ===== World 10: Black Hole Rim =====

    // 91. Three black holes tug at you as you cross the room.
    {
      id: 'hole-row',
      map: [
        '###############',
        '#.............#',
        '#...O.....O...#',
        '#.............#',
        '#P...........E#',
        '#.............#',
        '#......O......#',
        '#.............#',
        '#.............#',
        '###############',
      ],
      obstacles: [
        { sprite: 'robot', path: [[7, 1], [7, 3]], speed: 1.2 },
      ],
    },

    // 92. Sliding on ice past a black hole: the pull can stop you where you want.
    {
      id: 'hole-ice',
      map: [
        '###############',
        '#P.~~~~~~~~~..#',
        '#..~~~~~~~~~..#',
        '#..~~~~O~~~~..#',
        '#..~~~~~~~~~..#',
        '#..~~~~~~~~~.y#',
        '#..~~~~~~~~~..#',
        '#............##',
        '#...........YE#',
        '###############',
      ],
    },

    // 93. Turn the mirror while dodging the pull of the black holes.
    {
      id: 'hole-mirror',
      map: [
        '###############',
        '#...........P.#',
        '#.....O.......#',
        '#...........O.#',
        '#..M......M...#',
        '#.............#',
        '#.........q...#',
        '#############=#',
        '#############E#',
        '###############',
      ],
      lasers: [
        { from: [3, 7], dir: 'up', always: true },
      ],
    },

    // 94. Two aliens, two fruits, and black holes tugging you off course.
    {
      id: 'hole-aliens',
      map: [
        '###############',
        '#P.f..#.......#',
        '#.....#...O...#',
        '#.....a.......#',
        '#.....#.....f.#',
        '#..O..#.......#',
        '#############a#',
        '#.............#',
        '#E............#',
        '###############',
      ],
    },

    // 95. Crumbly crossings and a black hole near the key.
    {
      id: 'hole-crumble',
      map: [
        '###############',
        '#P....._......#',
        '#......*......#',
        '#......_......#',
        '#......_..O.y.#',
        '#......_......#',
        '#.............#',
        '##....._......#',
        '#EY...._......#',
        '###############',
      ],
    },

    // 96. Comets bounce between two black holes.
    {
      id: 'hole-comets',
      map: [
        '###############',
        '#P............#',
        '#.............#',
        '#....O...O....#',
        '#.............#',
        '#.............#',
        '#.......b.....#',
        '#............##',
        '#...........BE#',
        '###############',
      ],
      obstacles: [
        { sprite: 'comet', start: [2, 5], dir: [1, -1], speed: 2 },
        { sprite: 'comet', start: [12, 2], dir: [-1, 1], speed: 2 },
      ],
    },

    // 97. Color switch, lever and a spinning arm in a room ringed with blocks.
    {
      id: 'rim-switches',
      map: [
        '###############',
        '#P.s..m.......#',
        '#.....m..O....#',
        '#.....m.......#',
        '#cccccc...L...#',
        '#.............#',
        '#.....ccccccc.#',
        '#.....c......##',
        '#..y..c.....YE#',
        '###############',
      ],
      obstacles: [
        { sprite: 'arm', center: [10, 7], length: 1.5, speed: 1, switch: true },
      ],
      lasers: [
        { tiles: [[7, 7], [8, 7], [9, 7], [10, 7], [11, 7], [12, 7]], always: true, switch: true },
      ],
    },

    // 98. Big level: black holes, a fruit for the alien, an icy lake and a chasing robot.
    {
      id: 'big-rim',
      map: [
        '##############################',
        '#.........#~~~~~~~~b.........#',
        '#.P.......#~~~~~~~~~#........#',
        '#.........#~~~~#~~~~#........#',
        '#.........#~~~~~~~~~#...O....#',
        '#.........#~~~~~~~~~#........#',
        '#.....O...a.~~~~~~~~#........#',
        '#.........#~~~~~~~~~#........#',
        '#.........#~~~~~~~~~#####B####',
        '#.........#~~~~~~#~~#........#',
        '#..f......#~~~~~~~~~#........#',
        '#.........#~~#~~~~~~#......E.#',
        '#.........#~~~~~~~~~#........#',
        '##############################',
      ],
      obstacles: [
        { sprite: 'chaser', start: [26, 2], speed: 1.1, delay: 3 },
        { sprite: 'comet', start: [23, 10], dir: [1, 1], speed: 1.8 },
      ],
    },

    // 99. Jump pad, timer door, color wall and a mirror to the crystal gate.
    {
      id: 'almost-home',
      timer: 8,
      map: [
        '###############',
        '#P.._...#.....#',
        '#..J_...#..W..#',
        '#..._...D.....#',
        '#..._Jd.#.....#',
        '#..._...#.....#',
        '###########q=##',
        '#.............#',
        '#.....O....E..#',
        '###############',
      ],
      obstacles: [
        { sprite: 'comet', start: [3, 7], dir: [1, 1], speed: 1.8 },
      ],
      lasers: [
        { from: [14, 2], dir: 'left', always: true },
      ],
    },

    // 100. Grand finale: jump pad, alien, ice, lever, color wall, black hole, crumbly bridge,
    //     mirror and crystal gate, with an arm, a comet, a UFO and a chaser. Welcome home!
    {
      id: 'grand-finale-100',
      map: [
        '################################',
        '#.......#......#~~~~~~~y.......#',
        '#.P.....#......#~~~~~~~~...L...#',
        '#......J_......a~~~#~~~~.......#',
        '#.......#......#~~~~~~~~.......#',
        '#.......#..f...#~~~~~#~~.......#',
        '#.......#......#~~~~~~~~.......#',
        '##########################Y#####',
        '#...#..._.......m..............#',
        '#...#...........m..............#',
        '#...#..._.......m..............#',
        '#.E.=...*.......m.....O........#',
        '#...q..._...W#..m..............#',
        '#...#...........m...s..........#',
        '#...#..._.......m..............#',
        '################################',
      ],
      obstacles: [
        { sprite: 'arm', center: [11, 3], length: 1.5, speed: 0.8 },
        { sprite: 'comet', start: [26, 12], dir: [-1, 1], speed: 2 },
        { sprite: 'ufo', path: [[19, 9], [19, 13]], speed: 1.2, pause: 1.5 },
        { sprite: 'chaser', start: [28, 13], speed: 1.1, delay: 4 },
      ],
      lasers: [
        { tiles: [[24, 6], [25, 6], [26, 6], [27, 6], [28, 6], [29, 6], [30, 6]], always: true, switch: true },
        { from: [12, 7], dir: 'down', always: true },
      ],
    },
    // ===== World 11: Dark Moon =====

    // 101. Gems! The door shows two dots: bring it two gems.
    {
      id: 'gem-intro',
      gemDoors: [2],
      map: [
        '###############',
        '#......#......#',
        '#.P....#......#',
        '#......#......#',
        '#...x..X....E.#',
        '#......#......#',
        '#..x...#......#',
        '#......#......#',
        '###############',
        '###############',
      ],
    },

    // 102. Three dots, three gems, tucked into three corners.
    {
      id: 'gem-three',
      gemDoors: [3],
      map: [
        '###############',
        '#x....#.......#',
        '#.....#.......#',
        '#.....#.......#',
        '#.P...X.....E.#',
        '#.....#.......#',
        '#.....#########',
        '#x...........x#',
        '#.............#',
        '###############',
      ],
    },

    // 103. Two counting doors: the first wants two gems, the second wants three.
    {
      id: 'gem-two-doors',
      gemDoors: [2, 3],
      map: [
        '###############',
        '#....#....#...#',
        '#.x..#.x..#...#',
        '#....#....#...#',
        '#.P..X..x.X.E.#',
        '#....#....#...#',
        '#.x..#.x..#...#',
        '#....#....#...#',
        '###############',
        '###############',
      ],
    },

    // 104. Four gems, but the door only wants three. Leave the one the robot is guarding.
    {
      id: 'gem-enough',
      gemDoors: [3],
      map: [
        '###############',
        '#.............#',
        '#.x.........x.#',
        '#.............#',
        '#.P....x......#',
        '#.............#',
        '#.x...........#',
        '#######X#######',
        '#......E......#',
        '###############',
      ],
      obstacles: [
        { sprite: 'robot', path: [[9, 2], [13, 2]], speed: 1.3 },
      ],
    },

    // 105. Lights out! You can only see a little way. Follow the glow to the rocket.
    {
      id: 'dark-intro',
      dark: true,
      map: [
        '###############',
        '#.....#.......#',
        '#.P...#...#...#',
        '#.....#...#...#',
        '#.....#...#...#',
        '###.###...#...#',
        '#.........#...#',
        '#.........#.E.#',
        '#.........#...#',
        '###############',
      ],
    },

    // 106. Pick up the flashlight to see much further, then find the key in the dark maze.
    {
      id: 'dark-flashlight',
      dark: true,
      map: [
        '###############',
        '#.....#...#...#',
        '#.P.t.#.#.#.r.#',
        '#.....#.#...#.#',
        '###.###.#####.#',
        '#.......#.....#',
        '#.#####.#.###R#',
        '#.....#...#...#',
        '#.....#####..E#',
        '###############',
      ],
    },

    // 107. Three gems hidden in the dark. The flashlight helps you spot them.
    {
      id: 'dark-gems',
      dark: true,
      gemDoors: [3],
      map: [
        '###############',
        '#.....x#......#',
        '#.P....#...x..#',
        '#......#......#',
        '#..t..........#',
        '#......#......#',
        '####.#####X####',
        '#x.....#......#',
        '#......#....E.#',
        '###############',
      ],
    },

    // 108. Gems on the ice: a gem stops your slide. Then slide down to the door.
    {
      id: 'gem-ice',
      gemDoors: [3],
      map: [
        '###############',
        '#P....~~~~~~x.#',
        '#.....~~~~~~~.#',
        '#.....~~#~~~~.#',
        '#.....x~~~~~~.#',
        '#.....~~~~~#~.#',
        '#.....~~~~~~x.#',
        '#######X#######',
        '#......E......#',
        '###############',
      ],
    },

    // 109. Four gems in the dark, with a robot and an asteroid about. Their lights give them away.
    {
      id: 'dark-gem-robots',
      dark: true,
      gemDoors: [4],
      map: [
        '###############',
        '#x.....#.....x#',
        '#......#......#',
        '#..P..........#',
        '#......#......#',
        '#......#..t...#',
        '###.###########',
        '#....x.X......#',
        '#x.....#.....E#',
        '###############',
      ],
      obstacles: [
        { sprite: 'robot', path: [[8, 2], [13, 2]], speed: 1.2 },
        { sprite: 'asteroid', path: [[2, 8], [6, 8]], speed: 1.1 },
      ],
    },

    // 110. Big dark level: flashlight, two gems for the first door, a red key, and three more
    //      gems for the door to the rocket.
    {
      id: 'dark-moon-finale',
      dark: true,
      gemDoors: [2, 3],
      map: [
        '############################',
        '#.....#......#......#......#',
        '#.P...#..x...#...x..#..x...#',
        '#.....#......#......#......#',
        '#..t.........X......#......#',
        '#.....#......#......R......#',
        '###.######.#####.######X####',
        '#.....#......#......#......#',
        '#.x...#...r..#..x...#....E.#',
        '#.....#......#......#......#',
        '#.....#......#......#......#',
        '############################',
      ],
      obstacles: [
        { sprite: 'robot', path: [[14, 3], [19, 3]], speed: 1.2 },
        { sprite: 'asteroid', path: [[21, 9], [26, 9]], speed: 1.2 },
      ],
    },
    // ===== World 12: Gem Galaxy =====

    // 111. One gem is behind a gate: push the crate down its slot onto the button to get to it.
    {
      id: 'gem-crate',
      gemDoors: [2],
      map: [
        '###############',
        '#......#......#',
        '#.P....=..x...#',
        '#......#......#',
        '###C#.#########',
        '###+#.##......#',
        '#..#...X....E.#',
        '#.x....#......#',
        '###############',
        '###############',
      ],
    },

    // 112. Three gems in three closed rooms. The portals are the only way in.
    {
      id: 'gem-portals',
      gemDoors: [3],
      map: [
        '###############',
        '#...#.....#...#',
        '#.x.#..P..#.x.#',
        '#.1.#.1.2.#.2.#',
        '#####.....#####',
        '#...#..3..#...#',
        '#.x.#.....X.E.#',
        '#.3.#.....#...#',
        '###############',
        '###############',
      ],
    },

    // 113. Ride the belt to the far gem and the other belt back, past an asteroid.
    {
      id: 'gem-belts',
      gemDoors: [2],
      map: [
        '###############',
        '#.....#.......#',
        '#.P...>>>..x..#',
        '#.....#.......#',
        '#.x...<<<.....#',
        '#.....#.......#',
        '###X###########',
        '#.............#',
        '#......E......#',
        '###############',
      ],
      obstacles: [
        { sprite: 'asteroid', path: [[12, 1], [12, 5]], speed: 1.3 },
      ],
    },

    // 114. One gem behind the pink wall, one behind the blue. The switch swaps them.
    {
      id: 'gem-colors',
      gemDoors: [2],
      map: [
        '###############',
        '#.....m...x..##',
        '#.P...m......##',
        '#..s..#########',
        '#.....c...x..##',
        '#.....c......##',
        '####X##########',
        '#.............#',
        '#...E.........#',
        '###############',
      ],
    },

    // 115. A frozen lake in the dark. Take the flashlight, slide to the key, then slide to the door.
    {
      id: 'dark-ice',
      dark: true,
      map: [
        '###############',
        '#P.t..~~~~~~~.#',
        '#.....~~~#~~~.#',
        '#.....~~~~~~~.#',
        '#.....~#~~~~~.#',
        '#.....~~~~~~r.#',
        '#.....~~~~#~~.#',
        '#########R#####',
        '#########E#####',
        '###############',
      ],
    },

    // 116. Three gems around the pillars, and a chasing robot that wants to play tag.
    {
      id: 'gem-chaser',
      gemDoors: [3],
      map: [
        '###############',
        '#x.....#.....x#',
        '#..##.....##..#',
        '#.P...........#',
        '#..##.....##..#',
        '#x............#',
        '#######X#######',
        '#......E......#',
        '###############',
        '###############',
      ],
      obstacles: [
        { sprite: 'chaser', start: [12, 5], speed: 1.1, delay: 3 },
      ],
    },

    // 117. A laser glows in the dark. Turn the mirror to send it up into the crystal.
    {
      id: 'dark-mirror',
      dark: true,
      map: [
        '###############',
        '#######q#######',
        '#######.......#',
        '#######..t..P.#',
        '#######.......#',
        '#......W......#',
        '#######.......#',
        '##########=####',
        '#..........E..#',
        '###############',
      ],
      lasers: [
        { from: [0, 5], dir: 'right', always: true },
      ],
    },

    // 118. Gem islands: jump over on one, come back over the other.
    {
      id: 'gem-islands',
      gemDoors: [2],
      map: [
        '###############',
        '#.....____....#',
        '#.P..J_xJ_....#',
        '#.....____....#',
        '#.....____....#',
        '#....._Jx_J...#',
        '#.....____....#',
        '###X###########',
        '#..E..........#',
        '###############',
      ],
    },

    // 119. Press the timer and dash for the gem. There's another button inside to get back out.
    {
      id: 'gem-timer',
      timer: 14,
      gemDoors: [2],
      map: [
        '###############',
        '#......#......#',
        '#.P....D..x...#',
        '#......#......#',
        '#..d...#....d.#',
        '#......########',
        '#......X....E.#',
        '#.x....#......#',
        '###############',
        '###############',
      ],
    },

    // 120. Big level: three gems for the first door, then across the ice for two more.
    {
      id: 'gem-galaxy-finale',
      gemDoors: [3, 2],
      map: [
        '############################',
        '#.....#......#.~~~~~#......#',
        '#.P...#..x...#.~~~~x#..x...#',
        '#.....#......#.~~#~~#......#',
        '#............X.~~~~~.......#',
        '#.....#......#.~~~~~#......#',
        '###.######.############X####',
        '#.....#......########......#',
        '#.x...#...x..########....E.#',
        '#.....#......########......#',
        '#.....#......########......#',
        '############################',
      ],
      obstacles: [
        { sprite: 'robot', path: [[7, 9], [12, 9]], speed: 1.2 },
        { sprite: 'ufo', path: [[21, 4], [26, 4]], speed: 1.2, pause: 1.5 },
      ],
    },

    // ===== World 13: The Last Star =====

    // 121. A laser wall glowing in the dark. Push the crate down the tunnel into the beam and
    //      cross in its shadow.
    {
      id: 'dark-laser-crate',
      dark: true,
      map: [
        '###############',
        '#...####......#',
        '#.P.####......#',
        '#..tC.........#',
        '#...####......#',
        '#...####......#',
        '#...####....E.#',
        '###############',
        '###############',
        '###############',
      ],
      lasers: [
        { tiles: [[9, 1], [9, 2], [9, 3], [9, 4], [9, 5], [9, 6]], always: true },
      ],
    },

    // 122. Fruit for the alien who guards two gems, and a lever for the laser that guards the third.
    {
      id: 'gem-alien-lever',
      gemDoors: [3],
      map: [
        '###############',
        '#.....#..x..x.#',
        '#.P.f.a.......#',
        '#.....#########',
        '#.............#',
        '#..L........x.#',
        '#.............#',
        '###X###########',
        '#..E..........#',
        '###############',
      ],
      lasers: [
        { tiles: [[9, 4], [9, 5], [9, 6]], always: true, switch: true },
      ],
    },

    // 123. Three gems in the dark with a chasing robot. Its light shows where it is.
    {
      id: 'dark-chaser',
      dark: true,
      gemDoors: [3],
      map: [
        '###############',
        '#x...........x#',
        '#..##.....##..#',
        '#.P....t......#',
        '#..##.....##..#',
        '#......x......#',
        '#######X#######',
        '#......E......#',
        '###############',
        '###############',
      ],
      obstacles: [
        { sprite: 'chaser', start: [12, 5], speed: 1, delay: 4 },
      ],
    },

    // 124. Four gems, two black holes tugging at you, and a comet bouncing about.
    {
      id: 'gem-black-holes',
      gemDoors: [4],
      map: [
        '###############',
        '#.............#',
        '#.P..x..O..x..#',
        '#.............#',
        '#.............#',
        '#..x..O.....x.#',
        '#.............#',
        '#######X#######',
        '#......E......#',
        '###############',
      ],
      obstacles: [
        { sprite: 'comet', start: [10, 4], dir: [1, 1], speed: 2 },
      ],
    },

    // 125. The last star: dark, flashlight, a crate for the button gate, three gems for the first
    //      door, portals across, and two more gems for the door to the rocket.
    {
      id: 'last-star-125',
      dark: true,
      gemDoors: [3, 2],
      map: [
        '############################',
        '#.....#......#......#......#',
        '#.P...#..x...#..x...#...x..#',
        '#..t..#......#......#......#',
        '#.....=......X......#......#',
        '#.....#......#...1..#..2...#',
        '###C#.####.#############X###',
        '###+#.#......#......#......#',
        '#..#..#...x..#..2...#...E..#',
        '#.....#......#......#......#',
        '#.x...#......#..1...#......#',
        '############################',
      ],
      obstacles: [
        { sprite: 'robot', path: [[7, 3], [12, 3]], speed: 1.2 },
        { sprite: 'asteroid', path: [[21, 9], [26, 9]], speed: 1.2 },
      ],
    },
    // ===== World 14: Expeditions =====
    // Big levels with several jobs to do. Each wing off the hub hides one gem, and the rocket
    // waits behind a counting door. Green beacons are checkpoints.

    // 126. Three wings, three gems: slide across the frozen lake, feed the alien, and turn the
    //      mirror to light the crystal. Do them in any order.
    {
      id: 'expedition-1',
      gemDoors: [3],
      map: [
        '#############################################',
        '################...........##################',
        '################.f.........##################',
        '################...........ax################',
        '################...........##################',
        '################...........##################',
        '######################.######################',
        '###~~~~~~~~~.#########.######################',
        '###~~~~~~~~~.#########.######################',
        '###x~~~#~~~~.####...........#################',
        '###~~~~~~~~~.####.....S.....####....M......q#',
        '###~~~~~~~~~.####...........####...........##',
        '###~~~~~~~~~......S...P...S..........########',
        '###~~~~~#~~~.####...........####.....#.....##',
        '###~~~~~~~~~.####...........####.....#.....##',
        '###~~#~~~~~~.####...........####.....=..x..##',
        '###~~~~~~~~~.#########X#########.....#.....##',
        '###~~~~~~~~~.#########.#########.....#.....##',
        '####################.....####################',
        '####################.....####################',
        '####################..E..####################',
        '####################.....####################',
        '#############################################',
        '#############################################',
      ],
      obstacles: [
        { sprite: 'robot', path: [[16, 4], [26, 4]], speed: 1.2 },
      ],
      lasers: [
        { from: [36, 9], dir: 'down', always: true },
      ],
    },
  ];

  // Worlds: ten levels each, except where a size is given here. The last world takes what's left.
  const WORLD_SIZES = { 'The Last Star': 5 };
  G.Worlds = [];
  let start = 0;
  for (let n = 0; start < G.Levels.length; n++) {
    const name = G.WorldNames[n] || `World ${n + 1}`;
    const last = n >= G.WorldNames.length - 1;
    const size = last ? G.Levels.length - start : Math.min(WORLD_SIZES[name] || 10, G.Levels.length - start);
    G.Worlds.push({ name, start, size });
    start += size;
  }
  // Which world (index into Game.Worlds) a level belongs to.
  G.worldOf = i => {
    const n = G.Worlds.findIndex(w => i < w.start + w.size);
    return n < 0 ? G.Worlds.length - 1 : n;
  };
})(window.Game = window.Game || {});
