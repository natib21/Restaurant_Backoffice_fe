// src/features/KDS/pages/KdsTvPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Flame,
  Clock,
  CheckCircle2,
  Play,
  Check,
  Sun,
  Moon,
  Layers,
  UtensilsCrossed,
} from 'lucide-react';
import {
  useKitchenStationsQuery,
  useKitchenTicketsQuery,
  useAcceptTicketMutation,
  useStartTicketMutation,
  useReadyTicketMutation,
} from '@/api/Queries/kitchenQueries';
import { useKdsAudio } from '../hooks/useKdsAudio';
import { useKdsSocket } from '../hooks/useKdsSocket';
import type { KdsTicketStatus } from '../types/kdsTypes';

export const KdsTvPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [currentTime, setCurrentTime] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [mobileActiveColumn, setMobileActiveColumn] = useState<'all' | KdsTicketStatus>('all');

  const { audioSettings, toggleMasterSound } = useKdsAudio();
  const { data: stations = [] } = useKitchenStationsQuery();

  const currentStationObj = stations.find(
    (s) =>
      s.stationId.toLowerCase() === (selectedStation || '').toLowerCase() ||
      s._id === selectedStation ||
      s.code.toLowerCase() === (selectedStation || '').toLowerCase()
  );

  const stationTargetId = currentStationObj?._id || (selectedStation && selectedStation !== 'all' ? selectedStation : undefined);

  const { data: tickets = [] } = useKitchenTicketsQuery(undefined, stationTargetId);
  const { connectionStatus } = useKdsSocket({ branchId: undefined, stationId: stationTargetId });

  const acceptMutation = useAcceptTicketMutation();
  const startMutation = useStartTicketMutation();
  const readyMutation = useReadyTicketMutation();

  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);

  useEffect(() => {
    if (stations.length > 0 && (!selectedStation || !stations.some((s) => s.stationId === selectedStation))) {
      setSelectedStation(stations[0].stationId);
    }
  }, [stations, selectedStation]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeMs(now.getTime());
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatElapsed = (createdAt: string): string => {
    if (!currentTimeMs) return '00:00';
    const diffSec = Math.max(0, Math.floor((currentTimeMs - new Date(createdAt).getTime()) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const pendingTickets = tickets.filter((t) => t.status === 'pending');
  const acceptedTickets = tickets.filter((t) => t.status === 'accepted');
  const inProgressTickets = tickets.filter((t) => t.status === 'in_progress');
  const readyTickets = tickets.filter((t) => t.status === 'ready');

  const activeStation = currentStationObj || stations[0];

  const columns = [
    {
      id: 'pending' as KdsTicketStatus,
      title: 'PENDING',
      count: pendingTickets.length,
      badgeColor: isDarkMode
        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
        : 'bg-rose-100 text-rose-700 border-rose-300',
      tickets: pendingTickets,
    },
    {
      id: 'accepted' as KdsTicketStatus,
      title: 'ACCEPTED',
      count: acceptedTickets.length,
      badgeColor: isDarkMode
        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        : 'bg-blue-100 text-blue-700 border-blue-300',
      tickets: acceptedTickets,
    },
    {
      id: 'in_progress' as KdsTicketStatus,
      title: 'IN PROGRESS',
      count: inProgressTickets.length,
      badgeColor: isDarkMode
        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        : 'bg-amber-100 text-amber-800 border-amber-300',
      tickets: inProgressTickets,
    },
    {
      id: 'ready' as KdsTicketStatus,
      title: 'READY (EXPO)',
      count: readyTickets.length,
      badgeColor: isDarkMode
        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
        : 'bg-emerald-100 text-emerald-800 border-emerald-300',
      tickets: readyTickets,
    },
  ];

  const visibleColumns =
    mobileActiveColumn === 'all'
      ? columns
      : columns.filter((col) => col.id === mobileActiveColumn);

  return (
    <div
      className={`min-h-screen w-screen flex flex-col font-sans transition-colors duration-200 select-none ${
        isDarkMode ? 'bg-[#070A12] text-white' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* TV Mode Header - Highly responsive across mobile, tablet, and TV displays */}
      <header
        className={`px-4 sm:px-6 py-3 border-b-2 shrink-0 transition-colors ${
          isDarkMode
            ? 'bg-[#0B0F19] border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Exit & Station Title */}
          <div className="flex items-center flex-wrap gap-3 sm:gap-5">
            <button
              onClick={() => navigate('/kds')}
              className={`flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Exit TV Mode</span>
              <span className="sm:hidden">Exit</span>
            </button>

            <div className="flex items-center gap-2 sm:gap-3">
              <h1
                className={`text-lg sm:text-2xl font-black font-mono tracking-wider uppercase ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                KDS PRO: {currentStationObj?.name || 'CATEGORY 1'}
              </h1>
              <span
                className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded font-mono font-black text-xs sm:text-sm border ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-amber-400'
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}
              >
                {currentStationObj?.code || 'CAT-01'}
              </span>
            </div>
          </div>

          {/* Right: Ticker, Live Sync, Dark/Light Toggle, Audio, Fullscreen */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Live Sync Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border text-xs font-black uppercase tracking-wider ${
                isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                }`}
              ></span>
              <span
                className={`hidden md:inline ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                {connectionStatus === 'connected' ? 'LIVE SYNC' : 'OFFLINE'}
              </span>
            </div>

            {/* Time */}
            <div
              className={`text-base sm:text-xl font-black font-mono tracking-wider px-3 py-1 rounded-lg border ${
                isDarkMode
                  ? 'bg-[#111827] text-white border-slate-800'
                  : 'bg-slate-50 text-slate-900 border-slate-200'
              }`}
            >
              {currentTime || '00:00:00'}
            </div>

            {/* Dark/Light Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className={`p-2 sm:p-2.5 rounded-lg transition-colors border ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              {isDarkMode ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>

            {/* Sound Toggle */}
            <button
              onClick={toggleMasterSound}
              title="Toggle Audio Cues"
              className={`p-2 sm:p-2.5 rounded-lg transition-colors border ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              {audioSettings.masterSoundEnabled ? (
                <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
              ) : (
                <VolumeX className="h-4 w-4 sm:h-5 sm:w-5 text-rose-500" />
              )}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              className={`p-2 sm:p-2.5 rounded-lg transition-colors border ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Maximize2 className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Category Station Switcher Bar (Smooth horizontally scrollable on mobile) */}
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-800/40 overflow-x-auto no-scrollbar scroll-smooth">
          <span
            className={`text-[11px] font-bold uppercase tracking-wider shrink-0 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Category Station:
          </span>
          {stations.map((st) => {
            const isActive = selectedStation.toLowerCase() === st.stationId.toLowerCase();
            return (
              <button
                key={st.stationId}
                onClick={() => setSelectedStation(st.stationId)}
                className={`px-3 py-1 text-xs font-bold uppercase rounded-md font-mono shrink-0 transition-all ${
                  isActive
                    ? isDarkMode
                      ? 'bg-white text-slate-950 shadow font-black'
                      : 'bg-slate-900 text-white shadow font-black'
                    : isDarkMode
                    ? 'bg-[#111827] text-slate-400 hover:text-white border border-slate-800'
                    : 'bg-slate-200 text-slate-700 hover:text-slate-950 border border-slate-300'
                }`}
              >
                {st.name} ({st.code})
              </button>
            );
          })}
        </div>

        {/* Mobile & Tablet Column Filter Tabs (Hidden on large TV screens) */}
        <div className="flex xl:hidden items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-800/30 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setMobileActiveColumn('all')}
            className={`px-2.5 py-1 rounded text-xs font-bold uppercase shrink-0 transition-colors ${
              mobileActiveColumn === 'all'
                ? 'bg-blue-600 text-white'
                : isDarkMode
                ? 'bg-slate-800 text-slate-300'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            All Columns ({tickets.length})
          </button>
          {columns.map((col) => (
            <button
              key={col.id}
              onClick={() => setMobileActiveColumn(col.id)}
              className={`px-2.5 py-1 rounded text-xs font-bold uppercase shrink-0 transition-colors ${
                mobileActiveColumn === col.id
                  ? 'bg-blue-600 text-white'
                  : isDarkMode
                  ? 'bg-slate-800 text-slate-300'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {col.title} ({col.count})
            </button>
          ))}
        </div>
      </header>

      {/* Main Kanban Content Area with Smooth Vertical Scroll */}
      <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-y-auto scroll-smooth">
        <div
          className={`grid gap-4 sm:gap-6 ${
            mobileActiveColumn === 'all'
              ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
              : 'grid-cols-1'
          }`}
        >
          {visibleColumns.map((col) => (
            <div
              key={col.id}
              className={`flex flex-col rounded-2xl border-2 overflow-hidden shadow-sm transition-colors ${
                isDarkMode
                  ? 'bg-[#0D1322] border-slate-800'
                  : 'bg-white border-slate-200'
              }`}
            >
              {/* Column Header */}
              <div
                className={`p-4 border-b-2 flex items-center justify-between ${
                  isDarkMode
                    ? 'bg-[#111A2E] border-slate-800'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <h2
                  className={`text-base sm:text-lg font-black font-mono tracking-wider ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {col.title}
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${col.badgeColor}`}
                >
                  {col.count} {col.count === 1 ? 'TICKET' : 'TICKETS'}
                </span>
              </div>

              {/* Column Tickets Container with Smooth Vertical Scrolling */}
              <div className="p-3 sm:p-4 space-y-4 max-h-[calc(100vh-14rem)] overflow-y-auto scroll-smooth">
                {col.tickets.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <UtensilsCrossed
                      className={`h-8 w-8 mb-2 ${
                        isDarkMode ? 'text-slate-700' : 'text-slate-300'
                      }`}
                    />
                    <p
                      className={`text-xs font-semibold uppercase tracking-wider ${
                        isDarkMode ? 'text-slate-600' : 'text-slate-400'
                      }`}
                    >
                      No {col.title} Tickets
                    </p>
                  </div>
                ) : (
                  col.tickets.map((t) => {
                    const isRush = t.priority === 'rush';

                    return (
                      <div
                        key={t._id}
                        className={`p-4 sm:p-5 rounded-xl border-2 shadow-md flex flex-col justify-between transition-all ${
                          col.id === 'ready'
                            ? isDarkMode
                              ? 'bg-[#0F201C] border-emerald-800/60 opacity-90'
                              : 'bg-emerald-50/70 border-emerald-300'
                            : col.id === 'in_progress'
                            ? isDarkMode
                              ? 'bg-[#131B2E] border-amber-500/50'
                              : 'bg-amber-50/60 border-amber-300'
                            : isDarkMode
                            ? 'bg-[#131B2E] border-slate-700/80'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div>
                          {/* Ticket Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xl sm:text-2xl font-black font-mono tracking-wider ${
                                  col.id === 'ready'
                                    ? 'text-emerald-500'
                                    : isDarkMode
                                    ? 'text-white'
                                    : 'text-slate-900'
                                }`}
                              >
                                {t.ticketNumber}
                              </span>
                              {isRush && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-[#3B171A] text-[#FF5A5F] border border-[#FF5A5F]/40">
                                  <Flame className="h-3 w-3" /> RUSH
                                </span>
                              )}
                            </div>

                            <div
                              className={`flex items-center gap-1 font-mono text-xs sm:text-sm font-bold px-2 py-0.5 rounded border ${
                                isRush
                                  ? 'text-[#FF5A5F] bg-[#3B171A] border-[#FF5A5F]/40'
                                  : isDarkMode
                                  ? 'text-slate-300 bg-slate-800 border-slate-700'
                                  : 'text-slate-700 bg-white border-slate-300'
                              }`}
                            >
                              <Clock className="h-3.5 w-3.5" />
                              <span>{formatElapsed(t.createdAt)}</span>
                            </div>
                          </div>

                          {/* Order Metadata */}
                          <div
                            className={`text-xs font-mono mt-1 ${
                              isDarkMode ? 'text-slate-400' : 'text-slate-500'
                            }`}
                          >
                            {t.orderNumber}{' '}
                            {t.tableNumber && `• ${t.tableNumber}`}{' '}
                            {t.customerName && `• ${t.customerName}`}
                          </div>

                          {/* Ticket Items */}
                          <div className="mt-3 sm:mt-4 space-y-2">
                            {t.items.map((item) => (
                              <div key={item._id} className="text-xs sm:text-sm font-semibold">
                                <span className="font-mono font-black text-amber-500 mr-2">
                                  {item.quantity}x
                                </span>
                                <span
                                  className={
                                    item.completed
                                      ? 'line-through text-slate-400'
                                      : isDarkMode
                                      ? 'text-slate-100'
                                      : 'text-slate-900'
                                  }
                                >
                                  {item.name}
                                </span>
                                {item.notes && (
                                  <p className="text-xs text-rose-500 pl-6">• {item.notes}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {col.id === 'pending' && (
                          <button
                            onClick={() => acceptMutation.mutate(t._id)}
                            className="w-full mt-4 sm:mt-5 py-2.5 sm:py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-sm"
                          >
                            <Check className="h-4 w-4 sm:h-5 sm:w-5" /> Accept Ticket
                          </button>
                        )}

                        {col.id === 'accepted' && (
                          <button
                            onClick={() => startMutation.mutate(t._id)}
                            className="w-full mt-4 sm:mt-5 py-2.5 sm:py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-sm"
                          >
                            <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-white" /> Start Preparation
                          </button>
                        )}

                        {col.id === 'in_progress' && (
                          <button
                            onClick={() => readyMutation.mutate(t._id)}
                            className="w-full mt-4 sm:mt-5 py-2.5 sm:py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-sm"
                          >
                            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" /> Mark Ready
                          </button>
                        )}

                        {col.id === 'ready' && (
                          <div className="mt-4 sm:mt-5 py-2 text-center text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Ready at Consolidation Pass
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
export default KdsTvPage;
