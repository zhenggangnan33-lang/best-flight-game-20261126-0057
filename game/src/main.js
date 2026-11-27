// LOFOTEN LIFELINE — the game loop and its screens: title, briefing,
// flight, pause, debrief and wreck. It wires the flight model, the
// missions, the refits, the feats, the instruments and the renderer
// together, and nothing else in the game knows about the DOM.

import { VIEW, SORTIES, PLACES, placeById } from './config.js';
import { buildWorld } from './terrain.js';
import { createPlane, stepPlane } from './plane.js';
import { createRun, updateRun, dropCargo, runSummary } from './missions.js';
import { modifiersFor, offerRefits } from './refits.js';
import { createCareer, checkFeats, featList } from './feats.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { drawHud } from './hud.js';
import { createCamera, updateCamera, drawScene, drawPlane } from './render.js';
import { stageShot } from './shots.js';

const STEP = 1 / 60;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('status');
const input = createInput(canvas);
const audio = createAudio();
const career = createCareer();

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number(params.get('seed') || 1);

// Any uncaught error is painted on the canvas and put in the title,
// so a headless play-test can see it without opening devtools.
window.addEventListener('error', (e) => {
  document.title = `ERROR: ${e.message}`;
  ctx.fillStyle = '#300';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  ctx.fillText(`ERROR: ${e.message}`, 20, 40);
});

const game = {
  screen: 'title', // title | briefing | play | pause | debrief | wreck
  sortieIndex: 0,
  ownedRefits: [],
  world: null,
  plane: null,
  run: null,
  camera: createCamera(),
  t: 0,
  muted: false,
  earned: [],
  offered: [],
  totalScore: 0,
  shot: null,
  warnAt: 0,
};

function startSortie(index) {
  const sortie = SORTIES[index];
  game.sortieIndex = index;
  game.world = buildWorld(sortie);
  game.mods = modifiersFor(game.ownedRefits);
  game.plane = createPlane(sortie, game.mods);
  game.run = createRun(sortie, game.mods);
  game.camera = createCamera();
  game.t = 0;
  game.earned = [];
  game.screen = 'briefing';
}

function beginFlight() {
  game.plane.throttle = 55;
  game.screen = 'play';
  audio.unlock();
}

function finishRun() {
  const run = game.run;
  const plane = game.plane;
  const summary = runSummary(run, plane);
  game.totalScore += run.score;
  const earned = checkFeats(career, [], {
    sortieId: run.sortie.id, from: run.sortie.from, to: run.sortie.to,
    finished: run.state === 'landed' || run.state === 'done', medal: run.medal,
  });
  game.earned = game.earned.concat(earned);
  game.offered = offerRefits(game.ownedRefits, run.sortie.number * 7 + 3);
  game.summary = summary;
  game.screen = run.state === 'crashed' ? 'wreck' : 'debrief';
  if (run.state === 'crashed') audio.crash();
  else audio.fanfare();
}

function stepPlay(dt) {
  const run = game.run;
  const plane = game.plane;
  const edges = input.consumeEdges();
  if (edges.pause || edges.back) {
    game.screen = 'pause';
    return;
  }
  if (edges.mute) game.muted = audio.toggleMute();
  if (edges.drop && run.sortie.type === 'drop') {
    const res = dropCargo(run, plane, game.world);
    if (res) {
      if (res.ok) audio.ring(true);
      else audio.warn();
    }
  }
  const held = input.read();
  const fly = {
    throttleUp: held.throttleUp,
    throttleDown: held.throttleDown,
    pitchUp: held.pitchUp,
    pitchDown: held.pitchDown,
    flaps: edges.flaps,
  };
  const events = stepPlane(plane, fly, dt, game.world, game.mods, game.t);
  const signals = updateRun(run, events, plane, game.world, dt);
  for (const e of events) {
    if (e.type === 'water-touch') audio.splash();
    if (e.type === 'terrain-hit' || e.type === 'hard-water') audio.warn();
    if (e.type === 'fuel-empty') audio.warn();
  }
  for (const s of signals) {
    if (s.type === 'ring') audio.ring(s.gold);
    if (s.type === 'rescued') audio.fanfare();
  }
  const earned = checkFeats(career, signals, null);
  game.earned = game.earned.concat(earned);
  if (plane.stalled && game.t - game.warnAt > 1.2) {
    game.warnAt = game.t;
    audio.warn();
  }
  audio.setEngine(plane.throttle, game.screen === 'play');
  if (run.state !== 'flying') finishRun();
}

// --- Buttons -------------------------------------------------------
function button(x, y, w, h, text, sub) {
  const hover = input.hoverIn(x, y, w, h);
  ctx.fillStyle = hover ? '#ffb454' : 'rgba(8, 14, 24, 0.82)';
  ctx.strokeStyle = '#ffb454';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = hover ? '#10141c' : '#ffffff';
  ctx.font = '700 18px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, x + w / 2, y + h / 2 + 6);
  if (sub) {
    ctx.fillStyle = hover ? '#10141c' : 'rgba(255,255,255,0.65)';
    ctx.font = '12px ui-monospace, Menlo, monospace';
    ctx.fillText(sub, x + w / 2, y + h - 12);
  }
  ctx.textAlign = 'left';
  const clicked = input.clickedIn(x, y, w, h);
  if (clicked) audio.click();
  return clicked;
}

function medalText(medal) {
  if (medal === 'gold') return '★ GOLD';
  if (medal === 'silver') return '★ SILVER';
  if (medal === 'bronze') return '★ BRONZE';
  return '—';
}

// --- Screens -------------------------------------------------------
function drawTitle() {
  const staged = game.titleShot || (game.shot && game.shot.screen === 'title' ? game.shot : null);
  if (staged) drawScene(ctx, game.camera, staged.world, staged.plane, staged.run, game.t, game.muted);
  else {
    ctx.fillStyle = '#0e1622';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }
  ctx.fillStyle = 'rgba(8, 14, 24, 0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffb454';
  ctx.font = '700 22px ui-monospace, Menlo, monospace';
  ctx.fillText('A RESCUE FLOATPLANE OVER THE LOFOTEN ISLANDS, NORWAY', VIEW.width / 2, 92);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 84px ui-monospace, Menlo, monospace';
  ctx.fillText('LOFOTEN LIFELINE', VIEW.width / 2, 178);
  ctx.fillStyle = '#ffd98a';
  ctx.font = '700 20px ui-monospace, Menlo, monospace';
  ctx.fillText('12 SORTIES  ·  24 RINGS  ·  4 STORM FRONTS  ·  12 REFITS  ·  16 FEATS', VIEW.width / 2, 216);
  ctx.textAlign = 'left';

  // The sortie list.
  ctx.fillStyle = 'rgba(8, 14, 24, 0.78)';
  ctx.strokeStyle = 'rgba(255, 180, 84, 0.55)';
  ctx.beginPath();
  ctx.roundRect(140, 250, 1000, 380, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffb454';
  ctx.font = '700 15px ui-monospace, Menlo, monospace';
  ctx.fillText('CHOOSE A SORTIE', 164, 282);
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '13px ui-monospace, Menlo, monospace';
  ctx.fillText(`FEATS ${career.unlocked.size}/16    TOTAL SCORE ${game.totalScore}`, 760, 282);
  SORTIES.forEach((s, i) => {
    const y = 300 + i * 26;
    const hover = input.hoverIn(160, y - 16, 960, 24);
    if (hover) {
      ctx.fillStyle = 'rgba(255, 180, 84, 0.14)';
      ctx.fillRect(160, y - 16, 960, 24);
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 15px ui-monospace, Menlo, monospace';
    ctx.fillText(`${String(s.number).padStart(2, '0')}  ${s.name}`, 164, y);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(`${placeById(s.from).name} → ${placeById(s.to).name}`, 560, y);
    ctx.fillStyle = s.type === 'storm' ? '#ff9d5c' : 'rgba(255,255,255,0.6)';
    ctx.fillText(s.type.toUpperCase(), 820, y);
    ctx.fillStyle = career.medals[s.id] === 'gold' ? '#ffd700' : '#ffffff';
    ctx.fillText(medalText(career.medals[s.id] || null), 960, y);
    if (input.clickedIn(160, y - 16, 960, 24)) {
      audio.unlock();
      audio.click();
      startSortie(i);
    }
  });
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '14px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('W/S THROTTLE   A/D PITCH   F FLAPS   SPACE DROP CARGO   P PAUSE   M SOUND', VIEW.width / 2, 668);
  ctx.fillText('CLICK A SORTIE TO FLY — OR PRESS ENTER FOR SORTIE 1', VIEW.width / 2, 696);
  ctx.textAlign = 'left';
  const edges = input.consumeEdges();
  if (edges.confirm) {
    audio.unlock();
    startSortie(0);
  }
}

function drawBriefing() {
  const s = SORTIES[game.sortieIndex];
  drawScene(ctx, game.camera, game.world, game.plane, game.run, game.t, game.muted);
  ctx.fillStyle = 'rgba(8, 14, 24, 0.62)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = 'rgba(8, 14, 24, 0.88)';
  ctx.strokeStyle = '#ffb454';
  ctx.beginPath();
  ctx.roundRect(240, 150, 800, 420, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffb454';
  ctx.font = '700 16px ui-monospace, Menlo, monospace';
  ctx.fillText(`SORTIE ${s.number} OF 12 — ${s.type.toUpperCase()}`, 280, 196);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 40px ui-monospace, Menlo, monospace';
  ctx.fillText(s.name, 280, 244);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '17px ui-monospace, Menlo, monospace';
  wrapText(s.briefing, 280, 286, 720, 26);
  ctx.fillStyle = '#ffd98a';
  ctx.font = '600 16px ui-monospace, Menlo, monospace';
  ctx.fillText(`${placeById(s.from).name} → ${placeById(s.to).name}    ${s.rings} RINGS    FUEL ${s.fuel}%    WIND ${s.wind} KT`, 280, 420);
  ctx.fillText(`PAR ${Math.floor(s.par / 60)}:${String(s.par % 60).padStart(2, '0')}    BEST ${medalText(career.medals[s.id] || null)}`, 280, 448);
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '14px ui-monospace, Menlo, monospace';
  ctx.fillText('W/S throttle · A/D pitch · F flaps · SPACE drop cargo', 280, 486);
  if (button(280, 510, 220, 52, 'FLY THIS SORTIE')) beginFlight();
  if (button(520, 510, 220, 52, 'BACK TO MAP')) game.screen = 'title';
  input.consumeEdges();
}

function wrapText(text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '';
  let cy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, cy);
      line = w;
      cy += lh;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, cy);
}

function drawPause() {
  drawScene(ctx, game.camera, game.world, game.plane, game.run, game.t, game.muted);
  drawHud(ctx, game.plane, game.run, game.world, game.t, game.muted);
  ctx.fillStyle = 'rgba(8, 14, 24, 0.7)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 56px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', VIEW.width / 2, 300);
  ctx.textAlign = 'left';
  if (button(490, 340, 300, 54, 'RESUME')) game.screen = 'play';
  if (button(490, 410, 300, 54, 'RESTART SORTIE')) startSortie(game.sortieIndex);
  if (button(490, 480, 300, 54, 'BACK TO MAP')) game.screen = 'title';
  const edges = input.consumeEdges();
  if (edges.pause || edges.confirm) game.screen = 'play';
}

function drawDebrief() {
  const sum = game.summary;
  drawScene(ctx, game.camera, game.world, game.plane, game.run, game.t, game.muted);
  ctx.fillStyle = 'rgba(8, 14, 24, 0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = 'rgba(8, 14, 24, 0.9)';
  ctx.strokeStyle = '#ffb454';
  ctx.beginPath();
  ctx.roundRect(240, 90, 800, 560, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffb454';
  ctx.font = '700 16px ui-monospace, Menlo, monospace';
  ctx.fillText(`SORTIE ${sum.sortie.toUpperCase()} — COMPLETE`, 280, 136);
  ctx.fillStyle = sum.medal === 'gold' ? '#ffd700' : '#ffffff';
  ctx.font = '800 44px ui-monospace, Menlo, monospace';
  ctx.fillText(`${medalText(sum.medal)}   ${sum.score} PTS`, 280, 190);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '17px ui-monospace, Menlo, monospace';
  ctx.fillText(`TIME ${Math.floor(sum.time / 60)}:${String(Math.floor(sum.time % 60)).padStart(2, '0')}    RINGS ${sum.rings} (${sum.gold} GOLD)`, 280, 228);
  ctx.fillText(`FUEL LEFT ${sum.fuel}%    HULL ${sum.hull}%    ${sum.from} → ${sum.to}`, 280, 256);
  if (game.earned.length) {
    ctx.fillStyle = '#7dff9e';
    ctx.font = '700 16px ui-monospace, Menlo, monospace';
    ctx.fillText('FEATS EARNED', 280, 296);
    ctx.fillStyle = '#ffffff';
    ctx.font = '15px ui-monospace, Menlo, monospace';
    game.earned.forEach((f, i) => ctx.fillText(`★ ${f.name} — ${f.text}`, 280, 322 + i * 24));
  }
  const baseY = 296 + game.earned.length * 24 + 24;
  ctx.fillStyle = '#ffb454';
  ctx.font = '700 16px ui-monospace, Menlo, monospace';
  ctx.fillText('CHOOSE ONE REFIT', 280, baseY);
  game.offered.forEach((r, i) => {
    const y = baseY + 16 + i * 56;
    const hover = input.hoverIn(280, y, 720, 46);
    ctx.fillStyle = hover ? 'rgba(255, 180, 84, 0.2)' : 'rgba(255,255,255,0.06)';
    ctx.strokeStyle = '#ffb454';
    ctx.beginPath();
    ctx.roundRect(280, y, 720, 46, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 16px ui-monospace, Menlo, monospace';
    ctx.fillText(r.name, 300, y + 20);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '13px ui-monospace, Menlo, monospace';
    ctx.fillText(r.text, 300, y + 38);
    if (input.clickedIn(280, y, 720, 46) && !game.ownedRefits.includes(r.id)) {
      game.ownedRefits.push(r.id);
      game.offered = game.offered.filter((o) => o.id === r.id);
      audio.click();
    }
  });
  const nextY = baseY + 16 + 3 * 56 + 22;
  if (button(280, nextY, 240, 52, 'NEXT SORTIE')) {
    const next = Math.min(SORTIES.length - 1, game.sortieIndex + 1);
    startSortie(next);
  }
  if (button(540, nextY, 240, 52, 'FLY AGAIN')) startSortie(game.sortieIndex);
  if (button(800, nextY, 200, 52, 'MAP')) game.screen = 'title';
  input.consumeEdges();
}

function drawWreck() {
  drawScene(ctx, game.camera, game.world, game.plane, game.run, game.t, game.muted);
  ctx.fillStyle = 'rgba(40, 8, 8, 0.66)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#ff5d5d';
  ctx.font = '800 60px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('WRECKED', VIEW.width / 2, 300);
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px ui-monospace, Menlo, monospace';
  ctx.fillText(`The ${game.run.sortie.name} run ends in the fjord. The crew is fine — the plane is not.`, VIEW.width / 2, 344);
  ctx.fillText(`SCORE ${game.run.score}   RINGS ${game.run.ringsHit}/${game.run.sortie.rings}`, VIEW.width / 2, 376);
  ctx.textAlign = 'left';
  if (button(440, 420, 400, 54, 'FLY IT AGAIN')) startSortie(game.sortieIndex);
  if (button(440, 490, 400, 54, 'BACK TO MAP')) game.screen = 'title';
  input.consumeEdges();
}

// --- Shot mode -----------------------------------------------------
// ?shot=title|flight|landing|debrief stages one frozen frame of the
// real game, so screenshots are renders of the code that plays.
function renderShot() {
  const s = game.shot;
  if (!s) return;
  updateCamera(game.camera, s.plane, 0.016);
  drawScene(ctx, game.camera, s.world, s.plane, s.run, s.t, game.muted);
  if (s.screen === 'play') drawHud(ctx, s.plane, s.run, s.world, s.t, game.muted);
  if (s.screen === 'debrief') {
    // The debrief screen reads the game state, so hand it the staged one.
    game.world = s.world;
    game.plane = s.plane;
    game.run = s.run;
    game.summary = runSummary(s.run, s.plane);
    game.earned = s.earned || [];
    game.offered = offerRefits([], s.run.sortie.number * 7 + 3);
    game.sortieIndex = 1;
    drawDebrief();
    return;
  }
  if (s.screen === 'title') drawTitle();
  const label = `SHOT ${shotName} — LOFOTEN LIFELINE`;
  statusLine.textContent = label;
}

// --- Main loop -----------------------------------------------------
let last = performance.now();
let acc = 0;

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (game.shot) {
    renderShot();
    input.endFrame();
    requestAnimationFrame(frame);
    return;
  }
  game.t += dt;
  if (game.screen === 'play') {
    acc += dt;
    while (acc >= STEP) {
      stepPlay(STEP);
      acc -= STEP;
      if (game.screen !== 'play') break;
    }
    updateCamera(game.camera, game.plane, dt);
    drawScene(ctx, game.camera, game.world, game.plane, game.run, game.t, game.muted);
    drawHud(ctx, game.plane, game.run, game.world, game.t, game.muted);
  } else if (game.screen === 'briefing') {
    updateCamera(game.camera, game.plane, dt);
    drawBriefing();
  } else if (game.screen === 'pause') {
    drawPause();
  } else if (game.screen === 'debrief') {
    drawDebrief();
  } else if (game.screen === 'wreck') {
    drawWreck();
  } else {
    drawTitle();
  }
  input.endFrame();
  requestAnimationFrame(frame);
}

// Boot.
if (shotName) {
  game.shot = stageShot(shotName);
  game.camera = createCamera();
  // Put the camera where the staged plane is before the first frame.
  game.camera.alt = game.shot.plane.y - 1000;
  document.title = `LOFOTEN LIFELINE — shot ${shotName}`;
} else {
  // Title backdrop: the harbour at dawn, the plane in the air over it.
  const staged = stageShot('title');
  game.titleShot = staged;
  game.camera = createCamera();
  game.camera.alt = staged.plane.y - 1000;
}
statusLine.textContent = 'Lofoten Lifeline — a rescue floatplane over the Lofoten Islands';
requestAnimationFrame(frame);
