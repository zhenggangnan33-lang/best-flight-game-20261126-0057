// The Lofoten chain as a flyable world: jagged peaks, fjord walls, the
// sea, villages, lighthouses, fish racks, and the rings and landing
// water each sortie hangs in the sky. Pure data — no canvas here — so
// the same world can be stepped headlessly in a test.

import { PLACES, placeById } from './config.js';
import { makeRng } from './random.js';

const WORLD_LENGTH = 10500; // feet of flight path per sortie
const RIDGE_COUNT = 26;

// One mountain silhouette: a jagged ridge the plane must stay above.
function buildRidges(rng) {
  const ridges = [];
  for (let i = 0; i < RIDGE_COUNT; i += 1) {
    const x = (i / RIDGE_COUNT) * WORLD_LENGTH + rng.range(-140, 140);
    const height = rng.range(150, 420);
    const width = rng.range(400, 800);
    ridges.push({ x, height, width, snow: height > 430 });
  }
  return ridges;
}

// Height of the rock at a given x, in feet above the sea. The fjord
// walls pinch in where the sortie wants rings low.
function groundHeightAt(ridges, x) {
  let h = 0;
  for (const r of ridges) {
    const d = Math.abs(x - r.x) / (r.width / 2);
    if (d < 1) h = Math.max(h, r.height * (1 - d * d));
  }
  return h;
}

// Villages sit where the ground meets the sea; each one is a cluster of
// red cabins, a rack of drying fish and, sometimes, a white lighthouse.
function buildVillages(rng, ridges) {
  const villages = [];
  const spots = [900, 2100, 3400, 4700, 5900, 7100, 8300, 9500];
  for (let i = 0; i < spots.length; i += 1) {
    const x = spots[i] + rng.range(-120, 120);
    const ground = groundHeightAt(ridges, x);
    const place = PLACES[i % PLACES.length];
    villages.push({
      x,
      place: place.name,
      cabins: rng.int(3, 6),
      racks: rng.int(1, 3),
      lighthouse: rng.chance(0.45),
      boats: rng.int(1, 3),
      ground,
    });
  }
  return villages;
}

function buildRings(sortie, rng, ridges) {
  const rings = [];
  const gap = WORLD_LENGTH / (sortie.rings + 1);
  // The take-off water and the landing water stay flat: no ridge
  // may rise where the plane starts or where it is meant to set down.
  const flatGroundAt = (x) => (x < 700 || x > 8200 ? 0 : groundHeightAt(ridges, x));
  // The course must be flyable: each ring sits within one steady
  // climb or descent of the last, and always above its own rock.
  let prevY = 420; // the altitude a sortie starts at
  for (let i = 0; i < sortie.rings; i += 1) {
    const x = gap * (i + 1) + rng.range(-90, 90);
    // The ring must be reachable: it clears the highest rock on its
    // whole approach, not just the rock under it — a ring in a valley
    // behind a tall ridge is a trap, not a challenge.
    let approach = 0;
    for (let ax = x - 500; ax <= x; ax += 50) {
      approach = Math.max(approach, flatGroundAt(ax));
    }
    let y = prevY + rng.range(-200, 200);
    y = Math.max(approach + 140, Math.min(approach + 320, y));
    if (i === sortie.rings - 1) {
      // The last ring sits low, over the flat water: the plane comes
      // off it already on the glideslope instead of diving for the buoys.
      y = Math.max(approach + 140, 150 + rng.range(0, 130));
    }
    rings.push({ x, y, r: 50, hit: false, gold: false, missed: false, index: i });
    prevY = y;
  }
  return rings;
}

// A calm stretch of water to set down on, marked by two buoys.
function buildLandingZone(sortie, rng) {
  const x0 = WORLD_LENGTH - 900;
  return { x0, x1: WORLD_LENGTH - 100, y: 0, name: placeById(sortie.to).name };
}

export function buildWorld(sortie) {
  const rng = makeRng(sortie.seed * 7919 + 13);
  const ridges = buildRidges(rng);
  const villages = buildVillages(rng, ridges);
  const rings = buildRings(sortie, rng, ridges);
  const landing = buildLandingZone(sortie, rng);
  return {
    sortie,
    length: WORLD_LENGTH,
    ridges,
    villages,
    rings,
    landing,
    wind: sortie.wind,
    gust: sortie.gust,
    night: !!sortie.night,
    // Gusts roll through on a slow sine so the pilot can read them.
    gustAt(t) {
      return Math.sin(t * 0.7) * 0.6 + Math.sin(t * 1.7 + 2.1) * 0.4;
    },
  };
}

export function terrainHeight(world, x) {
  // The take-off water and the landing water stay flat: no ridge
  // may rise where the plane starts or where it is meant to set down.
  if (x < 700 || x > 8200) return 0;
  return groundHeightAt(world.ridges, x);
}

export function ringAhead(world) {
  return world.rings.find((r) => !r.hit && !r.missed) || null;
}

export function ringsLeft(world) {
  return world.rings.filter((r) => !r.hit && !r.missed).length;
}

export function inLandingZone(world, x) {
  return x >= world.landing.x0 && x <= world.landing.x1;
}
