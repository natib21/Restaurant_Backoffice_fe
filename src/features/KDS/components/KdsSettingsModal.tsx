// src/features/KDS/components/KdsSettingsModal.tsx
import React from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Play,
  Sun,
  Moon,
  Tv,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import type { KdsAudioSettings } from '../types/kdsTypes';

interface KdsSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioSettings: KdsAudioSettings;
  isAudioUnlocked: boolean;
  onUpdateAudioSettings: (settings: Partial<KdsAudioSettings>) => void;
  onUnlockAudio: () => void;
  onPlayTestSound: (type: 'new' | 'urgent' | 'ready' | 'expo' | 'disconnect') => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenTvMode?: () => void;
  onOpenStationManagement?: () => void;
}

export const KdsSettingsModal: React.FC<KdsSettingsModalProps> = ({
  isOpen,
  onClose,
  audioSettings,
  isAudioUnlocked,
  onUpdateAudioSettings,
  onUnlockAudio,
  onPlayTestSound,
  isDarkMode,
  onToggleDarkMode,
  onOpenTvMode,
  onOpenStationManagement,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div
        className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDarkMode ? 'bg-[#111827] border-[#1E293B] text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isDarkMode ? 'border-[#1E293B] bg-[#0E1626]' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Volume2 className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-black font-mono tracking-wider uppercase">
              KDS PRO Settings & Audio Control
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Autoplay Unlock Notice (if browser suspended audio) */}
          {!isAudioUnlocked && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                    Audio Autoplay Blocked by Browser
                  </p>
                  <p className="text-xs text-amber-300/80">
                    Click enable to allow live ticket audio alerts in this tab.
                  </p>
                </div>
              </div>
              <button
                onClick={onUnlockAudio}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-900 text-xs font-bold uppercase tracking-wider hover:bg-amber-400 transition-colors"
              >
                Enable Audio
              </button>
            </div>
          )}

          {/* Master Sound Switch */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              isDarkMode ? 'bg-[#131B2E] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {audioSettings.masterSoundEnabled ? (
                <Volume2 className="h-5 w-5 text-emerald-400" />
              ) : (
                <VolumeX className="h-5 w-5 text-rose-400" />
              )}
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider">Master Sound Alerts</h4>
                <p className="text-xs text-slate-400">Enable or disable all kitchen chime alerts</p>
              </div>
            </div>
            <button
              onClick={() =>
                onUpdateAudioSettings({ masterSoundEnabled: !audioSettings.masterSoundEnabled })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                audioSettings.masterSoundEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  audioSettings.masterSoundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Volume Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Kitchen Buzzer / Chime Volume ({audioSettings.volume}%)
              </label>
              <button
                onClick={() => onPlayTestSound('new')}
                disabled={!audioSettings.masterSoundEnabled}
                className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 disabled:opacity-40"
              >
                <Play className="h-3 w-3 fill-amber-400" /> Test Chime
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={audioSettings.volume}
              disabled={!audioSettings.masterSoundEnabled}
              onChange={(e) => onUpdateAudioSettings({ volume: Number(e.target.value) })}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400 disabled:opacity-40"
            />
          </div>

          {/* Individual Sound Event Toggles */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Kitchen Event Chimes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* New Ticket */}
              <div
                className={`p-3 rounded-lg border flex items-center justify-between ${
                  isDarkMode ? 'bg-[#0E1626] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <span className="text-xs font-bold block">New Ticket Chime</span>
                  <span className="text-[11px] text-slate-400">Standard orders</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPlayTestSound('new')}
                    className="p-1 rounded text-slate-400 hover:text-white"
                    title="Preview sound"
                  >
                    <Play className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="checkbox"
                    checked={audioSettings.alertNewTicket}
                    onChange={(e) => onUpdateAudioSettings({ alertNewTicket: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                </div>
              </div>

              {/* Urgent / Rush */}
              <div
                className={`p-3 rounded-lg border flex items-center justify-between ${
                  isDarkMode ? 'bg-[#0E1626] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <span className="text-xs font-bold block text-rose-400">Rush Order Alert</span>
                  <span className="text-[11px] text-slate-400">Triple urgent chime</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPlayTestSound('urgent')}
                    className="p-1 rounded text-slate-400 hover:text-white"
                    title="Preview sound"
                  >
                    <Play className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="checkbox"
                    checked={audioSettings.alertUrgentTicket}
                    onChange={(e) => onUpdateAudioSettings({ alertUrgentTicket: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                </div>
              </div>

              {/* Ticket Ready */}
              <div
                className={`p-3 rounded-lg border flex items-center justify-between ${
                  isDarkMode ? 'bg-[#0E1626] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <span className="text-xs font-bold block text-emerald-400">Station Ready</span>
                  <span className="text-[11px] text-slate-400">Completion note</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPlayTestSound('ready')}
                    className="p-1 rounded text-slate-400 hover:text-white"
                    title="Preview sound"
                  >
                    <Play className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="checkbox"
                    checked={audioSettings.alertTicketReady}
                    onChange={(e) => onUpdateAudioSettings({ alertTicketReady: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                </div>
              </div>

              {/* Order Ready / Expo */}
              <div
                className={`p-3 rounded-lg border flex items-center justify-between ${
                  isDarkMode ? 'bg-[#0E1626] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <span className="text-xs font-bold block text-cyan-400">Expo Pass Fanfare</span>
                  <span className="text-[11px] text-slate-400">Full order ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPlayTestSound('expo')}
                    className="p-1 rounded text-slate-400 hover:text-white"
                    title="Preview sound"
                  >
                    <Play className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="checkbox"
                    checked={audioSettings.alertOrderReady}
                    onChange={(e) => onUpdateAudioSettings({ alertOrderReady: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Theme & Display Options */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Display & Terminal Modes
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onToggleDarkMode}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                  isDarkMode ? 'bg-[#131B2E] border-slate-700' : 'bg-slate-100 border-slate-300'
                }`}
              >
                {isDarkMode ? (
                  <Moon className="h-4 w-4 text-indigo-400" />
                ) : (
                  <Sun className="h-4 w-4 text-amber-500" />
                )}
                <div className="text-left">
                  <span className="text-xs font-bold block">
                    {isDarkMode ? 'Dark Navy Theme' : 'High Contrast Light'}
                  </span>
                  <span className="text-[10px] text-slate-400">Toggle palette</span>
                </div>
              </button>

              {onOpenTvMode && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenTvMode();
                  }}
                  className="p-3 rounded-xl border border-amber-500/40 bg-amber-950/20 hover:bg-amber-950/40 flex items-center gap-3 text-amber-400 transition-colors"
                >
                  <Tv className="h-4 w-4 text-amber-400" />
                  <div className="text-left">
                    <span className="text-xs font-bold block">Kitchen TV Mode</span>
                    <span className="text-[10px] text-amber-300/70">Full screen 1080p</span>
                  </div>
                </button>
              )}

              {onOpenStationManagement && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenStationManagement();
                  }}
                  className={`p-3 rounded-xl border col-span-2 flex items-center gap-3 transition-colors ${
                    isDarkMode
                      ? 'bg-blue-950/20 border-blue-500/40 text-blue-400 hover:bg-blue-950/40'
                      : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  <Layers className="h-4 w-4 text-blue-400" />
                  <div className="text-left">
                    <span className="text-xs font-bold block">Manage Kitchen Stations</span>
                    <span className="text-[10px] opacity-80">Add, edit, or re-order kitchen categories and routing codes</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-4 border-t flex items-center justify-end ${
            isDarkMode ? 'border-[#1E293B] bg-[#0E1626]' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-white text-slate-900 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
