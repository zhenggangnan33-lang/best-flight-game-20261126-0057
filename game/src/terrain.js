// Terrain: the height of the land under any point of the world, and the map
// questions the flight model asks — water or land, the nearest base, the nearest
// village. Islands are smooth domes (a peak at the centre, sea level at the shore)
// so the altimeter and the crash rule both have something honest to read.

import { ISLANDS, SKERRIES, BASES, VILLAGES } from './places.js';

/** Feet of rock under world point (x, y); zero over the sea. */
export function terrainHeightAt(x, y) {
  let height = 0;
  for (const island of ISLANDS) {
    const dx = x - island.x;
    const dy = y - island.y;
    const cos = Math.cos(-island.rot);
    const sin = Math.sin(-island.rot);
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    const d = (lx * lx) / (island.rx * island.rx) + (ly * ly) / (island.ry * island.ry);
    if (d < 1) {
      const h = island.peak * Math.pow(1 - d, 0.8);
      if (h > height) height = h;
    }
  }
  for (const skerry of SKERRIES) {
    const dx = x - skerry.x;
    const dy = y - skerry.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < skerry.r * skerry.r) {
      const h = 90 * (1 - d2 / (skerry.r * skerry.r));
      if (h > height) height = h;
    }
  }
  return height;
}

/** True when the point is open sea — safe to land on, and safe to scoop from. */
export function isWater(x, y) {
  return terrainHeightAt(x, y) <= 0;
}

/** The island a point stands on, or null over the sea. */
export function islandAt(x, y) {
  for (const island of ISLANDS) {
    const dx = x - island.x;
    const dy = y - island.y;
    const cos = Math.cos(-island.rot);
    const sin = Math.sin(-island.rot);
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    if ((lx * lx) / (island.rx * island.rx) + (ly * ly) / (island.ry * island.ry) < 1) return island;
  }
  return null;
}

export function nearestBase(x, y) {
  let best = null;
  let bestD = Infinity;
  for (const base of BASES) {
    const d = (base.x - x) * (base.x - x) + (base.y - y) * (base.y - y);
    if (d < bestD) {
      bestD = d;
      best = base;
    }
  }
  return best;
}

export function nearestVillage(x, y) {
  let best = null;
  let bestD = Infinity;
  for (const village of VILLAGES) {
    const d = (village.x - x) * (village.x - x) + (village.y - y) * (village.y - y);
    if (d < bestD) {
      bestD = d;
      best = village;
    }
  }
  return best;
}

export function distanceTo(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}
