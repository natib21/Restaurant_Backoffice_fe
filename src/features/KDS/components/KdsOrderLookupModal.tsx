// src/features/KDS/components/KdsOrderLookupModal.tsx
import React, { useState } from 'react';
import { Search, X, UtensilsCrossed, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useOrderTicketsQuery } from '@/api/Queries/kitchenQueries';
import { formatOrderItemName } from '@/features/Order/lib/orderUtils';
import type { KdsTicket } from '../types/kdsTypes';

interface KdsOrderLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  isDarkMode?: boolean;
}

export const KdsOrderLookupModal: React.FC<KdsOrderLookupModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
  isDarkMode = true,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const { data: tickets = [], isLoading } = useOrderTicketsQuery(searchQuery);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
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
            <Search className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-black font-mono tracking-wider uppercase">
              Kitchen Order Lookup
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search input bar */}
        <div className={`p-4 border-b ${isDarkMode ? 'border-[#1E293B] bg-[#0B0F19]' : 'border-slate-100 bg-slate-50'}`}>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order # (e.g. ORD-2024-001), Ticket #, or Table (e.g. T-05)..."
              autoFocus
              className={`w-full text-sm rounded-xl pl-10 pr-4 py-2.5 border focus:outline-none ${
                isDarkMode
                  ? 'bg-[#1E293B] border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-500'
              }`}
            />
          </div>
        </div>

        {/* Results List */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Searching kitchen stations...
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <UtensilsCrossed className="h-10 w-10 text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-400">No kitchen tickets found</p>
              <p className="text-xs text-slate-500 mt-1">
                Enter an order number (e.g., ORD-2024-001) or table number (e.g., T-05)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">
                  {tickets.length} Station Ticket{tickets.length > 1 ? 's' : ''} Associated
                </span>
              </div>

              {tickets.map((t) => (
                <div
                  key={t._id}
                  className={`p-4 rounded-xl border ${
                    isDarkMode ? 'bg-[#131B2E] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-black font-mono tracking-wide">
                        {t.ticketNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-[#1E293B] text-amber-400 border border-amber-500/20">
                        {t.stationName} ({t.stationCode})
                      </span>
                      {t.tableNumber && (
                        <span className="text-xs font-bold text-slate-400">{t.tableNumber}</span>
                      )}
                    </div>

                    <span
                      className={`text-xs font-bold font-mono uppercase px-2.5 py-1 rounded border ${
                        t.status === 'ready'
                          ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/50'
                          : t.status === 'in_progress'
                          ? 'bg-amber-950/50 text-amber-400 border-amber-800/50'
                          : t.status === 'accepted'
                          ? 'bg-blue-950/50 text-blue-400 border-blue-800/50'
                          : 'bg-rose-950/50 text-rose-400 border-rose-800/50'
                      }`}
                    >
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="space-y-1.5">
                    {t.items.map((i) => (
                      <div key={i._id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-300">{i.quantity}x</span>
                          <span className={i.completed ? 'line-through text-slate-500' : 'text-slate-200'}>
                            {formatOrderItemName(i.name || i.menuItemName || i)}
                          </span>
                          {i.notes && <span className="text-rose-400 text-[11px]">• {i.notes}</span>}
                        </div>
                        {i.completed && (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                            <CheckCircle2 className="h-3 w-3" /> Done
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-3 border-t flex items-center justify-end ${
            isDarkMode ? 'border-[#1E293B] bg-[#0E1626]' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
