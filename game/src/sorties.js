// The campaign: 18 named sorties across Lofoten, each with its own place, people,
// weather and goal. Goals: rescue (land or winch at the ring), drop (release
// supplies over the ring), survey (fly the rings in order), scoop (take water from
// the sea, then drop it on the fire), photo (hold inside the ring), tour (fly the
// rings, then land back at Svolvær). Times are the par for gold and silver medals.

export const SORTIES = [
  {
    id: 'first-light', no: 1, name: 'First Light over Svolvær', place: 'Svolvær', goal: 'tour',
    weather: 'dawn', par: 150, reward: 150, gold: 150, silver: 200,
    briefing: 'Shakedown flight. Fly the three marker rings around the harbour, then set her down on the water at Svolvær.',
    person: 'Liv Hansen: "Easy does it, pilot. Three rings, then home for coffee."',
    rings: [
      { x: 3400, y: 800, r: 120, label: 'Harbour North' },
      { x: 3900, y: 1150, r: 120, label: 'Skrova Gap' },
      { x: 3869, y: 1577, r: 120, label: 'Home Water' },
    ],
  },
  {
    id: 'henningsvaer-call', no: 2, name: 'The Henningsvær Call', place: 'Henningsvær', goal: 'rescue',
    weather: 'clear', par: 180, reward: 200, gold: 180, silver: 240,
    briefing: 'A kayaker has capsized off Henningsvær. Get to the ring, slow down and winch him aboard.',
    person: 'Liv Hansen: "Kayaker in the water, two minutes out. He is cold but talking."',
    rings: [{ x: 3410, y: 1520, r: 130, label: 'Kayaker in the water' }],
  },
  {
    id: 'medicine-reine', no: 3, name: 'Medicine for Reine', place: 'Reine', goal: 'drop',
    weather: 'breeze', par: 200, reward: 220, gold: 200, silver: 260,
    briefing: 'The Reine clinic is out of insulin. Drop the medicine crate on the marked quay — keep it between 100 and 400 feet.',
    person: 'Dr Ingrid Dahl: "The crate is padded. A gentle drop, please — it is medicine, not mail."',
    rings: [{ x: 1309, y: 2837, r: 130, label: 'Reine clinic quay' }],
  },
  {
    id: 'skrova-keeper', no: 4, name: 'Lighthouse Keeper at Skrova', place: 'Skrova', goal: 'drop',
    weather: 'clear', par: 220, reward: 240, gold: 220, silver: 290,
    briefing: 'Old Nils has been alone on Skrova light for a month. Drop his supplies on the rock — the wind is kind today.',
    person: 'Old Nils: "Bring coffee if you can. And the newspaper. I have read the old one twice."',
    rings: [{ x: 4332, y: 1172, r: 120, label: 'Skrova light' }],
  },
  {
    id: 'moskenes-storm', no: 5, name: 'Storm at Moskenes', place: 'Moskenes', goal: 'rescue',
    weather: 'storm', par: 240, reward: 320, gold: 240, silver: 320,
    briefing: 'A storm has cut Moskenes off. A family is waiting on the breakwater. Fly through the gusts and bring them home.',
    person: 'Liv Hansen: "Gusts to thirty knots. Hold her steady and do not fight the wind — ride it."',
    rings: [{ x: 942, y: 3002, r: 140, label: 'Moskenes breakwater' }],
  },
  {
    id: 'nusfjord-net', no: 6, name: 'The Nusfjord Net', place: 'Nusfjord', goal: 'rescue',
    weather: 'fog', par: 210, reward: 260, gold: 210, silver: 280,
    briefing: 'A fisherman is hurt on his boat in the fog off Nusfjord. The fog is thick — trust the instruments, not your eyes.',
    person: 'Dr Ingrid Dahl: "He has a broken arm and a calm head. Follow the compass, I will talk you in."',
    rings: [{ x: 2297, y: 2025, r: 130, label: 'Fishing boat in the fog' }],
  },
  {
    id: 'vaeroy-mail', no: 7, name: 'Mail Run to Værøy', place: 'Værøy', goal: 'drop',
    weather: 'breeze', par: 260, reward: 260, gold: 260, silver: 340,
    briefing: 'Værøy has had no mail for a week. Drop the mailbag on the quay — the islanders are waiting with coffee.',
    person: 'Liv Hansen: "Mind the crosswind on the way down the chain. Værøy is a long way south."',
    rings: [{ x: 1029, y: 3279, r: 130, label: 'Værøy quay' }],
  },
  {
    id: 'glacier-watch', no: 8, name: 'Glacier Watch on Austvågøya', place: 'Austvågøya', goal: 'survey',
    weather: 'clear', par: 240, reward: 280, gold: 240, silver: 320,
    briefing: 'Survey the glacier tongues above Austvågøya. Fly each ring in order — stay above 500 feet over the rock.',
    person: 'Erik Solberg: "The peaks run near nine hundred feet. Keep your altitude and your wits."',
    rings: [
      { x: 3200, y: 900, r: 130, label: 'Glacier West' },
      { x: 3500, y: 780, r: 130, label: 'Glacier Middle' },
      { x: 3820, y: 940, r: 130, label: 'Glacier East' },
    ],
  },
  {
    id: 'ballstad-medevac', no: 9, name: 'Night Medevac from Ballstad', place: 'Ballstad', goal: 'rescue',
    weather: 'night', par: 230, reward: 340, gold: 230, silver: 300,
    briefing: 'A heart patient waits at Ballstad in the dark. Fly by instruments, land on the lit water and bring him in.',
    person: 'Dr Ingrid Dahl: "I am on board with you. Slow, lit and steady — we have one patient, not two."',
    rings: [{ x: 2478, y: 1992, r: 130, label: 'Ballstad, patient waiting' }],
  },
  {
    id: 'bakery-aa', no: 10, name: 'The Å Bakery Run', place: 'Å', goal: 'drop',
    weather: 'dawn', par: 280, reward: 280, gold: 280, silver: 360,
    briefing: 'The bakery at Å needs flour before the morning bake. Drop it on the quay at the end of the world.',
    person: 'Liv Hansen: "Å is the last stop on the chain. The bakers will pay you in cinnamon buns."',
    rings: [{ x: 408, y: 2548, r: 130, label: 'Å bakery quay' }],
  },
  {
    id: 'whale-andenes', no: 11, name: 'Whale Watch off the Coast', place: 'Open sea', goal: 'survey',
    weather: 'clear', par: 260, reward: 300, gold: 260, silver: 340,
    briefing: 'Whales are feeding off the coast. Fly the survey line and photograph the pods — low and slow over the sea.',
    person: 'Liv Hansen: "Three pods reported. Keep her low, keep her slow, and do not scare them."',
    rings: [
      { x: 500, y: 1800, r: 140, label: 'Pod One' },
      { x: 700, y: 1400, r: 140, label: 'Pod Two' },
      { x: 1000, y: 1100, r: 140, label: 'Pod Three' },
    ],
  },
  {
    id: 'flakstad-fire', no: 12, name: 'Fire on Flakstad', place: 'Flakstad', goal: 'scoop',
    weather: 'clear', par: 280, reward: 360, gold: 280, silver: 360,
    briefing: 'A boathouse is burning at Flakstad. Scoop water from the sea — low and slow over open water — then drop it on the fire.',
    person: 'Erik Solberg: "Scoop at sixty knots, skimming the waves. Then climb, turn, and put the water on the smoke."',
    rings: [
      { x: 1385, y: 2597, r: 150, label: 'Scoop water here' },
      { x: 2085, y: 2365, r: 140, label: 'Fire at Flakstad' },
    ],
  },
  {
    id: 'kabelvag-choir', no: 13, name: 'The Kabelvåg Choir', place: 'Kabelvåg', goal: 'tour',
    weather: 'clear', par: 240, reward: 300, gold: 240, silver: 320,
    briefing: 'The choir must sing in Svolvær tonight. Pick them up at Kabelvåg, fly them gentle — no hard turns — and land at home water.',
    person: 'Liv Hansen: "Twelve singers and one very nervous conductor. Fly it like glass."',
    rings: [
      { x: 3320, y: 1330, r: 130, label: 'Pick up the choir' },
      { x: 3973, y: 1533, r: 130, label: 'Land at Svolvær' },
    ],
  },
  {
    id: 'icing-test', no: 14, name: 'Ice on the Fjord', place: 'Svolvær fjord', goal: 'survey',
    weather: 'icing', par: 220, reward: 320, gold: 220, silver: 300,
    briefing: 'Test flight in icing cloud. Fly the three rings and watch the wings — ice costs you lift, and lift is everything.',
    person: 'Erik Solberg: "If she starts to feel heavy, climb out of the cloud. The de-ice boots are in the hangar, not on her yet."',
    rings: [
      { x: 3300, y: 1000, r: 130, label: 'Icing Ring One' },
      { x: 3600, y: 850, r: 130, label: 'Icing Ring Two' },
      { x: 3900, y: 1000, r: 130, label: 'Icing Ring Three' },
    ],
  },
  {
    id: 'aurora-hamnoy', no: 15, name: 'Aurora over Hamnøy', place: 'Hamnøy', goal: 'photo',
    weather: 'aurora', par: 260, reward: 340, gold: 260, silver: 340,
    briefing: 'The aurora is out over Hamnøy. Hold inside the ring for eight seconds and let the camera drink the sky.',
    person: 'Liv Hansen: "Green ribbons from horizon to horizon. Keep her steady in the ring and do not look up too long."',
    rings: [{ x: 1600, y: 2600, r: 200, label: 'Hold here for the photograph', holdSeconds: 8 }],
  },
  {
    id: 'rost-rescue', no: 16, name: 'The Røst Rescue', place: 'Røst', goal: 'rescue',
    weather: 'breeze', par: 320, reward: 420, gold: 320, silver: 420,
    briefing: 'A crew is stranded on Røst, the far end of the chain. It is a long flight — watch your fuel, and mind the sea all the way.',
    person: 'Liv Hansen: "Røst is as far as we fly. Full tanks, steady throttle, and do not hurry the return."',
    rings: [{ x: 674, y: 3364, r: 130, label: 'Stranded crew on Røst' }],
  },
  {
    id: 'leknes-blizzard', no: 17, name: 'Blizzard at Leknes', place: 'Leknes', goal: 'rescue',
    weather: 'blizzard', par: 260, reward: 400, gold: 260, silver: 340,
    briefing: 'A blizzard has closed Leknes. A snowplough driver is stuck on the road to the airfield. Bring him in through the white.',
    person: 'Dr Ingrid Dahl: "You will see nothing but snow. Trust the compass and the altimeter. I will count the seconds with you."',
    rings: [{ x: 2546, y: 2208, r: 140, label: 'Snowplough driver' }],
  },
  {
    id: 'midnight-sun-run', no: 18, name: 'The Midnight Sun Run', place: 'The whole chain', goal: 'tour',
    weather: 'dawn', par: 420, reward: 600, gold: 420, silver: 540,
    briefing: 'The grand tour: five rings from Å to Svolvær, one dawn, one aeroplane. Fly the whole chain and land at home water.',
    person: 'Liv Hansen: "Eighteen sorties brought you here. Five rings, one sunrise, and the whole of Lofoten below you."',
    rings: [
      { x: 700, y: 2760, r: 130, label: 'Å' },
      { x: 1760, y: 2040, r: 130, label: 'Flakstad' },
      { x: 2460, y: 1500, r: 130, label: 'Ballstad' },
      { x: 3160, y: 1340, r: 130, label: 'Henningsvær' },
      { x: 3973, y: 1533, r: 130, label: 'Svolvær — land here' },
    ],
  },
];

export function sortieById(id) {
  return SORTIES.find((s) => s.id === id);
}

export function sortieByNo(no) {
  return SORTIES.find((s) => s.no === no);
}
