import { useUiStore } from '../store/uiStore';

let audioContext = null;
let masterGain = null;
let compressor = null;
let noiseBuffer = null;
const eventCooldowns = new Map();

function getAudioContext() {
  if (typeof window === 'undefined') {
    return null;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContextClass();
    masterGain = audioContext.createGain();
    compressor = audioContext.createDynamicsCompressor();

    masterGain.gain.value = 0.2;
    compressor.threshold.value = -18;
    compressor.knee.value = 18;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.18;

    masterGain.connect(compressor);
    compressor.connect(audioContext.destination);
  }

  return audioContext;
}

function getNoiseBuffer(context) {
  if (noiseBuffer) {
    return noiseBuffer;
  }

  const length = Math.max(1, Math.floor(context.sampleRate * 0.24));
  noiseBuffer = context.createBuffer(1, length, context.sampleRate);
  const channel = noiseBuffer.getChannelData(0);

  for (let index = 0; index < length; index += 1) {
    channel[index] = (Math.random() * 2 - 1) * (1 - index / length);
  }

  return noiseBuffer;
}

function shouldSkipEvent(eventName, cooldownMs = 22) {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const lastRun = eventCooldowns.get(eventName) ?? -Infinity;

  if (now - lastRun < cooldownMs) {
    return true;
  }

  eventCooldowns.set(eventName, now);
  return false;
}

function canPlay() {
  const context = getAudioContext();
  return Boolean(context && context.state === 'running' && masterGain && !useUiStore.getState().muted);
}

function createVoice(context, startAt, peak) {
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), startAt + 0.01);
  gain.connect(masterGain);
  return gain;
}

function scheduleTone({
  context,
  startAt,
  duration,
  frequency,
  endFrequency = frequency,
  type = 'square',
  gain = 0.06,
}) {
  const oscillator = context.createOscillator();
  const envelope = createVoice(context, startAt, gain);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(24, endFrequency), startAt + duration);

  envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(envelope);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

function scheduleNoise({
  context,
  startAt,
  duration,
  gain = 0.05,
  highpass = 500,
  lowpass = 5000,
}) {
  const source = context.createBufferSource();
  const envelope = createVoice(context, startAt, gain);
  const hp = context.createBiquadFilter();
  const lp = context.createBiquadFilter();

  source.buffer = getNoiseBuffer(context);
  hp.type = 'highpass';
  hp.frequency.setValueAtTime(highpass, startAt);
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(lowpass, startAt);

  envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  source.connect(hp);
  hp.connect(lp);
  lp.connect(envelope);
  source.start(startAt);
  source.stop(startAt + duration + 0.02);
}

function playBillAdd(context, startAt) {
  scheduleTone({ context, startAt, duration: 0.08, frequency: 620, endFrequency: 860, type: 'square', gain: 0.045 });
  scheduleTone({ context, startAt: startAt + 0.04, duration: 0.06, frequency: 900, endFrequency: 1120, type: 'triangle', gain: 0.03 });
}

function playBillRemove(context, startAt) {
  scheduleTone({ context, startAt, duration: 0.1, frequency: 760, endFrequency: 380, type: 'triangle', gain: 0.04 });
}

function playPaydayStart(context, startAt) {
  [440, 554, 659].forEach((frequency, index) => {
    scheduleTone({
      context,
      startAt: startAt + index * 0.09,
      duration: 0.12,
      frequency,
      endFrequency: frequency * 1.04,
      type: 'square',
      gain: 0.038,
    });
  });
}

function playHeroSpawn(context, startAt) {
  scheduleTone({ context, startAt, duration: 0.14, frequency: 140, endFrequency: 54, type: 'sawtooth', gain: 0.05 });
  scheduleNoise({ context, startAt: startAt + 0.02, duration: 0.1, gain: 0.022, highpass: 1200, lowpass: 6200 });
  scheduleTone({ context, startAt: startAt + 0.03, duration: 0.08, frequency: 900, endFrequency: 1280, type: 'triangle', gain: 0.024 });
}

function playMonsterSlay(context, startAt) {
  scheduleTone({ context, startAt, duration: 0.09, frequency: 520, endFrequency: 190, type: 'square', gain: 0.04 });
  scheduleNoise({ context, startAt: startAt + 0.01, duration: 0.08, gain: 0.03, highpass: 900, lowpass: 4200 });
}

function playXpTick(context, startAt) {
  [988, 1175, 1318].forEach((frequency, index) => {
    scheduleTone({
      context,
      startAt: startAt + index * 0.045,
      duration: 0.07,
      frequency,
      endFrequency: frequency * 1.01,
      type: 'square',
      gain: 0.026,
    });
  });
}

function playLevelUp(context, startAt) {
  [523, 659, 784, 1047].forEach((frequency, index) => {
    scheduleTone({
      context,
      startAt: startAt + index * 0.07,
      duration: 0.14,
      frequency,
      endFrequency: frequency * 1.03,
      type: 'triangle',
      gain: 0.034,
    });
  });
}

function playVictory(context, startAt) {
  [523, 659, 784, 659].forEach((frequency, index) => {
    scheduleTone({
      context,
      startAt: startAt + index * 0.1,
      duration: 0.12,
      frequency,
      endFrequency: frequency * 1.02,
      type: 'square',
      gain: 0.032,
    });
  });
}

function playIslandGrow(context, startAt) {
  scheduleNoise({ context, startAt, duration: 0.18, gain: 0.02, highpass: 1800, lowpass: 7800 });
  [660, 880, 1175].forEach((frequency, index) => {
    scheduleTone({
      context,
      startAt: startAt + index * 0.05,
      duration: 0.16,
      frequency,
      endFrequency: frequency * 1.18,
      type: 'triangle',
      gain: 0.022,
    });
  });
}

const performers = {
  bill_add: playBillAdd,
  bill_remove: playBillRemove,
  payday_start: playPaydayStart,
  hero_spawn: playHeroSpawn,
  monster_slay: playMonsterSlay,
  xp_tick: playXpTick,
  level_up: playLevelUp,
  victory: playVictory,
  island_grow: playIslandGrow,
};

export const soundManager = {
  async unlockAudio() {
    const context = getAudioContext();

    if (!context) {
      return false;
    }

    if (context.state === 'suspended') {
      try {
        await context.resume();
      } catch {
        return false;
      }
    }

    return context.state === 'running';
  },

  async playFromGesture(eventName) {
    if (useUiStore.getState().muted) {
      return false;
    }

    const ready = await this.unlockAudio();

    if (!ready) {
      return false;
    }

    return this.play(eventName);
  },

  play(eventName) {
    if (shouldSkipEvent(eventName)) {
      return false;
    }

    const performer = performers[eventName];

    if (!performer || !canPlay()) {
      return false;
    }

    const context = getAudioContext();
    performer(context, context.currentTime + 0.01);
    return true;
  },
};
