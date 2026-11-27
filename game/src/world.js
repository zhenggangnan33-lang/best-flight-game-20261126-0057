// The flight model and the sortie engine. A Beaver floatplane flies the Lofoten
// chain in knots and feet: throttle sets the speed the wing aims at, turning is
// tighter slow than fast, the wing stalls below its stall speed, fuel burns with
// throttle, and the land below is real — fly into a mountain and the sortie ends.
// A sortie is a list of rings; each ring's goal (rescue, drop, survey, scoop,
// photo, tour) says how it is flown, and the last ring says how the sortie ends.

import { PLANE, STEP, MEDAL_BONUS, WORLD } from './config.js';
import { WEATHER, BASES } from './places.js';
import { terrainHeightAt, isWater, islandAt, nearestBase } from './terrain.js';
import { refitModifiers } from './refits.js';
import { checkFeats } from './feats.js';

export const EVENT_RING = 1;
export const EVENT_COMPLETE = 2;
export const EVENT_FAILED = 4;
export const EVENT_LAND = 8;
export const EVENT_TAKEOFF = 16;
export const EVENT_DAMAGE = 32;
export const EVENT_FUEL_LOW = 64;
export const EVENT_FEAT = 128;

/** World units crossed per second by one knot of airspeed. */
const KT = 0.55;

const TWO_PI = Math.PI * 2;

function clamp(value, min, max) {
  return value < min ? min : value > max ? value : value;
}

function angleTo(fromX, fromY, toX, toY) {
  return Math.atan2(toY - fromY, toX - fromX);
}

function angleDiff(a, b) {
  let d = (b - a) % TWO_PI;
  if (d > Math.PI) d -= TWO_PI;
  if (d < -Math.PI) d += TWO_PI;
  return d;
}

export function createFlight(random, save) {
  const modifiers = refitModifiers(save.refits);
  const maxFuel = 100 + modifiers.fuelBonus;
  const maxSpeed = PLANE.maxSpeed + modifiers.maxSpeedBonus;
  const stallSpeed = PLANE.stallSpeed + modifiers.stallBonus;

  const state = {
    plane: {
      x: BASES[0].x, y: BASES[0].y, heading: BASES[0].heading,
      speed: 0, alt: 0, vspeed: 0, throttle: 0,
      fuel: maxFuel, damage: 0, grounded: true, groundType: 'water',
      ice: 0, scooped: false,
    },
    weather: WEATHER.clear,
    timeOfDay: 11,
    wind: { from: 320, kt: 6 },
    clouds: [],
    stormCells: [],
    sortie: null,
    phase: 'idle',
    elapsed: 0,
    ringIndex: 0,
    ringHold: 0,
    message: '',
    messageTime: 0,
    result: null,
    failReason: '',
    fuelLowWarned: false,
    stormWarned: false,
    islandsSeen: new Set(),
    visitedBase: new Set(),
  };

  for (let i = 0; i < 14; i += 1) {
    state.clouds.push({
      x: random() * WORLD.width, y: random() * WORLD.height,
      r: 120 + random() * 220, speed: 4 + random() * 8,
    });
  }

  function setMessage(text, seconds = 4) {
    state.message = text;
    state.messageTime = seconds;
  }

  function placeStormCells() {
    state.stormCells = [];
    if (!state.weather.storm) return;
    for (let i = 0; i < 3; i += 1) {
      state.stormCells.push({
        x: 900 + random() * 3000, y: 600 + random() * 2000, r: 380 + random() * 160,
      });
    }
  }

  function startSortie(def) {
    const weather = WEATHER[def.weather] || WEATHER.clear;
    state.weather = weather;
    state.timeOfDay = weather.night ? 23.2 : weather.label === 'Dawn' ? 6.4 : 11;
    state.wind = { from: weather.windFrom, kt: weather.windKt };
    const home = BASES[0];
    state.plane = {
      x: home.x, y: home.y, heading: home.heading,
      speed: 0, alt: 0, vspeed: 0, throttle: 0,
      fuel: maxFuel, damage: 0, grounded: true, groundType: 'water',
      ice: 0, scooped: false,
    };
    state.sortie = def;
    state.phase = 'flying';
    state.elapsed = 0;
    state.ringIndex = 0;
    state.ringHold = 0;
    state.result = null;
    state.failReason = '';
    state.fuelLowWarned = false;
    state.stormWarned = false;
    state.islandsSeen = new Set();
    placeStormCells();
    setMessage(`${def.name} — ${def.briefing}`, 6);
    return state;
  }

  function currentRing() {
    if (!state.sortie) return null;
    return state.sortie.rings[state.ringIndex] || null;
  }

  function ringComplete(rule) {
    const ring = currentRing();
    if (!ring) return false;
    const p = state.plane;
    const d = Math.hypot(ring.x - p.x, ring.y - p.y);
    if (d > ring.r) {
      state.ringHold = 0;
      return false;
    }
    if (rule === 'fly') return p.alt < 1200;
    if (rule === 'rescue') {
      if (modifiers.winch) return p.alt < 220 && p.speed < 95;
      return p.grounded && p.speed < 40;
    }
    if (rule === 'drop') {
      // A water drop is dropped from the air; on a fire sortie the tanks must
      // actually be full, or the plane is dropping nothing.
      const needsWater = state.sortie && state.sortie.goal === 'scoop';
      return !p.grounded && p.alt >= 100 && p.alt <= 420 && p.speed < 110 && (!needsWater || p.scooped);
    }
    if (rule === 'scoop') return p.grounded && p.groundType === 'water' && p.speed < 70;
    if (rule === 'photo') {
      if (p.alt > 800) {
        state.ringHold = 0;
        return false;
      }
      state.ringHold += STEP;
      return state.ringHold >= (ring.holdSeconds || 8);
    }
    if (rule === 'land') return p.grounded;
    return false;
  }

  function advanceRing() {
    state.ringIndex += 1;
    state.ringHold = 0;
    const next = currentRing();
    if (next) setMessage(`Next: ${next.label}`, 4);
  }

  function finishSortie() {
    const def = state.sortie;
    const time = state.elapsed;
    const medal = time <= def.gold ? 'gold' : time <= def.silver ? 'silver' : 'bronze';
    let credits = def.reward + MEDAL_BONUS[medal] + modifiers.rescueBonus;
    if (def.goal === 'photo' && modifiers.camera) credits *= 2;
    if (def.id === 'kabelvag-choir' && modifiers.seats) credits += 60;
    credits = Math.round(credits);
    const p = state.plane;
    const stats = save.stats;
    stats.sortiesDone += 1;
    if (!stats.done.includes(def.id)) stats.done.push(def.id);
    if (medal === 'gold') stats.goldMedals += 1;
    if (def.goal === 'rescue') stats.soulsRescued += 2;
    if (def.weather === 'fog') stats.fogSorties += 1;
    if (def.weather === 'icing') stats.icingSorties += 1;
    if (p.damage === 0) stats.cleanSorties += 1;
    if (p.fuel > maxFuel * 0.5) stats.fuelSaverLandings += 1;
    if (state.weather.night && p.grounded) stats.nightLandings += 1;
    const margin = Math.round(def.gold - time);
    if (stats.bestMargin === 0 || margin < stats.bestMargin) stats.bestMargin = margin;
    for (const island of state.islandsSeen) {
      if (!stats.islandsVisitedList) stats.islandsVisitedList = [];
      if (!stats.islandsVisitedList.includes(island)) stats.islandsVisitedList.push(island);
    }
    stats.islandsVisited = (stats.islandsVisitedList || []).length;
    stats.refitsOwned = save.refits.length;
    const best = save.bestTimes[def.id];
    if (!best || time < best) save.bestTimes[def.id] = Math.round(time);
    const held = save.medals[def.id];
    const rank = { gold: 3, silver: 2, bronze: 1 }[medal];
    if (!held || rank > { gold: 3, silver: 2, bronze: 1 }[held]) save.medals[def.id] = medal;
    save.credits += credits;
    const newFeats = checkFeats(stats, save.feats);
    for (const feat of newFeats) save.feats.push(feat.id);
    stats.featsEarned = save.feats.length;
    state.result = { sortieId: def.id, name: def.name, time: Math.round(time), medal, credits, damage: Math.round(p.damage), fuelLeft: Math.round(p.fuel), newFeats };
    state.phase = 'done';
    return state.result;
  }

  function failSortie(reason) {
    state.failReason = reason;
    state.phase = 'failed';
    setMessage(reason, 6);
  }

  function step(dt, control) {
    let events = 0;
    if (state.phase === 'idle') return events;
    if (state.phase === 'done' || state.phase === 'failed') return events;

    const p = state.plane;
    const w = state.weather;
    state.elapsed += dt;
    if (state.messageTime > 0) state.messageTime -= dt;

    // Throttle and speed.
    if (p.fuel <= 0) p.throttle = 0;
    else p.throttle = clamp(p.throttle + control.throttle * dt * 0.9, 0, 1);
    const icePenalty = 1 - (p.ice / 100) * 0.3;
    // The throttle sets the speed the wing aims at; airborne, the wing glides at
    // 60 knots even with the throttle closed. On the water it only goes as fast
    // as the throttle pushes it.
    const targetSpeed = p.grounded
      ? p.throttle * maxSpeed * icePenalty
      : (60 + p.throttle * (maxSpeed - 60)) * icePenalty;
    const accelRate = p.grounded ? PLANE.accel * 0.6 : PLANE.accel;
    p.speed += clamp(targetSpeed - p.speed, -accelRate * dt, accelRate * dt);
    if (p.speed < 0) p.speed = 0;

    // Turning: tighter slow, wider fast; a stalled wing barely answers.
    const stalled = !p.grounded && p.speed < stallSpeed;
    const turnFactor = clamp(1.5 - p.speed / maxSpeed, 0.7, 1.5) * (stalled ? 0.5 : 1);
    p.heading += control.turn * (PLANE.turnRate * Math.PI / 180) * turnFactor * dt;

    // Altitude: throttle above half climbs, below half descends; a stalled wing
    // sinks whatever the throttle says.
    if (p.grounded) {
      p.alt = 0;
      p.vspeed = 0;
      if (p.speed >= 75 && p.throttle >= 0.5) {
        p.grounded = false;
        events |= EVENT_TAKEOFF;
        setMessage('Airborne — gear up, flaps up.', 3);
      }
    } else {
      let vs;
      if (stalled) vs = -PLANE.sinkRate * (1.2 - p.speed / stallSpeed);
      else vs = (p.throttle - 0.5) * PLANE.vsScale;
      p.alt += vs * dt;
      if (p.alt < 0) p.alt = 0;
      p.vspeed = vs;
      // Touchdown: water below 20 ft and slow enough lands; too fast skips off the
      // waves; snow takes the plane only with skis fitted. Rock takes it always.
      const height = terrainHeightAt(p.x, p.y);
      if (p.alt <= 20 && height <= 0) {
        if (p.speed <= 100) {
          const sink = -p.vspeed;
          p.grounded = true;
          p.groundType = 'water';
          p.alt = 0;
          p.vspeed = 0;
          events |= EVENT_LAND;
          if (sink > 260) {
            p.damage += modifiers.floats ? 7 : 15;
            events |= EVENT_DAMAGE;
            setMessage('Hard landing — the floats took a knock.', 3);
          } else if (sink < 80 && p.speed < 75) {
            save.stats.perfectLandings += 1;
            setMessage('A perfect touchdown.', 3);
          }
        } else {
          p.alt = 24;
          p.vspeed = 0;
          p.damage += 4;
          events |= EVENT_DAMAGE;
          setMessage('Skipped across the waves — slow down to land.', 3);
        }
      } else if (p.alt <= 20 && height > 0 && height < 300 && modifiers.skis && p.speed <= 80) {
        p.grounded = true;
        p.groundType = 'snow';
        p.alt = 0;
        p.vspeed = 0;
        events |= EVENT_LAND;
        setMessage('Down on the snow — skis holding.', 3);
      } else if (p.alt < height) {
        p.damage = 100;
        failSortie(`Crashed into the mountains at ${Math.round(height)} feet.`);
        return events | EVENT_FAILED;
      }
    }

    // Position: airspeed along the heading, plus the wind's drift.
    const windAngle = ((w.windFrom + 180 - 90) * Math.PI) / 180;
    const drift = modifiers.autopilot ? 0.5 : 1;
    const windX = Math.cos(windAngle) * w.windKt * KT * drift;
    const windY = Math.sin(windAngle) * w.windKt * KT * drift;
    p.x += (Math.cos(p.heading) * p.speed * KT + windX) * dt;
    p.y += (Math.sin(p.heading) * p.speed * KT + windY) * dt;
    p.x = clamp(p.x, 40, WORLD.width - 40);
    p.y = clamp(p.y, 40, WORLD.height - 40);

    // Fuel and damage.
    p.fuel = Math.max(0, p.fuel - p.throttle * PLANE.fuelBurn * dt);
    if (p.fuel < 20 && !state.fuelLowWarned) {
      state.fuelLowWarned = true;
      events |= EVENT_FUEL_LOW;
      setMessage('Fuel low — head for a base.', 4);
    }
    if (w.icing && !p.grounded && p.alt > 600) {
      if (modifiers.deice) p.ice = 0;
      else p.ice = Math.min(100, p.ice + 3 * dt);
    } else if (p.ice > 0) {
      p.ice = Math.max(0, p.ice - 2 * dt);
    }
    // Storm cells: turbulence and damage inside one.
    for (const cell of state.stormCells) {
      if (Math.hypot(cell.x - p.x, cell.y - p.y) < cell.r && !p.grounded) {
        p.heading += (random() - 0.5) * 0.24 * dt;
        p.damage += PLANE.stormDamage * dt;
        save.stats.stormsFlown = 1;
        if (!state.stormWarned) {
          state.stormWarned = true;
          setMessage('Inside a storm cell — hold her steady!', 3);
        }
      }
    }
    if (p.damage >= 100) {
      p.damage = 100;
      failSortie('The Beaver is too damaged to fly.');
      return events | EVENT_FAILED;
    }

    // Refuel on the water beside a base.
    if (p.grounded) {
      const base = nearestBase(p.x, p.y);
      if (base && Math.hypot(base.x - p.x, base.y - p.y) < 220) {
        const rate = modifiers.fastRefuel ? 50 : 25;
        p.fuel = Math.min(maxFuel, p.fuel + rate * dt);
        if (p.fuel >= maxFuel && !state.visitedBase.has(base.id)) {
          state.visitedBase.add(base.id);
        }
      }
    }

    // Islands flown over, for the All Islands feat.
    const island = islandAt(p.x, p.y);
    if (island) state.islandsSeen.add(island.name);

    // The sortie's rings.
    if (state.sortie) {
      const def = state.sortie;
      const ring = currentRing();
      if (ring) {
        const isLast = state.ringIndex === def.rings.length - 1;
        const rule = def.goal === 'tour' && isLast ? 'land'
          : def.goal === 'tour' ? 'fly'
          : def.goal === 'survey' ? 'fly'
          : def.goal === 'scoop' && state.ringIndex > 0 ? 'drop'
          : def.goal;
        let done = false;
        if (rule === 'rescue' || rule === 'drop' || rule === 'scoop') {
          if (control.action && ringComplete(rule)) done = true;
        } else if (ringComplete(rule)) {
          done = true;
        }
        if (done) {
          if (def.goal === 'scoop' && state.ringIndex === 0) {
            p.scooped = true;
            setMessage('Water aboard — now put it on the fire.', 4);
            advanceRing();
            events |= EVENT_RING;
          } else if (def.goal === 'rescue') {
            setMessage('Souls aboard — well flown.', 3);
            advanceRing();
            events |= EVENT_RING;
          } else {
            advanceRing();
            events |= EVENT_RING;
          }
          if (state.ringIndex >= def.rings.length) {
            finishSortie();
            events |= EVENT_COMPLETE;
            const newFeats = state.result.newFeats;
            if (newFeats.length > 0) events |= EVENT_FEAT;
          }
        }
      }
    }
    return events;
  }

  return {
    state,
    startSortie,
    step,
    currentRing,
    modifiers,
    maxFuel,
    maxSpeed,
    stallSpeed,
  };
}
