<<<<<<< HEAD
const SOUNDS: Record<string, string> = {
=======
const SOUNDS = {
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
  orderPlaced: '/sounds/fire.mp3',
  fallback: '/sounds/fallback.mp3',
};

let audioContext: AudioContext | null = null;
<<<<<<< HEAD
let userInteracted = false;
let pendingSound: (() => void) | null = null;

/**
 * Attach one-time global listeners to detect the first user interaction.
 * Browsers require a user gesture before AudioContext / HTML5 Audio can play.
 */
function ensureInteractionListener() {
  if (userInteracted) return;
  const handler = () => {
    userInteracted = true;
    // Resume any suspended AudioContext
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
    // Fire any queued sound
    if (pendingSound) {
      pendingSound();
      pendingSound = null;
    }
    // Clean up listeners (fire once)
    document.removeEventListener('click', handler, true);
    document.removeEventListener('keydown', handler, true);
    document.removeEventListener('touchstart', handler, true);
  };
  document.addEventListener('click', handler, true);
  document.addEventListener('keydown', handler, true);
  document.addEventListener('touchstart', handler, true);
}

/**
 * Play the order notification sound.
 *
 * @param options.soundFile - Override the sound file path (e.g. from merchant settings).
 *                            Defaults to SOUNDS.orderPlaced.
 * @param options.volume    - Volume 0–1. Defaults to 0.8.
 * @returns true if playback was attempted, false if skipped (e.g. no interaction yet).
 */
export const playOrderSound = async (options?: {
  soundFile?: string;
  volume?: number;
}): Promise<boolean> => {
  const soundFile = options?.soundFile || SOUNDS.orderPlaced;
  const volume = options?.volume ?? 0.8;

  // Ensure the interaction listener is registered
  ensureInteractionListener();

  // If the user hasn't interacted yet, queue the sound for later
  if (!userInteracted) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[soundPlayer] User has not interacted with the page yet. ' +
        'Sound will play on first click/tap.'
      );
    }
    pendingSound = () => playOrderSound(options);
    return false;
  }

  try {
    // Try HTML5 Audio first (simple)
    const audio = new Audio(soundFile);
    audio.volume = volume;
    await audio.play();
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[soundPlayer] HTML5 Audio failed, trying Web Audio API fallback');
    }
=======

export const playOrderSound = async () => {
  try {
    // Try HTML5 Audio first (simple)
    const audio = new Audio(SOUNDS.orderPlaced);
    audio.volume = 0.8;
    await audio.play();
  } catch (error) {
    console.warn('HTML5 Audio failed, trying Web Audio API fallback');
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c

    // Web Audio API fallback (better for mobile/Safari)
    try {
      if (!audioContext) {
        audioContext = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
      }

<<<<<<< HEAD
      // If context is suspended, resume it (may still fail without gesture)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const response = await fetch(soundFile);
=======
      const response = await fetch(SOUNDS.orderPlaced);
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);
<<<<<<< HEAD
      return true;
    } catch (fallbackError) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[soundPlayer] Sound playback failed completely:', fallbackError);
      }
      return false;
=======
    } catch (fallbackError) {
      console.warn('Sound playback failed completely:', fallbackError);
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
    }
  }
};
