// src/features/KDS/services/kdsAudioService.ts
import type { KdsAudioSettings } from '../types/kdsTypes';

export const DEFAULT_KDS_AUDIO_SETTINGS: KdsAudioSettings = {
  masterSoundEnabled: true,
  volume: 80,
  alertNewTicket: true,
  alertUrgentTicket: true,
  alertTicketReady: true,
  alertOrderReady: true,
  alertConnectionLost: true,
};

const AUDIO_STORAGE_KEY = 'kds_audio_settings';

class KdsAudioService {
  private audioCtx: AudioContext | null = null;
  private settings: KdsAudioSettings = { ...DEFAULT_KDS_AUDIO_SETTINGS };
  private lastPlayedTime = 0;
  private readonly COOLDOWN_MS = 600; // prevents audio explosion on batch socket arrivals

  constructor() {
    this.loadSettings();
  }

  public loadSettings(): KdsAudioSettings {
    try {
      const stored = localStorage.getItem(AUDIO_STORAGE_KEY);
      if (stored) {
        this.settings = { ...DEFAULT_KDS_AUDIO_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      this.settings = { ...DEFAULT_KDS_AUDIO_SETTINGS };
    }
    return this.settings;
  }

  public saveSettings(newSettings: Partial<KdsAudioSettings>): KdsAudioSettings {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // ignore
    }
    return this.settings;
  }

  public getSettings(): KdsAudioSettings {
    return { ...this.settings };
  }

  public isUnlocked(): boolean {
    return !!this.audioCtx && this.audioCtx.state === 'running';
  }

  public async unlock(): Promise<boolean> {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }
      return this.isUnlocked();
    } catch (e) {
      console.warn('AudioContext resume failed:', e);
      return false;
    }
  }

  private canPlaySound(typeConfigKey: keyof KdsAudioSettings): boolean {
    if (!this.settings.masterSoundEnabled) return false;
    if (!this.settings[typeConfigKey]) return false;
    
    const now = Date.now();
    if (now - this.lastPlayedTime < this.COOLDOWN_MS) {
      return false;
    }
    this.lastPlayedTime = now;
    return true;
  }

  private getEffectiveGain(): number {
    // scale 0-100 to logarithmic gain [0.001 -> 0.4]
    const volumePercent = Math.max(0, Math.min(100, this.settings.volume));
    return (volumePercent / 100) * 0.35;
  }

  /**
   * Generates a pleasant synthesized multi-frequency tone sequence using Web Audio API
   */
  private playTones(notes: { freq: number; duration: number; type?: OscillatorType; delay?: number }[]) {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      const masterGain = this.audioCtx.createGain();
      const volume = this.getEffectiveGain();
      masterGain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
      masterGain.connect(this.audioCtx.destination);

      let currentStart = this.audioCtx.currentTime;

      notes.forEach((note) => {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const noteGain = this.audioCtx.createGain();

        osc.type = note.type || 'sine';
        osc.frequency.setValueAtTime(note.freq, currentStart + (note.delay || 0));

        // Smooth attack and decay envelope
        const startTime = currentStart + (note.delay || 0);
        const endTime = startTime + note.duration;

        noteGain.gain.setValueAtTime(0.001, startTime);
        noteGain.gain.exponentialRampToValueAtTime(1.0, startTime + 0.03);
        noteGain.gain.exponentialRampToValueAtTime(0.001, endTime);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(startTime);
        osc.stop(endTime);

        currentStart = startTime + note.duration * 0.75;
      });
    } catch (e) {
      console.warn('Error synthesizing KDS alert chime:', e);
    }
  }

  // 1. New Ticket: Friendly high two-tone chime (D5 -> A5)
  public playNewTicket(force = false) {
    if (!force && !this.canPlaySound('alertNewTicket')) return;
    this.playTones([
      { freq: 587.33, duration: 0.18, type: 'triangle' },
      { freq: 880.00, duration: 0.28, type: 'sine' },
    ]);
  }

  // 2. Urgent / Rush Ticket: Distinctive fast triple alert chime (A5 -> D6 -> A5)
  public playUrgentTicket(force = false) {
    if (!force && !this.canPlaySound('alertUrgentTicket')) return;
    this.playTones([
      { freq: 880.00, duration: 0.12, type: 'square' },
      { freq: 1174.66, duration: 0.14, type: 'triangle' },
      { freq: 880.00, duration: 0.22, type: 'sine' },
    ]);
  }

  // 3. Ticket Ready: Satisfying uplifting chime (C5 -> E5 -> G5)
  public playTicketReady(force = false) {
    if (!force && !this.canPlaySound('alertTicketReady')) return;
    this.playTones([
      { freq: 523.25, duration: 0.14, type: 'sine' },
      { freq: 659.25, duration: 0.14, type: 'sine' },
      { freq: 783.99, duration: 0.26, type: 'triangle' },
    ]);
  }

  // 4. Order Ready (Expo): Fanfare 4-note celebration chime (F5 -> A5 -> C6 -> F6)
  public playOrderReady(force = false) {
    if (!force && !this.canPlaySound('alertOrderReady')) return;
    this.playTones([
      { freq: 698.46, duration: 0.12, type: 'sine' },
      { freq: 880.00, duration: 0.12, type: 'sine' },
      { freq: 1046.50, duration: 0.14, type: 'sine' },
      { freq: 1396.91, duration: 0.32, type: 'triangle' },
    ]);
  }

  // 5. Connection Lost: Short descending warning tone (440Hz -> 330Hz)
  public playConnectionLost(force = false) {
    if (!force && !this.canPlaySound('alertConnectionLost')) return;
    this.playTones([
      { freq: 440.00, duration: 0.2, type: 'sawtooth' },
      { freq: 329.63, duration: 0.35, type: 'sawtooth' },
    ]);
  }

  // 6. Reconnected Tone: Soft ascending tone
  public playReconnected() {
    if (!this.settings.masterSoundEnabled) return;
    this.playTones([
      { freq: 440.00, duration: 0.15, type: 'sine' },
      { freq: 554.37, duration: 0.2, type: 'sine' },
    ]);
  }
}

export const kdsAudioService = new KdsAudioService();
