[![make.fun](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/zhenggangnan33-lang/best-flight-game-20261126-0057/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/zhenggangnan33-lang/best-flight-game-20261126-0057/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)

# Lofoten Lifeline

A rescue floatplane over the Lofoten Islands, Norway — 12 sorties, 24 rings, 4 storm fronts, 12 refits, 16 feats. Fly a floatplane through gold rings over fjords, past red rorbu cabins and fish racks, and set her down on the water to bring people home before the gale closes the sky.

Made for the [best flight game bounty](https://make.fun/bounty/best-flight-game-20261126-0057) on make.fun.

## Play

Open `game/index.html` in a desktop browser (or serve `game/` with any static server). No network, no build step, no sound files — all audio is synthesised in code.

- **W / S or ↑ / ↓** — throttle up / down
- **A / D or ← / →** — pitch up / down (climb / descend)
- **F** — flaps (lower stall speed for landing)
- **Space** — drop cargo over the yellow mark (supply sorties)
- **P** — pause · **M** — sound on/off · **Enter** — confirm

## The sorties

| # | Sortie | Route | Goal |
|---|--------|-------|------|
| 1 | First Light | Svolvær → Henningsvær | 4 rings, water landing |
| 2 | Trollfjord Thread | Henningsvær → Trollfjord | 6 rings between the cliffs |
| 3 | Røst Rescue | Værøy → Røst | Land on the swell, bring the crew home |
| 4 | Nusfjord Supply Drop | Leknes → Nusfjord | Drop the crate on the yellow mark |
| 5 | Storm Front One | Kabelvåg → Svinøya | 5 rings in rain and gusts |
| 6 | Midnight Sun Ferry | Svolvær → Reine | 5 rings by lit instruments |
| 7 | Kabelvåg Mail Run | Svolvær → Kabelvåg | 7 rings against the clock |
| 8 | Værøy Evac | Moskenes → Værøy | Rescue on low fuel |
| 9 | Reine Ring Master | Å → Reine | 8 rings, dead centre for gold |
| 10 | Storm Front Two | Reine → Moskenes | 6 rings in a heavier gale |
| 11 | Å to the End of the Road | Svolvær → Å | Long haul with a medicine drop |
| 12 | The Great Gale | Leknes → Røst | Storm rescue before the front closes |

Every sortie is scored on rings (gold for a dead-centre pass), landing softness, fuel left and hull left, with gold / silver / bronze medals against a par time. Between sorties you pick one of 12 refits — Long-Range Tanks, Storm Radar, High-Lift Flaps, Rescue Winch and more. Sixteen feats track the flying: Thread the Needle, Dead Stick, Storm Rider, Lofoten Legend and the rest.

## What is in the game

- `game/index.html` — the page, a 1280×800 canvas
- `game/src/main.js` — the loop and the screens (title, briefing, flight, pause, debrief, wreck)
- `game/src/config.js` — tuning and all named content: 12 places, 12 sorties, 12 refits, 16 feats
- `game/src/terrain.js` — the Lofoten chain: ridges, villages, rings, landing water
- `game/src/plane.js` — the flight model: throttle, pitch, lift, stall, fuel, hull
- `game/src/missions.js` — sortie objectives, scoring and medals
- `game/src/refits.js` — refit effects and the between-sortie choice
- `game/src/feats.js` — the sixteen feats and how they unlock
- `game/src/render.js` — sky, sea, peaks, cabins, rings and the floatplane, all drawn
- `game/src/hud.js` — lit instruments: altitude, speed, heading, attitude, fuel, hull, compass
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — synthesised engine hum, ring chimes and warnings
- `game/src/shots.js` — the screenshot scenes and the autopilot that flies them
- `game/src/random.js` — the seeded random source

Screenshots are real renders of the game's own code: open `game/index.html?shot=title|flight|landing|debrief` and the game stages that frame itself.

## License

MIT — see [LICENSE](LICENSE).
