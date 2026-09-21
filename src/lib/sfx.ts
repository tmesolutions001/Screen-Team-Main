/**
 * Answer feedback sounds, synthesized with Web Audio: no assets to load,
 * no decode latency, works offline. Kept short and quiet so they never mask
 * the next spoken prompt.
 */

import { getSettings } from './settings';

let ctx: AudioContext | null = null;

const getContext = (): AudioContext | null => {
  try {
    ctx ??= new AudioContext();
    // Browsers start the context suspended until a user gesture; by the time
    // an answer is submitted the player has typed, so resume always succeeds.
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
};

interface Tone {
  type: OscillatorType;
  freq: number;
  /** Glide to this frequency over the tone's duration. */
  endFreq?: number;
  /** Seconds from now. */
  delay?: number;
  duration: number;
  gain: number;
  /** Optional low-pass cutoff to soften harsh waveforms. */
  lowpass?: number;
}

const playTone = (ac: AudioContext, { type, freq, endFreq, delay = 0, duration, gain, lowpass }: Tone) => {
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const amp = ac.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + duration);

  // Fast attack, exponential decay: a pluck, with no click at either end.
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  let node: AudioNode = osc;
  if (lowpass) {
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    node = osc.connect(filter);
  }
  node.connect(amp).connect(ac.destination);

  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
};

/** Rising two-note chime (A5 → E6). */
export const playCorrect = () => {
  const ac = getContext();
  if (!ac) return;
  playTone(ac, { type: 'sine', freq: 880, duration: 0.12, gain: 0.12 });
  playTone(ac, { type: 'sine', freq: 1318.5, delay: 0.07, duration: 0.18, gain: 0.12 });
};

/** Soft low buzz that sags in pitch. */
export const playWrong = () => {
  const ac = getContext();
  if (!ac) return;
  playTone(ac, { type: 'sawtooth', freq: 170, endFreq: 110, duration: 0.2, gain: 0.14, lowpass: 700 });
};

export const playResult = (correct: boolean) => {
  if (!getSettings().sfx) return;
  if (correct) playCorrect();
  else playWrong();
};
