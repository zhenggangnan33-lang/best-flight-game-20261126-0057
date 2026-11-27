// The screenshot scenes behind ?shot=title|flight|landing|debrief.
// Each one plays the real rules forward from a fresh world for a fixed
// number of steps, steered by a simple autopilot, so the frame is what
// a real flight looks like and the same seed always gives the same frame.

import { SORTIES } from './config.js';
import { buildWorld, ringAhead, terrainHeight } from './terrain.js';
import { createPlane, stepPlane } from './plane.js';
import { createRun, updateRun } from './missions.js';
import { modifiersFor } from './refits.js';
import { createCareer, checkFeats } from './feats.js';

const STEP = 1 / 60;
const TITLE_SECONDS = 6;
const FLIGHT_SECONDS = 42;
const LANDING_LIMIT = 420;
const DEBRIEF_LIMIT = 420;

// The autopilot: hold 120 ft/s, steer at the next ring or the landing
// water, climb over rock ahead, flare low over the water. Exported so
// a headless test can fly any sortie with the same pilot.
export function autopilot(plane, world, run, t) {
  const input = { throttleUp: false, throttleDown: false, pitchUp: false, pitchDown: false, flaps: false };
  // On the water, cut the power and roll out: the landing counts when
  // she slows below 60 ft/s inside the buoys, and a pilot who keeps
  // the throttle up taxis straight past them.
  if (plane.onWater) {
    input.throttleDown = true;
    return input;
  }
  const ring = ringAhead(world);
  const ringsDone = !ring;
  const targetSpeed = ringsDone ? 80 : 120;
  if (plane.speed < targetSpeed - 6) input.throttleUp = true;
  if (plane.speed > targetSpeed + 8) input.throttleDown = true;

  let wantAlt;
  if (ringsDone) {
    // Final approach: ride a steady glideslope down to the water, so
    // the plane arrives slow and low instead of diving at the buoys.
    // Inside the last stretch, aim twenty feet under the water: the
    // plane keeps a gentle sink all the way in instead of levelling
    // off above the swell and flying past the buoys.
    const distToZone = world.landing.x0 - plane.x;
    if (plane.x >= world.landing.x0 - 200 && plane.y < 160) {
      wantAlt = -20;
      input.throttleDown = plane.speed > 70;
    } else {
      wantAlt = 26 + Math.max(0, distToZone) * 0.35;
      wantAlt = Math.min(wantAlt, plane.y + 40);
    }
    if (plane.y < 200 && !plane.flaps) input.flaps = true;
  } else {
    // Fly the altitude, not the point: stay above the rock ahead with
    // room to spare, then settle onto the ring's height. A fjord wall
    // rises faster than the wing can climb, so the climb starts early.
    // The clearance reads the highest rock in the next 700 ft, not one
    // sample: a single low sample can hide a ridge shoulder.
    let rockAhead = 0;
    for (let ax = plane.x + 100; ax <= plane.x + 700; ax += 100) {
      rockAhead = Math.max(rockAhead, terrainHeight(world, ax));
    }
    wantAlt = Math.max(ring.y, rockAhead + 130);
    if (plane.y < rockAhead + 60) wantAlt = Math.max(wantAlt, plane.y + 120);
  }
  let wantPitch = Math.atan2(wantAlt - plane.y, 300);
  wantPitch = Math.max(-0.5, Math.min(0.55, wantPitch));
  if (plane.pitch < wantPitch - 0.02) input.pitchUp = true;
  if (plane.pitch > wantPitch + 0.02) input.pitchDown = true;
  return input;
}

function flyForward(world, plane, run, seconds, stopWhen) {
  let t = 0;
  const signals = [];
  for (let i = 0; i < seconds / STEP; i += 1) {
    const input = autopilot(plane, world, run, t);
    const events = stepPlane(plane, input, STEP, world, run.mods, t);
    signals.push(...updateRun(run, events, plane, world, STEP));
    t += STEP;
    if (stopWhen && stopWhen(run, plane)) break;
  }
  return { t, signals };
}

// Set the world to the named scene and return what the renderer needs.
export function stageShot(name) {
  const sortie = SORTIES[1]; // Trollfjord Thread: cliffs, rings, a story.
  const mods = modifiersFor([]);
  const world = buildWorld(sortie);
  const plane = createPlane(sortie, mods);
  const run = createRun(sortie, mods);
  plane.throttle = 55;
  plane.y = 420;

  if (name === 'flight') {
    // Fly until the next ring is just in frame, so the shot shows the
    // gold ring ahead the bounty asks for, not empty sky.
    const { t } = flyForward(world, plane, run, FLIGHT_SECONDS, (r, p) => {
      const next = ringAhead(world);
      return next !== null && next.x - p.x < 450 && next.x > p.x;
    });
    return { screen: 'play', world, plane, run, t };
  }
  if (name === 'landing') {
    const { t } = flyForward(world, plane, run, LANDING_LIMIT, (r, p) => r.state === 'landed' || p.onWater);
    // Settle on the water a moment so the spray shows.
    for (let i = 0; i < 40; i += 1) {
      const events = stepPlane(plane, { throttleUp: false, throttleDown: true, pitchUp: false, pitchDown: false, flaps: false }, STEP, world, mods, t);
      updateRun(run, events, plane, world, STEP);
    }
    return { screen: 'play', world, plane, run, t };
  }
  if (name === 'debrief') {
    const { signals } = flyForward(world, plane, run, DEBRIEF_LIMIT, (r) => r.state === 'landed' || r.state === 'done' || r.state === 'crashed');
    const career = createCareer();
    const earned = checkFeats(career, signals, {
      sortieId: sortie.id, from: sortie.from, to: sortie.to,
      finished: run.state === 'landed' || run.state === 'done', medal: run.medal,
    });
    return { screen: 'debrief', world, plane, run, t: run.time, earned };
  }
  // Title: a quiet moment over the harbour before the first sortie.
  flyForward(world, plane, run, TITLE_SECONDS);
  return { screen: 'title', world, plane, run, t: TITLE_SECONDS };
}
