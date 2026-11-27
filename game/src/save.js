// Progress between visits: credits, owned refits, medals per sortie, feats earned
// and the statistics the feats read. One JSON blob in localStorage; a corrupt or
// missing blob is a fresh squadron, never a crash.

import { SAVE_KEY, BEST_KEY } from './config.js';

export function freshSave() {
  return {
    credits: 250,
    refits: [],
    medals: {},
    feats: [],
    bestTimes: {},
    stats: {
      sortiesDone: 0, nightLandings: 0, stormsFlown: 0, perfectLandings: 0,
      soulsRescued: 0, islandsVisited: 0, goldMedals: 0, bestMargin: 0,
      cleanSorties: 0, fuelSaverLandings: 0, fogSorties: 0, icingSorties: 0,
      done: [], refitsOwned: 0, featsEarned: 0,
    },
  };
}

export function loadSave() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return freshSave();
    const parsed = JSON.parse(raw);
    const fresh = freshSave();
    return {
      credits: typeof parsed.credits === 'number' ? parsed.credits : fresh.credits,
      refits: Array.isArray(parsed.refits) ? parsed.refits : [],
      medals: parsed.medals && typeof parsed.medals === 'object' ? parsed.medals : {},
      feats: Array.isArray(parsed.feats) ? parsed.feats : [],
      bestTimes: parsed.bestTimes && typeof parsed.bestTimes === 'object' ? parsed.bestTimes : {},
      stats: { ...fresh.stats, ...(parsed.stats || {}) },
    };
  } catch {
    return freshSave();
  }
}

export function storeSave(save) {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // Storage can be off (private windows): progress then lasts this visit only.
  }
}

export function readBestCredits() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

export function storeBestCredits(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Ignore: the best then lasts this visit only.
  }
}
