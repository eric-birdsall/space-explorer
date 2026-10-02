# Space Explorer

A gentle top-down puzzle game for small kids (about 4–5 years old). You play a little astronaut who explores a space station, collecting keys, opening doors, dodging asteroids and robots, and flying away in a rocket at the end of each level.

The game is designed for children who can't read yet:

- There's no text to read during play.
- There are no lives and no game over.
- Nothing can go permanently wrong.

Sounds, glowing goals and sparkle trails show the way.

## Playing

Double-click `index.html` to open it in any modern browser. There's nothing to install, no server, and no internet connection needed. Everything, including the pixel art and the music, is generated in code.

### Controls

| Key | What it does |
|---|---|
| Arrow keys | Move the astronaut (or pick a planet in the menu) |
| Enter / Space | Start the selected level in the menu |
| Esc | Back to the level menu |
| R | Restart the current level |
| M | Sound on or off |
| Shift + N | Skip the current level (a shortcut for parents) |

The on-screen buttons in the top-right corner do the same as some of these keys: 🏠 goes to the menu, 🔊 turns sound on or off, and ↻ restarts the level. The badge at the bottom shows the current level (for example "Level 7 / 50"); clicking it also opens the level menu, with the current level selected. You can also click a planet in the menu to start that level.

### Worlds and the level menu

The 50 levels are grouped into 5 worlds of 10, each with its own colors:

| Levels | World | Look |
|---|---|---|
| 1–10 | Space Station | Blue-gray metal |
| 11–20 | Moon Base | Gray |
| 21–30 | Mars Outpost | Red rock |
| 31–40 | Ice Comet | Icy blue |
| 41–50 | Nebula | Purple |

After the title screen, the menu shows one world per page, with one numbered planet per level.

- Arrow keys move between planets and flip to the next or previous world at the ends of a page. The ◀ ▶ arrows at the sides can be clicked to flip pages.
- Finished planets get a gold star, and progress is saved in the browser between visits.
- Finishing a level leads straight into the next one.

### Big levels

A few levels (27, 39, 45 and 50) are bigger than the screen. The camera follows the astronaut, and when the next goal is off screen, a pulsing yellow arrow at the edge points toward it.

### Helping without words

- **Glowing goal:** the next thing to do pulses gently. That might be a key, the door that key opens, a crate and its target, or the rocket.
- **Sparkle trail:** if 12 seconds pass without progress, a trail of sparkles leads to the next goal.
- **Instant hint:** bumping into a locked door, a force field, a closed gate, a timed door or a laser wall shows the trail straight away.
- **Soft failure:** touching an obstacle just gives a silly "boing" and a small bounce back, followed by a moment of safety.

## Things in the game

### Puzzle pieces

| Thing | How it works |
|---|---|
| 🔑 **Keys and doors** | Walk onto a key to pick it up, and it appears in the top-left corner. Walk into the door of the same color to open it. There are four colors: red, green, blue and yellow. |
| 📦 **Crates** | Walk into a crate to push it one tile. Crates can't be pulled. |
| 🟩 **Pads and force fields** | Push crates onto every teal pad to switch the force field off. It stays off for good. |
| 🔴 **Buttons and gates** | Striped gates are open only while something is on a button. The astronaut can stand on the button, but the gate closes again when they step off. A crate on the button keeps it open. |
| 🌀 **Teleporters** | Step into a swirling portal to pop out of the portal of the same color. |
| ➡️ **Conveyor belts** | Belts carry the astronaut along in the arrow's direction. They only go one way. |
| ⏱️ **Timer buttons and timed doors** | Stepping on a purple timer button opens the purple timed doors for a short while. Lights on the door and a sweeping clock hand on the button show the time left. The countdown ticks with every step, and more slowly while standing still. A crate parked on the button holds the doors open for good. |
| 🧊 **Ice** | Step onto ice and you slide until something stops you: a wall, a rock, a crate, a closed door, a laser wall or the edge of the ice. Keys on the ice are floor tiles, so sliding onto one stops you there. A crate pushed onto the ice doesn't slide, which makes it a handy stopper. |
| 🚀 **Rocket** | Reach the rocket to finish the level. |

### Obstacles

| Obstacle | Behavior |
|---|---|
| ☄️ **Asteroids** | Drift slowly back and forth in a straight line, spinning. |
| 🤖 **Robots** | Patrol back and forth along a set path. |
| 💗 **Chasing robots** | Pink robots that slowly follow the astronaut around. They can't go through doors, gates, crates, laser walls, belts or portals. After a bump they take a nap for a couple of seconds (with floating "z"s), so there's time to get away. |
| 🔺 **Laser gates** | Red beams that blink on and off in a steady rhythm. The emitters flash yellow just before the beam turns on. |
| 🟥 **Laser walls** | Beams that never switch off. They block the way like a wall. |
| 📦🔺 **Blocking a laser with a crate** | Push a crate into any beam and the beam stops at the crate. The tiles past it are safe to cross. Where you put the crate matters: its "shadow" has to cover the way through. |

Touching any obstacle is harmless. It bounces the astronaut back and gives about a second of safety.

### Getting stuck

In a couple of levels (Laser shadow and Ice crate) a crate can be pushed somewhere it can't come back from, such as a corner. The game notices when the level can no longer be finished. The restart button then pulses yellow, and pressing it (or **R**) starts the level fresh.

## Levels

**Space Station**

| # | Idea it teaches |
|---|---|
| 1 | Walk to the rocket |
| 2 | One key, one door |
| 3 | Two colors, and the red key unlocks the blue key's room |
| 4 | Three colors in a loop, with some back-and-forth |
| 5 | Dodge a drifting asteroid |
| 6 | Asteroid field: grab the key from among three drifting rocks |
| 7 | Keys and doors with two patrolling robots |
| 8 | Push a crate onto a pad to switch off a force field |
| 9 | Two crates, two pads |
| 10 | Keys, a crate and obstacles together |

**Moon Base**

| # | Idea it teaches |
|---|---|
| 11 | Laser gates: wait, then go |
| 12 | A laser wall: push a crate into the beam to block it |
| 13 | Blinking lasers in a doorway and across the key, plus a robot |
| 14 | Teleporters link rooms that have no doorway |
| 15 | Two portals from the start room, one to the key and one to its door |
| 16 | Conveyor belts ride through walls |
| 17 | Belt loop: four rooms joined only by one-way belts |
| 18 | A button holds the gate open only while something is on it, so push the crate onto it |
| 19 | First chasing robot |
| 20 | Moon finale: teleporter, laser, key, door, conveyor and button gate |

**Mars Outpost**

| # | Idea it teaches |
|---|---|
| 21 | Timer button: hurry through the timed door |
| 22 | Laser shadow: pick the right spot for the crate so its shadow covers the doorway *(dead ends possible)* |
| 23 | Crates can't teleport: park the crate on the button before taking the portal |
| 24 | Timer race: walking is too slow, but the belt is fast |
| 25 | The belts stop at the beam, so block it first, then ride |
| 26 | Keys and doors with a chasing robot |
| 27 | First big scrolling level: six rooms, four keys |
| 28 | Park the crate on the timer button to hold the door open |
| 29 | Mars challenge: laser wall, robot, portal, timed laser, door, belt and button gate |
| 30 | Mars finale: laser wall, chasing robot, key, timer button in a closet, timed door |

**Ice Comet**

| # | Idea it teaches |
|---|---|
| 31 | Ice: slide and zig-zag down to the rocket |
| 32 | Rocks stop you, so find the slide that lands on the key |
| 33 | Push the crate onto the ice to make a stopper *(dead ends possible)* |
| 34 | Slide to the key while asteroids drift across the lake |
| 35 | A belt throws you across the ice, and another brings you back |
| 36 | Portals in and out of an icy room |
| 37 | Block the laser wall, then slide through its shadow |
| 38 | Slide away from a chasing robot |
| 39 | Big ice level: two frozen lakes and a scrolling camera |
| 40 | Comet finale: rocky ice lake, asteroid and chasing robot |

**Nebula**

| # | Idea it teaches |
|---|---|
| 41 | Press the timer, then take the portal that lands by the timed door |
| 42 | Crate on the button to open the gate, then the key past a chasing robot |
| 43 | Three blinking laser walls across one room |
| 44 | Two laser walls and two crates: block one, cross, then block the next |
| 45 | Big level: key, laser wall, chasing robot, timer button and a portal dash |
| 46 | Walking to the timed door is too slow, but the ice is fast |
| 47 | Blinking lasers and a chasing robot |
| 48 | Three belts to three rooms: explore them in the right order |
| 49 | A hub with four portals and a chasing robot |
| 50 | Grand voyage: everything in one big level |

## Making levels

Levels live in [`js/levels.js`](js/levels.js). Each level is a text map, usually 15 × 10 (one screen). Maps can be any bigger size, and then they scroll.

```
#  wall              .  floor            P  player start      E  rocket (exit)
r g b y  keys        R G B Y  doors      C  crate             o  pad
F  force field       +  button           =  gate
d  timer button      D  timed door       ~  ice
1-9  teleporters (two tiles with the same digit are linked)
> < ^ v  conveyor belts
```

Moving obstacles and lasers are listed next to the map:

```js
obstacles: [
  { sprite: 'asteroid', path: [[7, 1], [7, 8]], speed: 1.6 },   // tiles per second
  { sprite: 'robot',    path: [[5, 7], [12, 7]], speed: 1.3 },
  { sprite: 'chaser',   start: [13, 1], speed: 1.1, delay: 2.5 },  // follows the player
],
lasers: [
  { tiles: [[4, 3], [4, 4], [4, 5]], period: 3, on: 1.3, offset: 0 },  // blinking, in seconds
  { tiles: [[9, 2], [9, 3], [9, 4], [9, 5]], always: true },           // always on
],
```

A beam shines from its first tile along the rest, so list the tiles starting from the emitter end. A crate in the beam cuts it off at that point.

A few optional level settings:

| Setting | Meaning |
|---|---|
| `timer: 8` | How many moves a timed door stays open after its button is pressed (default 10) |
| `holdTimer: true` | Hint: the level needs a crate parked on a timer button |
| `crateSpots: [[8, 4]]` | Hint: where a crate should be pushed, for example to make a stopper on ice |

Each level also has an `id`. Saved progress is stored by id, so levels can be inserted or reordered without mixing up which planets have stars. Every 10 levels in the list form a world. The world names are in `Game.WorldNames`, and the colors are in `THEMES` in [`js/sprites.js`](js/sprites.js).

Walls that are completely surrounded by other walls are drawn as open space with twinkling stars.

### Checking levels

Open [`tools/check-levels.html`](tools/check-levels.html) in a browser after editing levels. For every level, it checks that:

- the level can be finished using the real game rules
- there are no **dead ends**, meaning positions (such as a crate pushed into a corner) from which the rocket can no longer be reached without restarting

Dead ends are fine in a harder level on purpose, because the restart button pulses when they happen, but early levels should have none. Moving obstacles and blinking lasers are ignored by this check, because they only delay the player. Laser walls are included, because they really do block the way.

## Project layout

```
index.html              page and script loading (plain scripts, so it works from file://)
css/style.css           full-window layout and pixel-perfect scaling
js/sprites.js           16×16 pixel-art sprites defined as text grids
js/audio.js             sound effects and background music, synthesized with WebAudio
js/input.js             arrow-key handling (holding and quick taps)
js/levels.js            level maps, obstacles and lasers
js/rules.js             game rules, path-finding for hints, level solver
js/game.js              game state, animation, collisions, menu and screens
js/render.js            all drawing: tiles, entities, effects, HUD and menus
js/main.js              startup, key and click handling, frame loop
tools/check-levels.html level solvability and dead-end checker
```

## Future ideas

### Obstacles and mechanics

- **Spinning arms:** a bar that rotates around a center tile like a clock hand. It's predictable, and it teaches timing.
- **Switch-toggled danger:** a big lever that turns lasers or robots off, which gives the child control over the obstacles.
- **Crumbly floor:** a tile that cracks after one step, so there's no going back. Use it lightly, because it can create dead ends.
- **Collectible stars:** optional stars placed near obstacles, as a bonus for braver kids. They'd be counted on the menu planets and would never be required.
- **Colored teleporters as keys:** portals that only work while carrying a key of the matching color.
- **Friendly aliens:** characters that block a corridor until you bring them something, such as a star or a key.

### Level ideas

- **Sliding crates:** crates that slide on ice like the astronaut does, for proper ice puzzles.
- **Portal hop:** several teleporter pairs in a chain, which teaches color matching.
- **Laser rhythm corridor:** lasers timed so that walking at a steady pace gets through without stopping.
- **Robot dance:** robots patrolling in a pattern with a safe path that opens and closes.
- **Button relay:** a crate that has to be moved from one button to another, opening different gates along the way.
- **More worlds:** a sixth world (for example a jungle planet or a space zoo) with a new theme and a new mechanic.
