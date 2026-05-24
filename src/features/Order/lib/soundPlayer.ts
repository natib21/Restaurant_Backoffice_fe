const SOUNDS = {
  orderPlaced: '/sounds/fire.mp3',
  fallback: '/sounds/fallback.mp3',
};

let audioContext: AudioContext | null = null;

export const playOrderSound = async () => {
  try {
    // Try HTML5 Audio first (simple)
    const audio = new Audio(SOUNDS.orderPlaced);
    audio.volume = 0.8;
    await audio.play();
  } catch (error) {
    console.warn('HTML5 Audio failed, trying Web Audio API fallback');

    // Web Audio API fallback (better for mobile/Safari)
    try {
      if (!audioContext) {
        audioContext = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
      }

      const response = await fetch(SOUNDS.orderPlaced);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);
    } catch (fallbackError) {
      console.warn('Sound playback failed completely:', fallbackError);
    }
  }
};
