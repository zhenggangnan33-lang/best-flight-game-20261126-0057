// LOFOTEN LIFELINE — tuning and all named content.
// One file, one job: every number the flight model uses and every name
// the player sees (places, sorties, refits, feats) lives here, so the
// other files only ever read tables, never hard-code a name or a constant.

export const VIEW = { width: 1280, height: 800 };

// The world is a side-scrolling fjord. x runs along the flight path in
// feet; y is altitude in feet above the sea. The canvas draws 1 foot as
// 0.28 px vertically and scrolls the camera along x.
export const WORLD = {
  pxPerFoot: 0.28,
  seaY: 660, // canvas y of the waterline when the camera sits at 0 ft
  groundClearance: 40, // feet of beach between the waterline and the peaks' feet
};

// Arcade flight model, tuned so a sortie takes 2-4 minutes.
export const FLIGHT = {
  maxThrottle: 100,
  throttleStep: 55, // percent per second held
  thrust: 34, // ft/s^2 at full throttle, before drag
  drag: 0.0015, // quadratic drag coefficient
  maxSpeed: 178, // knots-ish ceiling for the HUD (display units)
  displaySpeed: 1.0, // internal ft/s maps to knots on the HUD
  climbRate: 26, // ft/s per unit of pitch input at cruise
  pitchRate: 1.9, // radians per second of pitch change
  maxPitch: 0.62, // radians up or down
  stallSpeed: 52, // ft/s below which the wing quits (flaps lower it)
  stallSpeedFlaps: 40,
  gravity: 30, // ft/s^2 sink when stalled or throttled back low
  fuelCapacity: 100, // percent
  fuelBurn: 0.55, // percent per second at full throttle
  fuelBurnIdle: 0.12,
  hullMax: 100,
  terrainHitDamage: 34, // hitting rock at speed
  hardLandingDamage: 22, // touchdown faster than the safe sink rate
  safeSink: 9, // ft/s vertical speed that still counts as a gentle landing
  bounceSink: 16, // ft/s above which the plane bounces and takes damage
  ringScore: 100,
  ringGoldBonus: 50,
  landingScore: 250,
  rescueScore: 300,
  dropScore: 200,
};

// The twelve places of the Lofoten run, west to east along the chain.
// Each one is a real village or sound; the game never invents a place.
export const PLACES = [
  { id: 'rost', name: 'Røst', kind: 'island', note: 'seabird cliffs at the end of the chain' },
  { id: 'vaeroy', name: 'Værøy', kind: 'island', note: 'the old airstrip on the hill' },
  { id: 'moskenes', name: 'Moskenes', kind: 'ferry port', note: 'ferries to Bodø' },
  { id: 'a', name: 'Å', kind: 'village', note: 'the last road ends here' },
  { id: 'reine', name: 'Reine', kind: 'village', note: 'red rorbu cabins under the peaks' },
  { id: 'nusfjord', name: 'Nusfjord', kind: 'village', note: 'the old trading post' },
  { id: 'leknes', name: 'Leknes', kind: 'town', note: 'the only runway on the islands' },
  { id: 'trollfjord', name: 'Trollfjord', kind: 'fjord', note: 'cliffs a ship can barely turn in' },
  { id: 'svinoya', name: 'Svinøya', kind: 'lighthouse', note: 'the light at the mouth of the sound' },
  { id: 'henningsvaer', name: 'Henningsvær', kind: 'village', note: 'the football pitch on the rock' },
  { id: 'kabelvag', name: 'Kabelvåg', kind: 'village', note: 'the Lofoten cathedral' },
  { id: 'svolvaer', name: 'Svolvær', kind: 'town', note: 'harbour, fish racks and the goat peak' },
];

// Twelve sorties. type: 'rings' (thread every ring, then land),
// 'rescue' (land on the water, pick up, fly home), 'drop' (cargo over
// the mark, then land), 'storm' (rings in gusts and rain).
// par is the gold-medal time in seconds; fuel is the load in percent.
export const SORTIES = [
  {
    id: 'first-light', number: 1, name: 'First Light', type: 'rings',
    from: 'svolvaer', to: 'henningsvaer', rings: 4, fuel: 70, wind: 0,
    par: 150, seed: 11, gust: 0,
    briefing: 'Dawn over Svolvær harbour. Thread four gold rings down the sound and set her on the water off Henningsvær. Gentle does it — this is your checkout flight.',
  },
  {
    id: 'trollfjord-thread', number: 2, name: 'Trollfjord Thread', type: 'rings',
    from: 'henningsvaer', to: 'trollfjord', rings: 6, fuel: 75, wind: 4,
    par: 190, seed: 23, gust: 0.2,
    briefing: 'The fjord narrows to a crack in the rock. Six rings hang between the cliffs — fly the centre of each one and mind the walls.',
  },
  {
    id: 'rost-rescue', number: 3, name: 'Røst Rescue', type: 'rescue',
    from: 'vaeroy', to: 'rost', rings: 3, fuel: 80, wind: 6,
    par: 220, seed: 37, gust: 0.3,
    briefing: 'A fishing crew is stranded on the Røst skerries. Fly out, land on the swell beside their boat, take them aboard and bring them home to Værøy.',
  },
  {
    id: 'nusfjord-supply', number: 4, name: 'Nusfjord Supply Drop', type: 'drop',
    from: 'leknes', to: 'nusfjord', rings: 4, fuel: 75, wind: 5,
    par: 200, seed: 41, gust: 0.25,
    briefing: 'The road to Nusfjord is snowed shut. Drop the crate on the yellow mark by the trading post — too fast and it bursts, too slow and it falls in the fjord.',
  },
  {
    id: 'storm-one', number: 5, name: 'Storm Front One', type: 'storm',
    from: 'kabelvag', to: 'svinoya', rings: 5, fuel: 85, wind: 14,
    par: 240, seed: 53, gust: 1.0,
    briefing: 'The first front is on the islands. Rain, gusts and a low ceiling. The lighthouse at Svinøya needs its keeper relieved — fly the rings and do not fight the wind, ride it.',
  },
  {
    id: 'midnight-ferry', number: 6, name: 'Midnight Sun Ferry', type: 'rings',
    from: 'svolvaer', to: 'reine', rings: 5, fuel: 85, wind: 3,
    par: 230, seed: 67, gust: 0.15, night: true,
    briefing: 'It is past midnight and the sun never sets — it just hangs low and gold over the sea. Fly by your instruments: the dials are lit, the peaks are not.',
  },
  {
    id: 'kabelvag-mail', number: 7, name: 'Kabelvåg Mail Run', type: 'rings',
    from: 'svolvaer', to: 'kabelvag', rings: 7, fuel: 70, wind: 7,
    par: 175, seed: 71, gust: 0.35,
    briefing: 'Seven rings, one clock. The mail boat leaves Kabelvåg on the hour and the letters have to be there first. Fast is good; wrecked is not.',
  },
  {
    id: 'vaeroy-evac', number: 8, name: 'Værøy Evac', type: 'rescue',
    from: 'moskenes', to: 'vaeroy', rings: 3, fuel: 55, wind: 9,
    par: 210, seed: 83, gust: 0.5,
    briefing: 'Low fuel, a sick fisherman on Værøy and a headwind all the way home. Plan the throttle like it matters — because it does.',
  },
  {
    id: 'reine-master', number: 9, name: 'Reine Ring Master', type: 'rings',
    from: 'a', to: 'reine', rings: 8, fuel: 80, wind: 5,
    par: 260, seed: 97, gust: 0.3,
    briefing: 'Eight rings over the sharpest peaks in the chain, ending on the water under Reinebringen. Every ring dead centre is gold — the islanders are watching.',
  },
  {
    id: 'storm-two', number: 10, name: 'Storm Front Two', type: 'storm',
    from: 'reine', to: 'moskenes', rings: 6, fuel: 90, wind: 18,
    par: 280, seed: 101, gust: 1.4,
    briefing: 'The second front is worse: sideways rain, gusts that shove the nose around, and a ceiling you can touch. Moskenes ferry port is waiting. So is the gale.',
  },
  {
    id: 'end-of-road', number: 11, name: 'Å to the End of the Road', type: 'drop',
    from: 'svolvaer', to: 'a', rings: 6, fuel: 100, wind: 8,
    par: 300, seed: 113, gust: 0.4,
    briefing: 'The long haul: the whole chain, Svolvær to Å, with a medicine drop on the way. Fuel is the mission. Nurse the throttle and let the wind carry you.',
  },
  {
    id: 'great-gale', number: 12, name: 'The Great Gale', type: 'rescue',
    from: 'leknes', to: 'rost', rings: 5, fuel: 100, wind: 20,
    par: 330, seed: 127, gust: 1.8, night: false,
    briefing: 'The gale of the year is coming over the sea and a crew is adrift off Røst. Five rings through the storm, a water landing in the swell, and home before the front closes the sky.',
  },
];

// Twelve refits, offered one at a time between sorties. Each is a small
// named upgrade with a real effect on the flight model.
export const REFITS = [
  { id: 'long-tanks', name: 'Long-Range Tanks', text: '+25% fuel capacity', apply: { fuelMul: 1.25 } },
  { id: 'turbo-prop', name: 'Turbo Prop', text: '+12% thrust', apply: { thrustMul: 1.12 } },
  { id: 'float-brace', name: 'Reinforced Floats', text: 'water landings hurt half as much', apply: { waterDamageMul: 0.5 } },
  { id: 'storm-radar', name: 'Storm Radar', text: 'gusts show on the HUD before they hit', apply: { gustWarn: true } },
  { id: 'high-lift', name: 'High-Lift Flaps', text: 'stall speed 8 ft/s lower', apply: { stallCut: 8 } },
  { id: 'de-icer', name: 'De-Icer Boots', text: 'storm sorties drain no extra fuel', apply: { stormFuelMul: 0.7 } },
  { id: 'night-optics', name: 'Night Optics', text: 'rings glow brighter after dark', apply: { ringGlow: true } },
  { id: 'cargo-hooks', name: 'Cargo Hooks', text: 'supply drops score double', apply: { dropMul: 2 } },
  { id: 'rescue-winch', name: 'Rescue Winch', text: 'rescues take half the time on the water', apply: { rescueFast: true } },
  { id: 'fuel-sipper', name: 'Fuel Sipper', text: 'cruise burn 20% lower', apply: { burnMul: 0.8 } },
  { id: 'airframe-brace', name: 'Airframe Brace', text: 'terrain hits hurt 30% less', apply: { damageMul: 0.7 } },
  { id: 'gyro-compass', name: 'Gyro Compass', text: 'heading holds steady in gusts', apply: { gustCut: 0.5 } },
];

// Sixteen feats. Each is checked against the run as it happens.
export const FEATS = [
  { id: 'thread-needle', name: 'Thread the Needle', text: 'Pass a ring dead centre' },
  { id: 'dead-stick', name: 'Dead Stick', text: 'Land with under 5% fuel left' },
  { id: 'storm-rider', name: 'Storm Rider', text: 'Finish a storm sortie with no damage' },
  { id: 'perfect-run', name: 'Perfect Run', text: 'All rings gold, hull untouched' },
  { id: 'night-owl', name: 'Night Owl', text: 'Finish the Midnight Sun Ferry' },
  { id: 'gentle-touch', name: 'Gentle Touch', text: 'Land softer than 4 ft/s sink' },
  { id: 'speed-demon', name: 'Speed Demon', text: 'Hold over 160 kt for 10 seconds' },
  { id: 'fuel-saver', name: 'Fuel Saver', text: 'Finish a sortie with 40% fuel left' },
  { id: 'ring-master', name: 'Ring Master', text: 'Thread 8 rings in one sortie' },
  { id: 'lifesaver', name: 'Lifesaver', text: 'Complete 3 rescues' },
  { id: 'old-salt', name: 'Old Salt', text: 'Land on the water 5 times' },
  { id: 'mountain-goat', name: 'Mountain Goat', text: 'Fly a fjord wall under 60 ft' },
  { id: 'on-time', name: 'On Time', text: 'Beat a sortie par by 10 seconds' },
  { id: 'iron-hull', name: 'Iron Hull', text: 'Finish with 100% hull' },
  { id: 'cartographer', name: 'Cartographer', text: 'Visit all 12 places' },
  { id: 'lofoten-legend', name: 'Lofoten Legend', text: 'Gold on all 12 sorties' },
];

// Medal cut lines, as fractions of the sortie par time.
export const MEDALS = { gold: 1.0, silver: 1.25, bronze: 1.6 };

export function placeById(id) {
  return PLACES.find((p) => p.id === id) || PLACES[0];
}

export function sortieById(id) {
  return SORTIES.find((s) => s.id === id) || SORTIES[0];
}
