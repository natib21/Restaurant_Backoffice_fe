// src/features/KDS/components/KdsHeader.tsx
import React, { useState, useEffect } from 'react';
import {
  Search,
  Volume2,
  VolumeX,
  Settings,
  Bell,
  RefreshCw,
  Tv,
  Sun,
  Moon,
  Menu,
} from 'lucide-react';
import type { KdsStation } from '../types/kdsTypes';
import type { KdsConnectionStatus } from '../hooks/useKdsSocket';

interface KdsHeaderProps {
  currentStationId: string;
  stations: KdsStation[];
  onSelectStation: (stationId: string) => void;
  connectionStatus: KdsConnectionStatus;
  lastSyncTime: Date;
  onForceSync: () => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSettings: () => void;
  onOpenOrderLookup: (query?: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onToggleTvMode?: () => void;
  onToggleMobileSidebar?: () => void;
}

export const KdsHeader: React.FC<KdsHeaderProps> = ({
  currentStationId,
  stations,
  onSelectStation,
  connectionStatus,
  lastSyncTime,
  onForceSync,
  isSoundEnabled,
  onToggleSound,
  onOpenSettings,
  onOpenOrderLookup,
  isDarkMode,
  onToggleDarkMode,
  onToggleTvMode,
  onToggleMobileSidebar,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState<string>('');

  // Live ticking clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onOpenOrderLookup(searchQuery.trim());
    }
  };

  const selectedStationObj = stations.find(
    (s) => s.stationId.toLowerCase() === currentStationId.toLowerCase()
  );

  const displayTitle =
    currentStationId === 'all'
      ? 'ALL STATIONS'
      : (selectedStationObj?.name || currentStationId).toUpperCase();

  return (
    <header
      className={`h-16 px-4 sm:px-6 shrink-0 flex items-center justify-between select-none border-b transition-colors ${
        isDarkMode
          ? 'bg-[#0B0F19] text-white border-[#1E293B]'
          : 'bg-white text-slate-900 border-slate-200 shadow-xs'
      }`}
    >
      {/* Left: Hamburger menu toggle (mobile/tablet), Title, and Station Tabs */}
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            aria-label="Toggle navigation drawer"
            className={`p-2 rounded-lg md:hidden transition-colors border ${
              isDarkMode
                ? 'bg-[#1E293B] text-slate-200 border-slate-700 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
            }`}
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-sm sm:text-base md:text-lg font-black tracking-wider font-mono truncate max-w-[140px] sm:max-w-[200px] md:max-w-none ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            KDS PRO: {displayTitle}
          </span>
          {selectedStationObj && (
            <span
              className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-mono font-bold rounded border ${
                isDarkMode
                  ? 'bg-[#1E293B] text-slate-300 border-slate-700'
                  : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              {selectedStationObj.code}
            </span>
          )}
        </div>

        {/* Station Tabs (Horizontally scrollable on desktop/tablets) */}
        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            onClick={() => onSelectStation('all')}
            className={`px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-colors relative whitespace-nowrap ${
              currentStationId === 'all'
                ? isDarkMode
                  ? 'text-white'
                  : 'text-slate-950 font-black'
                : isDarkMode
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ALL STATIONS
            {currentStationId === 'all' && (
              <span
                className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                  isDarkMode ? 'bg-white' : 'bg-blue-600'
                }`}
              ></span>
            )}
          </button>

          {stations.map((st) => {
            const isActive = currentStationId.toLowerCase() === st.stationId.toLowerCase();
            return (
              <button
                key={st.stationId}
                onClick={() => onSelectStation(st.stationId)}
                className={`px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-colors relative whitespace-nowrap ${
                  isActive
                    ? isDarkMode
                      ? 'text-white'
                      : 'text-slate-950 font-black'
                    : isDarkMode
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {st.name}
                {isActive && (
                  <span
                    className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                      isDarkMode ? 'bg-white' : 'bg-blue-600'
                    }`}
                  ></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right: Search, Status, Clock, Sound, TV, Dark Mode, Settings */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block w-36 lg:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Order Lookup..."
            className={`w-full text-xs rounded-lg pl-9 pr-3 py-1.5 border focus:outline-none ${
              isDarkMode
                ? 'bg-[#1E293B] text-slate-200 border-slate-700/80 focus:border-slate-500 placeholder:text-slate-500'
                : 'bg-slate-100 text-slate-900 border-slate-300 focus:border-blue-500 placeholder:text-slate-400'
            }`}
          />
        </form>

        {/* Digital Clock */}
        <div
          className={`hidden sm:flex items-center px-2.5 py-1 rounded border text-xs font-mono font-bold ${
            isDarkMode
              ? 'bg-[#131B2E] border-slate-800 text-slate-200'
              : 'bg-slate-100 border-slate-300 text-slate-800'
          }`}
        >
          {currentTime || '00:00:00'}
        </div>

        {/* Online / Sync Status */}
        <button
          onClick={onForceSync}
          title={`Last synchronized: ${lastSyncTime.toLocaleTimeString()}`}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold transition-colors ${
            isDarkMode
              ? 'bg-[#131B2E] border-slate-800 text-slate-300 hover:bg-[#1E293B]'
              : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {connectionStatus === 'connected' ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">ONLINE</span>
            </>
          ) : connectionStatus === 'reconnecting' ? (
            <>
              <RefreshCw className="h-3 w-3 text-amber-500 animate-spin" />
              <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">SYNCING</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-red-500"></span>
              <span className="text-[11px] font-bold text-red-500 uppercase tracking-wider">OFFLINE</span>
            </>
          )}
        </button>

        {/* Sound Toggle */}
        <button
          onClick={onToggleSound}
          title={isSoundEnabled ? 'KDS Sounds Active' : 'KDS Sounds Muted'}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-colors border ${
            isSoundEnabled
              ? isDarkMode
                ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
              : 'bg-red-950/40 text-red-400 border-red-900/50 hover:bg-red-900/40'
          }`}
        >
          {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          <span className="hidden xl:inline">{isSoundEnabled ? 'SOUND ON' : 'MUTED'}</span>
        </button>

        {/* TV Mode Button */}
        {onToggleTvMode && (
          <button
            onClick={onToggleTvMode}
            title="Open Fullscreen TV Mode"
            className={`p-1.5 sm:p-2 rounded-lg transition-colors border ${
              isDarkMode
                ? 'bg-[#1E293B] text-slate-300 hover:text-white hover:bg-slate-700 border-slate-700'
                : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border-slate-300'
            }`}
          >
            <Tv className="h-4 w-4 text-amber-400" />
          </button>
        )}

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`p-1.5 sm:p-2 rounded-lg transition-colors border ${
            isDarkMode
              ? 'bg-[#1E293B] text-slate-300 hover:text-white hover:bg-slate-700 border-slate-700'
              : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border-slate-300'
          }`}
        >
          {isDarkMode ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4 text-slate-700" />}
        </button>

        {/* Settings Gear */}
        <button
          onClick={onOpenSettings}
          title="KDS Configuration & Audio Settings"
          className={`p-1.5 sm:p-2 rounded-lg transition-colors border ${
            isDarkMode
              ? 'bg-[#1E293B] text-slate-300 hover:text-white hover:bg-slate-700 border-slate-700'
              : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border-slate-300'
          }`}
        >
          <Settings className="h-4 w-4" />
        </button>

        {/* Notifications Bell */}
        <button
          onClick={() => onOpenOrderLookup()}
          title="Recent Kitchen Alerts"
          className={`relative p-1.5 sm:p-2 rounded-lg transition-colors border ${
            isDarkMode
              ? 'bg-[#1E293B] text-slate-300 hover:text-white hover:bg-slate-700 border-slate-700'
              : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border-slate-300'
          }`}
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            2
          </span>
        </button>
      </div>
    </header>
  );
};
export default KdsHeader;
