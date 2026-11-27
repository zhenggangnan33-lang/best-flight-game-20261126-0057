// Boot and the one loop: input is read every frame, the flight advances in fixed
// 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. The game moves between seven screens: title, play,
// paused, hangar, feats, debrief and failed.
//
// ?seed=N fixes the weather and clouds. ?shot=start|play|night|end (with
// &seed=N) stages that scene instead of running the loop, paints it twice and
// sets window.__shotReady for a screenshot. ?selftest=1 flies the first sortie
// with the autopilot and reports window.__selftest.

import { STEP } from './config.js';
import { createRandom } from './random.js';
import { SORTIES, sortieByNo } from './sorties.js';
import { REFITS } from './refits.js';
import { FEATS } from './feats.js';
import { createFlight, EVENT_COMPLETE, EVENT_FAILED, EVENT_RING, EVENT_LAND, EVENT_TAKEOFF, EVENT_DAMAGE, EVENT_FUEL_LOW } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_HANGAR, ACTION_FEATS, ACTION_BACK, createInput } from './input.js';
import { createRenderer, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_HANGAR, SCREEN_FEATS, SCREEN_DEBRIEF, SCREEN_FAILED } from './render.js';
import { stageShot, autopilot } from './shots.js';
import { loadSave, storeSave } from './save.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const selftest = params.get('selftest') === '1';
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const save = loadSave();
const flight = createFlight(createRandom(seed), save);
const renderer = createRenderer(canvas);

function nextSortie() {
  for (const sortie of SORTIES) {
    if (!save.stats.done.includes(sortie.id)) return sortie;
  }
  return SORTIES[0];
}

function runShot(name) {
  const staged = stageShot(name, flight, SORTIES);
  const ui = {
    save,
    nextSortie: nextSortie(),
    refits: REFITS,
    feats: FEATS,
    hangarIndex: 0,
    debrief: staged.debrief,
  };
  let painted = 0;
  function paint() {
    renderer.draw(flight.state, staged.screen, ui, 0);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runSelftest() {
  const result = { ok: false, sortie: null, medal: null, time: null, steps: 0, errors: [] };
  try {
    flight.startSortie(SORTIES[0]);
    const maxSteps = Math.floor(600 / STEP);
    for (let i = 0; i < maxSteps; i += 1) {
      const control = autopilot(flight);
      const events = flight.step(STEP, control);
      result.steps = i + 1;
      if (events & EVENT_COMPLETE) {
        result.ok = true;
        result.sortie = flight.state.result.sortieId;
        result.medal = flight.state.result.medal;
        result.time = flight.state.result.time;
        break;
      }
      if (events & EVENT_FAILED) {
        result.errors.push(flight.state.failReason || 'failed');
        break;
      }
    }
    if (!result.ok && result.errors.length === 0) result.errors.push('sortie did not finish in 600 s');
  } catch (error) {
    result.errors.push(String(error && error.message ? error.message : error));
  }
  window.__selftest = result;
  window.__shotReady = true;
  // Paint one frame so a screenshot shows the finished sortie.
  const ui = {
    save,
    nextSortie: nextSortie(),
    refits: REFITS,
    feats: FEATS,
    hangarIndex: 0,
    debrief: flight.state.result,
  };
  renderer.draw(flight.state, flight.state.phase === 'done' ? SCREEN_DEBRIEF : SCREEN_PLAY, ui, 0);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let hangarIndex = 0;
  let menuCooldown = 0;
  let debrief = null;
  let accumulator = 0;
  let last = performance.now();
  let time = 0;
  let frameActions = 0;

  // The title screen shows the home base at dawn, the Beaver on the water.
  flight.startSortie(SORTIES[0]);
  flight.state.phase = 'idle';

  // Screen readers (and anyone watching the page's text) hear the screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function ui() {
    return {
      save,
      nextSortie: nextSortie(),
      refits: REFITS,
      feats: FEATS,
      hangarIndex,
      debrief,
    };
  }

  function startSortie(sortie) {
    flight.startSortie(sortie);
    screen = SCREEN_PLAY;
    announce(`${sortie.name}. ${sortie.briefing}`);
  }

  function endSortie() {
    debrief = flight.state.result;
    screen = SCREEN_DEBRIEF;
    storeSave(save);
    const newFeats = debrief && debrief.newFeats.length > 0
      ? ` New feats: ${debrief.newFeats.map((f) => f.name).join(', ')}.`
      : '';
    announce(`Sortie complete. ${debrief.medal} medal, ${debrief.credits} credits.${newFeats}`);
  }

  function failSortie() {
    screen = SCREEN_FAILED;
    announce(`Sortie failed. ${flight.state.failReason}`);
  }

  function handleEvents(events) {
    if (events & EVENT_COMPLETE) endSortie();
    else if (events & EVENT_FAILED) failSortie();
    else if (events & EVENT_RING) announce('Ring complete. Next objective.');
    else if (events & EVENT_LAND) announce('Down on the water.');
    else if (events & EVENT_TAKEOFF) announce('Airborne.');
    else if (events & EVENT_DAMAGE) announce('Damage taken.');
    else if (events & EVENT_FUEL_LOW) announce('Fuel low.');
  }

  function buyRefit() {
    const refit = REFITS[hangarIndex];
    if (!refit) return;
    if (save.refits.includes(refit.id)) return;
    if (save.credits < refit.cost) {
      announce(`Not enough credits for ${refit.name}.`);
      return;
    }
    save.credits -= refit.cost;
    save.refits.push(refit.id);
    save.stats.refitsOwned = save.refits.length;
    storeSave(save);
    announce(`Bought ${refit.name}.`);
  }

  function handleActions(actions) {
    if (screen === SCREEN_TITLE) {
      if (actions & ACTION_CONFIRM) startSortie(nextSortie());
      else if (actions & ACTION_HANGAR) screen = SCREEN_HANGAR;
      else if (actions & ACTION_FEATS) screen = SCREEN_FEATS;
    } else if (screen === SCREEN_HANGAR) {
      if (actions & ACTION_CONFIRM) buyRefit();
      else if (actions & (ACTION_HANGAR | ACTION_BACK | ACTION_PAUSE)) screen = SCREEN_TITLE;
    } else if (screen === SCREEN_FEATS) {
      if (actions & (ACTION_FEATS | ACTION_BACK | ACTION_PAUSE)) screen = SCREEN_TITLE;
    } else if (screen === SCREEN_DEBRIEF) {
      if (actions & ACTION_CONFIRM) startSortie(nextSortie());
      else if (actions & ACTION_HANGAR) screen = SCREEN_HANGAR;
      else if (actions & ACTION_FEATS) screen = SCREEN_FEATS;
    } else if (screen === SCREEN_FAILED) {
      if (actions & ACTION_CONFIRM) startSortie(flight.state.sortie || SORTIES[0]);
    } else if (screen === SCREEN_PAUSED) {
      if (actions & (ACTION_PAUSE | ACTION_CONFIRM)) {
        screen = SCREEN_PLAY;
        announce('Flying.');
      }
    } else if (screen === SCREEN_PLAY) {
      if (actions & ACTION_PAUSE) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      }
    }
  }

  function handleMenus(dt) {
    if (screen !== SCREEN_HANGAR) return;
    menuCooldown -= dt;
    if (menuCooldown > 0) return;
    const dir = input.throttle();
    if (dir !== 0) {
      hangarIndex = (hangarIndex + (dir > 0 ? 1 : -1) + REFITS.length) % REFITS.length;
      menuCooldown = 0.18;
    }
  }

  function step() {
    if (screen === SCREEN_PLAY) {
      // Space is both the menu confirm and the in-flight action; the frame reads
      // the presses once, and the step below uses the same reading.
      const control = {
        throttle: input.throttle(),
        turn: input.turn(),
        action: Boolean(frameActions & ACTION_CONFIRM),
      };
      frameActions &= ~ACTION_CONFIRM; // one press, one action
      handleEvents(flight.step(STEP, control));
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    time += dt;
    frameActions = input.takeActions();
    handleActions(frameActions);
    handleMenus(dt);
    if (screen === SCREEN_PLAY) {
      accumulator += dt;
      while (accumulator >= STEP) {
        step();
        accumulator -= STEP;
        if (screen !== SCREEN_PLAY) {
          accumulator = 0;
          break;
        }
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(flight.state, screen, ui(), time);
  }

  // Leaving the tab pauses a running game rather than letting the Beaver fly unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Aurora Squadron. Press Space to fly the next sortie.');
  requestAnimationFrame(frame);
}

// ?shot= stages a scene; ?selftest=1 flies the first sortie with the autopilot.
if (shot) runShot(shot);
else if (selftest) runSelftest();
else runGame();
