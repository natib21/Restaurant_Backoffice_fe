// src/features/KDS/hooks/useKdsAudio.ts
import { useState, useEffect, useCallback } from 'react';
import { kdsAudioService, DEFAULT_KDS_AUDIO_SETTINGS } from '../services/kdsAudioService';
import type { KdsAudioSettings } from '../types/kdsTypes';

export function useKdsAudio() {
  const [audioSettings, setAudioSettings] = useState<KdsAudioSettings>(() => kdsAudioService.getSettings());
  const [isAudioUnlocked, setIsAudioUnlocked] = useState<boolean>(() => kdsAudioService.isUnlocked());

  useEffect(() => {
    // Attempt unlock on initial user gesture anywhere on window
    const handleGesture = () => {
      kdsAudioService.unlock().then((unlocked) => {
        setIsAudioUnlocked(unlocked);
      });
    };

    window.addEventListener('click', handleGesture, { once: true });
    window.addEventListener('keydown', handleGesture, { once: true });
    window.addEventListener('touchstart', handleGesture, { once: true });

    return () => {
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('keydown', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
    };
  }, []);

  const updateSettings = useCallback((newSettings: Partial<KdsAudioSettings>) => {
    const updated = kdsAudioService.saveSettings(newSettings);
    setAudioSettings({ ...updated });
  }, []);

  const toggleMasterSound = useCallback(() => {
    updateSettings({ masterSoundEnabled: !audioSettings.masterSoundEnabled });
  }, [audioSettings.masterSoundEnabled, updateSettings]);

  const unlockAudio = useCallback(async () => {
    const unlocked = await kdsAudioService.unlock();
    setIsAudioUnlocked(unlocked);
    return unlocked;
  }, []);

  const playTestSound = useCallback((type: 'new' | 'urgent' | 'ready' | 'expo' | 'disconnect') => {
    kdsAudioService.unlock();
    switch (type) {
      case 'new':
        kdsAudioService.playNewTicket(true);
        break;
      case 'urgent':
        kdsAudioService.playUrgentTicket(true);
        break;
      case 'ready':
        kdsAudioService.playTicketReady(true);
        break;
      case 'expo':
        kdsAudioService.playOrderReady(true);
        break;
      case 'disconnect':
        kdsAudioService.playConnectionLost(true);
        break;
    }
  }, []);

  return {
    audioSettings,
    isAudioUnlocked,
    updateSettings,
    toggleMasterSound,
    unlockAudio,
    playTestSound,
    playNewTicket: useCallback(() => kdsAudioService.playNewTicket(), []),
    playUrgentTicket: useCallback(() => kdsAudioService.playUrgentTicket(), []),
    playTicketReady: useCallback(() => kdsAudioService.playTicketReady(), []),
    playOrderReady: useCallback(() => kdsAudioService.playOrderReady(), []),
    playConnectionLost: useCallback(() => kdsAudioService.playConnectionLost(), []),
    playReconnected: useCallback(() => kdsAudioService.playReconnected(), []),
  };
}
