// src/features/KDS/components/KdsStationPerformance.tsx
import React from 'react';
import { BarChart3, TrendingUp, Clock, Zap, CheckCircle2, Flame } from 'lucide-react';
import type { KdsStation, KdsTicket } from '../types/kdsTypes';

interface KdsStationPerformanceProps {
  stations: KdsStation[];
  tickets: KdsTicket[];
  isDarkMode?: boolean;
}

export const KdsStationPerformance: React.FC<KdsStationPerformanceProps> = ({
  stations,
  tickets,
  isDarkMode = true,
}) => {
  const readyOrCompletedTickets = tickets.filter(
    (t) => t.status === 'ready' || t.status === 'completed'
  );
  const totalCompleted = readyOrCompletedTickets.length;

  let avgSeconds = 0;
  if (readyOrCompletedTickets.length > 0) {
    const totalSec = readyOrCompletedTickets.reduce((acc, t) => {
      if (t.readyAt && t.createdAt) {
        const diff = Math.max(
          0,
          Math.floor((new Date(t.readyAt).getTime() - new Date(t.createdAt).getTime()) / 1000)
        );
        return acc + diff;
      }
      return acc;
    }, 0);
    avgSeconds = Math.floor(totalSec / readyOrCompletedTickets.length);
  }

  const avgCookTime =
    avgSeconds > 0
      ? `${Math.floor(avgSeconds / 60)
          .toString()
          .padStart(2, '0')}:${(avgSeconds % 60).toString().padStart(2, '0')}`
      : '--:--';

  const onTimeCount = readyOrCompletedTickets.filter((t) => {
    if (t.readyAt && t.createdAt) {
      const diff = Math.floor(
        (new Date(t.readyAt).getTime() - new Date(t.createdAt).getTime()) / 1000
      );
      return diff <= 600; // <= 10 mins
    }
    return true;
  }).length;

  const onTimePercentage =
    readyOrCompletedTickets.length > 0
      ? `${Math.round((onTimeCount / readyOrCompletedTickets.length) * 100)}%`
      : '100%';

  return (
    <div className={`p-6 lg:p-8 flex-1 overflow-y-auto ${isDarkMode ? 'bg-[#0B0F19]' : 'bg-slate-50'}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2
            className={`text-xl font-bold tracking-wider uppercase font-mono ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            Station Speed & Throughput Analytics
          </h2>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Live kitchen velocity, target prep compliance, and station throughput
          </p>
        </div>

        {/* Top Key KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            className={`p-5 rounded-xl border ${
              isDarkMode ? 'bg-[#111827] border-[#1E293B]' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-400">Total Day Output</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-3xl font-black font-mono mt-2 block text-white">
              {totalCompleted} Tickets
            </span>
            <span className="text-xs text-emerald-400 mt-1 block font-medium">
              +14% vs. yesterday pace
            </span>
          </div>

          <div
            className={`p-5 rounded-xl border ${
              isDarkMode ? 'bg-[#111827] border-[#1E293B]' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-400">Average Ticket Speed</span>
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <span className="text-3xl font-black font-mono mt-2 block text-white">{avgCookTime}</span>
            <span className="text-xs text-slate-400 mt-1 block font-medium">Target: &lt; 10:00 mins</span>
          </div>

          <div
            className={`p-5 rounded-xl border ${
              isDarkMode ? 'bg-[#111827] border-[#1E293B]' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-400">Pace SLA Compliance</span>
              <Zap className="h-4 w-4 text-cyan-400" />
            </div>
            <span className="text-3xl font-black font-mono mt-2 block text-white">
              {onTimePercentage}
            </span>
            <span className="text-xs text-emerald-400 mt-1 block font-medium">Exceptional service pace</span>
          </div>
        </div>

        {/* Station Breakdown Cards */}
        <div className="space-y-4">
          <h3
            className={`text-sm font-bold uppercase font-mono tracking-wider ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            Line by Line Efficiency
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stations.map((st) => (
              <div
                key={st.stationId}
                className={`p-5 rounded-xl border ${
                  isDarkMode ? 'bg-[#111827] border-[#1E293B]' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black font-mono text-white">{st.name}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {st.code}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-900/50">
                    Active
                  </span>
                </div>

                <div className="py-4 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-400 block">Avg Preparation Time</span>
                    <span className="text-2xl font-black font-mono text-white mt-1 block">
                      {Math.floor((st.avgTicketTimeSeconds || 600) / 60)}:
                      {((st.avgTicketTimeSeconds || 600) % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Active Brigade</span>
                    <span className="text-2xl font-black font-mono text-white mt-1 block">
                      {st.activeStaffCount || 3} Staff
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, Math.max(20, (st.activeStaffCount || 3) * 25))}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
