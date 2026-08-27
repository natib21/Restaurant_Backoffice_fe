// src/features/KDS/components/KdsStaffShift.tsx
import React from 'react';
import { Users, Clock, CheckCircle2, UserCheck, ShieldCheck } from 'lucide-react';
import { useKitchenStaffQuery } from '@/api/Queries/kitchenQueries';
import type { KdsStaffMember } from '../types/kdsTypes';

interface KdsStaffShiftProps {
  branchId?: string;
  isDarkMode?: boolean;
}

export const KdsStaffShift: React.FC<KdsStaffShiftProps> = ({
  branchId,
  isDarkMode = true,
}) => {
  const { data: staffList = [] } = useKitchenStaffQuery(branchId);

  return (
    <div className={`p-6 lg:p-8 flex-1 overflow-y-auto ${isDarkMode ? 'bg-[#0B0F19]' : 'bg-slate-50'}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2
            className={`text-xl font-bold tracking-wider uppercase font-mono ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            Kitchen Staff & Shift Schedule
          </h2>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Culinary brigade on duty, assigned stations, and shift clock-in metrics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map((member) => (
            <div
              key={member._id}
              className={`p-5 rounded-xl border transition-all ${
                isDarkMode ? 'bg-[#111827] border-[#1E293B]' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-amber-400 text-sm">
                    {member.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{member.name}</h4>
                    <span className="text-xs text-slate-400">{member.role}</span>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    member.clockedIn
                      ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {member.clockedIn ? 'ON DUTY' : 'OFF'}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Station Line:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {member.stationName || 'Floating / Expo'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Shift Started:</span>
                  <span className="font-mono text-slate-200">{member.shiftStart || '10:00 AM'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Tickets Cooked Today:</span>
                  <span className="font-mono font-bold text-white">
                    {member.ticketsHandledToday || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
