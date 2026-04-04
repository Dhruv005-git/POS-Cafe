// frontend/src/utils/sound.js
// Web Audio API sound effects — no library, no file deps

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone({ freq = 440, type = 'sine', duration = 0.3, volume = 0.25, delay = 0 }) {
  try {
    const ctx  = getCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  } catch { /* audio not available — silent fail */ }
}

export const sound = {
  // Double chime — new order arrives in kitchen
  newOrder: () => {
    playTone({ freq: 880, duration: 0.2, volume: 0.25, delay: 0 });
    playTone({ freq: 1100, duration: 0.25, volume: 0.2, delay: 0.2 });
  },

  // Soft single click — item added to cart
  addItem: () => {
    playTone({ freq: 660, type: 'sine', duration: 0.08, volume: 0.12, delay: 0 });
  },

  // Success chord — payment complete
  paymentDone: () => {
    playTone({ freq: 523, duration: 0.15, volume: 0.2, delay: 0 });
    playTone({ freq: 659, duration: 0.15, volume: 0.18, delay: 0.12 });
    playTone({ freq: 784, duration: 0.3,  volume: 0.22, delay: 0.24 });
  },

  // Short error buzz
  error: () => {
    playTone({ freq: 220, type: 'sawtooth', duration: 0.12, volume: 0.15, delay: 0 });
  },

  // Unlock audio context on first user gesture (call once)
  unlock: () => { try { getCtx(); } catch {} },
};