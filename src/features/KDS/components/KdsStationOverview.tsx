// src/features/KDS/components/KdsStationOverview.tsx
import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, ArrowRightLeft, Clock, ArrowRight } from 'lucide-react';
import type { KdsStation, KdsTicket } from '../types/kdsTypes';

interface KdsStationOverviewProps {
  stations: KdsStation[];
  tickets: KdsTicket[];
  onSelectStation: (stationId: string) => void;
  isDarkMode?: boolean;
}

export const KdsStationOverview: React.FC<KdsStationOverviewProps> = ({
  stations,
  tickets,
  onSelectStation,
  isDarkMode = true,
}) => {
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);

  useEffect(() => {
    setCurrentTimeMs(Date.now());
    const interval = setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    if (!seconds || seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Compute metrics for each station
  const stationStats = stations.map((station) => {
    const stationTickets = tickets.filter(
      (t) => t.stationId.toLowerCase() === station.stationId.toLowerCase()
    );

    const pendingTickets = stationTickets.filter((t) => t.status === 'pending');
    const workingTickets = stationTickets.filter(
      (t) => t.status === 'accepted' || t.status === 'in_progress'
    );
    const readyTickets = stationTickets.filter((t) => t.status === 'ready');

    // Calculate average elapsed time for active tickets in this station
    let avgElapsedSec = station.avgTicketTimeSeconds || 0;
    const now = currentTimeMs || (stationTickets.length > 0 ? new Date(stationTickets[0].createdAt).getTime() : 0);
    const activeTicketsWithTimestamps = stationTickets.filter(
      (t) => t.status === 'pending' || t.status === 'accepted' || t.status === 'in_progress'
    );

    if (activeTicketsWithTimestamps.length > 0 && currentTimeMs > 0) {
      const totalElapsed = activeTicketsWithTimestamps.reduce((acc, t) => {
        const createdTime = new Date(t.createdAt).getTime();
        return acc + Math.max(0, Math.floor((now - createdTime) / 1000));
      }, 0);
      avgElapsedSec = Math.floor(totalElapsed / activeTicketsWithTimestamps.length);
    }

    // Determine status automatically based on backlog
    let derivedStatus: 'rush' | 'on_pace' | 'holding' = station.status || 'on_pace';
    if (pendingTickets.length >= 3 || avgElapsedSec > 720) {
      derivedStatus = 'rush';
    } else if (workingTickets.length === 0 && pendingTickets.length === 0) {
      derivedStatus = 'holding';
    }

    return {
      ...station,
      status: derivedStatus,
      newCount: pendingTickets.length,
      workingCount: workingTickets.length,
      readyCount: readyTickets.length,
      totalCount: stationTickets.length,
      avgElapsedSec,
    };
  });

  return (
    <div className={`p-6 lg:p-8 flex-1 overflow-y-auto ${isDarkMode ? 'bg-[#0B0F19]' : 'bg-slate-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2
              className={`text-xl font-bold tracking-wider uppercase font-mono ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Active Kitchen Stations
            </h2>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Real-time load, queue backlog, and average ticket pace across all culinary lines
            </p>
          </div>
          <div
            className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${
              isDarkMode
                ? 'bg-[#131B2E] border-slate-800 text-slate-300'
                : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            {stationStats.reduce((acc, s) => acc + s.newCount + s.workingCount, 0)} Total Active Orders
          </div>
        </div>

        {/* 4 Station Grid matching screenshot */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stationStats.map((station) => {
            const isExpo = station.stationId.toLowerCase() === 'expo';
            const isRush = station.status === 'rush';
            const isHolding = station.status === 'holding';

            return (
              <div
                key={station.stationId}
                onClick={() => onSelectStation(station.stationId)}
                className={`group cursor-pointer rounded-xl border p-6 transition-all duration-200 shadow-sm hover:shadow-lg ${
                  isDarkMode
                    ? 'bg-[#111827] border-[#1E293B] hover:border-slate-600'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Card Top: Station Name and Status Badge */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <h3
                      className={`text-2xl font-black tracking-wider uppercase font-mono group-hover:text-amber-400 transition-colors ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {station.name}
                    </h3>
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded border ${
                        isDarkMode
                          ? 'bg-[#1E293B] border-slate-700 text-slate-400'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      {station.code}
                    </span>
                  </div>

                  {/* Status Pill */}
                  {isRush ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#3B171A] border border-[#FF5A5F]/40 text-[#FF5A5F]">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span className="text-xs font-bold uppercase tracking-wider">RUSH</span>
                    </div>
                  ) : isHolding ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#2B2412] border border-amber-500/30 text-amber-400">
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      <span className="text-xs font-bold uppercase tracking-wider">HOLDING</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#0F2922] border border-emerald-500/30 text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="text-xs font-bold uppercase tracking-wider">ON PACE</span>
                    </div>
                  )}
                </div>

                {/* Card Middle: 2 Stat Blocks Side-by-Side */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Left Block */}
                  <div
                    className={`p-4 rounded-lg border-l-4 ${
                      isExpo ? 'border-l-emerald-500' : 'border-l-rose-500'
                    } ${isDarkMode ? 'bg-[#131B2E]' : 'bg-slate-50'}`}
                  >
                    <span
                      className={`block text-xs font-bold uppercase tracking-wider ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {isExpo ? 'READY' : 'NEW'}
                    </span>
                    <span
                      className={`text-4xl font-black font-mono tracking-tight mt-1 block ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {isExpo ? station.readyCount : station.newCount}
                    </span>
                  </div>

                  {/* Right Block */}
                  <div
                    className={`p-4 rounded-lg border-l-4 ${
                      isExpo ? 'border-l-rose-500' : 'border-l-amber-500'
                    } ${isDarkMode ? 'bg-[#131B2E]' : 'bg-slate-50'}`}
                  >
                    <span
                      className={`block text-xs font-bold uppercase tracking-wider ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {isExpo ? 'WAITING' : 'WORKING'}
                    </span>
                    <span
                      className={`text-4xl font-black font-mono tracking-tight mt-1 block ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {isExpo ? station.newCount + station.workingCount : station.workingCount}
                    </span>
                  </div>
                </div>

                {/* Card Footer: Avg Ticket Time */}
                <div
                  className={`flex items-center justify-between pt-4 border-t ${
                    isDarkMode ? 'border-[#1E293B]' : 'border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock
                      className={`h-4 w-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                    />
                    <span
                      className={`text-sm font-semibold ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      Avg Ticket Time:
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-base font-black font-mono tracking-wider ${
                        isRush
                          ? 'text-[#FF5A5F]'
                          : isDarkMode
                          ? 'text-white'
                          : 'text-slate-900'
                      }`}
                    >
                      {formatTime(station.avgElapsedSec)}
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
