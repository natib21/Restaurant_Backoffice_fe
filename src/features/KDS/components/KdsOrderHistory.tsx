// src/features/KDS/components/KdsOrderHistory.tsx
import React, { useState } from 'react';
import { Search, Clock, CheckCircle2, XCircle, Printer } from 'lucide-react';
import type { KdsTicket, KdsStation } from '../types/kdsTypes';
import { toast } from 'sonner';

interface KdsOrderHistoryProps {
  tickets: KdsTicket[];
  stations?: KdsStation[];
  isDarkMode?: boolean;
}

export const KdsOrderHistory: React.FC<KdsOrderHistoryProps> = ({
  tickets,
  stations = [],
  isDarkMode = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStation, setFilterStation] = useState('all');

  const historyTickets = tickets.filter(
    (t) => t.status === 'ready' || t.status === 'completed' || t.status === 'canceled'
  );

  const filteredTickets = historyTickets.filter((t) => {
    const matchesSearch =
      t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.tableNumber && t.tableNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.customerName && t.customerName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStation =
      filterStation === 'all' || t.stationId.toLowerCase() === filterStation.toLowerCase();

    return matchesSearch && matchesStation;
  });

  const handleReprint = (ticketNumber: string) => {
    toast.success(`Reprint dispatched to kitchen ticket printer for ${ticketNumber}`);
  };

  return (
    <div
      className={`p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto scroll-smooth ${
        isDarkMode ? 'bg-[#0B0F19]' : 'bg-slate-50'
      }`}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2
              className={`text-lg sm:text-xl font-bold tracking-wider uppercase font-mono ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Kitchen Ticket History
            </h2>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Completed, dispatched, and voided tickets from current service session
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Dynamic Station Filter */}
            <select
              value={filterStation}
              onChange={(e) => setFilterStation(e.target.value)}
              className={`text-xs font-mono font-bold px-3 py-2 rounded-lg border focus:outline-none ${
                isDarkMode
                  ? 'bg-[#1E293B] border-slate-700 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              <option value="all">All Category Stations</option>
              {stations.map((st) => (
                <option key={st.stationId} value={st.stationId}>
                  {st.name} ({st.code})
                </option>
              ))}
            </select>

            {/* Search */}
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search history..."
                className={`w-full sm:w-52 text-xs rounded-lg pl-9 pr-3 py-2 border focus:outline-none ${
                  isDarkMode
                    ? 'bg-[#1E293B] border-slate-700 text-white placeholder:text-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Tickets Table / Cards */}
        {filteredTickets.length === 0 ? (
          <div
            className={`p-12 rounded-xl border text-center flex flex-col items-center justify-center ${
              isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <Clock className="h-10 w-10 text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-400">No tickets found in history</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket._id}
                className={`p-4 sm:p-5 rounded-xl border transition-all ${
                  isDarkMode
                    ? 'bg-[#111827] border-[#1E293B]'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div
                  className={`flex items-center justify-between pb-3 border-b ${
                    isDarkMode ? 'border-slate-800' : 'border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-base sm:text-lg font-black font-mono tracking-wider ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {ticket.ticketNumber}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        isDarkMode
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {ticket.orderNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {ticket.status === 'canceled' ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-950/40 border border-rose-900/50">
                        <XCircle className="h-3.5 w-3.5" /> CANCELLED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-900/50">
                        <CheckCircle2 className="h-3.5 w-3.5" /> READY
                      </span>
                    )}

                    <button
                      onClick={() => handleReprint(ticket.ticketNumber)}
                      title="Reprint Kitchen Ticket"
                      className={`p-1.5 rounded transition-colors ${
                        isDarkMode
                          ? 'bg-slate-800 text-slate-400 hover:text-white'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-950'
                      }`}
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div
                  className={`py-3 space-y-1.5 text-xs ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  {ticket.items.map((item) => (
                    <div key={item._id} className="flex items-center justify-between">
                      <span>
                        <strong
                          className={`font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                        >
                          {item.quantity}x
                        </strong>{' '}
                        {item.name}
                      </span>
                      {item.notes && (
                        <span className="text-rose-500 font-medium">• {item.notes}</span>
                      )}
                    </div>
                  ))}
                </div>

                <div
                  className={`pt-3 border-t flex items-center justify-between text-[11px] font-mono ${
                    isDarkMode
                      ? 'border-slate-800/80 text-slate-500'
                      : 'border-slate-100 text-slate-400'
                  }`}
                >
                  <span>
                    Station: {ticket.stationName} ({ticket.stationCode})
                  </span>
                  <span>{new Date(ticket.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default KdsOrderHistory;
