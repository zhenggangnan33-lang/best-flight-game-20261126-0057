// Refits: the upgrades a pilot carries between sorties. The flight
// model reads one flat modifiers object; this file turns the owned
// refit ids into that object and offers the next choice.

import { REFITS } from './config.js';

export function modifiersFor(ownedIds) {
  const mods = {};
  for (const id of ownedIds || []) {
    const refit = REFITS.find((r) => r.id === id);
    if (!refit) continue;
    for (const [key, value] of Object.entries(refit.apply)) {
      if (typeof value === 'number' && typeof mods[key] === 'number') mods[key] *= value;
      else if (typeof value === 'number' && mods[key] === undefined) mods[key] = value;
      else mods[key] = value;
    }
  }
  return mods;
}

// Three refits the pilot has not taken yet, drawn in a stable order so
// the debrief screen always offers a real choice.
export function offerRefits(ownedIds, seed) {
  const pool = REFITS.filter((r) => !(ownedIds || []).includes(r.id));
  const start = seed % Math.max(1, pool.length);
  const offered = [];
  for (let i = 0; i < 3 && pool.length > 0; i += 1) {
    offered.push(pool[(start + i * 4) % pool.length]);
  }
  return offered;
}

export function refitById(id) {
  return REFITS.find((r) => r.id === id) || null;
}
