// src/features/KDS/components/KdsEmergencyStopModal.tsx
import React, { useState } from 'react';
import { AlertTriangle, X, ShieldAlert, PauseCircle, PlayCircle } from 'lucide-react';
import { useEmergencyStopMutation } from '@/api/Queries/kitchenQueries';

interface KdsEmergencyStopModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId?: string;
  isDarkMode?: boolean;
}

export const KdsEmergencyStopModal: React.FC<KdsEmergencyStopModalProps> = ({
  isOpen,
  onClose,
  branchId,
  isDarkMode = true,
}) => {
  const [reason, setReason] = useState('Line overflow / Kitchen surge backlog');
  const [isPaused, setIsPaused] = useState(false);
  const emergencyStopMutation = useEmergencyStopMutation();

  if (!isOpen) return null;

  const handleToggleEmergencyStop = (paused: boolean) => {
    emergencyStopMutation.mutate(
      { branchId, paused, reason },
      {
        onSuccess: () => {
          setIsPaused(paused);
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${
          isDarkMode ? 'bg-[#181116] border-[#FF5A5F]/40 text-white' : 'bg-white border-rose-300 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#FF5A5F]/20 bg-[#3B171A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-6 w-6 text-[#FF5A5F]" />
            <h2 className="text-lg font-black font-mono tracking-wider uppercase text-[#FF5A5F]">
              Kitchen Emergency Control
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Activating Emergency Stop immediately halts incoming online and POS orders from routing to kitchen stations, and notifies floor managers and expo staff.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Reason for Kitchen Hold
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#111827] border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-red-500"
            >
              <option value="Line overflow / Kitchen surge backlog">Line overflow / Kitchen surge backlog</option>
              <option value="Equipment failure (Grill / Fryer down)">Equipment failure (Grill / Fryer down)</option>
              <option value="Critical Ingredient Outage">Critical Ingredient Outage</option>
              <option value="Health / Safety inspection pause">Health / Safety inspection pause</option>
              <option value="Shift changeover pause">Shift changeover pause</option>
            </select>
          </div>

          <div className="p-4 rounded-xl bg-[#2B161B] border border-[#FF5A5F]/30 flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-[#FF5A5F] shrink-0" />
            <p className="text-xs text-[#FF8F94]">
              Active tickets currently on stations will remain visible for line cooks to complete.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t border-[#FF5A5F]/20 bg-[#251216] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={() => handleToggleEmergencyStop(!isPaused)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors shadow-md ${
              isPaused
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-[#FF5A5F] hover:bg-[#ff4147] text-white'
            }`}
          >
            {isPaused ? (
              <>
                <PlayCircle className="h-4 w-4" /> Resume Kitchen Orders
              </>
            ) : (
              <>
                <PauseCircle className="h-4 w-4" /> Activate Emergency Stop
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
