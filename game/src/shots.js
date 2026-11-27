// The autopilot and the screenshot scenes behind ?shot=start|play|night|end.
// The autopilot flies the real rules: it steers for the ring, holds an altitude
// with a throttle controller, climbs out of a mountain's way, and lands or drops
// when the sortie asks. Each scene plays the rules forward from a fresh flight
// for a fixed time, steered by that pilot, so the frame is what a real game
// looks like and the same seed always gives the same frame.

import { STEP, PLANE } from './config.js';
import { terrainHeightAt } from './terrain.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_DEBRIEF } from './render.js';
import { EVENT_COMPLETE, EVENT_FAILED } from './world.js';

const TWO_PI = Math.PI * 2;

function angleDiff(a, b) {
  let d = (b - a) % TWO_PI;
  if (d > Math.PI) d -= TWO_PI;
  if (d < -Math.PI) d += TWO_PI;
  return d;
}

function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}

/**
 * Fly one step: returns { throttle: -1|0|1, turn: -1|0|1, action: boolean }.
 * The throttle is incremental — the pilot asks for more or less, and the wing
 * answers at its own rate.
 */
export function autopilot(flight) {
  const state = flight.state;
  const p = state.plane;
  const ring = flight.currentRing();
  const out = { throttle: 0, turn: 0, action: false };
  if (!state.sortie || state.phase !== 'flying' || !ring) return out;
  const def = state.sortie;
  const isLast = state.ringIndex === def.rings.length - 1;
  const landingGoal = (def.goal === 'rescue' && !flight.modifiers.winch)
    || (def.goal === 'tour' && isLast)
    || (def.goal === 'scoop' && state.ringIndex === 0);
  const dist = Math.hypot(ring.x - p.x, ring.y - p.y);

  // Where the pilot wants to be: an altitude for the phase, and a heading.
  // The landing descent only happens over water — over land the pilot stays
  // high and keeps approaching until the water is under the nose.
  const hereH = terrainHeightAt(p.x, p.y);
  const aheadX = p.x + Math.cos(p.heading) * 600;
  const aheadY = p.y + Math.sin(p.heading) * 600;
  const aheadH = terrainHeightAt(aheadX, aheadY);
  const waterAhead = hereH < 50 && aheadH < 50;
  let targetAlt = PLANE.cruiseAlt * 0.7;
  if (landingGoal && dist < 1200) {
    // The final approach aims below the water, or the altitude controller would
    // hold the plane above the waves forever and never let it touch down.
    if (waterAhead) targetAlt = dist < 150 ? -100 : dist < 300 ? 100 : 250;
    else targetAlt = PLANE.cruiseAlt * 0.7;
  } else if (def.goal === 'drop' && dist < 400) targetAlt = 280;
  else if (def.goal === 'photo' && dist < ring.r + 400) targetAlt = 300;
  else if (def.goal === 'survey' || def.goal === 'tour') targetAlt = 950;
  else if (dist < 250) targetAlt = 350;

  // Never fly into the land: keep 250 feet above the highest ground under the
  // nose or ahead of it, except on a final approach over water to a landing ring.
  const finalApproach = landingGoal && dist < 220 && waterAhead;
  if (!p.grounded && !finalApproach) {
    targetAlt = Math.max(targetAlt, Math.max(hereH, aheadH) + 250);
  }

  // A photograph and a water drop are flown slow and low, or the plane blows
  // straight through the ring and never gets the shot or the drop in. The
  // photograph slows down early, so the plane arrives already gentle. Both
  // caps only bite while the plane is above its target — never when the
  // terrain floor is asking it to climb out of a mountain's way.
  let wantThrottle = clamp(0.5 + (targetAlt - p.alt) / 900, 0, 1);
  const slowGoal = def.goal === 'photo' || def.goal === 'drop'
    || (def.goal === 'scoop' && state.ringIndex > 0);
  if (def.goal === 'photo' && dist < 1500 && p.alt > targetAlt + 50) {
    wantThrottle = Math.min(wantThrottle, 0.25);
  } else if (slowGoal && dist < 600 && p.alt > targetAlt + 50) {
    wantThrottle = Math.min(wantThrottle, 0.35);
  }
  // Taxiing to a landing ring stays slow, and inside the ring the pilot cuts
  // the throttle to a stop so the rescue or the scoop can happen.
  const inRing = dist < ring.r;
  const taxi = p.grounded && landingGoal && dist < ring.r + 60;
  const targetThrottle = p.grounded && inRing ? 0 : taxi ? 0.15 : p.grounded ? 1 : wantThrottle;
  out.throttle = p.throttle < targetThrottle - 0.05 ? 1 : p.throttle > targetThrottle + 0.05 ? -1 : 0;

  // Steering: for the ring, or around it when the photograph needs holding.
  let desired;
  if (def.goal === 'photo' && dist < ring.r) {
    desired = Math.atan2(ring.y - p.y, ring.x - p.x) + 1.2;
  } else {
    desired = Math.atan2(ring.y - p.y, ring.x - p.x);
  }
  const diff = angleDiff(p.heading, desired);
  out.turn = diff > 0.06 ? 1 : diff < -0.06 ? -1 : 0;

  // The action, when the ring's rule is met.
  if (dist < ring.r) {
    if (def.goal === 'rescue') {
      out.action = flight.modifiers.winch
        ? p.alt < 220 && p.speed < 95
        : p.grounded && p.speed < 40;
    } else if (def.goal === 'drop') {
      out.action = !p.grounded && p.alt >= 100 && p.alt <= 420 && p.speed < 110;
    } else if (def.goal === 'scoop' && state.ringIndex === 0) {
      out.action = p.grounded && p.speed < 70;
    } else if (def.goal === 'scoop') {
      out.action = !p.grounded && p.alt >= 100 && p.alt <= 420;
    }
  }
  return out;
}

/** Run the flight forward for `seconds` of game time, steered by the autopilot. */
function simulate(flight, seconds) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    const control = autopilot(flight);
    const events = flight.step(STEP, control);
    if (events & (EVENT_COMPLETE | EVENT_FAILED)) break;
  }
}

/**
 * Set the flight to the named scene (start, play, night, end; any other name is
 * start) and return the screen to draw and the debrief to show, if any.
 */
export function stageShot(name, flight, sorties) {
  if (name === 'play') {
    flight.startSortie(sorties[1]); // The Henningsvær Call, in daylight.
    simulate(flight, 38);
    return { screen: SCREEN_PLAY, debrief: null };
  }
  if (name === 'night') {
    flight.startSortie(sorties[8]); // Night medevac from Ballstad.
    simulate(flight, 34);
    return { screen: SCREEN_PLAY, debrief: null };
  }
  if (name === 'end') {
    flight.startSortie(sorties[0]); // First Light, flown to the finish.
    simulate(flight, 600);
    if (flight.state.phase === 'done' && flight.state.result) {
      return { screen: SCREEN_DEBRIEF, debrief: flight.state.result };
    }
    return { screen: SCREEN_PLAY, debrief: null };
  }
  // start: the title over the home base at dawn, the plane on the water.
  flight.startSortie(sorties[0]);
  flight.state.phase = 'idle';
  return { screen: SCREEN_TITLE, debrief: null };
}
