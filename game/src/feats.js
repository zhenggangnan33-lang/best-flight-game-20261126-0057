// Feats: 24 named achievements the squadron pins on its pilots. Each one names
// the event that earns it, and the game checks them as the flying happens.

export const FEATS = [
  { id: 'first-light', name: 'First Light', blurb: 'Finish your first sortie.', test: (s) => s.sortiesDone >= 1 },
  { id: 'night-owl', name: 'Night Owl', blurb: 'Land on water after dark.', test: (s) => s.nightLandings >= 1 },
  { id: 'storm-rider', name: 'Storm Rider', blurb: 'Fly through a storm cell and live.', test: (s) => s.stormsFlown >= 1 },
  { id: 'perfect-touchdown', name: 'Perfect Touchdown', blurb: 'Land with less than a whisper of sink.', test: (s) => s.perfectLandings >= 1 },
  { id: 'century-club', name: 'Century Club', blurb: 'Rescue one hundred souls.', test: (s) => s.soulsRescued >= 100 },
  { id: 'all-islands', name: 'All Islands', blurb: 'Visit every island in the chain.', test: (s) => s.islandsVisited >= 8 },
  { id: 'gold-rush', name: 'Gold Rush', blurb: 'Earn five gold medals.', test: (s) => s.goldMedals >= 5 },
  { id: 'speed-demon', name: 'Speed Demon', blurb: 'Beat a gold par by twenty seconds.', test: (s) => s.bestMargin >= 20 },
  { id: 'gentle-hands', name: 'Gentle Hands', blurb: 'Finish a sortie with no damage at all.', test: (s) => s.cleanSorties >= 1 },
  { id: 'fuel-saver', name: 'Fuel Saver', blurb: 'Land with more than half your fuel left.', test: (s) => s.fuelSaverLandings >= 1 },
  { id: 'fog-runner', name: 'Fog Runner', blurb: 'Finish a sortie in sea fog.', test: (s) => s.fogSorties >= 1 },
  { id: 'ice-breaker', name: 'Ice Breaker', blurb: 'Finish a sortie in icing cloud.', test: (s) => s.icingSorties >= 1 },
  { id: 'lighthouse-keeper', name: 'Lighthouse Keeper', blurb: 'Deliver to Old Nils on Skrova.', test: (s) => s.done.includes('skrova-keeper') },
  { id: 'mailman', name: 'Mailman', blurb: 'Deliver the mail to Værøy.', test: (s) => s.done.includes('vaeroy-mail') },
  { id: 'whale-watcher', name: 'Whale Watcher', blurb: 'Photograph all three whale pods.', test: (s) => s.done.includes('whale-andenes') },
  { id: 'firefighter', name: 'Firefighter', blurb: 'Put out the fire at Flakstad.', test: (s) => s.done.includes('flakstad-fire') },
  { id: 'choir-master', name: 'Choir Master', blurb: 'Fly the Kabelvåg choir to its concert.', test: (s) => s.done.includes('kabelvag-choir') },
  { id: 'aurora-hunter', name: 'Aurora Hunter', blurb: 'Photograph the aurora over Hamnøy.', test: (s) => s.done.includes('aurora-hamnoy') },
  { id: 'long-haul', name: 'Long Haul', blurb: 'Fly the rescue to Røst and back.', test: (s) => s.done.includes('rost-rescue') },
  { id: 'blizzard-survivor', name: 'Blizzard Survivor', blurb: 'Bring the snowplough driver home.', test: (s) => s.done.includes('leknes-blizzard') },
  { id: 'midnight-runner', name: 'Midnight Runner', blurb: 'Fly the grand tour, Å to Svolvær.', test: (s) => s.done.includes('midnight-sun-run') },
  { id: 'full-house', name: 'Full House', blurb: 'Own every refit in the hangar.', test: (s) => s.refitsOwned >= 20 },
  { id: 'golden-squadron', name: 'Golden Squadron', blurb: 'Earn gold on all eighteen sorties.', test: (s) => s.goldMedals >= 18 },
  { id: 'legend', name: 'Legend of Lofoten', blurb: 'Finish every sortie and earn every feat but this one.', test: (s) => s.sortiesDone >= 18 && s.featsEarned >= 23 },
];

/** A fresh, empty feats statistics object. */
export function freshFeatStats() {
  return {
    sortiesDone: 0, nightLandings: 0, stormsFlown: 0, perfectLandings: 0,
    soulsRescued: 0, islandsVisited: 0, goldMedals: 0, bestMargin: 0,
    cleanSorties: 0, fuelSaverLandings: 0, fogSorties: 0, icingSorties: 0,
    done: [], refitsOwned: 0, featsEarned: 0,
  };
}

/** Return the feats newly earned by these stats, given the ones already held. */
export function checkFeats(stats, held) {
  const earned = [];
  for (const feat of FEATS) {
    if (held.includes(feat.id)) continue;
    if (feat.test(stats)) earned.push(feat);
  }
  return earned;
}
