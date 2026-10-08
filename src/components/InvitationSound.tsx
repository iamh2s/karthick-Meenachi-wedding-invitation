/**
 * Premium "card opening" sound, synthesised live with the Web Audio API.
 * No audio files needed. Timed to InvitationEnvelope's animation:
 *
 *   0.00s  wax seal cracks            (open() starts)
 *   0.80s  light blooms, flap opens   → rising glass bells + paper swish
 *   1.95s  letter slides out          → soft paper friction
 *   3.10s  letter comes forward       → low swell + warm chord
 *   4.40s  golden chime + sparkle     → long bell tail
 *   6.60s  silence
 */

export const INVITATION_SOUND_DURATION = 6.6;

const TWO_PI = Math.PI * 2;
const curve = (n: number, fn: (x: number) => number) => {
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) c[i] = fn(i / (n - 1));
  return c;
};
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Generates a soft, dark plate-style reverb impulse response (energy-normalised). */
function makeImpulse(ctx: BaseAudioContext) {
  const sr = ctx.sampleRate;
  const n = Math.floor(2.6 * sr);
  const buf = ctx.createBuffer(2, n, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let y = 0;
    let energy = 0;
    for (let i = 0; i < n; i++) {
      const x = (Math.random() * 2 - 1) * Math.exp(-i / sr / 0.36);
      y += 0.6 * (x - y); // one-pole low-pass ≈ 6 kHz
      d[i] = i < 0.018 * sr ? 0 : y;
      energy += d[i] * d[i];
    }
    const norm = 1 / Math.sqrt(energy);
    for (let i = 0; i < n; i++) d[i] *= norm;
  }
  return buf;
}

function makeNoise(ctx: BaseAudioContext, seconds: number) {
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.floor(seconds * sr), sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/**
 * Schedules the whole sound on any AudioContext (real or offline).
 * `t0` is the context time at which the seal cracks.
 */
export function scheduleInvitationSound(ctx: BaseAudioContext, out: AudioNode, t0: number) {
  const noiseBuf = makeNoise(ctx, 4);

  /* ── master chain: reverb send → high-pass → glue compressor → out ── */
  const master = ctx.createGain();
  master.gain.value = 0.82;
  master.gain.setValueAtTime(0.82, t0 + 5.5);
  master.gain.linearRampToValueAtTime(0, t0 + INVITATION_SOUND_DURATION);

  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 28;
  const glue = ctx.createDynamicsCompressor();
  glue.threshold.value = -14;
  glue.knee.value = 12;
  glue.ratio.value = 3;
  glue.attack.value = 0.004;
  glue.release.value = 0.25;
  master.connect(hp);
  hp.connect(glue);
  glue.connect(out);

  const sendBus = ctx.createGain();
  const reverb = ctx.createConvolver();
  reverb.normalize = false;
  reverb.buffer = makeImpulse(ctx);
  const wet = ctx.createGain();
  wet.gain.value = 1.1;
  sendBus.connect(reverb);
  reverb.connect(wet);
  wet.connect(master);

  /** pan + dry + reverb send */
  const route = (node: AudioNode, pan = 0, send = 0.2) => {
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    node.connect(p);
    p.connect(master);
    if (send > 0) {
      const s = ctx.createGain();
      s.gain.value = send;
      p.connect(s);
      s.connect(sendBus);
    }
  };

  const noiseSrc = (start: number, dur: number) => {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.start(t0 + start, rand(0, 3.5 - dur), dur);
    return src;
  };

  /** short filtered noise hit with exponential decay */
  const hit = (
    start: number, dur: number, type: BiquadFilterType, f: number, f2: number | null,
    amp: number, tau: number, pan = 0, send = 0.2
  ) => {
    const src = noiseSrc(start, dur);
    const flt = ctx.createBiquadFilter();
    flt.type = type;
    flt.frequency.value = f;
    if (f2) flt.Q.value = f / Math.max(1, f2 - f * 0.5); // rough band width for band-pass
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0 + start);
    g.gain.linearRampToValueAtTime(amp, t0 + start + 0.0006);
    g.gain.setTargetAtTime(0, t0 + start + 0.0006, tau);
    src.connect(flt);
    flt.connect(g);
    route(g, pan, send);
  };

  /** sine thump that falls in pitch */
  const thump = (
    start: number, f0: number, f1: number, tauF: number, tauA: number,
    amp: number, dur: number, pan = 0, send = 0.1
  ) => {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(f0, t0 + start);
    o.frequency.setTargetAtTime(f1, t0 + start, tauF);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0 + start);
    g.gain.linearRampToValueAtTime(amp, t0 + start + 0.003);
    g.gain.setTargetAtTime(0, t0 + start + 0.003, tauA);
    o.connect(g);
    route(g, pan, send);
    o.start(t0 + start);
    o.stop(t0 + start + dur);
  };

  /** glass / bell tone made of inharmonic partials */
  const bell = (freq: number, start: number, dur: number, amp: number, pan = 0, send = 0.5) => {
    const parts: [number, number, number][] = [
      [1.0, 1.0, 0.45], [2.0, 0.32, 0.3], [2.76, 0.22, 0.2], [5.4, 0.07, 0.1], [8.93, 0.03, 0.05],
    ];
    const bus = ctx.createGain();
    bus.gain.value = amp * 0.55;
    for (const [ratio, a, tau] of parts) {
      if (freq * ratio > 12000) continue;
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = freq * ratio;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0 + start);
      g.gain.linearRampToValueAtTime(a, t0 + start + 0.003);
      g.gain.setTargetAtTime(0, t0 + start + 0.003, tau * dur);
      o.connect(g);
      g.connect(bus);
      o.start(t0 + start);
      o.stop(t0 + start + dur);
    }
    route(bus, pan, send);
  };

  /** noise through a band-pass whose centre frequency follows `fc(x)` (x = 0..1) */
  const sweep = (
    start: number, dur: number, fc: (x: number) => number, q: number,
    env: (x: number) => number, amp: number, pan = 0, send = 0.2
  ) => {
    const src = noiseSrc(start, dur);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = q;
    bp.frequency.setValueCurveAtTime(curve(256, fc), t0 + start, dur);
    const g = ctx.createGain();
    g.gain.setValueCurveAtTime(curve(512, (x) => env(x) * amp), t0 + start, dur);
    src.connect(bp);
    bp.connect(g);
    route(g, pan, send);
  };

  /* ───────────── 1. wax seal cracks (0.00s) ───────────── */
  hit(0.0, 0.12, "highpass", 2500, null, 0.5, 0.012, 0, 0.12);
  hit(0.034, 0.08, "highpass", 1800, null, 0.28, 0.008, 0.15, 0.12);
  thump(0.0, 145, 55, 0.05, 0.075, 0.48, 0.4, 0, 0.1);
  for (let i = 0; i < 7; i++) {
    hit(0.05 + Math.random() * 0.32, 0.04, "bandpass", 2700, 3800, rand(0.1, 0.22), 0.006, rand(-0.8, 0.8), 0.2);
  }
  thump(0.62, 760, 760, 1, 0.025, 0.05, 0.14, 0.2, 0.3); // seal lands

  /* ───────────── 2. light blooms, flap swings open (0.80 → 1.90s) ───────────── */
  [1174.66, 1479.98, 1760.0, 1975.53, 2349.32].forEach((f, k) => {
    bell(f, 0.92 + k * 0.125, 1.5, 0.14 - k * 0.008, [-0.5, 0.4, -0.2, 0.55, 0][k], 0.55);
  });
  sweep(0.84, 1.15, (x) => 500 * Math.pow(4200 / 500, x), 1.4, (x) => Math.pow(Math.sin(Math.PI * Math.pow(x, 0.8)), 1.6), 0.55, 0, 0.25);
  sweep(0.84, 1.15, () => 260, 0.5, (x) => Math.pow(Math.sin(Math.PI * Math.pow(x, 0.8)), 1.6), 0.3, 0, 0.15); // air
  hit(1.28, 0.1, "lowpass", 1400, null, 0.16, 0.02, 0, 0.2);            // passes behind the letter
  thump(1.9, 140, 70, 0.03, 0.05, 0.38, 0.3, 0, 0.15);                   // flap settles
  hit(1.9, 0.14, "bandpass", 1100, 2400, 0.18, 0.02, 0, 0.2);

  /* ───────────── 3. letter slides out (1.95 → 3.10s) ───────────── */
  {
    const dur = 1.15;
    const pts = Array.from({ length: 34 }, () => 0.55 + 0.45 * Math.random());
    const grain = (x: number) => {
      const p = x * (pts.length - 1);
      const i = Math.floor(p);
      return pts[i] + (pts[Math.min(i + 1, pts.length - 1)] - pts[i]) * (p - i);
    };
    sweep(1.95, dur, (x) => 3300 + 1100 * Math.sin(TWO_PI * 0.9 * x) + 500 * x, 0.9,
      (x) => Math.pow(Math.sin(Math.PI * x), 1.3) * grain(x), 0.2, 0, 0.2);
    sweep(1.95, dur, () => 360, 0.6, (x) => Math.pow(Math.sin(Math.PI * x), 1.3), 0.1, 0, 0.1);
  }

  /* ───────────── 4. letter comes forward, envelope sinks (3.10 → 4.40s) ───────────── */
  thump(3.1, 70, 46, 0.2, 0.3, 0.4, 1.2, 0, 0.1);
  sweep(3.12, 1.2, (x) => 2600 * Math.pow(450 / 2600, x), 1.1, (x) => Math.pow(Math.sin(Math.PI * x), 1.4), 0.5, 0, 0.3);

  // warm pad swell: D major add9
  const padWave = ctx.createPeriodicWave(new Float32Array([0, 0, 0, 0]), new Float32Array([0, 1, 0.25, 0.08]));
  const padDur = 3.5;
  ([[146.83, -0.5], [220.0, 0.4], [293.66, -0.3], [369.99, 0.3], [440.0, -0.2], [659.26, 0.5]] as [number, number][])
    .forEach(([f, pan]) => {
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 3200;
      lp.Q.value = 0.5;
      const env = ctx.createGain();
      const a = 0.9 / padDur, r = 1.5 / padDur;
      env.gain.setValueCurveAtTime(
        curve(256, (x) => (x < a ? 0.5 - 0.5 * Math.cos((Math.PI * x) / a) : x > 1 - r ? 0.5 + 0.5 * Math.cos((Math.PI * (x - (1 - r))) / r) : 1) * 0.075),
        t0 + 3.15, padDur
      );
      for (const cents of [-3, 3]) {
        const o = ctx.createOscillator();
        o.setPeriodicWave(padWave);
        o.frequency.value = f * Math.pow(2, cents / 1200);
        o.connect(lp);
        o.start(t0 + 3.15);
        o.stop(t0 + 3.15 + padDur);
      }
      lp.connect(env);
      route(env, pan, 0.6);
    });

  /* ───────────── 5. golden chime + sparkle (4.40s →) ───────────── */
  bell(587.33, 4.4, 2.6, 0.24, -0.1, 0.5);
  bell(1174.66, 4.4, 2.2, 0.16, 0.15, 0.5);
  bell(1760.0, 4.43, 2.0, 0.09, 0.3, 0.5);
  bell(293.66, 4.4, 3.0, 0.14, 0, 0.4);
  const sparkle = [2349.32, 2637.02, 2959.96, 3520.0, 3951.07, 4698.64];
  let tm = 4.52;
  for (let i = 0; i < 10; i++) {
    tm += rand(0.05, 0.14);
    bell(sparkle[Math.floor(Math.random() * sparkle.length)], tm, 0.9, rand(0.035, 0.07), rand(-0.85, 0.85), 0.7);
  }

  /** fade everything out quickly (e.g. if the user skips) */
  const stop = () => {
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + 0.25);
  };
  return { duration: INVITATION_SOUND_DURATION, stop };
}

/* ───────────── live playback (call from a click / tap handler) ───────────── */
let shared: AudioContext | null = null;

export function playInvitationOpen(): () => void {
  try {
    const AC: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return () => {};
    shared = shared ?? new AC();
    const ctx = shared;
    if (ctx.state === "suspended") void ctx.resume();
    return scheduleInvitationSound(ctx, ctx.destination, ctx.currentTime + 0.06).stop;
  } catch {
    return () => {};
  }
}