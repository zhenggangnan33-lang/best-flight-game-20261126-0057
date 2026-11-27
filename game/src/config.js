// Aurora Squadron — every tuning number and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window. The world is a 4800x3200 map of the Lofoten archipelago (sea level 0,
// mountain peaks to 1100 ft); the plane flies in knots and feet.

export const FIELD = { width: 1280, height: 720 };
export const WORLD = { width: 4800, height: 3200 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display rate. */
export const STEP = 1 / 60;

export const PLANE = {
  /** Cruise speed the throttle aims at, knots. Refits raise it. */
  cruiseSpeed: 110,
  maxSpeed: 150,
  /** Below this speed the wing stops flying and the plane sinks. */
  stallSpeed: 48,
  /** How fast speed chases the throttle target, per second. */
  accel: 22,
  /** Turn rate at cruise, degrees per second; slower flight turns tighter. */
  turnRate: 34,
  /** Feet per second of climb or descent at full throttle either way. */
  vsScale: 650,
  /** Feet per second lost in a stall. */
  sinkRate: 320,
  /** Altitude the autopilot cruises at, feet. */
  cruiseAlt: 1100,
  /** Fuel burned at full throttle, percent per second. */
  fuelBurn: 0.34,
  /** Damage taken per second inside a storm cell, and on a hard landing. */
  stormDamage: 2.2,
};

export const FUEL = { base: 100, refillSeconds: 4 };

/** How many credits a gold medal is worth on top of the sortie reward. */
export const MEDAL_BONUS = { gold: 120, silver: 60, bronze: 25 };

export const PALETTE = {
  skyDay: '#7fb2d9',
  skyDusk: '#e88a5a',
  skyNight: '#0b1026',
  seaDay: '#2e6f8e',
  seaDeep: '#1d4a63',
  seaNight: '#0e2438',
  sand: '#d9c48f',
  grass: '#5d7d4a',
  rock: '#6b6f78',
  snow: '#eef3f6',
  pine: '#2f4d33',
  villageLight: '#ffd27a',
  planeRed: '#c8402f',
  planeWhite: '#f2ede2',
  planeTrim: '#1d3557',
  ring: '#ffd23f',
  ringInner: '#ff9f1c',
  hudPanel: 'rgba(10, 18, 32, 0.72)',
  hudText: '#eef4f8',
  hudAmber: '#ffb703',
  hudGreen: '#7ddb8a',
  hudRed: '#ff6b5e',
  aurora1: '#5eead4',
  aurora2: '#a3e635',
  aurora3: '#818cf8',
  cloud: 'rgba(255, 255, 255, 0.55)',
  fog: 'rgba(210, 220, 230, 0.35)',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where progress is kept between visits (this browser only). */
export const SAVE_KEY = 'aurora-squadron.save.v1';
export const BEST_KEY = 'aurora-squadron.best.v1';

/** The camera shows this many world units across the 1280-wide logical field. */
export const CAMERA_WIDTH = 1500;
