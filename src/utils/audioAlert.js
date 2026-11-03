/**
 * audioAlert.js
 * Utilitas pemutaran audio notifikasi darurat SOS via Web Audio API.
 * Menghasilkan nada chime darurat sintetis tanpa ketergantungan file eksternal.
 */

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Memainkan nada chime darurat SOS (Dual-tone alert: 880Hz -> 1174Hz)
 */
export function playEmergencyAlertSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Tone 1: High alert ping (A5 - 880 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Tone 2: Urgent second ping (D6 - 1174.66 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, now + 0.12);
    gain2.gain.setValueAtTime(0.25, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.45);

    // Tone 3: Resonansi darurat ketiga (E6 - 1318.51 Hz)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1318.51, now + 0.24);
    gain3.gain.setValueAtTime(0.3, now + 0.24);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.24);
    osc3.stop(now + 0.65);
  } catch (err) {
    // Autoplay policy or browser limitation
    console.warn('[audioAlert] Pemutaran audio alert dicegah oleh browser:', err);
  }
}

// ─── CONTINUOUS POSKO EMERGENCY SIREN ─────────────────────────────────
let sirenOsc = null;
let sirenLfo = null;
let sirenGain = null;
let isSirenActive = false;

/**
 * Memulai sirine posko darurat looping kontinu (warble tone 700Hz - 1200Hz).
 */
export function startPoskoSiren() {
  if (isSirenActive) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Carrier oscillator: base frequency 900Hz
    sirenOsc = ctx.createOscillator();
    sirenOsc.type = 'sawtooth';
    sirenOsc.frequency.setValueAtTime(900, now);

    // LFO modulator to modulate pitch between 700Hz and 1200Hz at ~1.5Hz (emergency warble)
    sirenLfo = ctx.createOscillator();
    sirenLfo.frequency.setValueAtTime(1.5, now);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(250, now); // swing +/- 250Hz -> 650Hz to 1150Hz
    sirenLfo.connect(lfoGain);
    lfoGain.connect(sirenOsc.frequency);

    sirenGain = ctx.createGain();
    sirenGain.gain.setValueAtTime(0.001, now);
    sirenGain.gain.linearRampToValueAtTime(0.2, now + 0.3); // Smooth ramp up

    sirenOsc.connect(sirenGain);
    sirenGain.connect(ctx.destination);

    sirenOsc.start(now);
    sirenLfo.start(now);
    isSirenActive = true;
  } catch (err) {
    console.warn('[audioAlert] startPoskoSiren gagal:', err);
  }
}

/**
 * Menghentikan sirine posko darurat (Mute / Heningkan).
 */
export function stopPoskoSiren() {
  if (!isSirenActive) return;
  try {
    const ctx = getAudioContext();
    if (ctx && sirenGain) {
      const now = ctx.currentTime;
      sirenGain.gain.linearRampToValueAtTime(0.001, now + 0.2);
      setTimeout(() => {
        try {
          sirenOsc?.stop();
          sirenLfo?.stop();
          sirenOsc?.disconnect();
          sirenLfo?.disconnect();
          sirenGain?.disconnect();
        } catch (_) {}
        sirenOsc = null;
        sirenLfo = null;
        sirenGain = null;
        isSirenActive = false;
      }, 250);
    } else {
      isSirenActive = false;
    }
  } catch (err) {
    console.warn('[audioAlert] stopPoskoSiren gagal:', err);
    isSirenActive = false;
  }
}

/**
 * Cek status sirine posko
 */
export function isPoskoSirenPlaying() {
  return isSirenActive;
}
