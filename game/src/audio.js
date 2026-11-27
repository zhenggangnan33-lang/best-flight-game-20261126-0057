// Synthesised sound, no audio files: a low engine hum that follows
// the throttle, a chime for a ring, a splash, a warning beep and a
// crash thud. Everything is WebAudio oscillators, created lazily on
// the first user gesture so the page never needs a sound asset.

export function createAudio() {
  let ctx = null;
  let engineOsc = null;
  let engineGain = null;
  let muted = false;

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      engineOsc = ctx.createOscillator();
      engineOsc.type = 'sawtooth';
      engineOsc.frequency.value = 55;
      engineGain = ctx.createGain();
      engineGain.gain.value = 0;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 320;
      engineOsc.connect(filter);
      filter.connect(engineGain);
      engineGain.connect(ctx.destination);
      engineOsc.start();
      return true;
    } catch {
      return false;
    }
  }

  function blip(freq, dur, type, vol, slideTo) {
    if (!ensure() || muted || !ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
    gain.gain.setValueAtTime(vol || 0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }

  return {
    unlock() {
      ensure();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    },
    setEngine(throttle, flying) {
      if (!ensure() || !engineGain) return;
      const target = muted || !flying ? 0 : 0.015 + (throttle / 100) * 0.05;
      engineGain.gain.setTargetAtTime(target, ctx.currentTime, 0.1);
      engineOsc.frequency.setTargetAtTime(48 + throttle * 0.7, ctx.currentTime, 0.1);
    },
    ring(gold) {
      blip(gold ? 880 : 660, 0.25, 'sine', 0.14);
      blip(gold ? 1320 : 990, 0.3, 'sine', 0.1);
    },
    splash() {
      blip(220, 0.4, 'triangle', 0.12, 60);
    },
    warn() {
      blip(440, 0.12, 'square', 0.06);
    },
    crash() {
      blip(120, 0.6, 'sawtooth', 0.2, 30);
    },
    click() {
      blip(700, 0.06, 'sine', 0.08);
    },
    fanfare() {
      blip(523, 0.18, 'sine', 0.12);
      setTimeout(() => blip(659, 0.18, 'sine', 0.12), 160);
      setTimeout(() => blip(784, 0.35, 'sine', 0.12), 320);
    },
    toggleMute() {
      muted = !muted;
      if (engineGain && ctx) engineGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      return muted;
    },
    get muted() {
      return muted;
    },
  };
}
