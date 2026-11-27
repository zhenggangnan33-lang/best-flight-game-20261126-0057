// The Lofoten archipelago as the game knows it: eight islands in a chain running
// south-west to north-east across a 4800x3200 world, the villages on their shores,
// and the three floatplane bases. Coordinates are world units (x east, y south);
// heights are feet above the sea, and the sea itself is height zero.

export const ISLANDS = [
  { name: 'Moskenesøya', x: 900, y: 2400, rx: 540, ry: 285, peak: 850, rot: -0.5 },
  { name: 'Flakstadøya', x: 1650, y: 2000, rx: 420, ry: 240, peak: 722, rot: -0.45 },
  { name: 'Vestvågøya', x: 2350, y: 1650, rx: 495, ry: 285, peak: 612, rot: -0.4 },
  { name: 'Austvågøya', x: 3450, y: 1100, rx: 690, ry: 322, peak: 935, rot: -0.35 },
  { name: 'Gimsøya', x: 2900, y: 1520, rx: 225, ry: 135, peak: 357, rot: -0.3 },
  { name: 'Skrova', x: 3950, y: 820, rx: 142, ry: 112, peak: 272, rot: 0.2 },
  { name: 'Værøy', x: 700, y: 2920, rx: 270, ry: 172, peak: 391, rot: -0.2 },
  { name: 'Røst', x: 330, y: 3060, rx: 172, ry: 128, peak: 221, rot: 0.1 },
];

// Small rocky skerries that dot the sea between the islands.
export const SKERRIES = [
  { x: 1350, y: 2700, r: 60 }, { x: 2050, y: 2300, r: 48 }, { x: 2750, y: 1950, r: 55 },
  { x: 3200, y: 1750, r: 42 }, { x: 4100, y: 1150, r: 58 }, { x: 1100, y: 2900, r: 45 },
  { x: 2450, y: 2600, r: 52 }, { x: 3600, y: 1500, r: 40 }, { x: 1800, y: 2650, r: 38 },
  { x: 4300, y: 900, r: 46 },
];

export const VILLAGES = [
  { name: 'Å', x: 620, y: 2720, houses: 9 },
  { name: 'Moskenes', x: 881, y: 2688, houses: 7 },
  { name: 'Reine', x: 1079, y: 2589, houses: 14 },
  { name: 'Hamnøy', x: 1289, y: 2394, houses: 8 },
  { name: 'Sakrisøy', x: 1340, y: 2270, houses: 6 },
  { name: 'Ramberg', x: 1566, y: 2251, houses: 10 },
  { name: 'Flakstad', x: 1845, y: 2125, houses: 8 },
  { name: 'Nusfjord', x: 2000, y: 1890, houses: 7 },
  { name: 'Leknes', x: 2329, y: 1906, houses: 16 },
  { name: 'Ballstad', x: 2414, y: 1389, houses: 11 },
  { name: 'Stamsund', x: 2620, y: 1400, houses: 9 },
  { name: 'Henningsvær', x: 3206, y: 1451, houses: 15 },
  { name: 'Kabelvåg', x: 3397, y: 1425, houses: 10 },
  { name: 'Svolvær', x: 3620, y: 760, houses: 20 },
  { name: 'Laukvik', x: 3820, y: 760, houses: 6 },
  { name: 'Skrova', x: 3935, y: 783, houses: 5 },
  { name: 'Værøy', x: 746, y: 3031, houses: 8 },
  { name: 'Røst', x: 330, y: 3060, houses: 6 },
];

/** Floatplane bases: a water runway, a hangar and a fuel dock each. */
export const BASES = [
  { id: 'svolvaer', name: 'Svolvær', x: 3818, y: 1278, heading: 1.57, home: true, blurb: 'Squadron home base, on the quay at Svolvær.' },
  { id: 'reine', name: 'Reine', x: 1065, y: 2645, heading: 2.36, home: false, blurb: 'The southern dock, under the Reinebringen ridge.' },
  { id: 'henningsvaer', name: 'Henningsvær', x: 3191, y: 1484, heading: 1.57, home: false, blurb: 'The fishing village base, out on the skerries.' },
];

/** Named weather the sorties fly in. wind is degrees the wind blows FROM, knots. */
export const WEATHER = {
  clear: { label: 'Clear', windFrom: 320, windKt: 6, fog: 0, storm: 0, night: false, aurora: false, snow: 0, icing: 0 },
  dawn: { label: 'Dawn', windFrom: 280, windKt: 8, fog: 0.15, storm: 0, night: false, aurora: false, snow: 0, icing: 0 },
  breeze: { label: 'Fresh breeze', windFrom: 250, windKt: 16, fog: 0, storm: 0, night: false, aurora: false, snow: 0, icing: 0 },
  fog: { label: 'Sea fog', windFrom: 200, windKt: 4, fog: 0.75, storm: 0, night: false, aurora: false, snow: 0, icing: 0 },
  storm: { label: 'Storm', windFrom: 230, windKt: 30, fog: 0.3, storm: 1, night: false, aurora: false, snow: 0, icing: 0 },
  night: { label: 'Night', windFrom: 300, windKt: 7, fog: 0.1, storm: 0, night: true, aurora: false, snow: 0, icing: 0 },
  aurora: { label: 'Aurora night', windFrom: 310, windKt: 5, fog: 0, storm: 0, night: true, aurora: true, snow: 0, icing: 0 },
  blizzard: { label: 'Blizzard', windFrom: 260, windKt: 34, fog: 0.6, storm: 1, night: false, aurora: false, snow: 1, icing: 0.5 },
  icing: { label: 'Icing', windFrom: 290, windKt: 12, fog: 0.4, storm: 0, night: false, aurora: false, snow: 0.4, icing: 1 },
};

/** The people of the squadron and the coast. */
export const CREW = {
  dispatcher: { name: 'Liv Hansen', role: 'Dispatcher, Svolvær tower' },
  mechanic: { name: 'Erik Solberg', role: 'Mechanic, Svolvær hangar' },
  doctor: { name: 'Dr Ingrid Dahl', role: 'Air ambulance doctor' },
  keeper: { name: 'Old Nils', role: 'Lighthouse keeper, Skrova' },
};

export function villageByName(name) {
  return VILLAGES.find((v) => v.name === name);
}

export function baseById(id) {
  return BASES.find((b) => b.id === id);
}
