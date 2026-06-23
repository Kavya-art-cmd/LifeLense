/**
 * Cinematic ambient synthesizer — no external API.
 * Creates a deep atmospheric pad with subtle melodic tones using Web Audio API.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let started = false;

function createReverb(audioCtx: AudioContext): ConvolverNode {
  const conv = audioCtx.createConvolver();
  const sr = audioCtx.sampleRate;
  const len = sr * 3;
  const buf = audioCtx.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    }
  }
  conv.buffer = buf;
  return conv;
}

function addDrone(
  audioCtx: AudioContext,
  reverb: ConvolverNode,
  mg: GainNode,
  freq: number,
  gainAmt: number,
  lfoRate: number
) {
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc.type = "sine";
  osc.frequency.value = freq;
  filter.type = "lowpass";
  filter.frequency.value = 900;
  filter.Q.value = 0.8;
  g.gain.value = 0;

  lfo.type = "sine";
  lfo.frequency.value = lfoRate;
  lfoGain.gain.value = gainAmt * 0.15;

  lfo.connect(lfoGain);
  lfoGain.connect(g.gain);
  osc.connect(filter);
  filter.connect(g);
  g.connect(reverb);
  g.connect(mg);

  osc.start();
  lfo.start();

  // Fade in slowly
  g.gain.setTargetAtTime(gainAmt, audioCtx.currentTime, 2.5);

  return { osc, g, lfo };
}

function addPad(
  audioCtx: AudioContext,
  reverb: ConvolverNode,
  mg: GainNode,
  freq: number,
  gainAmt: number
) {
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const g = audioCtx.createGain();

  osc1.type = "triangle";
  osc1.frequency.value = freq;
  osc2.type = "sine";
  osc2.frequency.value = freq * 1.003; // slight detuning for warmth

  g.gain.value = 0;
  osc1.connect(g);
  osc2.connect(g);
  g.connect(reverb);

  osc1.start();
  osc2.start();
  g.gain.setTargetAtTime(gainAmt, audioCtx.currentTime, 3.5);

  return { osc1, osc2, g };
}

export function startAmbient() {
  if (started) return;
  started = true;

  try {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.55;
    masterGain.connect(ctx.destination);

    const reverb = createReverb(ctx);
    reverb.connect(masterGain);

    // Root drone: A1 (55 Hz)
    addDrone(ctx, reverb, masterGain, 55, 0.12, 0.08);
    // Fifth: E2 (82.4 Hz)
    addDrone(ctx, reverb, masterGain, 82.4, 0.07, 0.11);
    // Octave pad: A2 (110 Hz)
    addPad(ctx, reverb, masterGain, 110, 0.05);
    // High shimmer: A4 (440 Hz) very quiet
    addPad(ctx, reverb, masterGain, 440, 0.015);
    // Warm mid: E3 (164.8)
    addPad(ctx, reverb, masterGain, 164.8, 0.03);
  } catch {
    // Web Audio not available — silent fallback
  }
}

export function stopAmbient() {
  if (masterGain && ctx) {
    masterGain.gain.setTargetAtTime(0, ctx.currentTime, 1.5);
    setTimeout(() => {
      try { ctx?.close(); } catch { /* ignore */ }
      ctx = null;
      masterGain = null;
      started = false;
    }, 4000);
  }
}
