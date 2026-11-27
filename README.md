# Aurora Squadron — Lofoten Air Rescue

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/zhenggangnan33-lang/best-flight-game-20261126-0057/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/zhenggangnan33-lang/best-flight-game-20261126-0057/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

A rescue floatplane game set in the Lofoten archipelago, Norway. Fly a de Havilland Beaver on floats out of Svolvær, work through **18 named sorties** — rescues, medevacs, supply drops, glacier surveys, a fire to put out and a choir to fly — across real Lofoten places (Reine, Henningsvær, Nusfjord, Å, Røst, Skrova and more), through dawn, fog, storms, blizzards and aurora nights.

## What is in the game

- **18 sorties**, each with its own place, people, weather and goal: rescue, drop, survey, scoop-and-drop, photo and grand tour. Gold, silver and bronze medals by time.
- **20 refits** in the hangar — engine, long-range tanks, de-ice boots, rescue winch, night vision, storm radar, skis and more — bought with rescue credits, each changing how the aeroplane flies.
- **24 feats** to earn, from First Light to Legend of Lofoten.
- **Real flying decisions**: throttle and turn discipline, a stall speed, fuel that burns with the throttle, damage from hard landings and storms, icing in cloud, wind drift, and mountains that are really there — fly into one and the sortie ends.
- **A living archipelago**: eight islands, eighteen villages with lights at night, three floatplane bases, drifting clouds, sea fog, blizzards and the aurora.
- **A lit HUD**: altitude, speed and heading, throttle, fuel and hull, wind, compass ribbon, mission panel and a minimap — and a glowing target ring ahead.

## How to play

| Key | Does |
| --- | --- |
| ↑ / ↓ (W / S) | Throttle up / down — above half climbs, below half descends |
| ← / → (A / D) | Turn |
| Space | Action (rescue, drop, scoop) and confirm |
| P / Esc | Pause |
| H | Hangar (buy refits) |
| F | Feats |

Land on the water to finish a rescue, keep drops between 100 and 400 feet, and watch the fuel — Røst is a long way from home.

## Run it

Serve the game locally and open it in a desktop browser:

```sh
node serve.ts
# http://localhost:8080
```

Or run the entrypoint directly (writes the game and dossier to `out/`):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`?seed=N` fixes the weather and clouds. `?shot=start|play|night|end` stages a screenshot scene. `?selftest=1` flies the first sortie with the autopilot and reports the result in `window.__selftest`.

## Files

- `game/index.html` — the page, a full-screen canvas
- `game/src/main.js` — boot, loop and screens
- `game/src/config.js` — tuning numbers and colours
- `game/src/places.js` — the islands, villages, bases and weather of Lofoten
- `game/src/sorties.js` — the 18 sorties
- `game/src/refits.js` — the 20 hangar refits
- `game/src/feats.js` — the 24 feats
- `game/src/terrain.js` — height of the land under any point
- `game/src/world.js` — the flight model and the sortie engine
- `game/src/render.js` — the chase view, the HUD, the aurora, every screen
- `game/src/shots.js` — the autopilot and the staged screenshot scenes
- `game/src/input.js` — keyboard and pointer
- `game/src/random.js` — seeded random
- `game/src/save.js` — progress between visits
- `main.ts` — the entrypoint: hands the game and its dossier in
- `serve.ts` — the local server

Made for the [best flight game bounty](https://make.fun/bounty/best-flight-game-20261126-0057) at make.fun.
