# Raiders of the Lost Dungeon

A procedurally-generated neon roguelike dungeon crawler, built as a lite (3-level) prototype
on Neon Spawn Point before deciding whether to take it further as a standalone/Steam release.

Play it at `/raiders.html` (linked from the Arcade page as "Raiders of the Lost Dungeon").

## Why it's built this way

No frameworks, no build step, no bundler — same approach as the Pac-Man clone already on the
site. Everything is plain ES modules loaded directly by the browser, and nothing is downloaded
from a CDN, so the game requires zero installs to play. That also means the whole `games/raiders/`
folder is self-contained and portable: if this prototype proves out, it can be dropped into an
Electron/NW.js shell largely as-is for a standalone build (e.g. for Steam) without a rewrite.

## Folder layout

```
raiders.html              Site-chrome wrapper page: canvas + title/HUD/quiz/end-screen overlays
games/raiders/
  js/
    config.js              Shared constants (tile size, dungeon size, colors, level count,
                             spell tuning, shop inventory)
    main.js                 Game class — boots everything, owns the game loop and state machine
    engine/
      loop.js                requestAnimationFrame loop
      input.js                Keyboard state (arrows / WASD / Space), single-press edge detection
      renderer.js              Canvas draw helpers + camera
      assets.js                Image loader; falls back to generated neon placeholder art
                                 for any sprite that isn't in assets/ yet
    world/
      tile.js                  Tile grid data structure
      dungeon.js                Procedural room+corridor generator (rooms, chest, exit, loot,
                                  shop, enemy spawns)
    entities/
      entity.js                 Base class: grid position, smooth tile-to-tile glide, render
      player.js
      enemy.js                   Grunt/brute types, line-of-sight chase AI
    systems/
      fov.js                     Fog of war (radius + line-of-sight)
      combat.js                  Bump-to-attack resolution, particle hooks
      particles.js                Small burst particle system for hit feedback + spell trails
      quiz.js                     Loads a question bank, hands out non-repeating questions
    save/
      saveManager.js              localStorage read/write (see "Save system" below)
    ui/
      ui.js                       All DOM overlay logic (DM intro, title, HUD, shop, quiz, end)
    data/
      questions-grade5.json       STEM trivia bank, ~10-11 year olds
      questions-highschool.json   STEM trivia bank, grades 9-12 / ages 15+
  assets/                    Curated, renamed assets actually loaded by the game
    sprites/                   player.png, enemy_grunt.png, enemy_brute.png, shopkeeper.png
    tiles/                      floor.png, wall.png
    ui/                          chest_closed.png, chest_open.png, exit_portal.png,
                                   loot_gem.png, spell_bolt.png, loading_screen.png
    audio/                      (not wired up yet)
  assets-inbox/              Drop raw asset packs here — nothing in here is read by the game
```

## Adding your art

1. Drop whatever you've got (sprite sheets, tilesets, zips, individual PNGs — doesn't matter)
   into `games/raiders/assets-inbox/`.
2. Tell me what's in there and I'll pick, rename, and slice/resize what's needed into
   `games/raiders/assets/` using the filenames the loader expects (see the manifest at the top
   of `js/engine/assets.js`).
3. Nothing else needs to change — `AssetLoader` swaps a placeholder for the real image the
   moment a matching file exists at that path. If a file is missing, the game keeps working
   with the drawn placeholder instead of breaking.

Currently expected filenames: `sprites/player.png`, `sprites/enemy_grunt.png`,
`sprites/enemy_brute.png`, `sprites/shopkeeper.png`, `tiles/floor.png`, `tiles/wall.png`,
`ui/chest_closed.png`, `ui/chest_open.png`, `ui/exit_portal.png`, `ui/loot_gem.png`,
`ui/spell_bolt.png` — all 48×48 (or a multiple of it — `TILE_SIZE` in `config.js`).

`ui/loading_screen.png` is the one exception: it's a full illustrated background for the
Dungeon Master intro screen (not part of `AssetLoader`'s canvas-sprite manifest — it's a plain
CSS background on `#dm-screen` in `raiders.html`). It's shown with `background-size: contain`
so the whole image is always visible letterboxed, never cropped — safe for any wide illustration
with important content (a title lockup, a quote) near the edges. Roughly 16:9-ish landscape,
1200px+ wide, works well; the game frame itself is 1200×864.

## STEM riddle chests

Each of the 3 levels has one locked chest at the far end of the map. Walking into it opens a
riddle drawn from `data/questions-grade5.json` or `data/questions-highschool.json`, chosen by
which age mode the player picked on the title screen. The player gets `MAX_QUIZ_TRIES` (3)
guesses — wrong answers are eliminated and a pip countdown shows tries left. A correct guess
unlocks the chest and exit portal; running out of tries fails the run (see "Game over" below).

To add more questions, just add entries to either JSON file — same shape as the existing ones
(`category`, `question`, `choices`, `answer` as a 0-based index).

## Shop

Each level also spawns a shopkeeper in a room away from the enemies. Walking into them opens a
shop (pauses the game, like the riddle chest) selling from `SHOP_ITEMS` in `config.js` — a heal,
a permanent +1 max HP, and a permanent +1 attack, priced in loot. It's the sink that gives loot
actual in-run value beyond just being a stat to win or lose.

## Spell

Space casts a ranged bolt (`SPELL_DAMAGE` to the nearest visible enemy within `SPELL_RANGE`
tiles, `SPELL_COOLDOWN` seconds between casts — all in `config.js`). Currently rendered with the
particle system (a traveling trail + impact burst); `ui/spell_bolt.png` is reserved for when a
real animated spell-effect sprite sheet is dropped in, at which point this can be upgraded from
a particle effect to a proper animation.

## Game over

Both running out of riddle tries and dying in combat land on the same Dungeon-Master-flavored
game over screen with a real choice: **Try Again** (keeps your loot for the next attempt) or
**Go to Town** (forfeits all loot, back to the title screen). This is what gives the loot economy
stakes.

## Save system

`save/saveManager.js` is a fully working localStorage read/write module, and `main.js` calls
`save()` at every level-complete and game-over checkpoint — but there's intentionally no
"Continue" option on the title screen yet. Every run currently starts fresh. The framework is
there so turning on persistence later (e.g. resuming a run, unlocking a difficulty) is a UI
change, not a data-model change.

## Roadmap ideas (not built yet)

- Real art (see "Adding your art" above)
- Sound effects / music (`assets/audio/` is scaffolded but empty)
- Real walk-cycle animation for player/enemies once a pack with animation frames (e.g. 0x72's
  DungeonTileset II) is in — `entities/entity.js` currently just static-bobs, no frame stepping
- Upgrading the spell from a particle effect to an animated sprite sheet
- Touch controls for mobile
- More enemy types or shop items
- Turning on the save system's "Continue" flow
- If the prototype earns it: wrapping this folder in Electron/NW.js for a standalone build
