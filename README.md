# Space Explorer

A gentle top-down puzzle game for small kids (about 4–5 years old). You play a little astronaut who explores fourteen worlds, collecting keys, opening doors, pushing crates, dodging asteroids and robots, and flying away in a rocket at the end of each level.

**Play it here: https://eric-birdsall.github.io/space-explorer/**

The game is designed for children who can't read yet:

- There's no text to read during play.
- There are no lives and no game over.
- Nothing can go permanently wrong.

Sounds, glowing goals and sparkle trails show the way.

## Playing

There are three ways to play. Everything, including the pixel art and the music, is generated in code, so there is nothing to install.

- **On a computer, online:** open the link above in any modern browser.
- **On a computer, offline:** download this folder and double-click `index.html`. No server or internet connection is needed.
- **On a tablet or phone:** see the next section.

### Tablets and phones

Open the link above on the device, then add it to the home screen:

- **iPad / iPhone:** in Safari, tap Share, then **Add to Home Screen**.
- **Android:** in Chrome, tap the three-dot menu, then **Add to Home screen** (or **Install app**).

Launched from its home-screen icon, the game runs full screen and works offline after the first visit. New versions are picked up automatically the next time it is opened with a connection.

On touch screens the game shows its own controls:

- **Arrow pad:** hold an arrow to keep walking. A thumb can slide from one arrow to the next without lifting. The game shrinks a little so the pad never covers the level: it sits on the right in landscape and below the game in portrait.
- **Round yellow button:** shows ▶ on the title, menu and win screens. Next to a mirror it becomes a ↻ "turn" button.
- Everything else is tapped directly: planets in the menu, the level badge, and the buttons in the top-right corner.

Progress is saved separately on each device. If there is no sound on an iPad, check its silent mode and volume.

### Keyboard controls

| Key | What it does |
|---|---|
| Arrow keys | Move the astronaut (or pick a planet in the menu) |
| Space | Turn the mirror next to the astronaut |
| Enter / Space | Start the selected level in the menu |
| Esc | Back to the level menu |
| R | Restart the current level (in an expedition: back to the last checkpoint) |
| Shift + R | Restart an expedition from the very beginning (a shortcut for parents) |
| M | Sound on or off |
| Shift + N | Skip the current level (a shortcut for parents) |

The on-screen buttons in the top-right corner do the same as some of these keys: 🏠 goes to the menu, 🔊 turns sound on or off, and ↻ restarts the level. The badge at the bottom shows the current level (for example "Level 7 / 126"); clicking it also opens the level menu, with the current level selected. You can also click a planet in the menu to start that level.

### Worlds and the level menu

The 126 levels are grouped into worlds, mostly of 10, each with its own colors:

| Levels | World | Look |
|---|---|---|
| 1–10 | Space Station | Blue-gray metal |
| 11–20 | Moon Base | Gray |
| 21–30 | Mars Outpost | Red rock |
| 31–40 | Asteroid Mine | Brown rock |
| 41–50 | Ice Comet | Icy blue |
| 51–60 | Nebula | Purple |
| 61–70 | Jungle Planet | Green |
| 71–80 | Crystal Caves | Pink |
| 81–90 | Sun Station | Gold |
| 91–100 | Black Hole Rim | Dark teal |
| 101–110 | Dark Moon | Dark slate with yellow rivets |
| 111–120 | Gem Galaxy | Deep blue |
| 121–125 | The Last Star | Silver |
| 126 | Expeditions | Mint green |

After the title screen, the menu shows one world per page, with one numbered planet per level.

- Arrow keys move between planets and flip to the next or previous world at the ends of a page. The ◀ ▶ arrows at the sides can be clicked to flip pages.
- Finished planets get a gold star, and progress is saved in the browser between visits.
- Finishing a level leads straight into the next one.

### Big levels

Twelve levels (36, 49, 58, 69, 79, 89, 98, 100, 110, 120, 125 and 126) are bigger than the screen. The camera follows the astronaut, and when the next goal is off screen, a pulsing yellow arrow at the edge points toward it.

### Expeditions and checkpoints

Expeditions are much bigger levels, about five minutes long, with several jobs to do. A hub room has a wing on each side. Each wing is a short puzzle that hides one gem, the wings can be done in any order, and the rocket waits behind a counting door that wants all the gems.

Because a big level is a lot to lose, expeditions have **checkpoint beacons**: little lamp posts that turn green when the astronaut walks over them.

- The restart button (or **R**) goes back to the last beacon touched, with everything collected so far.
- Leaving the level, or closing the game, and coming back later also resumes from that beacon.
- A beacon never saves a position the level can't be finished from.
- **Shift + R** starts the expedition again from the very beginning.

### Helping without words

- **Glowing goal:** the next thing to do pulses gently. That might be a key, the door that key opens, a crate and its target, or the rocket.
- **Sparkle trail:** if 12 seconds pass without progress, a trail of sparkles leads to the next goal.
- **Instant hint:** bumping into a locked door, a force field, a closed gate, a timed door or a laser wall shows the trail straight away.
- **Soft failure:** touching an obstacle just gives a silly "boing" and a small bounce back, followed by a moment of safety.
- **Mirror prompt:** a little space bar (or the yellow ↻ button on touch screens) bobs above the astronaut whenever a mirror can be turned.
- **Counting dots:** a counting door shows one dot for each gem it wants. The dots fill in as gems are collected, and each gem chimes one note higher than the last.
- **Jump arcs:** a dotted arc shows where each jump pad will land you.

## Things in the game

### Puzzle pieces

| Thing | How it works |
|---|---|
| 🔑 **Keys and doors** | Walk onto a key to pick it up, and it appears in the top-left corner. Walk into the door of the same color to open it. There are four colors: red, green, blue and yellow. |
| 💎 **Gems and counting doors** | A counting door shows dots, like a dice. Collect that many gems and walk into the door to open it. The gems are used up. |
| 📦 **Crates** | Walk into a crate to push it one tile. Crates can't be pulled. |
| 🟦 **Slippery crates** | Blue crates that slide across ice until something stops them. On ordinary floor they move one tile, like a normal crate. |
| 🟩 **Pads and force fields** | Push crates onto every teal pad to switch the force field off. It stays off for good. |
| 🔴 **Buttons and gates** | Striped gates are open only while something is on a button. The astronaut can stand on the button, but the gate closes again when they step off. A crate on the button keeps it open. |
| 🌀 **Teleporters** | Step into a swirling portal to pop out of the portal of the same color. |
| ➡️ **Conveyor belts** | Belts carry the astronaut along in the arrow's direction. They only go one way. |
| ⬆️ **One-way arrows** | Floor arrows that can only be walked over in the direction they point. |
| ⏱️ **Timer buttons and timed doors** | Stepping on a purple timer button opens the purple timed doors for a short while. Lights on the door and a sweeping clock hand on the button show the time left. The countdown ticks with every step, and more slowly while standing still. A crate parked on the button holds the doors open for good. |
| 🧊 **Ice** | Step onto ice and you slide until something stops you: a wall, a rock, a crate, a closed door, a laser wall or the edge of the ice. Keys on the ice are floor tiles, so sliding onto one stops you there. An ordinary crate pushed onto the ice doesn't slide, which makes it a handy stopper. |
| 🦘 **Jump pads and holes** | Step on a jump pad and it flips up and launches the astronaut over the next tile. Holes can't be walked into, but a crate pushed into a hole fills it and makes a floor. |
| 🧱 **Crumbly floor** | Cracks when stepped on and falls away after the astronaut steps off, leaving a hole. There is no going back the same way. |
| 🎨 **Color switch and blocks** | Pink and blue blocks take turns being raised. Stepping on the color switch swaps which color is up. Raised blocks are walls; lowered ones are floor. |
| 🕹️ **Big lever** | Step on it to switch off the lasers and put to sleep the robots that are wired to it. In some levels it also reverses the conveyor belts. |
| 🪞 **Mirrors and crystals** | A laser bounces off mirrors. Stand next to a mirror and press Space (or the ↻ button) to turn it. When the beam reaches a crystal, the crystal lights up and opens the gates. |
| 👽 **Friendly aliens and space fruit** | An alien blocks a corridor until it is brought a space fruit. Then it hops aside, happy. |
| 🪖 **Shield helmet** | Gives a bubble shield for 8 seconds. With it, the astronaut walks straight through moving obstacles. |
| 🌑 **Dark levels** | Only a small circle around the astronaut is lit. The next goal still glows through the dark, and so do moving obstacles and laser beams, so nothing is a nasty surprise. |
| 🔦 **Flashlight** | Picking it up makes the lit circle in a dark level much bigger. |
| 🚀 **Rocket** | Reach the rocket to finish the level. |

### Obstacles

| Obstacle | Behavior |
|---|---|
| ☄️ **Asteroids** | Drift slowly back and forth in a straight line, spinning. |
| 🤖 **Robots** | Patrol back and forth along a set path. |
| 🛸 **UFOs** | Float along a path and park at each end for a couple of seconds, often in a doorway. |
| 💗 **Chasing robots** | Pink robots that slowly follow the astronaut around. They can't go through doors, gates, crates or laser walls, and they never step onto belts or portals. After a bump they take a nap for a couple of seconds (with floating "z"s), so there's time to get away. |
| 🕐 **Spinning arms** | A bar that turns around a center tile like a clock hand. Slip past when it points the other way. |
| 💫 **Comets** | Bounce diagonally off the walls. |
| 🕳️ **Black holes** | Can't be entered. Walking two tiles away from one tugs the astronaut one tile closer. It can't swallow anyone. |
| 🔺 **Laser gates** | Red beams that blink on and off in a steady rhythm. The emitters flash yellow just before the beam turns on. |
| 🟥 **Laser walls** | Beams that never switch off. They block the way like a wall. |
| 📦🔺 **Blocking a laser with a crate** | Push a crate into any beam and the beam stops at the crate. The tiles past it are safe to cross. Where you put the crate matters: its "shadow" has to cover the way through. |

Touching any moving obstacle is harmless. It bounces the astronaut back and gives about a second of safety.

### Getting stuck

In some of the harder levels a move can't be taken back: a crate pushed into a corner, or a crumbly bridge crossed too early. The game notices when the level can no longer be finished. The restart button then pulses yellow, and pressing it (or **R**) starts the level fresh.

The levels where this can happen are 29, 34, 43, 71, 73, 74, 76, 77, 78, 80, 93 and 99.

## Levels

**1–10: Space Station**

| # | Idea it teaches |
|---|---|
| 1 | Walk to the rocket |
| 2 | One key, one door |
| 3 | Jump pads: hop over a hole |
| 4 | Two colors, and the red key unlocks the blue key's room |
| 5 | Three colors in a loop, with some back-and-forth |
| 6 | Dodge a drifting asteroid |
| 7 | One-way arrows: go around the loop |
| 8 | Asteroid field: grab the key from among three drifting rocks |
| 9 | Keys and doors with two patrolling robots |
| 10 | Push a crate onto a pad to switch off a force field |

**11–20: Moon Base**

| # | Idea it teaches |
|---|---|
| 11 | Two crates, two pads |
| 12 | Keys, a crate and obstacles together |
| 13 | Laser gates: wait, then go |
| 14 | Big lever: switch off the laser wall and put the robot to sleep |
| 15 | A laser wall: push a crate into the beam to block it |
| 16 | Blinking lasers in a doorway and across the key, plus a robot |
| 17 | A spinning arm sweeps the corridor |
| 18 | Teleporters link rooms that have no doorway |
| 19 | Two portals from the start room, one to the key and one to its door |
| 20 | A friendly alien blocks the way until it gets a space fruit |

**21–30: Mars Outpost**

| # | Idea it teaches |
|---|---|
| 21 | Conveyor belts ride through walls |
| 22 | Belt loop: four rooms joined only by one-way belts |
| 23 | A button holds the gate open only while something is on it, so push the crate onto it |
| 24 | Color switch: swap which blocks are up |
| 25 | First chasing robot |
| 26 | Teleporter, laser, key, door, conveyor and button gate |
| 27 | A comet bounces around the room |
| 28 | Timer button: hurry through the timed door |
| 29 | Laser shadow: pick the right spot for the crate so its shadow covers the doorway |
| 30 | A UFO parks in the doorway: wait for it to float off |

**31–40: Asteroid Mine**

| # | Idea it teaches |
|---|---|
| 31 | Crates can't teleport: park the crate on the button before taking the portal |
| 32 | Timer race: walking is too slow, but the belt is fast |
| 33 | The belts stop at the beam, so block it first, then ride |
| 34 | Crumbly bridges: cross on one, come back on the other |
| 35 | Keys and doors with a chasing robot |
| 36 | First big scrolling level: six rooms, four keys |
| 37 | Park the crate on the timer button to hold the door open |
| 38 | Shield helmet: walk straight through the robots |
| 39 | Challenge: laser wall, robot, portal, timed laser, door, belt and button gate |
| 40 | Finale: laser wall, chasing robot, key, timer button in a closet, timed door |

**41–50: Ice Comet**

| # | Idea it teaches |
|---|---|
| 41 | Ice: slide and zig-zag down to the rocket |
| 42 | Rocks stop you, so find the slide that lands on the key |
| 43 | Push the crate onto the ice to make a stopper |
| 44 | A slippery crate slides across the ice to the button |
| 45 | Slide to the key while asteroids drift across the lake |
| 46 | A belt throws you across the ice, and another brings you back |
| 47 | Portals in and out of an icy room |
| 48 | Block the laser wall, then slide through its shadow |
| 49 | Big ice level: two frozen lakes and a scrolling camera |
| 50 | Finale: rocky ice lake, asteroid and chasing robot |

**51–60: Nebula**

| # | Idea it teaches |
|---|---|
| 51 | Slide away from a chasing robot |
| 52 | A black hole tugs you closer: just go around |
| 53 | Press the timer, then take the portal that lands by the timed door |
| 54 | Crate on the button to open the gate, then the key past a chasing robot |
| 55 | Turn a mirror to bounce the laser into the crystal |
| 56 | Three blinking laser walls across one room |
| 57 | Two laser walls and two crates: block one, cross, then block the next |
| 58 | Big level: key, laser wall, chasing robot, timer button and a portal dash |
| 59 | Walking to the timed door is too slow, but the ice is fast |
| 60 | Blinking lasers and a chasing robot |

**61–70: Jungle Planet**

| # | Idea it teaches |
|---|---|
| 61 | Three belts to three rooms: explore them in the right order |
| 62 | A hub with four portals and a chasing robot |
| 63 | Island hopping on jump pads, with an asteroid drifting past |
| 64 | Pull the lever to put the robots to sleep before riding the belt into their room |
| 65 | Two spinning arms turning opposite ways |
| 66 | Two hungry aliens and two fruits: feed them in the right order |
| 67 | A maze of one-way arrows |
| 68 | Jump the chasm both ways while two comets bounce around |
| 69 | Grand voyage: keys, ice, belt, laser wall, portal, timer dash and robots in one big level |
| 70 | Lever, jump pads, fruit for the alien and a spinning arm |

**71–80: Crystal Caves**

| # | Idea it teaches |
|---|---|
| 71 | Turn two mirrors so the laser zig-zags into the crystal |
| 72 | Two color switches: swap the walls to reach the key, then swap back |
| 73 | Crumbly bridges between four islands: get the key before crossing to the rocket |
| 74 | Block one laser with a crate, then turn the mirror to light the crystal with the other |
| 75 | An icy lake where color blocks become stoppers when they rise |
| 76 | Spring across a deep crack for the key, then come back over the crumbly stepping stone |
| 77 | Four mirrors, one crystal: turn the right ones |
| 78 | Color switch, then a mirror to light the crystal |
| 79 | Big cave: flip the color walls both ways, then cross the crumbly bridge |
| 80 | Fruit for the alien, a color wall, a mirror and crumbly floor |

**81–90: Sun Station**

| # | Idea it teaches |
|---|---|
| 81 | Two UFOs park in two doorways: time the dash between them |
| 82 | Two comets bounce around a room with pillars |
| 83 | Slide two slippery crates across the ice onto the pads |
| 84 | Press the timer, grab the helmet and charge through the robots |
| 85 | The belts only go one way: pull a lever to reverse them and ride back |
| 86 | Slide across a rocky lake while a comet bounces overhead |
| 87 | Portals between three rooms, with UFOs drifting through |
| 88 | Slide the slippery crate into the laser wall to block it |
| 89 | Big level: timer dash, helmet, a long belt, a comet, a UFO and a robot |
| 90 | Slippery crate, timer door, lever for the UFO, then the force field |

**91–100: Black Hole Rim**

| # | Idea it teaches |
|---|---|
| 91 | Three black holes tug at you as you cross the room |
| 92 | Sliding on ice past a black hole: the pull can stop you where you want |
| 93 | Turn the mirror while dodging the pull of the black holes |
| 94 | Two aliens, two fruits, and black holes tugging you off course |
| 95 | Crumbly crossings and a black hole near the key |
| 96 | Comets bounce between two black holes |
| 97 | Color switch, lever and a spinning arm |
| 98 | Big level: black holes, a fruit for the alien, an icy lake and a chasing robot |
| 99 | Jump pad, timer door, color wall and a mirror to the crystal gate |
| 100 | Grand finale: nearly everything in one big level |

**101–110: Dark Moon**

| # | Idea it teaches |
|---|---|
| 101 | Gems: the door shows two dots, so bring it two gems |
| 102 | Three dots, three gems in three corners |
| 103 | Two counting doors: first two gems, then three |
| 104 | Four gems but the door only wants three: leave the one the robot guards |
| 105 | Lights out: follow the glow to the rocket |
| 106 | Pick up the flashlight, then find the key in a dark maze |
| 107 | Three gems hidden in the dark |
| 108 | Gems on the ice: a gem stops your slide |
| 109 | Four gems in the dark, with a robot and an asteroid about |
| 110 | Big dark level: flashlight, two counting doors and a red key |

**111–120: Gem Galaxy**

| # | Idea it teaches |
|---|---|
| 111 | A gem behind a gate: push the crate down its slot onto the button |
| 112 | Three gems in three closed rooms, reached only by portals |
| 113 | Ride one belt to the far gem and another back, past an asteroid |
| 114 | One gem behind the pink wall, one behind the blue: the switch swaps them |
| 115 | A frozen lake in the dark: flashlight, slide to the key, slide to the door |
| 116 | Three gems around the pillars with a chasing robot |
| 117 | A laser glowing in the dark: turn the mirror to light the crystal |
| 118 | Gem islands: jump over on one, come back over the other |
| 119 | Press the timer and dash for the gem; a second button inside lets you back out |
| 120 | Big level: three gems for the first door, then across the ice for two more |

**121–125: The Last Star**

| # | Idea it teaches |
|---|---|
| 121 | A laser wall in the dark: push the crate down the tunnel into the beam |
| 122 | Fruit for the alien who guards two gems, and a lever for the laser guarding the third |
| 123 | Three gems in the dark with a chasing robot |
| 124 | Four gems, two black holes and a bouncing comet |
| 125 | The last star: dark, flashlight, crate and gate, portals and two counting doors |

**126: Expeditions**

| # | Idea it teaches |
|---|---|
| 126 | Three wings, three gems: slide across a frozen lake, feed an alien, and turn a mirror to light a crystal |

## Making levels

Levels live in [`js/levels.js`](js/levels.js). Each level is a text map, usually 15 × 10 (one screen). Maps can be any bigger size, and then they scroll.

```
#  wall              .  floor            P  player start      E  rocket (exit)
r g b y  keys        R G B Y  doors      C  crate             I  slippery crate
o  pad               F  force field      +  button            =  gate
d  timer button      D  timed door       ~  ice
1-9  teleporters (two tiles with the same digit are linked)
> < ^ v  conveyor belts                  } { A V  one-way arrows (right, left, up, down)
J  jump pad          _  hole             *  crumbly floor
s  color switch      m  pink block       c  blue block (pink starts raised)
L  big lever         M W  mirrors ( / and \ )                 q  crystal
a  friendly alien    f  space fruit      h  shield helmet     O  black hole
x  gem               X  counting door    t  flashlight        S  checkpoint beacon
```

Moving obstacles and lasers are listed next to the map:

```js
obstacles: [
  { sprite: 'asteroid', path: [[7, 1], [7, 8]], speed: 1.6 },          // tiles per second
  { sprite: 'robot',    path: [[5, 7], [12, 7]], speed: 1.3 },
  { sprite: 'ufo',      path: [[7, 4], [7, 1]], speed: 1.2, pause: 2.5 }, // parks at each end
  { sprite: 'chaser',   start: [13, 1], speed: 1.1, delay: 2.5 },      // follows the player
  { sprite: 'arm',      center: [7, 4], length: 1.4, speed: 0.9 },     // negative speed turns the other way
  { sprite: 'comet',    start: [6, 4], dir: [1, 1], speed: 2.2 },      // bounces off walls
],
lasers: [
  { tiles: [[4, 3], [4, 4], [4, 5]], period: 3, on: 1.3, offset: 0 },  // blinking, in seconds
  { tiles: [[9, 2], [9, 3], [9, 4], [9, 5]], always: true },           // always on
  { from: [0, 5], dir: 'right', always: true },                        // bounces off mirrors
],
```

A beam listed with `tiles` shines from its first tile along the rest, so list the tiles starting from the emitter end. A beam listed with `from` and `dir` starts at an emitter and travels until it hits something, turning at mirrors. A crate in either kind of beam cuts it off at that point.

Add `switch: true` to an obstacle or a laser to wire it to the big lever: pulling the lever switches it off.

A few optional level settings:

| Setting | Meaning |
|---|---|
| `timer: 8` | How many moves a timed door stays open after its button is pressed (default 10) |
| `holdTimer: true` | Hint: the level needs a crate parked on a timer button |
| `crateSpots: [[8, 4]]` | Hint: where a crate should be pushed, for example to make a stopper on ice |
| `leverReversesBelts: true` | The big lever also reverses every conveyor belt |
| `gemDoors: [2, 3]` | How many gems each counting door (`X`) wants, in reading order: left to right, top to bottom (default 1) |
| `dark: true` | A dark level: only the area around the astronaut is lit |

Each level also has an `id`. Saved progress is stored by id, so levels can be inserted or reordered without mixing up which planets have stars. Every 10 levels in the list form a world, except for the sizes listed in `WORLD_SIZES` at the bottom of the file; the last world takes whatever levels are left. The world names are in `Game.WorldNames`, and the colors are in `THEMES` in [`js/sprites.js`](js/sprites.js).

Walls that are completely surrounded by other walls are drawn as open space with twinkling stars.

### Checking levels

Open [`tools/check-levels.html`](tools/check-levels.html) in a browser after editing levels. For every level, it checks that:

- the level can be finished using the real game rules
- how many **dead ends** it has, meaning positions (such as a crate pushed into a corner) from which the rocket can no longer be reached without restarting

Dead ends are fine in a harder level on purpose, because the restart button pulses when they happen, but early levels should have none. Moving obstacles and blinking lasers are ignored by this check, because they only delay the player. Laser walls are included, because they really do block the way.

## Project layout

```
index.html              page and script loading (plain scripts, so it works from file://)
css/style.css           full-window layout, pixel-perfect scaling and the touch-screen layout
js/sprites.js           16×16 pixel-art sprites defined as text grids
js/audio.js             sound effects and synthwave background music, synthesized with WebAudio
js/input.js             arrow-key handling (holding and quick taps), shared with the touch pad
js/levels.js            level maps, obstacles and lasers
js/rules.js             game rules, path-finding for hints, level solver
js/game.js              game state, animation, collisions, menu and screens
js/render.js            all drawing: tiles, entities, effects, HUD and menus
js/main.js              startup, key and click handling, frame loop
js/touch.js             on-screen arrow pad and action button for tablets and phones
manifest.webmanifest    name, icon and full-screen settings for the home-screen app
sw.js                   service worker: saves a copy of the game so it works offline
icons/                  home-screen icons
tools/check-levels.html level solvability and dead-end checker
```

When adding a new file to the game, also add it to the `FILES` list in [`sw.js`](sw.js) so it is saved for offline play.

The site is published with GitHub Pages from the `main` branch, so pushing to `main` updates the live game within a minute or so.

## Future ideas

- **Undo button:** step back one move instead of restarting the whole level after a bad crate push.
- **Spoken tips:** a short voice line the first time each new thing appears, for players who can't read yet.
- **"Show me" help:** when a player is stuck for a long time, the astronaut walks the next few steps as a demonstration.
- **Pick your explorer:** a choice of characters on the title screen, perhaps unlocked one per finished world.
- **Level builder:** paint a level with the existing pieces, with a check that it can be solved before saving.
- **Colored teleporters as keys:** portals that only work while carrying a key of the matching color.
- **Laser rhythm corridor:** lasers timed so that walking at a steady pace gets through without stopping.
- **Button relay:** a crate that has to be moved from one button to another, opening different gates along the way.
