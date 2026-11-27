// The hangar: 20 refits for the squadron's Beaver, bought with rescue credits.
// Each refit changes how the aeroplane flies, and the shop says so plainly.

export const REFITS = [
  { id: 'engine-mk2', name: 'Polaris Engine Mk II', cost: 400, effect: 'maxSpeed', value: 18, blurb: 'A rebuilt engine: 18 knots more at the top, and a kinder climb.' },
  { id: 'long-tanks', name: 'Long-Range Tanks', cost: 350, effect: 'fuel', value: 40, blurb: 'Forty percent more fuel. Røst stops feeling far away.' },
  { id: 'deice-boots', name: 'De-Ice Boots', cost: 300, effect: 'deice', value: 1, blurb: 'Rubber boots on the wings that shrug off ice. No more heavy wings in cloud.' },
  { id: 'winch', name: 'Rescue Winch', cost: 450, effect: 'winch', value: 1, blurb: 'Pick people up from a hover — no water landing needed at the ring.' },
  { id: 'medkit-bay', name: 'Medkit Bay', cost: 250, effect: 'rescue', value: 1, blurb: 'A proper medical bay. Rescues finish faster and pay a little more.' },
  { id: 'nvg', name: 'Night-Vision Goggles', cost: 350, effect: 'night', value: 1, blurb: 'See the water and the rings clearly on the darkest night.' },
  { id: 'autopilot', name: 'Autopilot', cost: 500, effect: 'autopilot', value: 1, blurb: 'Holds your heading in gusts. The aeroplane stops wandering in storms.' },
  { id: 'floats', name: 'Reinforced Floats', cost: 300, effect: 'floats', value: 1, blurb: 'Stronger floats. Hard landings hurt the aeroplane half as much.' },
  { id: 'flares', name: 'Flare Kit', cost: 150, effect: 'flares', value: 1, blurb: 'Flares light the ring at night so you can see what you are landing on.' },
  { id: 'storm-radar', name: 'Storm Radar', cost: 400, effect: 'radar', value: 1, blurb: 'Storm cells show on the map. Fly around the weather instead of through it.' },
  { id: 'radio-relay', name: 'Radio Relay', cost: 200, effect: 'radio', value: 1, blurb: 'Liv can warn you of gusts and fog before you fly into them.' },
  { id: 'flaps', name: 'High-Lift Flaps', cost: 300, effect: 'stall', value: -8, blurb: 'Bigger flaps: the wing keeps flying eight knots slower. Gentle landings.' },
  { id: 'searchlight', name: 'Searchlight', cost: 250, effect: 'light', value: 1, blurb: 'A lamp under the wing that cuts through fog and night.' },
  { id: 'extra-seats', name: 'Extra Seats', cost: 350, effect: 'seats', value: 1, blurb: 'Two more seats. Passenger sorties pay for the extra souls aboard.' },
  { id: 'fast-refuel', name: 'Quick-Flow Fuel', cost: 150, effect: 'refuel', value: 1, blurb: 'A faster pump. Refuelling at base takes half the time.' },
  { id: 'skis', name: 'Snow Skis', cost: 300, effect: 'skis', value: 1, blurb: 'Skis under the floats. Land on snow as gently as on water.' },
  { id: 'oxygen', name: 'Oxygen Kit', cost: 250, effect: 'oxygen', value: 1, blurb: 'Breathe easy above the peaks. Cruise higher, over the weather.' },
  { id: 'tow-line', name: 'Tow Line', cost: 200, effect: 'tow', value: 1, blurb: 'A line for towing a stranded boat home. Slow work, honest pay.' },
  { id: 'cabin', name: 'Insulated Cabin', cost: 200, effect: 'cabin', value: 1, blurb: 'A warm cabin. The crew stays sharp on the longest winter flights.' },
  { id: 'aurora-camera', name: 'Aurora Camera', cost: 450, effect: 'camera', value: 1, blurb: 'A camera that loves the dark. Photo sorties pay double.' },
];

export function refitById(id) {
  return REFITS.find((r) => r.id === id);
}

/** Turn a set of owned refit ids into the flight modifiers the world uses. */
export function refitModifiers(owned) {
  const has = (id) => owned.includes(id);
  return {
    maxSpeedBonus: has('engine-mk2') ? 18 : 0,
    fuelBonus: has('long-tanks') ? 40 : 0,
    deice: has('deice-boots'),
    winch: has('winch'),
    rescueBonus: has('medkit-bay') ? 40 : 0,
    nightVision: has('nvg'),
    autopilot: has('autopilot'),
    floats: has('floats'),
    flares: has('flares'),
    radar: has('storm-radar'),
    radio: has('radio-relay'),
    stallBonus: has('flaps') ? -8 : 0,
    searchlight: has('searchlight'),
    seats: has('extra-seats'),
    fastRefuel: has('fast-refuel'),
    skis: has('skis'),
    oxygen: has('oxygen'),
    tow: has('tow-line'),
    cabin: has('cabin'),
    camera: has('aurora-camera'),
  };
}
