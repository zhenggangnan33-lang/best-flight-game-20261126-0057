// A sortie in progress: rings, objectives, score, medals and the
// debrief. The mission layer reads the plane's events and decides what
// the flight meant — it never touches the canvas.

import { FLIGHT, MEDALS, placeById } from './config.js';
import { ringAhead, ringsLeft } from './terrain.js';

export function createRun(sortie, mods) {
  return {
    sortie,
    mods,
    state: 'flying', // flying | landed | crashed | done
    time: 0,
    score: 0,
    ringsHit: 0,
    ringsGold: 0,
    rescued: false,
    dropped: false,
    pickupTimer: 0,
    events: [],
    medal: null,
    landedSink: null,
    finishedAt: null,
  };
}

function medalFor(sortie, time) {
  if (time <= sortie.par * MEDALS.gold) return 'gold';
  if (time <= sortie.par * MEDALS.silver) return 'silver';
  if (time <= sortie.par * MEDALS.bronze) return 'bronze';
  return null;
}

// Score the plane's events for this step. Returns new feat-check
// signals for the feats layer ({type, ...}).
export function updateRun(run, events, plane, world, dt) {
  const signals = [];
  run.time += dt;
  for (const e of events) {
    run.events.push(e.type);
    if (e.type === 'terrain-hit' || e.type === 'hard-water') {
      run.score = Math.max(0, run.score - 50);
    }
    if (e.type === 'crashed') {
      run.state = 'crashed';
      run.finishedAt = run.time;
    }
    if (e.type === 'water-touch' && e.inZone) {
      run.landedSink = e.sink;
      signals.push({ type: 'touchdown', sink: e.sink, fuel: plane.fuel, hull: plane.hull });
      if (run.sortie.type === 'rescue' && !run.rescued) {
        run.pickupTimer += dt;
      }
    }
    if (e.type === 'speed-demon') signals.push({ type: 'speed-demon' });
    if (e.type === 'mountain-goat') signals.push({ type: 'mountain-goat' });
    if (e.type === 'fuel-empty') signals.push({ type: 'fuel-empty' });
  }

  // Rings: the plane flies through one when it crosses its x within
  // its radius in both axes. Centre hits are gold. A ring flown 250 ft
  // past is missed, not chased: this is a one-way flight, and a sortie
  // a single missed ring could never finish would be no game at all.
  for (const r of world.rings) {
    if (!r.hit && !r.missed && plane.x > r.x + 250) r.missed = true;
  }
  const ring = ringAhead(world);
  if (ring && plane.airborne) {
    const dx = plane.x - ring.x;
    const dy = plane.y - ring.y;
    if (Math.abs(dx) < 20 && Math.hypot(dx, dy) < ring.r + 6) {
      ring.hit = true;
      const centre = Math.hypot(dx, dy) < ring.r * 0.45;
      ring.gold = centre;
      run.ringsHit += 1;
      if (centre) run.ringsGold += 1;
      run.score += FLIGHT.ringScore + (centre ? FLIGHT.ringGoldBonus : 0);
      signals.push({ type: 'ring', gold: centre, left: ringsLeft(world) });
      if (centre) signals.push({ type: 'thread-needle' });
      if (run.ringsHit >= 8) signals.push({ type: 'ring-master' });
    }
  }

  // Rescue: sit on the water in the zone and the crew climbs aboard.
  if (run.sortie.type === 'rescue' && !run.rescued && plane.onWater
    && plane.x >= world.landing.x0 && plane.x <= world.landing.x1) {
    run.pickupTimer += dt * (run.mods.rescueFast ? 2 : 1);
    if (run.pickupTimer >= 3) {
      run.rescued = true;
      run.score += FLIGHT.rescueScore;
      signals.push({ type: 'rescued' });
      run.state = 'done';
      run.finishedAt = run.time;
      run.medal = medalFor(run.sortie, run.time);
    }
  }

  // Landing: all rings threaded, then a settled water landing in the zone.
  if (run.sortie.type !== 'rescue' && ringsLeft(world) === 0
    && plane.onWater && plane.speed < 60
    && plane.x >= world.landing.x0 && plane.x <= world.landing.x1
    && run.state === 'flying') {
    run.state = 'landed';
    run.finishedAt = run.time;
    run.medal = medalFor(run.sortie, run.time);
    const fuelBonus = Math.round(plane.fuel * 2);
    const hullBonus = Math.round(plane.hull);
    run.score += FLIGHT.landingScore + fuelBonus + hullBonus;
    signals.push({ type: 'landed', fuel: plane.fuel, hull: plane.hull, sink: run.landedSink });
    if (plane.fuel <= 5) signals.push({ type: 'dead-stick' });
    if (plane.fuel >= 40) signals.push({ type: 'fuel-saver' });
    if (run.landedSink !== null && run.landedSink <= 4) signals.push({ type: 'gentle-touch' });
    if (plane.hull >= 100) signals.push({ type: 'iron-hull' });
    if (run.ringsGold === run.sortie.rings && plane.hull >= 100) signals.push({ type: 'perfect-run' });
    if (run.sortie.type === 'storm' && plane.hull >= 100) signals.push({ type: 'storm-rider' });
    if (run.time <= run.sortie.par - 10) signals.push({ type: 'on-time' });
  }

  // Out of sky: past the end of the world without landing.
  if (plane.x > world.length + 200 && run.state === 'flying') {
    run.state = 'crashed';
    run.finishedAt = run.time;
    signals.push({ type: 'overshot' });
  }
  return signals;
}

// The supply drop, called from the input layer when Space is pressed.
export function dropCargo(run, plane, world) {
  if (run.sortie.type !== 'drop' || run.dropped) return null;
  const mark = (world.landing.x0 + world.landing.x1) / 2;
  const dx = Math.abs(plane.x - mark);
  const level = Math.abs(plane.pitch) < 0.25 && plane.speed > 60 && plane.speed < 130;
  run.dropped = true;
  if (dx < 120 && level) {
    const pts = FLIGHT.dropScore * (run.mods.dropMul || 1);
    run.score += pts;
    return { ok: true, points: pts };
  }
  return { ok: false, points: 0 };
}

export function runSummary(run, plane) {
  return {
    sortie: run.sortie.name,
    from: placeById(run.sortie.from).name,
    to: placeById(run.sortie.to).name,
    state: run.state,
    time: run.time,
    score: run.score,
    rings: `${run.ringsHit}/${run.sortie.rings}`,
    gold: run.ringsGold,
    medal: run.medal,
    fuel: Math.round(plane.fuel),
    hull: Math.round(plane.hull),
  };
}
