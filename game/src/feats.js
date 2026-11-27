// Feats: sixteen named achievements, checked against the signals the
// mission layer emits and the pilot's career totals. Pure functions —
// the game keeps one set of unlocked ids and this file decides what a
// flight just earned.

import { FEATS } from './config.js';

export function createCareer() {
  return {
    unlocked: new Set(),
    rescues: 0,
    waterLandings: 0,
    placesVisited: new Set(),
    goldSorties: new Set(),
    medals: {}, // sortie id -> best medal
  };
}

// Signals come from updateRun plus career-level facts the caller
// passes in. Returns the feats unlocked by this flight.
export function checkFeats(career, signals, context) {
  const earned = [];
  const grant = (id) => {
    if (!career.unlocked.has(id)) {
      career.unlocked.add(id);
      earned.push(FEATS.find((f) => f.id === id));
    }
  };
  for (const s of signals) {
    if (s.type === 'thread-needle') grant('thread-needle');
    if (s.type === 'dead-stick') grant('dead-stick');
    if (s.type === 'storm-rider') grant('storm-rider');
    if (s.type === 'perfect-run') grant('perfect-run');
    if (s.type === 'gentle-touch') grant('gentle-touch');
    if (s.type === 'speed-demon') grant('speed-demon');
    if (s.type === 'fuel-saver') grant('fuel-saver');
    if (s.type === 'ring-master') grant('ring-master');
    if (s.type === 'iron-hull') grant('iron-hull');
    if (s.type === 'on-time') grant('on-time');
    if (s.type === 'mountain-goat') grant('mountain-goat');
    if (s.type === 'rescued') {
      career.rescues += 1;
      if (career.rescues >= 3) grant('lifesaver');
    }
    if (s.type === 'touchdown') {
      career.waterLandings += 1;
      if (career.waterLandings >= 5) grant('old-salt');
    }
  }
  if (context) {
    if (context.sortieId === 'midnight-ferry' && context.finished) grant('night-owl');
    if (context.finished) {
      career.placesVisited.add(context.from);
      career.placesVisited.add(context.to);
      if (career.placesVisited.size >= 12) grant('cartographer');
      if (context.medal === 'gold') {
        career.goldSorties.add(context.sortieId);
        if (career.goldSorties.size >= 12) grant('lofoten-legend');
      }
      if (context.medal) {
        const prev = career.medals[context.sortieId];
        const order = { bronze: 1, silver: 2, gold: 3 };
        if (!prev || order[context.medal] > order[prev]) career.medals[context.sortieId] = context.medal;
      }
    }
  }
  return earned.filter(Boolean);
}

export function featList() {
  return FEATS;
}
