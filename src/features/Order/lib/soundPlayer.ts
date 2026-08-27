/**
 * Order & KDS Sound Player Utility
 * 
 * Provides both Web Audio API synthesized tones (guaranteed to work across all browsers without asset loading delays)
 * and HTML5 Audio fallback for actual MP3 files.
 */

const SOUND_STORAGE_KEY = 'sounds-enabled';

export type SoundType =
  | 'new-order'
  | 'order-accepted'
  | 'kitchen-alert'
  | 'order-ready'
  | 'order-served';

const SOUND_FILES: Record<SoundType, string> = {
  'new-order': '/sounds/new-order.mp3',
  'order-accepted': '/sounds/order-accepted.mp3',
  'kitchen-alert': '/sounds/kitchen-alert.mp3',
  'order-ready': '/sounds/order-ready.mp3',
  'order-served': '/sounds/order-served.mp3',
};

let audioContext: AudioContext | null = null;
let userInteracted = false;
let pendingSounds: Array<() => void> = [];

/**
 * Check if sound notifications are enabled in local storage (defaults to true)
 */
export const isSoundEnabled = (): boolean => {
  try {
    const val = localStorage.getItem(SOUND_STORAGE_KEY);
    return val !== 'false';
  } catch {
    return true;
  }
};

/**
 * Enable or disable sound notifications
 */
export const setSoundEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // Ignore storage errors
  }
};

/**
 * Ensure AudioContext is created and running on user gesture
 */
function ensureAudioContext(): AudioContext | null {
  try {
    if (!audioContext) {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioContext = new AudioCtx();
      }
    }
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
  } catch (e) {
    console.debug('AudioContext initialization note:', e);
  }
  return audioContext;
}

/**
 * Global user gesture listener to unlock Web Audio playback
 */
function ensureInteractionListener() {
  if (userInteracted) return;
  const handler = () => {
    userInteracted = true;
    const ctx = ensureAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    // Fire any queued sounds
    const queued = [...pendingSounds];
    pendingSounds = [];
    queued.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.debug('Queued sound trigger note:', e);
      }
    });
    document.removeEventListener('click', handler, true);
    document.removeEventListener('keydown', handler, true);
    document.removeEventListener('touchstart', handler, true);
  };
  document.addEventListener('click', handler, true);
  document.addEventListener('keydown', handler, true);
  document.addEventListener('touchstart', handler, true);
}

// Attach listener on import
if (typeof window !== 'undefined') {
  ensureInteractionListener();
}

/**
 * Synthesize musical alert chimes using Web Audio API oscillators
 */
function synthesizeSound(type: SoundType, volume = 0.7): boolean {
  try {
    const ctx = ensureAudioContext();
    if (!ctx) return false;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.max(0.01, Math.min(1.0, volume)) * 0.35, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'new-order': {
        // 🔔 Cheerful rising ping / chime (D5 -> G5 -> B5)
        const notes = [
          { freq: 587.33, start: 0, dur: 0.15, type: 'triangle' as OscillatorType },
          { freq: 783.99, start: 0.12, dur: 0.18, type: 'sine' as OscillatorType },
          { freq: 987.77, start: 0.25, dur: 0.35, type: 'sine' as OscillatorType },
        ];
        notes.forEach(({ freq, start, dur, type: oscType }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = oscType;
          osc.frequency.setValueAtTime(freq, now + start);
          gain.gain.setValueAtTime(0.001, now + start);
          gain.gain.exponentialRampToValueAtTime(0.8, now + start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + start);
          osc.stop(now + start + dur);
        });
        return true;
      }

      case 'order-accepted': {
        // ✅ Confirmation double-beep (C5 -> E5)
        const notes = [
          { freq: 523.25, start: 0, dur: 0.1, type: 'sine' as OscillatorType },
          { freq: 659.25, start: 0.12, dur: 0.2, type: 'sine' as OscillatorType },
        ];
        notes.forEach(({ freq, start, dur, type: oscType }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = oscType;
          osc.frequency.setValueAtTime(freq, now + start);
          gain.gain.setValueAtTime(0.001, now + start);
          gain.gain.exponentialRampToValueAtTime(0.6, now + start + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + start);
          osc.stop(now + start + dur);
        });
        return true;
      }

      case 'kitchen-alert': {
        // 🍳 Kitchen alert bell (A5 -> D6 -> A5)
        const notes = [
          { freq: 880.0, start: 0, dur: 0.14, type: 'square' as OscillatorType },
          { freq: 1174.66, start: 0.1, dur: 0.16, type: 'triangle' as OscillatorType },
          { freq: 880.0, start: 0.22, dur: 0.3, type: 'sine' as OscillatorType },
        ];
        notes.forEach(({ freq, start, dur, type: oscType }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = oscType;
          osc.frequency.setValueAtTime(freq, now + start);
          gain.gain.setValueAtTime(0.001, now + start);
          gain.gain.exponentialRampToValueAtTime(0.7, now + start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + start);
          osc.stop(now + start + dur);
        });
        return true;
      }

      case 'order-ready': {
        // ✨ Food ready success chime (E5 -> G#5 -> B5 -> E6)
        const notes = [
          { freq: 659.25, start: 0, dur: 0.12, type: 'sine' as OscillatorType },
          { freq: 830.61, start: 0.1, dur: 0.12, type: 'sine' as OscillatorType },
          { freq: 987.77, start: 0.2, dur: 0.15, type: 'sine' as OscillatorType },
          { freq: 1318.51, start: 0.32, dur: 0.45, type: 'sine' as OscillatorType },
        ];
        notes.forEach(({ freq, start, dur, type: oscType }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = oscType;
          osc.frequency.setValueAtTime(freq, now + start);
          gain.gain.setValueAtTime(0.001, now + start);
          gain.gain.exponentialRampToValueAtTime(0.9, now + start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + start);
          osc.stop(now + start + dur);
        });
        return true;
      }

      case 'order-served': {
        // 🚶 Gentle ding (C6 gentle fade)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.5, now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.5, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.35);
        return true;
      }
    }
  } catch (err) {
    console.debug('Web Audio synthesis error:', err);
    return false;
  }
}

/**
 * Universal sound player that handles both synthesized tones and audio files
 */
export const playSound = async (
  soundType: SoundType | string,
  options?: { volume?: number; force?: boolean }
): Promise<boolean> => {
  const force = options?.force ?? false;
  if (!force && !isSoundEnabled()) {
    return false;
  }

  const volume = options?.volume ?? 0.7;
  ensureInteractionListener();

  // Normalize sound name (handles e.g. "new-order.mp3" or "new-order")
  const cleanType = (soundType.replace('.mp3', '') as SoundType);

  if (!userInteracted) {
    pendingSounds.push(() => playSound(cleanType, options));
    return false;
  }

  // Attempt HTML5 Audio first if file exists
  const filePath = SOUND_FILES[cleanType] || `/sounds/${cleanType}.mp3`;
  try {
    const audio = new Audio(filePath);
    audio.volume = Math.max(0.1, Math.min(1.0, volume));
    await audio.play();
    return true;
  } catch {
    // If audio file is missing or blocked, fall back immediately to synthesized Web Audio chime
    return synthesizeSound(cleanType, volume);
  }
};

// Aliases for compatibility
export const playOrderSound = (options?: { soundFile?: string; volume?: number }) => {
  return playSound('new-order', options);
};

export const playNewOrderSound = () => playSound('new-order');
export const playOrderAcceptedSound = () => playSound('order-accepted');
export const playKitchenAlertSound = () => playSound('kitchen-alert');
export const playOrderReadySound = () => playSound('order-ready');
export const playOrderServedSound = () => playSound('order-served');
