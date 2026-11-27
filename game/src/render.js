// The world on screen: sky, sea, jagged peaks, red cabins, fish racks,
// lighthouses, gold rings and the floatplane itself, all drawn with
// canvas paths — no image files anywhere. The camera is a chase view:
// the plane holds its place on screen and the fjord scrolls past it.

import { VIEW, WORLD } from './config.js';
import { terrainHeight } from './terrain.js';

const PLANE_SCREEN_X = 420;
const PLANE_SCREEN_Y = 380;

export function createCamera() {
  return { alt: -580, x: 0 };
}

function screenX(camera, worldX, plane) {
  return PLANE_SCREEN_X + (worldX - plane.x);
}

function screenY(camera, alt) {
  return WORLD.seaY - (alt - camera.alt) * WORLD.pxPerFoot;
}

export function updateCamera(camera, plane, dt) {
  const target = plane.y - 1000;
  camera.alt += (target - camera.alt) * Math.min(1, dt * 2.2);
}

function skyGradient(ctx, night) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  if (night) {
    g.addColorStop(0, '#0b1026');
    g.addColorStop(0.55, '#1b2a4a');
    g.addColorStop(1, '#3a2f4a');
  } else {
    g.addColorStop(0, '#7fb4e0');
    g.addColorStop(0.5, '#bcd9ee');
    g.addColorStop(0.72, '#f6d9a0');
    g.addColorStop(1, '#e8b478');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

function drawSun(ctx, night, t, camera) {
  if (night) {
    ctx.fillStyle = '#f4ead2';
    ctx.beginPath();
    ctx.arc(1080, 120, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(244, 234, 210, 0.25)';
    ctx.beginPath();
    ctx.arc(1080, 120, 52, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  // Low golden sun over the sea — the midnight-sun look.
  ctx.fillStyle = '#ffd98a';
  ctx.beginPath();
  ctx.arc(1020, 170, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 217, 138, 0.28)';
  ctx.beginPath();
  ctx.arc(1020, 170, 78, 0, Math.PI * 2);
  ctx.fill();
  // Sun road on the water.
  ctx.fillStyle = 'rgba(255, 217, 138, 0.18)';
  ctx.fillRect(940, screenY(camera, 0), 160, 140);
}

function drawClouds(ctx, plane, t, night) {
  ctx.fillStyle = night ? 'rgba(200, 210, 235, 0.16)' : 'rgba(255, 255, 255, 0.75)';
  for (let i = 0; i < 9; i += 1) {
    const cx = ((i * 397 + 200 - plane.x * 0.25) % 1500 + 1500) % 1500 - 110;
    const cy = 60 + ((i * 173) % 180);
    const s = 26 + ((i * 53) % 40);
    ctx.beginPath();
    ctx.ellipse(cx, cy, s * 1.8, s * 0.55, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + s, cy + 6, s * 1.2, s * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// A jagged ridge line, drawn from the world's ridge table at a scroll
// factor for parallax depth.
function drawRidgeLayer(ctx, camera, world, plane, factor, color, snow) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-10, VIEW.height);
  const step = 60;
  for (let sx = -10; sx <= VIEW.width + step; sx += step) {
    const wx = plane.x + (sx - PLANE_SCREEN_X) / factor;
    const h = terrainHeight(world, wx) * (factor === 1 ? 1 : 0.55 + factor * 0.3);
    const sy = screenY(camera, h);
    ctx.lineTo(sx, sy);
  }
  ctx.lineTo(VIEW.width + 10, VIEW.height);
  ctx.closePath();
  ctx.fill();
  if (snow) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let sx = -10; sx <= VIEW.width + step; sx += step * 2) {
      const wx = plane.x + (sx - PLANE_SCREEN_X) / factor;
      const h = terrainHeight(world, wx);
      if (h > 430) {
        const sy = screenY(camera, h);
        ctx.beginPath();
        ctx.moveTo(sx - 26, sy + 26);
        ctx.lineTo(sx, sy - 6);
        ctx.lineTo(sx + 26, sy + 26);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
}

function drawSea(ctx, camera, plane, t, night) {
  const seaTop = screenY(camera, 0);
  const g = ctx.createLinearGradient(0, seaTop, 0, VIEW.height);
  if (night) {
    g.addColorStop(0, '#1d3a5f');
    g.addColorStop(1, '#0a1a30');
  } else {
    g.addColorStop(0, '#3f7ea6');
    g.addColorStop(1, '#1d4a68');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, seaTop, VIEW.width, VIEW.height - seaTop);
  // Wavelets.
  ctx.strokeStyle = night ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 26; i += 1) {
    const wx = plane.x + i * 173 - ((plane.x * 1) % 173);
    const sx = screenX(camera, wx, plane);
    const sy = seaTop + 12 + ((i * 47) % 90) + Math.sin(t * 1.4 + i) * 3;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx + 18, sy - 4, sx + 40, sy);
    ctx.stroke();
  }
}

function drawVillage(ctx, camera, plane, v, t, night) {
  const sx = screenX(camera, v.x, plane);
  if (sx < -260 || sx > VIEW.width + 260) return;
  const seaTop = screenY(camera, 0);
  // Red rorbu cabins on stilts at the water's edge.
  for (let i = 0; i < v.cabins; i += 1) {
    const cx = sx + i * 46 - v.cabins * 23;
    ctx.fillStyle = '#5a3a28';
    ctx.fillRect(cx + 4, seaTop - 8, 4, 26);
    ctx.fillRect(cx + 30, seaTop - 8, 4, 26);
    ctx.fillStyle = '#a33327';
    ctx.fillRect(cx, seaTop - 34, 38, 26);
    ctx.fillStyle = '#6e2018';
    ctx.beginPath();
    ctx.moveTo(cx - 3, seaTop - 34);
    ctx.lineTo(cx + 19, seaTop - 48);
    ctx.lineTo(cx + 41, seaTop - 34);
    ctx.closePath();
    ctx.fill();
    // Lit windows after dark, warm yellow in the day.
    ctx.fillStyle = night ? '#ffd98a' : '#ffe9b0';
    ctx.fillRect(cx + 7, seaTop - 27, 8, 8);
    ctx.fillRect(cx + 23, seaTop - 27, 8, 8);
  }
  // Fish racks: the A-frames of drying stockfish, Lofoten's signature.
  for (let i = 0; i < v.racks; i += 1) {
    const rx = sx + 60 + i * 34;
    ctx.strokeStyle = '#4a3423';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rx, seaTop);
    ctx.lineTo(rx + 12, seaTop - 30);
    ctx.lineTo(rx + 24, seaTop);
    ctx.stroke();
    ctx.strokeStyle = '#c8b08a';
    ctx.lineWidth = 1.5;
    for (let f = 0; f < 4; f += 1) {
      ctx.beginPath();
      ctx.moveTo(rx + 4 + f * 5, seaTop - 24);
      ctx.lineTo(rx + 4 + f * 5, seaTop - 12);
      ctx.stroke();
    }
  }
  // Boats bobbing by the cabins.
  for (let i = 0; i < v.boats; i += 1) {
    const bx = sx - 70 - i * 44;
    const bob = Math.sin(t * 1.2 + i * 2) * 3;
    ctx.fillStyle = '#f2ede4';
    ctx.beginPath();
    ctx.moveTo(bx - 18, seaTop + 4 + bob);
    ctx.lineTo(bx + 18, seaTop + 4 + bob);
    ctx.lineTo(bx + 12, seaTop + 12 + bob);
    ctx.lineTo(bx - 12, seaTop + 12 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx, seaTop + 4 + bob);
    ctx.lineTo(bx, seaTop - 18 + bob);
    ctx.stroke();
  }
  // The lighthouse, when the village has one.
  if (v.lighthouse) {
    const lx = sx + 110;
    ctx.fillStyle = '#f5f2ea';
    ctx.fillRect(lx - 9, seaTop - 74, 18, 74);
    ctx.fillStyle = '#a33327';
    ctx.fillRect(lx - 11, seaTop - 86, 22, 12);
    if (night) {
      ctx.fillStyle = '#ffe9a8';
      ctx.beginPath();
      ctx.arc(lx, seaTop - 80, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 233, 168, 0.10)';
      ctx.beginPath();
      ctx.moveTo(lx, seaTop - 80);
      ctx.lineTo(lx + 260, seaTop - 130);
      ctx.lineTo(lx + 260, seaTop - 30);
      ctx.closePath();
      ctx.fill();
    }
  }
  // Place name.
  ctx.fillStyle = night ? 'rgba(255,255,255,0.85)' : 'rgba(10, 25, 40, 0.85)';
  ctx.font = '700 15px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(v.place.toUpperCase(), sx, seaTop - 96);
  ctx.textAlign = 'left';
}

function drawRings(ctx, camera, plane, world, t, glow) {
  for (const ring of world.rings) {
    const sx = screenX(camera, ring.x, plane);
    if (sx < -120 || sx > VIEW.width + 120) continue;
    const sy = screenY(camera, ring.y);
    const pulse = 1 + Math.sin(t * 3 + ring.index) * 0.05;
    const r = ring.r * pulse;
    if (ring.missed) {
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 4;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      continue;
    }
    if (ring.hit) {
      ctx.strokeStyle = 'rgba(125, 255, 158, 0.5)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.stroke();
      continue;
    }
    const next = world.rings.find((x) => !x.hit) === ring;
    if (glow || next) {
      ctx.strokeStyle = 'rgba(255, 200, 60, 0.25)';
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.arc(sx, sy, r + 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = next ? '#ffcf3d' : '#d9a521';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.stroke();
    if (next) {
      // Beacon column above the next ring.
      ctx.fillStyle = 'rgba(255, 207, 61, 0.16)';
      ctx.fillRect(sx - 3, sy - r - 220, 6, 220);
      ctx.fillStyle = '#ffcf3d';
      ctx.font = '700 13px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`RING ${ring.index + 1}`, sx, sy - r - 14);
      ctx.textAlign = 'left';
    }
  }
}

function drawLandingZone(ctx, camera, plane, world) {
  const x0 = screenX(camera, world.landing.x0, plane);
  const x1 = screenX(camera, world.landing.x1, plane);
  const seaTop = screenY(camera, 0);
  ctx.strokeStyle = 'rgba(255, 180, 84, 0.8)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(x0, seaTop + 2);
  ctx.lineTo(x1, seaTop + 2);
  ctx.stroke();
  ctx.setLineDash([]);
  for (const bx of [x0, x1]) {
    ctx.fillStyle = '#ff7a1a';
    ctx.beginPath();
    ctx.arc(bx, seaTop + 6, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(bx - 1, seaTop - 14, 2, 20);
  }
  ctx.fillStyle = '#ffb454';
  ctx.font = '700 14px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`LAND HERE — ${world.landing.name.toUpperCase()}`, (x0 + x1) / 2, seaTop - 26);
  ctx.textAlign = 'left';
}

// The floatplane, drawn as a side profile with a spinning prop, lit
// windows and navigation lights. Nose points right, along the flight.
export function drawPlane(ctx, plane, night, t) {
  ctx.save();
  ctx.translate(PLANE_SCREEN_X, PLANE_SCREEN_Y);
  ctx.rotate(-plane.pitch);
  // Floats.
  ctx.fillStyle = '#c33d2e';
  ctx.beginPath();
  ctx.roundRect(-34, 16, 62, 9, 4);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(-30, 16, 58, 9, 4);
  ctx.fill();
  ctx.fillStyle = '#8a2a1f';
  ctx.fillRect(-28, 8, 4, 9);
  ctx.fillRect(14, 8, 4, 9);
  // Fuselage.
  const body = ctx.createLinearGradient(0, -16, 0, 12);
  body.addColorStop(0, '#f4f1e8');
  body.addColorStop(1, '#c9c2b2');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-52, 2);
  ctx.quadraticCurveTo(-56, -12, -30, -14);
  ctx.lineTo(30, -14);
  ctx.quadraticCurveTo(52, -10, 54, 0);
  ctx.quadraticCurveTo(50, 8, 30, 10);
  ctx.lineTo(-30, 10);
  ctx.quadraticCurveTo(-50, 10, -52, 2);
  ctx.closePath();
  ctx.fill();
  // Red cheatline.
  ctx.fillStyle = '#b3312a';
  ctx.fillRect(-50, -2, 100, 4);
  // Cockpit windows, lit amber.
  ctx.fillStyle = night ? '#ffd98a' : '#9fc4dd';
  ctx.beginPath();
  ctx.moveTo(18, -12);
  ctx.lineTo(38, -10);
  ctx.lineTo(34, -2);
  ctx.lineTo(18, -3);
  ctx.closePath();
  ctx.fill();
  // High wing.
  ctx.fillStyle = '#e8e2d2';
  ctx.beginPath();
  ctx.moveTo(-14, -14);
  ctx.lineTo(6, -14);
  ctx.lineTo(2, -30);
  ctx.lineTo(-20, -30);
  ctx.closePath();
  ctx.fill();
  // Tail.
  ctx.fillStyle = '#b3312a';
  ctx.beginPath();
  ctx.moveTo(-48, -12);
  ctx.lineTo(-58, -34);
  ctx.lineTo(-46, -34);
  ctx.lineTo(-38, -12);
  ctx.closePath();
  ctx.fill();
  // Propeller, a blurred disc when the throttle is up.
  const spin = plane.throttle > 2;
  ctx.strokeStyle = spin ? 'rgba(40,40,40,0.35)' : 'rgba(40,40,40,0.9)';
  ctx.lineWidth = spin ? 7 : 3;
  ctx.beginPath();
  ctx.ellipse(58, -4, 4, spin ? 26 : 24, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(58, -4, 4, 0, Math.PI * 2);
  ctx.fill();
  // Navigation lights: red on the tail, green on the wingtip, white strobe.
  ctx.fillStyle = '#ff3b30';
  ctx.beginPath();
  ctx.arc(-52, -4, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#35e07a';
  ctx.beginPath();
  ctx.arc(2, -30, 3, 0, Math.PI * 2);
  ctx.fill();
  if (Math.floor(t * 1.6) % 2 === 0) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-46, -34, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawRain(ctx, world, t) {
  if (world.sortie.type !== 'storm') return;
  ctx.strokeStyle = 'rgba(200, 220, 255, 0.35)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 90; i += 1) {
    const x = ((i * 173 + t * 900) % 1400) - 60;
    const y = ((i * 97 + t * 1400) % 820) - 20;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 12, y + 26);
    ctx.stroke();
  }
}

function drawSpray(ctx, plane, t) {
  if (!plane.onWater || plane.speed < 8) return;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (let i = 0; i < 14; i += 1) {
    const spread = (i / 14) * 70;
    const sx = PLANE_SCREEN_X - 40 - spread + Math.sin(t * 9 + i) * 6;
    const sy = PLANE_SCREEN_Y + 26 - Math.abs(Math.sin(t * 6 + i)) * 14;
    ctx.beginPath();
    ctx.arc(sx, sy, 2.5 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
}

// One full frame of the flying game.
export function drawScene(ctx, camera, world, plane, run, t, muted) {
  const night = world.night;
  skyGradient(ctx, night);
  drawSun(ctx, night, t, camera);
  drawClouds(ctx, plane, t, night);
  drawRidgeLayer(ctx, camera, world, plane, 0.3, night ? '#232c44' : '#8fa8c4', false);
  drawRidgeLayer(ctx, camera, world, plane, 0.6, night ? '#1a2238' : '#6d89a8', false);
  drawSea(ctx, camera, plane, t, night);
  drawRidgeLayer(ctx, camera, world, plane, 1.0, night ? '#141a2c' : '#4d6a86', true);
  for (const v of world.villages) drawVillage(ctx, camera, plane, v, t, night);
  drawLandingZone(ctx, camera, plane, world);
  drawRings(ctx, camera, plane, world, t, false);
  drawPlane(ctx, plane, night, t);
  drawSpray(ctx, plane, t);
  drawRain(ctx, world, t);
}
