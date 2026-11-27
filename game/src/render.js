// The renderer: a chase view over Lofoten — sea, islands, villages and aurora
// below, the Beaver in frame, and a lit HUD (altitude, speed, heading, fuel,
// wind, the mission) above. Every screen the game has is drawn here: title,
// hangar, feats, debrief, paused and failed, over the same living world.

import { FIELD, PALETTE, FONT, CAMERA_WIDTH, WORLD } from './config.js';
import { ISLANDS, SKERRIES, VILLAGES, BASES } from './places.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_HANGAR = 'hangar';
export const SCREEN_FEATS = 'feats';
export const SCREEN_DEBRIEF = 'debrief';
export const SCREEN_FAILED = 'failed';

function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function hexLerp(c1, c2, t) {
  const a = parseInt(c1.slice(1), 16);
  const b = parseInt(c2.slice(1), 16);
  const r = Math.round(lerp((a >> 16) & 255, (b >> 16) & 255, t));
  const g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, t));
  const bl = Math.round(lerp(a & 255, b & 255, t));
  return `rgb(${r},${g},${bl})`;
}

/** Sky and sea colours for an hour of the day (0-24). */
function skyColors(hour) {
  const night = hour >= 22 || hour < 5.5;
  const dawn = hour >= 5.5 && hour < 8;
  const dusk = hour >= 17.5 && hour < 20;
  if (night) return { sky: PALETTE.skyNight, sea: PALETTE.seaNight, deep: '#081826' };
  if (dawn) return { sky: PALETTE.skyDusk, sea: '#4a7d96', deep: '#2c5468' };
  if (dusk) return { sky: '#c97b52', sea: '#3d6a84', deep: '#24455a' };
  return { sky: PALETTE.skyDay, sea: PALETTE.seaDay, deep: PALETTE.seaDeep };
}

function mulberry(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const scale = FIELD.width / CAMERA_WIDTH;

  // The canvas backing store matches the window (times the pixel ratio), or the
  // drawing would be a small bitmap stretched over the screen.
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
    canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Pine positions per island, fixed so the forest never moves between frames.
  const pines = ISLANDS.map((island, i) => {
    const rnd = mulberry(1000 + i * 77);
    const list = [];
    for (let k = 0; k < 26; k += 1) {
      const a = rnd() * Math.PI * 2;
      const r = 0.35 + rnd() * 0.5;
      list.push({
        x: island.x + Math.cos(a) * island.rx * r,
        y: island.y + Math.sin(a) * island.ry * r,
        s: 5 + rnd() * 5,
      });
    }
    return list;
  });
  // A blobby outline per island, so the coast is a coastline and not an ellipse:
  // 28 points around the island, each pushed in or out by seeded noise.
  const outlines = ISLANDS.map((island, i) => {
    const rnd = mulberry(5000 + i * 131);
    const pts = [];
    const N = 28;
    for (let k = 0; k < N; k += 1) {
      const a = (k / N) * Math.PI * 2;
      const wobble = 0.86 + rnd() * 0.26;
      pts.push({ x: Math.cos(a) * wobble, y: Math.sin(a) * wobble });
    }
    return pts;
  });

  function traceOutline(pts, rx, ry, factor) {
    ctx.beginPath();
    for (let i = 0; i < pts.length; i += 1) {
      const x = pts[i].x * rx * factor;
      const y = pts[i].y * ry * factor;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
  const waveRnd = mulberry(42);
  const waves = [];
  for (let i = 0; i < 90; i += 1) {
    waves.push({ x: waveRnd() * WORLD.width, y: waveRnd() * WORLD.height, l: 14 + waveRnd() * 26, p: waveRnd() * 6.28 });
  }

  function project(state, x, y) {
    const p = state.plane;
    const look = 90;
    const cx = p.x + Math.cos(p.heading) * look;
    const cy = p.y + Math.sin(p.heading) * look;
    return {
      x: FIELD.width / 2 + (x - cx) * scale,
      y: FIELD.height / 2 + (y - cy) * scale,
    };
  }

  function drawSea(state, time) {
    const cols = skyColors(state.timeOfDay);
    const g = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    g.addColorStop(0, cols.sea);
    g.addColorStop(1, cols.deep);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    // Drifting wave ticks, brighter where the moon or sun catches them.
    ctx.strokeStyle = state.weather.night ? 'rgba(180,200,230,0.16)' : 'rgba(255,255,255,0.20)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (const w of waves) {
      const s = project(state, w.x, w.y);
      if (s.x < -40 || s.x > FIELD.width + 40 || s.y < -40 || s.y > FIELD.height + 40) continue;
      const off = Math.sin(time * 0.7 + w.p) * 4;
      ctx.moveTo(s.x - w.l / 2 * scale, s.y + off);
      ctx.lineTo(s.x + w.l / 2 * scale, s.y + off);
    }
    ctx.stroke();
  }

  function drawIslands(state) {
    const night = state.weather.night;
    for (let i = 0; i < ISLANDS.length; i += 1) {
      const island = ISLANDS[i];
      const c = project(state, island.x, island.y);
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(island.rot);
      const rx = island.rx * scale;
      const ry = island.ry * scale;
      const pts = outlines[i];
      // Sand rim, grass, rock, snow cap — each the same coastline, drawn smaller.
      ctx.fillStyle = PALETTE.sand;
      traceOutline(pts, rx, ry, 1);
      ctx.fill();
      ctx.fillStyle = night ? '#3d5238' : PALETTE.grass;
      traceOutline(pts, rx, ry, 0.94);
      ctx.fill();
      // Rock, shaded from the sun so the mountain has a lit side and a dark one.
      const rockGrad = ctx.createLinearGradient(-rx * 0.5, -ry * 0.5, rx * 0.5, ry * 0.5);
      rockGrad.addColorStop(0, night ? '#6a6e78' : '#8a8f9a');
      rockGrad.addColorStop(1, night ? '#3a3d45' : PALETTE.rock);
      ctx.fillStyle = rockGrad;
      traceOutline(pts, rx, ry, 0.55);
      ctx.fill();
      ctx.fillStyle = night ? '#c9d4dc' : PALETTE.snow;
      traceOutline(pts, rx, ry, 0.22);
      ctx.fill();
      // Surf where the sea meets the sand.
      ctx.strokeStyle = night ? 'rgba(200,220,240,0.25)' : 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 2;
      traceOutline(pts, rx, ry, 1);
      ctx.stroke();
      ctx.restore();
      // Pines on the grass.
      ctx.fillStyle = night ? '#22301f' : PALETTE.pine;
      for (const pine of pines[i]) {
        const s = project(state, pine.x, pine.y);
        if (s.x < -10 || s.x > FIELD.width + 10 || s.y < -10 || s.y > FIELD.height + 10) continue;
        const size = pine.s * scale;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y - size);
        ctx.lineTo(s.x - size * 0.7, s.y + size * 0.6);
        ctx.lineTo(s.x + size * 0.7, s.y + size * 0.6);
        ctx.closePath();
        ctx.fill();
      }
      // The island's name, small, where it fits on screen.
      if (rx > 60) {
        ctx.fillStyle = night ? 'rgba(230,235,240,0.75)' : 'rgba(20,30,40,0.6)';
        ctx.font = `600 ${Math.max(11, 13 * scale)}px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText(island.name, c.x, c.y + ry * 0.72);
      }
    }
    // Skerries: bare rock in the sea.
    ctx.fillStyle = night ? '#3f434c' : PALETTE.rock;
    for (const skerry of SKERRIES) {
      const s = project(state, skerry.x, skerry.y);
      if (s.x < -20 || s.x > FIELD.width + 20 || s.y < -20 || s.y > FIELD.height + 20) continue;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, skerry.r * scale, skerry.r * 0.7 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawVillages(state, time) {
    const night = state.weather.night;
    for (const village of VILLAGES) {
      const s = project(state, village.x, village.y);
      if (s.x < -60 || s.x > FIELD.width + 60 || s.y < -60 || s.y > FIELD.height + 60) continue;
      const rnd = mulberry(village.x * 7 + village.y);
      for (let i = 0; i < village.houses; i += 1) {
        const hx = s.x + (rnd() - 0.5) * 90 * scale;
        const hy = s.y + (rnd() - 0.5) * 60 * scale;
        ctx.fillStyle = night ? '#2a2118' : '#8a6a4a';
        ctx.fillRect(hx - 5 * scale, hy - 4 * scale, 10 * scale, 8 * scale);
        ctx.fillStyle = night ? '#5a3a28' : '#a33d2e';
        ctx.beginPath();
        ctx.moveTo(hx - 6 * scale, hy - 4 * scale);
        ctx.lineTo(hx, hy - 10 * scale);
        ctx.lineTo(hx + 6 * scale, hy - 4 * scale);
        ctx.closePath();
        ctx.fill();
        if (night) {
          ctx.fillStyle = `rgba(255, 210, 122, ${0.5 + 0.3 * Math.sin(time * 2 + i)})`;
          ctx.beginPath();
          ctx.arc(hx, hy, 2.4 * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (night || scale > 0.8) {
        ctx.fillStyle = night ? 'rgba(240,244,248,0.85)' : 'rgba(20,30,40,0.65)';
        ctx.font = `600 12px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText(village.name, s.x, s.y - 42 * scale);
      }
    }
  }

  function drawBases(state) {
    for (const base of BASES) {
      const s = project(state, base.x, base.y);
      if (s.x < -120 || s.x > FIELD.width + 120 || s.y < -120 || s.y > FIELD.height + 120) continue;
      // The water runway: a dashed lane the plane lands on.
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(base.heading);
      ctx.strokeStyle = 'rgba(255, 210, 63, 0.85)';
      ctx.lineWidth = 2;
      ctx.setLineDash([14, 10]);
      ctx.beginPath();
      ctx.moveTo(-90 * scale, 0);
      ctx.lineTo(90 * scale, 0);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      // Hangar and fuel dock.
      ctx.fillStyle = '#7a4a35';
      ctx.fillRect(s.x - 26 * scale, s.y - 34 * scale, 52 * scale, 26 * scale);
      ctx.fillStyle = '#c8402f';
      ctx.fillRect(s.x - 26 * scale, s.y - 34 * scale, 52 * scale, 6 * scale);
      ctx.fillStyle = '#ffd23f';
      ctx.font = `700 12px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(base.name, s.x, s.y + 52 * scale);
      if (base.home) {
        ctx.fillStyle = 'rgba(238,244,248,0.9)';
        ctx.fillText('HOME', s.x, s.y + 68 * scale);
      }
    }
  }

  function drawRing(state, time) {
    if (!state.sortie || state.phase !== 'flying') return;
    const ring = state.sortie.rings[state.ringIndex];
    if (!ring) return;
    const s = project(state, ring.x, ring.y);
    const pulse = 1 + 0.08 * Math.sin(time * 3);
    const r = ring.r * scale * pulse;
    ctx.save();
    ctx.strokeStyle = PALETTE.ring;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = PALETTE.ringInner;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 210, 63, 0.14)';
    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    ctx.fill();
    // The ring's label and the distance to it.
    const d = Math.hypot(ring.x - state.plane.x, ring.y - state.plane.y);
    ctx.fillStyle = '#fff3c4';
    ctx.font = `700 14px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(ring.label, s.x, s.y - r - 10);
    ctx.font = `600 12px ${FONT}`;
    ctx.fillStyle = 'rgba(255,243,196,0.85)';
    ctx.fillText(`${Math.round(d / 55)} nm`, s.x, s.y - r - 26);
    ctx.restore();
  }

  function drawPlane(state, time) {
    const p = state.plane;
    const s = project(state, p.x, p.y);
    const night = state.weather.night;
    ctx.save();
    ctx.translate(s.x, s.y);
    // Soft shadow on the water below.
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(6, 10, 26, 9, p.heading, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(p.heading);
    const sc = scale * 1.6;
    // Floats.
    ctx.fillStyle = '#3a3f47';
    ctx.fillRect(-14 * sc, -12 * sc, 34 * sc, 4 * sc);
    ctx.fillRect(-14 * sc, 8 * sc, 34 * sc, 4 * sc);
    // Wings.
    ctx.fillStyle = PALETTE.planeWhite;
    ctx.fillRect(-6 * sc, -34 * sc, 13 * sc, 68 * sc);
    ctx.fillStyle = PALETTE.planeRed;
    ctx.fillRect(-6 * sc, -34 * sc, 13 * sc, 7 * sc);
    ctx.fillRect(-6 * sc, 27 * sc, 13 * sc, 7 * sc);
    // Fuselage.
    ctx.fillStyle = PALETTE.planeRed;
    ctx.beginPath();
    ctx.ellipse(2 * sc, 0, 24 * sc, 8 * sc, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.planeWhite;
    ctx.beginPath();
    ctx.ellipse(-2 * sc, 0, 14 * sc, 6.5 * sc, 0, 0, Math.PI * 2);
    ctx.fill();
    // Cockpit windows, lit at night.
    ctx.fillStyle = night ? '#ffe9a8' : '#1d3557';
    ctx.beginPath();
    ctx.ellipse(12 * sc, -3 * sc, 4 * sc, 2.4 * sc, 0, 0, Math.PI * 2);
    ctx.ellipse(12 * sc, 3 * sc, 4 * sc, 2.4 * sc, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tail.
    ctx.fillStyle = PALETTE.planeTrim;
    ctx.fillRect(-26 * sc, -13 * sc, 8 * sc, 26 * sc);
    // Propeller blur at the nose.
    ctx.strokeStyle = 'rgba(240,240,240,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(26 * sc, 0, 10 * sc, time * 9, time * 9 + Math.PI * 1.4);
    ctx.stroke();
    // Navigation lights at night.
    if (night) {
      ctx.fillStyle = '#ff4d4d';
      ctx.beginPath(); ctx.arc(-6 * sc, -34 * sc, 3 * sc, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4dff88';
      ctx.beginPath(); ctx.arc(-6 * sc, 34 * sc, 3 * sc, 0, Math.PI * 2); ctx.fill();
      if (Math.sin(time * 4) > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(-26 * sc, 0, 3.5 * sc, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawClouds(state, time) {
    ctx.fillStyle = state.weather.night ? 'rgba(160,170,200,0.20)' : PALETTE.cloud;
    for (const cloud of state.clouds) {
      const cx = ((cloud.x + time * cloud.speed) % (WORLD.width + 600)) - 300;
      const s = project(state, cx, cloud.y);
      if (s.x < -260 || s.x > FIELD.width + 260 || s.y < -160 || s.y > FIELD.height + 160) continue;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, cloud.r * scale, cloud.r * 0.42 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawAurora(state, time) {
    if (!state.weather.aurora) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const bands = [
      { col: PALETTE.aurora1, amp: 46, speed: 0.35, y: 90 },
      { col: PALETTE.aurora2, amp: 60, speed: 0.22, y: 150 },
      { col: PALETTE.aurora3, amp: 38, speed: 0.5, y: 210 },
    ];
    for (const band of bands) {
      ctx.beginPath();
      ctx.moveTo(0, band.y);
      for (let x = 0; x <= FIELD.width; x += 16) {
        ctx.lineTo(x, band.y + Math.sin(x / 180 + time * band.speed) * band.amp * 0.4 + Math.sin(x / 60 + time * 0.6) * 12);
      }
      ctx.lineTo(FIELD.width, band.y + 120);
      ctx.lineTo(0, band.y + 120);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, band.y - 40, 0, band.y + 120);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(0.5, band.col + '55');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFog(state) {
    const fog = state.weather.fog;
    if (!fog) return;
    const p = state.plane;
    const s = project(state, p.x, p.y);
    const g = ctx.createRadialGradient(s.x, s.y, 60, s.x, s.y, 620);
    g.addColorStop(0, 'rgba(210,220,230,0)');
    g.addColorStop(1, `rgba(210,220,230,${fog * 0.55})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }

  function panel(x, y, w, h) {
    ctx.fillStyle = PALETTE.hudPanel;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
  }

  function drawHud(state, ui, time) {
    const p = state.plane;
    const headingDeg = Math.round(((p.heading * 180) / Math.PI + 360) % 360);
    // Compass ribbon across the top.
    ctx.fillStyle = PALETTE.hudPanel;
    ctx.fillRect(0, 0, FIELD.width, 34);
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = `700 13px ${FONT}`;
    ctx.textAlign = 'center';
    const labels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    for (let d = -180; d <= 180; d += 15) {
      const deg = (headingDeg + d + 360) % 360;
      const x = FIELD.width / 2 + d * 2.2;
      if (x < 20 || x > FIELD.width - 20) continue;
      if (deg % 45 === 0) ctx.fillText(labels[Math.round(deg / 45) % 8], x, 22);
      else {
        ctx.fillStyle = 'rgba(238,244,248,0.55)';
        ctx.fillRect(x - 1, 12, 2, 8);
        ctx.fillStyle = PALETTE.hudText;
      }
    }
    ctx.fillStyle = PALETTE.hudAmber;
    ctx.beginPath();
    ctx.moveTo(FIELD.width / 2 - 6, 0);
    ctx.lineTo(FIELD.width / 2 + 6, 0);
    ctx.lineTo(FIELD.width / 2, 8);
    ctx.closePath();
    ctx.fill();

    // Instruments, lit: altitude, speed, heading.
    panel(14, 48, 240, 62);
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.hudAmber;
    ctx.font = `700 11px ${FONT}`;
    ctx.fillText('ALT', 26, 66);
    ctx.fillText('SPD', 106, 66);
    ctx.fillText('HDG', 186, 66);
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = `700 22px ${FONT}`;
    ctx.fillText(`${Math.round(p.alt)}`, 26, 94);
    ctx.fillText(`${Math.round(p.speed)}`, 106, 94);
    ctx.fillText(`${String(headingDeg).padStart(3, '0')}°`, 186, 94);
    ctx.fillStyle = 'rgba(238,244,248,0.6)';
    ctx.font = `600 10px ${FONT}`;
    ctx.fillText('ft', 70, 94);
    ctx.fillText('kt', 150, 94);

    // Throttle, fuel and damage, top right.
    panel(FIELD.width - 254, 48, 240, 62);
    const bars = [
      { label: 'THR', v: p.throttle, col: PALETTE.hudGreen },
      { label: 'FUEL', v: p.fuel / 100, col: p.fuel < 20 ? PALETTE.hudRed : PALETTE.hudAmber },
      { label: 'HULL', v: 1 - p.damage / 100, col: p.damage > 60 ? PALETTE.hudRed : PALETTE.hudGreen },
    ];
    bars.forEach((bar, i) => {
      const y = 60 + i * 17;
      ctx.fillStyle = 'rgba(238,244,248,0.7)';
      ctx.font = `700 10px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText(bar.label, FIELD.width - 242, y + 8);
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.fillRect(FIELD.width - 196, y, 160, 9);
      ctx.fillStyle = bar.col;
      ctx.fillRect(FIELD.width - 196, y, 160 * clamp(bar.v, 0, 1), 9);
    });

    // Wind, under the instruments.
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = `600 12px ${FONT}`;
    ctx.textAlign = 'left';
    const windArrow = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘'][Math.round(((state.wind.from + 180) % 360) / 45) % 8];
    ctx.fillText(`Wind ${windArrow} ${state.wind.kt} kt · ${state.weather.label}`, 16, 130);
    if (p.ice > 5) {
      ctx.fillStyle = '#9fd8ff';
      ctx.fillText(`ICE ${Math.round(p.ice)}% — climb out of the cloud!`, 16, 150);
    }

    // Mission panel, left.
    if (state.sortie) {
      const def = state.sortie;
      const ring = def.rings[state.ringIndex];
      panel(14, 162, 300, 108);
      ctx.fillStyle = PALETTE.hudAmber;
      ctx.font = `700 12px ${FONT}`;
      ctx.fillText(`SORTIE ${def.no}/18 — ${def.name.toUpperCase()}`, 26, 182);
      ctx.fillStyle = PALETTE.hudText;
      ctx.font = `600 12px ${FONT}`;
      const mins = Math.floor(state.elapsed / 60);
      const secs = Math.floor(state.elapsed % 60);
      ctx.fillText(`Time ${mins}:${String(secs).padStart(2, '0')}  ·  Gold ${Math.floor(def.gold / 60)}:${String(def.gold % 60).padStart(2, '0')}`, 26, 202);
      ctx.fillStyle = 'rgba(238,244,248,0.85)';
      ctx.font = `600 12px ${FONT}`;
      const goalText = def.goal === 'rescue' ? 'Rescue at the ring — land or winch'
        : def.goal === 'drop' ? 'Drop the crate over the ring, 100–400 ft'
        : def.goal === 'survey' ? 'Fly each ring in order'
        : def.goal === 'scoop' ? (state.plane.scooped ? 'Drop the water on the fire' : 'Scoop water, low and slow over the sea')
        : def.goal === 'photo' ? 'Hold inside the ring for the photograph'
        : 'Fly the rings, then land at Svolvær';
      wrapText(goalText, 26, 222, 276, 15);
      if (ring) {
        const d = Math.hypot(ring.x - p.x, ring.y - p.y);
        const bearing = Math.round(((angleTo(p.x, p.y, ring.x, ring.y) * 180) / Math.PI + 90 + 360) % 360);
        ctx.fillStyle = PALETTE.ring;
        ctx.font = `700 13px ${FONT}`;
        ctx.fillText(`◈ ${ring.label} — ${(d / 55).toFixed(1)} nm · ${String(bearing).padStart(3, '0')}°`, 26, 258);
      }
    }

    // Credits and souls, bottom left.
    panel(14, FIELD.height - 52, 210, 38);
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = `700 14px ${FONT}`;
    ctx.fillText(`◈ ${ui.save.credits} credits`, 26, FIELD.height - 28);
    ctx.fillStyle = 'rgba(238,244,248,0.75)';
    ctx.font = `600 12px ${FONT}`;
    ctx.fillText(`${ui.save.stats.soulsRescued} souls rescued`, 130, FIELD.height - 28);

    // The message toast.
    if (state.message && state.messageTime > 0) {
      ctx.font = `600 14px ${FONT}`;
      const w = ctx.measureText(state.message).width + 28;
      panel(FIELD.width / 2 - w / 2, 48, w, 34);
      ctx.fillStyle = PALETTE.hudText;
      ctx.textAlign = 'center';
      ctx.fillText(state.message, FIELD.width / 2, 70);
    }

    drawMinimap(state, ui);
  }

  function wrapText(text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let yy = y;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, yy);
        line = word;
        yy += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, yy);
  }

  function angleTo(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  }

  function drawMinimap(state, ui) {
    const mw = 200;
    const mh = 132;
    const x0 = FIELD.width - mw - 14;
    const y0 = FIELD.height - mh - 14;
    panel(x0, y0, mw, mh);
    const sx = mw / WORLD.width;
    const sy = mh / WORLD.height;
    ctx.fillStyle = '#1d4a63';
    ctx.fillRect(x0 + 4, y0 + 4, mw - 8, mh - 8);
    ctx.fillStyle = '#5d7d4a';
    for (const island of ISLANDS) {
      ctx.beginPath();
      ctx.ellipse(x0 + 4 + island.x * sx, y0 + 4 + island.y * sy, island.rx * sx, island.ry * sy, island.rot, 0, Math.PI * 2);
      ctx.fill();
    }
    if (state.sortie) {
      const ring = state.sortie.rings[state.ringIndex];
      if (ring) {
        ctx.strokeStyle = PALETTE.ring;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x0 + 4 + ring.x * sx, y0 + 4 + ring.y * sy, 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    for (const base of BASES) {
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(x0 + 4 + base.x * sx - 2, y0 + 4 + base.y * sy - 2, 4, 4);
    }
    const p = state.plane;
    ctx.save();
    ctx.translate(x0 + 4 + p.x * sx, y0 + 4 + p.y * sy);
    ctx.rotate(p.heading);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(-5, -4);
    ctx.lineTo(-5, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawWorld(state, time) {
    drawSea(state, time);
    drawIslands(state);
    drawVillages(state, time);
    drawBases(state);
    drawRing(state, time);
    drawPlane(state, time);
    drawClouds(state, time);
    drawAurora(state, time);
    drawFog(state);
  }

  function bigPanel(title) {
    ctx.fillStyle = 'rgba(8, 14, 26, 0.82)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    panel(FIELD.width / 2 - 360, 60, 720, FIELD.height - 120);
    ctx.fillStyle = PALETTE.hudAmber;
    ctx.font = `700 26px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(title, FIELD.width / 2, 108);
  }

  function drawTitle(state, ui) {
    drawWorld(state, 0);
    ctx.fillStyle = 'rgba(8, 14, 26, 0.55)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f2ede2';
    ctx.font = `700 64px ${FONT}`;
    ctx.fillText('AURORA SQUADRON', FIELD.width / 2, 150);
    ctx.fillStyle = PALETTE.hudAmber;
    ctx.font = `600 22px ${FONT}`;
    ctx.fillText('Lofoten Air Rescue — eighteen sorties, one Beaver, the whole chain', FIELD.width / 2, 188);
    const next = ui.nextSortie;
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = `600 16px ${FONT}`;
    ctx.fillText(`Next sortie ${next.no}/18: ${next.name} — ${next.place}`, FIELD.width / 2, 236);
    ctx.fillText(`◈ ${ui.save.credits} credits  ·  ${ui.save.stats.sortiesDone}/18 sorties flown  ·  ${ui.save.feats.length}/24 feats`, FIELD.width / 2, 264);
    ctx.fillStyle = 'rgba(238,244,248,0.85)';
    ctx.font = `600 15px ${FONT}`;
    ctx.fillText('SPACE fly the next sortie    H hangar    F feats', FIELD.width / 2, 330);
    ctx.fillText('↑ ↓ throttle    ← → turn    SPACE action    P pause', FIELD.width / 2, 356);
    ctx.fillStyle = 'rgba(238,244,248,0.6)';
    ctx.font = `600 13px ${FONT}`;
    ctx.fillText('Fly low over the fjords, mind the mountains, bring everyone home.', FIELD.width / 2, 400);
    const medals = Object.values(ui.save.medals);
    const gold = medals.filter((m) => m === 'gold').length;
    if (gold > 0) {
      ctx.fillStyle = PALETTE.hudAmber;
      ctx.font = `700 15px ${FONT}`;
      ctx.fillText(`★ ${gold} gold medal${gold === 1 ? '' : 's'} on the squadron board`, FIELD.width / 2, 440);
    }
  }

  function drawHangar(state, ui) {
    drawWorld(state, 0);
    bigPanel('HANGAR — REFITS');
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = `600 14px ${FONT}`;
    ctx.fillText(`Credits: ◈ ${ui.save.credits}   ·   ↑ ↓ choose   ·   SPACE buy   ·   H or ESC back`, FIELD.width / 2 - 330, 140);
    const list = ui.refits;
    const start = Math.max(0, Math.min(ui.hangarIndex - 5, list.length - 11));
    for (let i = 0; i < 11 && start + i < list.length; i += 1) {
      const refit = list[start + i];
      const y = 168 + i * 40;
      const owned = ui.save.refits.includes(refit.id);
      const afford = ui.save.credits >= refit.cost;
      if (start + i === ui.hangarIndex) {
        ctx.fillStyle = 'rgba(255, 183, 3, 0.18)';
        ctx.fillRect(FIELD.width / 2 - 340, y - 18, 680, 34);
      }
      ctx.fillStyle = owned ? PALETTE.hudGreen : afford ? PALETTE.hudText : 'rgba(238,244,248,0.45)';
      ctx.font = `700 15px ${FONT}`;
      ctx.fillText(`${owned ? '✓ ' : ''}${refit.name}`, FIELD.width / 2 - 330, y);
      ctx.fillStyle = 'rgba(238,244,248,0.7)';
      ctx.font = `600 12px ${FONT}`;
      ctx.fillText(refit.blurb, FIELD.width / 2 - 330, y + 15);
      ctx.fillStyle = owned ? PALETTE.hudGreen : PALETTE.hudAmber;
      ctx.font = `700 14px ${FONT}`;
      ctx.textAlign = 'right';
      ctx.fillText(owned ? 'OWNED' : `◈ ${refit.cost}`, FIELD.width / 2 + 330, y);
      ctx.textAlign = 'left';
    }
  }

  function drawFeats(state, ui) {
    drawWorld(state, 0);
    bigPanel('FEATS — 24 TO EARN');
    ctx.textAlign = 'left';
    const list = ui.feats;
    for (let i = 0; i < list.length; i += 1) {
      const feat = list[i];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = FIELD.width / 2 - 330 + col * 350;
      const y = 160 + row * 36;
      const earned = ui.save.feats.includes(feat.id);
      ctx.fillStyle = earned ? PALETTE.hudAmber : 'rgba(238,244,248,0.4)';
      ctx.font = `700 14px ${FONT}`;
      ctx.fillText(`${earned ? '★ ' : '☆ '}${feat.name}`, x, y);
      ctx.fillStyle = earned ? 'rgba(238,244,248,0.85)' : 'rgba(238,244,248,0.45)';
      ctx.font = `600 12px ${FONT}`;
      ctx.fillText(feat.blurb, x, y + 15);
    }
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = `600 14px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('F or ESC back', FIELD.width / 2, FIELD.height - 90);
  }

  function drawDebrief(state, ui) {
    drawWorld(state, 0);
    const r = ui.debrief;
    bigPanel('SORTIE COMPLETE');
    const medalCol = r.medal === 'gold' ? '#ffd23f' : r.medal === 'silver' ? '#d7dee8' : '#c98a4b';
    ctx.fillStyle = medalCol;
    ctx.font = `700 44px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(r.medal === 'gold' ? '★ GOLD MEDAL ★' : r.medal === 'silver' ? '★ SILVER MEDAL ★' : '★ BRONZE MEDAL ★', FIELD.width / 2, 190);
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = `600 18px ${FONT}`;
    ctx.fillText(r.name, FIELD.width / 2, 230);
    const mins = Math.floor(r.time / 60);
    const secs = r.time % 60;
    ctx.fillText(`Time ${mins}:${String(secs).padStart(2, '0')}  ·  Hull damage ${r.damage}%  ·  Fuel left ${r.fuelLeft}%`, FIELD.width / 2, 264);
    ctx.fillStyle = PALETTE.hudAmber;
    ctx.font = `700 20px ${FONT}`;
    ctx.fillText(`+${r.credits} credits  ·  balance ◈ ${ui.save.credits}`, FIELD.width / 2, 300);
    if (r.newFeats.length > 0) {
      ctx.fillStyle = PALETTE.hudGreen;
      ctx.font = `700 16px ${FONT}`;
      ctx.fillText(`New feats: ${r.newFeats.map((f) => f.name).join(', ')}`, FIELD.width / 2, 340);
    }
    ctx.fillStyle = 'rgba(238,244,248,0.85)';
    ctx.font = `600 15px ${FONT}`;
    ctx.fillText('SPACE next sortie    H hangar    F feats', FIELD.width / 2, 400);
  }

  function drawFailed(state, ui) {
    drawWorld(state, 0);
    bigPanel('SORTIE FAILED');
    ctx.fillStyle = PALETTE.hudRed;
    ctx.font = `700 22px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(state.failReason || 'The sortie is over.', FIELD.width / 2, 200);
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = `600 16px ${FONT}`;
    ctx.fillText('Erik will patch her up. SPACE to fly it again.', FIELD.width / 2, 250);
    void ui;
  }

  function drawPaused(state) {
    drawWorld(state, 0);
    ctx.fillStyle = 'rgba(8, 14, 26, 0.6)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = `700 34px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', FIELD.width / 2, FIELD.height / 2 - 10);
    ctx.font = `600 15px ${FONT}`;
    ctx.fillText('P or SPACE to keep flying', FIELD.width / 2, FIELD.height / 2 + 24);
  }

  function draw(state, screen, ui, time) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const scaleX = canvas.width / FIELD.width;
    const scaleY = canvas.height / FIELD.height;
    const s = Math.min(scaleX, scaleY);
    const ox = (canvas.width - FIELD.width * s) / 2;
    const oy = (canvas.height - FIELD.height * s) / 2;
    ctx.setTransform(s, 0, 0, s, ox, oy);
    if (screen === SCREEN_TITLE) drawTitle(state, ui);
    else if (screen === SCREEN_HANGAR) drawHangar(state, ui);
    else if (screen === SCREEN_FEATS) drawFeats(state, ui);
    else if (screen === SCREEN_DEBRIEF) drawDebrief(state, ui);
    else if (screen === SCREEN_FAILED) drawFailed(state, ui);
    else if (screen === SCREEN_PAUSED) drawPaused(state);
    else {
      drawWorld(state, time);
      drawHud(state, ui, time);
    }
  }

  return { draw, project };
}
