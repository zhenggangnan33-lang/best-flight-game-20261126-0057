// The lit instruments: altitude, speed and heading on the HUD, plus
// an artificial horizon, fuel and hull gauges, a compass strip and the
// sortie banner. Everything here is drawn, never loaded — the dials
// are the "instruments lit" the bounty asks to see in the screenshots.

import { VIEW } from './config.js';
import { hudAltitude, hudSpeed } from './plane.js';
import { terrainHeight } from './terrain.js';

const AMBER = '#ffb454';
const GREEN = '#7dff9e';
const RED = '#ff5d5d';
const PANEL = 'rgba(8, 14, 24, 0.78)';
const EDGE = 'rgba(255, 180, 84, 0.55)';

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = PANEL;
  ctx.strokeStyle = EDGE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
}

function label(ctx, text, x, y, size, color) {
  ctx.fillStyle = color || 'rgba(255, 255, 255, 0.62)';
  ctx.font = `600 ${size}px ui-monospace, "SF Mono", Menlo, monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

function value(ctx, text, x, y, size, color) {
  ctx.fillStyle = color || '#ffffff';
  ctx.font = `700 ${size}px ui-monospace, "SF Mono", Menlo, monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

// The attitude ball: sky above the horizon line, earth below, the
// plane's wings fixed while the ball rolls with the pitch.
export function drawAttitude(ctx, x, y, r, plane) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.translate(x, y);
  ctx.rotate(-plane.pitch * 0.7);
  ctx.translate(0, plane.pitch * r * 0.9);
  ctx.fillStyle = '#2f6fb2';
  ctx.fillRect(-r, -r * 2, r * 2, r * 2);
  ctx.fillStyle = '#7a5230';
  ctx.fillRect(-r, 0, r * 2, r * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.lineTo(r, 0);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1;
  for (const dy of [-r * 0.5, r * 0.5]) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, dy);
    ctx.lineTo(r * 0.55, dy);
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  // Fixed wings of the symbol.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.55, y);
  ctx.lineTo(x - r * 0.18, y);
  ctx.moveTo(x + r * 0.18, y);
  ctx.lineTo(x + r * 0.55, y);
  ctx.stroke();
  ctx.fillStyle = AMBER;
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();
}

function gauge(ctx, x, y, w, h, frac, color, name) {
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 4);
  ctx.fill();
  ctx.fillStyle = color;
  const fw = Math.max(0, Math.min(1, frac)) * w;
  ctx.beginPath();
  ctx.roundRect(x, y, fw, h, 4);
  ctx.fill();
  label(ctx, name, x, y - 6, 11);
}

export function drawCompass(ctx, heading, width) {
  const cx = VIEW.width / 2;
  const y = VIEW.height - 34;
  panel(ctx, cx - width / 2, y - 14, width, 30);
  ctx.save();
  ctx.beginPath();
  ctx.rect(cx - width / 2, y - 14, width, 30);
  ctx.clip();
  const points = [[0, 'N'], [45, 'NE'], [90, 'E'], [135, 'SE'], [180, 'S'], [225, 'SW'], [270, 'W'], [315, 'NW']];
  for (let d = -180; d <= 180; d += 15) {
    const deg = ((Math.round(heading) + d + 360) % 360);
    const px = cx + (d / 15) * 34;
    const major = deg % 45 === 0;
    ctx.strokeStyle = major ? AMBER : 'rgba(255,255,255,0.4)';
    ctx.lineWidth = major ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(px, y + 8);
    ctx.lineTo(px, y + (major ? -4 : 2));
    ctx.stroke();
    if (major) {
      const pt = points.find((p) => p[0] === deg);
      ctx.fillStyle = AMBER;
      ctx.font = '700 11px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(pt ? pt[1] : String(deg).padStart(3, '0'), px, y - 6);
    }
  }
  ctx.restore();
  // The lubber line.
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.moveTo(cx, y - 14);
  ctx.lineTo(cx - 6, y - 24);
  ctx.lineTo(cx + 6, y - 24);
  ctx.closePath();
  ctx.fill();
}

export function drawHud(ctx, plane, run, world, t, muted) {
  const heading = 90; // the run flies east along the chain
  const alt = hudAltitude(plane);
  const spd = hudSpeed(plane);
  const vsi = Math.round(plane.vy);

  // Top bar: the four numbers the bounty names.
  panel(ctx, 16, 14, 560, 64);
  label(ctx, 'ALT', 30, 34, 11);
  value(ctx, `${alt} FT`, 30, 62, 24, alt < 80 && plane.airborne ? RED : '#ffffff');
  label(ctx, 'SPD', 180, 34, 11);
  value(ctx, `${spd} KT`, 180, 62, 24, plane.stalled ? RED : '#ffffff');
  label(ctx, 'HDG', 320, 34, 11);
  value(ctx, `${String(heading).padStart(3, '0')}°`, 320, 62, 24);
  label(ctx, 'VSI', 450, 34, 11);
  value(ctx, `${vsi >= 0 ? '+' : ''}${vsi}`, 450, 62, 24, Math.abs(vsi) > 20 ? AMBER : '#ffffff');

  // Throttle bar under the top bar.
  panel(ctx, 16, 86, 200, 26);
  label(ctx, 'THR', 26, 104, 11);
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.beginPath();
  ctx.roundRect(66, 92, 138, 12, 4);
  ctx.fill();
  ctx.fillStyle = GREEN;
  ctx.beginPath();
  ctx.roundRect(66, 92, 138 * (plane.throttle / 100), 12, 4);
  ctx.fill();
  value(ctx, `${Math.round(plane.throttle)}%`, 212 - 40, 104, 11, '#ffffff');
  if (plane.flaps) value(ctx, 'FLAPS', 228, 104, 11, AMBER);

  // Sortie banner, top right.
  const s = run.sortie;
  panel(ctx, VIEW.width - 380, 14, 364, 64);
  label(ctx, `SORTIE ${s.number} — ${s.name.toUpperCase()}`, VIEW.width - 366, 34, 12, AMBER);
  value(ctx, `RINGS ${run.ringsHit}/${s.rings}   SCORE ${run.score}`, VIEW.width - 366, 62, 15);
  label(ctx, `TIME ${Math.floor(run.time / 60)}:${String(Math.floor(run.time % 60)).padStart(2, '0')}  PAR ${Math.floor(s.par / 60)}:${String(s.par % 60).padStart(2, '0')}`, VIEW.width - 366, 78, 11);

  // Instruments, bottom left.
  panel(ctx, 16, VIEW.height - 148, 190, 132);
  drawAttitude(ctx, 66, VIEW.height - 82, 42, plane);
  label(ctx, 'ATTITUDE', 116, VIEW.height - 128, 11);
  label(ctx, plane.stalled ? 'STALL' : 'LEVEL', 116, VIEW.height - 104, 12, plane.stalled ? RED : GREEN);
  label(ctx, plane.onWater ? 'ON WATER' : 'AIRBORNE', 116, VIEW.height - 82, 11);
  label(ctx, `FUEL ${Math.round(plane.fuel)}%`, 116, VIEW.height - 58, 11, plane.fuel < 20 ? RED : '#ffffff');
  label(ctx, `HULL ${Math.round(plane.hull)}%`, 116, VIEW.height - 36, 11, plane.hull < 40 ? RED : '#ffffff');

  // Fuel and hull gauges, bottom right.
  panel(ctx, VIEW.width - 226, VIEW.height - 148, 210, 132);
  label(ctx, 'FUEL', VIEW.width - 212, VIEW.height - 128, 11);
  gauge(ctx, VIEW.width - 212, VIEW.height - 118, 182, 12, plane.fuel / plane.fuelMax, plane.fuel < 20 ? RED : AMBER, '');
  label(ctx, 'HULL', VIEW.width - 212, VIEW.height - 88, 11);
  gauge(ctx, VIEW.width - 212, VIEW.height - 78, 182, 12, plane.hull / 100, plane.hull < 40 ? RED : GREEN, '');
  label(ctx, `DEST ${world.landing.name.toUpperCase()}`, VIEW.width - 212, VIEW.height - 44, 11, AMBER);
  label(ctx, muted ? 'M — SOUND OFF' : 'M — SOUND ON', VIEW.width - 212, VIEW.height - 26, 11);

  drawCompass(ctx, heading, 420);

  // Warnings, centre screen.
  const warn = [];
  if (plane.stalled && plane.airborne) warn.push(['STALL — NOSE DOWN, THROTTLE UP', RED]);
  if (plane.fuel < 20 && plane.fuel > 0) warn.push(['LOW FUEL', RED]);
  if (plane.fuel <= 0) warn.push(['FUEL EMPTY — GLIDING', RED]);
  const rock = terrainHeight(world, plane.x);
  if (plane.airborne && plane.y - rock < 60 && plane.y > rock) {
    // Only warn when rock is actually close below.
    warn.push(['TERRAIN', AMBER]);
  }
  if (warn.length && Math.floor(t * 2.5) % 2 === 0) {
    ctx.font = '800 26px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'center';
    warn.forEach(([text, color], i) => {
      ctx.fillStyle = color;
      ctx.fillText(text, VIEW.width / 2, 150 + i * 34);
    });
    ctx.textAlign = 'left';
  }

  // Next-ring pointer.
  const next = world.rings.find((r) => !r.hit);
  if (next && run.state === 'flying') {
    const dx = next.x - plane.x;
    if (dx > 500) {
      ctx.fillStyle = AMBER;
      ctx.font = '700 15px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`NEXT RING ${Math.round(dx)} FT →`, VIEW.width / 2, 108);
      ctx.textAlign = 'left';
    }
  }
}
